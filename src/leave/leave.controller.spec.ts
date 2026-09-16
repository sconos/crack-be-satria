// src/leave/leave.controller.spec.ts — update mock method names for findMyBalances (plural)
import { Test, TestingModule } from '@nestjs/testing';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';

describe('LeaveController', () => {
  let controller: LeaveController;

  const mockLeaveService = {
    create: jest.fn(),
    createForEmployee: jest.fn(),
    findMyRequests: jest.fn(),
    findMyBalances: jest.fn(),
    cancel: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    review: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveController],
      providers: [{ provide: LeaveService, useValue: mockLeaveService }],
    }).compile();

    controller = module.get<LeaveController>(LeaveController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createForEmployee', () => {
    it('delegates to service.createForEmployee with the request body', async () => {
      const dto = {
        employeeId: 'employee-1',
        leaveTypeId: 'leave-type-1',
        startDate: '2026-03-10',
        endDate: '2026-03-12',
        reason: 'Family event',
      };
      mockLeaveService.createForEmployee.mockResolvedValue({ id: 'leave-1', status: 'PENDING' });

      const result = await controller.createForEmployee(dto as any);

      expect(mockLeaveService.createForEmployee).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'leave-1', status: 'PENDING' });
    });
  });
});