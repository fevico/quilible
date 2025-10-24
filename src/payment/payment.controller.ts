import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import type { Response, Request } from 'express';
import { PaymentIntent } from './dto/payment.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags("Payments")
@Controller('payment')
export class PaymentController { 
    constructor(private readonly paymentService: PaymentService){}
 
    @Post("intent")
    @ApiOperation({   
    summary: 'Create payment intent', 
    description: 'Initialize a payment transaction with Paystack' 
  })
  @ApiBody({ type: PaymentIntent })    
  @ApiResponse({ 
    status: 201, 
    description: 'Payment intent created successfully',
    schema: {
      example: {
        status: true,
        message: 'Authorization URL created',
        data: {
          authorization_url: 'https://checkout.paystack.com/0peioxfhpn',
          access_code: '0peioxfhpn',
          reference: '7PVGX8MEk85tgeEpVDtD'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: 'Items data missing!',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid item IDs',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid item id',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status: 502, 
    description: 'Payment service unavailable',
    schema: {
      example: {
        statusCode: 502,
        message: 'Payment service unavailable',
        error: 'Bad Gateway'
      }
    }
  })
  async createPaymentIntent(@Body() body: PaymentIntent, @Res() res: Response) {
    try {
      const result = await this.paymentService.createPaymentIntent(body, res);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      throw error;
    }
  }

    @Post("webhook")    
    async paymentWebhook(){
           
    }
}
