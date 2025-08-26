import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Goal } from '../goals/entities/goal.entity';
import { Task } from '../goals/entities/task.entity';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  /**
   * Проверка просроченных целей и задач
   * Запускается каждый день в 9:00
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkOverdueItems() {
    this.logger.log('Checking for overdue goals and tasks...');
    
    try {
      const now = new Date();
      
      // Проверяем просроченные цели
      const overdueGoals = await this.goalRepository.find({
        where: {
          deadline: LessThan(now),
          isCompleted: false,
        },
      });

      // Проверяем просроченные задачи
      const overdueTasks = await this.taskRepository.find({
        where: {
          dueDate: LessThan(now),
          isCompleted: false,
        },
      });

      this.logger.log(`Found ${overdueGoals.length} overdue goals and ${overdueTasks.length} overdue tasks`);
      
      // Здесь можно добавить логику уведомлений пользователей
      // о просроченных целях и задачах
      
    } catch (error) {
      this.logger.error('Error checking overdue items:', error);
    }
  }

  /**
   * Очистка старых завершенных задач
   * Запускается каждое воскресенье в 2:00
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupCompletedTasks() {
    this.logger.log('Cleaning up old completed tasks...');
    
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const deletedCount = await this.taskRepository.delete({
        isCompleted: true,
        updatedAt: LessThan(thirtyDaysAgo),
      });
      
      this.logger.log(`Cleaned up ${deletedCount.affected} old completed tasks`);
      
    } catch (error) {
      this.logger.error('Error cleaning up completed tasks:', error);
    }
  }

  /**
   * Еженедельная статистика
   * Запускается каждый понедельник в 8:00
   */
  @Cron('0 8 * * 1')
  async generateWeeklyStats() {
    this.logger.log('Generating weekly statistics...');
    
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const completedGoals = await this.goalRepository.count({
        where: {
          isCompleted: true,
          updatedAt: LessThan(weekAgo),
        },
      });
      
      const completedTasks = await this.taskRepository.count({
        where: {
          isCompleted: true,
          updatedAt: LessThan(weekAgo),
        },
      });
      
      this.logger.log(`Weekly stats: ${completedGoals} goals and ${completedTasks} tasks completed`);
      
      // Здесь можно добавить логику отправки отчетов пользователям
      
    } catch (error) {
      this.logger.error('Error generating weekly stats:', error);
    }
  }

  /**
   * Проверка здоровья планировщика
   */
  async getHealthStatus() {
    return {
      status: 'healthy',
      lastRun: new Date().toISOString(),
      cronJobs: [
        'checkOverdueItems',
        'cleanupCompletedTasks',
        'generateWeeklyStats',
      ],
    };
  }
}
