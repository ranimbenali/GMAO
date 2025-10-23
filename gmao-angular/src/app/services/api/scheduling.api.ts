import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export type SchedulingFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface SchedulingDto {
  _id?: string;
  equipmentId: string;
  frequency: SchedulingFrequency;
  nextDate: string | Date;   // ISO string côté front OK
  companyId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SchedulingApi {
  constructor(private http: HttpClient) {}

  list(filter: Partial<SchedulingDto> = {}): Observable<SchedulingDto[]> {
    return this.http.get<SchedulingDto[]>(`${API}/scheduling`, { params: filter as any });
  }

  create(dto: SchedulingDto): Observable<SchedulingDto> {
    return this.http.post<SchedulingDto>(`${API}/scheduling`, dto);
  }

  update(id: string, dto: Partial<SchedulingDto>): Observable<SchedulingDto> {
    return this.http.put<SchedulingDto>(`${API}/scheduling/${id}`, dto);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/scheduling/${id}`);
  }

  /** Déclenche l’exécution des planifs dues (POST /scheduling/run-due) */
  runDue(): Observable<number> {
    return this.http.post<number>(`${API}/scheduling/run-due`, {});
  }
}
