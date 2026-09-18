import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, NotificationType } from '../../generated/prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(private prisma: PrismaService) {}

  create(data: { userId: string; type: NotificationType; title: string; message: string; link?: string }) {
    return this.prisma.notification.create({ data });
  }

  createMany(data: { userId: string; type: NotificationType; title: string; message: string; link?: string }[]) {
    if (data.length === 0) return Promise.resolve({ count: 0 });
    return this.prisma.notification.createMany({ data });
  }

  findMany(where: Prisma.NotificationWhereInput, skip: number, take: number) {
    return this.prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });
  }

  count(where: Prisma.NotificationWhereInput) {
    return this.prisma.notification.count({ where });
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  findUserEmail(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    }

  findAdminHrUserIds() {
    return this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'HR'] } },
      select: { id: true },
    });
  }

  findUserIdByEmployeeId(employeeId: string) {
    return this.prisma.employee.findUnique({ where: { id: employeeId }, select: { userId: true } });
  }
}