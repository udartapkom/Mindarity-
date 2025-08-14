import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OAuthService } from './oauth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('OAuth')
@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get('providers')
  @ApiOperation({ summary: 'Get available OAuth providers' })
  @ApiResponse({ status: 200, description: 'List of available OAuth providers' })
  getProviders() {
    const providers = this.oauthService.getOAuthProviders();
    const availableProviders = Object.keys(providers).filter(provider => 
      this.oauthService.isProviderConfigured(provider)
    );
    
    return {
      available: availableProviders,
      configured: availableProviders.length > 0,
    };
  }

  @Get('auth/:provider')
  @ApiOperation({ summary: 'Get OAuth authorization URL' })
  @ApiParam({ name: 'provider', description: 'OAuth provider name' })
  @ApiResponse({ status: 200, description: 'Authorization URL' })
  @ApiResponse({ status: 400, description: 'Provider not configured' })
  getAuthorizationURL(@Param('provider') provider: string) {
    try {
      const authURL = this.oauthService.getAuthorizationURL(provider);
      return { 
        provider, 
        authorizationURL: authURL,
        configured: true,
      };
    } catch (error) {
      return {
        provider,
        configured: false,
        error: error.message,
      };
    }
  }

  @Get('callback/:provider')
  @ApiOperation({ summary: 'Handle OAuth callback' })
  @ApiParam({ name: 'provider', description: 'OAuth provider name' })
  @ApiResponse({ status: 200, description: 'Callback processed successfully' })
  async handleCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    if (!code) {
      return { error: 'Authorization code not provided' };
    }

    try {
      const result = await this.oauthService.handleCallback(provider, code, state);
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get OAuth connection status for current user' })
  @ApiResponse({ status: 200, description: 'OAuth connection status' })
  getConnectionStatus(@Request() req) {
    // Здесь можно добавить логику для проверки подключенных OAuth аккаунтов
    return {
      userId: req.user.id,
      connectedProviders: [],
      message: 'OAuth status endpoint - to be implemented',
    };
  }
}
