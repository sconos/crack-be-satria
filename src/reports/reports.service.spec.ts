// src/reports/reports.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockReportsRepository = {
    findAllDepartmentsWithEmployeeCounts: jest.fn(),
    countEmployeesWithoutDepartment: jest.fn(),
    findAllActiveLeaveTypes: jest.fn(),
    groupLeaveRequestsByTypeAndStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: ReportsRepository, useValue: mockReportsRepository },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHeadcountByDepartment', () => {
    it('includes an Unassigned row only when there are employees with no department', async () => {
      mockReportsRepository.findAllDepartmentsWithEmployeeCounts.mockResolvedValue([
        { id: 'dept-1', name: 'Engineering', status: 'ACTIVE', _count: { employees: 5 } },
      ]);
      mockReportsRepository.countEmployeesWithoutDepartment.mockResolvedValue(2);

      const result = await service.getHeadcountByDepartment();

      expect(result.data).toHaveLength(2);
      expect(result.data[1]).toMatchObject({ departmentName: 'Unassigned', headcount: 2 });
      expect(result.totalHeadcount).toBe(7);
    });

    it('omits the Unassigned row when every employee has a department', async () => {
      mockReportsRepository.findAllDepartmentsWithEmployeeCounts.mockResolvedValue([
        { id: 'dept-1', name: 'Engineering', status: 'ACTIVE', _count: { employees: 5 } },
      ]);
      mockReportsRepository.countEmployeesWithoutDepartment.mockResolvedValue(0);

      const result = await service.getHeadcountByDepartment();

      expect(result.data).toHaveLength(1);
      expect(result.totalHeadcount).toBe(5);
    });
  });

  describe('getLeaveUtilizationByType', () => {
    it('counts daysUsed only from APPROVED requests, not pending/rejected', async () => {
      mockReportsRepository.findAllActiveLeaveTypes.mockResolvedValue([
        { id: 'leave-type-1', name: 'Annual Leave' },
      ]);
      mockReportsRepository.groupLeaveRequestsByTypeAndStatus.mockResolvedValue([
        { leaveTypeId: 'leave-type-1', status: 'APPROVED', _count: { _all: 3 }, _sum: { totalDays: 9 } },
        { leaveTypeId: 'leave-type-1', status: 'PENDING', _count: { _all: 2 }, _sum: { totalDays: 4 } },
        { leaveTypeId: 'leave-type-1', status: 'REJECTED', _count: { _all: 1 }, _sum: { totalDays: 2 } },
      ]);

      const result = await service.getLeaveUtilizationByType({ year: 2026 });

      expect(result.data[0]).toMatchObject({
        leaveTypeName: 'Annual Leave',
        approvedCount: 3,
        pendingCount: 2,
        rejectedCount: 1,
        cancelledCount: 0,
        daysUsed: 9,
      });
    });

    it('defaults counts to 0 for a leave type with no requests at all', async () => {
      mockReportsRepository.findAllActiveLeaveTypes.mockResolvedValue([
        { id: 'leave-type-1', name: 'Sick Leave' },
      ]);
      mockReportsRepository.groupLeaveRequestsByTypeAndStatus.mockResolvedValue([]);

      const result = await service.getLeaveUtilizationByType({});

      expect(result.data[0]).toMatchObject({
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        cancelledCount: 0,
        daysUsed: 0,
      });
    });
  });
});