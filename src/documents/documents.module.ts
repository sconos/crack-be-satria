// src/documents/documents.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MulterModule.register(), NotificationsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRepository],
})
export class DocumentsModule {}