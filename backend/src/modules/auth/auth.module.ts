import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TwoFactorService } from './two-factor.service';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { UsersModule } from '../users/users.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [
    UsersModule,
    MonitoringModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: { expiresIn: configService.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, TwoFactorService, OAuthService],
  exports: [AuthService, TwoFactorService, OAuthService],
})
export class AuthModule {}
