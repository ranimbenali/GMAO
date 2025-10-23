import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum Role {
  SuperAdmin = 'SuperAdmin',
  AdminEntreprise = 'AdminEntreprise',
  Technicien = 'Technicien',
  User = 'User',
}

export type CompanyUser = {
  _id: string;
  name: string;
  email: string;
  role: Role | string;
  companyId?: string;
};

export type CreateCompanyUserDto = {
  name: string;
  email: string;
  role: Role;
  password?: string;
};

export type UpdateCompanyUserDto = {
  name?: string;
  role?: Role;
};

@Injectable({ providedIn: 'root' })
export class CompanyUsersApi {
  private readonly base = '/api/company-users'; // ✅ même chemin que le backend

  constructor(private http: HttpClient) {}

  list(): Observable<CompanyUser[]> {
    return this.http.get<CompanyUser[]>(this.base);
  }

  create(dto: CreateCompanyUserDto): Observable<CompanyUser> {
    return this.http.post<CompanyUser>(this.base, dto);
  }

  update(id: string, dto: UpdateCompanyUserDto): Observable<CompanyUser> {
    return this.http.put<CompanyUser>(`${this.base}/${id}`, dto);
  }

  remove(id: string): Observable<{ ok: true }> {
    return this.http.delete<{ ok: true }>(`${this.base}/${id}`);
  }

  /** ✅ NOUVEAU : mise à jour d’un mot de passe choisi par l’admin */
  updatePassword(id: string, newPassword: string): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>(`${this.base}/${id}/update-password`, {
      newPassword,
    });
  }
}
