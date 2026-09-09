// src/leave-types/leave-types.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveTypesRepository } from './leave-types.repository';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { UpdateLeaveTypeStatusDto } from './dto/update-leave-type-status.dto';

@Injectable()
export class LeaveTypesService {
  constructor(private leaveTypesRepository: LeaveTypesRepository) {}

  async create(dto: CreateLeaveTypeDto) {
    const existing = await this.leaveTypesRepository.findByName(dto.name);
    if (existing) throw new ConflictException('A leave type with this name already exists');

    return this.leaveTypesRepository.create({
      name: dto.name,
      defaultAllocation: dto.defaultAllocation,
      isPaid: dto.isPaid ?? true,
    });
  }

  findAll() {
    return this.leaveTypesRepository.findAll();
  }

  findActive() {
    return this.leaveTypesRepository.findActive();
  }

  async findOne(id: string) {
    const leaveType = await this.leaveTypesRepository.findById(id);
    if (!leaveType) throw new NotFoundException('Leave type not found');
    return leaveType;
  }

  async update(id: string, dto: UpdateLeaveTypeDto) {
    await this.findOne(id);
    return this.leaveTypesRepository.update(id, dto);
  }

  async updateStatus(id: string, dto: UpdateLeaveTypeStatusDto) {
    await this.findOne(id);
    return this.leaveTypesRepository.update(id, { isActive: dto.isActive });
  }
}