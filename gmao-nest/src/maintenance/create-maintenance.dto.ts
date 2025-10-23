import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { MaintenanceStatus, MaintenanceType } from './maintenance.schema';

export class CreateMaintenanceDto {
  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @IsOptional()
  @IsDateString()
  plannedDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  equipmentId!: string;

  // injecté automatiquement pour les non-SuperAdmin
  @IsOptional()
  @IsString()
  companyId?: string;
}
