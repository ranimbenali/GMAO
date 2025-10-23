import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SchedulingDocument = Scheduling & Document;

export enum SchedulingFrequency {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
}

@Schema({ timestamps: true })
export class Scheduling {
  @Prop({ required: true })
  equipmentId!: string;

  @Prop({ enum: SchedulingFrequency, required: true })
  frequency!: SchedulingFrequency;

  @Prop({ type: Date, required: true })
  nextDate!: Date;

  @Prop()
  companyId?: string;
}

export const SchedulingSchema = SchemaFactory.createForClass(Scheduling);

// 🔹 pour runDue/console par entreprise si besoin
SchedulingSchema.index({ companyId: 1 });
