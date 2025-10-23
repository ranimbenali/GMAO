// en-tête du fichier — assure-toi d’avoir bien ces imports
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Maintenance, MaintenanceDocument } from './maintenance.schema';
import { Equipment, EquipmentDocument } from '../equipment/equipment.schema';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectModel(Maintenance.name) private model: Model<MaintenanceDocument>,
    @InjectModel(Equipment.name) private eqModel: Model<EquipmentDocument>,
  ) {}

  async create(data: Partial<Maintenance>): Promise<Maintenance> {
    // data est déjà typé → pas de any
    const payload: Partial<Maintenance> = { ...data };

    // Auto-renseigne companyId via l’équipement si manquant (SuperAdmin)
    if (!payload.companyId && payload.equipmentId) {
      const eq = await this.eqModel
        .findById(payload.equipmentId)
        .select('companyId')
        .exec();
      if (eq?.companyId) payload.companyId = eq.companyId; // ✅ plus de any
    }

    const created = new this.model(payload);
    return created.save();
  }

  async findAll(filter: Partial<Maintenance> = {}): Promise<Maintenance[]> {
    return this.model.find(filter).lean().exec();
  }

  async findOne(id: string): Promise<Maintenance> {
    const item = await this.model.findById(id);
    if (!item) throw new NotFoundException('Maintenance not found');
    return item;
  }

  async update(
    id: string,
    updateData: Partial<Maintenance>,
  ): Promise<Maintenance> {
    const updated: Partial<Maintenance> = { ...updateData };

    if (!updated.companyId && updated.equipmentId) {
      const eq = await this.eqModel
        .findById(updated.equipmentId)
        .select('companyId')
        .exec();
      if (eq?.companyId) updated.companyId = eq.companyId; // ✅ plus de any
    }

    const item = await this.model.findByIdAndUpdate(id, updated, { new: true });
    if (!item) throw new NotFoundException('Maintenance not found');
    return item;
  }

  async remove(id: string): Promise<Maintenance> {
    const item = await this.model.findByIdAndDelete(id);
    if (!item) throw new NotFoundException('Maintenance not found');
    return item;
  }
}
