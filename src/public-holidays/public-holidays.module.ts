import { Module } from '@nestjs/common';
import { PublicHolidaysService } from './public-holidays.service';
import { PublicHolidaysController } from './public-holidays.controller';
import { PublicHolidaysRepository } from './public-holidays.repository';

@Module({
  controllers: [PublicHolidaysController],
  providers: [PublicHolidaysService, PublicHolidaysRepository],
})
export class PublicHolidaysModule {}
