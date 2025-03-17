import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module'; 
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatSchema, Chat } from './entities/chat.entity'; 
import { MessageSchema, Message } from './entities/chat.entity'; 
import { UserSchema } from 'src/user/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Chat', schema: ChatSchema }, 
      { name: 'Message', schema: MessageSchema }, 
      { name: 'User', schema: UserSchema }, 
    ]),
    AuthModule, 
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway], 
})
export class ChatModule {}
