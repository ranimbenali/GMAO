import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, Role } from '../user/user.schema';

@Injectable()
export class CompanyUsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<UserDocument>) {}

  private sameCompany(u: any, cid: string) {
    return String(u.companyId) === String(cid);
  }

  async list(companyId: string, requesterRole: string) {
    const filter: any = requesterRole === 'SuperAdmin' ? {} : { companyId };
    return this.users
      .find({ ...filter, role: { $ne: 'SuperAdmin' } }, { password: 0 })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async create(
    companyId: string,
    dto: { name: string; email: string; role: Role; password?: string },
  ) {
    const exist = await this.users.findOne({ email: dto.email }).lean().exec();
    if (exist) throw new BadRequestException('Email déjà utilisé');

    const temp = dto.password ?? Math.random().toString(36).slice(-10);
    const doc = await this.users.create({
      name: dto.name,
      email: dto.email,
      role: dto.role,
      password: await bcrypt.hash(temp, 10),
      companyId,
    });
    const lean = doc.toObject();
    delete (lean as any).password;
    return { ...lean, tempPassword: dto.password ? undefined : temp };
  }

  async update(
    companyId: string,
    id: string,
    dto: { name?: string; role?: Role },
    requesterRole: string,
  ) {
    const u = await this.users.findById(id).exec();
    if (!u) throw new NotFoundException('Utilisateur introuvable');
    if (u.role === 'SuperAdmin') throw new ForbiddenException('Interdit sur SuperAdmin');
    if (requesterRole !== 'SuperAdmin' && !this.sameCompany(u, companyId)) {
      throw new ForbiddenException('Hors de votre entreprise');
    }

    if (dto.name !== undefined) u.name = dto.name;
    if (dto.role !== undefined) u.role = dto.role as Role;
    await u.save();

    const lean = u.toObject();
    delete (lean as any).password;
    return lean;
  }

  async remove(companyId: string, id: string, requesterRole: string) {
    const u = await this.users.findById(id).exec();
    if (!u) throw new NotFoundException('Utilisateur introuvable');
    if (u.role === 'SuperAdmin') throw new ForbiddenException('Interdit sur SuperAdmin');
    if (requesterRole !== 'SuperAdmin' && !this.sameCompany(u, companyId)) {
      throw new ForbiddenException('Hors de votre entreprise');
    }
    await u.deleteOne();
    return { ok: true };
  }

  /** ✅ NOUVEAU : mettre à jour le mot de passe choisi par l’admin */
  async updatePassword(
    companyId: string,
    id: string,
    requesterRole: string,
    newPassword: string,
  ) {
    const u = await this.users.findById(id).exec();
    if (!u) throw new NotFoundException('Utilisateur introuvable');
    if (u.role === 'SuperAdmin') throw new ForbiddenException('Interdit sur SuperAdmin');
    if (requesterRole !== 'SuperAdmin' && !this.sameCompany(u, companyId)) {
      throw new ForbiddenException('Hors de votre entreprise');
    }
    u.password = await bcrypt.hash(newPassword, 10);
    await u.save();
    return { ok: true };
  }
}
