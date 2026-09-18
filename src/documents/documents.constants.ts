// src/documents/documents.constants.ts
import { join } from 'path';

export const DOCUMENTS_UPLOAD_DIR = join(process.cwd(), 'uploads', 'documents');
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];
export const MAX_FIELD_ARRAY_INDEX = 0;