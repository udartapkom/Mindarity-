import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { FileType } from '../entities/file.entity';

export class CreateFileDto {
  @IsString()
  originalName: string;

  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  size: number;

  @IsEnum(FileType)
  @IsOptional()
  type?: FileType;

  @IsString()
  @IsOptional()
  bucket?: string;

  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  metadata?: string;

  @IsUUID()
  userId: string;
}
