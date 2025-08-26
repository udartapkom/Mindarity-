import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Event } from './event.entity';

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  OTHER = 'other',
}

@Entity('event_files')
@Index(['eventId', 'fileType'])
@Index(['originalName'])
export class EventFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  fileName: string; // Generated unique name

  @Column()
  filePath: string; // Path in storage

  @Column()
  mimeType: string;

  @Column()
  size: number; // Size in bytes

  @Column({
    type: 'enum',
    enum: FileType,
  })
  fileType: FileType;

  @Column({ nullable: true })
  width: number; // For images/videos

  @Column({ nullable: true })
  height: number; // For images/videos

  @Column({ nullable: true })
  duration: number; // For videos/audio in seconds

  @Column({ nullable: true })
  thumbnail: string; // Path to thumbnail

  @Column({ default: false })
  isProcessed: boolean; // Whether file has been processed (resized, compressed, etc.)

  @Column({ default: false })
  isPublic: boolean;

  @Column()
  eventId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Event, (event) => event.files, { onDelete: 'CASCADE' })
  event: Event;

  // Virtual properties
  get sizeInMB(): number {
    return this.size / (1024 * 1024);
  }

  get isImage(): boolean {
    return this.fileType === FileType.IMAGE;
  }

  get isVideo(): boolean {
    return this.fileType === FileType.VIDEO;
  }

  get isAudio(): boolean {
    return this.fileType === FileType.AUDIO;
  }

  get isDocument(): boolean {
    return this.fileType === FileType.DOCUMENT;
  }

  get extension(): string {
    return this.originalName.split('.').pop()?.toLowerCase() || '';
  }
}
