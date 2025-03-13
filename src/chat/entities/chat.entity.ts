import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Message extends Document {
  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: Date.now })
  timestamp: Date;

}

export const MessageSchema = SchemaFactory.createForClass(Message);

@Schema({ timestamps: true })
export class Chat extends Document {
  @Prop({ required: true })
  user1: string;

  @Prop({ required: true })
  user2: string;

  @Prop({ type: [MessageSchema], default: [] })
  messages: Message[];
}

export type ChatDocument = Chat;
export const ChatSchema = SchemaFactory.createForClass(Chat);
