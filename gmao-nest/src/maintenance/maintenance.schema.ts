import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MaintenanceDocument = Maintenance & Document;

export enum MaintenanceType {
  Preventive = 'Préventive',
  Corrective = 'Corrective',
}

export enum MaintenanceStatus {
  EnAttente = 'En attente',
  EnCours = 'En cours',
  Terminee = 'terminée',
}

@Schema({ timestamps: true })
export class Maintenance {
  @Prop({ enum: MaintenanceType, required: true })
  type!: MaintenanceType;

  @Prop() plannedDate?: Date;
  @Prop() dueDate?: Date;

  @Prop({ enum: MaintenanceStatus })
  status?: MaintenanceStatus;

  @Prop() description?: string;

  @Prop({ required: true })
  equipmentId!: string;

  @Prop({ required: true })
  userId!: string;

  // 🔹 Multi-tenant
  @Prop({ required: true })
  companyId!: string;
}

export const MaintenanceSchema = SchemaFactory.createForClass(Maintenance);

// 🔹 pour listes et KPI par entreprise
MaintenanceSchema.index({ companyId: 1 });
