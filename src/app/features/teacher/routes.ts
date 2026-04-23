import { Routes } from '@angular/router';
import { TeacherDashboardComponent } from './pages/teacher-dashboard/teacher-dashboard.component';
import { TeacherMediaComponent } from './pages/teacher-media/teacher-media.component';

export const TEACHER_ROUTES: Routes = [
  { path: 'overview', component: TeacherDashboardComponent },
  { path: 'media', component: TeacherMediaComponent },
  { path: 'schedule', component: TeacherDashboardComponent },
  { path: 'groups', component: TeacherDashboardComponent },
  { path: 'attendance', component: TeacherDashboardComponent },
  { path: 'grades', component: TeacherDashboardComponent },
  { path: 'messages', component: TeacherDashboardComponent },
  { path: 'profile', component: TeacherDashboardComponent },
];
