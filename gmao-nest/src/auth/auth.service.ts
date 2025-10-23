import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService, SafeUser } from '../user/user.service';
import { UserDocument } from '../user/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    // 1) Récupérer l'utilisateur
    const user: UserDocument | null = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    // 2) Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Mot de passe incorrect');

    // 3) Construire le payload JWT AVEC role + companyId
    //    - sub: identifiant utilisateur
    //    - role: pour le RolesGuard
    //    - companyId: pour le TenantGuard (SuperAdmin pourra ne pas s’en servir)
    const payload = {
      sub: String(user._id),
      role: String(user.role),
      companyId: user.companyId ? String(user.companyId) : undefined,
    };

    // 4) Signer le token (même secret que dans JwtModule)
    const secret =
      process.env.JWT_SECRET ??
      process.env.PRIVATE_KEY ?? // fallback si tu gardes ce nom dans ton .env
      'fallback_local_secret';

    const access_token = this.jwtService.sign(payload, {
      secret,
      expiresIn: '7d',
    });

    return { access_token };
  }

  // ✅ Renvoie un SafeUser (sans password) pour /auth/me
  async getProfile(userId: string): Promise<SafeUser> {
    const safe = await this.userService.getSafeById(userId);
    if (!safe) throw new NotFoundException('Utilisateur non trouvé');
    return safe;
  }
}
