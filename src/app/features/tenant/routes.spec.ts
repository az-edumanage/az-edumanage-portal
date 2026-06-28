import { TENANT_ROUTES } from './routes';
import { TenantAttendanceComponent } from './pages/tenant-attendance/tenant-attendance.component';
import { TenantExamsComponent } from './pages/tenant-exams/tenant-exams.component';
import { TenantQuestionsBankComponent } from './pages/tenant-questions-bank/tenant-questions-bank.component';
import { TenantQuestionsBankBasicEducationComponent } from './pages/tenant-questions-bank-basic-education/tenant-questions-bank-basic-education.component';
import { TenantQuestionsBankBasicEducationGradesComponent } from './pages/tenant-questions-bank-basic-education-grades/tenant-questions-bank-basic-education-grades.component';
import { TenantQuestionsBankQuestionOverviewComponent } from './pages/tenant-questions-bank-question-overview/tenant-questions-bank-question-overview.component';
import { TenantQuestionsBankSubjectQuestionsComponent } from './pages/tenant-questions-bank-subject-questions/tenant-questions-bank-subject-questions.component';
import { TenantQuestionsBankUniversityCollegeListComponent } from './pages/tenant-questions-bank-university-college-list/tenant-questions-bank-university-college-list.component';
import { TenantQuestionsBankUniversityCollegesComponent } from './pages/tenant-questions-bank-university-colleges/tenant-questions-bank-university-colleges.component';
import { TenantQuestionsBankUniversitySubjectsComponent } from './pages/tenant-questions-bank-university-subjects/tenant-questions-bank-university-subjects.component';
import { TenantExamsBasicEducationComponent } from './pages/tenant-exams-basic-education/tenant-exams-basic-education.component';
import { TenantExamsBasicEducationGradesComponent } from './pages/tenant-exams-basic-education-grades/tenant-exams-basic-education-grades.component';
import { TenantExamsBasicEducationExamCreateComponent } from './pages/tenant-exams-basic-education-exam-create/tenant-exams-basic-education-exam-create.component';
import { TenantSubjectCurriculumQuestionCreateComponent } from './pages/tenant-subject-curriculum-question-create/tenant-subject-curriculum-question-create.component';
import { TenantSubjectCurriculumComponent } from './pages/tenant-subject-curriculum/tenant-subject-curriculum.component';
import { TenantSubjectCurriculumDetailsComponent } from './pages/tenant-subject-curriculum-details/tenant-subject-curriculum-details.component';
import { TenantUniversitiesComponent } from './pages/tenant-universities/tenant-universities.component';
import { TenantPlatformSettingsComponent } from './pages/tenant-platform-settings/tenant-platform-settings.component';
import { TenantStudentBarcodePrintComponent } from './pages/tenant-student-barcode-print/tenant-student-barcode-print.component';
import { TenantSubjectsComponent } from './pages/tenant-subjects/tenant-subjects.component';

describe('TENANT_ROUTES', () => {
  it('does not include the standalone change-password route inside tenant layout routes', () => {
    const topLevelPaths = TENANT_ROUTES.map((route) => route.path);
    const nestedPaths = TENANT_ROUTES.flatMap((route) => route.children?.map((child) => child.path) ?? []);

    expect(topLevelPaths).not.toContain('change-password');
    expect(nestedPaths).not.toContain('change-password');
  });

  it('keeps normal tenant dashboard pages inside the tenant child route tree', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const childPaths = tenantShell?.children?.map((child) => child.path) ?? [];

    expect(childPaths).toContain('overview');
    expect(childPaths).toContain('students');
    expect(childPaths).toContain('students/:id');
    expect(childPaths).toContain('students/:id/barcode/print');
    expect(childPaths).toContain('educational-stages');
    expect(childPaths).toContain('subjects');
    expect(childPaths).toContain('subjects/create');
    expect(childPaths).toContain('subjects/:id');
    expect(childPaths).toContain('universities');
    expect(childPaths).toContain('universities/:id/edit');
    expect(childPaths).toContain('universities/:id');
    expect(childPaths).toContain('colleges');
    expect(childPaths).toContain('colleges/create');
    expect(childPaths).toContain('colleges/:id/edit');
    expect(childPaths).toContain('colleges/:id');
    expect(childPaths).toContain('university-subjects');
    expect(childPaths).toContain('university-subjects/create');
    expect(childPaths).toContain('university-subjects/:id/edit');
    expect(childPaths).toContain('university-subjects/:id');
    expect(childPaths).toContain('groups/create');
    expect(childPaths).toContain('settings');
    expect(childPaths).toContain('web-settings');
    expect(childPaths).toContain('questions-bank');
    expect(childPaths).toContain('questions-bank/basic-education');
    expect(childPaths).toContain('questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id');
    expect(childPaths).toContain('questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum');
    expect(childPaths).toContain('questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/:nodeId/addQuestion');
    expect(childPaths).toContain('questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/:nodeId/editQuestion/:questionId');
    expect(childPaths).toContain('questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/:nodeId/questions/:questionId');
    expect(childPaths).toContain('questions-bank/basic-education/:stageId/grades/:gradeId');
    expect(childPaths).toContain('questions-bank/basic-education/:stageId');
    expect(childPaths).toContain('questions-bank/university-education');
    expect(childPaths).toContain('questions-bank/university-education/universities/:universityId');
    expect(childPaths).toContain('questions-bank/university-education/colleges/:collegeId');
    expect(childPaths).toContain('questions-bank/university-education/colleges/:collegeId/subjects/:id');
    expect(childPaths).toContain('questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum');
    expect(childPaths).toContain('questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId');
    expect(childPaths).toContain('questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId/addQuestion');
    expect(childPaths).toContain('questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId/editQuestion/:questionId');
    expect(childPaths).toContain('questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId/questions/:questionId');
  });

  it('routes platform settings to a real tenant settings page', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const settingsRoute = tenantShell?.children?.find((child) => child.path === 'settings');

    expect(settingsRoute?.component).toBe(TenantPlatformSettingsComponent);
  });

  it('routes tenant attendance to the dedicated attendance page', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const attendanceRoute = tenantShell?.children?.find((child) => child.path === 'attendance');

    expect(attendanceRoute?.component).toBe(TenantAttendanceComponent);
  });

  it('routes tenant questions bank tab to an available tenant page', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const questionsBankRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank');
    const basicEducationRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/basic-education');
    const basicEducationGradesRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/basic-education/:stageId');
    const basicEducationSubjectsRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/basic-education/:stageId/grades/:gradeId');
    const basicEducationSubjectQuestionsRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id');
    const basicEducationSubjectCurriculumRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum');
    const basicEducationSubjectAddQuestionRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/:nodeId/addQuestion');
    const basicEducationSubjectEditQuestionRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/:nodeId/editQuestion/:questionId');
    const basicEducationSubjectQuestionOverviewRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/basic-education/:stageId/grades/:gradeId/subjects/:id/curriculum/:nodeId/questions/:questionId');
    const universityEducationRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/university-education');
    const universityEducationUniversityCollegesRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/university-education/universities/:universityId');
    const universityEducationCollegeSubjectsRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/university-education/colleges/:collegeId');
    const universityEducationSubjectRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/university-education/colleges/:collegeId/subjects/:id');
    const universityEducationSubjectCurriculumRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum');
    const universityEducationSubjectQuestionsRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId');
    const universityEducationSubjectAddQuestionRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId/addQuestion');
    const universityEducationSubjectEditQuestionRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId/editQuestion/:questionId');
    const universityEducationSubjectQuestionOverviewRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/university-education/colleges/:collegeId/subjects/:id/curriculum/:nodeId/questions/:questionId');

    expect(questionsBankRoute?.component).toBe(TenantQuestionsBankComponent);
    expect(basicEducationRoute?.component).toBe(TenantQuestionsBankBasicEducationComponent);
    expect(basicEducationGradesRoute?.component).toBe(TenantQuestionsBankBasicEducationGradesComponent);
    expect(basicEducationSubjectsRoute?.component).toBe(TenantSubjectsComponent);
    expect(basicEducationSubjectQuestionsRoute?.component).toBe(TenantSubjectCurriculumComponent);
    expect(basicEducationSubjectCurriculumRoute?.component).toBe(TenantSubjectCurriculumComponent);
    expect(basicEducationSubjectAddQuestionRoute?.component).toBe(TenantSubjectCurriculumQuestionCreateComponent);
    expect(basicEducationSubjectEditQuestionRoute?.component).toBe(TenantSubjectCurriculumQuestionCreateComponent);
    expect(basicEducationSubjectQuestionOverviewRoute?.component).toBe(TenantQuestionsBankQuestionOverviewComponent);
    expect(universityEducationRoute?.component).toBe(TenantQuestionsBankUniversityCollegesComponent);
    expect(universityEducationUniversityCollegesRoute?.component).toBe(TenantQuestionsBankUniversityCollegeListComponent);
    expect(universityEducationCollegeSubjectsRoute?.component).toBe(TenantQuestionsBankUniversitySubjectsComponent);
    expect(universityEducationSubjectRoute?.component).toBe(TenantSubjectCurriculumComponent);
    expect(universityEducationSubjectCurriculumRoute?.component).toBe(TenantSubjectCurriculumComponent);
    expect(universityEducationSubjectQuestionsRoute?.component).toBe(TenantQuestionsBankSubjectQuestionsComponent);
    expect(universityEducationSubjectAddQuestionRoute?.component).toBe(TenantSubjectCurriculumQuestionCreateComponent);
    expect(universityEducationSubjectEditQuestionRoute?.component).toBe(TenantSubjectCurriculumQuestionCreateComponent);
    expect(universityEducationSubjectQuestionOverviewRoute?.component).toBe(TenantQuestionsBankQuestionOverviewComponent);
  });

  it('routes tenant exams to a dedicated exams page with education track children', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const examsRoute = tenantShell?.children?.find((child) => child.path === 'exams');
    const basicEducationRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education');
    const basicEducationGradesRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education/:stageId');
    const basicEducationExamListRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education/:stageId/grades/:gradeId/create');
    const basicEducationExamCreateRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education/:stageId/grades/:gradeId/create/new');
    const basicEducationExamSubjectRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id');
    const basicEducationExamSubjectCurriculumRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum');
    const basicEducationExamSubjectCurriculumDetailsRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/:nodeId');
    const basicEducationExamSubjectAddQuestionRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/addQuestion');
    const basicEducationExamSubjectEditQuestionRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education/:stageId/grades/:gradeId/create/new/subjects/:id/curriculum/editQuestion/:questionId');
    const universityEducationRoute = tenantShell?.children?.find((child) => child.path === 'exams/university-education');
    const universityEducationCollegesRoute = tenantShell?.children?.find((child) => child.path === 'exams/university-education/:universityId');
    const universityEducationSubjectsRoute = tenantShell?.children?.find((child) => child.path === 'exams/university-education/:universityId/colleges/:collegeId');
    const universityEducationExamListRoute = tenantShell?.children?.find((child) => child.path === 'exams/university-education/:universityId/colleges/:collegeId/create');
    const universityEducationExamCreateRoute = tenantShell?.children?.find((child) => child.path === 'exams/university-education/:universityId/colleges/:collegeId/create/new');

    expect(examsRoute?.component).toBe(TenantExamsComponent);
    expect(basicEducationRoute?.component).toBe(TenantExamsBasicEducationComponent);
    expect(basicEducationGradesRoute?.component).toBe(TenantExamsBasicEducationGradesComponent);
    expect(basicEducationExamListRoute?.component).toBe(TenantExamsBasicEducationExamCreateComponent);
    expect(basicEducationExamCreateRoute?.component).toBe(TenantExamsBasicEducationExamCreateComponent);
    expect(basicEducationExamCreateRoute?.data).toEqual({ mode: 'create' });
    expect(basicEducationExamSubjectRoute?.component).toBe(TenantSubjectCurriculumComponent);
    expect(basicEducationExamSubjectCurriculumRoute?.component).toBe(TenantSubjectCurriculumComponent);
    expect(basicEducationExamSubjectCurriculumDetailsRoute?.component).toBe(TenantSubjectCurriculumDetailsComponent);
    expect(basicEducationExamSubjectAddQuestionRoute?.component).toBe(TenantSubjectCurriculumQuestionCreateComponent);
    expect(basicEducationExamSubjectEditQuestionRoute?.component).toBe(TenantSubjectCurriculumQuestionCreateComponent);
    expect(universityEducationRoute?.component).toBe(TenantUniversitiesComponent);
    expect(universityEducationCollegesRoute?.component).toBe(TenantQuestionsBankUniversityCollegeListComponent);
    expect(universityEducationSubjectsRoute?.component).toBe(TenantQuestionsBankUniversitySubjectsComponent);
    expect(universityEducationExamListRoute?.component).toBe(TenantExamsBasicEducationExamCreateComponent);
    expect(universityEducationExamCreateRoute?.component).toBe(TenantExamsBasicEducationExamCreateComponent);
    expect(universityEducationExamCreateRoute?.data).toEqual({ mode: 'create' });
  });

  it('routes student barcode print to the dedicated print page', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const printRoute = tenantShell?.children?.find((child) => child.path === 'students/:id/barcode/print');

    expect(printRoute?.component).toBe(TenantStudentBarcodePrintComponent);
  });

  it.each([
    ['rooms', 'tenant.rooms.view'],
    ['rooms/create', 'tenant.rooms.manage'],
    ['rooms/:id/edit', 'tenant.rooms.manage'],
    ['educational-stages', 'tenant.basicEducation.view'],
    ['educational-stages/create', 'tenant.basicEducation.manage'],
    ['subjects', 'tenant.basicEducation.view'],
    ['subjects/create', 'tenant.basicEducation.manage'],
    ['grades', 'tenant.grades.view'],
    ['grades/create', 'tenant.grades.manage'],
    ['universities', 'tenant.universityEducation.view'],
    ['universities/create', 'tenant.universityEducation.manage'],
    ['colleges', 'tenant.universityEducation.view'],
    ['colleges/create', 'tenant.universityEducation.manage'],
    ['university-subjects', 'tenant.universityEducation.view'],
    ['university-subjects/create', 'tenant.universityEducation.manage'],
    ['schedule', 'tenant.attendance.view'],
    ['attendance', 'tenant.attendance.view'],
    ['reports', 'tenant.reports.view'],
    ['settings', 'tenant.settings.manage'],
    ['web-settings', 'tenant.settings.manage'],
  ])('guards %s with %s', (path, requiredPermission) => {
    expect(childRoute(path)?.data?.['requiredPermission']).toBe(requiredPermission);
  });
});

function childRoute(path: string) {
  const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
  return tenantShell?.children?.find((child) => child.path === path);
}
