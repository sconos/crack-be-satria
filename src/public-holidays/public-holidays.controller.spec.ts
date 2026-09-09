// src/public-holidays/public-holidays.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PublicHolidaysController } from './public-holidays.controller';
import { PublicHolidaysService } from './public-holidays.service';

describe('PublicHolidaysController', () => {
  let controller: PublicHolidaysController;

  const mockPublicHolidaysService = {
    create: jest.fn(),
    findAll: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicHolidaysController],
      providers: [{ provide: PublicHolidaysService, useValue: mockPublicHolidaysService }],
    }).compile();

    controller = module.get<PublicHolidaysController>(PublicHolidaysController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});