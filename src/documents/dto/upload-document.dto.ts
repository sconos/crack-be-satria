// src/documents/dto/upload-document.dto.ts
import { IsEnum } from 'class-validator';
import { DocumentType } from '../../../generated/prisma/client';

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  type!: DocumentType;
}