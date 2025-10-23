import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { CompanyUsersApi, CompanyUser, Role } from '../../services/api/company-users.api';

@Component({
  selector: 'app-company-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-users.component.html',
  styleUrls: ['./company-users.component.scss'],
})
export class CompanyUsersComponent implements OnInit {
  loading = false;
  saving = false;
  errorMsg: string | null = null;

  users: CompanyUser[] = [];

  // rôles qu’un AdminEntreprise peut créer
  roles: Role[] = [Role.Technicien, Role.User];

  form: FormGroup;

  constructor(private fb: FormBuilder, private api: CompanyUsersApi) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: [Role.Technicien, Validators.required],
      password: [''], // optionnel à la création
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMsg = null;
    this.api
      .list()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (users) => (this.users = users),
        error: (err) => {
          this.errorMsg = err?.error?.message || 'Erreur de chargement.';
          this.users = [];
        },
      });
  }

  add(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.errorMsg = null;

    const dto = this.form.value as {
      name: string; email: string; role: Role; password?: string;
    };

    this.api
      .create(dto)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (created) => {
          this.users = [created, ...this.users];
          this.form.reset({ role: Role.Technicien });
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || "Impossible d’ajouter l’utilisateur.";
        },
      });
  }

  remove(u: CompanyUser): void {
    if (!confirm(`Supprimer ${u.name} ?`)) return;
    this.api.remove(u._id).subscribe({
      next: () => (this.users = this.users.filter((x) => x._id !== u._id)),
      error: (err) => (this.errorMsg = err?.error?.message || 'Suppression impossible.'),
    });
  }

  /** ✅ NOUVEAU : l’admin choisit le nouveau mot de passe */
  updatePwd(u: CompanyUser): void {
    const newPwd = prompt(`Nouveau mot de passe pour "${u.name}" (min. 6 caractères) :`);
    if (!newPwd) return;
    if (newPwd.length < 6) {
      alert('Mot de passe trop court (min. 6).');
      return;
    }
    this.api.updatePassword(u._id, newPwd).subscribe({
      next: () => alert('Mot de passe mis à jour.'),
      error: (err) =>
        (this.errorMsg = err?.error?.message || 'Mise à jour du mot de passe impossible.'),
    });
  }

  roleLabel(r: Role | string): string {
    switch (r) {
      case Role.SuperAdmin: return 'Super Admin';
      case Role.AdminEntreprise: return 'Admin entreprise';
      case Role.Technicien: return 'Technicien';
      default: return 'Utilisateur';
    }
  }
}
