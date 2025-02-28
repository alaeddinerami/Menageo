import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from './entities/chat.entity'; // Assuming this is your Mongoose schema
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Message.name) private messageModel: Model<Message>) {}

  async saveMessage(createChatDto: CreateChatDto): Promise<Message> {
    const message = new this.messageModel(createChatDto);
    return message.save();
  }

  async getMessages(userId: string, otherUserId: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 'asc' }) 
      .exec();
  }
}