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

@Injectable()
export class DocumentsService {
  constructor(private documentsRepository: DocumentsRepository) {}

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

    return this.documentsRepository.create({
      employeeId,
      fileName: file.originalname,
      storedName: file.filename,
      type: dto.type,
    });
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
    await this.findOne(id);

    if (dto.decision === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestException('rejectionReason is required when rejecting');
    }

    return this.documentsRepository.update(id, {
      status: dto.decision,
      rejectionReason: dto.decision === 'REJECTED' ? dto.rejectionReason : null,
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
    });
  }

  getFilePath(storedName: string): string {
    return join(DOCUMENTS_UPLOAD_DIR, storedName);
  }

  async remove(id: string) {
    const document = await this.findOne(id);
    await this.documentsRepository.delete(id);

    // best-effort cleanup — don't fail the request if the file is already gone
    try {
      await unlink(this.getFilePath(document.storedName));
    } catch {
      // file missing on disk is not a failure condition here
    }
  }
}