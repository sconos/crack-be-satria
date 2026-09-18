import { Test, TestingModule } from '@nestjs/testing';
import { JobTitlesController } from './job-title.controller';
import { JobTitleService } from './job-title.service';

describe('JobTitleController', () => {
  let controller: JobTitlesController;

  const mockJobTitleService = {
    findAll: jest.fn(),
    findActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobTitlesController],
      providers: [{ provide: JobTitleService, useValue: mockJobTitleService }],
    }).compile();

    controller = module.get<JobTitlesController>(JobTitlesController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
