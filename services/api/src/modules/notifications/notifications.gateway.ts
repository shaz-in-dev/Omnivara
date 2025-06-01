import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import type { NotificationPayload } from './notifications.service';

/**
 * WebSocket gateway — pushes persisted notifications to connected clients.
 * Clients join their own room (`user:{userId}`) so targeted delivery works.
 *
 * Usage (frontend socket.io-client):
 *   socket.emit('join', { userId: '...' })
 *   socket.on('notification', (payload) => { ... })
 */
@WebSocketGateway({
  cors:      { origin: '*' },
  namespace: '/ws',
})
export class NotificationsGateway {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  /** Push to a specific user room whenever a notification is persisted. */
  @OnEvent('notification.created')
  handleNotification(payload: NotificationPayload) {
    if (payload.userId) {
      this.server.to(`user:${payload.userId}`).emit('notification', payload);
    }
    // Broadcast (userId = null) → push to all members in the org room
    this.server.to(`org:${payload.orgId}`).emit('notification', payload);
  }

  /** Client joins their personal room and their org room for broadcasts. */
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { userId: string; orgId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    void socket.join(`user:${data.userId}`);
    void socket.join(`org:${data.orgId}`);
    this.logger.debug(`WS join: user=${data.userId} org=${data.orgId}`);
    return { event: 'joined', data: { userId: data.userId, orgId: data.orgId } };
  }
}
