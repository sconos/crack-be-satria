// src/attendance-corrections/attendance-corrections.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttendanceCorrectionsService } from './attendance-corrections.service';
import { AttendanceCorrectionsRepository } from './attendance-corrections.repository';
import { CorrectionStatus } from '../../generated/prisma/client';

describe('AttendanceCorrectionsService', () => {
  let service: AttendanceCorrectionsService;
  let repository: jest.Mocked<AttendanceCorrectionsRepository>;

  const mockRepository = {
    findEmployeeIdByUserId: jest.fn(),
    findAttendanceById: jest.fn(),
    updateAttendance: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceCorrectionsService,
        { provide: AttendanceCorrectionsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(AttendanceCorrectionsService);
    repository = module.get(AttendanceCorrectionsRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 'user-1';
    const employeeId = 'employee-1';
    const dto = {
      attendanceId: 'attendance-1',
      reason: 'Forgot to clock in',
    };

    it('creates a correction request for the caller\'s own attendance record', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue({ id: employeeId });
      repository.findAttendanceById.mockResolvedValue({
        id: 'attendance-1',
        employeeId,
      } as any);
      repository.create.mockResolvedValue({ id: 'correction-1' } as any);

      const result = await service.create(userId, dto as any);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          attendanceId: dto.attendanceId,
          employeeId,
          reason: dto.reason,
        }),
      );
      expect(result).toEqual({ id: 'correction-1' });
    });

    it('throws NotFoundException when the caller has no employee profile', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue(null);

      await expect(service.create(userId, dto as any)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the attendance record does not exist', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue({ id: employeeId });
      repository.findAttendanceById.mockResolvedValue(null);

      await expect(service.create(userId, dto as any)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the attendance record belongs to someone else', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue({ id: employeeId });
      repository.findAttendanceById.mockResolvedValue({
        id: 'attendance-1',
        employeeId: 'someone-else',
      } as any);

      await expect(service.create(userId, dto as any)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('paginates and applies status/employeeId filters', async () => {
      repository.findMany.mockResolvedValue([{ id: 'correction-1' }] as any);
      repository.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 2,
        limit: 5,
        status: CorrectionStatus.PENDING,
        employeeId: 'employee-1',
      } as any);

      expect(repository.findMany).toHaveBeenCalledWith(
        { status: CorrectionStatus.PENDING, employeeId: 'employee-1' },
        5,
        5,
      );
      expect(result.meta).toEqual({ total: 1, page: 2, limit: 5, totalPages: 1 });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the request does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('returns the request when found', async () => {
      repository.findById.mockResolvedValue({ id: 'correction-1' } as any);

      await expect(service.findOne('correction-1')).resolves.toEqual({ id: 'correction-1' });
    });
  });

  describe('review', () => {
    const reviewerUserId = 'reviewer-1';
    const pendingRequest = {
      id: 'correction-1',
      status: CorrectionStatus.PENDING,
      attendanceId: 'attendance-1',
      requestedCheckIn: new Date('2026-01-01T09:00:00Z'),
      requestedCheckOut: new Date('2026-01-01T17:00:00Z'),
    };

    it('throws NotFoundException when the request does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.review('missing-id', reviewerUserId, { status: CorrectionStatus.APPROVED } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the request was already reviewed', async () => {
      repository.findById.mockResolvedValue({
        ...pendingRequest,
        status: CorrectionStatus.APPROVED,
      } as any);

      await expect(
        service.review('correction-1', reviewerUserId, { status: CorrectionStatus.APPROVED } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when rejecting without a rejectionReason', async () => {
      repository.findById.mockResolvedValue(pendingRequest as any);

      await expect(
        service.review('correction-1', reviewerUserId, { status: CorrectionStatus.REJECTED } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('approves the request and writes the requested times back onto the attendance record', async () => {
      repository.findById.mockResolvedValue(pendingRequest as any);
      repository.updateStatus.mockResolvedValue({
        ...pendingRequest,
        status: CorrectionStatus.APPROVED,
      } as any);

      const result = await service.review('correction-1', reviewerUserId, {
        status: CorrectionStatus.APPROVED,
      } as any);

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'correction-1',
        expect.objectContaining({
          status: CorrectionStatus.APPROVED,
          reviewedByUserId: reviewerUserId,
        }),
      );
      expect(repository.updateAttendance).toHaveBeenCalledWith('attendance-1', {
        checkIn: pendingRequest.requestedCheckIn,
        checkOut: pendingRequest.requestedCheckOut,
      });
      expect(result.status).toBe(CorrectionStatus.APPROVED);
    });

    it('rejects the request without touching the attendance record', async () => {
      repository.findById.mockResolvedValue(pendingRequest as any);
      repository.updateStatus.mockResolvedValue({
        ...pendingRequest,
        status: CorrectionStatus.REJECTED,
      } as any);

      await service.review('correction-1', reviewerUserId, {
        status: CorrectionStatus.REJECTED,
        rejectionReason: 'Times do not match the badge log',
      } as any);

      expect(repository.updateAttendance).not.toHaveBeenCalled();
    });
  });
});