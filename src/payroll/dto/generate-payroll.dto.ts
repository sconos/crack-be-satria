// src/payroll/dto/generate-payroll.dto.ts
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class GeneratePayrollDto {
  @IsUUID()
  employeeId!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth!: number;

  @IsInt()
  @Min(2000)
  periodYear!: number;
}