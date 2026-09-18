// src/employees/employees.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { EmployeesRepository } from './employees.repository';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeSelfDto } from './dto/update-employee-self.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { AVATAR_UPLOAD_DIR } from './employee-avatar.constants';

@Injectable()
export class EmployeesService {
  constructor(private employeesRepository: EmployeesRepository) {}

  async create(dto: CreateEmployeeDto) {
    const existing = await this.employeesRepository.findUserByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const employeeCode = await this.generateEmployeeCode();

    return this.employeesRepository.createWithUser({
      userData: { email: dto.email, password: hashedPassword, role: dto.role ?? 'EMPLOYEE' },
      employeeData: {
        employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        address: dto.address,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        nationalId: dto.nationalId,
        jobTitleId: dto.jobTitleId,
        departmentId: dto.departmentId,
        managerId: dto.managerId,
        workLocation: dto.workLocation,
        employmentType: dto.employmentType,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
        baseSalary: dto.baseSalary,
      },
    });
  }

  async findAll(query: QueryEmployeeDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      ...(query.department && { departmentId: query.department }),
      ...(query.employmentStatus && { employmentStatus: query.employmentStatus }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' as const } },
          { lastName: { contains: query.search, mode: 'insensitive' as const } },
          { employeeCode: { contains: query.search, mode: 'insensitive' as const } },
          { user: { email: { contains: query.search, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.employeesRepository.findMany(where, (page - 1) * limit, limit),
      this.employeesRepository.count(where),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const employee = await this.employeesRepository.findById(id);
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async findByUserId(userId: string) {
    const employee = await this.employeesRepository.findByUserId(userId);
    if (!employee) throw new NotFoundException('Employee profile not found');
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);

    if (dto.email && dto.email !== employee.user.email) {
      const existing = await this.employeesRepository.findUserByEmail(dto.email);
      if (existing) throw new ConflictException('Email already registered');
      await this.employeesRepository.updateUserEmail(employee.userId, dto.email);
    }

    const { email, ...employeeFields } = dto;
    return this.employeesRepository.update(id, {
      ...employeeFields,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
    });
  }

  async updateSelf(userId: string, dto: UpdateEmployeeSelfDto) {
    const employee = await this.findByUserId(userId);
    return this.employeesRepository.update(employee.id, dto);
  }

  async updateStatus(id: string, dto: UpdateEmployeeStatusDto) {
    await this.findOne(id);
    return this.employeesRepository.update(id, { employmentStatus: dto.status });
  }

  async updateAvatar(userId: string, newFilename: string | null) {
    const employee = await this.findByUserId(userId);
    if (employee.avatar && !employee.avatar.startsWith('data:')) {
      await this.deleteAvatarFile(employee.avatar).catch(() => {
      });
    }
    return this.employeesRepository.updateAvatar(employee.id, newFilename);
  }

  private deleteAvatarFile(filename: string) {
    return unlink(join(AVATAR_UPLOAD_DIR, filename));
  }

  findOrgChart() {
    return this.employeesRepository.findOrgChartList();
  }

  findDirectory() {
    return this.employeesRepository.findDirectoryList();
  }

  private async generateEmployeeCode(): Promise<string> {
    const count = await this.employeesRepository.countEmployees();
    return `EMP-${String(count + 1).padStart(4, '0')}`;
  }
}