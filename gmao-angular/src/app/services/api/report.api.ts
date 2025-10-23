import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface ReportDto {
  _id?: string;

  // obligatoire côté backend
  maintenanceId: string;

  // optionnels
  description?: string | null;
  partsReplaced?: string | null; // ⚠ même nom que le backend
  duration?: string | null;
  submittedBy?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportApi {
  constructor(private http: HttpClient) {}

  list(): Observable<ReportDto[]> {
    return this.http.get<ReportDto[]>(`${API}/reports`);
  }

  create(dto: ReportDto): Observable<ReportDto> {
    return this.http.post<ReportDto>(`${API}/reports`, dto);
  }

  update(id: string, dto: Partial<ReportDto>): Observable<ReportDto> {
    return this.http.put<ReportDto>(`${API}/reports/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/reports/${id}`);
  }
}
