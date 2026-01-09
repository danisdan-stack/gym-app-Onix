import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage)
  },
  {
    path: 'members',
    loadComponent: () => import('./members/members.page').then(m => m.MembersPage)
  },
  /*{
    path: 'carnets',
    loadComponent: () => import('./carnets/carnets.page').then(m => m.CarnetsPage)
  },
  {
    path: 'payments',
    loadComponent: () => import('./payments/payments.page').then(m => m.PaymentsPage)
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/reports.page').then(m => m.ReportsPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage)
  }*/
];