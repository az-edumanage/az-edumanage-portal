import { Routes } from '@angular/router';
import { TeacherDashboardComponent } from './pages/teacher-dashboard/teacher-dashboard.component';
import { TeacherExamsComponent } from './pages/teacher-exams/teacher-exams.component';
import { TeacherExamsBasicEducationComponent } from './pages/teacher-exams-basic-education/teacher-exams-basic-education.component';
import { TeacherExamsBasicEducationExamCreateComponent } from './pages/teacher-exams-basic-education-exam-create/teacher-exams-basic-education-exam-create.component';
import { TeacherExamsBasicEducationGradesComponent } from './pages/teacher-exams-basic-education-grades/teacher-exams-basic-education-grades.component';
import { TeacherExamsBasicEducationSubjectsComponent } from './pages/teacher-exams-basic-education-subjects/teacher-exams-basic-education-subjects.component';
import { TeacherExamsUniversityEducationComponent } from './pages/teacher-exams-university-education/teacher-exams-university-education.component';
import { TeacherExamsUniversityEducationCollegesComponent } from './pages/teacher-exams-university-education-colleges/teacher-exams-university-education-colleges.component';
import { TeacherExamsUniversityEducationSubjectsComponent } from './pages/teacher-exams-university-education-subjects/teacher-exams-university-education-subjects.component';
import { TeacherGroupsComponent } from './pages/teacher-groups/teacher-groups.component';
import { TeacherMediaComponent } from './pages/teacher-media/teacher-media.component';

export const TEACHER_ROUTES: Routes = [
  { path: 'overview', component: TeacherDashboardComponent },
  { path: 'media', component: TeacherMediaComponent },
  { path: 'schedule', component: TeacherDashboardComponent },
  { path: 'groups', component: TeacherGroupsComponent },
  { path: 'attendance', component: TeacherDashboardComponent },
  { path: 'exams', component: TeacherExamsComponent },
  { path: 'exams/basic-education', component: TeacherExamsBasicEducationComponent },
  { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new', component: TeacherExamsBasicEducationExamCreateComponent, data: { mode: 'create' } },
  { path: 'exams/basic-education/:stageId/grades/:gradeId/create', component: TeacherExamsBasicEducationExamCreateComponent },
  { path: 'exams/basic-education/:stageId/grades/:gradeId', component: TeacherExamsBasicEducationSubjectsComponent },
  { path: 'exams/basic-education/:stageId', component: TeacherExamsBasicEducationGradesComponent },
  { path: 'exams/university-education', component: TeacherExamsUniversityEducationComponent },
  { path: 'exams/university-education/:universityId/colleges/:collegeId', component: TeacherExamsUniversityEducationSubjectsComponent },
  { path: 'exams/university-education/:universityId', component: TeacherExamsUniversityEducationCollegesComponent },
  { path: 'grades', redirectTo: 'exams', pathMatch: 'full' },
  { path: 'messages', component: TeacherDashboardComponent },
  { path: 'profile', component: TeacherDashboardComponent },
];
