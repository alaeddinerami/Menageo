import { SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  afterInit() {
    this.server.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
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
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}, User: ${client.data.userId}`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(client: Socket, payload: { data: string }) {
    const senderId = client.data.userId;
    const receiverId = payload.data;

    if (!senderId || !receiverId) {
      console.error('Invalid senderId or receiverId:', { senderId, receiverId });
      client.emit('error', { message: 'Invalid sender or receiver ID' });
      return;
    }

    const disc = this.getDiscutionName(senderId, receiverId);
    client.join(disc);
    
    console.log(`Sender ${senderId} joined chat with Receiver ${receiverId} in discution ${disc}`);
    const roomClients = this.server.sockets.adapter.rooms.get(disc)?.size || 0;
    console.log(`Clients in room ${disc}: ${roomClients}`);

    const messages = await this.chatService.getMessages(senderId, receiverId);
    client.emit('chatHistory', messages);
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: { data: { receiverId: string; content: string } }) {
    const senderId = client.data.userId;
    const receiverId = payload.data.receiverId;
    const content = payload.data.content;

    if (!senderId || !receiverId || !content) {
      console.error('Invalid message data:', { senderId, receiverId, content });
      client.emit('error', { message: 'Invalid message data' });
      return;
    }

    const disc = this.getDiscutionName(senderId, receiverId);

    console.log(`Message from Sender ${senderId} to Receiver ${receiverId}: ${content}`);
    console.log(`Broadcasting to room: ${disc}`);

    const createChatDto: CreateChatDto = {
      senderId,
      receiverId,
      content,
    };

    try {
      const savedMessage = await this.chatService.saveMessage(createChatDto);
      const messageData = {
        id: savedMessage._id,
        senderId,
        receiverId,
        content,
        isRead: savedMessage.isRead,
      };

      console.log(`Emitting message to room ${disc}:`, messageData);
      this.server.emit('message', messageData)
      const roomClients = this.server.sockets.adapter.rooms.get(disc)?.size || 0;
      console.log(`Clients in room ${disc} after emit: ${roomClients}`);
    } catch (error) {
      console.error('Error saving or broadcasting message:', error.message);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  private getDiscutionName(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }
}