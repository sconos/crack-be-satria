// src/employees/dto/update-employee-self.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateEmployeeSelfDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
}