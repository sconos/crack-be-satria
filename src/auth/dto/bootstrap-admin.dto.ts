// src/auth/dto/bootstrap-admin.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class BootstrapAdminDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}