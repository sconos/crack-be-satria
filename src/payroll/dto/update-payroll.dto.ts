// src/payroll/dto/update-payroll.dto.ts
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePayrollDto {
  @IsOptional()
  @IsNumber()
  allowances?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}