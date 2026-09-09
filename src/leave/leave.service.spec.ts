// src/leave/leave.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveRepository } from './leave.repository';
import { LeaveTypesRepository } from '../leave-types/leave-types.repository';

describe('LeaveService', () => {
  let service: LeaveService;

  const mockLeaveRepository = {
    findEmployeeIdByUserId: jest.fn(),
    findApprovedInYear: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockLeaveTypesRepository = {
    findById: jest.fn(),
    findActive: jest.fn(),
  };

  const userId = 'user-1';
  const employeeId = 'employee-1';
  const leaveTypeId = 'leave-type-annual';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        { provide: LeaveRepository, useValue: mockLeaveRepository },
        { provide: LeaveTypesRepository, useValue: mockLeaveTypesRepository },
      ],
    }).compile();

    service = module.get<LeaveService>(LeaveService);
    mockLeaveRepository.findEmployeeIdByUserId.mockResolvedValue({ id: employeeId });
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws NotFoundException if the leave type does not exist', async () => {
      mockLeaveTypesRepository.findById.mockResolvedValue(null);

      await expect(
        service.create(userId, {
          leaveTypeId,
          startDate: '2026-09-10',
          endDate: '2026-09-11',
          reason: 'Trip',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if the leave type is inactive', async () => {
      mockLeaveTypesRepository.findById.mockResolvedValue({
        id: leaveTypeId,
        name: 'Annual Leave',
        isActive: false,
        defaultAllocation: 12,
      });

      await expect(
        service.create(userId, {
          leaveTypeId,
          startDate: '2026-09-10',
          endDate: '2026-09-11',
          reason: 'Trip',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a request that exceeds remaining balance', async () => {
      mockLeaveTypesRepository.findById.mockResolvedValue({
        id: leaveTypeId,
        name: 'Annual Leave',
        isActive: true,
        defaultAllocation: 12,
      });
      mockLeaveRepository.findApprovedInYear.mockResolvedValue([{ totalDays: 10 }]);

      await expect(
        service.create(userId, {
          leaveTypeId,
          startDate: '2026-09-10',
          endDate: '2026-09-13', // 4 days, only 2 remaining
          reason: 'Trip',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockLeaveRepository.create).not.toHaveBeenCalled();
    });

    it('allows a request within remaining balance', async () => {
      mockLeaveTypesRepository.findById.mockResolvedValue({
        id: leaveTypeId,
        name: 'Annual Leave',
        isActive: true,
        defaultAllocation: 12,
      });
      mockLeaveRepository.findApprovedInYear.mockResolvedValue([{ totalDays: 5 }]);
      mockLeaveRepository.create.mockImplementation((data) => data);

      const result = await service.create(userId, {
        leaveTypeId,
        startDate: '2026-09-10',
        endDate: '2026-09-11', // 2 days, 7 remaining
        reason: 'Trip',
      });

      expect(result.totalDays).toBe(2);
      expect(mockLeaveRepository.create).toHaveBeenCalled();
    });

    it('skips the balance check when defaultAllocation is 0 (e.g. unpaid leave)', async () => {
      mockLeaveTypesRepository.findById.mockResolvedValue({
        id: leaveTypeId,
        name: 'Unpaid Leave',
        isActive: true,
        defaultAllocation: 0,
      });
      mockLeaveRepository.create.mockImplementation((data) => data);

      await service.create(userId, {
        leaveTypeId,
        startDate: '2026-09-10',
        endDate: '2026-09-10',
        reason: 'Personal',
      });

      expect(mockLeaveRepository.findApprovedInYear).not.toHaveBeenCalled();
      expect(mockLeaveRepository.create).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('throws ForbiddenException if the request belongs to someone else', async () => {
      mockLeaveRepository.findById.mockResolvedValue({
        id: 'req-1',
        employeeId: 'someone-else',
        status: 'PENDING',
      });

      await expect(service.cancel(userId, 'req-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('review', () => {
    it('throws ConflictException if already reviewed', async () => {
      mockLeaveRepository.findById.mockResolvedValue({ id: 'req-1', status: 'APPROVED' });

      await expect(
        service.review('req-1', 'reviewer-1', { decision: 'APPROVED' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException if rejecting without a reason', async () => {
      mockLeaveRepository.findById.mockResolvedValue({ id: 'req-1', status: 'PENDING' });

      await expect(
        service.review('req-1', 'reviewer-1', { decision: 'REJECTED' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});