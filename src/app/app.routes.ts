import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { passwordChangeRequiredGuard, roleGuard } from './core/guards/role.guard';
import { authActivateGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
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
    path: 'student/login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'parent/login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'tenant/change-password',
    canActivate: [authActivateGuard, passwordChangeRequiredGuard],
    loadComponent: () =>
      import('./features/tenant/pages/tenant-change-password/tenant-change-password.component').then((m) => m.TenantChangePasswordComponent),
    data: {
      role: 'tenant',
      workspace: 'tenant',
      layout: 'auth',
      fullScreen: true,
    },
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/auth/pages/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'free-trial',
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'student-register/:token',
    loadComponent: () =>
      import('./features/public-student-registration/public-student-registration.component').then(
        (m) => m.PublicStudentRegistrationComponent,
      ),
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
      {
        path: 'student',
        canMatch: [authGuard, roleGuard],
        data: { role: 'student' },
        loadChildren: () =>
          import('./features/student/routes').then((m) => m.STUDENT_ROUTES),
      },
      {
        path: 'parent',
        canMatch: [authGuard, roleGuard],
        data: { role: 'parent' },
        loadChildren: () =>
          import('./features/parent/routes').then((m) => m.PARENT_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
