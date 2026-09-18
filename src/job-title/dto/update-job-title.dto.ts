import { IsString, MinLength } from 'class-validator';

export class UpdateJobTitleDto {
  @IsString()
  @MinLength(1)
  name!: string;
}