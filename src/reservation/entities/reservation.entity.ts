import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

export type ReservationDocument = HydratedDocument<Reservation>;

@Schema()
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  cleaner: User;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  client: User;
  @Prop({ required: true })
  date: Date;
  @Prop({ required: true })
  Duration: number;
  @Prop({
    required: true,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  })
  status: string;
  @Prop()
  Note?: string;
}
export const ReservationSchema = SchemaFactory.createForClass(Reservation);
