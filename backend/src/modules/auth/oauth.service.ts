import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Настройки OAuth провайдеров
   */
  getOAuthProviders() {
    return {
      google: {
        clientID: this.configService.get('OAUTH_GOOGLE_CLIENT_ID'),
        clientSecret: this.configService.get('OAUTH_GOOGLE_CLIENT_SECRET'),
        callbackURL: this.configService.get('OAUTH_GOOGLE_CALLBACK_URL'),
        scope: ['email', 'profile'],
      },
      github: {
        clientID: this.configService.get('OAUTH_GITHUB_CLIENT_ID'),
        clientSecret: this.configService.get('OAUTH_GITHUB_CLIENT_SECRET'),
        callbackURL: this.configService.get('OAUTH_GITHUB_CALLBACK_URL'),
        scope: ['user:email'],
      },
      keycloak: {
        clientID: this.configService.get('KEYCLOAK_CLIENT_ID'),
        clientSecret: this.configService.get('KEYCLOAK_CLIENT_SECRET'),
        callbackURL: this.configService.get('KEYCLOAK_CALLBACK_URL'),
        authorizationURL: this.configService.get('KEYCLOAK_AUTH_URL'),
        tokenURL: this.configService.get('KEYCLOAK_TOKEN_URL'),
        scope: ['openid', 'email', 'profile'],
      },
    };
  }

  /**
   * Проверяет, что OAuth провайдер настроен
   */
  isProviderConfigured(provider: string): boolean {
    const providers = this.getOAuthProviders();
    const config = providers[provider as keyof typeof providers];
    
    if (!config) return false;
    
    return !!(config.clientID && config.clientSecret && config.callbackURL);
  }

  /**
   * Получает URL для авторизации через OAuth
   */
  getAuthorizationURL(provider: string): string {
    const providers = this.getOAuthProviders();
    const config = providers[provider as keyof typeof providers];
    
    if (!config) {
      throw new Error(`OAuth provider ${provider} not configured`);
    }

    const params = new URLSearchParams({
      client_id: config.clientID,
      redirect_uri: config.callbackURL,
      scope: Array.isArray(config.scope) ? config.scope.join(' ') : config.scope,
      response_type: 'code',
      state: this.generateState(),
    });

    if (provider === 'keycloak' && 'authorizationURL' in config && config.authorizationURL) {
      return `${config.authorizationURL}?${params.toString()}`;
    }

    // Для Google и GitHub используем стандартные URL
    const baseURLs = {
      google: 'https://accounts.google.com/oauth/authorize',
      github: 'https://github.com/login/oauth/authorize',
    };

    const baseURL = baseURLs[provider as keyof typeof baseURLs];
    if (!baseURL) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    return `${baseURL}?${params.toString()}`;
  }

  /**
   * Генерирует случайное состояние для OAuth
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Обрабатывает OAuth callback
   */
  async handleCallback(provider: string, code: string, state: string) {
    this.logger.log(`Processing OAuth callback for ${provider}`);
    
    // Здесь будет логика обмена кода на токен и получения профиля пользователя
    // Реализация зависит от конкретного провайдера
    
    return {
      provider,
      code,
      state,
      message: 'OAuth callback processed successfully',
    };
  }
}
