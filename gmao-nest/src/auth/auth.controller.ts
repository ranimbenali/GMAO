import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.auth';
import { Request as ExpressRequest } from 'express';
import { SafeUser } from '../user/user.service';

type AuthRequest = ExpressRequest & {
  user: { sub: string; iat?: number; exp?: number };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ): Promise<{ access_token: string }> {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  async getProfile(@Request() req: AuthRequest): Promise<SafeUser> {
    return this.authService.getProfile(req.user.sub);
  }
}
