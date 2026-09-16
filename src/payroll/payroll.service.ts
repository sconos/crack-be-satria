// src/payroll/payroll.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PayrollRepository } from './payroll.repository';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { GeneratePeriodPayrollDto } from './dto/generate-period-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { QueryPayrollDto } from './dto/query-payroll.dto';
import { WORKING_DAYS_PER_MONTH, LATE_DEDUCTION_RATE } from './payroll.constants';

// Matches the shape @CurrentUser() decorates the request with elsewhere
// (see leave.controller.ts, attendance-corrections.controller.ts) — if your
// actual current-user.decorator.ts uses different field names, adjust here
// and in the controller together.
interface RequestingUser {
  userId: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
}

@Injectable()
export class PayrollService {
  constructor(private payrollRepository: PayrollRepository) {}

  async generateForEmployee(dto: GeneratePayrollDto) {
    const existing = await this.payrollRepository.findExisting(
      dto.employeeId,
      dto.periodMonth,
      dto.periodYear,
    );
    if (existing) {
      throw new ConflictException('Payroll already generated for this employee/period');
    }

    const employee = await this.payrollRepository.findEmployeeById(dto.employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    const { absentDays, lateDays } = await this.getAttendanceCounts(
      dto.employeeId,
      dto.periodMonth,
      dto.periodYear,
    );

    const baseSalary = Number(employee.baseSalary);
    const dailyRate = baseSalary / WORKING_DAYS_PER_MONTH;
    const deductions = absentDays * dailyRate + lateDays * dailyRate * LATE_DEDUCTION_RATE;
    const netPay = baseSalary - deductions;

    return this.payrollRepository.create({
      employeeId: dto.employeeId,
      periodMonth: dto.periodMonth,
      periodYear: dto.periodYear,
      baseSalary,
      deductions,
      netPay,
      absentDays,
      lateDays,
    });
  }

  async generateForPeriod(dto: GeneratePeriodPayrollDto) {
    const employees = await this.payrollRepository.findActiveEmployeeIds();
    const results: { employeeId: string; success: boolean; error?: string }[] = [];

    for (const emp of employees) {
      try {
        await this.generateForEmployee({
          employeeId: emp.id,
          periodMonth: dto.periodMonth,
          periodYear: dto.periodYear,
        });
        results.push({ employeeId: emp.id, success: true });
      } catch (err) {
        results.push({
          employeeId: emp.id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private async getAttendanceCounts(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.payrollRepository.findAttendanceStatuses(
      employeeId,
      startDate,
      endDate,
    );

    return {
      absentDays: records.filter((r) => r.status === 'ABSENT').length,
      lateDays: records.filter((r) => r.status === 'LATE').length,
    };
  }

  async findAll(query: QueryPayrollDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      ...(query.employeeId && { employeeId: query.employeeId }),
      ...(query.periodMonth && { periodMonth: query.periodMonth }),
      ...(query.periodYear && { periodYear: query.periodYear }),
      ...(query.status && { status: query.status }),
    };

    const [data, total] = await Promise.all([
      this.payrollRepository.findMany(where, (page - 1) * limit, limit),
      this.payrollRepository.count(where),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findMyPayroll(userId: string, query: QueryPayrollDto) {
    const employee = await this.payrollRepository.findEmployeeIdByUserId(userId);
    if (!employee) throw new NotFoundException('Employee profile not found');
    return this.findAll({ ...query, employeeId: employee.id });
  }

  // Internal lookup with no ownership check — safe to use from update(),
  // markPaid(), remove(), all of which are @Roles('ADMIN', 'HR') at the
  // controller level already.
  private async getOrThrow(id: string) {
    const payroll = await this.payrollRepository.findById(id);
    if (!payroll) throw new NotFoundException('Payroll record not found');
    return payroll;
  }

  // ADMIN/HR can access any record; an EMPLOYEE can only access their own.
  private async assertCanAccess(
    payroll: { employeeId: string },
    requester: RequestingUser,
  ) {
    if (requester.role === 'ADMIN' || requester.role === 'HR') return;

    const employee = await this.payrollRepository.findEmployeeIdByUserId(requester.userId);
    if (!employee || employee.id !== payroll.employeeId) {
      throw new ForbiddenException('You can only access your own payroll records');
    }
  }

  // Public-facing lookup (GET /payroll/:id) — this is the one that was
  // missing an ownership check.
  async findOne(id: string, requester: RequestingUser) {
    const payroll = await this.getOrThrow(id);
    await this.assertCanAccess(payroll, requester);
    return payroll;
  }

  async update(id: string, dto: UpdatePayrollDto) {
    const payroll = await this.getOrThrow(id);
    if (payroll.status === 'PAID') {
      throw new BadRequestException('Cannot edit a payroll record that has already been paid');
    }

    const allowances = dto.allowances ?? Number(payroll.allowances);
    const netPay = Number(payroll.baseSalary) + allowances - Number(payroll.deductions);

    return this.payrollRepository.update(id, { allowances, notes: dto.notes, netPay });
  }

  async markPaid(id: string) {
    const payroll = await this.getOrThrow(id);
    if (payroll.status === 'PAID') {
      throw new ConflictException('Payroll record is already marked as paid');
    }

    return this.payrollRepository.update(id, { status: 'PAID', paidAt: new Date() });
  }

  async remove(id: string) {
    const payroll = await this.getOrThrow(id);
    if (payroll.status === 'PAID') {
      throw new BadRequestException('Cannot delete a payroll record that has already been paid');
    }
    return this.payrollRepository.delete(id);
  }

  async generatePayslipPdf(id: string, requester: RequestingUser): Promise<Buffer> {
    const payroll = await this.getOrThrow(id);
    await this.assertCanAccess(payroll, requester);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const monthName = new Date(payroll.periodYear, payroll.periodMonth - 1).toLocaleString('default', { month: 'long' });
      doc.fontSize(20).text('Koru HRM — Payslip', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${monthName} ${payroll.periodYear}`);
      doc.text(`Employee: ${payroll.employee.firstName} ${payroll.employee.lastName}`);
      doc.text(`Employee Code: ${payroll.employee.employeeCode}`);
      doc.text(`Position: ${payroll.employee.position} — ${payroll.employee.department}`);
      doc.moveDown();
      doc.fontSize(14).text('Earnings & Deductions', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Base Salary: Rp ${Number(payroll.baseSalary).toLocaleString('id-ID')}`);
      doc.text(`Allowances: Rp ${Number(payroll.allowances).toLocaleString('id-ID')}`);
      doc.text(`Deductions: Rp ${Number(payroll.deductions).toLocaleString('id-ID')} (Absent: ${payroll.absentDays} day(s), Late: ${payroll.lateDays} day(s))`);
      doc.moveDown();
      doc.fontSize(14).text(`Net Pay: Rp ${Number(payroll.netPay).toLocaleString('id-ID')}`, { underline: true });
      if (payroll.notes) {
        doc.moveDown();
        doc.fontSize(10).text(`Notes: ${payroll.notes}`);
      }
      doc.moveDown(2);
      doc.fontSize(10).text(`Status: ${payroll.status}${payroll.paidAt ? ` — Paid on ${payroll.paidAt.toLocaleDateString('id-ID')}` : ''}`);
      doc.end();
    });
  }
}