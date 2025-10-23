import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtGuard } from './jwt.auth';
import { SuperAdminGuard } from './superadmin.guard';
import { MultiEntrepriseGuard } from './multi-entreprise.guard';

@Module({
  imports: [
    forwardRef(() => UserModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? process.env.PRIVATE_KEY ?? 'fallback_local_secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, SuperAdminGuard, MultiEntrepriseGuard],
  exports:   [JwtModule,  JwtGuard, SuperAdminGuard, MultiEntrepriseGuard],
})
export class AuthModule {}
