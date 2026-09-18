// src/attendances/attendances.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';

jest.mock('@nestjs/mapped-types', () => ({
  PartialType: (cls: any) => cls,
  OmitType: (cls: any) => cls,
}));

describe('AttendancesController', () => {
  let controller: AttendancesController;

  const mockAttendancesService = {
    checkIn: jest.fn(),
    checkOut: jest.fn(),
    findMyAttendance: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendancesController],
      providers: [
        { provide: AttendancesService, useValue: mockAttendancesService },
      ],
    }).compile();

    controller = module.get<AttendancesController>(AttendancesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});