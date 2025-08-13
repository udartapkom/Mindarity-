import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Goal } from './entities/goal.entity';
import { Task } from './entities/task.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('goals')
@Controller('goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  @ApiResponse({
    status: 201,
    description: 'Goal created successfully',
    type: Goal,
  })
  async createGoal(
    @Body() createGoalDto: CreateGoalDto,
    @Request() req,
  ): Promise<Goal> {
    return this.goalsService.createGoal(createGoalDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all goals for current user' })
  @ApiResponse({
    status: 200,
    description: 'Goals retrieved successfully',
    type: [Goal],
  })
  async findAllGoals(@Request() req): Promise<Goal[]> {
    return this.goalsService.findAllGoals(req.user.id);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get goals statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getGoalsStatistics(@Request() req) {
    return this.goalsService.getGoalsStatistics(req.user.id);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue goals' })
  @ApiResponse({
    status: 200,
    description: 'Overdue goals retrieved successfully',
    type: [Goal],
  })
  async getOverdueGoals(@Request() req): Promise<Goal[]> {
    return this.goalsService.getOverdueGoals(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal by ID' })
  @ApiResponse({
    status: 200,
    description: 'Goal retrieved successfully',
    type: Goal,
  })
  async findGoalById(@Param('id') id: string, @Request() req): Promise<Goal> {
    return this.goalsService.findGoalById(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update goal' })
  @ApiResponse({
    status: 200,
    description: 'Goal updated successfully',
    type: Goal,
  })
  async updateGoal(
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @Request() req,
  ): Promise<Goal> {
    return this.goalsService.updateGoal(id, updateGoalDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete goal' })
  @ApiResponse({ status: 204, description: 'Goal deleted successfully' })
  async deleteGoal(@Param('id') id: string, @Request() req): Promise<void> {
    return this.goalsService.deleteGoal(id, req.user.id);
  }

  // Task endpoints
  @Post(':goalId/tasks')
  @ApiOperation({ summary: 'Create a new task for goal' })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: Task,
  })
  async createTask(
    @Param('goalId') goalId: string,
    @Body() createTaskDto: CreateTaskDto,
    @Request() req,
  ): Promise<Task> {
    return this.goalsService.createTask(createTaskDto, goalId, req.user.id);
  }

  @Get(':goalId/tasks')
  @ApiOperation({ summary: 'Get all tasks for goal' })
  @ApiResponse({
    status: 200,
    description: 'Tasks retrieved successfully',
    type: [Task],
  })
  async findAllTasks(
    @Param('goalId') goalId: string,
    @Request() req,
  ): Promise<Task[]> {
    return this.goalsService.findAllTasks(goalId, req.user.id);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({
    status: 200,
    description: 'Task retrieved successfully',
    type: Task,
  })
  async findTaskById(@Param('id') id: string, @Request() req): Promise<Task> {
    return this.goalsService.findTaskById(id, req.user.id);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({
    status: 200,
    description: 'Task updated successfully',
    type: Task,
  })
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ): Promise<Task> {
    return this.goalsService.updateTask(id, updateTaskDto, req.user.id);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  async deleteTask(@Param('id') id: string, @Request() req): Promise<void> {
    return this.goalsService.deleteTask(id, req.user.id);
  }

  @Post(':goalId/tasks/reorder')
  @ApiOperation({ summary: 'Reorder tasks in goal' })
  @ApiResponse({ status: 200, description: 'Tasks reordered successfully' })
  async reorderTasks(
    @Param('goalId') goalId: string,
    @Body() taskIds: string[],
    @Request() req,
  ): Promise<void> {
    return this.goalsService.reorderTasks(goalId, taskIds, req.user.id);
  }
}
