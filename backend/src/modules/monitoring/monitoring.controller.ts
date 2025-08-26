import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private monitoringService: MonitoringService,
  ) {}

  @Get('health')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check for all services' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get('metrics/system')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get system metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async getSystemMetrics() {
    return this.monitoringService.getSystemMetrics();
  }

  @Get('metrics/application')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get application metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Application metrics' })
  async getApplicationMetrics() {
    return this.monitoringService.getApplicationMetrics();
  }

  @Get('health/detailed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get detailed health status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  async getDetailedHealth() {
    return this.monitoringService.getHealthStatus();
  }

  @Get('processes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get process list (Admin only)' })
  @ApiResponse({ status: 200, description: 'Process list' })
  async getProcessList() {
    return this.monitoringService.getProcessList();
  }

  @Get('apis/health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get external APIs health (Admin only)' })
  @ApiResponse({ status: 200, description: 'External APIs health' })
  async getApisHealth() {
    return this.monitoringService.getApiHealth();
  }

  @Get('security/alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get security alerts (Admin only)' })
  @ApiResponse({ status: 200, description: 'Security alerts' })
  async getSecurityAlerts() {
    return this.monitoringService.getSecurityAlerts();
  }

  @Delete('security/alerts/failed-logins/:username/:ipAddress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete failed login attempts for specific user and IP (Admin only)' })
  @ApiResponse({ status: 200, description: 'Failed login attempts deleted' })
  async deleteFailedLoginAttempts(
    @Param('username') username: string,
    @Param('ipAddress') ipAddress: string,
  ) {
    return this.monitoringService.deleteFailedLoginAttempts(username, ipAddress);
  }

  @Delete('security/alerts/failed-logins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete all failed login attempts (Admin only)' })
  @ApiResponse({ status: 200, description: 'All failed login attempts deleted' })
  async deleteAllFailedLoginAttempts() {
    return this.monitoringService.deleteAllFailedLoginAttempts();
  }
}
