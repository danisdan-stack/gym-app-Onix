// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'rapido',  // ✅ ESTA ES LA RUTA IMPORTANTE
    loadComponent: () => import('./modules/client/rapido/cliente_rapido.page').then(m => m.ClienteRapidoPage)
  },
  
    {
    path: 'pagos',   // ✅ NUEVA RUTA PARA PAGOS
    loadComponent: () => import('./modules/admin/payments/pagos.page').then(m => m.PagosPage)
  },

   {
    path: '**',      // ← COMODÍN SIEMPRE VA AL FINAL
    redirectTo: 'admin/dashboard'
  }
];