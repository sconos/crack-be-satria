import { Test, TestingModule } from '@nestjs/testing';
import { JobTitleService } from './job-title.service';
import { JobTitleRepository } from './job-title.repository';

describe('JobTitleService', () => {
  let service: JobTitleService;

  const mockJobTitleRepository = {
    findMany: jest.fn(),
    findActive: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobTitleService,
        { provide: JobTitleRepository, useValue: mockJobTitleRepository },
      ],
    }).compile();

    service = module.get<JobTitleService>(JobTitleService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
