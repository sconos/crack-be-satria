// src/auth/user.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../generated/prisma/client';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  countByRole(role: Role) {
    return this.prisma.user.count({ where: { role } });
  }

  create(data: { email: string; password: string; role: Role }) {
    return this.prisma.user.create({ data });
  }

  updateRefreshToken(id: string, refreshTokenHash: string | null) {
    return this.prisma.user.update({ where: { id }, data: { refreshToken: refreshTokenHash } });
  }

  setResetToken(id: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.user.update({
      where: { id },
      data: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt },
    });
  }

  findByResetTokenHash(tokenHash: string) {
    return this.prisma.user.findFirst({
      where: { resetTokenHash: tokenHash, resetTokenExpiresAt: { gt: new Date() } },
    });
  }

  resetPassword(id: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        refreshToken: null,
      },
    });
  }
}