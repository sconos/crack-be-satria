// src/payroll/dto/generate-period-payroll.dto.ts
import { IsInt, Max, Min } from 'class-validator';

export class GeneratePeriodPayrollDto {
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth!: number;

  @IsInt()
  @Min(2000)
  periodYear!: number;
}