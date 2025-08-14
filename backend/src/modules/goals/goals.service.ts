import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Goal, GoalStatus, GoalPriority } from './entities/goal.entity';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private goalsRepository: Repository<Goal>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  // Goal methods
  async createGoal(
    createGoalDto: CreateGoalDto,
    userId: string,
  ): Promise<Goal> {
    const goal = this.goalsRepository.create({
      ...createGoalDto,
      userId,
    });

    return this.goalsRepository.save(goal);
  }

  async findAllGoals(userId: string): Promise<Goal[]> {
    return this.goalsRepository.find({
      where: { userId },
      relations: ['tasks'],
      order: { priority: 'DESC', deadline: 'ASC', createdAt: 'DESC' },
    });
  }

  async findGoalById(id: string, userId: string): Promise<Goal> {
    const goal = await this.goalsRepository.findOne({
      where: { id },
      relations: ['tasks'],
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('Access denied to this goal');
    }

    return goal;
  }

  async updateGoal(
    id: string,
    updateGoalDto: UpdateGoalDto,
    userId: string,
  ): Promise<Goal> {
    const goal = await this.findGoalById(id, userId);

    Object.assign(goal, updateGoalDto);
    return this.goalsRepository.save(goal);
  }

  async deleteGoal(id: string, userId: string): Promise<void> {
    const goal = await this.findGoalById(id, userId);
    await this.goalsRepository.remove(goal);
  }

  async updateGoalProgress(id: string, userId: string): Promise<Goal> {
    const goal = await this.findGoalById(id, userId);

    const tasks = await this.tasksRepository.find({
      where: { goalId: id },
    });

    if (tasks.length === 0) {
      goal.progress = 0;
    } else {
      const completedTasks = tasks.filter(
        (task) => task.status === TaskStatus.DONE,
      );
      goal.progress = Math.round((completedTasks.length / tasks.length) * 100);

      if (goal.progress === 100 && goal.status !== GoalStatus.COMPLETED) {
        goal.status = GoalStatus.COMPLETED;
        goal.completedDate = new Date();
      }
    }

    return this.goalsRepository.save(goal);
  }

  async getGoalsByStatus(userId: string, status: GoalStatus): Promise<Goal[]> {
    return this.goalsRepository.find({
      where: { userId, status },
      relations: ['tasks'],
      order: { priority: 'DESC', deadline: 'ASC' },
    });
  }

  async getOverdueGoals(userId: string): Promise<Goal[]> {
    const today = new Date();
    return this.goalsRepository.find({
      where: {
        userId,
        deadline: LessThanOrEqual(today),
        status: GoalStatus.IN_PROGRESS,
      },
      relations: ['tasks'],
      order: { deadline: 'ASC' },
    });
  }

  async getGoalsByPriority(
    userId: string,
    priority: GoalPriority,
  ): Promise<Goal[]> {
    return this.goalsRepository.find({
      where: { userId, priority },
      relations: ['tasks'],
      order: { deadline: 'ASC', createdAt: 'DESC' },
    });
  }

  // Task methods
  async createTask(
    createTaskDto: CreateTaskDto,
    goalId: string,
    userId: string,
  ): Promise<Task> {
    // Verify goal belongs to user
    await this.findGoalById(goalId, userId);

    const task = this.tasksRepository.create({
      ...createTaskDto,
      goalId,
    });

    return this.tasksRepository.save(task);
  }

  async findAllTasks(goalId: string, userId: string): Promise<Task[]> {
    // Verify goal belongs to user
    await this.findGoalById(goalId, userId);

    return this.tasksRepository.find({
      where: { goalId },
      order: { order: 'ASC', priority: 'DESC', dueDate: 'ASC' },
    });
  }

  async findTaskById(id: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['goal'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.goal.userId !== userId) {
      throw new ForbiddenException('Access denied to this task');
    }

    return task;
  }

  async updateTask(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    const task = await this.findTaskById(id, userId);

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.tasksRepository.save(task);

    // Update goal progress
    await this.updateGoalProgress(task.goalId, userId);

    return updatedTask;
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    const task = await this.findTaskById(id, userId);
    const goalId = task.goalId;

    await this.tasksRepository.remove(task);

    // Update goal progress
    await this.updateGoalProgress(goalId, userId);
  }

  async reorderTasks(
    goalId: string,
    taskIds: string[],
    userId: string,
  ): Promise<void> {
    // Verify goal belongs to user
    await this.findGoalById(goalId, userId);

    for (let i = 0; i < taskIds.length; i++) {
      await this.tasksRepository.update(taskIds[i], { order: i });
    }
  }

  async getTasksByStatus(
    goalId: string,
    status: TaskStatus,
    userId: string,
  ): Promise<Task[]> {
    // Verify goal belongs to user
    await this.findGoalById(goalId, userId);

    return this.tasksRepository.find({
      where: { goalId, status },
      order: { order: 'ASC', priority: 'DESC' },
    });
  }

  async getOverdueTasks(userId: string): Promise<Task[]> {
    const today = new Date();
    return this.tasksRepository.find({
      where: {
        dueDate: LessThanOrEqual(today),
        status: TaskStatus.IN_PROGRESS,
      },
      relations: ['goal'],
      order: { dueDate: 'ASC' },
    });
  }

  // Statistics
  async getGoalsStatistics(userId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    averageProgress: number;
  }> {
    const goals = await this.findAllGoals(userId);
    const overdueGoals = await this.getOverdueGoals(userId);

    const total = goals.length;
    const completed = goals.filter(
      (g) => g.status === GoalStatus.COMPLETED,
    ).length;
    const inProgress = goals.filter(
      (g) => g.status === GoalStatus.IN_PROGRESS,
    ).length;
    const overdue = overdueGoals.length;

    const averageProgress =
      total > 0
        ? Math.round(
            goals.reduce((sum, goal) => sum + goal.progress, 0) / total,
          )
        : 0;

    return {
      total,
      completed,
      inProgress,
      overdue,
      averageProgress,
    };
  }
}
