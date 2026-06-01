import { Routes } from '@angular/router';
import { TenantDashboardComponent } from './pages/tenant-dashboard/tenant-dashboard.component';
import { TenantStudentsComponent } from './pages/tenant-students/tenant-students.component';
import { TenantStudentCreateComponent } from './pages/tenant-student-create/tenant-student-create.component';
import { TenantTeachersComponent } from './pages/tenant-teachers/tenant-teachers.component';
import { TenantTeacherCreateComponent } from './pages/tenant-teacher-create/tenant-teacher-create.component';
import { TenantTeacherDetailsComponent } from './pages/tenant-teacher-details/tenant-teacher-details.component';
import { TenantGroupsComponent } from './pages/tenant-groups/tenant-groups.component';
import { TenantGroupCreatePageComponent } from './pages/tenant-group-create/tenant-group-create-page.component';
import { TenantGroupDetailsComponent } from './pages/tenant-group-details/tenant-group-details.component';
import { TenantGroupStudentAddComponent } from './pages/tenant-group-student-add/tenant-group-student-add.component';
import { TenantGroupAttendanceComponent } from './pages/tenant-group-attendance/tenant-group-attendance.component';
import { TenantGroupExamCreateComponent } from './pages/tenant-group-exam-create/tenant-group-exam-create.component';
import { TenantGroupBroadcastComponent } from './pages/tenant-group-broadcast/tenant-group-broadcast.component';
import { TenantRoomsComponent } from './pages/tenant-rooms/tenant-rooms.component';
import { TenantRoomCreateComponent } from './pages/tenant-room-create/tenant-room-create.component';
import { TenantRoomDetailsComponent } from './pages/tenant-room-details/tenant-room-details.component';
import { TenantRoomBookingComponent } from './pages/tenant-room-booking/tenant-room-booking.component';
import { TenantEducationalStagesComponent } from './pages/tenant-educational-stages/tenant-educational-stages.component';
import { TenantGradesComponent } from './pages/tenant-grades/tenant-grades.component';
import { TenantGradeCreateComponent } from './pages/tenant-grade-create/tenant-grade-create.component';
import { TenantGradeDetailsComponent } from './pages/tenant-grade-details/tenant-grade-details.component';
import { TenantSubjectsComponent } from './pages/tenant-subjects/tenant-subjects.component';
import { TenantSubjectCreateComponent } from './pages/tenant-subject-create/tenant-subject-create.component';
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
import { TenantScheduleComponent } from './pages/tenant-schedule/tenant-schedule.component';
import { TenantPlatformSettingsComponent } from './pages/tenant-platform-settings/tenant-platform-settings.component';
import { TenantAccessStateComponent } from './pages/tenant-access-state/tenant-access-state.component';
import { passwordChangeRequiredChildGuard, passwordChangeRequiredGuard } from '../../core/guards/role.guard';
import { tenantAccessStateGuard, tenantOperationalAccessGuard } from '../../core/guards/tenant-operational-access.guard';

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
    path: '',
    canActivate: [passwordChangeRequiredGuard],
    canActivateChild: [passwordChangeRequiredChildGuard, tenantOperationalAccessGuard],
    children: [
      { path: 'overview', component: TenantDashboardComponent },
      { path: 'students', component: TenantStudentsComponent },
      { path: 'students/create', component: TenantStudentCreateComponent },
      { path: 'teachers', component: TenantTeachersComponent },
      { path: 'teachers/create', component: TenantTeacherCreateComponent },
      { path: 'teachers/:id/edit', component: TenantTeacherCreateComponent },
      { path: 'teachers/:id/settings', component: TenantTeacherCreateComponent },
      { path: 'teachers/:id/messages', component: TenantDashboardComponent },
      { path: 'teachers/:id', component: TenantTeacherDetailsComponent },
      { path: 'groups', component: TenantGroupsComponent },
      { path: 'groups/create', component: TenantGroupCreatePageComponent },
      { path: 'groups/:id', component: TenantGroupDetailsComponent },
      { path: 'groups/:id/edit', component: TenantGroupCreatePageComponent },
      { path: 'groups/:id/enroll', component: TenantGroupStudentAddComponent },
      { path: 'groups/:id/attendance', component: TenantGroupAttendanceComponent },
      { path: 'groups/:id/exam', component: TenantGroupExamCreateComponent },
      { path: 'groups/:id/broadcast', component: TenantGroupBroadcastComponent },
      { path: 'rooms', component: TenantRoomsComponent },
      { path: 'rooms/create', component: TenantRoomCreateComponent },
      { path: 'rooms/:id', component: TenantRoomDetailsComponent },
      { path: 'rooms/:id/edit', component: TenantRoomCreateComponent },
      { path: 'rooms/:id/book', component: TenantRoomBookingComponent },
      { path: 'educational-stages', component: TenantEducationalStagesComponent },
      { path: 'grades', component: TenantGradesComponent },
      { path: 'grades/create', component: TenantGradeCreateComponent },
      { path: 'grades/:id/edit', component: TenantGradeCreateComponent },
      { path: 'grades/:id', component: TenantGradeDetailsComponent },
      { path: 'subjects', component: TenantSubjectsComponent },
      { path: 'subjects/create', component: TenantSubjectCreateComponent },
      { path: 'subjects/:id', component: TenantSubjectDetailsComponent },
      { path: 'universities', component: TenantUniversitiesComponent },
      { path: 'universities/:id/edit', component: TenantUniversityCreateComponent },
      { path: 'universities/:id', component: TenantUniversityDetailsComponent },
      { path: 'colleges', component: TenantCollegesComponent },
      { path: 'colleges/create', component: TenantCollegeCreateComponent },
      { path: 'colleges/:id/edit', component: TenantCollegeCreateComponent },
      { path: 'colleges/:id', component: TenantCollegeDetailsComponent },
      { path: 'university-subjects', component: TenantUniversitySubjectsComponent },
      { path: 'university-subjects/create', component: TenantUniversitySubjectCreateComponent },
      { path: 'university-subjects/:id/edit', component: TenantUniversitySubjectCreateComponent },
      { path: 'university-subjects/:id', component: TenantUniversitySubjectDetailsComponent },
      { path: 'users', component: TenantUsersComponent },
      { path: 'users/create', component: TenantUserCreateComponent },
      { path: 'schedule', component: TenantScheduleComponent },
      { path: 'attendance', component: TenantDashboardComponent },
      { path: 'exams', component: TenantDashboardComponent },
      { path: 'billing', component: TenantDashboardComponent },
      { path: 'reports', component: TenantDashboardComponent },
      { path: 'settings', component: TenantPlatformSettingsComponent },
      { path: 'web-settings', component: TenantDashboardComponent },
    ],
  },
];
