import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create(
      createNotificationDto,
    );
    return await this.notificationsRepository.save(notification);
  }

  async createSystemNotification(
    title: string,
    message: string,
    type: NotificationType,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    metadata?: any,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      title,
      message,
      type,
      priority,
      metadata,
      isSystem: true,
    });

    return await this.notificationsRepository.save(notification);
  }

  async createUserNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    metadata?: any,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      userId,
      title,
      message,
      type,
      priority,
      metadata,
      isSystem: false,
    });

    return await this.notificationsRepository.save(notification);
  }

  async createSecurityNotification(
    title: string,
    message: string,
    metadata: any,
  ): Promise<Notification> {
    return this.createSystemNotification(
      title,
      message,
      NotificationType.SECURITY,
      NotificationPriority.HIGH,
      metadata,
    );
  }

  async createResourceUsageNotification(
    resourceType: 'memory' | 'cpu' | 'disk',
    usagePercent: number,
  ): Promise<Notification> {
    const title = `High ${resourceType.toUpperCase()} Usage`;
    const message = `${resourceType.toUpperCase()} usage is at ${usagePercent}%`;

    return this.createSystemNotification(
      title,
      message,
      NotificationType.SYSTEM,
      usagePercent > 90
        ? NotificationPriority.HIGH
        : NotificationPriority.NORMAL,
      { resourceType, usagePercent },
    );
  }

  async createFailedLoginNotification(
    userId: string,
    ip: string,
    attemptCount: number,
  ): Promise<Notification> {
    const title = 'Multiple Failed Login Attempts';
    const message = `Multiple failed login attempts detected from IP: ${ip}`;

    return this.createUserNotification(
      userId,
      title,
      message,
      NotificationType.SECURITY,
      NotificationPriority.HIGH,
      { ip, attemptCount, timestamp: new Date().toISOString() },
    );
  }

  async createServiceDownNotification(
    serviceName: string,
    error: string,
  ): Promise<Notification> {
    const title = `Service ${serviceName} is Down`;
    const message = `Service ${serviceName} is not responding: ${error}`;

    return this.createSystemNotification(
      title,
      message,
      NotificationType.SYSTEM,
      NotificationPriority.HIGH,
      { serviceName, error, timestamp: new Date().toISOString() },
    );
  }

  async findAll(userId?: string): Promise<Notification[]> {
    if (userId) {
      return await this.notificationsRepository.find({
        where: [{ userId }, { isSystem: true }],
        order: { createdAt: 'DESC' },
      });
    }

    return await this.notificationsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(userId: string): Promise<Notification[]> {
    return await this.notificationsRepository.find({
      where: [
        { userId, isRead: false },
        { isSystem: true, isRead: false },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id);

    // Check if user can read this notification
    if (!notification.isSystem && notification.userId !== userId) {
      throw new Error('Access denied to this notification');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return await this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    // Mark system notifications as read
    await this.notificationsRepository.update(
      { isSystem: true, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.findOne(id);

    // Check if user can delete this notification
    if (!notification.isSystem && notification.userId !== userId) {
      throw new Error('Access denied to this notification');
    }

    await this.notificationsRepository.remove(notification);
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await this.notificationsRepository.delete({
      createdAt: { $lt: cutoffDate } as any,
    });
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
  }> {
    const [total, unread] = await Promise.all([
      this.notificationsRepository.count({
        where: [{ userId }, { isSystem: true }],
      }),
      this.notificationsRepository.count({
        where: [
          { userId, isRead: false },
          { isSystem: true, isRead: false },
        ],
      }),
    ]);

    const notifications = await this.findAll(userId);

    const byType = {
      [NotificationType.SYSTEM]: 0,
      [NotificationType.SECURITY]: 0,
      [NotificationType.USER]: 0,
      [NotificationType.REMINDER]: 0,
    };

    const byPriority = {
      [NotificationPriority.LOW]: 0,
      [NotificationPriority.NORMAL]: 0,
      [NotificationPriority.HIGH]: 0,
      [NotificationPriority.URGENT]: 0,
    };

    notifications.forEach((notification) => {
      byType[notification.type]++;
      byPriority[notification.priority]++;
    });

    return {
      total,
      unread,
      byType,
      byPriority,
    };
  }

  async sendBulkNotifications(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    metadata?: any,
  ): Promise<Notification[]> {
    const notifications = userIds.map((userId) =>
      this.notificationsRepository.create({
        userId,
        title,
        message,
        type,
        priority,
        metadata,
        isSystem: false,
      }),
    );

    return await this.notificationsRepository.save(notifications);
  }
}
