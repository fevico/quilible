import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

interface MonifyToken {
  access_token: string;
  expires_in: number;   // seconds
  scope: string;
  token_type: string;
}

@Injectable()
export class WalletService {
    constructor(private readonly prisma: PrismaService,
        private readonly config: ConfigService
    ){}
        private readonly logger = new Logger(WalletService.name);

    async createUserWallet(){
        await this.getAccessToken()
        return 
    }

    private token: MonifyToken | null = null;
  private tokenExpiresAt: number = 0; // epoch ms

   private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (leave a 1-minute safety buffer)
    if (this.token && now < this.tokenExpiresAt - 60_000) {
      return this.token.access_token;
    }

    const authUrl = `${process.env.BASE_URL}/api/v1/auth/login`;
    console.log(authUrl)

    this.logger.log('Requesting new Reloadly access token...');
    const secret = this.config.get<string>("MONIFY_SECRET_KEY")
    console.log(secret, "monify secret")
    const response = await fetch(authUrl, {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        // Accept: 'application/json',
        Authorization: `Basic ${secret}`
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Token request failed (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as MonifyToken;
    console.log(data, "data")
    this.token = data;
    this.tokenExpiresAt = now + data.expires_in * 1000;

    this.logger.log('New access token acquired');
    return data.access_token;
  }


    private async createWallet(bvn: string, name: string){
        const token = await this.getAccessToken();
     try {
        const url = `${process.env.BASE_URL}/api/v1/disbursements/wallet`
            const response = await fetch(url, {
      method: 'GET',
      headers: {
        // Content-type: "",
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
     } catch (error) {
        
     }
    }
}
