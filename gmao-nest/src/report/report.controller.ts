import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportService } from './report.service';
import { CreateReportDto } from './create-report.dto';
import { UpdateReportDto } from './update-report.dto';
import { JwtGuard } from '../auth/jwt.auth';

type UserRole = 'SuperAdmin' | 'AdminEntreprise' | 'Technicien' | 'User';
type AuthRequest = Request & { user?: { role?: UserRole; companyId?: string } };

@UseGuards(JwtGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Post()
  create(@Body() body: CreateReportDto, @Req() r: AuthRequest) {
    const role = r.user?.role;
    const companyId = r.user?.companyId;
    const payload = role === 'SuperAdmin' ? body : { ...body, companyId };
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
  update(@Param('id') id: string, @Body() body: UpdateReportDto, @Req() r: AuthRequest) {
    const role = r.user?.role;
    const companyId = r.user?.companyId;
    const payload = role === 'SuperAdmin' ? body : { ...body, companyId };
    return this.service.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
