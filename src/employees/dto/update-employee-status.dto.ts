// src/employees/dto/update-employee-status.dto.ts
import { IsEnum } from 'class-validator';
import { EmploymentStatus } from '../../../generated/prisma/client';

export class UpdateEmployeeStatusDto {
  @IsEnum(EmploymentStatus)
  status!: EmploymentStatus;
}