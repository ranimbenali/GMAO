import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface CompanyDto {
  _id?: string;
  name: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyApi {
  constructor(private http: HttpClient) {}

  /** Récupère l’entreprise du user courant */
  getMine(): Observable<CompanyDto> {
    return this.http.get<CompanyDto>(`${API}/company/me`);
  }

  /** Met à jour l’entreprise du user courant */
  updateMine(patch: Partial<CompanyDto>): Observable<CompanyDto> {
    return this.http.put<CompanyDto>(`${API}/company/me`, patch);
  }
}
