// src/departments/departments.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

const DEPARTMENT_INCLUDE = {
  head: { select: { firstName: true, lastName: true } },
  _count: { select: { employees: true } },
} satisfies Prisma.DepartmentInclude;

@Injectable()
export class DepartmentsRepository {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.DepartmentUncheckedCreateInput) {
    return this.prisma.department.create({
      data,
      include: DEPARTMENT_INCLUDE,
    });
  }

  findMany(where: Prisma.DepartmentWhereInput, skip: number, take: number) {
    return this.prisma.department.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: DEPARTMENT_INCLUDE,
    });
  }

  count(where: Prisma.DepartmentWhereInput) {
    return this.prisma.department.count({ where });
  }

  findById(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      include: DEPARTMENT_INCLUDE,
    });
  }

  update(id: string, data: Prisma.DepartmentUpdateInput) {
    return this.prisma.department.update({
      where: { id },
      data,
      include: DEPARTMENT_INCLUDE,
    });
  }

  findOrgChartList() {
    return this.prisma.department.findMany({
      select: { id: true, name: true, parentId: true },
    });
  }
}