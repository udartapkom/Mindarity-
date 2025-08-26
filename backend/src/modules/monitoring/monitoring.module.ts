import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { Goal } from '../goals/entities/goal.entity';
import { Task } from '../goals/entities/task.entity';
import { File } from '../files/entities/file.entity';
import { FailedLoginAttempt } from './entities/failed-login.entity';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule.forFeature([User, Event, Goal, Task, File, FailedLoginAttempt]),
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
