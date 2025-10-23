import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Equipment, EquipmentDocument } from '../equipment/equipment.schema';
import { Maintenance, MaintenanceDocument } from '../maintenance/maintenance.schema';

@Injectable()
export class AssistantToolsService {
  constructor(
    @InjectModel(Equipment.name) private readonly eqModel: Model<EquipmentDocument>,
    @InjectModel(Maintenance.name) private readonly mModel: Model<MaintenanceDocument>,
  ) {}

  async getEquipmentCount(): Promise<{ count: number }> {
    const count = await this.eqModel.countDocuments();
    return { count };
  }

  async getMaintenanceStats(status: string): Promise<{ status: string; count: number }> {
    const count = await this.mModel.countDocuments({
      status: new RegExp(status, 'i'),
    });
    return { status, count };
  }

  async getUpcomingMaintenances7d(): Promise<{ count: number }> {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const count = await this.mModel.countDocuments({
      plannedDate: { $gte: now, $lte: in7 },
    });
    return { count };
  }
}
