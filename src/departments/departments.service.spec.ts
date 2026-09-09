// src/departments/departments.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsRepository } from './departments.repository';

describe('DepartmentsService', () => {
  let service: DepartmentsService;

  const mockDepartmentsRepository = {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findOrgChartList: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: DepartmentsRepository, useValue: mockDepartmentsRepository },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('throws NotFoundException when the department does not exist', async () => {
      mockDepartmentsRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('updates status on an existing department', async () => {
      mockDepartmentsRepository.findById.mockResolvedValue({ id: 'dept-1' });
      mockDepartmentsRepository.update.mockResolvedValue({ id: 'dept-1', status: 'INACTIVE' });

      await service.updateStatus('dept-1', { status: 'INACTIVE' });

      expect(mockDepartmentsRepository.update).toHaveBeenCalledWith('dept-1', { status: 'INACTIVE' });
    });
  });
});