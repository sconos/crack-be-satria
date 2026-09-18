import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class JobTitleRepository {
  constructor(private prisma: PrismaService) {}

  findMany() {
    return this.prisma.jobTitle.findMany({ orderBy: { name: 'asc' } });
  }

  findActive() {
    return this.prisma.jobTitle.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findByName(name: string) {
    return this.prisma.jobTitle.findUnique({ where: { name } });
  }

  create(data: Prisma.JobTitleCreateInput) {
    return this.prisma.jobTitle.create({ data });
  }

  findById(id: string) {
    return this.prisma.jobTitle.findUnique({ where: { id } });
  }

  update(id: string, name: string) {
    return this.prisma.jobTitle.update({ where: { id }, data: { name } });
  }

  updateStatus(id: string, isActive: boolean) {
    return this.prisma.jobTitle.update({ where: { id }, data: { isActive } });
  }
}