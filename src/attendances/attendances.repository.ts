// src/attendances/attendances.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AttendanceStatus } from '../../generated/prisma/client';

@Injectable()
export class AttendancesRepository {
  constructor(private prisma: PrismaService) {}

  findEmployeeIdByUserId(userId: string) {
    return this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });
  }

  findByEmployeeAndDate(employeeId: string, date: Date) {
    return this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
  }

  create(data: {
    employeeId: string;
    date: Date;
    checkIn?: Date;
    checkOut?: Date;
    status: AttendanceStatus;
    notes?: string;
  }) {
    return this.prisma.attendance.create({ data });
  }

  updateById(id: string, data: Prisma.AttendanceUpdateInput) {
    return this.prisma.attendance.update({ where: { id }, data });
  }

  findMany(where: Prisma.AttendanceWhereInput, skip: number, take: number) {
    return this.prisma.attendance.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });
  }

  count(where: Prisma.AttendanceWhereInput) {
    return this.prisma.attendance.count({ where });
  }

  findById(id: string) {
    return this.prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });
  }

  delete(id: string) {
    return this.prisma.attendance.delete({ where: { id } });
  }
}