// src/employees/employees.controller.ts
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeSelfDto } from './dto/update-employee-self.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Employees')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Roles('ADMIN', 'HR')
  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Roles('ADMIN', 'HR')
  @Get()
  findAll(@Query() query: QueryEmployeeDto) {
    return this.employeesService.findAll(query);
  }

  @Get('org-chart')
  findOrgChart() {
    return this.employeesService.findOrgChart();
  }

  @Get('me')
  findMe(@CurrentUser() user: { userId: string }) {
    return this.employeesService.findByUserId(user.userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateEmployeeSelfDto,
  ) {
    return this.employeesService.updateSelf(user.userId, dto);
  }

  @Roles('ADMIN', 'HR')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEmployeeStatusDto) {
    return this.employeesService.updateStatus(id, dto);
  }
}