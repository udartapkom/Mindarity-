import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { SessionsService } from '../../users/sessions.service';
import { UserStatus } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private sessionsService: SessionsService,
  ) {
    const secret = configService.get('jwt.secret');
    if (!secret) {
      throw new Error('JWT secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const user = await this.usersService.findOne(payload.sub);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Проверяем валидность сессии
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token) {
      const session = await this.sessionsService.getSessionByToken(token);
      if (!session || session.isRevoked) {
        throw new UnauthorizedException('Session has been revoked');
      }
      
      // Обновляем время последней активности
      await this.sessionsService.updateSessionActivity(session.id);
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      username: payload.username,
    };
  }
}
