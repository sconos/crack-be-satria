// src/employees/employees.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesRepository } from './employees.repository';

describe('EmployeesService', () => {
  let service: EmployeesService;

  const mockEmployeesRepository = {
    findUserByEmail: jest.fn(),
    countEmployees: jest.fn(),
    createWithUser: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    findOrgChartList: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: EmployeesRepository, useValue: mockEmployeesRepository },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws ConflictException if the email is already registered', async () => {
      mockEmployeesRepository.findUserByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          email: 'taken@test.com',
          password: 'password123',
          firstName: 'A',
          lastName: 'B',
          position: 'Engineer',
        }),
      ).rejects.toThrow(ConflictException);
      expect(mockEmployeesRepository.createWithUser).not.toHaveBeenCalled();
    });

    it('generates a sequential employee code and creates the record', async () => {
      mockEmployeesRepository.findUserByEmail.mockResolvedValue(null);
      mockEmployeesRepository.countEmployees.mockResolvedValue(4);
      mockEmployeesRepository.createWithUser.mockResolvedValue({ id: 'emp-new' });

      await service.create({
        email: 'new@test.com',
        password: 'password123',
        firstName: 'A',
        lastName: 'B',
        position: 'Engineer',
        departmentId: 'dept-1',
      });

      expect(mockEmployeesRepository.createWithUser).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeData: expect.objectContaining({ employeeCode: 'EMP-0005' }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('updates employmentStatus on an existing employee', async () => {
      mockEmployeesRepository.findById.mockResolvedValue({ id: 'emp-1' });
      mockEmployeesRepository.update.mockResolvedValue({ id: 'emp-1', employmentStatus: 'INACTIVE' });

      await service.updateStatus('emp-1', { status: 'INACTIVE' });

      expect(mockEmployeesRepository.update).toHaveBeenCalledWith('emp-1', { employmentStatus: 'INACTIVE' });
    });
  });
});