import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Maintenance, MaintenanceSchema } from './maintenance.schema';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';

// ✅ on a besoin du modèle Equipment (déjà utilisé par le service)
import { Equipment, EquipmentSchema } from '../equipment/equipment.schema';

// ✅ on importe AuthModule car il exporte JwtModule + JwtGuard
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Maintenance.name, schema: MaintenanceSchema },
      { name: Equipment.name, schema: EquipmentSchema },
    ]),
    AuthModule, // <<— important pour @UseGuards(JwtGuard)
  ],
  providers: [MaintenanceService],
  controllers: [MaintenanceController],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
