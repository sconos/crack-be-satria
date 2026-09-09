// src/reports/reports.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private prisma: PrismaService) {}

  findAllDepartmentsWithEmployeeCounts() {
    return this.prisma.department.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        _count: {
          select: {
            employees: { where: { employmentStatus: { not: 'INACTIVE' } } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  countEmployeesWithoutDepartment() {
    return this.prisma.employee.count({
      where: { departmentId: null, employmentStatus: { not: 'INACTIVE' } },
    });
  }

  findAllActiveLeaveTypes() {
    return this.prisma.leaveTypeConfig.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  groupLeaveRequestsByTypeAndStatus(yearStart: Date, yearEnd: Date) {
    return this.prisma.leaveRequest.groupBy({
      by: ['leaveTypeId', 'status'],
      where: { startDate: { gte: yearStart, lte: yearEnd } },
      _count: { _all: true },
      _sum: { totalDays: true },
    });
  }
}