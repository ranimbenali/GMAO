import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService, UserDto } from '../../services/auth.service';

/**
 * Page Paramètres (standalone)
 * - Affiche les infos de l'utilisateur (name/email)
 * - Permet de mettre à jour l'email via AuthService.putMeEmail
 * - Permet de changer le mot de passe via AuthService.putMePassword
 * - Permet de choisir une préférence UI locale (sidebar ouverte/fermée par défaut)
 *
 * ⚠️ On ne supprime rien d'existant. On n'ajoute que l'essentiel.
 */
@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="header">
        <h2>Paramètres</h2>
      </div>

      <!-- Carte "Profil" -->
      <div class="card">
        <h3>Profil</h3>
        <div class="profile-row">
          <div class="avatar">{{ initials }}</div>
          <div class="info">
            <div class="label">Nom</div>
            <div class="value">{{ name || 'Utilisateur' }}</div>
            <div class="label muted">Email actuel</div>
            <div class="value muted">{{ email || '—' }}</div>
          </div>
        </div>
      </div>

      <!-- Carte "Email" -->
      <form [formGroup]="emailForm" class="card form" (ngSubmit)="saveEmail()">
        <h3>Mettre à jour l'email</h3>
        <div class="row">
          <label>Nouvel email</label>
          <input type="email" formControlName="email" placeholder="votre@email.com" />
        </div>
        <div class="actions">
          <button class="g-btn g-btn--primary" type="submit" [disabled]="emailForm.invalid || savingEmail">
            {{ savingEmail ? 'Enregistrement…' : 'Mettre à jour' }}
          </button>
          <span class="g-msg g-msg--ok" *ngIf="okEmail">{{ okEmail }}</span>
          <span class="g-msg g-msg--err" *ngIf="errEmail">{{ errEmail }}</span>
        </div>
      </form>

      <!-- Carte "Mot de passe" -->
      <form [formGroup]="pwdForm" class="card form" (ngSubmit)="savePassword()">
        <h3>Changer le mot de passe</h3>
        <div class="row">
          <label>Mot de passe actuel</label>
          <input type="password" formControlName="currentPassword" placeholder="Mot de passe actuel" />
        </div>
        <div class="row">
          <label>Nouveau mot de passe</label>
          <input type="password" formControlName="newPassword" placeholder="Nouveau mot de passe" />
        </div>
        <div class="row">
          <label>Confirmer</label>
          <input type="password" formControlName="confirm" placeholder="Confirmer le nouveau mot de passe" />
        </div>
        <div class="actions">
          <button class="g-btn g-btn--primary" type="submit" [disabled]="pwdForm.invalid || savingPwd">
            {{ savingPwd ? 'Enregistrement…' : 'Changer' }}
          </button>
          <span class="g-msg g-msg--ok" *ngIf="okPwd">{{ okPwd }}</span>
          <span class="g-msg g-msg--err" *ngIf="errPwd">{{ errPwd }}</span>
        </div>
      </form>

      <!-- Carte "Préférences" -->
      <div class="card form">
        <h3>Préférences</h3>
        <div class="row">
          <label class="checkbox">
            <input type="checkbox" [checked]="sidebarExpanded" (change)="toggleSidebarPref($event)" />
            Ouvrir la sidebar (menu) par défaut
          </label>
        </div>
        <div class="actions">
          <span class="g-msg g-msg--ok" *ngIf="okPref">{{ okPref }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page{ padding:20px; display:grid; gap:16px; }
    .header{ margin-bottom:8px; }
    .card{ background:#fff; border-radius:12px; padding:16px; box-shadow:0 3px 10px rgba(0,0,0,.05); }
    h3{ margin:0 0 12px 0; font-size:16px; }
    .form{ display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:12px; align-items:end; }
    .row{ display:flex; flex-direction:column; gap:6px; }
    .row input{ padding:10px 12px; border:1px solid #e6e7ef; border-radius:10px; }
    .actions{ grid-column:1/-1; display:flex; gap:12px; align-items:center; }
    .g-btn{ border:none; border-radius:10px; padding:10px 14px; cursor:pointer; min-width:140px; height:40px; font-weight:600; }
    .g-btn--primary{ background:#3a36db; color:#fff; }
    .g-msg--ok{ color:#16a34a; }
    .g-msg--err{ color:#ef4444; }
    .profile-row{ display:flex; gap:14px; align-items:center; }
    .avatar{ width:48px; height:48px; border-radius:50%; background:#eef2ff; color:#3a36db;
      display:flex; align-items:center; justify-content:center; font-weight:700; }
    .info .label{ font-size:12px; color:#6b7280; }
    .info .value{ font-weight:600; margin-bottom:6px; }
    .muted{ opacity:.85; }
    .checkbox{ display:flex; align-items:center; gap:10px; font-weight:500; }
  `]
})
export class SettingsComponent implements OnInit {
  name = '';
  email = '';
  initials = 'U';

  emailForm!: FormGroup;
  pwdForm!: FormGroup;

  savingEmail = false;
  savingPwd = false;

  okEmail = ''; errEmail = '';
  okPwd = '';   errPwd = '';

  // préférence locale : même clé que la navigation
  private NAV_STATE_KEY = 'sidebar_expanded';
  sidebarExpanded = true;
  okPref = '';

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit(): void {
    // init forms
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.pwdForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirm: ['', Validators.required],
    });

    // charger user courant (depuis cache + stream)
    const cached = this.auth.getUserInfo();
    if (cached) this.hydrateUser(cached);

    this.auth.currentUser$.subscribe(u => { if (u) this.hydrateUser(u); });

    // préférences
    const raw = localStorage.getItem(this.NAV_STATE_KEY);
    this.sidebarExpanded = raw ? JSON.parse(raw) : true;
  }

  private hydrateUser(u: UserDto) {
    this.name = u?.name ?? '';
    this.email = u?.email ?? '';
    this.initials = (this.name?.[0] ?? 'U').toUpperCase();
    this.emailForm.patchValue({ email: this.email || '' }, { emitEvent: false });
  }

  // --- actions ---
  saveEmail(): void {
    if (this.emailForm.invalid) return;
    this.okEmail = ''; this.errEmail = ''; this.savingEmail = true;

    const value = this.emailForm.value.email as string;
    this.auth.putMeEmail(value).subscribe({
      next: () => {
        this.savingEmail = false;
        this.okEmail = 'Email mis à jour';
      },
      error: (err) => {
        this.savingEmail = false;
        this.errEmail = err?.error?.message ?? 'Erreur lors de la mise à jour';
      }
    });
  }

  savePassword(): void {
    if (this.pwdForm.invalid) return;
    this.okPwd = ''; this.errPwd = ''; this.savingPwd = true;

    const { currentPassword, newPassword, confirm } = this.pwdForm.value;
    if (newPassword !== confirm) {
      this.savingPwd = false;
      this.errPwd = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.auth.putMePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPwd = false;
        this.okPwd = 'Mot de passe modifié';
        this.pwdForm.reset();
      },
      error: (err) => {
        this.savingPwd = false;
        this.errPwd = err?.error?.message ?? 'Erreur lors du changement de mot de passe';
      }
    });
  }

  toggleSidebarPref(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    this.sidebarExpanded = !!input.checked;
    localStorage.setItem(this.NAV_STATE_KEY, JSON.stringify(this.sidebarExpanded));
    this.okPref = 'Préférence enregistrée. (Prend effet immédiatement à la prochaine navigation)';
    // tu verras l’effet en changeant de page ou en rechargant.
  }
}
