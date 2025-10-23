import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export type MaintenanceType = 'Préventive' | 'Corrective';
export type MaintenanceStatus = 'En attente' | 'En cours' | 'terminée';

export interface MaintenanceDto {
  _id?: string;
  type: MaintenanceType;
  plannedDate?: string | Date | null;
  dueDate?: string | Date | null;
  status?: MaintenanceStatus | null;
  description?: string | null;
  equipmentId: string;

  companyId?: string | null;
  userId?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceApi {
  constructor(private http: HttpClient) {}

  list(): Observable<MaintenanceDto[]> {
    return this.http.get<MaintenanceDto[]>(`${API}/maintenances`);
  }

  create(dto: MaintenanceDto): Observable<MaintenanceDto> {
    return this.http.post<MaintenanceDto>(`${API}/maintenances`, dto);
  }

  update(id: string, dto: Partial<MaintenanceDto>): Observable<MaintenanceDto> {
    return this.http.put<MaintenanceDto>(`${API}/maintenances/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/maintenances/${id}`);
  }
}
