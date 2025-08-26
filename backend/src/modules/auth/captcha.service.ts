import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Проверяет Google reCAPTCHA токен
   */
  async verifyGoogleRecaptcha(token: string, remoteIp?: string): Promise<boolean> {
    const secretKey = this.configService.get('RECAPTCHA_SECRET_KEY');
    
    if (!secretKey) {
      this.logger.warn('Google reCAPTCHA secret key not configured');
      return false;
    }

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
          remoteip: remoteIp || '',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        this.logger.log('Google reCAPTCHA verification successful');
        return true;
      } else {
        this.logger.warn('Google reCAPTCHA verification failed:', result['error-codes']);
        return false;
      }
    } catch (error) {
      this.logger.error('Error verifying Google reCAPTCHA:', error);
      return false;
    }
  }

  /**
   * Проверяет hCaptcha токен
   */
  async verifyHCaptcha(token: string, remoteIp?: string): Promise<boolean> {
    const secretKey = this.configService.get('HCAPTCHA_SECRET_KEY');
    
    if (!secretKey) {
      this.logger.warn('hCaptcha secret key not configured');
      return false;
    }

    try {
      const response = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
          remoteip: remoteIp || '',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        this.logger.log('hCaptcha verification successful');
        return true;
      } else {
        this.logger.warn('hCaptcha verification failed:', result['error-codes']);
        return false;
      }
    } catch (error) {
      this.logger.error('Error verifying hCaptcha:', error);
      return false;
    }
  }

  /**
   * Проверяет CAPTCHA токен (автоматически определяет тип)
   */
  async verifyCaptcha(token: string, type: 'google' | 'hcaptcha' = 'google', remoteIp?: string): Promise<boolean> {
    switch (type) {
      case 'google':
        return this.verifyGoogleRecaptcha(token, remoteIp);
      case 'hcaptcha':
        return this.verifyHCaptcha(token, remoteIp);
      default:
        this.logger.warn(`Unknown CAPTCHA type: ${type}`);
        return false;
    }
  }

  /**
   * Проверяет, что CAPTCHA настроена
   */
  isCaptchaConfigured(type: 'google' | 'hcaptcha' = 'google'): boolean {
    switch (type) {
      case 'google':
        return !!this.configService.get('RECAPTCHA_SECRET_KEY');
      case 'hcaptcha':
        return !!this.configService.get('HCAPTCHA_SECRET_KEY');
      default:
        return false;
    }
  }

  /**
   * Получает настройки CAPTCHA для фронтенда
   */
  getCaptchaConfig() {
    return {
      google: {
        enabled: this.isCaptchaConfigured('google'),
        siteKey: this.configService.get('RECAPTCHA_SITE_KEY'),
      },
      hcaptcha: {
        enabled: this.isCaptchaConfigured('hcaptcha'),
        siteKey: this.configService.get('HCAPTCHA_SITE_KEY'),
      },
    };
  }
}
