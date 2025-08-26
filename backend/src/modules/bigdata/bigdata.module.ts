import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BigDataController } from './bigdata.controller';
import { BigDataService } from './bigdata.service';
import { MinioStorageService } from './minio-storage.service';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [BigDataController],
  providers: [BigDataService, MinioStorageService],
  exports: [BigDataService, MinioStorageService],
})
export class BigDataModule {}
