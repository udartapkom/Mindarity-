import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus, FileType } from './entities/file.entity';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class FilesService {
  private minioClient: Minio.Client;

  constructor(
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    private configService: ConfigService,
  ) {
    // Инициализация MinIO клиента
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get('MINIO_PORT', '9000')),
      useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async create(createFileDto: CreateFileDto): Promise<File> {
    const file = this.filesRepository.create(createFileDto);
    return await this.filesRepository.save(file);
  }

  async findAll(userId?: string): Promise<File[]> {
    if (userId) {
      return await this.filesRepository.find({
        where: { userId },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    }
    return await this.filesRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<File> {
    const file = await this.filesRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  async update(id: string, updateFileDto: UpdateFileDto): Promise<File> {
    const file = await this.findOne(id);
    Object.assign(file, updateFileDto);
    return await this.filesRepository.save(file);
  }

  async remove(id: string): Promise<void> {
    const file = await this.findOne(id);

    // Удаляем файл из MinIO
    try {
      if (file.bucket && file.key) {
        await this.minioClient.removeObject(file.bucket, file.key);
      }
    } catch (error) {
      console.error('Error deleting file from MinIO:', error);
    }

    await this.filesRepository.remove(file);
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    bucket: string = 'default',
  ): Promise<File> {
    try {
      // Проверяем размер файла (100MB максимум)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new BadRequestException(
          'File size exceeds maximum limit of 100MB',
        );
      }

      // Определяем тип файла
      const fileType = this.getFileType(file.mimetype);

      // Генерируем уникальное имя файла
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.originalname}`;

      // Загружаем файл в MinIO
      const key = `${userId}/${fileName}`;
      await this.minioClient.putObject(bucket, key, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });

      // Получаем URL файла
      const url = await this.minioClient.presignedGetObject(
        bucket,
        key,
        24 * 60 * 60,
      ); // 24 часа

      // Создаем запись в базе данных
      const createFileDto: CreateFileDto = {
        originalName: file.originalname,
        fileName: fileName,
        mimeType: file.mimetype,
        size: file.size,
        type: fileType,
        bucket: bucket,
        key: key,
        url: url,
        userId: userId,
      };

      return await this.create(createFileDto);
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async generatePresignedUrl(
    id: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const file = await this.findOne(id);

    if (!file.bucket || !file.key) {
      throw new BadRequestException('File not found in storage');
    }

    try {
      return await this.minioClient.presignedGetObject(
        file.bucket,
        file.key,
        expiresIn,
      );
    } catch (error) {
      throw new BadRequestException('Failed to generate presigned URL');
    }
  }

  private getFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text')
    ) {
      return FileType.DOCUMENT;
    }
    if (
      mimeType.includes('zip') ||
      mimeType.includes('rar') ||
      mimeType.includes('tar')
    ) {
      return FileType.ARCHIVE;
    }
    return FileType.OTHER;
  }

  async getFileStats(userId?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<FileType, number>;
  }> {
    const query = this.filesRepository.createQueryBuilder('file');

    if (userId) {
      query.where('file.userId = :userId', { userId });
    }

    const files = await query.getMany();

    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      byType: {
        [FileType.IMAGE]: 0,
        [FileType.VIDEO]: 0,
        [FileType.AUDIO]: 0,
        [FileType.DOCUMENT]: 0,
        [FileType.ARCHIVE]: 0,
        [FileType.OTHER]: 0,
      },
    };

    files.forEach((file) => {
      stats.byType[file.type]++;
    });

    return stats;
  }
}
