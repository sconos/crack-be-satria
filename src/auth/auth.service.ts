// src/auth/auth.service.ts
import { ConflictException, ForbiddenException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { UserRepository } from './user.repository';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async bootstrapAdmin(dto: BootstrapAdminDto) {
    const adminCount = await this.userRepository.countByRole('ADMIN');
    if (adminCount > 0) {
      throw new ForbiddenException('An admin account already exists');
    }

    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.create({
      email: dto.email,
      password: hashed,
      role: 'ADMIN',
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const valid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!valid) throw new UnauthorizedException();

    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(userId: string) {
    await this.userRepository.updateRefreshToken(userId, null);
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) return { message: 'If that email exists, a reset link was sent.' };

    const rawToken = randomBytes(32).toString('hex');
    // SHA-256, not bcrypt: this needs to be looked up by exact value later,
    // which bcrypt's salted hashing doesn't support.
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await this.userRepository.setResetToken(user.id, tokenHash, expiresAt);

    // TODO: send `rawToken` via email provider instead of returning it.
    const devPayload =
      process.env.NODE_ENV !== 'production' ? { resetToken: rawToken } : {};

    return { message: 'If that email exists, a reset link was sent.', ...devPayload };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const user = await this.userRepository.findByResetTokenHash(tokenHash);
    if (!user) throw new BadRequestException('Invalid or expired reset token');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.userRepository.resetPassword(user.id, hashedPassword);

    return { message: 'Password reset successful' };
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.updateRefreshToken(userId, hashedRefresh);

    return { accessToken, refreshToken, user: { id: userId, email, role } };
  }
}