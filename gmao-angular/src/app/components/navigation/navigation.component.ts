import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, UserDto } from '../../services/auth.service';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';

/** -------- Menu dynamique par rôle -------- */
type UserRole = 'SuperAdmin' | 'AdminEntreprise' | 'Technicien' | 'Operateur';

type MenuItem = {
  label: string;
  icon: string;   // classe Font Awesome
  route: string;
  roles: UserRole[]; // qui a le droit de voir l’item
};

const ALL: UserRole[] = ['SuperAdmin', 'AdminEntreprise', 'Technicien', 'Operateur'];

const MENU: MenuItem[] = [
  { label: 'Tableau de bord', icon: 'fas fa-home',         route: '/home',          roles: ALL },
  { label: 'Équipements',     icon: 'fas fa-tools',        route: '/equipments',    roles: ['SuperAdmin','AdminEntreprise'] },
  { label: 'Maintenance',     icon: 'fas fa-wrench',       route: '/maintenance',   roles: ['SuperAdmin','AdminEntreprise','Technicien'] },
  { label: 'Planning',        icon: 'fas fa-calendar-alt', route: '/planning',      roles: ['SuperAdmin','AdminEntreprise'] },
  { label: 'Rapports',        icon: 'fas fa-chart-bar',    route: '/reports',       roles: ['SuperAdmin','AdminEntreprise','Technicien'] },
  // ✅ NOUVEAU : menu “Utilisateurs d’entreprise”
  { label: 'Utilisateurs',    icon: 'fas fa-users',        route: '/company-users', roles: ['SuperAdmin','AdminEntreprise'] },
  { label: 'Assistant', icon: 'fas fa-robot', route: '/chat', roles: ALL },
  { label: 'Paramètres',      icon: 'fas fa-cog',          route: '/settings',      roles: ALL },
];
/** ---------------------------------------- */

const NAV_STATE_KEY = 'sidebar_expanded';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, ProfileModalComponent],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  // état de la sidebar persistant
  sidebarExpanded: boolean = JSON.parse(localStorage.getItem(NAV_STATE_KEY) ?? 'true');
  profileMenuOpen = false;

  // infos affichées
  username = 'Utilisateur';
  userEmail = 'user@example.com';
  userInitials = 'U';

  // suivi de navigation + modal
  currentRoute = '';
  showProfileModal = false;

  // rôle & menu filtré
  role: UserRole = 'Operateur';
  visibleMenu: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Pré-remplir immédiatement depuis le cache (avant le premier render)
    const cached = this.authService.getUserInfo();
    if (cached) {
      this.username = cached.name ?? 'Utilisateur';
      this.userEmail = cached.email ?? 'user@example.com';
      this.userInitials = (this.username?.[0] ?? 'U').toUpperCase();
      this.role = (cached.role as UserRole) || 'Operateur';
      this.visibleMenu = MENU.filter(item => item.roles.includes(this.role));
    }
  }

  ngOnInit(): void {
    // route courante + MAJ sur chaque navigation
    this.currentRoute = this.router.url;
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.currentRoute = this.router.url;
        this.profileMenuOpen = false; // ferme le menu profil à chaque changement
      });

    // s’abonne au profil utilisateur
    this.authService.currentUser$.subscribe((user: UserDto | null) => {
      if (user) {
        this.username = user.name ?? 'Utilisateur';
        this.userEmail = user.email ?? 'user@example.com';
        this.userInitials = (this.username?.[0] ?? 'U').toUpperCase();
        this.role = (user.role as UserRole) || 'Operateur';
      } else {
        this.username = 'Utilisateur';
        this.userEmail = 'user@example.com';
        this.userInitials = 'U';
        this.role = 'Operateur';
      }
      // filtre du menu selon le rôle
      this.visibleMenu = MENU.filter(item => item.roles.includes(this.role));
    });
  }

  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
    localStorage.setItem(NAV_STATE_KEY, JSON.stringify(this.sidebarExpanded));
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  navigateTo(route: string): void {
    if (this.authService.getToken()) {
      this.router.navigate([route]);
    }
  }

  // ✅ startsWith pour gérer les sous-routes
  isActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  openProfileModal(): void {
    this.showProfileModal = true;
    this.profileMenuOpen = false;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }
}
