import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private userSocketMap: Map<string, string> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  afterInit() {
    this.server.use((socket, next) => {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new WsException('No token provided'));
      }

      try {
        const payload = this.jwtService.verify(token);
        socket.data.userId = payload.id;
        next();
      } catch (error) {
        console.error('Token verification error:', error.message);
        next(new WsException('Invalid token'));
      }
    });
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}, User: ${client.data.userId}`);
    const userId = client.data.userId;

    // Store userId with socket ID
    if (!this.userSocketMap.has(userId)) {
      this.userSocketMap.set(userId, client.id);
    }
  }

  // Handle client disconnection
  handleDisconnect(client: Socket) {
    console.log(
      `Client disconnected: ${client.id}, User: ${client.data.userId}`,
    );
    const userId = client.data.userId;

    // Remove userId from the map
    if (this.userSocketMap.has(userId)) {
      this.userSocketMap.delete(userId);
    }
  }

  // Handle sending a message
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string; receiverId: string },
  ): Promise<void> {
    const { message, receiverId } = data;
    const senderId = client.data.userId;
    // console.log('senderId:', senderId);
    // console.log('receiverId:', receiverId);
    // console.log('message:', message);
    if (!receiverId) {
      throw new WsException('Receiver ID not provided');
    }

    const newMessage = await this.chatService.sendMessage(
      senderId,
      receiverId,
      message,
    );

    const receiverSocketId = this.userSocketMap.get(receiverId);

    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit(`message_received-${receiverId}`, {
        message: newMessage.content,
        senderId: senderId,
      });
    } else {
      console.log(`Receiver ${receiverId} is not connected`);
    }

    client.emit('message_sent', {
      message: newMessage.content,
      receiverId: receiverId,
    });
  }

  @SubscribeMessage('get_messages')
  async handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    { userId, otherUserId }: { userId: string; otherUserId: string },
  ): Promise<void> {
    try {
      const messages = await this.chatService.getMessages(userId, otherUserId);
      client.emit('messages', messages);
    } catch (error) {
      client.emit('error', error.message);
    }
  }
}
