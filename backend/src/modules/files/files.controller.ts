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
  create(@Body() createFileDto: CreateFileDto) {
    return this.filesService.create(createFileDto);
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
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('bucket') bucket: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return await this.filesService.uploadFile(
      file,
      userId,
      bucket || 'default',
    );
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
    return this.filesService.findAll(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get file statistics' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async getStats(@Request() req: any, @Query('userId') userId?: string) {
    // Если пользователь не админ, показываем только его статистику
    if (req?.user?.role !== UserRole.ADMIN) {
      return await this.filesService.getFileStats(req.user.id);
    }
    return await this.filesService.getFileStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a file by id' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    // Проверяем права доступа
    return this.filesService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get presigned download URL' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async getDownloadUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const expiresInSeconds = expiresIn ? parseInt(expiresIn) : 3600;
    const url = await this.filesService.generatePresignedUrl(
      id,
      expiresInSeconds,
    );
    return { downloadUrl: url };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a file' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.update(id, updateFileDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiBearerAuth()
  @Roles(UserRole.USER, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }
}
