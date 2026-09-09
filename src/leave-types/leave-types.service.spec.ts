// src/leave-types/leave-types.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LeaveTypesService } from './leave-types.service';
import { LeaveTypesRepository } from './leave-types.repository';

describe('LeaveTypesService', () => {
  let service: LeaveTypesService;

  const mockLeaveTypesRepository = {
    findByName: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findActive: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveTypesService,
        { provide: LeaveTypesRepository, useValue: mockLeaveTypesRepository },
      ],
    }).compile();

    service = module.get<LeaveTypesService>(LeaveTypesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws ConflictException if a leave type with this name already exists', async () => {
      mockLeaveTypesRepository.findByName.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({ name: 'Annual Leave', defaultAllocation: 12 }),
      ).rejects.toThrow(ConflictException);
      expect(mockLeaveTypesRepository.create).not.toHaveBeenCalled();
    });

    it('defaults isPaid to true when not provided', async () => {
      mockLeaveTypesRepository.findByName.mockResolvedValue(null);
      mockLeaveTypesRepository.create.mockImplementation((data) => data);

      const result = await service.create({ name: 'Sick Leave', defaultAllocation: 12 });

      expect(result.isPaid).toBe(true);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the leave type does not exist', async () => {
      mockLeaveTypesRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });
  });
});