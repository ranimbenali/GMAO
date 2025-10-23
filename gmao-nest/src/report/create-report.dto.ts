import { IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @IsString()
  maintenanceId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  partsReplaced?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  submittedBy?: string;

  // 🔹 injecté automatiquement pour les non-SuperAdmin
  @IsOptional()
  @IsString()
  companyId?: string;
}
