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
      userId,
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
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    overdueGoals: number;
    averageProgress: number;
    totalTasks: number;
    completedTasks: number;
    upcomingDeadlines: number;
    goalProgress: Array<{ name: string; progress: number }>;
  }> {
    const goals = await this.findAllGoals(userId);
    const overdueGoals = await this.getOverdueGoals(userId);
    
    // Получаем все задачи пользователя
    const tasks = await this.tasksRepository.find({
      where: { userId },
      relations: ['goal'],
    });

    const totalGoals = goals.length;
    const completedGoals = goals.filter(
      (g) => g.status === GoalStatus.COMPLETED,
    ).length;
    const inProgressGoals = goals.filter(
      (g) => g.status === GoalStatus.IN_PROGRESS,
    ).length;
    const overdueGoalsCount = overdueGoals.length;

    const averageProgress =
      totalGoals > 0
        ? Math.round(
            goals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals,
          )
        : 0;

    // Статистика по задачам
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.status === TaskStatus.DONE,
    ).length;

    // Срочные задачи (срок через 7 дней или меньше)
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const upcomingDeadlines = tasks.filter(
      (t) => 
        t.status === TaskStatus.IN_PROGRESS && 
        t.dueDate && 
        new Date(t.dueDate) <= weekFromNow &&
        new Date(t.dueDate) >= new Date()
    ).length;

    // Прогресс целей для отображения
    const goalProgress = goals
      .filter(g => g.status === GoalStatus.IN_PROGRESS)
      .slice(0, 5)
      .map(goal => ({
        name: goal.title,
        progress: goal.progress
      }));

    return {
      totalGoals,
      completedGoals,
      inProgressGoals,
      overdueGoals: overdueGoalsCount,
      averageProgress,
      totalTasks,
      completedTasks,
      upcomingDeadlines,
      goalProgress,
    };
  }
}
