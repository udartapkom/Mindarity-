import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [User],
  })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: User,
  })
  async getProfile(@Request() req): Promise<User> {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: User,
  })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: User,
  })
  async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ): Promise<User> {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  @Post('profile/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ): Promise<void> {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload avatar for current user' })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    type: User,
  })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ): Promise<User> {
    return this.usersService.updateAvatar(req.user.id, file.path);
  }

  @Post(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change user status (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Status changed successfully',
    type: User,
  })
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<User> {
    return this.usersService.changeStatus(id, status as any);
  }

  @Post(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change user role (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Role changed successfully',
    type: User,
  })
  async changeRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ): Promise<User> {
    return this.usersService.changeRole(id, role as any);
  }

  @Post('profile/enable-2fa')
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  async enableTwoFactor(
    @Body('secret') secret: string,
    @Request() req,
  ): Promise<void> {
    return this.usersService.enableTwoFactor(req.user.id, secret);
  }

  @Post('profile/disable-2fa')
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  async disableTwoFactor(@Request() req): Promise<void> {
    return this.usersService.disableTwoFactor(req.user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 204, description: 'Password reset email sent' })
  async forgotPassword(@Body('email') email: string): Promise<void> {
    return this.usersService.requestPasswordReset(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 204, description: 'Password reset successfully' })
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ): Promise<void> {
    return this.usersService.resetPassword(token, newPassword);
  }
}
