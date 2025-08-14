import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EventFile } from './event-file.entity';

export enum EventType {
  EVENT = 'event',
  THOUGHT = 'thought',
  MEMORY = 'memory',
  IDEA = 'idea',
}

export enum EmotionalReaction {
  HAPPY = '😁',
  SAD = '😢',
  EXCITED = '🤩',
  CALM = '😌',
  ANGRY = '😠',
  SURPRISED = '😲',
  LOVED = '🥰',
  CONFUSED = '😕',
  PROUD = '😎',
  GRATEFUL = '🙏',
  FIRE = '🔥',
  THUMBS_UP = '👍',
}

@Entity('events')
@Index(['userId', 'createdAt'])
@Index(['type', 'createdAt'])
@Index(['emotionalReactions'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: EventType,
    default: EventType.EVENT,
  })
  type: EventType;

  @Column('simple-array', { nullable: true })
  emotionalReactions: EmotionalReaction[];

  @Column({ type: 'date' })
  eventDate: Date;

  @Column({ default: false })
  isPrivate: boolean;

  @Column({ nullable: true })
  location: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ nullable: true })
  temporaryLink: string;

  @Column({ type: 'timestamp', nullable: true })
  temporaryLinkExpiresAt: Date;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.events)
  user: User;

  @OneToMany(() => EventFile, (file) => file.event)
  files: EventFile[];

  // Virtual properties
  get isTemporaryLinkExpired(): boolean {
    return this.temporaryLinkExpiresAt
      ? new Date() > this.temporaryLinkExpiresAt
      : true;
  }

  get canBeViewed(): boolean {
    return (
      !this.isPrivate || (!!this.temporaryLink && !this.isTemporaryLinkExpired)
    );
  }
}
