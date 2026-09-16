// src/payroll/payroll.controller.ts
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { PayrollService } from './payroll.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { GeneratePeriodPayrollDto } from './dto/generate-period-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { QueryPayrollDto } from './dto/query-payroll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Payroll')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Roles('ADMIN', 'HR')
  @Post('generate')
  generateForEmployee(@Body() dto: GeneratePayrollDto) {
    return this.payrollService.generateForEmployee(dto);
  }

  @Roles('ADMIN', 'HR')
  @Post('generate-period')
  generateForPeriod(@Body() dto: GeneratePeriodPayrollDto) {
    return this.payrollService.generateForPeriod(dto);
  }

  @Get('me')
  findMine(
    @CurrentUser() user: { userId: string },
    @Query() query: QueryPayrollDto,
  ) {
    return this.payrollService.findMyPayroll(user.userId, query);
  }

  @Roles('ADMIN', 'HR')
  @Get()
  findAll(@Query() query: QueryPayrollDto) {
    return this.payrollService.findAll(query);
  }

  // No @Roles() here on purpose — an EMPLOYEE can view their own record,
  // ADMIN/HR can view any. Ownership is enforced in the service, since it
  // depends on *which* record :id points to.
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: 'ADMIN' | 'HR' | 'EMPLOYEE' },
  ) {
    return this.payrollService.findOne(id, user);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePayrollDto) {
    return this.payrollService.update(id, dto);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id/mark-paid')
  markPaid(@Param('id') id: string) {
    return this.payrollService.markPaid(id);
  }

  // Same reasoning as findOne() above — own payslip only, unless ADMIN/HR.
  @Get(':id/payslip')
  async downloadPayslip(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: 'ADMIN' | 'HR' | 'EMPLOYEE' },
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.payrollService.generatePayslipPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=payslip-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }
}