// src/attendances/dto/create-attendance.dto.ts
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AttendanceStatus } from '../../../generated/prisma/client';

// Admin/HR manual entry
export class CreateAttendanceDto {
  @IsUUID()
  employeeId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}