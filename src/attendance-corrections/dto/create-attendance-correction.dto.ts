// src/attendance-corrections/dto/create-attendance-correction.dto.ts
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

// Employee self-service: request a correction against their own attendance record
export class CreateAttendanceCorrectionDto {
  @IsUUID()
  attendanceId!: string;

  @IsOptional()
  @IsDateString()
  requestedCheckIn?: string;

  @IsOptional()
  @IsDateString()
  requestedCheckOut?: string;

  @IsString()
  reason!: string;
}