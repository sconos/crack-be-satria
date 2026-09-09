// src/leave-types/dto/update-leave-type-status.dto.ts
import { IsBoolean } from 'class-validator';

export class UpdateLeaveTypeStatusDto {
  @IsBoolean()
  isActive!: boolean;
}