import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { EquipmentApi, EquipmentDto } from '../../services/api/equipment.api';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-equipment-list',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h2>Équipements</h2>
      </div>

      <form [formGroup]="form" class="card form" (ngSubmit)="save()">
        <div class="row">
          <label>Nom</label>
          <input formControlName="name" placeholder="Ex: Pompe P-101" />
        </div>
        <div class="row">
          <label>Type</label>
          <input formControlName="type" placeholder="Ex: Pompe" />
        </div>
        <div class="row">
          <label>Date MES</label>
          <input type="date" formControlName="dateMES" />
        </div>
        <div class="row">
          <label>Localisation</label>
          <input formControlName="location" placeholder="Ex: Atelier A" />
        </div>

        <div class="actions">
          <button type="submit" class="g-btn g-btn--primary" [disabled]="form.invalid || creating">
            {{ creating ? (editingId ? 'Enregistrement…' : 'Ajout…')
            : (editingId ? 'Enregistrer' : 'Ajouter') }}
          </button>

          <button *ngIf="editingId" type="button" class="g-btn g-btn--light" (click)="cancelEdit()">
            Annuler
          </button>

          <span class="g-msg g-msg--err" *ngIf="error">{{ error }}</span>
          <span class="g-msg g-msg--ok" *ngIf="ok">{{ ok }}</span>
        </div>
      </form>

      <div class="card table">
        <table>
          <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Date MES</th>
            <th>Localisation</th>
            <th style="width:160px;"></th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let e of data">
            <td>{{ e.name }}</td>
            <td>{{ e.type }}</td>
            <td>{{ e.dateMES | date:'yyyy-MM-dd' }}</td>
            <td>{{ e.location }}</td>
            <td class="actions-cell">
              <button class="g-btn g-btn--light g-btn--sm" type="button" (click)="edit(e)">Modifier</button>
              <button class="g-btn g-btn--danger g-btn--sm" type="button" (click)="remove(e._id!)">Suppr.</button>
            </td>
          </tr>
          <tr *ngIf="!data.length">
            <td colspan="5" class="empty">Aucun équipement pour le moment.</td>
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
    .row input{ padding:8px 10px; border:1px solid #e3e3e7; border-radius:8px; }
    .actions{ grid-column:1/-1; display:flex; gap:10px; align-items:center; }
    .g-btn{ border:none; border-radius:10px; padding:8px 12px; cursor:pointer;
      display:inline-flex; align-items:center; justify-content:center;
      min-width:120px; height:38px; font-weight:600; }
    .g-btn--primary{ background:#3a36db; color:#fff; }
    .g-btn--light{ background:#eef0ff; color:#1f2a59; }
    .g-btn--danger{ background:#ef4444; color:#fff; }
    .g-btn--sm{ padding:6px 10px; border-radius:8px; min-width:auto; height:auto; font-weight:500; }
    .actions-cell{ display:flex; gap:8px; }
    table{ width:100%; border-collapse:collapse; }
    th, td{ padding:10px 12px; text-align:left; border-bottom:1px solid #eee; }
    .empty{ text-align:center; color:#888; }
    .g-msg--err{ color:#ef4444; }
    .g-msg--ok{ color:#16a34a; }
  `]
})
export class EquipmentListComponent implements OnInit {
  data: EquipmentDto[] = [];
  creating = false;
  error = '';
  ok = '';
  form!: FormGroup;

  // id de l’équipement en cours d’édition (null = création)
  editingId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: EquipmentApi,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      dateMES: [''],
      location: [''],
    });
    this.load();
  }

  load(): void {
    this.api.list().subscribe({
      next: r => this.data = r ?? [],
      error: () => this.error = 'Erreur lors du chargement'
    });
  }

  /** Passe en mode édition et pré-remplit le formulaire */
  edit(e: EquipmentDto): void {
    this.editingId = e._id ?? null;
    this.ok = ''; this.error = '';

    // alimente le champ <input type="date"> en yyyy-MM-dd
    const date = e.dateMES ? new Date(e.dateMES) : null;
    const iso = date
      ? new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
        .toISOString().substring(0, 10)
      : '';

    this.form.patchValue({
      name: e.name ?? '',
      type: e.type ?? '',
      dateMES: iso,
      location: e.location ?? '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset();
    this.ok = ''; this.error = '';
  }

  /** Création OU modification selon editingId */
  save(): void {
    if (this.form.invalid) return;
    this.creating = true; this.error = ''; this.ok = '';

    const u = this.auth.getUserInfo();
    const body: Partial<EquipmentDto> = {
      ...(this.form.value as any),
      companyId: u?.companyId,
    };
    if (body.dateMES) body.dateMES = `${body.dateMES}`;

    // UPDATE
    if (this.editingId) {
      this.api.update(this.editingId, body).subscribe({
        next: (updated) => {
          this.ok = 'Équipement modifié';
          this.creating = false; this.editingId = null; this.form.reset();
          this.data = this.data.map(x => x._id === updated._id ? updated : x);
        },
        error: (err) => {
          this.creating = false;
          this.error = err?.error?.message ?? 'Erreur lors de la modification';
        }
      });
      return;
    }

    // CREATE (inchangé)
    this.api.create(body as EquipmentDto).subscribe({
      next: (created) => {
        this.ok = 'Équipement ajouté';
        this.form.reset(); this.creating = false;
        this.data = [created, ...this.data];
      },
      error: (err) => {
        this.creating = false;
        this.error = err?.error?.message ?? 'Erreur lors de l’ajout';
      }
    });
  }

  remove(id: string): void {
    if (!id) return;
    this.api.remove(id).subscribe({
      next: () => this.data = this.data.filter(x => x._id !== id),
      error: () => this.error = 'Suppression impossible'
    });
  }
}
