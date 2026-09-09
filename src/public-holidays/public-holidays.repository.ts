// src/public-holidays/public-holidays.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicHolidaysRepository {
  constructor(private prisma: PrismaService) {}

  create(data: { name: string; date: Date }) {
    return this.prisma.publicHoliday.create({ data });
  }

  findAll() {
    return this.prisma.publicHoliday.findMany({ orderBy: { date: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.publicHoliday.findUnique({ where: { id } });
  }

  delete(id: string) {
    return this.prisma.publicHoliday.delete({ where: { id } });
  }
}