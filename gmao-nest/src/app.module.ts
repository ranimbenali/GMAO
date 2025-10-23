import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// ⛔️ Retiré: ScheduleModule.forRoot() et DiscoveryModule (cron)
// import { ScheduleModule } from '@nestjs/schedule';
// import { DiscoveryModule } from '@nestjs/core';

import { UserModule } from './user/user.module';
import { CompanyModule } from './company/company.module';
import { EquipmentModule } from './equipment/equipment.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ReportModule } from './report/report.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { AuthModule } from './auth/auth.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyUsersModule } from './company-users/company-users.module';
import { AssistantModule } from './assistant/assistant.module';

@Module({
  imports: [
    // ❌ Retirer DiscoveryModule et ScheduleModule.forRoot()
    // DiscoveryModule,
    // ScheduleModule.forRoot(),

    // DB
    MongooseModule.forRoot('mongodb://localhost:27017/gmao_db'),

    // Modules métier
    UserModule,
    CompanyModule,
    EquipmentModule,
    MaintenanceModule,
    ReportModule,
    SchedulingModule,
    AuthModule,
    CompanyUsersModule,
    AssistantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
