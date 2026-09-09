// src/documents/dto/review-document.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class ReviewDocumentDto {
  @IsString()
  decision!: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}