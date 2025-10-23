import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './report.schema';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
    AuthModule, // pour JwtGuard
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
