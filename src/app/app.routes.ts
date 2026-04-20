import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'owner/overview', pathMatch: 'full' },
      {
        path: 'design-system',
        loadComponent: () =>
          import(
            './features/design-system/design-system-showcase/design-system-showcase.component'
          ).then((m) => m.DesignSystemShowcaseComponent),
      },
      {
        path: 'owner',
        canMatch: [roleGuard],
        data: { role: 'owner' },
        loadChildren: () =>
          import('./features/owner/routes').then((m) => m.OWNER_ROUTES),
      },
      {
        path: 'tenant',
        canMatch: [roleGuard],
        data: { role: 'tenant' },
        loadChildren: () =>
          import('./features/tenant/routes').then((m) => m.TENANT_ROUTES),
      },
      {
        path: 'teacher',
        canMatch: [roleGuard],
        data: { role: 'teacher' },
        loadChildren: () =>
          import('./features/teacher/routes').then((m) => m.TEACHER_ROUTES),
      },
    ],
  },
];
