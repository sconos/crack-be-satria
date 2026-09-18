import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeaveRepository } from './leave.repository';
import { LeaveTypesRepository } from '../leave-types/leave-types.repository';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { AdminCreateLeaveRequestDto } from './dto/admin-create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LeaveService {
  constructor(
    private leaveRepository: LeaveRepository,
    private leaveTypesRepository: LeaveTypesRepository,
    private notificationsService: NotificationsService,
  ) {}

  private countDaysInclusive(start: Date, end: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
  }

  private async getEmployeeIdForUser(userId: string): Promise<string> {
    const employee = await this.leaveRepository.findEmployeeIdByUserId(userId);
    if (!employee) throw new NotFoundException('Employee profile not found');
    return employee.id;
  }

  private async buildAndCreate(
    employeeId: string,
    dto: CreateLeaveRequestDto,
  ) {
    const leaveType = await this.leaveTypesRepository.findById(dto.leaveTypeId);
    if (!leaveType) throw new NotFoundException('Leave type not found');
    if (!leaveType.isActive) throw new BadRequestException('This leave type is no longer active');

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('endDate cannot be before startDate');
    }
    const totalDays = this.countDaysInclusive(startDate, endDate);

    if (leaveType.defaultAllocation > 0) {
      const balance = await this.getBalance(employeeId, dto.leaveTypeId, startDate.getFullYear());
      if (totalDays > balance.remaining) {
        throw new BadRequestException(
          `Insufficient ${leaveType.name} balance: requested ${totalDays} day(s), ${balance.remaining} remaining`,
        );
      }
    }

    const request = await this.leaveRepository.create({
      employeeId,
      leaveTypeId: dto.leaveTypeId,
      startDate,
      endDate,
      totalDays,
      reason: dto.reason,
    });

    await this.notificationsService.notifyAdmins(
      'LEAVE_SUBMITTED',
      'New leave request',
      `A ${leaveType.name} request needs review.`,
      '/leave',
    );

    return request;
  }

  async create(userId: string, dto: CreateLeaveRequestDto) {
    const employeeId = await this.getEmployeeIdForUser(userId);
    return this.buildAndCreate(employeeId, dto);
  }

  async createForEmployee(dto: AdminCreateLeaveRequestDto) {
    const employee = await this.leaveRepository.findEmployeeById(dto.employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    return this.buildAndCreate(dto.employeeId, dto);
  }

  async getBalance(employeeId: string, leaveTypeId: string, year: number) {
    const leaveType = await this.leaveTypesRepository.findById(leaveTypeId);
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const approved = await this.leaveRepository.findApprovedInYear(employeeId, leaveTypeId, yearStart, yearEnd);
    const used = approved.reduce((sum, r) => sum + r.totalDays, 0);

    return {
      leaveType: leaveType.name,
      quota: leaveType.defaultAllocation,
      used,
      remaining: leaveType.defaultAllocation - used,
    };
  }

  async findMyBalances(userId: string, year: number) {
    const employeeId = await this.getEmployeeIdForUser(userId);
    const activeTypes = await this.leaveTypesRepository.findActive();

    return Promise.all(
      activeTypes.map((type) => this.getBalance(employeeId, type.id, year)),
    );
  }

  async findMyRequests(userId: string, query: QueryLeaveRequestDto) {
    const employeeId = await this.getEmployeeIdForUser(userId);
    return this.findAll({ ...query, employeeId });
  }

  async cancel(userId: string, id: string) {
    const employeeId = await this.getEmployeeIdForUser(userId);
    const request = await this.findOne(id);

    if (request.employeeId !== employeeId) throw new ForbiddenException('Not your leave request');
    if (request.status !== 'PENDING') throw new BadRequestException('Only pending requests can be cancelled');

    return this.leaveRepository.update(id, { status: 'CANCELLED' });
  }

  async findAll(query: QueryLeaveRequestDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      ...(query.employeeId && { employeeId: query.employeeId }),
      ...(query.status && { status: query.status }),
      ...(query.leaveTypeId && { leaveTypeId: query.leaveTypeId }),
    };

    const [data, total] = await Promise.all([
      this.leaveRepository.findMany(where, (page - 1) * limit, limit),
      this.leaveRepository.count(where),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const request = await this.leaveRepository.findById(id);
    if (!request) throw new NotFoundException('Leave request not found');
    return request;
  }

  async review(id: string, reviewerUserId: string, dto: ReviewLeaveRequestDto) {
    const request = await this.findOne(id);
    if (request.status !== 'PENDING') throw new ConflictException('This request has already been reviewed');
    if (dto.decision === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestException('rejectionReason is required when rejecting');
    }

    const updated = await this.leaveRepository.update(id, {
      status: dto.decision,
      rejectionReason: dto.decision === 'REJECTED' ? dto.rejectionReason : null,
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
    });

    await this.notificationsService.notifyEmployee(
      request.employeeId,
      'LEAVE_REVIEWED',
      dto.decision === 'APPROVED' ? 'Leave approved' : 'Leave rejected',
      dto.decision === 'APPROVED'
        ? 'Your leave request was approved.'
        : `Your leave request was rejected: ${dto.rejectionReason}`,
      '/portal/leave',
    );

    return updated;
  }
}