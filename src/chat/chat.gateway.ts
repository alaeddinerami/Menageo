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

  // afterInit() {
  //   this.server.use((socket, next) => {
  //     const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
  //     if (!token) {
  //       return next(new WsException('No token provided'));
  //     }
  //     try {
  //       const payload = this.jwtService.verify(token);
  //       socket.data.userId = payload.sub;
  //       next();
  //     } catch (error) {
  //       next(new WsException('Invalid token'));
  //     }
  //   });
  // }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}, User: ${client.data.userId}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(client: Socket, receiverId: string) {
    const disc = this.getDiscutionName(client.data.userId, receiverId);
    client.join(disc);
    console.log(`${client.data.userId} joined discution ${disc}`);

    const messages = await this.chatService.getMessages(client.data.userId, receiverId);
    client.emit('chatHistory', messages);
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: { receiverId: string; content: string }) {
    const senderId = 'kqgv55Vo2mRfJiVNAAAB';
    const disc = this.getDiscutionName(senderId, payload.receiverId);

    const createChatDto: CreateChatDto = {
      senderId,
      receiverId: payload.receiverId,
      content: payload.content,
    };

    const savedMessage = await this.chatService.saveMessage(createChatDto);

    this.server.to(disc).emit('message', {
      id: savedMessage._id,
      senderId,
      receiverId: payload.receiverId,
      content: payload.content,
      isRead: savedMessage.isRead,
    });
  }

  private getDiscutionName(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_'); 
  }
}