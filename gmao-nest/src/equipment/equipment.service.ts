import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Equipment, EquipmentDocument } from './equipment.schema';
import { CreateEquipmentDto } from './create-equipment.dto';
import { UpdateEquipmentDto } from './update-equipment.dto';

/**
 * Service Equipements.
 * - Contient les opérations CRUD standard.
 * - Les méthodes acceptent un éventuel "filter" (pour scoper par companyId).
 * - Les méthodes findOne/update/remove lèvent NotFound si l'id n'existe pas.
 */
@Injectable()
export class EquipmentService {
  constructor(
    @InjectModel(Equipment.name) private model: Model<EquipmentDocument>,
  ) {}

  /**
   * Création d'un équipement.
   * Le contrôleur a déjà construit le payload (forçage éventuel du companyId).
   */
  async create(data: CreateEquipmentDto): Promise<Equipment> {
    const created = new this.model(data);
    return created.save();
  }

  /**
   * Liste des équipements.
   * - filter par défaut vide → retourne tout
   * - si filter = { companyId }, on retourne uniquement ceux de l'entreprise
   * - .lean() pour renvoyer des POJO (plus léger côté perf)
   */
  async findAll(filter: FilterQuery<EquipmentDocument> = {}): Promise<Equipment[]> {
    return this.model.find(filter).lean().exec();
  }

  /**
   * Lecture par id.
   * - Lève NotFoundException si introuvable.
   * - Pas de vérification de companyId ici (cohérent avec le contrôleur actuel).
   */
  async findOne(id: string): Promise<Equipment> {
    const item = await this.model.findById(id);
    if (!item) throw new NotFoundException('Equipment not found');
    return item;
  }

  /**
   * Mise à jour par id.
   * - Le contrôleur s'est chargé d'empêcher le changement de tenant
   *   pour les rôles non-SuperAdmin (en forçant companyId).
   * - { new: true } pour renvoyer la version mise à jour.
   * - NotFound si aucun document correspondant.
   */
  async update(id: string, updateData: UpdateEquipmentDto): Promise<Equipment> {
    const item = await this.model.findByIdAndUpdate(id, updateData, { new: true });
    if (!item) throw new NotFoundException('Equipment not found');
    return item;
  }

  /**
   * Suppression par id.
   * - NotFound si l'id n'existe pas.
   */
  async remove(id: string): Promise<Equipment> {
    const item = await this.model.findByIdAndDelete(id);
    if (!item) throw new NotFoundException('Equipment not found');
    return item;
  }
}
