// src/employees/employees.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

jest.mock('@nestjs/mapped-types', () => ({
  PartialType: (cls: any) => cls,
  OmitType: (cls: any) => cls,
}));

describe('EmployeesController', () => {
  let controller: EmployeesController;

  const mockEmployeesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOrgChart: jest.fn(),
    findOne: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    updateSelf: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [{ provide: EmployeesService, useValue: mockEmployeesService }],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});