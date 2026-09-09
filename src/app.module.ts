import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendancesModule } from './attendances/attendances.module';
import { PayrollModule } from './payroll/payroll.module';
import { LeaveModule } from './leave/leave.module';
import { DepartmentsModule } from './departments/departments.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { PublicHolidaysModule } from './public-holidays/public-holidays.module';
import { DocumentsModule } from './documents/documents.module';
import { ReportsModule } from './reports/reports.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [PrismaModule, AuthModule, EmployeesModule, AttendancesModule, PayrollModule, LeaveModule, DepartmentsModule, LeaveTypesModule, PublicHolidaysModule, DocumentsModule, ReportsModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
