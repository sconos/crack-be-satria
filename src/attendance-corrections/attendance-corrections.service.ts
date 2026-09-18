// src/attendance-corrections/attendance-corrections.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceCorrectionsRepository } from './attendance-corrections.repository';
import { CreateAttendanceCorrectionDto } from './dto/create-attendance-correction.dto';
import { QueryAttendanceCorrectionDto } from './dto/query-attendance-correction.dto';
import { ReviewAttendanceCorrectionDto } from './dto/review-attendance-correction.dto';
import { computeAttendanceStatus } from '../attendances/attendance.constants';
import { CORRECTION_ERRORS } from './attendance-correction.constants';
import { CorrectionStatus, Prisma } from '../../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AttendanceCorrectionsService {
  constructor(
    private correctionsRepository: AttendanceCorrectionsRepository,
    private notificationsService: NotificationsService,
  ) {}

  private async getEmployeeIdForUser(userId: string): Promise<string> {
    const employee = await this.correctionsRepository.findEmployeeIdByUserId(userId);
    if (!employee) throw new NotFoundException('Employee profile not found');
    return employee.id;
  }

  async create(userId: string, dto: CreateAttendanceCorrectionDto) {
    const employeeId = await this.getEmployeeIdForUser(userId);

    const attendance = await this.correctionsRepository.findAttendanceById(dto.attendanceId);
    if (!attendance) {
      throw new NotFoundException(CORRECTION_ERRORS.ATTENDANCE_NOT_FOUND);
    }
    if (attendance.employeeId !== employeeId) {
      throw new ForbiddenException(CORRECTION_ERRORS.FORBIDDEN_OWNER);
    }

    const request = await this.correctionsRepository.create({
      attendanceId: dto.attendanceId,
      employeeId,
      requestedCheckIn: dto.requestedCheckIn ? new Date(dto.requestedCheckIn) : undefined,
      requestedCheckOut: dto.requestedCheckOut ? new Date(dto.requestedCheckOut) : undefined,
      reason: dto.reason,
    });

    await this.notificationsService.notifyAdmins(
      'CORRECTION_SUBMITTED',
      'New correction request',
      'An attendance correction needs review.',
      '/attendances',
    );

    return request;
  }

  async findAll(query: QueryAttendanceCorrectionDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      ...(query.employeeId && { employeeId: query.employeeId }),
      ...(query.status && { status: query.status }),
    };

    const [data, total] = await Promise.all([
      this.correctionsRepository.findMany(where, (page - 1) * limit, limit),
      this.correctionsRepository.count(where),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const request = await this.correctionsRepository.findById(id);
    if (!request) throw new NotFoundException(CORRECTION_ERRORS.REQUEST_NOT_FOUND);
    return request;
  }

  async findMyRequests(userId: string, query: QueryAttendanceCorrectionDto) {
    const employeeId = await this.getEmployeeIdForUser(userId);
    return this.findAll({ ...query, employeeId });
  }

  async review(id: string, reviewerUserId: string, dto: ReviewAttendanceCorrectionDto) {
    const request = await this.correctionsRepository.findById(id);
    if (!request) throw new NotFoundException(CORRECTION_ERRORS.REQUEST_NOT_FOUND);

    if (request.status !== CorrectionStatus.PENDING) {
      throw new BadRequestException(CORRECTION_ERRORS.ALREADY_REVIEWED);
    }
    if (dto.status === CorrectionStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('rejectionReason is required when rejecting a request');
    }

    const updated = await this.correctionsRepository.updateStatus(id, {
      status: dto.status,
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
      rejectionReason: dto.rejectionReason,
    });

    if (dto.status === CorrectionStatus.APPROVED) {
      const updateData: Prisma.AttendanceUpdateInput = {
        ...(request.requestedCheckIn && { checkIn: request.requestedCheckIn }),
        ...(request.requestedCheckOut && { checkOut: request.requestedCheckOut }),
      };

      if (request.requestedCheckIn) {
        updateData.status = computeAttendanceStatus(request.requestedCheckIn);
      }

      await this.correctionsRepository.updateAttendance(request.attendanceId, updateData);
    }

    await this.notificationsService.notifyEmployee(
      request.employeeId,
      'CORRECTION_REVIEWED',
      dto.status === CorrectionStatus.APPROVED ? 'Correction approved' : 'Correction rejected',
      dto.status === CorrectionStatus.APPROVED
        ? 'Your attendance correction request was approved.'
        : `Your attendance correction request was rejected: ${dto.rejectionReason}`,
      '/portal/attendance',
    );

    return updated;
  }
}