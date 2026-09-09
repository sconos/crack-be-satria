// src/public-holidays/public-holidays.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PublicHolidaysService } from './public-holidays.service';
import { PublicHolidaysRepository } from './public-holidays.repository';

describe('PublicHolidaysService', () => {
  let service: PublicHolidaysService;

  const mockPublicHolidaysRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicHolidaysService,
        { provide: PublicHolidaysRepository, useValue: mockPublicHolidaysRepository },
      ],
    }).compile();

    service = module.get<PublicHolidaysService>(PublicHolidaysService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('remove', () => {
    it('throws NotFoundException when the holiday does not exist', async () => {
      mockPublicHolidaysRepository.findById.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
      expect(mockPublicHolidaysRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes the holiday when it exists', async () => {
      mockPublicHolidaysRepository.findById.mockResolvedValue({ id: 'holiday-1' });

      await service.remove('holiday-1');

      expect(mockPublicHolidaysRepository.delete).toHaveBeenCalledWith('holiday-1');
    });
  });
});