import { Routes } from '@angular/router';
import { TenantDashboardComponent } from './pages/tenant-dashboard/tenant-dashboard.component';
import { TenantStudentsComponent } from './pages/tenant-students/tenant-students.component';
import { TenantStudentCreateComponent } from './pages/tenant-student-create/tenant-student-create.component';
import { TenantStudentDetailsComponent } from './pages/tenant-student-details/tenant-student-details.component';
import { TenantStudentBarcodePrintComponent } from './pages/tenant-student-barcode-print/tenant-student-barcode-print.component';
import { TenantParentsComponent } from './pages/tenant-parents/tenant-parents.component';
import { TenantTeachersComponent } from './pages/tenant-teachers/tenant-teachers.component';
import { TenantTeacherCreateComponent } from './pages/tenant-teacher-create/tenant-teacher-create.component';
import { TenantTeacherDetailsComponent } from './pages/tenant-teacher-details/tenant-teacher-details.component';
import { TenantGroupsComponent } from './pages/tenant-groups/tenant-groups.component';
import { TenantGroupCreatePageComponent } from './pages/tenant-group-create/tenant-group-create-page.component';
import { TenantGroupDetailsComponent } from './pages/tenant-group-details/tenant-group-details.component';
import { TenantGroupLessonDetailsComponent } from './pages/tenant-group-lesson-details/tenant-group-lesson-details.component';
import { TenantGroupSessionDetailsComponent } from './pages/tenant-group-session-details/tenant-group-session-details.component';
import { TenantGroupStudentAssessmentComponent } from './pages/tenant-group-student-assessment/tenant-group-student-assessment.component';
import { TenantGroupStudentAddComponent } from './pages/tenant-group-student-add/tenant-group-student-add.component';
import { TenantGroupAttendanceComponent } from './pages/tenant-group-attendance/tenant-group-attendance.component';
import { TenantGroupExamCreateComponent } from './pages/tenant-group-exam-create/tenant-group-exam-create.component';
import { TenantGroupBroadcastComponent } from './pages/tenant-group-broadcast/tenant-group-broadcast.component';
import { TenantAttendanceComponent } from './pages/tenant-attendance/tenant-attendance.component';
import { TenantBillingComponent } from './pages/tenant-billing/tenant-billing.component';
import { TenantReportsComponent } from './pages/tenant-reports/tenant-reports.component';
import { TenantExamsComponent } from './pages/tenant-exams/tenant-exams.component';
import { TenantExamsEvaluationComponent } from './pages/tenant-exams-evaluation/tenant-exams-evaluation.component';
import { TenantHomeWorkEvaluationComponent } from './pages/tenant-home-work-evaluation/tenant-home-work-evaluation.component';
import { TenantAssessmentEvaluationComponent } from './pages/tenant-assessment-evaluation/tenant-assessment-evaluation.component';
import { TenantQuestionsBankComponent } from './pages/tenant-questions-bank/tenant-questions-bank.component';
import { TenantQuestionsBankBasicEducationComponent } from './pages/tenant-questions-bank-basic-education/tenant-questions-bank-basic-education.component';
import { TenantQuestionsBankBasicEducationGradesComponent } from './pages/tenant-questions-bank-basic-education-grades/tenant-questions-bank-basic-education-grades.component';
import { TenantQuestionsBankQuestionOverviewComponent } from './pages/tenant-questions-bank-question-overview/tenant-questions-bank-question-overview.component';
import { TenantQuestionsBankSubjectQuestionsComponent } from './pages/tenant-questions-bank-subject-questions/tenant-questions-bank-subject-questions.component';
import { TenantQuestionsBankUniversityCollegeListComponent } from './pages/tenant-questions-bank-university-college-list/tenant-questions-bank-university-college-list.component';
import { TenantQuestionsBankUniversityCollegesComponent } from './pages/tenant-questions-bank-university-colleges/tenant-questions-bank-university-colleges.component';
import { TenantQuestionsBankUniversitySubjectsComponent } from './pages/tenant-questions-bank-university-subjects/tenant-questions-bank-university-subjects.component';
import { TenantRoomsComponent } from './pages/tenant-rooms/tenant-rooms.component';
import { TenantRoomCreateComponent } from './pages/tenant-room-create/tenant-room-create.component';
import { TenantRoomDetailsComponent } from './pages/tenant-room-details/tenant-room-details.component';
import { TenantRoomBookingComponent } from './pages/tenant-room-booking/tenant-room-booking.component';
import { TenantEducationalStagesComponent } from './pages/tenant-educational-stages/tenant-educational-stages.component';
import { TenantExamsBasicEducationComponent } from './pages/tenant-exams-basic-education/tenant-exams-basic-education.component';
import { TenantExamsBasicEducationGradesComponent } from './pages/tenant-exams-basic-education-grades/tenant-exams-basic-education-grades.component';
import { TenantExamsBasicEducationSubjectsComponent } from './pages/tenant-exams-basic-education-subjects/tenant-exams-basic-education-subjects.component';
import { TenantExamsBasicEducationExamCreateComponent } from './pages/tenant-exams-basic-education-exam-create/tenant-exams-basic-education-exam-create.component';
import { TenantEducationalStageCreateComponent } from './pages/tenant-educational-stage-create/tenant-educational-stage-create.component';
import { TenantGradesComponent } from './pages/tenant-grades/tenant-grades.component';
import { TenantGradeCreateComponent } from './pages/tenant-grade-create/tenant-grade-create.component';
import { TenantGradeDetailsComponent } from './pages/tenant-grade-details/tenant-grade-details.component';
import { TenantSubjectsComponent } from './pages/tenant-subjects/tenant-subjects.component';
import { TenantSubjectCreateComponent } from './pages/tenant-subject-create/tenant-subject-create.component';
import { TenantSubjectCurriculumComponent } from './pages/tenant-subject-curriculum/tenant-subject-curriculum.component';
import { TenantSubjectCurriculumDetailsComponent } from './pages/tenant-subject-curriculum-details/tenant-subject-curriculum-details.component';
import { TenantSubjectCurriculumMaterialFolderComponent } from './pages/tenant-subject-curriculum-material-folder/tenant-subject-curriculum-material-folder.component';
import { TenantSubjectCurriculumMaterialNoteComponent } from './pages/tenant-subject-curriculum-material-note/tenant-subject-curriculum-material-note.component';
import { TenantSubjectCurriculumQuestionCreateComponent } from './pages/tenant-subject-curriculum-question-create/tenant-subject-curriculum-question-create.component';
import { TenantSubjectDetailsComponent } from './pages/tenant-subject-details/tenant-subject-details.component';
import { TenantUniversitiesComponent } from './pages/tenant-universities/tenant-universities.component';
import { TenantUniversityCreateComponent } from './pages/tenant-university-create/tenant-university-create.component';
import { TenantUniversityDetailsComponent } from './pages/tenant-university-details/tenant-university-details.component';
import { TenantCollegesComponent } from './pages/tenant-colleges/tenant-colleges.component';
import { TenantCollegeCreateComponent } from './pages/tenant-college-create/tenant-college-create.component';
import { TenantCollegeDetailsComponent } from './pages/tenant-college-details/tenant-college-details.component';
import { TenantUniversitySubjectsComponent } from './pages/tenant-university-subjects/tenant-university-subjects.component';
import { TenantUniversitySubjectCreateComponent } from './pages/tenant-university-subject-create/tenant-university-subject-create.component';
import { TenantUniversitySubjectDetailsComponent } from './pages/tenant-university-subject-details/tenant-university-subject-details.component';
import { TenantUsersComponent } from './pages/tenant-users/tenant-users.component';
import { TenantUserCreateComponent } from './pages/tenant-user-create/tenant-user-create.component';
import { TenantRolesPermissionsComponent } from './pages/tenant-roles-permissions/tenant-roles-permissions.component';
import { TenantRoleFormComponent } from './pages/tenant-role-form/tenant-role-form.component';
import { TenantScheduleComponent } from './pages/tenant-schedule/tenant-schedule.component';
import { TenantPlatformSettingsComponent } from './pages/tenant-platform-settings/tenant-platform-settings.component';
import { TenantLmsSettingsComponent } from './pages/tenant-lms-settings/tenant-lms-settings.component';
import { TenantProfileComponent } from './pages/tenant-profile/tenant-profile.component';
import { TenantAccessStateComponent } from './pages/tenant-access-state/tenant-access-state.component';
import { TenantPlatformGuideComponent } from './pages/tenant-platform-guide/tenant-platform-guide.component';
import { StudentExamEvaluationComponent } from '../student/pages/student-exam-evaluation/student-exam-evaluation.component';
import { StudentExamReportComponent } from '../student/pages/student-exam-report/student-exam-report.component';
import { passwordChangeRequiredChildGuard, passwordChangeRequiredGuard } from '../../core/guards/role.guard';
import { tenantAccessStateGuard, tenantOperationalAccessGuard } from '../../core/guards/tenant-operational-access.guard';
import { tenantPermissionGuard } from '../../core/guards/tenant-permission.guard';

export const TENANT_ROUTES: Routes = [
  {
    path: 'access/pending',
    canActivate: [tenantAccessStateGuard],
    data: { status: 'pending' },
    component: TenantAccessStateComponent,
  },
  {
    path: 'access/suspended',
    canActivate: [tenantAccessStateGuard],
    data: { status: 'suspended' },
    component: TenantAccessStateComponent,
  },
  {
    path: 'access/disabled',
    canActivate: [tenantAccessStateGuard],
    data: { status: 'disabled' },
    component: TenantAccessStateComponent,
  },
  {
    path: 'access/blocked',
    canActivate: [tenantAccessStateGuard],
    data: { status: 'blocked' },
    component: TenantAccessStateComponent,
  },
  {
    path: 'access-denied',
    data: { status: 'denied' },
    component: TenantAccessStateComponent,
  },
  {
    path: '',
    canActivate: [passwordChangeRequiredGuard],
    canActivateChild: [passwordChangeRequiredChildGuard, tenantOperationalAccessGuard, tenantPermissionGuard],
    children: [
      { path: 'overview', component: TenantDashboardComponent },
      { path: 'platform-user-guide', component: TenantPlatformGuideComponent },
      { path: 'profile', component: TenantProfileComponent },
      { path: 'students', component: TenantStudentsComponent, data: { requiredPermission: 'tenant.students.view' } },
      { path: 'students/create', component: TenantStudentCreateComponent, data: { requiredPermission: 'tenant.students.manage' } },
      { path: 'students/:id/barcode/print', component: TenantStudentBarcodePrintComponent },
      { path: 'students/:id/edit', component: TenantStudentCreateComponent, data: { requiredPermission: 'tenant.students.manage' } },
      { path: 'students/:id', component: TenantStudentDetailsComponent },
      { path: 'parents', component: TenantParentsComponent, data: { requiredPermission: 'tenant.students.view' } },
      { path: 'teachers', component: TenantTeachersComponent, data: { requiredPermission: 'tenant.teachers.view' } },
      { path: 'teachers/create', component: TenantTeacherCreateComponent, data: { requiredPermission: 'tenant.teachers.manage' } },
      { path: 'teachers/:id/edit', component: TenantTeacherCreateComponent },
      { path: 'teachers/:id/settings', component: TenantTeacherCreateComponent },
      { path: 'teachers/:id/messages', component: TenantDashboardComponent },
      { path: 'teachers/:id', component: TenantTeacherDetailsComponent },
      { path: 'groups', component: TenantGroupsComponent, data: { requiredPermission: 'tenant.groups.view' } },
      { path: 'groups/create', component: TenantGroupCreatePageComponent, data: { requiredPermission: 'tenant.groups.manage' } },
      { path: 'groups/:id/sessions/:sessionId/students/:studentId/assessment', component: TenantGroupStudentAssessmentComponent },
      { path: 'groups/:id/sessions/:sessionId', component: TenantGroupSessionDetailsComponent },
      { path: 'groups/:id/lessons/:lessonId', component: TenantGroupLessonDetailsComponent },
      { path: 'groups/:id', component: TenantGroupDetailsComponent },
      { path: 'groups/:id/edit', component: TenantGroupCreatePageComponent },
      { path: 'groups/:id/enroll', component: TenantGroupStudentAddComponent },
      { path: 'groups/:id/attendance', component: TenantGroupAttendanceComponent },
      { path: 'groups/:groupId/exam/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'groups/:groupId/exam/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/:nodeId/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'groups/:id/exam', component: TenantGroupExamCreateComponent },
      { path: 'groups/:id/broadcast', component: TenantGroupBroadcastComponent },
      { path: 'rooms', component: TenantRoomsComponent, data: { requiredPermission: 'tenant.rooms.view' } },
      { path: 'rooms/create', component: TenantRoomCreateComponent, data: { requiredPermission: 'tenant.rooms.manage' } },
      { path: 'rooms/:id', component: TenantRoomDetailsComponent, data: { requiredPermission: 'tenant.rooms.view' } },
      { path: 'rooms/:id/edit', component: TenantRoomCreateComponent, data: { requiredPermission: 'tenant.rooms.manage' } },
      { path: 'rooms/:id/book', component: TenantRoomBookingComponent, data: { requiredPermission: 'tenant.rooms.manage' } },
      { path: 'educational-stages', component: TenantEducationalStagesComponent, data: { requiredPermission: 'tenant.basicEducation.view' } },
      { path: 'educational-stages/create', component: TenantEducationalStageCreateComponent, data: { requiredPermission: 'tenant.basicEducation.manage' } },
      { path: 'exam-evaluation/groups/:groupId/exams/:assignmentId/attempts/:attemptId/report', component: StudentExamReportComponent, data: { requiredPermission: 'tenant.grades.view', source: 'tenantEvaluationGroupReport' } },
      { path: 'exam-evaluation/groups/:groupId', component: StudentExamEvaluationComponent, data: { requiredPermission: 'tenant.grades.view', source: 'tenantEvaluationGroup' } },
      { path: 'exam-evaluation', component: TenantExamsEvaluationComponent, data: { requiredPermission: 'tenant.grades.view' } },
      { path: 'evaluation/home-work/groups/:groupId/exams/:assignmentId/attempts/:attemptId/report', component: StudentExamReportComponent, data: { requiredPermission: 'tenant.grades.view', source: 'tenantHomeWorkEvaluationReport' } },
      { path: 'evaluation/home-work', component: TenantHomeWorkEvaluationComponent, data: { requiredPermission: 'tenant.grades.view' } },
      { path: 'evaluation/assessment', component: TenantAssessmentEvaluationComponent, data: { requiredPermission: 'tenant.grades.view' } },
      { path: 'evaluation', redirectTo: 'exam-evaluation', pathMatch: 'full' },
      { path: 'grades', component: TenantGradesComponent, data: { requiredPermission: 'tenant.grades.view' } },
      { path: 'grades/create', component: TenantGradeCreateComponent, data: { requiredPermission: 'tenant.grades.manage' } },
      { path: 'grades/:id/edit', component: TenantGradeCreateComponent, data: { requiredPermission: 'tenant.grades.manage' } },
      { path: 'grades/:id', component: TenantGradeDetailsComponent, data: { requiredPermission: 'tenant.grades.view' } },
      { path: 'subjects', component: TenantSubjectsComponent, data: { requiredPermission: 'tenant.basicEducation.view' } },
      { path: 'subjects/create', component: TenantSubjectCreateComponent, data: { requiredPermission: 'tenant.basicEducation.manage' } },
      { path: 'subjects/:id/edit', component: TenantSubjectCreateComponent, data: { requiredPermission: 'tenant.basicEducation.manage' } },
      { path: 'subjects/:id/curriculum/:nodeId/editQuestion/:questionId', component: TenantSubjectCurriculumQuestionCreateComponent, data: { requiredPermission: 'tenant.basicEducation.manage' } },
      { path: 'subjects/:id/curriculum/:nodeId/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent, data: { requiredPermission: 'tenant.basicEducation.manage' } },
      { path: 'subjects/:id/curriculum/:nodeId/material/:folderId/addNote', component: TenantSubjectCurriculumMaterialNoteComponent, data: { requiredPermission: 'tenant.basicEducation.manage' } },
      { path: 'subjects/:id/curriculum/:nodeId/material/:folderId/notes/:noteId', component: TenantSubjectCurriculumMaterialNoteComponent, data: { requiredPermission: 'tenant.basicEducation.view' } },
      { path: 'subjects/:id/curriculum/:nodeId/material/:folderId', component: TenantSubjectCurriculumMaterialFolderComponent, data: { requiredPermission: 'tenant.basicEducation.view' } },
      { path: 'subjects/:id/curriculum/:nodeId', component: TenantSubjectCurriculumDetailsComponent, data: { requiredPermission: 'tenant.basicEducation.view' } },
      { path: 'subjects/:id/curriculum', component: TenantSubjectCurriculumComponent, data: { requiredPermission: 'tenant.basicEducation.view' } },
      { path: 'subjects/:id', component: TenantSubjectDetailsComponent, data: { requiredPermission: 'tenant.basicEducation.view' } },
      { path: 'universities', component: TenantUniversitiesComponent, data: { requiredPermission: 'tenant.universityEducation.view' } },
      { path: 'universities/create', component: TenantUniversityCreateComponent, data: { requiredPermission: 'tenant.universityEducation.manage' } },
      { path: 'universities/:id/edit', component: TenantUniversityCreateComponent, data: { requiredPermission: 'tenant.universityEducation.manage' } },
      { path: 'universities/:id', component: TenantUniversityDetailsComponent, data: { requiredPermission: 'tenant.universityEducation.view' } },
      { path: 'colleges', component: TenantCollegesComponent, data: { requiredPermission: 'tenant.universityEducation.view' } },
      { path: 'colleges/create', component: TenantCollegeCreateComponent, data: { requiredPermission: 'tenant.universityEducation.manage' } },
      { path: 'colleges/:id/edit', component: TenantCollegeCreateComponent, data: { requiredPermission: 'tenant.universityEducation.manage' } },
      { path: 'colleges/:id', component: TenantCollegeDetailsComponent, data: { requiredPermission: 'tenant.universityEducation.view' } },
      { path: 'university-subjects', component: TenantUniversitySubjectsComponent, data: { requiredPermission: 'tenant.universityEducation.view' } },
      { path: 'university-subjects/create', component: TenantUniversitySubjectCreateComponent, data: { requiredPermission: 'tenant.universityEducation.manage' } },
      { path: 'university-subjects/:id/edit', component: TenantUniversitySubjectCreateComponent, data: { requiredPermission: 'tenant.universityEducation.manage' } },
      { path: 'university-subjects/:id/curriculum/:nodeId/editQuestion/:questionId', component: TenantSubjectCurriculumQuestionCreateComponent, data: { requiredPermission: 'tenant.universityEducation.manage' } },
      { path: 'university-subjects/:id/curriculum/:nodeId/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent, data: { requiredPermission: 'tenant.universityEducation.manage' } },
      { path: 'university-subjects/:id/curriculum/:nodeId/material/:folderId/addNote', component: TenantSubjectCurriculumMaterialNoteComponent, data: { requiredPermission: 'tenant.universityEducation.manage' } },
      { path: 'university-subjects/:id/curriculum/:nodeId/material/:folderId/notes/:noteId', component: TenantSubjectCurriculumMaterialNoteComponent, data: { requiredPermission: 'tenant.universityEducation.view' } },
      { path: 'university-subjects/:id/curriculum/:nodeId/material/:folderId', component: TenantSubjectCurriculumMaterialFolderComponent, data: { requiredPermission: 'tenant.universityEducation.view' } },
      { path: 'university-subjects/:id/curriculum/:nodeId', component: TenantSubjectCurriculumDetailsComponent, data: { requiredPermission: 'tenant.universityEducation.view' } },
      { path: 'university-subjects/:id/curriculum', component: TenantSubjectCurriculumComponent, data: { requiredPermission: 'tenant.universityEducation.view' } },
      { path: 'university-subjects/:id', component: TenantUniversitySubjectDetailsComponent, data: { requiredPermission: 'tenant.universityEducation.view' } },
      { path: 'users', component: TenantUsersComponent, data: { requiredPermission: 'tenant.users.view' } },
      { path: 'users/roles-permissions/create', component: TenantRoleFormComponent, data: { requiredPermission: 'tenant.roles.manage' } },
      { path: 'users/roles-permissions/:id/edit', component: TenantRoleFormComponent, data: { requiredPermission: 'tenant.roles.manage' } },
      { path: 'users/roles-permissions', component: TenantRolesPermissionsComponent, data: { requiredPermission: 'tenant.roles.view' } },
      { path: 'users/create', component: TenantUserCreateComponent, data: { requiredPermission: 'tenant.users.manage' } },
      { path: 'users/:id/edit', component: TenantUserCreateComponent, data: { requiredPermission: 'tenant.users.manage' } },
      { path: 'schedule', component: TenantScheduleComponent, data: { requiredPermission: 'tenant.attendance.view' } },
      { path: 'attendance', component: TenantAttendanceComponent, data: { requiredPermission: 'tenant.attendance.view' } },
      { path: 'exams', component: TenantExamsComponent, data: { requiredPermission: 'tenant.exams.manage' } },
      { path: 'exams-evaluation', redirectTo: 'exam-evaluation', pathMatch: 'full' },
      { path: 'exams-evaluation/groups/:groupId/exams/:assignmentId/attempts/:attemptId/report', redirectTo: 'exam-evaluation/groups/:groupId/exams/:assignmentId/attempts/:attemptId/report', pathMatch: 'full' },
      { path: 'exams-evaluation/groups/:groupId', redirectTo: 'exam-evaluation/groups/:groupId', pathMatch: 'full' },
      { path: 'questions-bank', component: TenantQuestionsBankComponent, data: { requiredPermission: 'tenant.questionBank.manage' } },
      { path: 'questions-bank/basic-education', component: TenantQuestionsBankBasicEducationComponent },
      { path: 'questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/:nodeId/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/:nodeId/editQuestion/:questionId', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/:nodeId/questions/:questionId', component: TenantQuestionsBankQuestionOverviewComponent },
      { path: 'questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/:nodeId', component: TenantQuestionsBankSubjectQuestionsComponent },
      { path: 'questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum', component: TenantSubjectCurriculumComponent },
      { path: 'questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id', component: TenantSubjectCurriculumComponent },
      { path: 'questions-bank/basic-education/:stageId/grades/:gradeId', component: TenantSubjectsComponent },
      { path: 'questions-bank/basic-education/:stageId', component: TenantQuestionsBankBasicEducationGradesComponent },
      { path: 'questions-bank/university-education', component: TenantQuestionsBankUniversityCollegesComponent },
      { path: 'questions-bank/university-education/universities/:universityId', component: TenantQuestionsBankUniversityCollegeListComponent },
      { path: 'questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId/editQuestion/:questionId', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId/questions/:questionId', component: TenantQuestionsBankQuestionOverviewComponent },
      { path: 'questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId', component: TenantQuestionsBankSubjectQuestionsComponent },
      { path: 'questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum', component: TenantSubjectCurriculumComponent },
      { path: 'questions-bank/university-education/colleges/:collegeId/subjects/:id', component: TenantSubjectCurriculumComponent },
      { path: 'questions-bank/university-education/colleges/:collegeId', component: TenantQuestionsBankUniversitySubjectsComponent },
      { path: 'exams/basic-education', component: TenantExamsBasicEducationComponent },
      { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/editQuestion/:questionId', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/:nodeId/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/:nodeId/editQuestion/:questionId', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/:nodeId', component: TenantSubjectCurriculumDetailsComponent },
      { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum', component: TenantSubjectCurriculumComponent },
      { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id', component: TenantSubjectCurriculumComponent },
      { path: 'exams/basic-education/:stageId/grades/:gradeId/create/new', component: TenantExamsBasicEducationExamCreateComponent, data: { mode: 'create' } },
      { path: 'exams/basic-education/:stageId/grades/:gradeId/create', component: TenantExamsBasicEducationExamCreateComponent },
      { path: 'exams/basic-education/:stageId/grades/:gradeId', component: TenantExamsBasicEducationSubjectsComponent },
      { path: 'exams/basic-education/:stageId', component: TenantExamsBasicEducationGradesComponent },
      { path: 'exams/university-education/:universityId/colleges/:collegeId/create/new/subjects/:id/curriculum/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'exams/university-education/:universityId/colleges/:collegeId/create/new/subjects/:id/curriculum/:nodeId/addQuestion', component: TenantSubjectCurriculumQuestionCreateComponent },
      { path: 'exams/university-education/:universityId/colleges/:collegeId/create/new', component: TenantExamsBasicEducationExamCreateComponent, data: { mode: 'create' } },
      { path: 'exams/university-education/:universityId/colleges/:collegeId/create', component: TenantExamsBasicEducationExamCreateComponent },
      { path: 'exams/university-education/:universityId/colleges/:collegeId', component: TenantQuestionsBankUniversitySubjectsComponent },
      { path: 'exams/university-education/:universityId', component: TenantQuestionsBankUniversityCollegeListComponent },
      { path: 'exams/university-education', component: TenantUniversitiesComponent },
      { path: 'billing', component: TenantBillingComponent, data: { requiredPermission: 'tenant.billing.view' } },
      { path: 'reports', component: TenantReportsComponent, data: { requiredPermission: 'tenant.reports.view' } },
      { path: 'settings', component: TenantPlatformSettingsComponent, data: { requiredPermission: 'tenant.settings.manage' } },
      { path: 'web-settings', redirectTo: 'lms-settings', pathMatch: 'full' },
      { path: 'lms-settings', component: TenantLmsSettingsComponent, data: { requiredPermission: 'tenant.settings.manage' } },
    ],
  },
];
