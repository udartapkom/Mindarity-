import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestMinioService } from 'nestjs-minio';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

export interface StorageObject {
  name: string;
  size: number;
  lastModified: Date;
  etag: string;
  metadata?: Record<string, string>;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

@Injectable()
export class MinioStorageService {
  private readonly logger = new Logger(MinioStorageService.name);
  private readonly bucketName: string;
  private readonly minioService: NestMinioService;

  constructor(
    private readonly configService: ConfigService,
    private readonly nestMinioService: NestMinioService,
  ) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'mindarity');
    this.minioService = this.nestMinioService;
    this.initializeBucket();
  }

  /**
   * Инициализация bucket в MinIO
   */
  private async initializeBucket(): Promise<void> {
    try {
      const minioClient = this.minioService.getMinio();
      const bucketExists = await minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await minioClient.makeBucket(this.bucketName, 'us-east-1');
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
        
        await minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        this.logger.log(`Bucket policy set for ${this.bucketName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize bucket ${this.bucketName}:`, error);
      throw error;
    }
  }

  /**
   * Загрузка файла в MinIO
   */
  async uploadFile(
    filePath: string,
    objectName: string,
    options: UploadOptions = {},
  ): Promise<string> {
    try {
      const minioClient = this.minioService.getMinio();
      const fileStream = fs.createReadStream(filePath);
      const fileStats = fs.statSync(filePath);
      
      const uploadOptions = {
        'Content-Type': options.contentType || 'application/octet-stream',
        'x-amz-meta-original-name': path.basename(filePath),
        'x-amz-meta-upload-date': new Date().toISOString(),
        ...options.metadata,
      };

      await minioClient.putObject(
        this.bucketName,
        objectName,
        fileStream,
        fileStats.size,
        uploadOptions,
      );

      this.logger.log(`File ${objectName} uploaded successfully to ${this.bucketName}`);
      return objectName;
    } catch (error) {
      this.logger.error(`Failed to upload file ${objectName}:`, error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Загрузка файла из MinIO
   */
  async downloadFile(objectName: string, destinationPath: string): Promise<void> {
    try {
      const minioClient = this.minioService.getMinio();
      const fileStream = await minioClient.getObject(this.bucketName, objectName);
      const writeStream = fs.createWriteStream(destinationPath);
      
      return new Promise((resolve, reject) => {
        fileStream.pipe(writeStream);
        writeStream.on('finish', () => {
          this.logger.log(`File ${objectName} downloaded to ${destinationPath}`);
          resolve();
        });
        writeStream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Failed to download file ${objectName}:`, error);
      throw new BadRequestException(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Получение потока для чтения файла
   */
  async getFileStream(objectName: string): Promise<Readable> {
    try {
      const minioClient = this.minioService.getMinio();
      return await minioClient.getObject(this.bucketName, objectName);
    } catch (error) {
      this.logger.error(`Failed to get file stream for ${objectName}:`, error);
      throw new BadRequestException(`Failed to get file stream: ${error.message}`);
    }
  }

  /**
   * Получение метаданных файла
   */
  async getFileMetadata(objectName: string): Promise<StorageObject> {
    try {
      const minioClient = this.minioService.getMinio();
      const stat = await minioClient.statObject(this.bucketName, objectName);
      
      return {
        name: objectName,
        size: (stat.size as number) || 0,
        lastModified: (stat.lastModified as Date) || new Date(),
        etag: (stat.etag as string) || '',
        metadata: stat.metaData,
      };
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${objectName}:`, error);
      throw new BadRequestException(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Список файлов в bucket
   */
  async listFiles(prefix?: string, recursive = true): Promise<StorageObject[]> {
    try {
      const minioClient = this.minioService.getMinio();
      const objects: StorageObject[] = [];
      const stream = minioClient.listObjects(this.bucketName, prefix, recursive);
      
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          // Проверяем, что все обязательные поля существуют
          if (obj.name && obj.size !== undefined && obj.lastModified && obj.etag) {
            objects.push({
              name: obj.name,
              size: obj.size,
              lastModified: obj.lastModified,
              etag: obj.etag,
            });
          }
        });
        
        stream.on('end', () => {
          resolve(objects);
        });
        
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Failed to list files:`, error);
      throw new BadRequestException(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Удаление файла из MinIO
   */
  async deleteFile(objectName: string): Promise<void> {
    try {
      const minioClient = this.minioService.getMinio();
      await minioClient.removeObject(this.bucketName, objectName);
      this.logger.log(`File ${objectName} deleted successfully from ${this.bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${objectName}:`, error);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Копирование файла внутри bucket
   */
  async copyFile(sourceObject: string, destinationObject: string): Promise<void> {
    try {
      const minioClient = this.minioService.getMinio();
      await minioClient.copyObject(
        this.bucketName,
        destinationObject,
        `${this.bucketName}/${sourceObject}`,
      );
      this.logger.log(`File ${sourceObject} copied to ${destinationObject}`);
    } catch (error) {
      this.logger.error(`Failed to copy file ${sourceObject}:`, error);
      throw new BadRequestException(`Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Получение URL для доступа к файлу
   */
  async getFileUrl(objectName: string, expiresIn = 3600): Promise<string> {
    try {
      const minioClient = this.minioService.getMinio();
      return await minioClient.presignedGetObject(this.bucketName, objectName, expiresIn);
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for ${objectName}:`, error);
      throw new BadRequestException(`Failed to generate file URL: ${error.message}`);
    }
  }

  /**
   * Получение URL для загрузки файла
   */
  async getUploadUrl(objectName: string, expiresIn = 3600): Promise<string> {
    try {
      const minioClient = this.minioService.getMinio();
      return await minioClient.presignedPutObject(this.bucketName, objectName, expiresIn);
    } catch (error) {
      this.logger.error(`Failed to generate upload URL for ${objectName}:`, error);
      throw new BadRequestException(`Failed to generate upload URL: ${error.message}`);
    }
  }

  /**
   * Проверка существования файла
   */
  async fileExists(objectName: string): Promise<boolean> {
    try {
      const minioClient = this.minioService.getMinio();
      await minioClient.statObject(this.bucketName, objectName);
      return true;
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Получение размера bucket
   */
  async getBucketSize(): Promise<number> {
    try {
      const objects = await this.listFiles();
      return objects.reduce((total, obj) => total + obj.size, 0);
    } catch (error) {
      this.logger.error('Failed to get bucket size:', error);
      return 0;
    }
  }

  /**
   * Очистка старых файлов
   */
  async cleanupOldFiles(olderThanDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const objects = await this.listFiles();
      const oldObjects = objects.filter(obj => obj.lastModified < cutoffDate);
      
      for (const obj of oldObjects) {
        await this.deleteFile(obj.name);
      }
      
      this.logger.log(`Cleaned up ${oldObjects.length} old files`);
      return oldObjects.length;
    } catch (error) {
      this.logger.error('Failed to cleanup old files:', error);
      throw new BadRequestException(`Failed to cleanup old files: ${error.message}`);
    }
  }
}
