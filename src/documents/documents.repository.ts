// src/documents/documents.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class DocumentsRepository {
  constructor(private prisma: PrismaService) {}

  findEmployeeIdByUserId(userId: string) {
    return this.prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  }

  create(data: Prisma.EmployeeDocumentUncheckedCreateInput) {
    return this.prisma.employeeDocument.create({ data });
  }

  findMany(where: Prisma.EmployeeDocumentWhereInput, skip: number, take: number) {
    return this.prisma.employeeDocument.findMany({
      where,
      skip,
      take,
      orderBy: { uploadedAt: 'desc' },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });
  }

  count(where: Prisma.EmployeeDocumentWhereInput) {
    return this.prisma.employeeDocument.count({ where });
  }

  findById(id: string) {
    return this.prisma.employeeDocument.findUnique({
      where: { id },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });
  }

  update(id: string, data: Prisma.EmployeeDocumentUpdateInput) {
    return this.prisma.employeeDocument.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.employeeDocument.delete({ where: { id } });
  }
}