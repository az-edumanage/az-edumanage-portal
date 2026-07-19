export const TENANT_MODULES = {
  studentsManagement: 'students-management',
  parentPortal: 'parent-portal',
  examsAndQuiz: 'exams-and-quiz',
  questionsBank: 'questions-bank',
  lms: 'lms',
  advancedAnalytics: 'advanced-analytics',
  studentsCommunity: 'students-community',
  bookStore: 'book-store',
  competitions: 'competitions',
  liveSessions: 'live-sessions',
  socialMedia: 'social-media',
  marketPlace: 'market-place',
} as const;

export type TenantModuleCode = typeof TENANT_MODULES[keyof typeof TENANT_MODULES];

export function requiredModulesForUrl(url: string): TenantModuleCode[] {
  const path = url.split(/[?#]/, 1)[0];

  if (path === '/tenant/parents' || path.startsWith('/tenant/parents/')) {
    return [TENANT_MODULES.studentsManagement, TENANT_MODULES.parentPortal];
  }
  if (path === '/tenant/students' || path.startsWith('/tenant/students/')) {
    return [TENANT_MODULES.studentsManagement];
  }
  if (path === '/tenant/attendance'
      || path.startsWith('/tenant/attendance/')
      || /^\/tenant\/groups\/[^/]+\/attendance(?:\/|$)/.test(path)
      || path === '/teacher/attendance'
      || path.startsWith('/teacher/attendance/')
      || /^\/teacher\/groups\/[^/]+\/attendance(?:\/|$)/.test(path)) {
    return [TENANT_MODULES.studentsManagement];
  }
  if (path === '/tenant/lms-settings' || path.startsWith('/tenant/lms-settings/')) {
    return [TENANT_MODULES.lms];
  }
  if (path === '/tenant/reports' || path.startsWith('/tenant/reports/')) {
    return [TENANT_MODULES.advancedAnalytics];
  }
  if (path === '/tenant/questions-bank' || path.startsWith('/tenant/questions-bank/')) {
    return [TENANT_MODULES.questionsBank];
  }
  if (path === '/tenant/exams'
      || path.startsWith('/tenant/exams/')
      || path === '/tenant/exam-evaluation'
      || path.startsWith('/tenant/exam-evaluation/')
      || path === '/tenant/exams-evaluation'
      || path.startsWith('/tenant/exams-evaluation/')
      || path === '/tenant/evaluation'
      || path.startsWith('/tenant/evaluation/')
      || /^\/tenant\/groups\/[^/]+\/exam(?:\/|$)/.test(path)) {
    return [TENANT_MODULES.examsAndQuiz];
  }
  if (path === '/teacher/exams'
      || path.startsWith('/teacher/exams/')
      || path === '/teacher/evaluation'
      || path.startsWith('/teacher/evaluation/')
      || path === '/teacher/exam-evaluation'
      || path.startsWith('/teacher/exam-evaluation/')
      || /^\/teacher\/groups\/[^/]+\/exam(?:\/|$)/.test(path)
      || path === '/student/exams'
      || path.startsWith('/student/exams/')
      || path === '/student/home-work'
      || path.startsWith('/student/home-work/')
      || path === '/student/evaluation'
      || path.startsWith('/student/evaluation/')
      || path === '/student/exam-evaluation'
      || path.startsWith('/student/exam-evaluation/')
      || path === '/parent/exam-evaluation'
      || path.startsWith('/parent/exam-evaluation/')
      || path === '/parent/home-work-evaluation'
      || path.startsWith('/parent/home-work-evaluation/')
      || path === '/parent/session-assessment'
      || path.startsWith('/parent/session-assessment/')) {
    return [TENANT_MODULES.examsAndQuiz];
  }
  return [];
}
