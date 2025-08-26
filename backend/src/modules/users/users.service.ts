import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TwoFactorService } from '../auth/two-factor.service';
import { MinioStorageService } from '../bigdata/minio-storage.service';

import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => TwoFactorService))
    private twoFactorService: TwoFactorService,
    @Inject(forwardRef(() => MinioStorageService))
    private minioStorageService: MinioStorageService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: [
        'id',
        'username',
        'email',
        'role',
        'status',
        'firstName',
        'lastName',
        'createdAt',
      ],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'email',
        'role',
        'status',
        'firstName',
        'lastName',
        'avatar',
        'createdAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'username',
        'email',
        'password',
        'role',
        'status',
        'isTwoFactorEnabled',
        'twoFactorSecret',
      ],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
      select: [
        'id',
        'username',
        'email',
        'password',
        'role',
        'status',
        'isTwoFactorEnabled',
        'twoFactorSecret',
      ],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email/username already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.findByUsername(updateUserDto.username);
      if (existingUser) {
        throw new ConflictException('Username already in use');
      }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      12,
    );
    await this.usersRepository.update(id, { password: hashedNewPassword });
  }

  async updateAvatar(id: string, file: Express.Multer.File): Promise<User> {
    console.log('updateAvatar called with file:', file.originalname);
    const user = await this.findOne(id);
    
    try {
      // Проверяем тип файла
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException('Invalid file type. Only images are allowed.');
      }

      // Проверяем размер файла (максимум 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException('File too large. Maximum size is 5MB.');
      }

      // Удаляем старый аватар, если он существует
      if (user.avatar) {
        try {
          // Извлекаем имя файла из URL
          const avatarUrl = new URL(user.avatar);
          const pathParts = avatarUrl.pathname.split('/');
          const fileName = pathParts.slice(-2).join('/'); // avatars/userId/filename
          
          console.log('Deleting old avatar:', fileName);
          await this.minioStorageService.deleteFile(fileName);
          console.log('Old avatar deleted successfully');
        } catch (error) {
          console.error('Failed to delete old avatar:', error);
          // Не прерываем процесс, если не удалось удалить старый аватар
        }
      }

      // Генерируем уникальное имя файла
      const path = require('path');
      const crypto = require('crypto');
      const fileExtension = path.extname(file.originalname);
      const fileName = `avatars/${id}/${crypto.randomUUID()}${fileExtension}`;
      
      // Создаем временный файл из buffer
      const fs = require('fs');
      const tempDir = '/tmp'; // Используем абсолютный путь в Docker
      const tempFilePath = path.join(tempDir, `avatar_${crypto.randomUUID()}${fileExtension}`);
      
      console.log('Temp file path:', tempFilePath);
      console.log('File buffer length:', file.buffer?.length);
      
      // Записываем buffer во временный файл
      fs.writeFileSync(tempFilePath, file.buffer);
      
      try {
        // Загружаем файл в MinIO
        await this.minioStorageService.uploadBuffer(
          file.buffer,
          fileName,
          file.mimetype
        );

        // Получаем прямой URL для аватара (без presigned параметров)
        const avatarUrl = this.minioStorageService.getAvatarUrl(fileName);

        // Обновляем пользователя
        user.avatar = avatarUrl;
        return this.usersRepository.save(user);
      } finally {
        // Удаляем временный файл
        try {
          fs.unlinkSync(tempFilePath);
        } catch (error) {
          console.error('Failed to delete temporary file:', error);
        }
      }
    } catch (error) {
      throw new BadRequestException(`Failed to upload avatar: ${error.message}`);
    }
  }

  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      failedLoginAttempts: 0,
      lockedUntil: null as any,
    });
  }

  async incrementFailedLoginAttempts(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'failedLoginAttempts'],
    });

    if (!user) return;

    const newAttempts = user.failedLoginAttempts + 1;
    let lockedUntil: Date | null = null;

    // Lock account after 5 failed attempts for 15 minutes
    if (newAttempts >= 5) {
      lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 15);
    }

    await this.usersRepository.update(id, {
      failedLoginAttempts: newAttempts,
      lockedUntil,
    });
  }

  async changeStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    return this.usersRepository.save(user);
  }

  async changeRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    user.role = role;
    return this.usersRepository.save(user);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token and send email
    // Implementation depends on email service
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validate token and reset password
    // Implementation depends on token validation
  }

  async enableTwoFactor(id: string): Promise<{ code: string; expiresAt: Date }> {
    const user = await this.findOne(id);
    
    // Генерируем OTP код для пользователя
    const otpData = this.twoFactorService.generateOTPForUser(id);
    
    // Сохраняем статус 2FA в базе данных (для совместимости)
    await this.usersRepository.update(id, {
      isTwoFactorEnabled: true,
    });
    
    return otpData;
  }

  async disableTwoFactor(id: string): Promise<void> {
    // 2FA теперь нельзя отключить - она обязательна для всех
    throw new BadRequestException('2FA cannot be disabled - it is required for all users');
  }

  async verifyTwoFactorToken(id: string, token: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.twoFactorService.verifyOTP(id, token);
  }

  async getCurrentOTP(id: string): Promise<{ code: string; expiresAt: Date } | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.twoFactorService.getCurrentOTP(id);
  }

  async generateBackupCodes(id: string): Promise<string[]> {
    const user = await this.findOne(id);
    
    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // Генерируем 10 резервных кодов по 8 символов
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Сохраняем хэшированные резервные коды
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    await this.usersRepository.update(id, {
      backupCodes: hashedBackupCodes,
    });

    return backupCodes;
  }
}
