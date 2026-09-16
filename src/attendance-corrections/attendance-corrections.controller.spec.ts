// src/attendance-corrections/attendance-corrections.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceCorrectionsController } from './attendance-corrections.controller';
import { AttendanceCorrectionsService } from './attendance-corrections.service';
import { CorrectionStatus } from '../../generated/prisma/client';

describe('AttendanceCorrectionsController', () => {
  let controller: AttendanceCorrectionsController;
  let service: jest.Mocked<AttendanceCorrectionsService>;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    review: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceCorrectionsController],
      providers: [{ provide: AttendanceCorrectionsService, useValue: mockService }],
    }).compile();

    controller = module.get(AttendanceCorrectionsController);
    service = module.get(AttendanceCorrectionsService);

    jest.clearAllMocks();
  });

  it('create() delegates to service.create with the caller\'s userId', async () => {
    const dto = { attendanceId: 'attendance-1', reason: 'Forgot to clock in' };
    service.create.mockResolvedValue({ id: 'correction-1' } as any);

    const result = await controller.create({ userId: 'user-1' }, dto as any);

    expect(service.create).toHaveBeenCalledWith('user-1', dto);
    expect(result).toEqual({ id: 'correction-1' });
  });

  it('findAll() delegates to service.findAll with the query', async () => {
    const query = { status: CorrectionStatus.PENDING };
    service.findAll.mockResolvedValue({ data: [], meta: {} } as any);

    await controller.findAll(query as any);

    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('findOne() delegates to service.findOne with the id', async () => {
    service.findOne.mockResolvedValue({ id: 'correction-1' } as any);

    const result = await controller.findOne('correction-1');

    expect(service.findOne).toHaveBeenCalledWith('correction-1');
    expect(result).toEqual({ id: 'correction-1' });
  });

  it('review() delegates to service.review with id, reviewer userId, and dto', async () => {
    const dto = { status: CorrectionStatus.APPROVED };
    service.review.mockResolvedValue({ id: 'correction-1', status: CorrectionStatus.APPROVED } as any);

    const result = await controller.review('correction-1', { userId: 'reviewer-1' }, dto as any);

    expect(service.review).toHaveBeenCalledWith('correction-1', 'reviewer-1', dto);
    expect(result.status).toBe(CorrectionStatus.APPROVED);
  });
});