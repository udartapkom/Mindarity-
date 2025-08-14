import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { EventType, EmotionalReaction } from '../entities/event.entity';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(EventType)
  @IsOptional()
  type?: EventType = EventType.EVENT;

  @IsArray()
  @IsEnum(EmotionalReaction, { each: true })
  @IsOptional()
  emotionalReactions?: EmotionalReaction[];

  @IsDateString()
  @IsNotEmpty()
  eventDate: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean = false;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
