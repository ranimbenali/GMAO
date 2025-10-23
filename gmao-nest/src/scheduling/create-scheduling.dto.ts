import { IsEnum, IsString, IsDateString, IsOptional } from 'class-validator';
import { SchedulingFrequency } from './scheduling.schema';

export class CreateSchedulingDto {
  @IsString()
  equipmentId!: string;

  @IsEnum(SchedulingFrequency)
  frequency!: SchedulingFrequency;

  // string ISO (ex: "2025-08-31")
  @IsDateString()
  nextDate!: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}
