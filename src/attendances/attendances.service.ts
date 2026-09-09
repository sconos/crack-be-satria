// src/attendances/attendances.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendancesRepository } from './attendances.repository';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { WORK_START_HOUR, LATE_GRACE_MINUTES } from './attendance.constants';
import { AttendanceStatus } from '../../generated/prisma/client';

@Injectable()
export class AttendancesService {
  constructor(private attendancesRepository: AttendancesRepository) {}

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private computeStatus(checkIn: Date): AttendanceStatus {
    const cutoff = new Date(checkIn);
    cutoff.setHours(WORK_START_HOUR, LATE_GRACE_MINUTES, 0, 0);
    return checkIn > cutoff ? 'LATE' : 'PRESENT';
  }

  private async getEmployeeIdForUser(userId: string): Promise<string> {
    const employee = await this.attendancesRepository.findEmployeeIdByUserId(userId);
    if (!employee) throw new NotFoundException('Employee profile not found');
    return employee.id;
  }

  async checkIn(userId: string) {
    const employeeId = await this.getEmployeeIdForUser(userId);
    const today = this.startOfDay(new Date());

    const existing = await this.attendancesRepository.findByEmployeeAndDate(employeeId, today);
    if (existing?.checkIn) {
      throw new ConflictException('Already checked in today');
    }

    const now = new Date();
    const status = this.computeStatus(now);

    if (existing) {
      return this.attendancesRepository.updateById(existing.id, { checkIn: now, status });
    }

    return this.attendancesRepository.create({ employeeId, date: today, checkIn: now, status });
  }

  async checkOut(userId: string) {
    const employeeId = await this.getEmployeeIdForUser(userId);
    const today = this.startOfDay(new Date());

    const existing = await this.attendancesRepository.findByEmployeeAndDate(employeeId, today);
    if (!existing || !existing.checkIn) {
      throw new BadRequestException('Must check in before checking out');
    }
    if (existing.checkOut) {
      throw new ConflictException('Already checked out today');
    }

    return this.attendancesRepository.updateById(existing.id, { checkOut: new Date() });
  }

  async findMyAttendance(userId: string, query: QueryAttendanceDto) {
    const employeeId = await this.getEmployeeIdForUser(userId);
    return this.findAll({ ...query, employeeId });
  }

  async create(dto: CreateAttendanceDto) {
    const date = this.startOfDay(new Date(dto.date));

    const existing = await this.attendancesRepository.findByEmployeeAndDate(dto.employeeId, date);
    if (existing) {
      throw new ConflictException('Attendance record already exists for this employee/date');
    }

    const checkIn = dto.checkIn ? new Date(dto.checkIn) : undefined;
    const status = dto.status ?? (checkIn ? this.computeStatus(checkIn) : 'ABSENT');

    return this.attendancesRepository.create({
      employeeId: dto.employeeId,
      date,
      checkIn,
      checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
      status,
      notes: dto.notes,
    });
  }

  async findAll(query: QueryAttendanceDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      ...(query.employeeId && { employeeId: query.employeeId }),
      ...(query.status && { status: query.status }),
      ...((query.startDate || query.endDate) && {
        date: {
          ...(query.startDate && { gte: new Date(query.startDate) }),
          ...(query.endDate && { lte: new Date(query.endDate) }),
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.attendancesRepository.findMany(where, (page - 1) * limit, limit),
      this.attendancesRepository.count(where),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const record = await this.attendancesRepository.findById(id);
    if (!record) throw new NotFoundException('Attendance record not found');
    return record;
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    await this.findOne(id);
    return this.attendancesRepository.updateById(id, {
      ...dto,
      checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
      checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.attendancesRepository.delete(id);
  }
}