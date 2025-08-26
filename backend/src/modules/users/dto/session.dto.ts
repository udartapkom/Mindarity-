import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'JWT token' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Device information', required: false })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiProperty({ description: 'IP address', required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ description: 'User agent', required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: 'Last activity timestamp', required: false })
  @IsOptional()
  @IsDateString()
  lastActivity?: string;

  @ApiProperty({ description: 'Session expiration date' })
  @IsDateString()
  expiresAt: string;
}

export class SessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  device: string;

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  lastActivity: Date;

  @ApiProperty()
  isCurrent: boolean;

  @ApiProperty()
  createdAt: Date;
}
