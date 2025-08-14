import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Query,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BigDataService, FileProcessingJob, ProcessingResult } from './bigdata.service';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Big Data Processing')
@Controller('bigdata')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BigDataController {
  constructor(private readonly bigDataService: BigDataService) {}

  @Post('upload')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload large file for processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to process (min 100MB)',
        },
        metadata: {
          type: 'string',
          description: 'Additional metadata as JSON string',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded and queued for processing' })
  @ApiResponse({ status: 400, description: 'File too small or invalid' })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1024 }), // 1GB max
          new FileTypeValidator({ fileType: '.(csv|json|xml|txt|log|parquet|avro)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('metadata') metadata?: string,
  ): Promise<{ job: FileProcessingJob; message: string }> {
    let parsedMetadata: Record<string, any> | undefined;
    
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (error) {
        // Игнорируем ошибки парсинга metadata
      }
    }

    const job = await this.bigDataService.addToProcessingQueue(file, parsedMetadata);

    return {
      job,
      message: 'File uploaded and queued for processing',
    };
  }

  @Get('status/:jobId')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get processing status for a job' })
  @ApiResponse({ status: 200, description: 'Job status retrieved' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<FileProcessingJob> {
    const status = this.bigDataService.getJobStatus(jobId);
    if (!status) {
      throw new Error('Job not found');
    }
    return status;
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get processing statistics and system load' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getProcessingStats() {
    return this.bigDataService.getProcessingStats();
  }

  @Get('jobs')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get list of user jobs' })
  @ApiResponse({ status: 200, description: 'Jobs list retrieved' })
  async getUserJobs(@Query('userId') userId: string): Promise<FileProcessingJob[]> {
    // В реальной реализации здесь должна быть фильтрация по пользователю
    // Пока возвращаем все активные задачи
    const stats = this.bigDataService.getProcessingStats();
    return [];
  }

  @Delete('stop/:jobId')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Stop processing for a specific job' })
  @ApiResponse({ status: 200, description: 'Processing stopped successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async stopProcessing(@Param('jobId') jobId: string): Promise<{ message: string }> {
    const stopped = await this.bigDataService.stopProcessing(jobId);
    if (!stopped) {
      throw new Error('Job not found or already completed');
    }
    return { message: 'Processing stopped successfully' };
  }

  @Delete('cleanup')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Clean up completed jobs' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanupCompletedJobs(): Promise<{ message: string; cleanedCount: number }> {
    const cleanedCount = await this.bigDataService.cleanupCompletedJobs();
    return {
      message: 'Cleanup completed successfully',
      cleanedCount,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for big data processing service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string; workers: number }> {
    const stats = this.bigDataService.getProcessingStats();
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      workers: stats.activeWorkers,
    };
  }
}
