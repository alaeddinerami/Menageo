import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from 'src/common/enums/roles.enum';

@Schema()
export class User {
  @Prop()
  name: string;
  @Prop({ required: true, unique: true })
  email: string;
  @Prop()
  password: string;

  @Prop()
  location: string;

  @Prop()
  phone: string;
  
  @Prop({ default: '' })
  image: string;

  @Prop({ type: [String], default: [Role.client] })
  roles: Role[];
}
export const UserSchema = SchemaFactory.createForClass(User);
