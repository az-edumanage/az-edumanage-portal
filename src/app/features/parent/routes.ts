import { Routes } from '@angular/router';
import { ParentOverviewComponent } from './pages/parent-overview/parent-overview.component';
import { ParentAttendanceComponent } from './pages/parent-attendance/parent-attendance.component';
import { ParentBillingComponent } from './pages/parent-billing/parent-billing.component';
import { ParentChildsComponent } from './pages/parent-childs/parent-childs.component';
import { ParentHomeWorkEvaluationComponent } from './pages/parent-home-work-evaluation/parent-home-work-evaluation.component';
import { ParentSessionAssessmentComponent } from './pages/parent-session-assessment/parent-session-assessment.component';
import { StudentExamEvaluationComponent } from '../student/pages/student-exam-evaluation/student-exam-evaluation.component';
import { StudentExamReportComponent } from '../student/pages/student-exam-report/student-exam-report.component';

export const PARENT_ROUTES: Routes = [
  { path: 'overview', component: ParentOverviewComponent },
  { path: 'students', component: ParentChildsComponent },
  { path: 'attendance', component: ParentAttendanceComponent },
  { path: 'exam-evaluation', component: StudentExamEvaluationComponent, data: { source: 'parent' } },
  { path: 'exam-evaluation/groups/:groupId/exams/:assignmentId/attempts/:attemptId/report', component: StudentExamReportComponent, data: { source: 'parentEvaluation' } },
  { path: 'home-work-evaluation', component: ParentHomeWorkEvaluationComponent },
  { path: 'session-assessment', component: ParentSessionAssessmentComponent },
  { path: 'billing', component: ParentBillingComponent },
];
