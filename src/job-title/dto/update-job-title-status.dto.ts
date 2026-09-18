import { IsBoolean } from 'class-validator';

export class UpdateJobTitleStatusDto {
  @IsBoolean()
  isActive!: boolean;
}