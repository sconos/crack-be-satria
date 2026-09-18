// src/documents/documents.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { DocumentsRepository } from './documents.repository';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { DOCUMENTS_UPLOAD_DIR } from './documents.constants';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DocumentsService {
  constructor(
    private documentsRepository: DocumentsRepository,
    private notificationsService: NotificationsService,
  ) {}

  private async getEmployeeIdForUser(userId: string): Promise<string> {
    const employee = await this.documentsRepository.findEmployeeIdByUserId(userId);
    if (!employee) throw new NotFoundException('Employee profile not found');
    return employee.id;
  }

  async upload(
    userId: string,
    dto: UploadDocumentDto,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const employeeId = await this.getEmployeeIdForUser(userId);

    const document = await this.documentsRepository.create({
      employeeId,
      fileName: file.originalname,
      storedName: file.filename,
      type: dto.type,
    });

    await this.notificationsService.notifyAdmins(
      'DOCUMENT_UPLOADED',
      'New document uploaded',
      `A ${dto.type} document needs review.`,
      '/employees',
    );

    return document;
  }

  async findMyDocuments(userId: string, query: QueryDocumentDto) {
    const employeeId = await this.getEmployeeIdForUser(userId);
    return this.findAll({ ...query, employeeId });
  }

  async findAll(query: QueryDocumentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      ...(query.employeeId && { employeeId: query.employeeId }),
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
    };

    const [data, total] = await Promise.all([
      this.documentsRepository.findMany(where, (page - 1) * limit, limit),
      this.documentsRepository.count(where),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const document = await this.documentsRepository.findById(id);
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async review(id: string, reviewerUserId: string, dto: ReviewDocumentDto) {
    const document = await this.findOne(id);

    if (dto.decision === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestException('rejectionReason is required when rejecting');
    }

    const updated = await this.documentsRepository.update(id, {
      status: dto.decision,
      rejectionReason: dto.decision === 'REJECTED' ? dto.rejectionReason : null,
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
    });

    await this.notificationsService.notifyEmployee(
      document.employeeId,
      'DOCUMENT_REVIEWED',
      dto.decision === 'VERIFIED' ? 'Document verified' : 'Document rejected',
      dto.decision === 'VERIFIED'
        ? `Your ${document.type} document was verified.`
        : `Your ${document.type} document was rejected: ${dto.rejectionReason}`,
      '/portal/documents',
    );

    return updated;
  }

  getFilePath(storedName: string): string {
    return join(DOCUMENTS_UPLOAD_DIR, storedName);
  }

  async remove(id: string) {
    const document = await this.findOne(id);
    await this.documentsRepository.delete(id);

    try {
      await unlink(this.getFilePath(document.storedName));
    } catch {
      // file missing on disk is not a failure condition here
    }
  }
}