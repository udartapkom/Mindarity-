import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async seed() {
    this.logger.log('Starting database seeding...');
    
    try {
      await this.seedSuperAdmin();
      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error('Error during database seeding:', error);
      throw error;
    }
  }

  private async seedSuperAdmin() {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@mindarity.ru';
    const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

    // Check if super admin already exists
    const existingSuperAdmin = await this.usersRepository.findOne({
      where: [
        { email: superAdminEmail },
        { username: superAdminUsername },
      ],
    });

    if (existingSuperAdmin) {
      this.logger.log('Super admin already exists, skipping creation');
      return;
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    
    const superAdmin = this.usersRepository.create({
      username: superAdminUsername,
      email: superAdminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      firstName: 'Super',
      lastName: 'Administrator',
      isEmailVerified: true,
      isTwoFactorEnabled: false,
    });

    await this.usersRepository.save(superAdmin);
    
    this.logger.log(`Super admin created successfully: ${superAdminEmail}`);
    this.logger.log(`Username: ${superAdminUsername}`);
    this.logger.log(`Password: ${superAdminPassword}`);
    this.logger.log('IMPORTANT: Change the password after first login!');
  }
}
