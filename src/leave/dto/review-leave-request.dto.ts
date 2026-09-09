// src/leave/dto/review-leave-request.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReviewLeaveRequestDto {
  @IsEnum(['APPROVED', 'REJECTED'] as const)
  decision!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}