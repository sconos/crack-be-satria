// src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { LeaveUtilizationQueryDto } from './dto/leave-utilization-query.dto';
import { DepartmentStatus } from '../../generated/prisma/client';

export interface HeadcountRow {
  departmentId: string | null;
  departmentName: string;
  departmentStatus: DepartmentStatus | null;
  headcount: number;
}

@Injectable()
export class ReportsService {
  constructor(private reportsRepository: ReportsRepository) {}

  async getHeadcountByDepartment() {
    const [departments, unassignedCount] = await Promise.all([
      this.reportsRepository.findAllDepartmentsWithEmployeeCounts(),
      this.reportsRepository.countEmployeesWithoutDepartment(),
    ]);

    const rows: HeadcountRow[] = departments.map((dept) => ({
      departmentId: dept.id,
      departmentName: dept.name,
      departmentStatus: dept.status,
      headcount: dept._count.employees,
    }));

    if (unassignedCount > 0) {
      rows.push({
        departmentId: null,
        departmentName: 'Unassigned',
        departmentStatus: null,
        headcount: unassignedCount,
      });
    }

    const totalHeadcount = rows.reduce((sum, r) => sum + r.headcount, 0);

    return { data: rows, totalHeadcount };
  }

  async getLeaveUtilizationByType(query: LeaveUtilizationQueryDto) {
    const year = query.year ?? new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const [leaveTypes, grouped] = await Promise.all([
      this.reportsRepository.findAllActiveLeaveTypes(),
      this.reportsRepository.groupLeaveRequestsByTypeAndStatus(yearStart, yearEnd),
    ]);

    const rows = leaveTypes.map((type) => {
      const rowsForType = grouped.filter((g) => g.leaveTypeId === type.id);

      const findCount = (status: string) =>
        rowsForType.find((r) => r.status === status)?._count._all ?? 0;

      const approvedDays =
        rowsForType.find((r) => r.status === 'APPROVED')?._sum.totalDays ?? 0;

      return {
        leaveTypeId: type.id,
        leaveTypeName: type.name,
        approvedCount: findCount('APPROVED'),
        pendingCount: findCount('PENDING'),
        rejectedCount: findCount('REJECTED'),
        cancelledCount: findCount('CANCELLED'),
        daysUsed: approvedDays,
      };
    });

    return { year, data: rows };
  }
}