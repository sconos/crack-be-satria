// src/attendance-corrections/attendance-corrections.controller.ts
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AttendanceCorrectionsService } from './attendance-corrections.service';
import { CreateAttendanceCorrectionDto } from './dto/create-attendance-correction.dto';
import { QueryAttendanceCorrectionDto } from './dto/query-attendance-correction.dto';
import { ReviewAttendanceCorrectionDto } from './dto/review-attendance-correction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Attendance Corrections')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance-corrections')
export class AttendanceCorrectionsController {
  constructor(private correctionsService: AttendanceCorrectionsService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateAttendanceCorrectionDto,
  ) {
    return this.correctionsService.create(user.userId, dto);
  }

  @Get('me')
  findMine(
    @CurrentUser() user: { userId: string },
    @Query() query: QueryAttendanceCorrectionDto,
  ) {
    return this.correctionsService.findMyRequests(user.userId, query);
  }

  @Roles('ADMIN', 'HR')
  @Get()
  findAll(@Query() query: QueryAttendanceCorrectionDto) {
    return this.correctionsService.findAll(query);
  }

  @Roles('ADMIN', 'HR')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.correctionsService.findOne(id);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: ReviewAttendanceCorrectionDto,
  ) {
    return this.correctionsService.review(id, user.userId, dto);
  }
}