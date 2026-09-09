// src/payroll/dto/update-payroll.dto.ts
import { IsNumber, IsOptional, IsString } from 'class-validator';

// manual override of allowances/notes before marking paid — base salary and
// attendance-derived deductions are recalculated, not hand-edited
export class UpdatePayrollDto {
  @IsOptional()
  @IsNumber()
  allowances?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}