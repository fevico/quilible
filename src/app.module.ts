import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ResturantModule } from './resturant/resturant.module';
import { RiderModule } from './rider/rider.module';
import { PaymentModule } from './payment/payment.module';
import { OrderModule } from './order/order.module';
import { NotificationModule } from './notification/notification.module';
import * as Joi from 'joi';
import { WebsocketModule } from './webscket/websocket.module';
import { WebsocketGateway } from './webscket/websocket.gateway';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
      envFilePath: '.env', // Path to your .env file
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
      }),  
    }),
    AuthModule,
    PrismaModule,
    ResturantModule,
    RiderModule,
    PaymentModule,
    OrderModule,
    NotificationModule,
    WebsocketModule,
    EmailModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
