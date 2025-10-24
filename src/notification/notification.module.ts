// notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationController } from './notification.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[JwtModule],
  providers: [NotificationService, PrismaService],
  controllers: [NotificationController],
  exports: [NotificationService], // Important: export the service
})
export class NotificationModule {}