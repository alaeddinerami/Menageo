import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ required: true })
  senderId: string; 

  @Prop({ required: true })
  receiverId: string; 

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isRead: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);