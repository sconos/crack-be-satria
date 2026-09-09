// src/documents/documents.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';

describe('DocumentsService', () => {
  let service: DocumentsService;

  const mockDocumentsRepository = {
    findEmployeeIdByUserId: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const userId = 'user-1';
  const employeeId = 'employee-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: DocumentsRepository, useValue: mockDocumentsRepository },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    mockDocumentsRepository.findEmployeeIdByUserId.mockResolvedValue({ id: employeeId });
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('throws BadRequestException when no file is provided', async () => {
      await expect(
        service.upload(userId, { type: 'ID_CARD' }, undefined as any),
      ).rejects.toThrow(BadRequestException);
      expect(mockDocumentsRepository.create).not.toHaveBeenCalled();
    });

    it('creates a document record from the uploaded file', async () => {
      mockDocumentsRepository.create.mockImplementation((data) => data);
      const fakeFile = { originalname: 'ktp.jpg', filename: 'uuid-generated.jpg' } as Express.Multer.File;

      const result = await service.upload(userId, { type: 'ID_CARD' }, fakeFile);

      expect(result.employeeId).toBe(employeeId);
      expect(result.fileName).toBe('ktp.jpg');
      expect(result.storedName).toBe('uuid-generated.jpg');
    });
  });

  describe('review', () => {
    it('throws NotFoundException if the document does not exist', async () => {
      mockDocumentsRepository.findById.mockResolvedValue(null);

      await expect(
        service.review('missing-id', 'reviewer-1', { decision: 'VERIFIED' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if rejecting without a reason', async () => {
      mockDocumentsRepository.findById.mockResolvedValue({ id: 'doc-1' });

      await expect(
        service.review('doc-1', 'reviewer-1', { decision: 'REJECTED' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('verifies a document successfully', async () => {
      mockDocumentsRepository.findById.mockResolvedValue({ id: 'doc-1' });
      mockDocumentsRepository.update.mockResolvedValue({ id: 'doc-1', status: 'VERIFIED' });

      const result = await service.review('doc-1', 'reviewer-1', { decision: 'VERIFIED' } as any);

      expect(result.status).toBe('VERIFIED');
    });
  });
});