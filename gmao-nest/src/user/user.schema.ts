import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum Role {
  SuperAdmin = 'SuperAdmin',
  AdminEntreprise = 'AdminEntreprise',
  Technicien = 'Technicien',
  User = 'User',
}

@Schema()
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: Role, required: true })
  role: Role;

  @Prop({ required: true })
  companyId: string; // Référence à l'entreprise
}

export const UserSchema = SchemaFactory.createForClass(User);
