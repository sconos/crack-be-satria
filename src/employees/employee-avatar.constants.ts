import { join } from 'path';

export const AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];