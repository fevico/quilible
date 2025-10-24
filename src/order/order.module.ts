// order/order.module.ts
import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModule } from '../notification/notification.module';
import { WebsocketModule } from 'src/webscket/websocket.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    WebsocketModule,     // Import the module that provides WebsocketGateway
    NotificationModule,  // Import the module that provides NotificationService
    JwtModule
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    PrismaService,
    // Don't add WebsocketGateway here - it's provided by WebsocketModule
  ],
  exports: [OrderService],
})
export class OrderModule {}