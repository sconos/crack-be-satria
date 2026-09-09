// src/leave/leave.controller.spec.ts — update mock method names for findMyBalances (plural)
import { Test, TestingModule } from '@nestjs/testing';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';

describe('LeaveController', () => {
  let controller: LeaveController;

  const mockLeaveService = {
    create: jest.fn(),
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});