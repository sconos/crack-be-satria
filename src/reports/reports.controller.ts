// src/reports/reports.controller.ts
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { LeaveUtilizationQueryDto } from './dto/leave-utilization-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'HR')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('headcount')
  getHeadcount() {
    return this.reportsService.getHeadcountByDepartment();
  }

  @Get('leave-utilization')
  getLeaveUtilization(@Query() query: LeaveUtilizationQueryDto) {
    return this.reportsService.getLeaveUtilizationByType(query);
  }
}