// websocket/websocket.module.ts
import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports:[JwtModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway], // Important: export the gateway
}) 
export class WebsocketModule {}