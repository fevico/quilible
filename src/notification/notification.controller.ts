// notification.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from 'src/gurad/auth';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('fcm-token')
  async saveFCMToken(
    @Request() req,
    @Body() body: { fcmToken: string }
  ) {
    await this.notificationService.saveFCMToken(req.user.id, body.fcmToken);
    return { message: 'FCM token saved successfully' };
  }
}