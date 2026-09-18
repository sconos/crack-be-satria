import { Module } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { LeaveRepository } from './leave.repository';
import { LeaveTypesModule } from '../leave-types/leave-types.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [LeaveTypesModule, NotificationsModule],
  controllers: [LeaveController],
  providers: [LeaveService, LeaveRepository],
})
export class LeaveModule {}