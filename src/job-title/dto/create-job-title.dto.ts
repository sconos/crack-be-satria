import { IsString, MinLength } from 'class-validator';

export class CreateJobTitleDto {
  @IsString()
  @MinLength(1)
  name!: string;
}