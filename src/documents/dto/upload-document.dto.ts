// src/documents/dto/upload-document.dto.ts
import { IsEnum } from 'class-validator';
import { DocumentType } from '../../../generated/prisma/client';

// file itself comes via multipart, handled separately by the FileInterceptor —
// this DTO only validates the accompanying form fields.
export class UploadDocumentDto {
  @IsEnum(DocumentType)
  type!: DocumentType;
}