import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop() description?: string;

  @Prop() partsReplaced?: string;

  @Prop() duration?: string;

  @Prop() submittedBy?: string;

  @Prop({ required: true })
  maintenanceId!: string;

  // 🔹 Multi-entreprise (obligatoire)
  @Prop({ required: true })
  companyId!: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// 🔹 Index pour les listes par entreprise
ReportSchema.index({ companyId: 1 });
