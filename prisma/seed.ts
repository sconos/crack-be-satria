// prisma/seed.ts
import { PrismaClient, Employee } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('password123', 10);

  // --- Admin & HR ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@korohrm.com' },
    update: {},
    create: { email: 'admin@korohrm.com', password, role: 'ADMIN' },
  });

  const hr = await prisma.user.upsert({
    where: { email: 'hr@korohrm.com' },
    update: {},
    create: { email: 'hr@korohrm.com', password, role: 'HR' },
  });

  // --- Departments ---
  const engineering = await prisma.department.upsert({
    where: { code: 'ENG' },
    update: {},
    create: { name: 'Engineering', code: 'ENG', location: 'Jakarta HQ' },
  });

  const sales = await prisma.department.upsert({
    where: { code: 'SLS' },
    update: {},
    create: { name: 'Sales', code: 'SLS', location: 'Jakarta HQ' },
  });

  const marketing = await prisma.department.upsert({
    where: { code: 'MKT' },
    update: {},
    create: { name: 'Marketing', code: 'MKT', location: 'Jakarta HQ' },
  });

  const finance = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: { name: 'Finance', code: 'FIN', location: 'Jakarta HQ' },
  });

  // --- Employees ---
  const employeeSeeds = [
    { firstName: 'Budi', lastName: 'Santoso', position: 'Engineering Manager', department: engineering, baseSalary: 22_000_000, managerId: null as string | null },
    { firstName: 'Siti', lastName: 'Rahayu', position: 'Frontend Engineer', department: engineering, baseSalary: 14_000_000, managerId: null as string | null },
    { firstName: 'Andi', lastName: 'Wijaya', position: 'Sales Executive', department: sales, baseSalary: 10_000_000, managerId: null as string | null },
    { firstName: 'Dewi', lastName: 'Lestari', position: 'Marketing Specialist', department: marketing, baseSalary: 11_000_000, managerId: null as string | null },
    { firstName: 'Rudi', lastName: 'Hartono', position: 'Finance Analyst', department: finance, baseSalary: 12_000_000, managerId: null as string | null },
  ];

  const employees: Employee[] = [];
  for (let i = 0; i < employeeSeeds.length; i++) {
    const seed = employeeSeeds[i];
    const email = `${seed.firstName.toLowerCase()}.${seed.lastName.toLowerCase()}@korohrm.com`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, password, role: 'EMPLOYEE' },
    });

    const employee = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        employeeCode: `EMP-${String(i + 1).padStart(4, '0')}`,
        firstName: seed.firstName,
        lastName: seed.lastName,
        phone: `08123456${String(i).padStart(4, '0')}`,
        position: seed.position,
        departmentId: seed.department.id,
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        baseSalary: seed.baseSalary,
        hireDate: new Date(2024, i, 1),
        userId: user.id,
        // Siti reports to Budi (index 0); everyone else has no manager for now
        managerId: i === 1 ? employees[0]?.id : undefined,
      },
    });

    employees.push(employee);
  }

  // set Budi as the Engineering department head, now that his employee record exists
  await prisma.department.update({
    where: { id: engineering.id },
    data: { headId: employees[0].id },
  });

  // --- Attendance: last 5 working days for each employee ---
  const today = new Date();
  for (const employee of employees) {
    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

      const isLate = Math.random() < 0.2;
      const checkIn = new Date(date);
      checkIn.setHours(isLate ? 9 : 8, isLate ? 30 : 55, 0, 0);

      const checkOut = new Date(date);
      checkOut.setHours(17, 30, 0, 0);

      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: employee.id, date } },
        update: {},
        create: {
          employeeId: employee.id,
          date,
          checkIn,
          checkOut,
          status: isLate ? 'LATE' : 'PRESENT',
        },
      });
    }
  }

  // --- Payroll: last month for each employee ---
  const lastMonth = today.getMonth() === 0 ? 12 : today.getMonth();
  const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();

  for (const employee of employees) {
    const baseSalary = Number(employee.baseSalary);
    await prisma.payroll.upsert({
      where: {
        employeeId_periodMonth_periodYear: {
          employeeId: employee.id,
          periodMonth: lastMonth,
          periodYear: lastMonthYear,
        },
      },
      update: {},
      create: {
        employeeId: employee.id,
        periodMonth: lastMonth,
        periodYear: lastMonthYear,
        baseSalary,
        allowances: 500_000,
        deductions: 0,
        netPay: baseSalary + 500_000,
        absentDays: 0,
        lateDays: 0,
        status: 'PAID',
        paidAt: new Date(lastMonthYear, lastMonth, 1),
      },
    });
  }

  // --- Leave Types ---
  const annualLeave = await prisma.leaveTypeConfig.upsert({
    where: { name: 'Annual Leave' },
    update: {},
    create: { name: 'Annual Leave', defaultAllocation: 12, isPaid: true },
  });

  const sickLeave = await prisma.leaveTypeConfig.upsert({
    where: { name: 'Sick Leave' },
    update: {},
    create: { name: 'Sick Leave', defaultAllocation: 12, isPaid: true },
  });

  await prisma.leaveTypeConfig.upsert({
    where: { name: 'Unpaid Leave' },
    update: {},
    create: { name: 'Unpaid Leave', defaultAllocation: 0, isPaid: false }, // 0 = no quota cap
  });

  // --- Public Holidays (Indonesia, remainder of 2026 — illustrative) ---
  const holidays = [
    { name: 'Hari Kemerdekaan RI', date: new Date(2026, 7, 17) },
    { name: 'Hari Natal', date: new Date(2026, 11, 25) },
  ];
  for (const holiday of holidays) {
    await prisma.publicHoliday.upsert({
      where: { id: `seed-${holiday.name}` }, // not a real unique constraint match — see note below
      update: {},
      create: holiday,
    }).catch(async () => {
      // PublicHoliday has no natural unique key, so upsert-by-id won't match on rerun;
      // fall back to findFirst + createIfMissing for idempotency.
      const existing = await prisma.publicHoliday.findFirst({ where: { name: holiday.name } });
      if (!existing) await prisma.publicHoliday.create({ data: holiday });
    });
  }

  // --- Leave requests: one pending, one approved ---
  const existingPending = await prisma.leaveRequest.findFirst({
    where: { employeeId: employees[0].id, reason: 'Family vacation' },
  });
  if (!existingPending) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: employees[0].id,
        leaveTypeId: annualLeave.id,
        startDate: new Date(today.getFullYear(), today.getMonth(), 20),
        endDate: new Date(today.getFullYear(), today.getMonth(), 22),
        totalDays: 3,
        reason: 'Family vacation',
        status: 'PENDING',
      },
    });
  }

  const existingApproved = await prisma.leaveRequest.findFirst({
    where: { employeeId: employees[1].id, reason: 'Fever' },
  });
  if (!existingApproved) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: employees[1].id,
        leaveTypeId: sickLeave.id,
        startDate: new Date(today.getFullYear(), today.getMonth(), 5),
        endDate: new Date(today.getFullYear(), today.getMonth(), 5),
        totalDays: 1,
        reason: 'Fever',
        status: 'APPROVED',
        reviewedByUserId: hr.id,
        reviewedAt: new Date(),
      },
    });
  }

  console.log('Seed complete.');
  console.log(`Admin login:    admin@korohrm.com / password123`);
  console.log(`HR login:       hr@korohrm.com / password123`);
  console.log(`Employee login: budi.santoso@korohrm.com / password123 (or any seeded employee)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });