import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  role: string;
  companyId?: string;
}

@Injectable()
export class MultiEntrepriseGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    // Le JwtGuard a déjà décodé le token et posé req.user
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const user = req.user;

    // SuperAdmin : accès partout
    if (user?.role === 'SuperAdmin') return true;

    // Autres rôles : doivent obligatoirement avoir un companyId
    if (!user?.companyId) {
      throw new ForbiddenException('Aucune entreprise associée à cet utilisateur');
    }
    return true;
  }
}
