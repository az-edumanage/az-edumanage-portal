import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { roleGuard } from './core/guards/role.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'owner/login', pathMatch: 'full' },
  {
    path: 'owner/login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'tenant/login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'teacher/login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'design-system',
        loadComponent: () =>
          import(
            './features/design-system/design-system-showcase/design-system-showcase.component'
          ).then((m) => m.DesignSystemShowcaseComponent),
      },
      {
        path: 'owner',
        canMatch: [authGuard, roleGuard],
        data: { role: 'owner' },
        loadChildren: () =>
          import('./features/owner/routes').then((m) => m.OWNER_ROUTES),
      },
      {
        path: 'tenant',
        canMatch: [authGuard, roleGuard],
        data: { role: 'tenant' },
        loadChildren: () =>
          import('./features/tenant/routes').then((m) => m.TENANT_ROUTES),
      },
      {
        path: 'teacher',
        canMatch: [authGuard, roleGuard],
        data: { role: 'teacher' },
        loadChildren: () =>
          import('./features/teacher/routes').then((m) => m.TEACHER_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'owner/login' },
];
