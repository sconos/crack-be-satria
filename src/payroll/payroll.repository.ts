// src/payroll/payroll.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class PayrollRepository {
  constructor(private prisma: PrismaService) {}

  findExisting(employeeId: string, periodMonth: number, periodYear: number) {
    return this.prisma.payroll.findUnique({
      where: { employeeId_periodMonth_periodYear: { employeeId, periodMonth, periodYear } },
    });
  }

  findEmployeeById(id: string) {
    return this.prisma.employee.findUnique({ where: { id } });
  }

  findActiveEmployeeIds() {
    return this.prisma.employee.findMany({
      where: { employmentStatus: 'ACTIVE' },
      select: { id: true },
    });
  }

  findAttendanceStatuses(employeeId: string, startDate: Date, endDate: Date) {
    return this.prisma.attendance.findMany({
      where: { employeeId, date: { gte: startDate, lte: endDate } },
      select: { status: true },
    });
  }

  create(data: Prisma.PayrollUncheckedCreateInput) {
    return this.prisma.payroll.create({ data });
  }

  findMany(where: Prisma.PayrollWhereInput, skip: number, take: number) {
    return this.prisma.payroll.findMany({
      where,
      skip,
      take,
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });
  }

  count(where: Prisma.PayrollWhereInput) {
    return this.prisma.payroll.count({ where });
  }

  findEmployeeIdByUserId(userId: string) {
    return this.prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  }

  findById(id: string) {
    return this.prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, position: true, department: true },
        },
      },
    });
  }

  update(id: string, data: Prisma.PayrollUpdateInput) {
    return this.prisma.payroll.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.payroll.delete({ where: { id } });
  }
}