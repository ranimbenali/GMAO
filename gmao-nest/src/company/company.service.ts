import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './company.schema';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private model: Model<CompanyDocument>,
  ) {}

  async create(data: Partial<Company>): Promise<Company> {
    const created = new this.model(data);
    return created.save();
  }

  async findAll(): Promise<Company[]> {
    return this.model.find().exec();
  }

  async findOne(id: string): Promise<Company> {
    const item = await this.model.findById(id);
    if (!item) throw new NotFoundException('Company not found');
    return item;
  }

  async update(id: string, updateData: Partial<Company>): Promise<Company> {
    const item = await this.model.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!item) throw new NotFoundException('Company not found');
    return item;
  }

  async remove(id: string): Promise<Company> {
    const item = await this.model.findByIdAndDelete(id);
    if (!item) throw new NotFoundException('Company not found');
    return item;
  }
}
