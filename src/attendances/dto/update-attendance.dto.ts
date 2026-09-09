// src/attendances/dto/update-attendance.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAttendanceDto } from './create-attendance.dto';

// employeeId/date shouldn't change on an existing record — delete and recreate if needed
export class UpdateAttendanceDto extends PartialType(
  OmitType(CreateAttendanceDto, ['employeeId', 'date'] as const),
) {}