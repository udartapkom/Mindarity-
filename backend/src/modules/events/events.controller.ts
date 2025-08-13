import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { SearchEventDto } from './dto/search-event.dto';
import { Event } from './entities/event.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: Event,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createEventDto: CreateEventDto,
    @Request() req,
  ): Promise<Event> {
    return this.eventsService.create({
      ...createEventDto,
      userId: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all events for current user' })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
    type: [Event],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Request() req,
    @Query('private') isPrivate?: string,
  ): Promise<Event[]> {
    const includePrivate = isPrivate === 'true';
    return this.eventsService.findAll(req.user.id, includePrivate);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search events' })
  @ApiResponse({ status: 200, description: 'Search results', type: [Event] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async search(
    @Query() searchEventDto: SearchEventDto,
    @Request() req,
  ): Promise<Event[]> {
    return this.eventsService.search(searchEventDto, req.user.id);
  }

  @Get('stats/emotional-reactions')
  @ApiOperation({ summary: 'Get emotional reactions statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEmotionalReactionsStats(
    @Request() req,
  ): Promise<Record<string, number>> {
    return this.eventsService.getEmotionalReactionsStats(req.user.id);
  }

  @Get('stats/count')
  @ApiOperation({ summary: 'Get total events count' })
  @ApiResponse({ status: 200, description: 'Count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEventsCount(@Request() req): Promise<number> {
    return this.eventsService.getEventsCount(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Event retrieved successfully',
    type: Event,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string, @Request() req): Promise<Event> {
    return this.eventsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    type: Event,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req,
  ): Promise<Event> {
    return this.eventsService.update(id, updateEventDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: 204, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.eventsService.remove(id, req.user.id);
  }

  @Post(':id/temporary-link')
  @ApiOperation({ summary: 'Generate temporary link for event' })
  @ApiResponse({
    status: 200,
    description: 'Temporary link generated successfully',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async generateTemporaryLink(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn: string,
    @Request() req,
  ): Promise<{ temporaryLink: string }> {
    const expiresInHours = expiresIn ? parseInt(expiresIn) : 24;
    const temporaryLink = await this.eventsService.generateTemporaryLink(
      id,
      req.user.id,
      expiresInHours,
    );
    return { temporaryLink };
  }

  @Get('public/temporary/:temporaryLink')
  @ApiOperation({ summary: 'Get event by temporary link (public access)' })
  @ApiResponse({
    status: 200,
    description: 'Event retrieved successfully',
    type: Event,
  })
  @ApiResponse({
    status: 404,
    description: 'Temporary link invalid or expired',
  })
  async findByTemporaryLink(
    @Param('temporaryLink') temporaryLink: string,
  ): Promise<Event> {
    return this.eventsService.findByTemporaryLink(temporaryLink);
  }

  // Admin endpoints
  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all events (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All events retrieved successfully',
    type: [Event],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAllAdmin(): Promise<Event[]> {
    // Implementation for admin to see all events
    return this.eventsRepository.find({
      relations: ['user', 'files'],
      order: { createdAt: 'DESC' },
    });
  }
}
