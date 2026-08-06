import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  findAll(@Request() req: any) {
    const userId = req.user?.id ?? 0;
    return this.service.findForUser(userId);
  }

  @Get('unread-count')
  unreadCount(@Request() req: any) {
    const userId = req.user?.id ?? 0;
    return this.service.findUnreadCount(userId).then((count) => ({ count }));
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.service.markRead(+id);
  }

  @Patch('mark-all-read')
  markAllRead(@Request() req: any) {
    const userId = req.user?.id ?? 0;
    return this.service.markAllRead(userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(+id);
    return { success: true };
  }
}
