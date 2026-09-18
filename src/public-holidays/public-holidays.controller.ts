// src/public-holidays/public-holidays.controller.ts
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PublicHolidaysService } from './public-holidays.service';
import { CreatePublicHolidayDto } from './dto/create-public-holiday.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Public Holidays')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('public-holidays')
export class PublicHolidaysController {
  constructor(private publicHolidaysService: PublicHolidaysService) {}

  @Roles('ADMIN', 'HR')
  @Post()
  create(@Body() dto: CreatePublicHolidayDto) {
    return this.publicHolidaysService.create(dto);
  }

  @Get()
  findAll() {
    return this.publicHolidaysService.findAll();
  }

  @Roles('ADMIN', 'HR')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.publicHolidaysService.remove(id);
  }
}