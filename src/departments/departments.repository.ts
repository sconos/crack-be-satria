// src/departments/departments.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class DepartmentsRepository {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.DepartmentUncheckedCreateInput) {
    return this.prisma.department.create({ data });
  }

  findMany(where: Prisma.DepartmentWhereInput, skip: number, take: number) {
    return this.prisma.department.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: {
        head: { select: { firstName: true, lastName: true } },
        _count: { select: { employees: true } },
      },
    });
  }

  count(where: Prisma.DepartmentWhereInput) {
    return this.prisma.department.count({ where });
  }

  findById(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      include: {
        head: { select: { firstName: true, lastName: true } },
        _count: { select: { employees: true } },
      },
    });
  }

  update(id: string, data: Prisma.DepartmentUpdateInput) {
    return this.prisma.department.update({ where: { id }, data });
  }

  findOrgChartList() {
    return this.prisma.department.findMany({
      select: { id: true, name: true, parentId: true },
    });
  }
}