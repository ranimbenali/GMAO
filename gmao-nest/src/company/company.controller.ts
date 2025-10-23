import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './company.schema';
import { JwtGuard } from '../auth/jwt.auth';
import { SuperAdminGuard } from '../auth/superadmin.guard';
import { CreateCompanyDto } from './create-company.dto';
import { CreateCompanyAdminDto } from './create-admin.dto';
import { UserService } from '../user/user.service';
import { Role } from '../user/user.schema';

@UseGuards(JwtGuard, SuperAdminGuard) // JWT requis + SuperAdmin uniquement
@Controller('company')
export class CompanyController {
  constructor(
    private readonly service: CompanyService,
    private readonly users: UserService,
  ) {}

  /** --------- CRUD Company (SuperAdmin) --------- */

  @Post()
  create(@Body() body: CreateCompanyDto) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<Company>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  /** --------- Créer le 1er Admin de la company ---------
   * POST /company/:companyId/admin
   * Body: { name, email, password }
   */
  @Post(':companyId/admin')
  async createFirstAdmin(
    @Param('companyId') companyId: string,
    @Body() body: CreateCompanyAdminDto,
  ) {
    // Vérifie que la company existe
    await this.service.findOne(companyId);

    // Crée un user avec role AdminEntreprise scoppé à la company
    return this.users.createAdminForCompany({
      name: body.name,
      email: body.email,
      password: body.password,
      companyId,
      role: Role.AdminEntreprise,
    });
  }
}
