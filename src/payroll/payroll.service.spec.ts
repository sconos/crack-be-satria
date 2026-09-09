// src/payroll/payroll.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollRepository } from './payroll.repository';

describe('PayrollService', () => {
  let service: PayrollService;

  const mockPayrollRepository = {
    findExisting: jest.fn(),
    findEmployeeById: jest.fn(),
    findActiveEmployeeIds: jest.fn(),
    findAttendanceStatuses: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findEmployeeIdByUserId: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const employeeId = 'employee-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        { provide: PayrollRepository, useValue: mockPayrollRepository },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateForEmployee', () => {
    it('throws ConflictException if payroll already exists for the period', async () => {
      mockPayrollRepository.findExisting.mockResolvedValue({ id: 'existing' });

      await expect(
        service.generateForEmployee({ employeeId, periodMonth: 9, periodYear: 2026 }),
      ).rejects.toThrow(ConflictException);
      expect(mockPayrollRepository.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if employee does not exist', async () => {
      mockPayrollRepository.findExisting.mockResolvedValue(null);
      mockPayrollRepository.findEmployeeById.mockResolvedValue(null);

      await expect(
        service.generateForEmployee({ employeeId, periodMonth: 9, periodYear: 2026 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('calculates deductions and net pay based on absent/late days', async () => {
      mockPayrollRepository.findExisting.mockResolvedValue(null);
      mockPayrollRepository.findEmployeeById.mockResolvedValue({
        id: employeeId,
        baseSalary: 22_000_000,
      });
      mockPayrollRepository.findAttendanceStatuses.mockResolvedValue([
        { status: 'ABSENT' },
        { status: 'ABSENT' },
        { status: 'LATE' },
        { status: 'PRESENT' },
      ]);
      mockPayrollRepository.create.mockImplementation((data) => data);

      const result = await service.generateForEmployee({
        employeeId,
        periodMonth: 9,
        periodYear: 2026,
      });

      expect(result.absentDays).toBe(2);
      expect(result.lateDays).toBe(1);
      expect(result.deductions).toBe(2_250_000);
      expect(result.netPay).toBe(19_750_000);
    });
  });

  describe('update', () => {
    it('throws BadRequestException when trying to edit a PAID record', async () => {
      mockPayrollRepository.findById.mockResolvedValue({
        id: 'payroll-1',
        status: 'PAID',
        baseSalary: 22_000_000,
        deductions: 0,
        allowances: 0,
      });

      await expect(
        service.update('payroll-1', { allowances: 500_000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('recalculates netPay when allowances change', async () => {
      mockPayrollRepository.findById.mockResolvedValue({
        id: 'payroll-1',
        status: 'DRAFT',
        baseSalary: 22_000_000,
        deductions: 2_250_000,
        allowances: 0,
      });
      mockPayrollRepository.update.mockImplementation((id, data) => data);

      const result = await service.update('payroll-1', { allowances: 1_000_000 });

      expect(result.netPay).toBe(20_750_000);
    });
  });

  describe('markPaid', () => {
    it('throws ConflictException if already paid', async () => {
      mockPayrollRepository.findById.mockResolvedValue({ id: 'payroll-1', status: 'PAID' });

      await expect(service.markPaid('payroll-1')).rejects.toThrow(ConflictException);
    });

    it('sets status to PAID and records paidAt', async () => {
      mockPayrollRepository.findById.mockResolvedValue({ id: 'payroll-1', status: 'DRAFT' });
      mockPayrollRepository.update.mockResolvedValue({
        id: 'payroll-1',
        status: 'PAID',
        paidAt: new Date(),
      });

      const result = await service.markPaid('payroll-1');

      expect(result.status).toBe('PAID');
      expect(mockPayrollRepository.update).toHaveBeenCalledWith(
        'payroll-1',
        expect.objectContaining({ status: 'PAID', paidAt: expect.any(Date) }),
      );
    });
  });
});