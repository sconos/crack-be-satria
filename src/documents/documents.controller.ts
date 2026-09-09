// src/documents/documents.controller.ts
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { DOCUMENTS_UPLOAD_DIR, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from './documents.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: ['ID_CARD', 'CONTRACT', 'CERTIFICATE', 'TAX_FORM', 'OTHER'] },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: DOCUMENTS_UPLOAD_DIR,
        filename: (_req, file, callback) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only PDF, JPEG, and PNG files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  upload(
    @CurrentUser() user: { userId: string },
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.upload(user.userId, dto, file);
  }

  @Get('me')
  findMine(
    @CurrentUser() user: { userId: string },
    @Query() query: QueryDocumentDto,
  ) {
    return this.documentsService.findMyDocuments(user.userId, query);
  }

  @Roles('ADMIN', 'HR')
  @Get()
  findAll(@Query() query: QueryDocumentDto) {
    return this.documentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const document = await this.documentsService.findOne(id);
    const filePath = this.documentsService.getFilePath(document.storedName);
    res.download(filePath, document.fileName);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id/status')
  review(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: ReviewDocumentDto,
  ) {
    return this.documentsService.review(id, user.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}