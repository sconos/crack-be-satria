// src/leave-types/dto/create-leave-type.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  defaultAllocation!: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}