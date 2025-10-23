// src/report/report.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './report.schema';
import { CreateReportDto } from './create-report.dto';
import { UpdateReportDto } from './update-report.dto';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private model: Model<ReportDocument>) {}

  async create(data: CreateReportDto): Promise<Report> {
    const created = new this.model(data);
    return created.save();
  }

  // ✅ Correction : ajout d’un paramètre optionnel filter
  async findAll(filter: Partial<Report> = {}): Promise<Report[]> {
    return this.model.find(filter).lean().exec();
  }

  async findOne(id: string): Promise<Report> {
    const item = await this.model.findById(id);
    if (!item) throw new NotFoundException('Report not found');
    return item;
  }

  async update(id: string, body: UpdateReportDto): Promise<Report> {
    const item = await this.model.findByIdAndUpdate(id, body, { new: true });
    if (!item) throw new NotFoundException('Report not found');
    return item;
  }

  async remove(id: string): Promise<Report> {
    const item = await this.model.findByIdAndDelete(id);
    if (!item) throw new NotFoundException('Report not found');
    return item;
  }
}
