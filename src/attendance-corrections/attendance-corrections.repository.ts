// src/attendance-corrections/attendance-corrections.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, CorrectionStatus } from '../../generated/prisma/client';

@Injectable()
export class AttendanceCorrectionsRepository {
  constructor(private prisma: PrismaService) {}

  findEmployeeIdByUserId(userId: string) {
    return this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });
  }

  findAttendanceById(id: string) {
    return this.prisma.attendance.findUnique({ where: { id } });
  }

  updateAttendance(id: string, data: Prisma.AttendanceUpdateInput) {
    return this.prisma.attendance.update({ where: { id }, data });
  }

  create(data: {
    attendanceId: string;
    employeeId: string;
    requestedCheckIn?: Date;
    requestedCheckOut?: Date;
    reason: string;
  }) {
    return this.prisma.attendanceCorrectionRequest.create({ data });
  }

  findMany(where: Prisma.AttendanceCorrectionRequestWhereInput, skip: number, take: number) {
    return this.prisma.attendanceCorrectionRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        attendance: true,
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });
  }

  count(where: Prisma.AttendanceCorrectionRequestWhereInput) {
    return this.prisma.attendanceCorrectionRequest.count({ where });
  }

  findById(id: string) {
    return this.prisma.attendanceCorrectionRequest.findUnique({
      where: { id },
      include: {
        attendance: true,
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });
  }

  updateStatus(
    id: string,
    data: {
      status: CorrectionStatus;
      reviewedByUserId: string;
      reviewedAt: Date;
      rejectionReason?: string;
    },
  ) {
    return this.prisma.attendanceCorrectionRequest.update({ where: { id }, data });
  }
}