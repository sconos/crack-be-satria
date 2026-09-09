// src/attendances/attendances.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { AttendancesRepository } from './attendances.repository';

describe('AttendancesService', () => {
  let service: AttendancesService;

  const mockAttendancesRepository = {
    findEmployeeIdByUserId: jest.fn(),
    findByEmployeeAndDate: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  };

  const userId = 'user-1';
  const employeeId = 'employee-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendancesService,
        { provide: AttendancesRepository, useValue: mockAttendancesRepository },
      ],
    }).compile();

    service = module.get<AttendancesService>(AttendancesService);
    mockAttendancesRepository.findEmployeeIdByUserId.mockResolvedValue({ id: employeeId });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkIn', () => {
    it('marks status PRESENT when checking in before the grace cutoff (09:15)', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-03T09:10:00'));
      mockAttendancesRepository.findByEmployeeAndDate.mockResolvedValue(null);
      mockAttendancesRepository.create.mockImplementation((data) => data);

      const result = await service.checkIn(userId);

      expect(result.status).toBe('PRESENT');
      expect(mockAttendancesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId, status: 'PRESENT' }),
      );
    });

    it('marks status LATE when checking in after the grace cutoff (09:15)', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-03T09:20:00'));
      mockAttendancesRepository.findByEmployeeAndDate.mockResolvedValue(null);
      mockAttendancesRepository.create.mockImplementation((data) => data);

      const result = await service.checkIn(userId);

      expect(result.status).toBe('LATE');
    });

    it('throws ConflictException if already checked in today', async () => {
      mockAttendancesRepository.findByEmployeeAndDate.mockResolvedValue({
        id: 'att-1',
        checkIn: new Date('2026-09-03T09:00:00'),
      });

      await expect(service.checkIn(userId)).rejects.toThrow(ConflictException);
      expect(mockAttendancesRepository.create).not.toHaveBeenCalled();
      expect(mockAttendancesRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('checkOut', () => {
    it('throws BadRequestException if no check-in exists yet', async () => {
      mockAttendancesRepository.findByEmployeeAndDate.mockResolvedValue(null);

      await expect(service.checkOut(userId)).rejects.toThrow(BadRequestException);
      expect(mockAttendancesRepository.updateById).not.toHaveBeenCalled();
    });

    it('throws ConflictException if already checked out today', async () => {
      mockAttendancesRepository.findByEmployeeAndDate.mockResolvedValue({
        id: 'att-1',
        checkIn: new Date('2026-09-03T09:00:00'),
        checkOut: new Date('2026-09-03T17:00:00'),
      });

      await expect(service.checkOut(userId)).rejects.toThrow(ConflictException);
    });

    it('records checkOut when checked in and not yet checked out', async () => {
      mockAttendancesRepository.findByEmployeeAndDate.mockResolvedValue({
        id: 'att-1',
        checkIn: new Date('2026-09-03T09:00:00'),
        checkOut: null,
      });
      mockAttendancesRepository.updateById.mockResolvedValue({ id: 'att-1' });

      await service.checkOut(userId);

      expect(mockAttendancesRepository.updateById).toHaveBeenCalledWith(
        'att-1',
        expect.objectContaining({ checkOut: expect.any(Date) }),
      );
    });
  });
});