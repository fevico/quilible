import { BadRequestException, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import https from "https"
import { PaymentIntent } from './dto/payment.dto';

@Injectable()
export class PaymentService {
    constructor(private readonly prisma: PrismaService) {}

async createPaymentIntent(body: PaymentIntent, res: Response) {
  const { email, amount, items, restaurantId } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new BadRequestException("Items data missing!");
  }  

  for (const item of items) {
    if (!item.itemId || !item.quantity || item.quantity < 1) {
      throw new BadRequestException("Invalid item data");
    }
  }   

  const productIds = items.map(item => item.itemId);
  const products = await this.prisma.menuItem.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== items.length) {
    throw new BadRequestException("Some items not found");
  }

  // Create product map for price validation
  const productMap = new Map(products.map(product => [product.id, product]));

  // Validate all items exist and calculate total
  let calculatedTotal = 0;
  for (const item of items) {
    const product = productMap.get(item.itemId);
    if (!product) {
      throw new BadRequestException(`Item with id ${item.itemId} not found`);
    }
    calculatedTotal += product.price * item.quantity;
  }

  console.log("total amount", calculatedTotal)

  // Optional: Validate amount matches calculated total
  if (Math.abs(calculatedTotal - amount) > 0.01) {
    throw new BadRequestException("Amount doesn't match calculated total");
  }

  // Create order first WITHOUT payment reference
  const order = await this.prisma.order.create({
    data: {
      userId: "3bcafc39-d778-492b-90a2-fed2a5a23076",
      restaurantId: restaurantId,
      totalAmount: amount,
      status: "PENDING",
      paymentStatus: "PENDING",
    },
  });

  // Create order items
  const orderItemsData = items.map(item => {
    const product = productMap.get(item.itemId);
    // Since we validated all products exist above, we can safely use !
    return {
      orderId: order.id,
      menuItemId: item.itemId,
      quantity: item.quantity,
      price: product!.price, // Use non-null assertion since we validated above
    };
  });

  await this.prisma.orderItem.createMany({
    data: orderItemsData,
  });

  // Initialize Paystack payment
  const params = JSON.stringify({
    email,
    amount: amount * 100, // Paystack expects amount in kobo
    metadata: {
      orderId: order.id,
      restaurantId,
      items: items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
    },
    // callback_url: `${process.env.FRONTEND_URL}/payment-verification`,
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
  };

  // Return promise for proper async handling
  return new Promise((resolve, reject) => {
    const req = https.request(options, (paystackRes) => {
      let data = '';

      paystackRes.on('data', (chunk) => {
        data += chunk;
      });

      paystackRes.on('end', async () => {
        try {
          console.log(JSON.parse(data))
          const response = JSON.parse(data);
          
          if (response.status && response.data) {
            // Update order with payment reference from Paystack response
            await this.prisma.order.update({
              where: { id: order.id },
              data: {
                paymentReference: response.data.reference,
              },
            });
 
            resolve({
              orderId: order.id,
              paymentReference: response.data.reference,
              authorizationUrl: response.data.authorization_url,
              accessCode: response.data.access_code 
            });
          } else {
            // If Paystack fails, update order status
            await this.prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: "FAILED",
              },
            });
            reject(new Error(response.message || 'Payment initialization failed'));
          }
        } catch (error) {
          // If parsing fails, update order status
          await this.prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "FAILED",
            },
          });
          reject(error);
        }
      });
    });

    req.on('error', async (error) => {
      // Update order status on request error
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
        },
      });
      reject(error);
    });

    req.write(params);
    req.end();
  });
}
 
// async verifyPayment(reference: string) {
//   const options = {
//     hostname: 'api.paystack.co',
//     port: 443,
//     path: `/transaction/verify/${reference}`,
//     method: 'GET',
//     headers: {
//       Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
//     },
//   };

//   return new Promise((resolve, reject) => {
//     const req = https.request(options, (paystackRes) => {
//       let data = '';

//       paystackRes.on('data', (chunk) => {
//         data += chunk;
//       });

//       paystackRes.on('end', () => {
//         try {
//           const response = JSON.parse(data);
//           if (response.status && response.data.status === 'success') {
//             // Update order payment status
//             this.prisma.order.update({
//               where: { paymentReference: reference },
//               data: { 
//                 paymentStatus: 'SUCCESSFUL',
//                 status: 'CONFIRMED'
//               },
//             });
//             resolve(response.data);
//           } else {
//             // Update order as failed
//             this.prisma.order.update({
//               where: { paymentReference: reference },
//               data: { paymentStatus: 'FAILED' },
//             });
//             reject(new Error('Payment verification failed'));
//           }
//         } catch (error) {
//           reject(error);
//         }
//       });
//     });

//     req.on('error', (error) => {
//       reject(error);
//     });

//     req.end();
//   });
// }
    
}
 