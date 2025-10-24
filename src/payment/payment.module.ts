import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentController } from './payment.controller';

@Module({
  imports: [PrismaModule],
  providers: [PaymentService],
  controllers: [PaymentController]
})  
export class PaymentModule {}
