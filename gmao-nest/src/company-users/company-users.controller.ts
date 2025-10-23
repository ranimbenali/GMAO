import {
  Body, Controller, Delete, Get, Param, Post, Put, Req,
  ForbiddenException, UseGuards
} from '@nestjs/common';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { JwtGuard } from '../auth/jwt.auth';
import { CompanyUsersService } from './company-users.service';
import { Role } from '../user/user.schema';

class CreateDto {
  @IsNotEmpty() name!: string;
  @IsEmail() email!: string;
  @IsEnum(Role) role!: Role;
  @IsOptional() @MinLength(6) password?: string;
}
class UpdateDto {
  @IsOptional() name?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
}
class UpdatePasswordDto {
  @MinLength(6) newPassword!: string;
}

@UseGuards(JwtGuard)
@Controller('company-users') // => /api/company-users
export class CompanyUsersController {
  constructor(private readonly service: CompanyUsersService) {}

  /** Autorise seulement SuperAdmin et AdminEntreprise */
  private mustBeManager(req: any) {
    const r = req.user?.role;
    if (r !== 'SuperAdmin' && r !== 'AdminEntreprise') {
      throw new ForbiddenException('Accès refusé');
    }
  }

  @Get()
  list(@Req() req: any) {
    this.mustBeManager(req);
    return this.service.list(req.user.companyId, req.user.role);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateDto) {
    this.mustBeManager(req);
    return this.service.create(req.user.companyId, dto);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateDto) {
    this.mustBeManager(req);
    return this.service.update(req.user.companyId, id, dto, req.user.role);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    this.mustBeManager(req);
    return this.service.remove(req.user.companyId, id, req.user.role);
  }

  /** ✅ NOUVEAU : mise à jour du mot de passe choisie par l’admin */
  @Post(':id/update-password')
  updatePassword(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdatePasswordDto,
  ) {
    this.mustBeManager(req);
    return this.service.updatePassword(req.user.companyId, id, req.user.role, body.newPassword);
  }
}
