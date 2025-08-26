import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly otpStore = new Map<string, { code: string; expiresAt: Date }>();

  /**
   * Генерирует четырёхзначный OTP код
   */
  generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Генерирует OTP код для пользователя и сохраняет его
   */
  generateOTPForUser(userId: string): { code: string; expiresAt: Date } {
    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут
    
    this.otpStore.set(userId, { code, expiresAt });
    
    this.logger.log(`Generated OTP ${code} for user ${userId}`);
    
    return { code, expiresAt };
  }

  /**
   * Проверяет OTP код для пользователя
   */
  verifyOTP(userId: string, code: string): boolean {
    const storedOTP = this.otpStore.get(userId);
    
    if (!storedOTP) {
      this.logger.warn(`No OTP found for user ${userId}`);
      return false;
    }
    
    if (new Date() > storedOTP.expiresAt) {
      this.logger.warn(`OTP expired for user ${userId}`);
      this.otpStore.delete(userId);
      return false;
    }
    
    if (storedOTP.code !== code) {
      this.logger.warn(`Invalid OTP for user ${userId}: expected ${storedOTP.code}, got ${code}`);
      return false;
    }
    
    // Удаляем использованный код
    this.otpStore.delete(userId);
    this.logger.log(`OTP verified successfully for user ${userId}`);
    
    return true;
  }

  /**
   * Получает текущий OTP код для пользователя (для отображения на экране)
   */
  getCurrentOTP(userId: string): { code: string; expiresAt: Date } | null {
    const storedOTP = this.otpStore.get(userId);
    
    if (!storedOTP || new Date() > storedOTP.expiresAt) {
      return null;
    }
    
    return storedOTP;
  }

  /**
   * Очищает истекшие OTP коды
   */
  cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [userId, otp] of this.otpStore.entries()) {
      if (now > otp.expiresAt) {
        this.otpStore.delete(userId);
      }
    }
  }

  // Методы для совместимости с существующим кодом
  generateSecret(email: string): string {
    return this.generateOTP();
  }

  async generateQRCode(secret: string, email: string): Promise<string> {
    // Для простой 2FA возвращаем пустую строку
    return '';
  }

  verifyToken(token: string, secret: string): boolean {
    // Для простой 2FA всегда возвращаем false
    return false;
  }

  generateTOTPToken(secret: string): string {
    // Для простой 2FA возвращаем пустую строку
    return '';
  }
}
