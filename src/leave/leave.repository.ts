// src/leave/leave.repository.ts — add leave-type lookups, update includes
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class LeaveRepository {
  constructor(private prisma: PrismaService) {}

  findEmployeeIdByUserId(userId: string) {
    return this.prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  }

  findApprovedInYear(employeeId: string, leaveTypeId: string, yearStart: Date, yearEnd: Date) {
    return this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        leaveTypeId,
        status: 'APPROVED',
        startDate: { gte: yearStart, lte: yearEnd },
      },
      select: { totalDays: true },
    });
  }

  create(data: Prisma.LeaveRequestUncheckedCreateInput) {
    return this.prisma.leaveRequest.create({ data });
  }

  findMany(where: Prisma.LeaveRequestWhereInput, skip: number, take: number) {
    return this.prisma.leaveRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
        leaveType: { select: { name: true, isPaid: true } },
      },
    });
  }

  count(where: Prisma.LeaveRequestWhereInput) {
    return this.prisma.leaveRequest.count({ where });
  }

  findById(id: string) {
    return this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
        leaveType: { select: { name: true, isPaid: true } },
      },
    });
  }

  update(id: string, data: Prisma.LeaveRequestUpdateInput) {
    return this.prisma.leaveRequest.update({ where: { id }, data });
  }
}