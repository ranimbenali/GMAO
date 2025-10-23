import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, Role } from './user.schema';
import * as bcrypt from 'bcrypt';

// ✅ Type renvoyé au front SANS le mot de passe
export type SafeUser = Omit<User, 'password'> & { _id: string };

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: Partial<User>): Promise<User> {
    if (!data.password) {
      throw new Error('Password is required');
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = new this.userModel({ ...data, password: hashedPassword });
    return newUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  // Création rapide d'un SuperAdmin (utilisé une seule fois si besoin)
  async signUp(data: { name: string; email: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const createdUser = new this.userModel({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: Role.SuperAdmin,
      companyId: 'GLOBAL',
    });
    return createdUser.save();
  }

  // 🔹 Utilitaire pour créer l'Admin d'une entreprise
  async createAdminForCompany(args: {
    name: string;
    email: string;
    password: string;
    companyId: string;
    role?: Role; // par défaut AdminEntreprise
  }) {
    const exists = await this.findByEmail(args.email);
    if (exists) {
      throw new Error('Email already in use');
    }
    const hash = await bcrypt.hash(args.password, 10);
    const u = await this.userModel.create({
      name: args.name,
      email: args.email,
      password: hash,
      role: args.role ?? Role.AdminEntreprise,
      companyId: args.companyId,
    });
    return u;
  }

  // ✅ Renvoie un POJO typé sans password (pas de Document Mongoose)
  async getSafeById(id: string): Promise<SafeUser | null> {
    return this.userModel
      .findById(id)
      .select('-password')
      .lean<SafeUser>()
      .exec();
  }

  async updatePassword(id: string, current: string, next: string) {
    const u = await this.userModel.findById(id);
    if (!u) throw new NotFoundException('User not found');
    const ok = await bcrypt.compare(current, u.password);
    if (!ok) throw new Error('Bad current password');
    u.password = await bcrypt.hash(next, 10);
    return u.save();
  }
}
