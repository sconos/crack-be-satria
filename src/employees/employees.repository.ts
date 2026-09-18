// src/employees/employees.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

const EMPLOYEE_INCLUDE = {
  user: { select: { email: true, role: true, isActive: true } },
  department: { select: { id: true, name: true } },
  manager: { select: { id: true, firstName: true, lastName: true } },
  jobTitle: { select: { id: true, name: true } },
} satisfies Prisma.EmployeeInclude;

@Injectable()
export class EmployeesRepository {
  constructor(private prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  updateUserEmail(userId: string, email: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { email } });
  }

  updateAvatar(id: string, filename: string | null) {
    return this.prisma.employee.update({
      where: { id },
      data: { avatar: filename },
      include: EMPLOYEE_INCLUDE,
    });
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
        include: EMPLOYEE_INCLUDE,
      });
    });
  }

  findMany(where: Prisma.EmployeeWhereInput, skip: number, take: number) {
    return this.prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: EMPLOYEE_INCLUDE,
    });
  }

  count(where: Prisma.EmployeeWhereInput) {
    return this.prisma.employee.count({ where });
  }

  findById(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: EMPLOYEE_INCLUDE,
    });
  }

  findByUserId(userId: string) {
    return this.prisma.employee.findUnique({
      where: { userId },
      include: EMPLOYEE_INCLUDE,
    });
  }

  update(id: string, data: Prisma.EmployeeUpdateInput) {
    return this.prisma.employee.update({
      where: { id },
      data,
      include: EMPLOYEE_INCLUDE,
    });
  }

  findOrgChartList() {
    return this.prisma.employee.findMany({
      select: { id: true, firstName: true, lastName: true, managerId: true },
    });
  }

  findDirectoryList() {
    return this.prisma.employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobTitle: { select: { name: true } },
        avatar: true,
        phone: true,
        managerId: true,
        department: { select: { name: true } },
        user: { select: { email: true } },
      },
      orderBy: { firstName: 'asc' },
    });
  }
}