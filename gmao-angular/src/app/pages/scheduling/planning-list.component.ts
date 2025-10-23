// src/app/pages/scheduling/planning-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  SchedulingApi,
  SchedulingDto,
  SchedulingFrequency,
} from '../../services/api/scheduling.api';
import { EquipmentApi, EquipmentDto } from '../../services/api/equipment.api';

@Component({
  standalone: true,
  selector: 'app-planning-list',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h2>Planification</h2>
      </div>

      <!-- Formulaire -->
      <div class="card form">
        <div class="row">
          <label>Équipement</label>
          <select [(ngModel)]="form.equipmentId">
            <option [ngValue]="''">Choisir…</option>
            <option *ngFor="let e of equipments" [ngValue]="e._id">{{ e.name }}</option>
          </select>
        </div>

        <div class="row">
          <label>Fréquence</label>
          <select [(ngModel)]="form.frequency">
            <option [ngValue]="''">Choisir…</option>
            <option *ngFor="let f of frequencies" [ngValue]="f">{{ labels[f] }}</option>
          </select>
        </div>

        <div class="row">
          <label>Prochaine date</label>
          <input
            type="date"
            [(ngModel)]="form.nextDate"
            [attr.min]="today()"
          />
        </div>

        <div class="actions">
          <button class="g-btn g-btn--primary" (click)="save()">
            {{ editId ? 'Mettre à jour' : 'Ajouter' }}
          </button>
          <button *ngIf="editId" class="g-btn g-btn--light" (click)="reset()">Annuler</button>

          <button class="g-btn g-btn--success push-right" (click)="runDue()">
            Exécuter planifs dues
          </button>

          <span class="g-msg g-msg--ok" *ngIf="msgOk">{{ msgOk }}</span>
          <span class="g-msg g-msg--err" *ngIf="msgErr">{{ msgErr }}</span>
        </div>
      </div>

      <!-- Liste -->
      <div class="card table">
        <table>
          <thead>
          <tr>
            <th>Équipement</th>
            <th>Fréquence</th>
            <th>Prochaine date</th>
            <th style="width:160px;" class="text-right">Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let p of list; trackBy: trackById">
            <td>{{ nameOf(p.equipmentId) }}</td>
            <td>{{ labels[p.frequency] || p.frequency }}</td>
            <td>{{ formatDate(p.nextDate) }}</td>
            <td class="actions-row">
              <button class="g-btn g-btn--light g-btn--sm" (click)="edit(p)">Modifier</button>
              <button class="g-btn g-btn--danger g-btn--sm" (click)="remove(p)">Suppr.</button>
            </td>
          </tr>
          <tr *ngIf="list.length === 0">
            <td colspan="4" class="empty">Aucune planification pour le moment.</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page{ padding:20px; }
    .header{ margin-bottom:16px; }
    .card{ background:#fff; border-radius:10px; padding:16px; box-shadow:0 3px 10px rgba(0,0,0,.05); }
    .form{ margin-bottom:16px; display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:12px; align-items:end; }
    .row{ display:flex; flex-direction:column; gap:6px; }
    .row input, .row select{ padding:8px 10px; border:1px solid #e3e3e7; border-radius:8px; }
    .actions{ grid-column:1/-1; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .push-right{ margin-left:auto; }
    table{ width:100%; border-collapse:collapse; }
    th, td{ padding:10px 12px; text-align:left; border-bottom:1px solid #eee; }
    .text-right{ text-align:right; }
    .actions-row{ display:flex; gap:8px; justify-content:flex-end; }
    .empty{ text-align:center; color:#888; padding:20px 0; }
    .g-btn{ border:none; border-radius:10px; padding:8px 12px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; min-width:120px; height:38px; font-weight:600; }
    .g-btn--primary{ background:#3a36db; color:#fff; }
    .g-btn--light{ background:#eef2ff; color:#111; }
    .g-btn--danger{ background:#ef4444; color:#fff; }
    .g-btn--success{ background:#10b981; color:#fff; }
    .g-btn--sm{ padding:6px 10px; border-radius:8px; min-width:auto; height:auto; font-weight:500; }
    .g-msg--err{ color:#ef4444; }
    .g-msg--ok{ color:#16a34a; }
  `]
})
export class PlanningListComponent implements OnInit {
  private api = inject(SchedulingApi);
  private eqApi = inject(EquipmentApi);

  equipments: EquipmentDto[] = [];
  list: SchedulingDto[] = [];

  frequencies: SchedulingFrequency[] = ['daily', 'weekly', 'monthly', 'quarterly'];
  labels: Record<SchedulingFrequency, string> = {
    daily: 'Quotidienne',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuelle',
    quarterly: 'Trimestrielle',
  };

  editId: string | null = null;
  form: { equipmentId: string; frequency: SchedulingFrequency | ''; nextDate: string } = {
    equipmentId: '',
    frequency: '',
    nextDate: this.today(),
  };

  msgOk = '';
  msgErr = '';

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.eqApi.list().subscribe({ next: (eqs) => (this.equipments = eqs || []) });
    this.api.list().subscribe({
      next: (rows) => (this.list = rows || []),
      error: () => (this.msgErr = 'Erreur lors du chargement'),
    });
  }

  save(): void {
    this.msgOk = this.msgErr = '';

    if (!this.form.equipmentId || !this.form.frequency || !this.form.nextDate) {
      this.msgErr = 'Veuillez renseigner tous les champs.';
      return;
    }

    // Vérif front : la date ne doit pas être passée
    const chosen = new Date(this.form.nextDate); chosen.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    if (chosen < today) {
      this.msgErr = "La prochaine date doit être aujourd'hui ou dans le futur.";
      return;
    }

    const payload: SchedulingDto = {
      equipmentId: this.form.equipmentId,
      frequency: this.form.frequency as SchedulingFrequency,
      nextDate: new Date(this.form.nextDate).toISOString(),
    };

    const obs = this.editId ? this.api.update(this.editId, payload) : this.api.create(payload);

    obs.subscribe({
      next: () => {
        this.msgOk = this.editId ? 'Planification mise à jour' : 'Planification ajoutée';
        this.reset();
        this.loadAll();
      },
      error: (e) => (this.msgErr = e?.error?.message ?? 'Ajout/maj impossible'),
    });
  }

  edit(row: SchedulingDto): void {
    this.editId = row._id || null;
    this.form.equipmentId = row.equipmentId;
    this.form.frequency = row.frequency;
    this.form.nextDate = this.toInputDate(row.nextDate);
  }

  remove(row: SchedulingDto): void {
    if (!row._id) return;
    this.api.remove(row._id).subscribe({
      next: () => {
        this.msgOk = 'Planification supprimée';
        this.loadAll();
      },
      error: () => (this.msgErr = 'Suppression impossible'),
    });
  }

  runDue(): void {
    this.msgOk = this.msgErr = '';
    this.api.runDue().subscribe({
      next: (n) => (this.msgOk = `Planifs exécutées : ${n}`),
      error: () => (this.msgErr = 'Exécution impossible'),
    });
  }

  reset(): void {
    this.editId = null;
    this.form = { equipmentId: '', frequency: '', nextDate: this.today() };
  }

  // Helpers UI
  nameOf(id: string): string {
    return this.equipments.find((e) => e._id === id)?.name || id;
  }
  formatDate(d: string | Date | null | undefined): string {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toISOString().slice(0, 10);
  }
  toInputDate(d: string | Date | null | undefined): string {
    return this.formatDate(d);
  }
  today(): string {
    const t = new Date(); t.setHours(0,0,0,0);
    return new Date(t).toISOString().slice(0, 10);
  }
  trackById = (_: number, r: SchedulingDto) => r._id ?? r.equipmentId + '_' + r.nextDate;
}
