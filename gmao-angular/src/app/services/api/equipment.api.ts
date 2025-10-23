import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface EquipmentDto {
  _id?: string;
  name: string;
  type: string;
  dateMES?: string | Date | null;
  location?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class EquipmentApi {
  constructor(private http: HttpClient) {}

  list(): Observable<EquipmentDto[]> {
    return this.http.get<EquipmentDto[]>(`${API}/equipments`);
  }

  create(dto: EquipmentDto): Observable<EquipmentDto> {
    return this.http.post<EquipmentDto>(`${API}/equipments`, dto);
  }

  update(id: string, body: Partial<EquipmentDto>): Observable<EquipmentDto> {
    return this.http.put<EquipmentDto>(`${API}/equipments/${id}`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/equipments/${id}`);
  }
}
