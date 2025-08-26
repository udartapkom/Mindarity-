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

@Injectable()
export class MinioStorageService {
  private readonly logger = new Logger(MinioStorageService.name);
  private readonly bucketName: string;
  private readonly minioClient: Minio.Client;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'mindarity');
    
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

  private async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, this.configService.get<string>('AWS_REGION', 'us-east-1'));
        this.logger.log(`Bucket ${this.bucketName} created successfully`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize bucket ${this.bucketName}:`, error);
    }
  }

  async uploadFile(filePath: string, objectName: string): Promise<string> {
    try {
      const fileStream = fs.createReadStream(filePath);
      const fileStats = fs.statSync(filePath);
      
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
      return this.getFileUrl(objectName);
    } catch (error) {
      this.logger.error(`Failed to upload file ${objectName}:`, error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadBuffer(buffer: Buffer, objectName: string, contentType?: string): Promise<string> {
    try {
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
      return this.getFileUrl(objectName);
    } catch (error) {
      this.logger.error(`Failed to upload buffer as ${objectName}:`, error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async getFileUrl(objectName: string): Promise<string> {
    try {
      const presignedUrl = await this.minioClient.presignedGetObject(this.bucketName, objectName, 24 * 60 * 60);
      return presignedUrl.replace('http://minio:9000', 'https://mindarity.ru/minio');
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for ${objectName}:`, error);
      throw new BadRequestException(`Failed to generate file URL: ${error.message}`);
    }
  }

  async deleteFile(objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, objectName);
      this.logger.log(`File ${objectName} deleted successfully from ${this.bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${objectName}:`, error);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.json': 'application/json',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }
}
