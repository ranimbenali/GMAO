import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './company.schema';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module'; // ⬅️ pour créer l'admin

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    AuthModule,  // JwtGuard + SuperAdminGuard
    UserModule,  // UserService
  ],
  providers: [CompanyService],
  controllers: [CompanyController],
})
export class CompanyModule {}
