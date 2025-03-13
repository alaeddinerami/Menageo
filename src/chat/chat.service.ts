import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from './entities/chat.entity';  // Import the Chat schema
import { Message } from './entities/chat.entity';  // Import the Message schema

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  // Create a chat between two users, ensuring a chat doesn't already exist
  async createChat(senderId: string, receiverId: string): Promise<Chat> {
    // Find an existing chat between the two users (either way around)
    const existingChat = await this.chatModel.findOne({
      $or: [
        { user1: senderId, user2: receiverId },
        { user1: receiverId, user2: senderId },
      ],
    });

    // If the chat exists, return it
    if (existingChat) {
      return existingChat;
    }

    // Create a new chat if it doesn't exist
    const newChat = new this.chatModel({
      user1: senderId,
      user2: receiverId,
      messages: [],
    });

    // Save and return the new chat
    return await newChat.save();
  }

  // Send a message from sender to receiver
  async sendMessage(senderId: string, receiverId: any, content: string): Promise<Message> {
    // Create or find an existing chat between the two users
    const chat = await this.createChat(senderId, receiverId);

    // Create a new message instance
    const newMessage = new this.messageModel({
      senderId,
      content,
      isRead: false,
      timestamp: new Date(), // Ensure the timestamp is set
    });
    await chat.save();
    
    // Add the new message to the chat's messages array
    chat.messages.push(newMessage);
    
    // Save the updated chat with the new message
    await chat.save();

    // Return the new message, which can be broadcast via WebSocket
    return newMessage;
  }

  // Get all messages between two users
  async getMessages(userId: string, otherUserId: string): Promise<Message[]> {
    // Find the chat between the two users
    const chat = await this.chatModel.findOne({
      $or: [
        { user1: userId, user2: otherUserId },
        { user1: otherUserId, user2: userId },
      ],
    });

    // If no chat found, throw an error
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Return all messages in the chat, ensuring they are sorted by timestamp (if necessary)
    return chat.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Mark a message as read by its ID
  async markMessageAsRead(messageId: string): Promise<Message> {
    // Find and update the message to set `isRead` to true
    const updatedMessage = await this.messageModel.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true },
    );

    // If the message wasn't found, throw an error
    if (!updatedMessage) {
      throw new Error('Message not found');
    }

    // Return the updated message
    return updatedMessage;
  }
}
