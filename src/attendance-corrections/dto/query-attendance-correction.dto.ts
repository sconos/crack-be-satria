// src/attendance-corrections/dto/query-attendance-correction.dto.ts
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { CorrectionStatus } from '../../../generated/prisma/client';

export class QueryAttendanceCorrectionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsEnum(CorrectionStatus)
  status?: CorrectionStatus;
}