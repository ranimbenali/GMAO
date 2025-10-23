// src/user/user.controller.ts
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
import { Request as ExpressRequest } from 'express';
import { IsEmail, IsString, MinLength } from 'class-validator';

import { UserService } from './user.service';
import { User } from './user.schema';
import { JwtGuard } from '../auth/jwt.auth';
import { SuperAdminGuard } from '../auth/superadmin.guard';

/** ---------- Types ---------- */
type JwtUser = {
  sub: string;
  role: string;
  companyId?: string;
  iat?: number;
  exp?: number;
};
type AuthRequest = ExpressRequest & { user: JwtUser };

/** ---------- DTOs ---------- */
class SignUpDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}
class UpdateMyEmailDto { @IsEmail() email!: string; }
class UpdatePasswordDto {
  @IsString() currentPassword!: string;
  @IsString() @MinLength(6) newPassword!: string;
}

/** ---------- Controller ---------- */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 🔒 Admin global uniquement
  @UseGuards(JwtGuard, SuperAdminGuard)
  @Post()
  create(@Body() body: Partial<User>) {
    return this.userService.create(body);
  }

  @UseGuards(JwtGuard, SuperAdminGuard)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtGuard, SuperAdminGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtGuard, SuperAdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<User>) {
    return this.userService.update(id, body);
  }

  @UseGuards(JwtGuard, SuperAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  // (optionnel temporaire) route publique si tu veux garder un sign-up
  @Post('sign-up')
  async signUp(@Body() body: SignUpDto) {
    return this.userService.signUp(body);
  }

  /** ------ Profil courant (auth requis) ------ */
  @UseGuards(JwtGuard)
  @Put('me/email')
  updateMyEmail(@Req() req: AuthRequest, @Body() dto: UpdateMyEmailDto) {
    return this.userService.update(req.user.sub, { email: dto.email });
  }

  @UseGuards(JwtGuard)
  @Put('me/password')
  async updateMyPassword(
    @Req() req: AuthRequest,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
