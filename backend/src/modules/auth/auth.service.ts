import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../users/sessions.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { CreateSessionDto } from '../users/dto/session.dto';
import * as bcrypt from 'bcryptjs';
import { TwoFactorService } from './two-factor.service';
import { MonitoringService } from '../monitoring/monitoring.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private jwtService: JwtService,
    private twoFactorService: TwoFactorService,
    private monitoringService: MonitoringService,
  ) {}

  async validateUser(email: string, password: string, ipAddress?: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      // Сбрасываем неудачные попытки при успешном логине
      if (ipAddress) {
        await this.monitoringService.resetFailedLoginAttempts(email, ipAddress);
      }
      const { password, ...result } = user;
      return result;
    }

    // Записываем неудачную попытку
    if (ipAddress) {
      await this.monitoringService.recordFailedLogin(email, ipAddress);
    }

    return null;
  }

  async login(user: any) {
    // 2FA всегда требуется для всех пользователей
    const otpData = this.twoFactorService.generateOTPForUser(user.id);
    
    return {
      requires2FA: true,
      userId: user.id,
      message: '2FA required. Please enter the OTP code.',
      otpCode: otpData.code, // Для учебного проекта показываем код
      expiresAt: otpData.expiresAt,
    };
  }

  async loginWith2FA(userId: string, otpCode: string, userAgent?: string, ipAddress?: string) {
    // Проверяем OTP код
    const isValid = this.twoFactorService.verifyOTP(userId, otpCode);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    // Получаем пользователя
    const user = await this.usersService.findOne(userId);
    
    // Генерируем JWT токен
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      username: user.username,
    };

    const token = this.jwtService.sign(payload);

    // Создаем сессию
    const deviceInfo = await this.sessionsService.getDeviceInfo(userAgent || '');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 часа

    const sessionData: CreateSessionDto = {
      userId,
      token,
      device: deviceInfo,
      ipAddress,
      userAgent,
      lastActivity: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.sessionsService.createSession(sessionData);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    // Generate JWT token for immediate login
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    };
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findOne(userId);

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersService.findOne(userId);

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersService.changePassword(userId, {
      currentPassword,
      newPassword,
    });
  }
}
