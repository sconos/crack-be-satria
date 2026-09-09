// src/payroll/dto/generate-period-payroll.dto.ts
import { IsInt, Max, Min } from 'class-validator';

// bulk-generate for every active employee in a period
export class GeneratePeriodPayrollDto {
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth!: number;

  @IsInt()
  @Min(2000)
  periodYear!: number;
}