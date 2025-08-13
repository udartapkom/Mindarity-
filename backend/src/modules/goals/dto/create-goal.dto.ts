import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { GoalStatus, GoalPriority } from '../entities/goal.entity';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus = GoalStatus.NOT_STARTED;

  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority = GoalPriority.MEDIUM;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number = 0;

  @IsOptional()
  isRecurring?: boolean = false;

  @IsOptional()
  @IsString()
  recurringPattern?: string;

  @IsOptional()
  isPublic?: boolean = false;
}
