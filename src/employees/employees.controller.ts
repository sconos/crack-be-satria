// src/employees/employees.controller.ts
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeSelfDto } from './dto/update-employee-self.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { AVATAR_UPLOAD_DIR, MAX_AVATAR_SIZE_BYTES, ALLOWED_AVATAR_MIME_TYPES } from './employee-avatar.constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Employees')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Roles('ADMIN', 'HR')
  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Roles('ADMIN', 'HR')
  @Get()
  findAll(@Query() query: QueryEmployeeDto) {
    return this.employeesService.findAll(query);
  }

  @Get('org-chart')
  findOrgChart() {
    return this.employeesService.findOrgChart();
  }

  @Get('directory')
  findDirectory() {
    return this.employeesService.findDirectory();
  }

  @Get('me')
  findMe(@CurrentUser() user: { userId: string }) {
    return this.employeesService.findByUserId(user.userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateEmployeeSelfDto,
  ) {
    return this.employeesService.updateSelf(user.userId, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: AVATAR_UPLOAD_DIR,
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_AVATAR_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only PNG, JPEG, WEBP, and GIF images are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.employeesService.updateAvatar(user.userId, file.filename);
  }

  @Delete('me/avatar')
  removeAvatar(@CurrentUser() user: { userId: string }) {
    return this.employeesService.updateAvatar(user.userId, null);
  }

  @Roles('ADMIN', 'HR')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Roles('ADMIN', 'HR')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEmployeeStatusDto) {
    return this.employeesService.updateStatus(id, dto);
  }
}