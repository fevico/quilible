import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule],
  providers: [WalletService],
  controllers: [WalletController]
})
export class WalletModule {}
