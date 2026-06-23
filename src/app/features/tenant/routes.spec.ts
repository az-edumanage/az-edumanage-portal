import { TENANT_ROUTES } from './routes';
import { TenantAttendanceComponent } from './pages/tenant-attendance/tenant-attendance.component';
import { TenantExamsComponent } from './pages/tenant-exams/tenant-exams.component';
import { TenantQuestionsBankComponent } from './pages/tenant-questions-bank/tenant-questions-bank.component';
import { TenantQuestionsBankBasicEducationComponent } from './pages/tenant-questions-bank-basic-education/tenant-questions-bank-basic-education.component';
import { TenantQuestionsBankBasicEducationGradesComponent } from './pages/tenant-questions-bank-basic-education-grades/tenant-questions-bank-basic-education-grades.component';
import { TenantExamsBasicEducationComponent } from './pages/tenant-exams-basic-education/tenant-exams-basic-education.component';
import { TenantExamsBasicEducationGradesComponent } from './pages/tenant-exams-basic-education-grades/tenant-exams-basic-education-grades.component';
import { TenantExamsBasicEducationExamCreateComponent } from './pages/tenant-exams-basic-education-exam-create/tenant-exams-basic-education-exam-create.component';
import { TenantSubjectCurriculumQuestionCreateComponent } from './pages/tenant-subject-curriculum-question-create/tenant-subject-curriculum-question-create.component';
import { TenantSubjectCurriculumComponent } from './pages/tenant-subject-curriculum/tenant-subject-curriculum.component';
import { TenantUniversitiesComponent } from './pages/tenant-universities/tenant-universities.component';
import { TenantPlatformSettingsComponent } from './pages/tenant-platform-settings/tenant-platform-settings.component';
import { TenantStudentBarcodePrintComponent } from './pages/tenant-student-barcode-print/tenant-student-barcode-print.component';
import { TenantSubjectsComponent } from './pages/tenant-subjects/tenant-subjects.component';
import { TenantUniversitySubjectsComponent } from './pages/tenant-university-subjects/tenant-university-subjects.component';

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
    expect(childPaths).toContain('questions-bank/basic-education/:stageId/grades/:gradeId');
    expect(childPaths).toContain('questions-bank/basic-education/:stageId');
    expect(childPaths).toContain('questions-bank/university-education');
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
    const universityEducationRoute = tenantShell?.children?.find((child) => child.path === 'questions-bank/university-education');

    expect(questionsBankRoute?.component).toBe(TenantQuestionsBankComponent);
    expect(basicEducationRoute?.component).toBe(TenantQuestionsBankBasicEducationComponent);
    expect(basicEducationGradesRoute?.component).toBe(TenantQuestionsBankBasicEducationGradesComponent);
    expect(basicEducationSubjectsRoute?.component).toBe(TenantSubjectsComponent);
    expect(basicEducationSubjectQuestionsRoute?.component).toBe(TenantSubjectCurriculumComponent);
    expect(basicEducationSubjectCurriculumRoute?.component).toBe(TenantSubjectCurriculumComponent);
    expect(basicEducationSubjectAddQuestionRoute?.component).toBe(TenantSubjectCurriculumQuestionCreateComponent);
    expect(universityEducationRoute?.component).toBe(TenantUniversitySubjectsComponent);
  });

  it('routes tenant exams to a dedicated exams page with education track children', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const examsRoute = tenantShell?.children?.find((child) => child.path === 'exams');
    const basicEducationRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education');
    const basicEducationGradesRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education/:stageId');
    const basicEducationExamListRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education/:stageId/grades/:gradeId/create');
    const basicEducationExamCreateRoute = tenantShell?.children?.find((child) => child.path === 'exams/basic-education/:stageId/grades/:gradeId/create/new');
    const universityEducationRoute = tenantShell?.children?.find((child) => child.path === 'exams/university-education');

    expect(examsRoute?.component).toBe(TenantExamsComponent);
    expect(basicEducationRoute?.component).toBe(TenantExamsBasicEducationComponent);
    expect(basicEducationGradesRoute?.component).toBe(TenantExamsBasicEducationGradesComponent);
    expect(basicEducationExamListRoute?.component).toBe(TenantExamsBasicEducationExamCreateComponent);
    expect(basicEducationExamCreateRoute?.component).toBe(TenantExamsBasicEducationExamCreateComponent);
    expect(basicEducationExamCreateRoute?.data).toEqual({ mode: 'create' });
    expect(universityEducationRoute?.component).toBe(TenantUniversitiesComponent);
  });

  it('routes student barcode print to the dedicated print page', () => {
    const tenantShell = TENANT_ROUTES.find((route) => route.path === '');
    const printRoute = tenantShell?.children?.find((child) => child.path === 'students/:id/barcode/print');

    expect(printRoute?.component).toBe(TenantStudentBarcodePrintComponent);
  });
});
