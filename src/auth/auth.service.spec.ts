// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    countByRole: jest.fn(),
    create: jest.fn(),
    updateRefreshToken: jest.fn(),
    setResetToken: jest.fn(),
    findByResetTokenHash: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  };

  const mockEmailService = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bootstrapAdmin', () => {
    it('throws ForbiddenException if an admin already exists', async () => {
      mockUserRepository.countByRole.mockResolvedValue(1);

      await expect(
        service.bootstrapAdmin({
          email: 'admin@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException if the email is already registered', async () => {
      mockUserRepository.countByRole.mockResolvedValue(0);
      mockUserRepository.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.bootstrapAdmin({
          email: 'admin@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates the first admin when none exist', async () => {
      mockUserRepository.countByRole.mockResolvedValue(0);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 'user-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      });

      const result = await service.bootstrapAdmin({
        email: 'admin@test.com',
        password: 'password123',
      });

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@test.com', role: 'ADMIN' }),
      );
      expect(result.accessToken).toBe('mocked-jwt-token');
    });
  });

  describe('resetPassword', () => {
    it('throws BadRequestException if the token is invalid or expired', async () => {
      mockUserRepository.findByResetTokenHash.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'bad-token',
          password: 'newPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.resetPassword).not.toHaveBeenCalled();
    });

    it('resets the password when the token is valid', async () => {
      mockUserRepository.findByResetTokenHash.mockResolvedValue({
        id: 'user-1',
      });
      mockUserRepository.resetPassword.mockResolvedValue({ id: 'user-1' });

      const result = await service.resetPassword({
        token: 'good-token',
        password: 'newPassword123',
      });

      expect(mockUserRepository.resetPassword).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
      );
      expect(result.message).toBe('Password reset successful');
    });
  });

  describe('forgotPassword', () => {
    it('returns a generic message without revealing whether the email exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nobody@test.com' });

      expect(result.message).toBe(
        'If that email exists, a reset link was sent.',
      );
      expect(mockUserRepository.setResetToken).not.toHaveBeenCalled();
    });
  });
});
