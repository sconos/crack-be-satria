// src/employees/employees.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class EmployeesRepository {
  constructor(private prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  countEmployees() {
    return this.prisma.employee.count();
  }

  createWithUser(input: {
    userData: { email: string; password: string; role: any };
    employeeData: Omit<Prisma.EmployeeUncheckedCreateInput, 'userId'>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: input.userData });
      return tx.employee.create({
        data: { ...input.employeeData, userId: user.id },
      });
    });
  }

  findMany(where: Prisma.EmployeeWhereInput, skip: number, take: number) {
    return this.prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, role: true, isActive: true } },
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  count(where: Prisma.EmployeeWhereInput) {
    return this.prisma.employee.count({ where });
  }

  findById(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, role: true, isActive: true } },
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, role: true, isActive: true } },
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  update(id: string, data: Prisma.EmployeeUpdateInput) {
    return this.prisma.employee.update({ where: { id }, data });
  }

  findOrgChartList() {
    return this.prisma.employee.findMany({
      select: { id: true, firstName: true, lastName: true, managerId: true },
    });
  }
}