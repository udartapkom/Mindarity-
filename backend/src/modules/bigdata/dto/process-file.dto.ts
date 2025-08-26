import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject } from 'class-validator';

export class ProcessFileDto {
  @ApiProperty({
    description: 'Additional metadata for file processing',
    example: '{"dataType": "csv", "delimiter": ",", "encoding": "utf-8"}',
    required: false,
  })
  @IsOptional()
  @IsString()
  metadata?: string;

  @ApiProperty({
    description: 'Processing options',
    example: {
      chunkSize: 1000000,
      parallelProcessing: true,
      outputFormat: 'json',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}

export class FileProcessingResponseDto {
  @ApiProperty({
    description: 'Processing job information',
  })
  job: {
    id: string;
    filename: string;
    originalName: string;
    size: number;
    status: string;
    progress: number;
    metadata?: Record<string, any>;
  };

  @ApiProperty({
    description: 'Response message',
    example: 'File uploaded and queued for processing',
  })
  message: string;
}

export class JobStatusDto {
  @ApiProperty({
    description: 'Unique job identifier',
    example: 'job-1234567890-abc123def',
  })
  id: string;

  @ApiProperty({
    description: 'Processed filename',
    example: 'data_2024.csv',
  })
  filename: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'data_2024.csv',
  })
  originalName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 104857600,
  })
  size: number;

  @ApiProperty({
    description: 'Processing status',
    enum: ['pending', 'processing', 'completed', 'failed'],
    example: 'processing',
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({
    description: 'Processing progress percentage',
    example: 45,
  })
  progress: number;

  @ApiProperty({
    description: 'Worker identifier',
    example: 'worker-1234567890-xyz789',
    required: false,
  })
  workerId?: string;

  @ApiProperty({
    description: 'Processing start time',
    example: '2024-01-15T10:30:00.000Z',
    required: false,
  })
  startedAt?: Date;

  @ApiProperty({
    description: 'Processing completion time',
    example: '2024-01-15T10:35:00.000Z',
    required: false,
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Error message if processing failed',
    example: 'File format not supported',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  metadata?: Record<string, any>;
}

export class ProcessingStatsDto {
  @ApiProperty({
    description: 'Maximum number of concurrent workers',
    example: 3,
  })
  maxWorkers: number;

  @ApiProperty({
    description: 'Currently active workers',
    example: 2,
  })
  activeWorkers: number;

  @ApiProperty({
    description: 'Jobs waiting in queue',
    example: 5,
  })
  queuedJobs: number;

  @ApiProperty({
    description: 'Completed jobs count',
    example: 25,
  })
  completedJobs: number;

  @ApiProperty({
    description: 'Current system load',
  })
  systemLoad: {
    cpu: number;
    memory: number;
    loadAverage: number;
  };
}
