import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

export interface StorageObject {
  name: string;
  size: number;
  lastModified: Date;
}

export interface StorageStats {
  totalSize: number;
  totalFiles: number;
  availableSpace: number;
  usedSpace: number;
  freeSpacePercentage: number;
}

@Injectable()
export class MinioStorageService {
  private readonly logger = new Logger(MinioStorageService.name);
  private readonly bucketName: string;
  private readonly minioClient: Minio.Client;
  private readonly maxFileSize: number = 100 * 1024 * 1024; // 100MB по умолчанию
  private readonly maxStorageUsage: number = 0.9; // 90% от доступного места
  private readonly publicBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'mindarity');
    this.publicBaseUrl = this.configService.get<string>('MINIO_PUBLIC_URL', 'http://minio:9000').replace(/\/$/, '');
    
    // Инициализируем MinIO клиент напрямую
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'minio').replace(/^https?:\/\//, '').replace(/^minio:\/\//, '').split(':')[0],
      port: parseInt(this.configService.get<string>('MINIO_ENDPOINT', 'minio').split(':')[1] || '9000'),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin123'),
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
    });
    
    this.initializeBucket();
  }

  /**
   * Инициализация bucket в MinIO
   */
  private async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, this.configService.get<string>('AWS_REGION', 'us-east-1'));
        this.logger.log(`Bucket ${this.bucketName} created successfully`);
        
        // Устанавливаем политику доступа
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        this.logger.log(`Bucket policy set for ${this.bucketName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize bucket ${this.bucketName}:`, error);
    }
  }

  /**
   * Проверка доступного места на диске
   */
  async checkDiskSpace(): Promise<{ free: number; total: number; used: number }> {
    try {
      // Получаем информацию о диске через MinIO admin API или системные вызовы
      // Для простоты используем фиксированные значения, в продакшене нужно реализовать через MinIO admin API
      const total = 10 * 1024 * 1024 * 1024; // 10GB
      const used = await this.getTotalStorageSize();
      const free = total - used;
      
      return { free, total, used };
    } catch (error) {
      this.logger.error('Failed to check disk space:', error);
      throw new BadRequestException('Failed to check disk space');
    }
  }

  /**
   * Получение общей статистики хранилища
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const files = await this.listFiles();
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const totalFiles = files.length;
      
      const diskSpace = await this.checkDiskSpace();
      const availableSpace = diskSpace.free;
      const usedSpace = diskSpace.used;
      const freeSpacePercentage = (availableSpace / diskSpace.total) * 100;

      return {
        totalSize,
        totalFiles,
        availableSpace,
        usedSpace,
        freeSpacePercentage,
      };
    } catch (error) {
      this.logger.error('Failed to get storage stats:', error);
      throw new BadRequestException('Failed to get storage statistics');
    }
  }

  /**
   * Получение общего размера хранилища
   */
  private async getTotalStorageSize(): Promise<number> {
    try {
      const files = await this.listFiles();
      return files.reduce((sum, file) => sum + file.size, 0);
    } catch (error) {
      this.logger.error('Failed to get total storage size:', error);
      return 0;
    }
  }

  /**
   * Проверка возможности загрузки файла
   */
  async canUploadFile(fileSize: number): Promise<{ canUpload: boolean; reason?: string }> {
    try {
      // Проверяем размер файла
      if (fileSize > this.maxFileSize) {
        return {
          canUpload: false,
          reason: `File size ${this.formatBytes(fileSize)} exceeds maximum allowed size ${this.formatBytes(this.maxFileSize)}`
        };
      }

      // Проверяем доступное место
      const stats = await this.getStorageStats();
      if (fileSize > stats.availableSpace) {
        return {
          canUpload: false,
          reason: `Not enough disk space. Available: ${this.formatBytes(stats.availableSpace)}, Required: ${this.formatBytes(fileSize)}`
        };
      }

      // Проверяем процент использования хранилища
      if (stats.freeSpacePercentage < 10) { // Меньше 10% свободного места
        return {
          canUpload: false,
          reason: `Storage is almost full. Only ${stats.freeSpacePercentage.toFixed(1)}% free space available`
        };
      }

      return { canUpload: true };
    } catch (error) {
      this.logger.error('Failed to check upload possibility:', error);
      return {
        canUpload: false,
        reason: 'Failed to check storage availability'
      };
    }
  }

  /**
   * Форматирование байтов в читаемый вид
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Загрузка файла в MinIO
   */
  async uploadFile(filePath: string, objectName: string): Promise<string> {
    try {
      const fileStats = fs.statSync(filePath);
      
      // Проверяем возможность загрузки
      const uploadCheck = await this.canUploadFile(fileStats.size);
      if (!uploadCheck.canUpload) {
        throw new BadRequestException(uploadCheck.reason);
      }

      const fileStream = fs.createReadStream(filePath);
      
      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        fileStream,
        fileStats.size,
        {
          'Content-Type': this.getContentType(filePath),
        }
      );
      
      this.logger.log(`File ${objectName} uploaded successfully to bucket ${this.bucketName}`);
      
      // Возвращаем URL для доступа к файлу
      return this.getFileUrl(objectName);
    } catch (error) {
      this.logger.error(`Failed to upload file ${objectName}:`, error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Загрузка файла из буфера в MinIO
   */
  async uploadBuffer(buffer: Buffer, objectName: string, contentType?: string): Promise<string> {
    try {
      // Проверяем возможность загрузки
      const uploadCheck = await this.canUploadFile(buffer.length);
      if (!uploadCheck.canUpload) {
        throw new BadRequestException(uploadCheck.reason);
      }

      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      
      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        stream,
        buffer.length,
        {
          'Content-Type': contentType || this.getContentType(objectName),
        }
      );
      
      this.logger.log(`Buffer uploaded successfully as ${objectName} to bucket ${this.bucketName}`);
      
      // Возвращаем URL для доступа к файлу
      return this.getFileUrl(objectName);
    } catch (error) {
      this.logger.error(`Failed to upload buffer as ${objectName}:`, error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Загрузка больших файлов с прогрессом
   */
  async uploadLargeFile(
    filePath: string, 
    objectName: string, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const fileStats = fs.statSync(filePath);
      
      // Проверяем возможность загрузки
      const uploadCheck = await this.canUploadFile(fileStats.size);
      if (!uploadCheck.canUpload) {
        throw new BadRequestException(uploadCheck.reason);
      }

      const fileStream = fs.createReadStream(filePath);
      
      // Создаем поток с отслеживанием прогресса
      let uploadedBytes = 0;
      
      fileStream.on('data', (chunk) => {
        uploadedBytes += chunk.length;
        const progress = (uploadedBytes / fileStats.size) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      });

      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        fileStream,
        fileStats.size,
        {
          'Content-Type': this.getContentType(filePath),
        }
      );
      
      this.logger.log(`Large file ${objectName} uploaded successfully to bucket ${this.bucketName}`);
      
      return this.getFileUrl(objectName);
    } catch (error) {
      this.logger.error(`Failed to upload large file ${objectName}:`, error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Получение URL для доступа к файлу
   */
  async getFileUrl(objectName: string): Promise<string> {
    try {
      // Генерируем presigned URL для доступа к файлу
      const presignedUrl = await this.minioClient.presignedGetObject(this.bucketName, objectName, 24 * 60 * 60); // 24 часа
      
      // Заменяем внутренний MinIO URL на публичный базовый URL
      // Если publicBaseUrl указывает на сам MinIO (http://localhost:9000), оставляем presigned
      // Если это прокси-URL вида https://domain/minio, возвращаем прямую ссылку без подписи
      if (/^https?:\/\/[^/]+(:\d+)?$/.test(this.publicBaseUrl)) {
        // База без префикса — используем presigned с заменой хоста
        const urlObj = new URL(presignedUrl);
        const publicObj = new URL(this.publicBaseUrl);
        urlObj.protocol = publicObj.protocol;
        urlObj.host = publicObj.host;
        return urlObj.toString();
      }
      // Путь-префикс (например, https://domain/minio)
      return `${this.publicBaseUrl}/${this.bucketName}/${objectName}`;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for ${objectName}:`, error);
      throw new BadRequestException(`Failed to generate file URL: ${error.message}`);
    }
  }

  /**
   * Получение прямого URL для аватара (без presigned параметров)
   */
  getAvatarUrl(objectName: string): string {
    try {
      // Возвращаем прямой URL, основанный на MINIO_PUBLIC_URL
      return `${this.publicBaseUrl}/${this.bucketName}/${objectName}`;
    } catch (error) {
      this.logger.error(`Failed to generate avatar URL for ${objectName}:`, error);
      throw new BadRequestException(`Failed to generate avatar URL: ${error.message}`);
    }
  }

  /**
   * Удаление файла из MinIO
   */
  async deleteFile(objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, objectName);
      this.logger.log(`File ${objectName} deleted successfully from ${this.bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${objectName}:`, error);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Получение списка файлов в bucket
   */
  async listFiles(prefix?: string): Promise<StorageObject[]> {
    try {
      const objects: StorageObject[] = [];
      const stream = this.minioClient.listObjects(this.bucketName, prefix, true);
      
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name && obj.size !== undefined && obj.lastModified) {
            objects.push({
              name: obj.name,
              size: obj.size,
              lastModified: obj.lastModified,
            });
          }
        });
        
        stream.on('end', () => resolve(objects));
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Failed to list files in bucket ${this.bucketName}:`, error);
      throw new BadRequestException(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Получение информации о файле
   */
  async getFileInfo(objectName: string): Promise<StorageObject | null> {
    try {
      const stat = await this.minioClient.statObject(this.bucketName, objectName);
      return {
        name: objectName,
        size: stat.size,
        lastModified: stat.lastModified,
      };
    } catch (error) {
      this.logger.error(`Failed to get file info for ${objectName}:`, error);
      return null;
    }
  }

  /**
   * Определение Content-Type по расширению файла
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }
}
