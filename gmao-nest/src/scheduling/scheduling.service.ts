import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Scheduling,
  SchedulingDocument,
  SchedulingFrequency,
} from './scheduling.schema';
import { CreateSchedulingDto } from './create-scheduling.dto';
import { UpdateSchedulingDto } from './update-scheduling.dto';
import { MaintenanceService } from '../maintenance/maintenance.service';
import {
  MaintenanceStatus,
  MaintenanceType,
} from '../maintenance/maintenance.schema';

// Objet "lean" (sans méthodes mongoose)
export type SchedulingLean = {
  _id: string;
  equipmentId: string;
  frequency: SchedulingFrequency;
  nextDate: Date;
  companyId?: string;
};

function toLean(
  doc: (Omit<SchedulingLean, '_id'> & { _id: Types.ObjectId }) | null,
): SchedulingLean | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...rest, _id: String(_id) };
}

@Injectable()
export class SchedulingService {
  constructor(
    @InjectModel(Scheduling.name)
    private readonly model: Model<SchedulingDocument>,
    private readonly maintenance: MaintenanceService,
  ) {}

  // ----------------- CRUD -----------------

  async create(dto: CreateSchedulingDto): Promise<SchedulingLean> {
    const created = await this.model.create({
      equipmentId: dto.equipmentId,
      frequency: dto.frequency,
      nextDate: new Date(dto.nextDate),
      companyId: dto.companyId,
    });

    const fresh = (await this.model
      .findById(created._id)
      .lean()
      .exec()) as unknown as
      | (Omit<SchedulingLean, '_id'> & { _id: Types.ObjectId })
      | null;

    const lean = toLean(fresh);
    if (!lean) throw new NotFoundException('Scheduling not found after create');
    return lean;
  }

  async findAll(filter: Partial<Scheduling> = {}): Promise<SchedulingLean[]> {
    const list = (await this.model
      .find(filter)
      .lean()
      .exec()) as unknown as Array<
      Omit<SchedulingLean, '_id'> & { _id: Types.ObjectId }
    >;

    return list.map((d) => toLean(d)!);
  }

  async findOne(id: string): Promise<SchedulingLean> {
    const doc = (await this.model.findById(id).lean().exec()) as unknown as
      | (Omit<SchedulingLean, '_id'> & { _id: Types.ObjectId })
      | null;

    const lean = toLean(doc);
    if (!lean) throw new NotFoundException('Scheduling not found');
    return lean;
  }

  async update(id: string, dto: UpdateSchedulingDto): Promise<SchedulingLean> {
    const patch: Partial<Scheduling> = {};
    if (dto.equipmentId) patch.equipmentId = dto.equipmentId;
    if (dto.frequency) patch.frequency = dto.frequency;
    if (dto.companyId) patch.companyId = dto.companyId;
    if (dto.nextDate) patch.nextDate = new Date(dto.nextDate);

    const doc = (await this.model
      .findByIdAndUpdate(id, patch, { new: true })
      .lean()
      .exec()) as unknown as
      | (Omit<SchedulingLean, '_id'> & { _id: Types.ObjectId })
      | null;

    const lean = toLean(doc);
    if (!lean) throw new NotFoundException('Scheduling not found');
    return lean;
  }

  async remove(id: string): Promise<SchedulingLean> {
    const doc = (await this.model
      .findByIdAndDelete(id)
      .lean()
      .exec()) as unknown as
      | (Omit<SchedulingLean, '_id'> & { _id: Types.ObjectId })
      | null;

    const lean = toLean(doc);
    if (!lean) throw new NotFoundException('Scheduling not found');
    return lean;
  }

  // --------------- Génération ---------------

  private bump(date: Date, frequency: SchedulingFrequency): Date {
    const d = new Date(date);
    switch (frequency) {
      case SchedulingFrequency.Daily:
        d.setDate(d.getDate() + 1);
        break;
      case SchedulingFrequency.Weekly:
        d.setDate(d.getDate() + 7);
        break;
      case SchedulingFrequency.Monthly:
        d.setMonth(d.getMonth() + 1);
        break;
      case SchedulingFrequency.Quarterly:
        d.setMonth(d.getMonth() + 3);
        break;
    }
    return d;
  }

  /** Exécute une planification : crée la maintenance puis recalcule nextDate */
  async runOnce(planif: SchedulingLean): Promise<void> {
    await this.maintenance.create({
      type: MaintenanceType.Preventive,
      plannedDate: planif.nextDate,
      status: MaintenanceStatus.EnAttente,
      description: 'Générée automatiquement par la planification',
      equipmentId: planif.equipmentId,
      companyId: planif.companyId,
      // ✅ important: satisfaire le schema Maintenance (userId required)
      userId: 'SYSTEM',
    });

    const next = this.bump(planif.nextDate, planif.frequency);
    await this.model
      .updateOne(
        { _id: new Types.ObjectId(planif._id) },
        { $set: { nextDate: next } },
      )
      .exec();
  }

  /** Exécute toutes les planifs arrivées à échéance */
  async runDue(): Promise<number> {
    const today = new Date();
    const list = (await this.model
      .find({ nextDate: { $lte: today } })
      .lean()
      .exec()) as unknown as Array<
      Omit<SchedulingLean, '_id'> & { _id: Types.ObjectId }
    >;

    const due = list.map((d) => toLean(d)!);
    for (const p of due) {
      await this.runOnce(p);
    }
    return due.length;
  }
}
