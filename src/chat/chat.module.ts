import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageSchema } from './entities/chat.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports:[
    MongooseModule.forFeature([{name: 'Message', schema: MessageSchema}]),
      AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
