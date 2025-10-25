import { 
  Controller, 
  Put, 
  Param, 
  Body, 
  UseGuards, 
  Get, 
  Request, 
  Post,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from '../gurad/auth';
import { Roles } from '../decorator/role.decorator';
import { RolesGuard } from '../gurad/role.guard';
import { OrderStatus } from '@prisma/client';
 
// Swagger imports
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiBody, 
} from '@nestjs/swagger';
import { OrderResponseDto, UpdateOrderStatusDto } from './dto/order.dto';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth') // Adds Bearer token authentication to all endpoints
@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()     
  @ApiOperation({ 
    summary: 'Get all orders for the authenticated user',
    description: 'Returns orders based on user role (customer, restaurant, or rider)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns list of orders',
    type: [OrderResponseDto]
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing token'
  })
  async getOrders(@Request() req) {
    return this.orderService.getUserOrders(req.user.id, req.user.role);
  }

  @Get(':orderId')
  @ApiOperation({ 
    summary: 'Get specific order details',
    description: 'Returns detailed information about a specific order. User must have permission to access this order.'
  })
  @ApiParam({
    name: 'orderId',
    type: String,
    description: 'UUID of the order',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns order details',
    type: OrderResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to access this order'
  })
  async getOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Request() req
  ) {
    return this.orderService.getOrderById(orderId, req.user.id, req.user.role);
  }

  @Put(':orderId/accept')
  @Roles('USER')
  @ApiOperation({ 
    summary: 'Accept an order (Restaurant only)',
    description: 'Allows a restaurant to accept a pending order. Triggers notifications to customer and riders.'
  })
  @ApiParam({
    name: 'orderId',
    type: String,
    description: 'UUID of the order to accept',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order accepted successfully',
    type: OrderResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found or already processed'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not authorized to accept this order'
  })
  async acceptOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Request() req
  ) {
    return this.orderService.acceptOrder(req.user.id, orderId);
  }

  @Put(':orderId/status')
  @ApiOperation({ 
    summary: 'Update order status',
    description: 'Update the status of an order. Available statuses: PENDING, CONFIRMED, PREPARING, READY_FOR_PICKUP, ON_THE_WAY, DELIVERED, CANCELLED'
  })
  @ApiParam({
    name: 'orderId',
    type: String,
    description: 'UUID of the order to update',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    type: UpdateOrderStatusDto,
    description: 'New order status',
    examples: {
      preparing: {
        summary: 'Mark as preparing',
        value: { status: 'PREPARING' }
      },
      ready: {
        summary: 'Mark as ready for pickup',
        value: { status: 'READY_FOR_PICKUP' }
      },
      delivered: {
        summary: 'Mark as delivered',
        value: { status: 'DELIVERED' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order status updated successfully',
    type: OrderResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to update this order'
  })
  async updateOrderStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body('status') status: OrderStatus,
    @Request() req
  ) {
    return this.orderService.updateOrderStatus(
      orderId, 
      status, 
      req.user.id, 
      req.user.role
    );
  }

  @Put(':orderId/assign-rider')
  @Roles('RIDER')
  @ApiOperation({ 
    summary: 'Assign rider to order (Rider only)',
    description: 'Allows a rider to assign themselves to an available order'
  })
  @ApiParam({
    name: 'orderId',
    type: String,
    description: 'UUID of the order to assign',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rider assigned successfully',
    type: OrderResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found or cannot be assigned'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Rider cannot assign to this order'
  })
  async assignRider(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Request() req
  ) {
    return this.orderService.assignRider(orderId, req.user.id);
  }

  @Put(':orderId/cancel')
  @ApiOperation({ 
    summary: 'Cancel an order',
    description: 'Cancel an order. Customers can cancel their own orders, restaurants can cancel orders from their restaurant.'
  })
  @ApiParam({
    name: 'orderId',
    type: String,
    description: 'UUID of the order to cancel',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order cancelled successfully',
    type: OrderResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to cancel this order'
  })
  async cancelOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Request() req
  ) {
    return this.orderService.cancelOrder(orderId, req.user.id, req.user.role);
  }

  @Put(':orderId/ready-for-pickup')
  @Roles('RESTAURANT')
  @ApiOperation({ 
    summary: 'Mark order as ready for pickup (Restaurant only)',
    description: 'Marks an order as ready for rider pickup. Triggers notifications to the assigned rider.'
  })
  @ApiParam({
    name: 'orderId',
    type: String,
    description: 'UUID of the order',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order marked as ready for pickup',
    type: OrderResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not authorized to update this order'
  })
  async markReadyForPickup(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Request() req
  ) {
    return this.orderService.updateOrderStatus(
      orderId, 
      OrderStatus.READY_FOR_PICKUP, 
      req.user.id, 
      req.user.role
    );
  }

  @Put(':orderId/pickup')
  @Roles('RIDER')
  @ApiOperation({ 
    summary: 'Mark order as picked up (Rider only)',
    description: 'Marks an order as picked up and on the way to customer. Triggers notifications to customer and restaurant.'
  })
  @ApiParam({
    name: 'orderId',
    type: String,
    description: 'UUID of the order',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order marked as picked up',
    type: OrderResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Rider is not assigned to this order'
  })
  async markAsPickedUp(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Request() req
  ) {
    return this.orderService.updateOrderStatus(
      orderId, 
      OrderStatus.ON_THE_WAY, 
      req.user.id, 
      req.user.role
    );
  }

  @Put(':orderId/deliver')
  @Roles('RIDER')
  @ApiOperation({ 
    summary: 'Mark order as delivered (Rider only)',
    description: 'Marks an order as delivered successfully. Completes the order delivery process.'
  })
  @ApiParam({
    name: 'orderId',
    type: String,
    description: 'UUID of the order',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order marked as delivered',
    type: OrderResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Rider is not assigned to this order'
  })
  async markAsDelivered(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Request() req
  ) {
    return this.orderService.updateOrderStatus(
      orderId, 
      OrderStatus.DELIVERED, 
      req.user.id, 
      req.user.role
    );
  }
}