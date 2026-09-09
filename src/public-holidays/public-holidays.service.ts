// src/public-holidays/public-holidays.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicHolidaysRepository } from './public-holidays.repository';
import { CreatePublicHolidayDto } from './dto/create-public-holiday.dto';

@Injectable()
export class PublicHolidaysService {
  constructor(private publicHolidaysRepository: PublicHolidaysRepository) {}

  create(dto: CreatePublicHolidayDto) {
    return this.publicHolidaysRepository.create({ name: dto.name, date: new Date(dto.date) });
  }

  findAll() {
    return this.publicHolidaysRepository.findAll();
  }

  async remove(id: string) {
    const holiday = await this.publicHolidaysRepository.findById(id);
    if (!holiday) throw new NotFoundException('Public holiday not found');
    return this.publicHolidaysRepository.delete(id);
  }
}