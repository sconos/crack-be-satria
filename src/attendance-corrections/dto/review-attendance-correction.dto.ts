// src/attendance-corrections/dto/review-attendance-correction.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CorrectionStatus } from '../../../generated/prisma/client';

export class ReviewAttendanceCorrectionDto {
  @IsEnum(CorrectionStatus, {
    message: 'status must be APPROVED or REJECTED',
  })
  status!: Extract<CorrectionStatus, 'APPROVED' | 'REJECTED'>;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}