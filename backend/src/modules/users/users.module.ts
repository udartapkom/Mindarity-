import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SessionsService } from './sessions.service';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { TwoFactorService } from '../auth/two-factor.service';
import { BigDataModule } from '../bigdata/bigdata.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session]), 
    BigDataModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, SessionsService, TwoFactorService],
  exports: [UsersService, SessionsService],
})
export class UsersModule {}
