import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss']
})
export class AuthComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required], // champ "email" dans l’API, mais on garde le nom existant
      password: ['', Validators.required]
    });

    // écoute les erreurs venant du service
    this.authService.errorMessage$.subscribe((message: string | null) => {
      this.errorMessage = message;
      this.isLoading = false;
    });
  }

  onLoginSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;

      const { username, password } = this.loginForm.value;
      // notre API attend "email"
      this.authService.login(username, password).subscribe({
        // succès géré dans le service (profil puis éventuelle redirection)
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
