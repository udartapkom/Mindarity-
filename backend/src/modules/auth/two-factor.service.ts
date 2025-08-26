import { Injectable, Logger } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  /**
   * Генерирует секретный ключ для 2FA
   */
  generateSecret(email: string): string {
    return speakeasy.generateSecret({
      name: `Mindarity (${email})`,
      issuer: 'Mindarity',
      length: 32,
    }).base32;
  }

  /**
   * Генерирует QR код для приложения аутентификации
   */
  async generateQRCode(secret: string, email: string): Promise<string> {
    const otpauthUrl = speakeasy.otpauthURL({
      secret,
      label: email,
      issuer: 'Mindarity',
      algorithm: 'sha1',
      digits: 6,
    });

    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      this.logger.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Проверяет TOTP токен
   */
  verifyToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Разрешаем отклонение в 2 периода (60 секунд)
    });
  }

  /**
   * Генерирует TOTP токен для тестирования
   */
  generateToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
      digits: 6,
    });
  }

  /**
   * Проверяет, что секрет валиден
   */
  validateSecret(secret: string): boolean {
    try {
      // Пытаемся сгенерировать токен для проверки валидности секрета
      speakeasy.totp({
        secret,
        encoding: 'base32',
      });
      return true;
    } catch {
      return false;
    }
  }
}
