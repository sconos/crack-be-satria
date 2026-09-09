// src/departments/departments.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

jest.mock('@nestjs/mapped-types', () => ({
  PartialType: (cls: any) => cls,
  OmitType: (cls: any) => cls,
}));

describe('DepartmentsController', () => {
  let controller: DepartmentsController;

  const mockDepartmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOrgChart: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [{ provide: DepartmentsService, useValue: mockDepartmentsService }],
    }).compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});