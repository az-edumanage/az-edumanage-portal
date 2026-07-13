import { Routes } from '@angular/router';
import { StudentOverviewComponent } from './pages/student-overview/student-overview.component';
import { StudentScheduleComponent } from './pages/student-schedule/student-schedule.component';
import { StudentScheduleCalendarComponent } from './pages/student-schedule-calendar/student-schedule-calendar.component';
import { StudentMyCoursesComponent } from './pages/student-my-courses/student-my-courses.component';
import { StudentGroupsComponent } from './pages/student-groups/student-groups.component';
import { StudentExamsComponent } from './pages/student-exams/student-exams.component';
import { StudentExamEvaluationComponent } from './pages/student-exam-evaluation/student-exam-evaluation.component';
import { StudentHomeWorkEvaluationComponent } from './pages/student-home-work-evaluation/student-home-work-evaluation.component';
import { StudentExamAttemptComponent } from './pages/student-exam-attempt/student-exam-attempt.component';
import { StudentExamReportComponent } from './pages/student-exam-report/student-exam-report.component';
import { StudentBillingComponent } from './pages/student-billing/student-billing.component';

export const STUDENT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', component: StudentOverviewComponent },
  { path: 'schedule/calendar', component: StudentScheduleCalendarComponent },
  { path: 'schedule', component: StudentScheduleComponent },
  { path: 'my-courses', component: StudentMyCoursesComponent },
  { path: 'my-groups/:groupId/sessions/:sessionId', component: StudentGroupsComponent },
  { path: 'my-groups/:groupId/sessions', component: StudentGroupsComponent },
  { path: 'my-groups', component: StudentGroupsComponent },
  { path: 'exams', component: StudentExamsComponent, data: { mode: 'exams' } },
  { path: 'evaluation/exams', component: StudentExamEvaluationComponent, data: { source: 'student' } },
  { path: 'evaluation/exams/:groupId/:assignmentId/attempts/:attemptId/report', component: StudentExamReportComponent, data: { source: 'evaluation' } },
  { path: 'evaluation/home-work', component: StudentHomeWorkEvaluationComponent },
  { path: 'exam-evaluation', redirectTo: 'evaluation/exams', pathMatch: 'full' },
  { path: 'exam-evaluation/:groupId/:assignmentId/attempts/:attemptId/report', redirectTo: 'evaluation/exams/:groupId/:assignmentId/attempts/:attemptId/report', pathMatch: 'full' },
  { path: 'exams/:groupId/:assignmentId/attempts/:attemptId/report', component: StudentExamReportComponent },
  { path: 'exams/:groupId/:assignmentId/attempts/:attemptId', component: StudentExamAttemptComponent },
  { path: 'home-work', component: StudentExamsComponent, data: { mode: 'homeWork' } },
  { path: 'billing', component: StudentBillingComponent },
];
