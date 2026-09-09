// src/leave-types/leave-types.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LeaveTypesController } from './leave-types.controller';
import { LeaveTypesService } from './leave-types.service';

jest.mock('@nestjs/mapped-types', () => ({
  PartialType: (cls: any) => cls,
  OmitType: (cls: any) => cls,
}));

describe('LeaveTypesController', () => {
  let controller: LeaveTypesController;

  const mockLeaveTypesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findActive: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveTypesController],
      providers: [{ provide: LeaveTypesService, useValue: mockLeaveTypesService }],
    }).compile();

    controller = module.get<LeaveTypesController>(LeaveTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});