import { Module } from '@nestjs/common';
import { JobTitleService } from './job-title.service';
import { JobTitlesController } from './job-title.controller';
import { JobTitleRepository } from './job-title.repository';

@Module({
  controllers: [JobTitlesController],
  providers: [JobTitleService, JobTitleRepository],
  exports: [JobTitleService],
})
export class JobTitleModule  {}