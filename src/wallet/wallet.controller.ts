import { Body, Controller, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService){}

    @Post("create")
    async createWallet(@Body() body: any){
        return this.walletService.createUserWallet()
    }

}
