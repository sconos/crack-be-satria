import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationType } from '../../generated/prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  constructor(
    private notificationsRepository: NotificationsRepository,
    private emailService: EmailService,
  ) {}

  async notify(userId: string, type: NotificationType, title: string, message: string, link?: string) {
    const notification = await this.notificationsRepository.create({ userId, type, title, message, link });
    this.sendEmailFor(userId, title, message); // fire-and-forget, not awaited
    return notification;
  }

  async notifyMany(userIds: string[], type: NotificationType, title: string, message: string, link?: string) {
    const result = await this.notificationsRepository.createMany(
      userIds.map((userId) => ({ userId, type, title, message, link })),
    );
    userIds.forEach((userId) => this.sendEmailFor(userId, title, message));
    return result;
  }

  async notifyAdmins(type: NotificationType, title: string, message: string, link?: string) {
    const admins = await this.notificationsRepository.findAdminHrUserIds();
    return this.notifyMany(admins.map((a) => a.id), type, title, message, link);
  }

  async notifyEmployee(employeeId: string, type: NotificationType, title: string, message: string, link?: string) {
    const employee = await this.notificationsRepository.findUserIdByEmployeeId(employeeId);
    if (!employee) return;
    return this.notify(employee.userId, type, title, message, link);
  }

  async findMyNotifications(userId: string, query: QueryNotificationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { userId, ...(query.unreadOnly && { isRead: false }) };

    const [data, total, unreadCount] = await Promise.all([
      this.notificationsRepository.findMany(where, (page - 1) * limit, limit),
      this.notificationsRepository.count(where),
      this.notificationsRepository.countUnread(userId),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount } };
  }

  getUnreadCount(userId: string) {
    return this.notificationsRepository.countUnread(userId).then((unreadCount) => ({ unreadCount }));
  }

  async markRead(userId: string, id: string) {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException('Not your notification');
    return this.notificationsRepository.markRead(id);
  }

  markAllRead(userId: string) {
    return this.notificationsRepository.markAllRead(userId);
  }

  private async sendEmailFor(userId: string, title: string, message: string) {
    const user = await this.notificationsRepository.findUserEmail(userId);
    if (!user) return;
    await this.emailService.send(
      user.email,
      title,
      `<p>${message}</p><p style="color:#888;font-size:12px">This is an automated notification from Koru HRM.</p>`,
    );
  }
}