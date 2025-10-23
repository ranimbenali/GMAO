import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  role: string;
  companyId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token invalide ou manquant');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = this.jwtService.verify<JwtPayload>(token, {
        secret:
          process.env.JWT_SECRET ??
          process.env.PRIVATE_KEY ??
          'fallback_local_secret',
      });

      (request as Request & { user?: JwtPayload }).user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Token invalide');
    }
  }
}
