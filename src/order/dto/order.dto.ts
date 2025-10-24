import { OrderStatus } from "@prisma/client";

export class CreateOrderDto {
  restaurantId: string;
  items: Array<{ itemId: string; quantity: number }>;
  totalAmount: number;
}

export class UpdateOrderStatusDto {
  status: OrderStatus;
}

export class AssignRiderDto {
  riderId: string;
}

export class OrderResponseDto {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
}