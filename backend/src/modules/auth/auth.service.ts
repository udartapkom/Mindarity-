import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { CaptchaService } from './captcha.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private captchaService: CaptchaService,
  ) {}

  async validateUser(email: string, password: string, captchaToken?: string, captchaType: 'google' | 'hcaptcha' = 'google'): Promise<any> {
    // Проверяем CAPTCHA если она настроена
    if (this.captchaService.isCaptchaConfigured(captchaType) && captchaToken) {
      const isCaptchaValid = await this.captchaService.verifyCaptcha(captchaToken, captchaType);
      if (!isCaptchaValid) {
        throw new BadRequestException('CAPTCHA verification failed');
      }
    }

    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
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
