import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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

  async updateAvatar(id: string, avatarPath: string): Promise<User> {
    const user = await this.findOne(id);
    user.avatar = avatarPath;
    return this.usersRepository.save(user);
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

  async enableTwoFactor(id: string, secret: string): Promise<void> {
    await this.usersRepository.update(id, {
      isTwoFactorEnabled: true,
      twoFactorSecret: secret,
    });
  }

  async disableTwoFactor(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    });
  }
}
