import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new file record' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  create(@Body() createFileDto: CreateFileDto, @Request() req: any) {
    return this.filesService.create(createFileDto, req.user.id);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        bucket: {
          type: 'string',
          description: 'Storage bucket name',
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return await this.filesService.uploadAvatar(
      file,
      userId,
    );
  }

  @Post('upload-large')
  @ApiOperation({ summary: 'Upload a large file with resource control' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async uploadLargeFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return await this.filesService.uploadLargeFile(file, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all files (with optional user filter)' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  findAll(@Request() req: any, @Query('userId') userId?: string) {
    // Если пользователь не админ, показываем только его файлы
    if (req?.user?.role !== UserRole.ADMIN) {
      return this.filesService.findAll(req.user.id);
    }
    return this.filesService.findAll(userId || req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get file statistics' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async getStats(@Request() req: any, @Query('userId') userId?: string) {
    // Если пользователь не админ, показываем только его статистику
    if (req?.user?.role !== UserRole.ADMIN) {
      return await this.filesService.getStats(req.user.id);
    }
    return await this.filesService.getStats(userId || req.user.id);
  }

  @Get('storage-stats')
  @ApiOperation({ summary: 'Get storage statistics with system info' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async getStorageStats(@Request() req: any) {
    return await this.filesService.getStorageStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a file by id' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  findOne(@Param('id') id: string, @Request() req: any) {
    // Проверяем права доступа
    return this.filesService.findOne(id, req.user.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get file download info' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async getDownloadInfo(@Param('id') id: string, @Request() req: any) {
    const file = await this.filesService.findOne(id, req.user.id);
    return { file };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a file' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto, @Request() req: any) {
    return this.filesService.update(id, updateFileDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.filesService.remove(id, req.user.id);
  }
}
