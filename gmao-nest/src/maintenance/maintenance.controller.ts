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
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './create-maintenance.dto';
import { UpdateMaintenanceDto } from './update-maintenance.dto';
import { JwtGuard } from '../auth/jwt.auth';
import { Maintenance } from './maintenance.schema';

// Typage léger du user présent dans le JWT
type UserRole = 'SuperAdmin' | 'AdminEntreprise' | 'Technicien' | 'User';
interface JwtUser {
  id?: string;
  _id?: string;
  sub?: string;
  role?: UserRole;
  companyId?: string;
}
interface AuthRequest extends Request {
  user?: JwtUser;
}

/**
 * Normalise les dates (string -> Date), insère companyId si non-SuperAdmin
 * et (optionnellement) userId pour la création.
 */
function toMaintenancePayload(
  dto: CreateMaintenanceDto | UpdateMaintenanceDto,
  opts: { companyId?: string; isSuperAdmin?: boolean; userId?: string; includeUserId?: boolean } = {},
): Partial<Maintenance> {
  const { companyId, isSuperAdmin = false, userId, includeUserId = false } = opts;

  const p: Partial<Maintenance> = {
    type: dto.type,
    status: dto.status,
    description: dto.description,
    equipmentId: dto.equipmentId,
  };

  // userId uniquement à la création
  if (includeUserId && userId) {
    p.userId = userId;
  }

  // companyId : injecté pour non-SuperAdmin ; sinon on respecte un éventuel companyId du DTO
  if (isSuperAdmin) {
    if ('companyId' in dto && dto.companyId) p.companyId = dto.companyId;
  } else if (companyId) {
    p.companyId = companyId;
  }

  // Dates : dto.plannedDate/dueDate sont des string -> conversion directe
  if (dto.plannedDate) p.plannedDate = new Date(dto.plannedDate);
  if (dto.dueDate) p.dueDate = new Date(dto.dueDate);

  return p;
}

@Controller('maintenances') // /api/maintenances
@UseGuards(JwtGuard)       // JWT sur toutes les routes
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Post()
  create(@Req() r: AuthRequest, @Body() dto: CreateMaintenanceDto) {
    const role = r.user?.role;
    const companyId = r.user?.companyId;
    const userId = r.user?.id ?? r.user?._id ?? r.user?.sub; // selon ton JWT

    const payload = toMaintenancePayload(dto, {
      companyId,
      isSuperAdmin: role === 'SuperAdmin',
      userId,
      includeUserId: true, // userId obligatoire au CREATE (schema)
    });

    return this.service.create(payload);
  }

  @Get()
  findAll(@Req() r: AuthRequest) {
    const role = r.user?.role;
    const companyId = r.user?.companyId;
    const filter = role === 'SuperAdmin' ? {} : { companyId };
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Req() r: AuthRequest,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    const role = r.user?.role;
    const companyId = r.user?.companyId;

    const payload = toMaintenancePayload(dto, {
      companyId,
      isSuperAdmin: role === 'SuperAdmin',
      // pas d’userId à l’update
    });

    return this.service.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
