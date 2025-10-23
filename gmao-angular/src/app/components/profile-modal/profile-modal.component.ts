import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserDto } from '../../services/auth.service';

/**
 * Modal profil (affichage + mise à jour simple côté front).
 * Pour une vraie édition serveur, on appellerait un endpoint PUT /users/:id.
 */
@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.scss']
})
export class ProfileModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();

  // champs d’UI
  username = '';
  email = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  userInitials = '';
  profileImage: string | null = null;

  // identifiant utile si on veut appeler PUT /users/:id plus tard
  userId: string | null = null;

  activeTab = 'info'; // 'info' | 'password' | 'photo'

  passwordError = '';
  emailError = '';
  successMessage = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // on se branche sur le flux du user
    this.authService.currentUser$.subscribe((info: UserDto | null) => {
      if (info) {
        this.userId = info._id;
        this.username = info.name ?? '';
        this.email = info.email ?? '';
        this.userInitials = (this.username?.[0] ?? 'U').toUpperCase();
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.resetMessages();
  }

  resetMessages(): void {
    this.passwordError = '';
    this.emailError = '';
    this.successMessage = '';
  }

  close(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  resetForm(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.resetMessages();
  }

  /**
   * Démo : on met juste à jour le cache front (pas d’appel backend).
   * Pour une vraie MEP backend, remplace par un PUT /users/:id et
   * mets à jour le BehaviorSubject avec la réponse serveur.
   */
  updateEmail(): void {
    this.resetMessages();
    if (!this.email) {
      this.emailError = 'Veuillez entrer une adresse email';
      return;
    }
    this.authService.putMeEmail(this.email).subscribe({
      next: () => (this.successMessage = 'Email mis à jour'),
      error: (err) =>
        (this.emailError = err?.error?.message ?? 'Erreur lors de la mise à jour'),
    });
  }

  // Changement de mot de passe simulé/ux
  updatePassword(): void {
    this.resetMessages();
    if (!this.currentPassword) {
      this.passwordError = 'Veuillez entrer votre mot de passe actuel';
      return;
    }
    if (!this.newPassword) {
      this.passwordError = 'Veuillez entrer un nouveau mot de passe';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.authService
      .putMePassword(this.currentPassword, this.newPassword)
      .subscribe({
        next: () => {
          this.successMessage = 'Mot de passe modifié';
          this.resetForm();
        },
        error: (err) =>
          (this.passwordError =
            err?.error?.message ?? 'Erreur lors du changement de mot de passe'),
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        this.profileImage = e.target?.result as string;
        this.successMessage = 'Photo de profil mise à jour (local)';
      };

      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    document.getElementById('profile-photo-input')?.click();
  }
}
