import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Event, EventType, EmotionalReaction } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { SearchEventDto } from './dto/search-event.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto, userId: string): Promise<Event> {
    const event = this.eventsRepository.create({
      ...createEventDto,
      userId,
      eventDate: new Date(createEventDto.eventDate),
    });

    return this.eventsRepository.save(event);
  }

  async findAll(userId: string, isPrivate: boolean = false): Promise<Event[]> {
    const where: any = { userId };

    if (!isPrivate) {
      where.isPrivate = false;
    }

    return this.eventsRepository.find({
      where,
      relations: ['files'],
      order: { eventDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['files', 'user'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user can view this event
    if (event.isPrivate && event.userId !== userId) {
      throw new ForbiddenException('Access denied to private event');
    }

    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    userId: string,
  ): Promise<Event> {
    const event = await this.findOne(id, userId);

    // Only owner can update
    if (event.userId !== userId) {
      throw new ForbiddenException('Only owner can update event');
    }

    Object.assign(event, updateEventDto);
    return this.eventsRepository.save(event);
  }

  async remove(id: string, userId: string): Promise<void> {
    const event = await this.findOne(id, userId);

    // Only owner can delete
    if (event.userId !== userId) {
      throw new ForbiddenException('Only owner can delete event');
    }

    await this.eventsRepository.remove(event);
  }

  async search(
    searchEventDto: SearchEventDto,
    userId: string,
  ): Promise<Event[]> {
    const { query, type, emotionalReaction, startDate, endDate, tags } =
      searchEventDto;

    const where: any = { userId, isPrivate: false };

    if (query) {
      where.title = Like(`%${query}%`);
    }

    if (type) {
      where.type = type;
    }

    if (emotionalReaction) {
      where.emotionalReactions = Like(`%${emotionalReaction}%`);
    }

    if (startDate && endDate) {
      where.eventDate = Between(new Date(startDate), new Date(endDate));
    }

    if (tags && tags.length > 0) {
      where.tags = Like(`%${tags.join(',')}%`);
    }

    return this.eventsRepository.find({
      where,
      relations: ['files'],
      order: { eventDate: 'DESC' },
    });
  }

  async generateTemporaryLink(
    id: string,
    userId: string,
    expiresInHours: number = 24,
  ): Promise<string> {
    const event = await this.findOne(id, userId);

    if (event.userId !== userId) {
      throw new ForbiddenException('Only owner can generate temporary link');
    }

    const temporaryLink = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    await this.eventsRepository.update(id, {
      temporaryLink,
      temporaryLinkExpiresAt: expiresAt,
    });

    return temporaryLink;
  }

  async findByTemporaryLink(temporaryLink: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { temporaryLink },
      relations: ['files'],
    });

    if (!event || event.isTemporaryLinkExpired) {
      throw new NotFoundException('Temporary link is invalid or expired');
    }

    return event;
  }

  async getEmotionalReactionsStats(
    userId: string,
  ): Promise<Record<string, number>> {
    const events = await this.eventsRepository.find({
      where: { userId },
      select: ['emotionalReactions'],
    });

    const stats: Record<string, number> = {};

    events.forEach((event) => {
      event.emotionalReactions?.forEach((reaction) => {
        stats[reaction] = (stats[reaction] || 0) + 1;
      });
    });

    return stats;
  }

  async getEventsCount(userId: string): Promise<number> {
    return this.eventsRepository.count({ where: { userId } });
  }

  async getEventsStatistics(userId: string): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: Array<{ title: string; date: string; type: string }>;
  }> {
    const events = await this.eventsRepository.find({
      where: { userId },
      order: { eventDate: 'DESC' },
      take: 10,
    });

    const totalEvents = await this.getEventsCount(userId);
    
    // Статистика по типам событий
    const eventsByType: Record<string, number> = {};
    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    // Последние события для активности
    const recentEvents = events.slice(0, 5).map(event => ({
      title: event.title,
      date: event.eventDate instanceof Date 
        ? event.eventDate.toISOString().split('T')[0]
        : new Date(event.eventDate).toISOString().split('T')[0],
      type: event.type,
    }));

    return {
      totalEvents,
      eventsByType,
      recentEvents,
    };
  }
}
