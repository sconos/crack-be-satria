import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JobTitleService } from './job-title.service';
import { CreateJobTitleDto } from './dto/create-job-title.dto';
import { UpdateJobTitleStatusDto } from './dto/update-job-title-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateJobTitleDto } from './dto/update-job-title.dto';

@ApiTags('Job Titles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('job-titles')
export class JobTitlesController {
  constructor(private jobTitlesService: JobTitleService) {}

  @Get()
  findAll(@Query('active') active?: string) {
    return active === 'true' ? this.jobTitlesService.findActive() : this.jobTitlesService.findAll();
  }

  @Roles('ADMIN', 'HR')
  @Post()
  create(@Body() dto: CreateJobTitleDto) {
    return this.jobTitlesService.create(dto);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateJobTitleStatusDto) {
    return this.jobTitlesService.updateStatus(id, dto.isActive);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobTitleDto) {
    return this.jobTitlesService.update(id, dto);
  }
}