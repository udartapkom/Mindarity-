import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Goal } from './goal.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('tasks')
@Index(['goalId', 'status'])
@Index(['priority', 'dueDate'])
@Index(['userId', 'goalId'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  completedDate: Date;

  @Column({ default: 0 })
  estimatedHours: number;

  @Column({ default: 0 })
  actualHours: number;

  @Column({ default: 0 })
  estimatedTime: number; // в минутах

  @Column({ default: 0 })
  actualTime: number; // в минутах

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 0 })
  order: number; // For sorting within goal

  @Column()
  goalId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Goal, (goal) => goal.tasks, { onDelete: 'CASCADE' })
  goal: Goal;

  // Virtual properties
  get isOverdue(): boolean {
    return this.dueDate ? new Date() > this.dueDate : false;
  }

  get isCompleted(): boolean {
    return this.status === TaskStatus.DONE;
  }

  get daysRemaining(): number {
    if (!this.dueDate) return -1;
    const now = new Date();
    const dueDate = new Date(this.dueDate);
    const diffTime = dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get progress(): number {
    switch (this.status) {
      case TaskStatus.TODO:
        return 0;
      case TaskStatus.IN_PROGRESS:
        return 25;
      case TaskStatus.REVIEW:
        return 75;
      case TaskStatus.DONE:
        return 100;
      default:
        return 0;
    }
  }
}
