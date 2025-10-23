import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SchedulingService, SchedulingLean } from './scheduling.service';
import { CreateSchedulingDto } from './create-scheduling.dto';
import { UpdateSchedulingDto } from './update-scheduling.dto';
import { JwtGuard } from '../auth/jwt.auth';

// Rôle strict (plus de `| string`)
type UserRole = 'SuperAdmin' | 'AdminEntreprise' | 'Technicien' | 'User';

// Structure minimale posée par le JwtGuard dans req.user
interface JwtUser {
  role?: UserRole;
  companyId?: string;
}
type AuthRequest = Request & { user?: JwtUser };

@Controller('scheduling')
@UseGuards(JwtGuard)
export class SchedulingController {
  constructor(private readonly service: SchedulingService) {}

  @Post()
  create(
    @Req() r: AuthRequest,
    @Body() dto: CreateSchedulingDto,
  ): Promise<SchedulingLean> {
    const role = r.user?.role;
    const companyId = r.user?.companyId;
    const payload = role === 'SuperAdmin' ? dto : { ...dto, companyId };
    return this.service.create(payload);
  }

  @Get()
  findAll(@Req() r: AuthRequest): Promise<SchedulingLean[]> {
    const role = r.user?.role;
    const companyId = r.user?.companyId;
    const filter = role === 'SuperAdmin' ? {} : { companyId };
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<SchedulingLean> {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Req() r: AuthRequest,
    @Body() dto: UpdateSchedulingDto,
  ): Promise<SchedulingLean> {
    const role = r.user?.role;
    const companyId = r.user?.companyId;
    const payload = role === 'SuperAdmin' ? dto : { ...dto, companyId };
    return this.service.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<SchedulingLean> {
    return this.service.remove(id);
  }

  @Post('run-due')
  runDue(): Promise<number> {
    return this.service.runDue();
  }
}
