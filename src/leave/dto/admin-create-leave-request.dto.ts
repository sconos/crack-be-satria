// src/leave/dto/admin-create-leave-request.dto.ts
import { IsUUID } from 'class-validator';
import { CreateLeaveRequestDto } from './create-leave-request.dto';

export class AdminCreateLeaveRequestDto extends CreateLeaveRequestDto {
  @IsUUID()
  employeeId!: string;
}