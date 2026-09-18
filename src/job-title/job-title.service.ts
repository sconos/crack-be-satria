import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JobTitleRepository } from './job-title.repository';
import { CreateJobTitleDto } from './dto/create-job-title.dto';
import { UpdateJobTitleDto } from './dto/update-job-title.dto';

@Injectable()
export class JobTitleService {
  constructor(private jobTitlesRepository: JobTitleRepository) {}

  findAll() {
    return this.jobTitlesRepository.findMany();
  }

  findActive() {
    return this.jobTitlesRepository.findActive();
  }

  async create(dto: CreateJobTitleDto) {
    const existing = await this.jobTitlesRepository.findByName(dto.name);
    if (existing) throw new ConflictException('Job title already exists');
    return this.jobTitlesRepository.create({ name: dto.name });
  }

  async update(id: string, dto: UpdateJobTitleDto) {
    const existing = await this.jobTitlesRepository.findById(id);
    if (!existing) throw new NotFoundException('Job title not found');

    if (dto.name !== existing.name) {
      const nameTaken = await this.jobTitlesRepository.findByName(dto.name);
      if (nameTaken) throw new ConflictException('Job title already exists');
    }

    return this.jobTitlesRepository.update(id, dto.name);
  }

  updateStatus(id: string, isActive: boolean) {
    return this.jobTitlesRepository.updateStatus(id, isActive);
  }
}