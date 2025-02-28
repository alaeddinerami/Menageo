import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { Message } from './entities/chat.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('chat')
@UseGuards(AuthGuard('jwt')) // Protect all endpoints with JWT authentication
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  async saveMessage(@Body() createChatDto: CreateChatDto): Promise<Message> {
    return this.chatService.saveMessage(createChatDto);
  }

  @Get('messages/:userId/:otherUserId')
  async getMessages(
    @Param('userId') userId: string,
    @Param('otherUserId') otherUserId: string,
  ): Promise<Message[]> {
    return this.chatService.getMessages(userId, otherUserId);
  }
}