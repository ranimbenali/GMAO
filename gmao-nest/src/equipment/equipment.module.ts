import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Equipment, EquipmentSchema } from './equipment.schema';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Equipment.name, schema: EquipmentSchema }]),
    AuthModule, // ← apporte JwtGuard & MultiEntrepriseGuard
  ],
  controllers: [EquipmentController],
  providers: [EquipmentService],
})
export class EquipmentModule {}
