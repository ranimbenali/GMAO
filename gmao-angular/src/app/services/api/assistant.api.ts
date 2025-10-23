import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Equipment = {
  _id: string;
  name: string;
  type?: string;
  location?: string;
  commissionDate?: string;
};

export type Maintenance = {
  _id: string;
  type: string;               // Préventive/Corrective/Inspection…
  status: string;             // "En attente", "En cours", "Terminée"
  plannedDate?: string;
  startDate?: string;
  endDate?: string;
  equipmentId: string;
};

export type Scheduling = {
  _id: string;
  equipmentId: string;
  frequency: string;
  nextDate: string;           // ISO
};

@Injectable({ providedIn: 'root' })
export class AssistantApi {
  constructor(private http: HttpClient) {}

  async countEquipments(): Promise<number> {
    const data = await firstValueFrom(this.http.get<Equipment[]>('/api/equipments'));
    return data.length;
  }

  async maintenances(): Promise<Maintenance[]> {
    return await firstValueFrom(this.http.get<Maintenance[]>('/api/maintenances'));
  }

  async countMaintenancesByStatus(target: string): Promise<number> {
    const list = await this.maintenances();
    const t = target.toLowerCase();
    return list.filter(m => (m.status || '').toLowerCase().includes(t)).length;
  }

  async upcomingMaintenances7d(): Promise<number> {
    const list = await this.maintenances();
    const now = new Date();
    const in7 = new Date(); in7.setDate(now.getDate() + 7);

    const hasPlanned = list.some(m => !!m.plannedDate);
    if (hasPlanned) {
      return list.filter(m => {
        if (!m.plannedDate) return false;
        const d = new Date(m.plannedDate);
        return d >= now && d <= in7;
      }).length;
    }

    // fallback via /api/scheduling si disponible
    try {
      const sched = await firstValueFrom(this.http.get<Scheduling[]>('/api/scheduling'));
      return sched.filter(s => {
        const d = new Date(s.nextDate);
        return d >= now && d <= in7;
      }).length;
    } catch {
      return 0;
    }
  }
}
