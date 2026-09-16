// src/leave/dto/admin-create-leave-request.dto.ts
import { IsUUID } from 'class-validator';
import { CreateLeaveRequestDto } from './create-leave-request.dto';

// Same shape as self-service creation, plus which employee it's for.
export class AdminCreateLeaveRequestDto extends CreateLeaveRequestDto {
  @IsUUID()
  employeeId!: string;
}