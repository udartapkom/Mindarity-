import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NestMinioModule } from 'nestjs-minio';
import { BigDataController } from './bigdata.controller';
import { BigDataService } from './bigdata.service';
import { MinioStorageService } from './minio-storage.service';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    NestMinioModule.register({
      endPoint: process.env.MINIO_HOST || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    }),
  ],
  controllers: [BigDataController],
  providers: [BigDataService, MinioStorageService],
  exports: [BigDataService, MinioStorageService],
})
export class BigDataModule {}
