import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from './entities/chat.entity'; // Import the Chat schema
import { Message } from './entities/chat.entity'; // Import the Message schema
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createChat(senderId: string, receiverId: string): Promise<Chat> {
    const existingChat = await this.chatModel.findOne({
      $or: [
        { user1: senderId, user2: receiverId },
        { user1: receiverId, user2: senderId },
      ],
    });

    if (existingChat) {
      return existingChat;
    }

    const newChat = new this.chatModel({
      user1: senderId,
      user2: receiverId,
      messages: [],
    });

    return await newChat.save();
  }

  async sendMessage(
    senderId: string,
    receiverId: any,
    content: string,
  ): Promise<Message> {
    const chat = await this.createChat(senderId, receiverId);

    const newMessage = new this.messageModel({
      senderId,
      content,
      isRead: false,
      timestamp: new Date(),
    });
    await newMessage.save();

    chat.messages.push(newMessage);

    await chat.save();

    return newMessage;
  }

  async getMessages(userId: string, otherUserId: string): Promise<Message[]> {
    const chat = await this.chatModel.findOne({
      $or: [
        { user1: userId, user2: otherUserId },
        { user1: otherUserId, user2: userId },
      ],
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    return chat.messages.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }

  async getUserChats(userId: string) {
    const chats = await this.chatModel
      .find({
        $or: [{ user1: userId }, { user2: userId }],
      })
      .lean()
      .exec();

    const chatPromises = chats.map(async (chat) => {
      const otherUserId = chat.user1 === userId ? chat.user2 : chat.user1;

      const otherUser = await this.userModel
        .findById(otherUserId)
        .select('name image')
        .lean()
        .exec();

      const lastMessage =
        chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1].content
          : null;

      return {
        chatId: chat._id,
        otherUser: {
          id: otherUserId,
          name: otherUser?.name || 'Unknown User',
          image: otherUser?.image || 'https://avatar.iran.liara.run/public',
        },
        lastMessage,
        updatedAt: chat.updatedAt,
      };
    });

    const processedChats = await Promise.all(chatPromises);

    return processedChats.sort(
      (a, b) =>
        new Date(b.updatedAt ?? 0).getTime() -
        new Date(a.updatedAt ?? 0).getTime(),
    );
  }

  async markMessageAsRead(messageId: string): Promise<Message> {
    const updatedMessage = await this.messageModel.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true },
    );

    if (!updatedMessage) {
      throw new Error('Message not found');
    }

    return updatedMessage;
  }
}
