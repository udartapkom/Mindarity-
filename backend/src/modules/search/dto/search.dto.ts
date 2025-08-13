import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SearchType {
  EVENT = 'event',
  THOUGHT = 'thought',
  MEMORY = 'memory',
  IDEA = 'idea',
  GOAL = 'goal',
  TASK = 'task',
}

export enum SearchSort {
  RELEVANCE = 'relevance',
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
  TITLE_ASC = 'title_asc',
  TITLE_DESC = 'title_desc',
}

export class SearchDto {
  @ApiPropertyOptional({ description: 'Search query text' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({
    description: 'Types to search in',
    enum: SearchType,
    isArray: true,
  })
  @IsEnum(SearchType, { each: true })
  @IsArray()
  @IsOptional()
  types?: SearchType[];

  @ApiPropertyOptional({ description: 'Date range start (ISO string)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date range end (ISO string)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Emotional reactions to filter by',
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  emotionalReactions?: string[];

  @ApiPropertyOptional({ description: 'Tags to filter by', isArray: true })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Sort order', enum: SearchSort })
  @IsEnum(SearchSort)
  @IsOptional()
  sort?: SearchSort = SearchSort.RELEVANCE;

  @ApiPropertyOptional({ description: 'Page number (0-based)' })
  @IsOptional()
  page?: number = 0;

  @ApiPropertyOptional({ description: 'Page size' })
  @IsOptional()
  size?: number = 20;
}
