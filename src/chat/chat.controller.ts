import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { Chat, Message } from './entities/chat.entity'; // Message Entity
import { AuthGuard } from '@nestjs/passport';

@Controller('chat')
@UseGuards(AuthGuard('jwt')) 
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @Body() createChatDto: CreateChatDto, 
  ): Promise<Message> {
    const { senderId, receiverId, content } = createChatDto;
    return this.chatService.sendMessage(senderId, receiverId, content);
  }

  @Get('messages/:userId/:otherUserId')
  async getMessages(
    @Param('userId') userId: string,
    @Param('otherUserId') otherUserId: string,
  ): Promise<Message[]> {
    return this.chatService.getMessages(userId, otherUserId);
  }
  @Get('/:userId')
  async getChats(@Param('userId') userId: string) {
    return this.chatService.getUserChats(userId);
  }
  @Patch('message/:messageId/read')
  async markMessageAsRead(@Param('messageId') messageId: string): Promise<Message> {
    return this.chatService.markMessageAsRead(messageId);
  }
}
