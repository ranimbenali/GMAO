import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import {
  MaintenanceApi,
  MaintenanceDto,
  MaintenanceType,
  MaintenanceStatus,
} from '../../services/api/maintenance.api';

@Component({
  standalone: true,
  selector: 'app-maintenance-list',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h2>Maintenances</h2>
      </div>

      <form [formGroup]="form" class="card form" (ngSubmit)="submit()">
        <div class="row">
          <label>Type</label>
          <select formControlName="type">
            <option [ngValue]="null" disabled>Choisir…</option>
            <option *ngFor="let t of types" [value]="t">{{ t }}</option>
          </select>
        </div>

        <div class="row">
          <label>Date planifiée</label>
          <input type="date" formControlName="plannedDate" />
        </div>

        <div class="row">
          <label>Date d'échéance</label>
          <input type="date" formControlName="dueDate" />
        </div>

        <div class="row">
          <label>Statut</label>
          <select formControlName="status">
            <option [ngValue]="null">—</option>
            <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
          </select>
        </div>

        <div class="row">
          <label>Équipement (ID)</label>
          <input placeholder="ID de l'équipement" formControlName="equipmentId" />
        </div>

        <div class="row row--full">
          <label>Description</label>
          <input placeholder="Notes…" formControlName="description" />
        </div>

        <div class="actions">
          <button type="submit" class="g-btn g-btn--primary" [disabled]="form.invalid || saving">
            {{ editingId ? (saving ? 'Enregistrement…' : 'Mettre à jour') : (saving ? 'Ajout…' : 'Ajouter') }}
          </button>
          <button *ngIf="editingId" type="button" class="g-btn" (click)="cancelEdit()">Annuler</button>

          <span class="g-msg g-msg--err" *ngIf="error">{{ error }}</span>
          <span class="g-msg g-msg--ok" *ngIf="ok">{{ ok }}</span>
        </div>
      </form>

      <div class="card table">
        <table>
          <thead>
          <tr>
            <th>Type</th>
            <th>Date planifiée</th>
            <th>Échéance</th>
            <th>Statut</th>
            <th>Équipement</th>
            <th style="width:150px;"></th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let m of data">
            <td>{{ m.type }}</td>
            <td>{{ m.plannedDate | date:'yyyy-MM-dd' }}</td>
            <td>{{ m.dueDate | date:'yyyy-MM-dd' }}</td>
            <td>{{ m.status || '—' }}</td>
            <td>{{ m.equipmentId }}</td>
            <td class="actions--row">
              <button class="g-btn g-btn--light g-btn--sm" type="button" (click)="edit(m)">Modifier</button>
              <button class="g-btn g-btn--danger g-btn--sm" type="button" (click)="remove(m._id!)">Suppr.</button>
            </td>
          </tr>
          <tr *ngIf="!data.length">
            <td colspan="6" class="empty">Aucune maintenance pour le moment.</td>
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
    .row--full{ grid-column:1 / -1; }
    .row input, .row select{ padding:8px 10px; border:1px solid #e3e3e7; border-radius:8px; }
    .actions{ grid-column:1/-1; display:flex; gap:10px; align-items:center; }
    .actions--row{ display:flex; gap:8px; }
    .g-btn{ border:none; border-radius:10px; padding:8px 12px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; min-width:120px; height:38px; font-weight:600; }
    .g-btn--primary{ background:#3a36db; color:#fff; }
    .g-btn--danger{ background:#ef4444; color:#fff; }
    .g-btn--light{ background:#eef2ff; color:#111; }
    .g-btn--sm{ padding:6px 10px; border-radius:8px; min-width:auto; height:auto; font-weight:500; }
    table{ width:100%; border-collapse:collapse; }
    th, td{ padding:10px 12px; text-align:left; border-bottom:1px solid #eee; }
    .empty{ text-align:center; color:#888; }
    .g-msg--err{ color:#ef4444; }
    .g-msg--ok{ color:#16a34a; }
  `]
})
export class MaintenanceListComponent implements OnInit {
  data: MaintenanceDto[] = [];
  saving = false;
  error = '';
  ok = '';
  editingId: string | null = null;

  types: MaintenanceType[] = ['Préventive', 'Corrective'];
  statuses: MaintenanceStatus[] = ['En attente', 'En cours', 'terminée'];

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: MaintenanceApi,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      type: [null, Validators.required],
      plannedDate: [''],
      dueDate: [''],
      status: [null],
      description: [''],
      equipmentId: ['', Validators.required],
    });
    this.load();
  }

  private toInputDate(d?: string | Date | null): string {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  load(): void {
    this.error = '';
    this.api.list().subscribe({
      next: (r) => (this.data = r ?? []),
      error: () => (this.error = 'Erreur lors du chargement')
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.saving = true; this.error = ''; this.ok = '';
    const raw = this.form.value;
    const dto: MaintenanceDto = {
      type: raw.type,
      plannedDate: raw.plannedDate || undefined,
      dueDate: raw.dueDate || undefined,
      status: raw.status || undefined,
      description: raw.description || undefined,
      equipmentId: raw.equipmentId,
    };

    if (!this.editingId) {
      this.api.create(dto).subscribe({
        next: (created) => {
          this.ok = 'Maintenance ajoutée';
          this.saving = false;
          this.form.reset();
          this.data = [created, ...this.data];
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.message ?? 'Erreur lors de l’ajout';
        }
      });
    } else {
      this.api.update(this.editingId, dto).subscribe({
        next: (updated) => {
          this.ok = 'Maintenance mise à jour';
          this.saving = false;
          this.form.reset();
          this.data = this.data.map(x => x._id === updated._id ? updated : x);
          this.editingId = null;
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.message ?? 'Erreur lors de la mise à jour';
        }
      });
    }
  }

  edit(m: MaintenanceDto): void {
    this.editingId = m._id ?? null;
    this.form.patchValue({
      type: m.type ?? null,
      plannedDate: this.toInputDate(m.plannedDate ?? null),
      dueDate: this.toInputDate(m.dueDate ?? null),
      status: m.status ?? null,
      description: m.description ?? '',
      equipmentId: m.equipmentId ?? '',
    });
    this.ok = '';
    this.error = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset();
    this.ok = '';
    this.error = '';
  }

  remove(id?: string): void {
    if (!id) return;
    this.api.remove(id).subscribe({
      next: () => (this.data = this.data.filter(x => x._id !== id)),
      error: () => (this.error = 'Suppression impossible')
    });
  }
}
