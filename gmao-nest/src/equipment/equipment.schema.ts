import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EquipmentDocument = Equipment & Document;

@Schema({ timestamps: true })
export class Equipment {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop()
  dateMES?: Date;

  @Prop()
  location?: string;

  @Prop({ required: true })
  companyId: string;
}

export const EquipmentSchema = SchemaFactory.createForClass(Equipment);

// 🔹 pour listes filtrées par entreprise
EquipmentSchema.index({ companyId: 1 });
