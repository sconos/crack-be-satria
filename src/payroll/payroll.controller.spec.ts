// src/payroll/payroll.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

describe('PayrollController', () => {
  let controller: PayrollController;

  const mockPayrollService = {
    generateForEmployee: jest.fn(),
    generateForPeriod: jest.fn(),
    findMyPayroll: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    markPaid: jest.fn(),
    generatePayslipPdf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollController],
      providers: [
        { provide: PayrollService, useValue: mockPayrollService },
      ],
    }).compile();

    controller = module.get<PayrollController>(PayrollController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});