import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('me')
  findMine(@CurrentUser() user: { userId: string }, @Query() query: QueryNotificationDto) {
    return this.notificationsService.findMyNotifications(user.userId, query);
  }

  @Get('me/unread-count')
  unreadCount(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Patch('me/read-all')
  markAllRead(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.markAllRead(user.userId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.notificationsService.markRead(user.userId, id);
  }
}