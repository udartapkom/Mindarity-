import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Убираем неиспользуемый импорт
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface FileProcessingJob {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  workerId?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ProcessingResult {
  success: boolean;
  message: string;
  metadata?: Record<string, any>;
  outputFiles?: string[];
}

@Injectable()
export class BigDataService {
  private readonly logger = new Logger(BigDataService.name);
  private readonly maxWorkers: number;
  private readonly activeWorkers = new Map<string, FileProcessingJob>();
  private readonly jobQueue: FileProcessingJob[] = [];
  private readonly processingResults = new Map<string, ProcessingResult>();

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.maxWorkers = this.configService.get<number>('BIGDATA_MAX_WORKERS', 3);
    this.logger.log(`BigData service initialized with max workers: ${this.maxWorkers}`);
  }

  /**
   * Добавляет файл в очередь обработки
   */
  async addToProcessingQueue(
    file: Express.Multer.File,
    metadata?: Record<string, any>,
  ): Promise<FileProcessingJob> {
    if (file.size < 100 * 1024 * 1024) { // 100MB
      throw new BadRequestException('File must be at least 100MB for big data processing');
    }

    const job: FileProcessingJob = {
      id: this.generateJobId(),
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      status: 'pending',
      progress: 0,
      metadata,
    };

    this.jobQueue.push(job);
    this.logger.log(`Job ${job.id} added to queue for file: ${file.originalname}`);

    // Попытаться запустить обработку
    this.processNextJob();

    return job;
  }

  /**
   * Получает статус обработки файла
   */
  getJobStatus(jobId: string): FileProcessingJob | null {
    // Проверяем активные workers
    for (const [workerId, job] of this.activeWorkers) {
      if (job.id === jobId) {
        return job;
      }
    }

    // Проверяем очередь
    const queuedJob = this.jobQueue.find(job => job.id === jobId);
    if (queuedJob) {
      return queuedJob;
    }

    // Проверяем завершенные
    const completedJob = this.processingResults.get(jobId);
    if (completedJob) {
      return {
        id: jobId,
        filename: '',
        originalName: '',
        size: 0,
        status: completedJob.success ? 'completed' : 'failed',
        progress: 100,
        completedAt: new Date(),
        error: completedJob.success ? undefined : completedJob.message,
        metadata: completedJob.metadata,
      };
    }

    return null;
  }

  /**
   * Получает статистику обработки
   */
  getProcessingStats() {
    return {
      maxWorkers: this.maxWorkers,
      activeWorkers: this.activeWorkers.size,
      queuedJobs: this.jobQueue.length,
      completedJobs: this.processingResults.size,
      systemLoad: this.getSystemLoad(),
    };
  }

  /**
   * Останавливает обработку файла
   */
  async stopProcessing(jobId: string): Promise<boolean> {
    // Проверяем активные workers
    for (const [workerId, job] of this.activeWorkers) {
      if (job.id === jobId) {
        // Останавливаем worker
        this.stopWorker(workerId);
        return true;
      }
    }

    // Убираем из очереди
    const queueIndex = this.jobQueue.findIndex(job => job.id === jobId);
    if (queueIndex !== -1) {
      this.jobQueue.splice(queueIndex, 1);
      this.logger.log(`Job ${jobId} removed from queue`);
      return true;
    }

    return false;
  }

  /**
   * Очищает завершенные задачи
   */
  async cleanupCompletedJobs(): Promise<number> {
    const beforeCount = this.processingResults.size;
    this.processingResults.clear();
    this.logger.log(`Cleaned up ${beforeCount} completed jobs`);
    return beforeCount;
  }

  /**
   * Обрабатывает следующий файл в очереди
   */
  private async processNextJob(): Promise<void> {
    if (this.activeWorkers.size >= this.maxWorkers || this.jobQueue.length === 0) {
      return;
    }

    const job = this.jobQueue.shift();
    if (!job) return;

    const workerId = this.startWorker(job);
    this.logger.log(`Started worker ${workerId} for job ${job.id}`);
  }

  /**
   * Запускает worker для обработки файла
   */
  private startWorker(job: FileProcessingJob): string {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    job.status = 'processing';
    job.workerId = workerId;
    job.startedAt = new Date();
    
    this.activeWorkers.set(workerId, job);

    // Имитируем обработку файла
    this.processFileAsync(workerId, job);

    return workerId;
  }

  /**
   * Асинхронная обработка файла
   */
  private async processFileAsync(workerId: string, job: FileProcessingJob): Promise<void> {
    try {
      this.logger.log(`Processing file ${job.filename} with worker ${workerId}`);

      // Имитируем прогресс обработки
      for (let progress = 0; progress <= 100; progress += 10) {
        if (job.status !== 'processing') break;
        
        job.progress = progress;
        await this.delay(1000); // 1 секунда на каждые 10%
      }

      // Завершаем обработку
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();

      const result: ProcessingResult = {
        success: true,
        message: 'File processed successfully',
        metadata: job.metadata,
        outputFiles: [`processed_${job.filename}`],
      };

      this.processingResults.set(job.id, result);
      this.activeWorkers.delete(workerId);

      this.logger.log(`Worker ${workerId} completed job ${job.id}`);
      this.eventEmitter.emit('bigdata.job.completed', { jobId: job.id, result });

      // Обрабатываем следующий файл
      this.processNextJob();

    } catch (error) {
      this.logger.error(`Worker ${workerId} failed for job ${job.id}:`, error);
      
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();

      const result: ProcessingResult = {
        success: false,
        message: error.message,
        metadata: job.metadata,
      };

      this.processingResults.set(job.id, result);
      this.activeWorkers.delete(workerId);

      this.eventEmitter.emit('bigdata.job.failed', { jobId: job.id, error: error.message });

      // Обрабатываем следующий файл
      this.processNextJob();
    }
  }

  /**
   * Останавливает worker
   */
  private stopWorker(workerId: string): void {
    const job = this.activeWorkers.get(workerId);
    if (job) {
      job.status = 'failed';
      job.error = 'Processing stopped by user';
      job.completedAt = new Date();

      const result: ProcessingResult = {
        success: false,
        message: 'Processing stopped by user',
        metadata: job.metadata,
      };

      this.processingResults.set(job.id, result);
      this.activeWorkers.delete(workerId);

      this.logger.log(`Worker ${workerId} stopped for job ${job.id}`);
      this.eventEmitter.emit('bigdata.job.stopped', { jobId: job.id });

      // Обрабатываем следующий файл
      this.processNextJob();
    }
  }

  /**
   * Получает системную нагрузку
   */
  private getSystemLoad(): Record<string, number> {
    const cpus = os.cpus();
    const totalCPU = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return {
        total: acc.total + total,
        idle: acc.idle + idle,
      };
    }, { total: 0, idle: 0 });

    const cpuUsage = ((totalCPU.total - totalCPU.idle) / totalCPU.total) * 100;
    const memoryUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;

    return {
      cpu: Math.round(cpuUsage * 100) / 100,
      memory: Math.round(memoryUsage * 100) / 100,
      loadAverage: os.loadavg()[0],
    };
  }

  /**
   * Генерирует уникальный ID для задачи
   */
  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Задержка для имитации обработки
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
