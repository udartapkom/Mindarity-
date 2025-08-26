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
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SessionsService } from './sessions.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from './entities/user.entity';
import { SessionResponseDto } from './dto/session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {}

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

  @Get('sessions')
  @ApiOperation({ summary: 'Get current user sessions' })
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
    type: [SessionResponseDto],
  })
  async getSessions(@Request() req): Promise<SessionResponseDto[]> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.sessionsService.getUserSessions(req.user.id, token);
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
    console.log('uploadAvatar called with file:', file);
    console.log('File path:', file?.path);
    console.log('File buffer:', file?.buffer);
    console.log('File originalname:', file?.originalname);
    
    if (file) {
      return this.usersService.updateAvatar(req.user.id, file);
    } else {
      throw new Error('No file uploaded');
    }
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
  async enableTwoFactor(@Request() req): Promise<{ code: string; expiresAt: Date }> {
    return this.usersService.enableTwoFactor(req.user.id);
  }

  @Post('profile/disable-2fa')
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  async disableTwoFactor(@Request() req): Promise<void> {
    return this.usersService.disableTwoFactor(req.user.id);
  }

  @Post('profile/verify-2fa')
  @ApiOperation({ summary: 'Verify two-factor authentication token' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  async verifyTwoFactor(
    @Body('token') token: string,
    @Request() req,
  ): Promise<{ isValid: boolean }> {
    const isValid = await this.usersService.verifyTwoFactorToken(req.user.id, token);
    return { isValid };
  }

  @Get('profile/current-otp')
  @ApiOperation({ summary: 'Get current OTP code for 2FA' })
  @ApiResponse({ status: 200, description: 'Current OTP code retrieved' })
  async getCurrentOTP(@Request() req): Promise<{ code: string; expiresAt: Date } | null> {
    return this.usersService.getCurrentOTP(req.user.id);
  }

  @Post('profile/generate-backup-codes')
  @ApiOperation({ summary: 'Generate backup codes for 2FA' })
  @ApiResponse({ status: 200, description: 'Backup codes generated successfully' })
  async generateBackupCodes(@Request() req): Promise<{ backupCodes: string[] }> {
    const backupCodes = await this.usersService.generateBackupCodes(req.user.id);
    return { backupCodes };
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

  // Session management endpoints
  // Place static routes before parameterized ones to avoid conflicts
  @Delete('sessions/all')
  @ApiOperation({ summary: 'Terminate all current user sessions' })
  @ApiResponse({ status: 204, description: 'All current user sessions terminated successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateAllCurrentUserSessions(@Request() req): Promise<void> {
    return this.sessionsService.terminateAllUserSessions(req.user.id);
  }

  @Delete('sessions')
  @ApiOperation({ summary: 'Terminate all other sessions' })
  @ApiResponse({ status: 204, description: 'All other sessions terminated successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateAllOtherSessions(@Request() req): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No authorization token found');
    }
    return this.sessionsService.terminateAllOtherSessions(req.user.id, token);
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Terminate specific session' })
  @ApiResponse({ status: 204, description: 'Session terminated successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateSession(
    @Param('sessionId') sessionId: string,
    @Request() req,
  ): Promise<void> {
    return this.sessionsService.terminateSession(sessionId, req.user.id);
  }

  @Delete(':id/sessions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Terminate all user sessions (admin only)' })
  @ApiResponse({ status: 204, description: 'All user sessions terminated successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateUserSessions(@Param('id') userId: string): Promise<void> {
    return this.sessionsService.terminateAllUserSessions(userId);
  }
}
