// src/attendances/attendance.constants.ts
import { AttendanceStatus } from '../../generated/prisma/client';

export const WORK_START_HOUR = 9;
export const LATE_GRACE_MINUTES = 15;

export function computeAttendanceStatus(checkIn: Date): AttendanceStatus {
  const cutoff = new Date(checkIn);
  cutoff.setHours(WORK_START_HOUR, LATE_GRACE_MINUTES, 0, 0);
  return checkIn > cutoff ? 'LATE' : 'PRESENT';
}