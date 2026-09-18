// src/leave-types/leave-types.controller.ts
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { LeaveTypesService } from './leave-types.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { UpdateLeaveTypeStatusDto } from './dto/update-leave-type-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Leave Types')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave-types')
export class LeaveTypesController {
  constructor(private leaveTypesService: LeaveTypesService) {}

  @Roles('ADMIN', 'HR')
  @Post()
  create(@Body() dto: CreateLeaveTypeDto) {
    return this.leaveTypesService.create(dto);
  }

  @Get()
  findAll() {
    return this.leaveTypesService.findActive();
  }

  @Roles('ADMIN', 'HR')
  @Get('all')
  findAllIncludingInactive() {
    return this.leaveTypesService.findAll();
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeaveTypeDto) {
    return this.leaveTypesService.update(id, dto);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeaveTypeStatusDto) {
    return this.leaveTypesService.updateStatus(id, dto);
  }
}