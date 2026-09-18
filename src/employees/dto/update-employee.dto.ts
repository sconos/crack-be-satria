// src/employees/dto/update-employee.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsEmail, IsOptional } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['email', 'password', 'role'] as const),
) {
  @IsOptional()
  @IsEmail()
  email?: string;
}