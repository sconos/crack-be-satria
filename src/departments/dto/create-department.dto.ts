// src/departments/dto/create-department.dto.ts
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  headId?: string;

  @IsOptional()
  @IsString()
  location?: string;
}