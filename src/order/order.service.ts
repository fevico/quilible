// // order.service.ts
// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { WebsocketGateway } from 'src/webscket/websocket.gateway';
// import { NotificationService } from 'src/notification/notification.service';
// import { OrderStatus } from '@prisma/client';

// @Injectable()
// export class OrderService {
//   constructor(
//     private prisma: PrismaService,
//     private websocketGateway: WebsocketGateway,
//     private notificationService: NotificationService,
//   ) {}

//   async acceptOrder(restaurantId: string, orderId: string) {
//     const order = await this.prisma.order.update({
//       where: { 
//         id: orderId,
//         restaurantId: restaurantId,
//         status: 'PENDING'
//       },
//       data: {
//         status: 'CONFIRMED',
//       },
//       include: {
//         user: true,
//         orderItems: {
//           include: {
//             menuItem: true,
//           },
//         },
//       },
//     });

//     if (order) {
//       // Notify user
//       this.websocketGateway.notifyUser(order.userId, order);
      
//       // Send push notification to user
//       await this.notificationService.sendPushNotification({
//         userId: order.userId,
//         title: 'Order Confirmed!',
//         body: `Your order #${order.id} has been confirmed by the restaurant`,
//         data: { orderId: order.id, type: 'ORDER_CONFIRMED' }
//       });

//       // Notify available riders
//       this.websocketGateway.notifyRiders(order);
//     }

//     return order;
//   }

//   async updateOrderStatus(orderId: string, status: OrderStatus, userId?: string) {
//     const order = await this.prisma.order.update({
//       where: { id: orderId },
//       data: { status },
//       include: {
//         user: true,
//         restaurant: true,
//         rider: true,
//         orderItems: {
//           include: {
//             menuItem: true,
//           },
//         },
//       },
//     });

//     // Notify all parties
//     this.websocketGateway.notifyUser(order.userId, order);
    
//     if (order.restaurantId) {
//       this.websocketGateway.notifyRestaurant(order.restaurantId, order);
//     }
    
//     if (order.riderId) {
//       this.websocketGateway.notifyRider(order.riderId, order);
//     }

//     // Send appropriate notifications based on status
//     await this.sendStatusNotification(order, status);

//     return order;
//   }

//   async assignRider(orderId: string, riderId: string) {
//     const order = await this.prisma.order.update({
//       where: { 
//         id: orderId,
//         status: { in: ['CONFIRMED', 'PREPARING'] }
//       },
//       data: {
//         riderId: riderId,
//         status: 'PREPARING', // or keep current status
//       },
//       include: {
//         user: true,
//         restaurant: true,
//         rider: {
//           include: {
//             user: true,
//           },
//         },
//         orderItems: {
//           include: {
//             menuItem: true,
//           },
//         },
//       },
//     });
                  
//     if (order) {
//       // Notify user
//       this.websocketGateway.notifyUser(order.userId, order);
      
//       // Notify restaurant
//       this.websocketGateway.notifyRestaurant(order.restaurantId, order);
      
//       // Notify rider
//       this.websocketGateway.notifyRider(riderId, order);

//       // Send notifications
//       await this.notificationService.sendPushNotification({
//         userId: order.userId,
//         title: 'Rider Assigned!',
//         body: `A rider has been assigned to your order`,
//         data: { orderId: order.id, type: 'RIDER_ASSIGNED' }
//       });
//     }

//     return order;
//   }

//   private async sendStatusNotification(order: any, status: OrderStatus) {
//     let title = '';
//     let body = '';

//     switch (status) {
//       case 'PREPARING':
//         title = 'Order Being Prepared';
//         body = 'The restaurant has started preparing your order';
//         break;
//       case 'READY_FOR_PICKUP':
//         title = 'Order Ready for Pickup';
//         body = 'Your order is ready and waiting for rider pickup';
//         break;
//       case 'ON_THE_WAY':
//         title = 'Order On The Way!';
//         body = 'Your order is on the way to you';
//         break;
//       case 'DELIVERED':
//         title = 'Order Delivered!';
//         body = 'Your order has been delivered. Enjoy your meal!';
//         break;
//     }

//     if (title && body) {
//       await this.notificationService.sendPushNotification({
//         userId: order.userId,
//         title,
//         body,
//         data: { orderId: order.id, type: `ORDER_${status}` }
//       });
//     }
//   }
// }



// order.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { OrderStatus } from '@prisma/client';
import { WebsocketGateway } from 'src/webscket/websocket.gateway';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private websocketGateway: WebsocketGateway,
    private notificationService: NotificationService,
  ) {}

  async createOrder(orderData: {
    userId: string;
    restaurantId: string;
    items: Array<{ itemId: string; quantity: number }>;
    totalAmount: number;
  }) {
    // Verify restaurant exists and items belong to restaurant
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: orderData.restaurantId },
      include: { menuItems: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId: orderData.userId,
        restaurantId: orderData.restaurantId,
        totalAmount: orderData.totalAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        orderItems: {
          create: orderData.items.map(item => ({
            menuItemId: item.itemId,
            quantity: item.quantity,
            price: restaurant.menuItems.find(menuItem => menuItem.id === item.itemId)?.price || 0,
          })),
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        restaurant: { select: { id: true, name: true } },
        orderItems: { include: { menuItem: true } },
      },
    });

    // Notify restaurant in real-time
    this.websocketGateway.notifyRestaurant(orderData.restaurantId, order);
    
    // Send push notification to restaurant
    await this.notificationService.sendPushNotification({
      userId: restaurant.userId, // Notify restaurant owner
      title: 'New Order Received! 🎉',
      body: `You have a new order from ${order.user.name}`,
      data: { orderId: order.id, type: 'NEW_ORDER' }
    });

    return order;
  }

  async acceptOrder(restaurantId: string, orderId: string) {
    const order = await this.prisma.order.update({
      where: { 
        id: orderId,
        restaurantId: restaurantId,
        status: 'PENDING'
      },
      data: {
        status: 'CONFIRMED',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        restaurant: { select: { id: true, name: true } },
        orderItems: { include: { menuItem: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or already processed');
    }

    // Notify customer in real-time
    this.websocketGateway.notifyUser(order.userId, order);
    
    // Notify available riders
    this.websocketGateway.notifyRiders(order);

    // Send push notification to customer
    await this.notificationService.sendPushNotification({
      userId: order.userId,
      title: 'Order Confirmed! ✅',
      body: `Your order has been confirmed by ${order.restaurant.name}`,
      data: { orderId: order.id, type: 'ORDER_CONFIRMED' }
    });

    return order;
  }

  async assignRider(orderId: string, riderId: string) {
    const order = await this.prisma.order.update({
      where: { 
        id: orderId,
        status: { in: ['CONFIRMED', 'PREPARING'] }
      },
      data: {
        riderId: riderId,
        status: 'PREPARING',
      },
      include: {
        user: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true } },
        rider: { include: { user: { select: { id: true, name: true } } } },
        orderItems: { include: { menuItem: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or cannot be assigned');
    }

    // Notify all parties
    this.websocketGateway.notifyUser(order.userId, order);
    this.websocketGateway.notifyRestaurant(order.restaurantId, order);
    this.websocketGateway.notifyRider(riderId, order);

    // Send push notifications
    await Promise.all([
      // Notify customer
      this.notificationService.sendPushNotification({
        userId: order.userId,
        title: 'Rider Assigned! 🚴',
        body: `A rider has been assigned to your order`,
        data: { orderId: order.id, type: 'RIDER_ASSIGNED' }
      }),
      // Notify restaurant
      this.notificationService.sendPushNotification({
        userId: order.userId,
        title: 'Rider On The Way!',
        body: `A rider has been assigned to order #${order.id.slice(-6)}`,
        data: { orderId: order.id, type: 'RIDER_ASSIGNED' }
      })
    ]);

    return order;
  }

  async updateOrderStatus(
    orderId: string, 
    status: OrderStatus, 
    userId: string, 
    userRole: string
  ) {
    // Verify user has permission to update this order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true, userId: true } },
        rider: { include: { user: { select: { id: true } } } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Authorization checks
    if (userRole === 'RESTAURANT' && order.restaurant.userId !== userId) {
      throw new ForbiddenException('You can only update orders from your restaurant');
    }
    
    if (userRole === 'RIDER' && order.rider?.user.id !== userId) {
      throw new ForbiddenException('You can only update orders assigned to you');
    }
    
    if (userRole === 'USER' && order.userId !== userId) {
      throw new ForbiddenException('You can only update your own orders');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true } },
        rider: { include: { user: { select: { id: true, name: true } } } },
        orderItems: { include: { menuItem: true } },
      },
    });

    // Notify all relevant parties
    this.websocketGateway.notifyUser(order.userId, updatedOrder);
    this.websocketGateway.notifyRestaurant(order.restaurantId, updatedOrder);
    
    if (order.riderId) {
      this.websocketGateway.notifyRider(order.riderId, updatedOrder);
    }

    // Send appropriate push notification
    await this.sendStatusNotification(updatedOrder, status);

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true, userId: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only customer or restaurant can cancel
    if (userRole === 'USER' && order.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }
    
    if (userRole === 'RESTAURANT' && order.restaurant.userId !== userId) {
      throw new ForbiddenException('You can only cancel orders from your restaurant');
    }

    const cancelledOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: {
        user: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true } },
        orderItems: { include: { menuItem: true } },
      },
    });

    // Notify all parties
    this.websocketGateway.notifyUser(order.userId, cancelledOrder);
    this.websocketGateway.notifyRestaurant(order.restaurantId, cancelledOrder);
    
    if (order.riderId) {
      this.websocketGateway.notifyRider(order.riderId, cancelledOrder);
    }

    // Send cancellation notification
    await this.notificationService.sendPushNotification({
      userId: order.userId,
      title: 'Order Cancelled',
      body: `Order #${order.id.slice(-6)} has been cancelled`,
      data: { orderId: order.id, type: 'ORDER_CANCELLED' }
    });

    return cancelledOrder;
  }

  async getUserOrders(userId: string, userRole: string) {
    let whereCondition = {};

    if (userRole === 'USER') {
      whereCondition = { userId };
    } else if (userRole === 'RESTAURANT') {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { userId },
        select: { id: true },
      });
      whereCondition = { restaurantId: restaurant?.id };
    } else if (userRole === 'RIDER') {
      const rider = await this.prisma.rider.findUnique({
        where: { userId },
        select: { id: true },
      });
      whereCondition = { riderId: rider?.id };
    }

    return this.prisma.order.findMany({
      where: whereCondition,
      include: {
        user: { select: { id: true, name: true, email: true } },
        restaurant: { select: { id: true, name: true } },
        rider: { include: { user: { select: { id: true, name: true } } } },
        orderItems: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        restaurant: { select: { id: true, name: true, address: true } },
        rider: { include: { user: { select: { id: true, name: true, phone: true } } } },
        orderItems: { include: { menuItem: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Authorization
    if (userRole === 'USER' && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    
    if (userRole === 'RESTAURANT') {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (order.restaurantId !== restaurant?.id) {
        throw new ForbiddenException('Access denied');
      }
    }
    
    if (userRole === 'RIDER') {
      const rider = await this.prisma.rider.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (order.riderId !== rider?.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return order;
  }

  private async sendStatusNotification(order: any, status: OrderStatus) {
    let title = '';
    let body = '';

    switch (status) {
      case 'PREPARING':
        title = 'Order Being Prepared 👨‍🍳';
        body = 'The restaurant has started preparing your order';
        break;
      case 'READY_FOR_PICKUP':
        title = 'Order Ready for Pickup! 📦';
        body = 'Your order is ready and waiting for rider pickup';
        break;
      case 'ON_THE_WAY':
        title = 'Order On The Way! 🚴';
        body = 'Your order is on the way to you';
        break;
      case 'DELIVERED':
        title = 'Order Delivered! 🎉';
        body = 'Your order has been delivered. Enjoy your meal!';
        break;
      default:
        return;
    }

    await this.notificationService.sendPushNotification({
      userId: order.userId,
      title,
      body,
      data: { orderId: order.id, type: `ORDER_${status}` }
    });
  }
}