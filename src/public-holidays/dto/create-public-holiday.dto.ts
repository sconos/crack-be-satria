// src/public-holidays/dto/create-public-holiday.dto.ts
import { IsDateString, IsString } from 'class-validator';

export class CreatePublicHolidayDto {
  @IsString()
  name!: string;

  @IsDateString()
  date!: string;
}