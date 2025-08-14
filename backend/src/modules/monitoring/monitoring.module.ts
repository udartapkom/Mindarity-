import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [TerminusModule, PrometheusModule.register()],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
