// src/attendance-corrections/attendance-corrections.module.ts
import { Module } from '@nestjs/common';
import { AttendanceCorrectionsService } from './attendance-corrections.service';
import { AttendanceCorrectionsController } from './attendance-corrections.controller';
import { AttendanceCorrectionsRepository } from './attendance-corrections.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AttendanceCorrectionsController],
  providers: [AttendanceCorrectionsService, AttendanceCorrectionsRepository],
})
export class AttendanceCorrectionsModule {}