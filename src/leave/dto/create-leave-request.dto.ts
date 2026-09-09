// src/leave/dto/create-leave-request.dto.ts
import { IsDateString, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsUUID()
  leaveTypeId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}