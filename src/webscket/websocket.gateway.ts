
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedUsers = new Map<string, string>();
  private restaurantSockets = new Map<string, string>();
  private riderSockets = new Map<string, string>();

  constructor(private jwtService: JwtService) {
    console.log('🔧 WebsocketGateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    console.log('✅ New connection:', client.id);

    // Add raw message listener to see what Postman is actually sending
    client.onAny((eventName, ...args) => {
      console.log('📨 RAW SOCKET.IO EVENT:', eventName);
      console.log('RAW ARGS:', args);
      console.log('---');
    });

    // Send welcome message
    client.emit('welcome', { 
      message: 'Connected! Send auth message to authenticate.',
      clientId: client.id,  
      timestamp: new Date().toISOString()
    });             

    // Authentication timeout
    setTimeout(() => {
      if (!this.getUserIdBySocketId(client.id)) {
        console.log(`⏰ Authentication timeout for ${client.id}`);
        client.emit('timeout', { message: 'Authentication timeout' });
        client.disconnect();
      }
    }, 10000);
  }

  // Handle ALL messages to see what's coming in
  @SubscribeMessage('*')
  handleAllEvents(client: Socket, data: any) {
    console.log('🎯 NESTJS EVENT - ANY:');
    console.log('Data:', data);
    console.log('Type:', typeof data);
    
    // Try to handle Postman's format
    if (typeof data === 'object' && data.event && data.data) {
      console.log('📧 Detected Postman format - event:', data.event);
      this.handlePostmanFormat(client, data);
    }
  }

  // Handle Postman's { "event": "auth", "data": { ... } } format
  private handlePostmanFormat(client: Socket, postmanData: any) {
    const { event, data } = postmanData;
    console.log(`🔄 Handling Postman format - Event: ${event}, Data:`, data);
    
    if (event === 'auth') {
      this.handleAuthenticate(client, data);
    } else if (event === 'echo') {
      this.handleEcho(client, data);
    }
  }

  @SubscribeMessage('echo')
  handleEcho(client: Socket, data: any) {
    console.log('🔊 Echo received:', data);
    client.emit('echo_response', {
      received: data,
      status: 'success',
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('auth')
  async handleAuthenticate(client: Socket, data: any) {
    console.log('🔐 AUTH HANDLER CALLED');
    console.log('Auth data:', data);
    
    try {
      const token = this.extractToken(data);
      console.log('Extracted token:', token ? '✅' : '❌');
      
      if (!token) {
        client.emit('auth_result', { success: false, error: 'No token' });
        return;
      }

      const decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET
      });

      console.log('✅ Token valid for user:', decoded.userId);
      
      const userId = decoded.userId;
      const userRole = decoded.role; 

      // Store mappings
      this.connectedUsers.set(userId, client.id);
      
      if (userRole === 'RESTAURANT') {
        this.restaurantSockets.set(userId, client.id);
      } else if (userRole === 'RIDER') {
        this.riderSockets.set(userId, client.id);
      }

      client.emit('auth_result', { 
        success: true, 
        user: { id: userId, role: userRole },
        message: 'Authentication successful'
      });

      console.log('✅ User authenticated:', userId);

    } catch (error) {
      console.log('❌ Auth error:', error.message);
      client.emit('auth_result', { 
        success: false, 
        error: error.message 
      });
    }
  }

  private extractToken(data: any): string | null {
    console.log('🔑 Extracting token from:', data);
    
    // If data is the token string
    if (typeof data === 'string') {
      return data;
    }
    
    // If data has token property
    if (data && data.token) {
      return data.token;
    }
    
    // If data is an array with token
    if (Array.isArray(data) && data[0] && data[0].token) {
      return data[0].token;
    }
    
    return null;
  }

  private getUserIdBySocketId(socketId: string): string | null {
    for (const [userId, id] of this.connectedUsers.entries()) {
      if (id === socketId) return userId;
    }
    return null;
  }

  handleDisconnect(client: Socket) {
    console.log('❌ Client disconnected:', client.id);
    this.removeClient(client.id);
  }

  private removeClient(socketId: string) {
    for (const [userId, id] of this.connectedUsers.entries()) {
      if (id === socketId) {
        this.connectedUsers.delete(userId);
        this.restaurantSockets.delete(userId);
        this.riderSockets.delete(userId);
        console.log('✅ Removed user:', userId);
        break;
      }
    }
  }

    // Notify restaurant about new order
  notifyRestaurant(restaurantId: string, order: any) {
    const socketId = this.restaurantSockets.get(restaurantId);  
    if (socketId) {
      this.logger.log(`Notifying restaurant ${restaurantId} about new order`);
      console.log(`Notifying resturant ${restaurantId} about new order`)
      this.server.to(socketId).emit('new_order', order);
    } else {
      this.logger.warn(`Restaurant ${restaurantId} not connected`);
    }
  }

  // Notify user about order status update
  notifyUser(userId: string, order: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.logger.log(`Notifying user ${userId} about order update`);
        console.log(`Notifying resturant ${userId} about new order`)
      this.server.to(socketId).emit('order_updated', order);
    }
  }

  // Notify available riders about new order
  notifyRiders(order: any) {
    this.logger.log(`Broadcasting new order to ${this.riderSockets.size} riders`);
    this.server.emit('new_order_available', order); 
  }

  // Notify specific rider
  notifyRider(riderId: string, order: any) {
    const socketId = this.riderSockets.get(riderId);    
    if (socketId) {
      this.logger.log(`Notifying rider ${riderId} about assigned order`);
      this.server.to(socketId).emit('order_assigned', order);
    }
  }
}