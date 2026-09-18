import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { EmailService } from '../email/email.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockNotificationsRepository = {
    create: jest.fn(),
    createMany: jest.fn(),
    findAdminHrUserIds: jest.fn(),
    findUserIdByEmployeeId: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    countUnread: jest.fn(),
    findById: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    findUserEmail: jest.fn(),
  };

  const mockEmailService = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: mockNotificationsRepository,
        },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
