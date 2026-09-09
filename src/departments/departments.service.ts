// src/departments/departments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentStatusDto } from './dto/update-department-status.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private departmentsRepository: DepartmentsRepository) {}

  create(dto: CreateDepartmentDto) {
    return this.departmentsRepository.create(dto);
  }

  async findAll(query: QueryDepartmentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { code: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.departmentsRepository.findMany(where, (page - 1) * limit, limit),
      this.departmentsRepository.count(where),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const department = await this.departmentsRepository.findById(id);
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    return this.departmentsRepository.update(id, dto);
  }

  async updateStatus(id: string, dto: UpdateDepartmentStatusDto) {
    await this.findOne(id);
    return this.departmentsRepository.update(id, { status: dto.status });
  }

  findOrgChart() {
    return this.departmentsRepository.findOrgChartList();
  }
}