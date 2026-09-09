import { Module } from '@nestjs/common';
import { LeaveTypesService } from './leave-types.service';
import { LeaveTypesController } from './leave-types.controller';
import { LeaveTypesRepository } from './leave-types.repository';

@Module({
  controllers: [LeaveTypesController],
  providers: [LeaveTypesService, LeaveTypesRepository],
  exports: [LeaveTypesRepository],
})
export class LeaveTypesModule {}
