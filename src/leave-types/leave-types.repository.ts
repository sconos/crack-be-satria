// src/leave-types/leave-types.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class LeaveTypesRepository {
  constructor(private prisma: PrismaService) {}

  findByName(name: string) {
    return this.prisma.leaveTypeConfig.findUnique({ where: { name } });
  }

  create(data: Prisma.LeaveTypeConfigCreateInput) {
    return this.prisma.leaveTypeConfig.create({ data });
  }

  findAll() {
    return this.prisma.leaveTypeConfig.findMany({ orderBy: { name: 'asc' } });
  }

  findActive() {
    return this.prisma.leaveTypeConfig.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.leaveTypeConfig.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.LeaveTypeConfigUpdateInput) {
    return this.prisma.leaveTypeConfig.update({ where: { id }, data });
  }
}