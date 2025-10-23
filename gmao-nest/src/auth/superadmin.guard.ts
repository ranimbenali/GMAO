// src/auth/superadmin.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  role: string;
  companyId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const role = req.user?.role;
    if (role === 'SuperAdmin') return true;
    throw new ForbiddenException('Accès réservé au SuperAdmin');
  }
}
