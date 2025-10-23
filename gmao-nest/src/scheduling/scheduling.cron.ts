import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SchedulingService } from './scheduling.service';

@Injectable()
export class SchedulingCron {
  private readonly logger = new Logger(SchedulingCron.name);
  constructor(private readonly scheduling: SchedulingService) {}

  @Cron(process.env.CRON_RUN_DUE || CronExpression.EVERY_DAY_AT_2AM, {
    timeZone: process.env.TZ || 'Europe/Paris',
  })
  async runDueNightly() {
    const n = await this.scheduling.runDue();
    this.logger.log(`Cron runDue: ${n} planif(s) exécutée(s).`);
  }
}
