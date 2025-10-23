import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssistantController } from './assistant.controller';
import { AssistantToolsService } from './assistant.tools';

import { Equipment, EquipmentSchema } from '../equipment/equipment.schema';
import { Maintenance, MaintenanceSchema } from '../maintenance/maintenance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Equipment.name, schema: EquipmentSchema },
      { name: Maintenance.name, schema: MaintenanceSchema },
    ]),
  ],
  controllers: [AssistantController],
  providers: [AssistantToolsService],
})
export class AssistantModule {}
