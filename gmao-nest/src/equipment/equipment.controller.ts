import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './create-equipment.dto';
import { UpdateEquipmentDto } from './update-equipment.dto';
import { JwtGuard } from '../auth/jwt.auth';

/**
 * Rôle tel qu'utilisé côté front/back.
 * On le tape ici pour profiter de l'autocomplétion + éviter les fautes.
 */
type UserRole = 'SuperAdmin' | 'AdminEntreprise' | 'Technicien' | 'User';

/**
 * Ce que le JwtGuard place dans req.user (payload du JWT).
 * - sub: id utilisateur
 * - role: rôle de l'utilisateur
 * - companyId: présent pour les non-SuperAdmin (multi-entreprise)
 */
interface JwtUserPayload {
  sub: string;
  role: UserRole;
  companyId?: string;
}

/** Typage pratique de la requête Express avec notre user */
type RequestWithUser = Request & { user?: JwtUserPayload };

/**
 * Contrôleur Equipements.
 * - Préfixe REST en **pluriel** pour matcher /api/equipments
 * - Toutes les routes sont protégées par JWT via @UseGuards(JwtGuard)
 * - Le *scoping* (multi-entreprise) est géré manuellement ici
 *   en construisant un payload/filtre selon le rôle.
 */
@Controller('equipments')
@UseGuards(JwtGuard)
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  /**
   * Création d'un équipement.
   * - SuperAdmin : on transmet le body tel quel (il peut fixer companyId).
   * - Autres rôles : on **force** companyId depuis le token si non fourni.
   */
  @Post()
  create(@Req() req: RequestWithUser, @Body() body: CreateEquipmentDto) {
    const role = req.user?.role;
    const companyId = req.user?.companyId;

    const payload: CreateEquipmentDto =
      role === 'SuperAdmin'
        ? body
        : { ...body, companyId: companyId ?? body.companyId };

    return this.service.create(payload);
  }

  /**
   * Liste des équipements.
   * - SuperAdmin : voit tout (filtre vide).
   * - Autres rôles : filtrage par companyId.
   */
  @Get()
  findAll(@Req() req: RequestWithUser) {
    const role = req.user?.role;
    const companyId = req.user?.companyId;

    const filter: { companyId?: string } =
      role === 'SuperAdmin' ? {} : { companyId };

    return this.service.findAll(filter);
  }

  /**
   * Lecture d'un équipement par id.
   * ⚠️ Remarque : ici on **ne** fait **pas** de vérification de tenant (multi-entreprise).
   * Tu as choisi de déléguer ce point au service ou à un Guard dédié éventuel.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /** 
   * Mise à jour d'un équipement.
   * - SuperAdmin : peut tout modifier.
   * - Autres rôles : on **force**/ /**conserve companyId du token (pas de changement de tenant).
   */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() body: UpdateEquipmentDto,
  ) {
    const role = req.user?.role;
    const companyId = req.user?.companyId;

    const payload: UpdateEquipmentDto =
      role === 'SuperAdmin'
        ? body
        : { ...body, companyId: companyId ?? body.companyId };

    return this.service.update(id, payload);
  }

  /**
   * Suppression d'un équipement.
   * ⚠️ Remarque : pas de contrôle de tenant ici non plus.
   * (Tu peux le gérer via service/guard si besoin.)
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
