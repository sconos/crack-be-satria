// src/attendances/attendances.controller.ts
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Attendance')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendancesController {
  constructor(private attendancesService: AttendancesService) {}

  @Post('clock-in')
  checkIn(@CurrentUser() user: { userId: string }) {
    return this.attendancesService.checkIn(user.userId);
  }

  @Post('clock-out')
  checkOut(@CurrentUser() user: { userId: string }) {
    return this.attendancesService.checkOut(user.userId);
  }

  @Get('me')
  findMine(
    @CurrentUser() user: { userId: string },
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendancesService.findMyAttendance(user.userId, query);
  }

  @Roles('ADMIN', 'HR')
  @Post()
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendancesService.create(dto);
  }

  @Roles('ADMIN', 'HR')
  @Get()
  findAll(@Query() query: QueryAttendanceDto) {
    return this.attendancesService.findAll(query);
  }

  @Roles('ADMIN', 'HR')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendancesService.findOne(id);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, dto);
  }

  @Roles('ADMIN', 'HR')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendancesService.remove(id);
  }
}