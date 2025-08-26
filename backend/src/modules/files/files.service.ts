import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus, FileType } from './entities/file.entity';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { MinioStorageService } from '../bigdata/minio-storage.service';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly filesRepository: Repository<File>,
    private readonly minioStorageService: MinioStorageService,
  ) {}

  async create(createFileDto: CreateFileDto, userId: string): Promise<File> {
    const file = this.filesRepository.create({
      ...createFileDto,
      userId,
    });
    return this.filesRepository.save(file);
  }

  async findAll(userId: string): Promise<File[]> {
    return this.filesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<File> {
    const file = await this.filesRepository.findOne({
      where: { id, userId },
    });
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    return file;
  }

  async update(id: string, updateFileDto: UpdateFileDto, userId: string): Promise<File> {
    const file = await this.findOne(id, userId);
    Object.assign(file, updateFileDto);
    return this.filesRepository.save(file);
  }

  async remove(id: string, userId: string): Promise<void> {
    const file = await this.findOne(id, userId);
    
    // Удаляем файл из MinIO
    if (file.key) {
      try {
        await this.minioStorageService.deleteFile(file.key);
      } catch (error) {
        console.error('Failed to delete file from MinIO:', error);
      }
    }
    
    await this.filesRepository.remove(file);
  }

  async getStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
  }> {
    const files = await this.findAll(userId);
    
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    
    const filesByType: Record<string, number> = {};
    files.forEach(file => {
      const extension = path.extname(file.originalName).toLowerCase();
      filesByType[extension] = (filesByType[extension] || 0) + 1;
    });

    return {
      totalFiles,
      totalSize,
      filesByType,
    };
  }

  /**
   * Загрузка аватара пользователя
   */
  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ avatarUrl: string; storagePath: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    // Проверяем размер файла (максимум 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 5MB.');
    }

    try {
      // Генерируем уникальное имя файла
      const fileExtension = path.extname(file.originalname);
      const fileName = `avatars/${userId}/${crypto.randomUUID()}${fileExtension}`;
      
      // Загружаем файл в MinIO
      await this.minioStorageService.uploadBuffer(
        file.buffer,
        fileName,
        file.mimetype
      );

      // Получаем прямой URL для аватара (без presigned параметров)
      const avatarUrl = this.minioStorageService.getAvatarUrl(fileName);

      const storagePath = fileName;

      // Удаляем временный файл
      try {
        const fs = require('fs');
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error('Failed to delete temporary file:', error);
      }

      return {
        avatarUrl,
        storagePath: fileName,
      };
    } catch (error) {
      // Удаляем временный файл в случае ошибки
      try {
        const fs = require('fs');
        fs.unlinkSync(file.path);
      } catch (deleteError) {
        console.error('Failed to delete temporary file after error:', deleteError);
      }
      
      throw new BadRequestException(`Failed to upload avatar: ${error.message}`);
    }
  }

  /**
   * Загрузка большого файла с контролем ресурсов
   */
  async uploadLargeFile(
    file: Express.Multer.File,
    userId: string,
    onProgress?: (progress: number) => void,
  ): Promise<File> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Проверяем возможность загрузки
    const uploadCheck = await this.minioStorageService.canUploadFile(file.size);
    if (!uploadCheck.canUpload) {
      throw new BadRequestException(uploadCheck.reason);
    }

    try {
      // Определяем тип файла
      const fileType = this.getFileType(file.mimetype);
      
      // Генерируем уникальное имя файла
      const fileExtension = path.extname(file.originalname);
      const fileName = `files/${userId}/${crypto.randomUUID()}${fileExtension}`;
      
      // Создаем запись в базе данных
      const fileRecord = this.filesRepository.create({
        originalName: file.originalname,
        fileName: fileName,
        mimeType: file.mimetype,
        size: file.size,
        type: fileType,
        status: FileStatus.UPLOADING,
        bucket: this.minioStorageService['bucketName'],
        key: fileName,
        userId,
      });

      const savedFile = await this.filesRepository.save(fileRecord);

      // Загружаем файл в MinIO
      let fileUrl: string;
      if (file.size > 10 * 1024 * 1024) { // Если файл больше 10MB, используем потоковую загрузку
        // Сохраняем временный файл
        const tempPath = `/tmp/${crypto.randomUUID()}${fileExtension}`;
        require('fs').writeFileSync(tempPath, file.buffer);
        
        fileUrl = await this.minioStorageService.uploadLargeFile(
          tempPath,
          fileName,
          onProgress
        );
        
        // Удаляем временный файл
        require('fs').unlinkSync(tempPath);
      } else {
        fileUrl = await this.minioStorageService.uploadBuffer(
          file.buffer,
          fileName,
          file.mimetype
        );
      }

      // Обновляем запись в базе данных
      savedFile.url = fileUrl;
      savedFile.status = FileStatus.READY;
      
      return await this.filesRepository.save(savedFile);
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Определение типа файла по MIME-типу
   */
  private getFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text')) return FileType.DOCUMENT;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return FileType.ARCHIVE;
    return FileType.OTHER;
  }

  /**
   * Получение статистики хранилища
   */
  async getStorageStats(userId: string): Promise<{
    userStats: {
      totalFiles: number;
      totalSize: number;
      filesByType: Record<string, number>;
    };
    systemStats: any;
  }> {
    const userStats = await this.getStats(userId);
    const systemStats = await this.minioStorageService.getStorageStats();
    
    return {
      userStats,
      systemStats,
    };
  }
}
