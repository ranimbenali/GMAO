import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  of,
  tap,
  catchError,
  switchMap,
} from 'rxjs';

/**
 * Modèle renvoyé par /auth/me (backend Nest)
 */
export interface UserDto {
  _id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
}

const JWT_KEY  = 'jwt_token';
const USER_KEY = 'user_info';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // URL de base de l’API (backend Nest)
  private apiUrl = 'http://localhost:3000/api';

  /**
   * État réactif de l’auth
   */
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  public  currentUser$       = this.currentUserSubject.asObservable();

  private isAuthSubject = new BehaviorSubject<boolean>(false);
  public  isAuthenticated$   = this.isAuthSubject.asObservable();

  // Flux pour afficher un message d’erreur dans le composant Auth
  private errorMessageSubject = new BehaviorSubject<string | null>(null);
  public  errorMessage$       = this.errorMessageSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Nettoyage d’un ancien artefact éventuel
    localStorage.removeItem('demo_credentials');

    const token = this.getToken();
    const cachedUser = this.getUserInfo();

    if (cachedUser) {
      this.currentUserSubject.next(cachedUser);
      this.isAuthSubject.next(!!token && !this.isTokenExpired(token || ''));
    }

    if (token && !cachedUser && !this.isTokenExpired(token)) {
      this.fetchMe().subscribe(); // alimente les BehaviorSubject
    }

    if (token && this.isTokenExpired(token)) {
      this.logout();
    }
  }

  // ===== Helpers stockage =====
  getToken(): string | null {
    return localStorage.getItem(JWT_KEY);
  }

  getUserInfo(): UserDto | null {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as UserDto) : null;
    } catch {
      return null;
    }
  }

  /** Met à jour le user local + flux */
  setUserInfo(user: UserDto | null): void {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
    this.currentUserSubject.next(user);
  }

  /** Enregistre le token + MAJ état auth */
  private setToken(token: string): void {
    localStorage.setItem(JWT_KEY, token);
    this.isAuthSubject.next(!this.isTokenExpired(token));
  }

  // ===== Login =====
  // 1) POST /auth/login  2) on stocke le token  3) /auth/me  4) navigation /home
  login(email: string, password: string): Observable<UserDto> {
    // reset message d’erreur avant tentative
    this.errorMessageSubject.next(null);

    return this.http
      .post<{ access_token: string }>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(res => this.setToken(res.access_token)),
        switchMap(() =>
          this.fetchMe().pipe(
            // ✅ redirection une fois le profil chargé
            tap(() => this.router.navigate(['/home']))
          )
        ),
        catchError(err => {
          const msg =
            err?.error?.message ??
            err?.message ??
            'Une erreur est survenue lors de la connexion';
          this.errorMessageSubject.next(msg);
          throw err;
        })
      );
  }

  // ===== Récupération du profil /auth/me =====
  fetchMe(): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/auth/me`).pipe(
      tap(user => this.setUserInfo(user)),
      catchError(err => {
        // si /me échoue (token invalide/expiré), on nettoie tout
        this.logout();
        this.errorMessageSubject.next('Session expirée, veuillez vous reconnecter.');
        return of(null as unknown as UserDto);
      })
    );
  }

  // ===== Logout =====
  logout(): void {
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('reco_logs'); // si présent
    this.isAuthSubject.next(false);
    this.currentUserSubject.next(null);
  }

  // ===== Décodage/expiration du JWT côté front =====
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      if (!payload?.exp) return false;
      const nowSec = Math.floor(Date.now() / 1000);
      return payload.exp < nowSec;
    } catch {
      return true;
    }
  }

  putMeEmail(email: string) {
    return this.http
      .put(`${this.apiUrl}/users/me/email`, { email })
      .pipe(
        tap(() => {
          const u = this.getUserInfo();
          if (u) this.setUserInfo({ ...u, email }); // MAJ cache + BehaviorSubject
        })
      );
  }

  putMePassword(currentPassword: string, newPassword: string) {
    return this.http.put(`${this.apiUrl}/users/me/password`, {
      currentPassword,
      newPassword,
    });
  }

}
