import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, UserDto } from '../../services/auth.service';
import { EquipmentApi } from '../../services/api/equipment.api';
import {
  MaintenanceApi,
  MaintenanceDto,
} from '../../services/api/maintenance.api';
import { SchedulingApi } from '../../services/api/scheduling.api';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dash">
      <!-- En-tête bienvenue -->
      <div class="hero">
        <div class="hero__text">
          <h1>Bienvenue sur votre GMAO, {{ username }}</h1>
          <p>Suivez vos équipements, vos interventions et vos planifications — en un coup d'œil.</p>
        </div>
        <div class="hero__actions">
          <button class="btn btn--primary" (click)="go('/maintenance')">
            <i class="fas fa-plus-circle"></i> Nouvelle intervention
          </button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpis">
        <div class="kpi" [class.loading]="loading">
          <div class="kpi__icon kpi__icon--equip"><i class="fas fa-tools"></i></div>
          <div class="kpi__content">
            <span class="kpi__label">Équipements</span>
            <span class="kpi__value">{{ counts.equipments }}</span>
          </div>
        </div>

        <div class="kpi" [class.loading]="loading">
          <div class="kpi__icon kpi__icon--pending"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="kpi__content">
            <span class="kpi__label">Interventions en attente</span>
            <span class="kpi__value">{{ counts.maintPending }}</span>
          </div>
        </div>

        <div class="kpi" [class.loading]="loading">
          <div class="kpi__icon kpi__icon--done"><i class="fas fa-check-circle"></i></div>
          <div class="kpi__content">
            <span class="kpi__label">Interventions terminées</span>
            <span class="kpi__value">{{ counts.maintDone }}</span>
          </div>
        </div>

        <div class="kpi" [class.loading]="loading">
          <div class="kpi__icon kpi__icon--calendar"><i class="fas fa-calendar-check"></i></div>
          <div class="kpi__content">
            <span class="kpi__label">Planifications actives</span>
            <span class="kpi__value">{{ counts.schedActive }}</span>
          </div>
        </div>
      </div>

      <!-- deux colonnes -->
      <div class="grid">
        <!-- Interventions récentes -->
        <div class="card">
          <div class="card__head">
            <h3>Interventions récentes</h3>
            <a class="link" (click)="go('/maintenance')">Voir tout</a>
          </div>

          <div class="table">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Date planifiée</th>
                  <th>Équipement</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of recentMaintenances; trackBy: trackById">
                  <td>{{ m.type }}</td>
                  <td>
                    <span class="status"
                          [class.st--pending]="m.status === 'En attente'"
                          [class.st--progress]="m.status === 'En cours'"
                          [class.st--done]="m.status === 'terminée'">
                      {{ m.status || '—' }}
                    </span>
                  </td>
                  <td>{{ toDate(m.plannedDate) }}</td>
                  <td>{{ short(m.equipmentId) }}</td>
                </tr>
                <tr *ngIf="!recentMaintenances.length && !loading">
                  <td colspan="4" class="empty">Aucune intervention récente.</td>
                </tr>
                <tr *ngIf="loading">
                  <td colspan="4" class="skeleton-row"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Rappels / Prochaines échéances -->
        <div class="card">
          <div class="card__head">
            <h3>À venir (7 jours)</h3>
          </div>

          <ul class="list">
            <li *ngFor="let r of next7Days; trackBy: trackById">
              <i class="fas fa-bell"></i>
              <div class="list__content">
                <div class="list__title">{{ r.type }} <span class="muted">— {{ short(r.equipmentId) }}</span></div>
                <div class="list__meta">Prévu le {{ toDate(r.plannedDate) }}</div>
              </div>
            </li>
            <li *ngIf="!next7Days.length && !loading" class="empty">Rien à l'horizon immédiat.</li>
            <li *ngIf="loading" class="skeleton-line"></li>
          </ul>
        </div>
      </div>

      <div *ngIf="error" class="error">{{ error }}</div>
    </div>
  `,
  styles: [`
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

    .dash{ padding:24px; }

    .hero{
      background: linear-gradient(135deg, #3a36db, #7b50e6);
      color:#fff; border-radius:14px; padding:24px;
      display:flex; align-items:center; justify-content:space-between;
      gap:16px; box-shadow:0 6px 16px rgba(0,0,0,.08); margin-bottom:22px;
    }
    .hero h1{ margin:0 0 6px 0; font-size:22px; }
    .hero p{ margin:0; opacity:.9; }
    .btn{ border:none; border-radius:12px; padding:10px 14px; font-weight:600; cursor:pointer; }
    .btn--primary{ background:#fff; color:#3a36db; }
    .btn--primary i{ margin-right:8px; }

    .kpis{ display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-bottom:22px; }
    .kpi{ background:#fff; border-radius:12px; padding:16px; display:flex; gap:12px; align-items:center; box-shadow:0 4px 12px rgba(0,0,0,.06); position:relative; overflow:hidden; }
    .kpi.loading::after{
      content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(0,0,0,.04),transparent);
      animation: shimmer 1.2s infinite;
    }
    @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

    .kpi__icon{ width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px; }
    .kpi__icon--equip{ background:linear-gradient(45deg,#ff8a00,#ff3e3e) }
    .kpi__icon--pending{ background:linear-gradient(45deg,#ffb703,#fb8500) }
    .kpi__icon--done{ background:linear-gradient(45deg,#2dd4bf,#22c55e) }
    .kpi__icon--calendar{ background:linear-gradient(45deg,#7c3aed,#06b6d4) }

    .kpi__label{ display:block; color:#666; font-size:12px; }
    .kpi__value{ font-size:26px; font-weight:800; color:#1f2a59; }

    .grid{ display:grid; grid-template-columns: 1.2fr .8fr; gap:16px; }
    @media (max-width: 1100px){ .grid{ grid-template-columns: 1fr; } }

    .card{ background:#fff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,.06); overflow:hidden; }
    .card__head{ display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid #f0f2f7; }
    .card__head h3{ margin:0; font-size:16px; }
    .link{ color:#3a36db; cursor:pointer; }

    .table{ width:100%; overflow:auto; }
    table{ width:100%; border-collapse:collapse; }
    th, td{ padding:12px 16px; border-bottom:1px solid #f2f3f7; text-align:left; }
    .empty{ text-align:center; color:#8b8ea3; padding:16px; }

    .status{ padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; background:#eef0ff; color:#1f2a59; }
    .st--pending{ background:rgba(255,193,7,.12); color:#d97706; }
    .st--progress{ background:rgba(59,130,246,.12); color:#2563eb; }
    .st--done{ background:rgba(34,197,94,.12); color:#16a34a; }

    .list{ list-style:none; margin:0; padding:8px 14px 14px; }
    .list li{ display:flex; gap:12px; padding:10px 6px; border-bottom:1px dashed #f0f2f7; align-items:center; }
    .list i{ color:#7c3aed; }
    .list__title{ font-weight:600; }
    .list__meta{ color:#6b7280; font-size:12px; }
    .muted{ color:#9aa0b5; font-weight:400; }
    .skeleton-row{ height:48px; background:linear-gradient(90deg,#fff, #f4f5fb, #fff); animation: shimmer 1.2s infinite; }
    .skeleton-line{ height:20px; background:linear-gradient(90deg,#fff, #f4f5fb, #fff); animation: shimmer 1.2s infinite; border-radius:6px; margin:6px 0; }
    .error{ margin-top:16px; color:#b91c1c; font-weight:600; }
  `]
})
export class HomeComponent implements OnInit {
  username = 'Utilisateur';

  loading = true;
  error = '';

  counts = {
    equipments: 0,
    maintPending: 0,
    maintDone: 0,
    schedActive: 0,
  };

  recentMaintenances: MaintenanceDto[] = [];
  next7Days: MaintenanceDto[] = [];

  constructor(
    private auth: AuthService,
    private equipApi: EquipmentApi,
    private maintApi: MaintenanceApi,
    private schedApi: SchedulingApi,
    private router: Router
  ) {}

  ngOnInit(): void {
    const u: UserDto | null = this.auth.getUserInfo();
    if (u?.name) this.username = u.name;

    // Charger toutes les données en parallèle
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = '';

    // 1) Équipements
    this.equipApi.list().subscribe({
      next: eqs => (this.counts.equipments = (eqs || []).length),
      error: () => (this.error ||= 'Erreur équipements'),
    });

    // 2) Planifications (scheduling)
    this.schedApi.list().subscribe({
      next: rows => (this.counts.schedActive = (rows || []).length),
      error: () => (this.error ||= 'Erreur planifications'),
    });

    // 3) Maintenances (pour KPIs + listes)
    this.maintApi.list().subscribe({
      next: (rows) => {
        const all = rows || [];

        // KPIs
        this.counts.maintPending = all.filter(m => m.status === 'En attente').length;
        this.counts.maintDone    = all.filter(m => m.status === 'terminée').length;

        // Récentes = tri par date planifiée desc, top 6
        const sorted = [...all].sort((a, b) =>
          this.dateMs(b.plannedDate) - this.dateMs(a.plannedDate)
        );
        this.recentMaintenances = sorted.slice(0, 6);

        // À venir 7 jours
        const now = this.startOfToday();
        const plus7 = new Date(now); plus7.setDate(now.getDate() + 7);
        this.next7Days = all.filter(m => {
          const d = this.dateObj(m.plannedDate);
          return d >= now && d <= plus7;
        }).sort((a, b) => this.dateMs(a.plannedDate) - this.dateMs(b.plannedDate))
          .slice(0, 6);
      },
      error: () => (this.error ||= 'Erreur maintenances'),
      complete: () => (this.loading = false),
    });
  }

  // Helpers UI
  go(path: string){ this.router.navigate([path]); }
  toDate(d?: string | Date | null): string {
    if (!d) return '';
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return '';
    return x.toISOString().slice(0,10);
  }
  short(id?: string | null){ return id ? id.substring(0,8) + '…' : '—'; }
  trackById = (_: number, r: any) => r._id ?? r.id ?? r.equipmentId;

  private startOfToday(): Date {
    const d = new Date(); d.setHours(0,0,0,0); return d;
    }
  private dateObj(d?: string | Date | null): Date {
    return d ? new Date(d) : new Date(NaN);
  }
  private dateMs(d?: string | Date | null): number {
    const x = this.dateObj(d); return x.getTime() || 0;
  }
}
