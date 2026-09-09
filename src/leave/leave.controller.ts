// src/leave/leave.controller.ts — 'me/balance' now returns an array (one entry per leave type)
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Leave')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave')
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateLeaveRequestDto) {
    return this.leaveService.create(user.userId, dto);
  }

  @Get('me')
  findMine(@CurrentUser() user: { userId: string }, @Query() query: QueryLeaveRequestDto) {
    return this.leaveService.findMyRequests(user.userId, query);
  }

  @Get('me/balance')
  findMyBalances(@CurrentUser() user: { userId: string }, @Query('year') year?: string) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.leaveService.findMyBalances(user.userId, targetYear);
  }

  @Patch(':id/cancel')
  cancel(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.leaveService.cancel(user.userId, id);
  }

  @Roles('ADMIN', 'HR')
  @Get()
  findAll(@Query() query: QueryLeaveRequestDto) {
    return this.leaveService.findAll(query);
  }

  @Roles('ADMIN', 'HR')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveService.findOne(id);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id/review')
  review(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: ReviewLeaveRequestDto,
  ) {
    return this.leaveService.review(id, user.userId, dto);
  }
}