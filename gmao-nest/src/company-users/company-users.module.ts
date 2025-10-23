import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyUsersController } from './company-users.controller';
import { CompanyUsersService } from './company-users.service';
import { User, UserSchema } from '../user/user.schema';
import { AuthModule } from '../auth/auth.module'; // fournit JwtService/JwtGuard

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule,
  ],
  controllers: [CompanyUsersController],
  providers: [CompanyUsersService],
})
export class CompanyUsersModule {}
