import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Scheduling, SchedulingSchema } from './scheduling.schema';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';

// ✅ pour créer des maintenances lors de l’exécution des planifs
import { MaintenanceModule } from '../maintenance/maintenance.module';

// ✅ pour que @UseGuards(JwtGuard) fonctionne (JwtService dispo)
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Scheduling.name, schema: SchedulingSchema },
    ]),
    MaintenanceModule, // besoin de MaintenanceService
    AuthModule,
  ],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
