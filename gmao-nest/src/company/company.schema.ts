import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema()
export class Company {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop()
  address: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

// 🔹 Unicité déjà portée par @Prop; on garde un index explicite
CompanySchema.index({ name: 1 }, { unique: true });
