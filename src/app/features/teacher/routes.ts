import { Routes } from '@angular/router';
import { TeacherDashboardComponent } from './pages/teacher-dashboard/teacher-dashboard.component';
import { TeacherExamsComponent } from './pages/teacher-exams/teacher-exams.component';
import { TeacherExamsBasicEducationComponent } from './pages/teacher-exams-basic-education/teacher-exams-basic-education.component';
import { TeacherExamsBasicEducationGradesComponent } from './pages/teacher-exams-basic-education-grades/teacher-exams-basic-education-grades.component';
import { TeacherExamsBasicEducationSubjectsComponent } from './pages/teacher-exams-basic-education-subjects/teacher-exams-basic-education-subjects.component';
import { TeacherExamsUniversityEducationComponent } from './pages/teacher-exams-university-education/teacher-exams-university-education.component';
import { TeacherExamsUniversityEducationCollegesComponent } from './pages/teacher-exams-university-education-colleges/teacher-exams-university-education-colleges.component';
import { TeacherExamsUniversityEducationSubjectsComponent } from './pages/teacher-exams-university-education-subjects/teacher-exams-university-education-subjects.component';
import { TeacherGroupsComponent } from './pages/teacher-groups/teacher-groups.component';
import { TeacherMediaComponent } from './pages/teacher-media/teacher-media.component';
import { TeacherScheduleComponent } from './pages/teacher-schedule/teacher-schedule.component';
import { TeacherScheduleCalendarComponent } from './pages/teacher-schedule-calendar/teacher-schedule-calendar.component';
import { TeacherScheduleSessionsComponent } from './pages/teacher-schedule-sessions/teacher-schedule-sessions.component';
import { TeacherAttendanceComponent } from './pages/teacher-attendance/teacher-attendance.component';
import { TeacherAttendanceSessionsComponent } from './pages/teacher-attendance-sessions/teacher-attendance-sessions.component';
import { TeacherAttendanceSessionStudentsComponent } from './pages/teacher-attendance-session-students/teacher-attendance-session-students.component';
import { TeacherHomeWorkEvaluationComponent } from './pages/teacher-home-work-evaluation/teacher-home-work-evaluation.component';
import { TeacherSessionAssessmentComponent } from './pages/teacher-session-assessment/teacher-session-assessment.component';
import { StudentExamEvaluationComponent } from '../student/pages/student-exam-evaluation/student-exam-evaluation.component';
import { StudentExamReportComponent } from '../student/pages/student-exam-report/student-exam-report.component';
import { TenantGroupAttendanceComponent } from '../tenant/pages/tenant-group-attendance/tenant-group-attendance.component';
import { TenantGroupBroadcastComponent } from '../tenant/pages/tenant-group-broadcast/tenant-group-broadcast.component';
import { TenantGroupDetailsComponent } from '../tenant/pages/tenant-group-details/tenant-group-details.component';
import { TenantGroupSessionDetailsComponent } from '../tenant/pages/tenant-group-session-details/tenant-group-session-details.component';
import { TenantGroupExamCreateComponent } from '../tenant/pages/tenant-group-exam-create/tenant-group-exam-create.component';
import { TenantExamsBasicEducationExamCreateComponent } from '../tenant/pages/tenant-exams-basic-education-exam-create/tenant-exams-basic-education-exam-create.component';
import { TenantSubjectCurriculumComponent } from '../tenant/pages/tenant-subject-curriculum/tenant-subject-curriculum.component';
import { TenantSubjectCurriculumDetailsComponent } from '../tenant/pages/tenant-subject-curriculum-details/tenant-subject-curriculum-details.component';
import { TenantSubjectCurriculumQuestionCreateComponent } from '../tenant/pages/tenant-subject-curriculum-question-create/tenant-subject-curriculum-question-create.component';

export const TEACHER_ROUTES: Routes = [
  { path: 'overview', component: TeacherDashboardComponent },
  { path: 'media', component: TeacherMediaComponent },
  { path: 'schedule/calendar', component: TeacherScheduleCalendarComponent },
  { path: 'schedule/groups/:groupId/sessions', component: TeacherScheduleSessionsComponent },
  { path: 'schedule', component: TeacherScheduleComponent },
  { path: 'groups', component: TeacherGroupsComponent },
  { path: 'groups/:id/attendance', component: TenantGroupAttendanceComponent, data: { scope: 'teacher' } },
  { path: 'groups/:id/exam', component: TenantGroupExamCreateComponent, data: { scope: 'teacher' } },
  { path: 'groups/:id/broadcast', component: TenantGroupBroadcastComponent, data: { scope: 'teacher' } },
  { path: 'groups/:id/sessions/:sessionId', component: TenantGroupSessionDetailsComponent, data: { scope: 'teacher' } },
  { path: 'groups/:id', component: TenantGroupDetailsComponent, data: { scope: 'teacher' } },
  { path: 'attendance/groups/:groupId/sessions/:sessionId', component: TeacherAttendanceSessionStudentsComponent },
  { path: 'attendance/groups/:groupId/sessions', component: TeacherAttendanceSessionsComponent },
  { path: 'attendance', component: TeacherAttendanceComponent },
  { path: 'exams', component: TeacherExamsComponent },
  { path: 'evaluation/exams', component: StudentExamEvaluationComponent, data: { source: 'teacher' } },
  { path: 'evaluation/exams/groups/:groupId/exams/:assignmentId/attempts/:attemptId/report', component: StudentExamReportComponent, data: { source: 'teacherEvaluation' } },
  { path: 'evaluation/home-work', component: TeacherHomeWorkEvaluationComponent },
  { path: 'evaluation/session-assessment', component: TeacherSessionAssessmentComponent },
  { path: 'exam-evaluation', redirectTo: 'evaluation/exams', pathMatch: 'full' },
  { path: 'exam-evaluation/groups/:groupId/exams/:assignmentId/attempts/:attemptId/report', component: StudentExamReportComponent, data: { source: 'teacherEvaluation' } },
  { path: 'exams/basic-education', component: TeacherExamsBasicEducationComponent },
  { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent },
  { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/editQuestion/:questionId', component: TenantSubjectCurriculumQuestionCreateComponent },
  { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/:nodeId/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent },
  { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/:nodeId/editQuestion/:questionId', component: TenantSubjectCurriculumQuestionCreateComponent },
  { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/:nodeId', component: TenantSubjectCurriculumDetailsComponent },
  { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum', component: TenantSubjectCurriculumComponent },
  { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id', component: TenantSubjectCurriculumComponent },
  { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new', component: TenantExamsBasicEducationExamCreateComponent, data: { mode: 'create' } },
  { path: 'exams/basic-education/:stageId/grades/:gradeId/create', component: TenantExamsBasicEducationExamCreateComponent },
  { path: 'exams/basic-education/:stageId/grades/:gradeId', component: TeacherExamsBasicEducationSubjectsComponent },
  { path: 'exams/basic-education/:stageId', component: TeacherExamsBasicEducationGradesComponent },
  { path: 'exams/university-education', component: TeacherExamsUniversityEducationComponent },
  { path: 'exams/university-education/:universityId/colleges/:collegeId', component: TeacherExamsUniversityEducationSubjectsComponent },
  { path: 'exams/university-education/:universityId', component: TeacherExamsUniversityEducationCollegesComponent },
  { path: 'grades', redirectTo: 'exams', pathMatch: 'full' },
  { path: 'messages', component: TeacherDashboardComponent },
  { path: 'profile', component: TeacherDashboardComponent },
];
