// src/departments/dto/update-department-status.dto.ts
import { IsEnum } from 'class-validator';
import { DepartmentStatus } from '../../../generated/prisma/client';

export class UpdateDepartmentStatusDto {
  @IsEnum(DepartmentStatus)
  status!: DepartmentStatus;
}