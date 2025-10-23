import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Route login hors layout
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth').then(m => m.AuthComponent),
  },

  // Shell (layout) avec la sidebar + topbar
  {
    path: '',
    loadComponent: () =>
      import('./components/navigation/navigation.component')
        .then(m => m.NavigationComponent),
    children: [
      {
        path: 'home',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'equipments',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/equipements/equipment-list.component')
            .then(m => m.EquipmentListComponent),
      },
      {
        path: 'maintenance',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/maintenance/maintenance-list.component')
            .then(m => m.MaintenanceListComponent),
      },
      {
        path: 'planning',
        loadComponent: () =>
          import('./pages/scheduling/planning-list.component')
            .then(m => m.PlanningListComponent),
      },
      {
        path: 'reports',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/reports/report-list.component')
            .then(m => m.ReportListComponent),
      },
      {
        path: 'settings',
        canActivate: [authGuard],
        // ⬇️ NOUVEAU composant paramètres
        loadComponent: () =>
          import('./pages/settings/settings.component')
            .then(m => m.SettingsComponent),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./pages/chatbot/chatbot.component')
            .then(m => m.ChatbotComponent),
},

      {
         path: 'company-users',
         canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/company-users/company-users.component')
           .then(m => m.CompanyUsersComponent),
      },


      // redirect par défaut à l’intérieur du shell
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
