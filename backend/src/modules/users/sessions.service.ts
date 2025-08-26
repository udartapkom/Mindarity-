import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Session } from './entities/session.entity';
import { CreateSessionDto, SessionResponseDto } from './dto/session.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
    private jwtService: JwtService,
  ) {}

  async createSession(createSessionDto: CreateSessionDto): Promise<Session> {
    const session = this.sessionsRepository.create(createSessionDto);
    return this.sessionsRepository.save(session);
  }

  async getUserSessions(userId: string, currentToken?: string): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionsRepository.find({
      where: { userId, isRevoked: false },
      order: { lastActivity: 'DESC' },
    });

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      device: session.device || 'Неизвестное устройство',
      ipAddress: session.ipAddress || 'Неизвестный IP',
      lastActivity: session.lastActivity,
      isCurrent: currentToken ? session.token === currentToken : false,
      createdAt: session.createdAt,
    }));
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = await this.sessionsRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.lastActivity = new Date();
    await this.sessionsRepository.save(session);
  }

  async terminateSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.isRevoked = true;
    await this.sessionsRepository.save(session);
  }

  async terminateAllUserSessions(userId: string, excludeToken?: string): Promise<void> {
    if (excludeToken) {
      // Сначала завершаем все сессии
      await this.sessionsRepository.update(
        { userId, isRevoked: false },
        { isRevoked: true }
      );
      
      // Затем восстанавливаем исключенную сессию
      await this.sessionsRepository.update(
        { userId, token: excludeToken },
        { isRevoked: false }
      );
    } else {
      // Завершаем все сессии без исключений
      await this.sessionsRepository.update(
        { userId, isRevoked: false },
        { isRevoked: true }
      );
    }
  }

  async terminateAllOtherSessions(userId: string, currentToken: string): Promise<void> {
    // Находим текущую сессию
    const currentSession = await this.sessionsRepository.findOne({
      where: { userId, token: currentToken, isRevoked: false }
    });

    if (currentSession) {
      // Завершаем все сессии, кроме текущей
      await this.sessionsRepository.update(
        { userId, isRevoked: false },
        { isRevoked: true }
      );
      
      // Восстанавливаем текущую сессию
      await this.sessionsRepository.update(
        { id: currentSession.id },
        { isRevoked: false }
      );
    } else {
      // Если текущая сессия не найдена, завершаем все сессии
      await this.sessionsRepository.update(
        { userId, isRevoked: false },
        { isRevoked: true }
      );
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    const expiredSessions = await this.sessionsRepository.find({
      where: { expiresAt: LessThan(new Date()) },
    });

    for (const session of expiredSessions) {
      session.isRevoked = true;
      await this.sessionsRepository.save(session);
    }
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    return this.sessionsRepository.findOne({
      where: { token, isRevoked: false },
    });
  }

  async revokeSessionByToken(token: string): Promise<void> {
    const session = await this.getSessionByToken(token);
    if (session) {
      session.isRevoked = true;
      await this.sessionsRepository.save(session);
    }
  }

  async getDeviceInfo(userAgent: string): Promise<string> {
    if (!userAgent) return 'Неизвестное устройство';
    
    if (userAgent.includes('Mobile')) return 'Мобильное устройство';
    if (userAgent.includes('Tablet')) return 'Планшет';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Другое устройство';
  }
}
