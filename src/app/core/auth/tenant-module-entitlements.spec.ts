import { describe, expect, it } from 'vitest';

import { requiredModulesForUrl, TENANT_MODULES } from './tenant-module-entitlements';

describe('tenant module entitlements', () => {
  it.each([
    ['/tenant/students', [TENANT_MODULES.studentsManagement]],
    ['/tenant/students/123/edit', [TENANT_MODULES.studentsManagement]],
    ['/tenant/parents', [TENANT_MODULES.studentsManagement, TENANT_MODULES.parentPortal]],
    ['/tenant/attendance', [TENANT_MODULES.studentsManagement]],
    ['/tenant/exams/basic-education', [TENANT_MODULES.examsAndQuiz]],
    ['/tenant/groups/group-1/exam', [TENANT_MODULES.examsAndQuiz]],
    ['/tenant/evaluation/home-work', [TENANT_MODULES.examsAndQuiz]],
    ['/tenant/questions-bank/university-education', [TENANT_MODULES.questionsBank]],
    ['/tenant/reports', [TENANT_MODULES.advancedAnalytics]],
    ['/tenant/lms-settings', [TENANT_MODULES.lms]],
  ])('maps %s to its required modules', (url, moduleCodes) => {
    expect(requiredModulesForUrl(url)).toEqual(moduleCodes);
  });

  it('does not gate core tenant settings with a catalog module', () => {
    expect(requiredModulesForUrl('/tenant/settings')).toEqual([]);
  });

  it.each([
    ['/teacher/exams', [TENANT_MODULES.examsAndQuiz]],
    ['/teacher/attendance', [TENANT_MODULES.studentsManagement]],
    ['/student/evaluation/exams', [TENANT_MODULES.examsAndQuiz]],
    ['/parent/session-assessment', [TENANT_MODULES.examsAndQuiz]],
  ])('gates tenant-owned portal route %s', (url, moduleCodes) => {
    expect(requiredModulesForUrl(url)).toEqual(moduleCodes);
  });
});
