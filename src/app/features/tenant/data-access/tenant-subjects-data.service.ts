import { HttpClient, HttpErrorResponse, HttpEventType, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { filter, firstValueFrom, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { Grade } from '../models/tenant-grades.models';
import { EducationalStage } from '../models/tenant-educational-stages.models';
import {
  BloomLevel,
  QuestionDifficulty,
  TenantSubject,
  TenantCurriculumMaterialFile,
  TenantCurriculumMaterialFolder,
  TenantCurriculumMaterialLink,
  TenantCurriculumMaterialNote,
  TenantCurriculumSkill,
  TenantSubjectCreateForm,
  TenantSubjectCurriculumNode,
  TenantCurriculumQuestion,
  TenantCurriculumQuestionAnswer,
  TenantCurriculumQuestionPage,
  TenantQuestionBankOverview,
  TenantQuestionBankTaggedQuestion,
  TenantQuestionBankTagSummary,
  TenantSubjectGradeOption,
  TenantSubjectGroupRow,
  TenantSubjectStageOption,
  TenantSubjectTeacherRow,
} from '../models/tenant-subjects.models';

type TenantSubjectResponse = Omit<TenantSubject, 'groups'> & {
  groups?: TenantSubjectGroupRow[] | null;
  teachers?: TenantSubjectTeacherRow[] | null;
};

export interface TenantCurriculumQuestionMediaPayload {
  mediaUrl: string | null;
  mediaFileName: string | null;
  mediaOriginalName: string | null;
  mediaContentType: string | null;
  mediaSizeBytes: number | null;
}

export type TenantCurriculumQuestionPayload = {
  question: string;
  type: string;
  answer: string | null;
  description: string | null;
  bloomId: string | null;
  difficultyId: string | null;
  weight: number | null;
  skillId: string | null;
  curriculumNodeId?: string | null;
  questionSource?: string | null;
  answerExplanation?: string | null;
  tags?: string[];
} & TenantCurriculumQuestionMediaPayload;

export type TenantCurriculumQuestionAnswerPayload = {
  answer: string;
  correct: boolean;
  description?: string | null;
} & Partial<TenantCurriculumQuestionMediaPayload>;

export interface TenantCurriculumQuestionMediaUpload {
  url: string;
  fileName: string;
  originalName: string;
  contentType: string | null;
  sizeBytes: number;
}

export interface TenantBasicEducationExam {
  id: string;
  stageId: string | null;
  gradeId: string | null;
  subjectId: string;
  title: string;
  instructions: string | null;
  status: string;
  assessmentKind?: 'EXAM' | 'HOME_WORK';
  shuffleQuestions: boolean;
  showResultsImmediately: boolean;
  allowRetakes: boolean;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantBasicEducationExamPayload {
  title: string;
  instructions: string | null;
  shuffleQuestions: boolean;
  showResultsImmediately: boolean;
  allowRetakes: boolean;
  questionIds: string[];
  assessmentKind?: 'EXAM' | 'HOME_WORK';
}

export interface TenantBasicEducationExamStatusPayload {
  status: string;
}

export interface TenantCurriculumMaterialFolderPayload {
  name: string;
  description: string | null;
}

export interface TenantCurriculumMaterialNotePayload {
  title: string;
  contentJson: string;
}

export interface TenantCurriculumMaterialLinkPayload {
  title: string;
  url: string;
}

export interface TenantCurriculumSkillPayload {
  name: string;
  description: string | null;
}

export interface TenantSubjectListFilters {
  stageId?: string;
  gradeId?: string;
  search?: string;
}

export interface TenantCurriculumQuestionListParams {
  search?: string;
  type?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class TenantSubjectsDataService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly subjectsUrl = `${environment.apiBaseUrl}/tenant/platform-settings/subjects`;
  private readonly universitySubjectsUrl = `${environment.apiBaseUrl}/tenant/platform-settings/university-subjects`;
  private readonly platformSettingsUrl = `${environment.apiBaseUrl}/tenant/platform-settings`;
  private readonly stagesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/stages`;
  private readonly gradesUrl = `${environment.apiBaseUrl}/tenant/platform-settings/grades`;
  private readonly questionsBankOverviewUrl = `${environment.apiBaseUrl}/tenant/platform-settings/questions-bank/overview`;
  private readonly bloomsUrl = `${environment.apiBaseUrl}/blooms`;
  private readonly questionDifficultiesUrl = `${environment.apiBaseUrl}/question-difficulties`;

  async listBloomLevels(): Promise<BloomLevel[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<BloomLevel[]>(this.bloomsUrl));
    return (response ?? []).map((bloom) => ({
      id: bloom.id,
      code: bloom.code,
      nameAr: bloom.nameAr,
      nameEn: bloom.nameEn,
      descriptionAr: bloom.descriptionAr ?? null,
      descriptionEn: bloom.descriptionEn ?? null,
      levelOrder: bloom.levelOrder,
    }));
  }

  async listQuestionDifficulties(): Promise<QuestionDifficulty[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<QuestionDifficulty[]>(this.questionDifficultiesUrl));
    return (response ?? []).map((difficulty) => ({
      id: difficulty.id,
      code: difficulty.code,
      nameAr: difficulty.nameAr,
      nameEn: difficulty.nameEn,
      descriptionAr: difficulty.descriptionAr ?? null,
      descriptionEn: difficulty.descriptionEn ?? null,
      difficultyOrder: difficulty.difficultyOrder,
    }));
  }

  async getQuestionBankOverview(tag?: string | null): Promise<TenantQuestionBankOverview> {
    await this.authApi.ensureLoggedIn();
    let params = new HttpParams();
    if (tag?.trim()) {
      params = params.set('tag', tag.trim());
    }
    const response = await firstValueFrom(this.http.get<TenantQuestionBankOverview>(this.questionsBankOverviewUrl, { params }));
    return this.normalizeQuestionBankOverview(response);
  }

  async listSubjects(filters: TenantSubjectListFilters = {}): Promise<TenantSubject[]> {
    await this.authApi.ensureLoggedIn();
    let params = new HttpParams();
    if (filters.stageId) {
      params = params.set('stageId', filters.stageId);
    }
    if (filters.gradeId) {
      params = params.set('gradeId', filters.gradeId);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    const response = await firstValueFrom(this.http.get<TenantSubjectResponse[]>(this.subjectsUrl, { params }));
    return (response ?? []).map((subject) => this.normalizeSubject(subject));
  }

  async createSubject(payload: TenantSubjectCreateForm): Promise<TenantSubject> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantSubjectResponse>(this.subjectsUrl, {
      name: payload.name.trim(),
      stageId: payload.stageId,
      gradeId: payload.gradeId,
    }));
    return this.normalizeSubject(response);
  }

  async updateSubject(id: string, payload: TenantSubjectCreateForm): Promise<TenantSubject> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.put<TenantSubjectResponse>(`${this.subjectsUrl}/${id}`, {
      name: payload.name.trim(),
      stageId: payload.stageId,
      gradeId: payload.gradeId,
    }));
    return this.normalizeSubject(response);
  }

  async deleteSubject(id: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.subjectsUrl}/${id}`));
  }

  async getSubjectDetails(id: string): Promise<TenantSubject> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantSubjectResponse>(`${this.subjectsBaseUrl()}/${id}`));
    return this.normalizeSubject(response);
  }

  async getSubjectDetailsForCategory(id: string, educationCategory: string | null | undefined): Promise<TenantSubject> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantSubjectResponse>(`${this.subjectsBaseUrlForCategory(educationCategory)}/${id}`));
    return this.normalizeSubject(response);
  }

  async getSubjectCurriculum(subjectId: string): Promise<TenantSubjectCurriculumNode> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantSubjectCurriculumNode>(`${this.subjectsBaseUrl()}/${subjectId}/curriculum`));
    return this.normalizeCurriculumNode(response);
  }

  async getSubjectCurriculumForCategory(subjectId: string, educationCategory: string | null | undefined): Promise<TenantSubjectCurriculumNode> {
    await this.authApi.ensureLoggedIn();
    const baseUrl = educationCategory === 'UNIVERSITY_EDUCATION' ? this.universitySubjectsUrl : this.subjectsUrl;
    const response = await firstValueFrom(this.http.get<TenantSubjectCurriculumNode>(`${baseUrl}/${subjectId}/curriculum`));
    return this.normalizeCurriculumNode(response);
  }

  async createSubjectCurriculumNode(
    subjectId: string,
    payload: { parentId: string | null; name: string; description: string | null },
  ): Promise<TenantSubjectCurriculumNode> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantSubjectCurriculumNode>(`${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes`, {
      parentId: payload.parentId,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
    }));
    return this.normalizeCurriculumNode(response);
  }

  async updateSubjectCurriculumNode(
    subjectId: string,
    nodeId: string,
    payload: { name: string; description: string | null },
  ): Promise<TenantSubjectCurriculumNode> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.put<TenantSubjectCurriculumNode>(`${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}`, {
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
    }));
    return this.normalizeCurriculumNode(response);
  }

  async deleteSubjectCurriculumNode(subjectId: string, nodeId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}`));
  }

  async listCurriculumQuestions(subjectId: string, nodeId: string): Promise<TenantCurriculumQuestion[]> {
    const page = await this.listCurriculumQuestionsPage(subjectId, nodeId, { page: 0, size: 100 });
    return page.content;
  }

  async listCurriculumQuestionsForCategory(
    subjectId: string,
    nodeId: string,
    educationCategory: string | null | undefined,
  ): Promise<TenantCurriculumQuestion[]> {
    const page = await this.listCurriculumQuestionsPageForCategory(subjectId, nodeId, educationCategory, { page: 0, size: 100 });
    return page.content;
  }

  async listCurriculumQuestionsPage(
    subjectId: string,
    nodeId: string,
    filters: TenantCurriculumQuestionListParams = {},
  ): Promise<TenantCurriculumQuestionPage> {
    await this.authApi.ensureLoggedIn();
    let params = new HttpParams()
      .set('page', String(Math.max(0, filters.page ?? 0)))
      .set('size', String(Math.max(1, filters.size ?? 10)));
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.type?.trim()) {
      params = params.set('type', filters.type.trim());
    }
    const response = await firstValueFrom(this.http.get<TenantCurriculumQuestionPage>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/questions`,
      { params },
    ));
    return {
      content: (response?.content ?? []).map((question) => this.normalizeCurriculumQuestion(question)),
      totalElements: response?.totalElements ?? 0,
      totalPages: response?.totalPages ?? 0,
      page: response?.page ?? Math.max(0, filters.page ?? 0),
      size: response?.size ?? Math.max(1, filters.size ?? 10),
    };
  }

  async listCurriculumQuestionsPageForCategory(
    subjectId: string,
    nodeId: string,
    educationCategory: string | null | undefined,
    filters: TenantCurriculumQuestionListParams = {},
  ): Promise<TenantCurriculumQuestionPage> {
    await this.authApi.ensureLoggedIn();
    let params = new HttpParams()
      .set('page', String(Math.max(0, filters.page ?? 0)))
      .set('size', String(Math.max(1, filters.size ?? 10)));
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.type?.trim()) {
      params = params.set('type', filters.type.trim());
    }
    const response = await firstValueFrom(this.http.get<TenantCurriculumQuestionPage>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/questions`,
      { params },
    ));
    return {
      content: (response?.content ?? []).map((question) => this.normalizeCurriculumQuestion(question)),
      totalElements: response?.totalElements ?? 0,
      totalPages: response?.totalPages ?? 0,
      page: response?.page ?? Math.max(0, filters.page ?? 0),
      size: response?.size ?? Math.max(1, filters.size ?? 10),
    };
  }

  async createCurriculumQuestion(
    subjectId: string,
    nodeId: string,
    payload: TenantCurriculumQuestionPayload,
  ): Promise<TenantCurriculumQuestion> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumQuestion>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/questions`,
      this.toCurriculumQuestionBody(payload),
    ));
    return this.normalizeCurriculumQuestion(response);
  }

  async createCurriculumQuestionForCategory(
    subjectId: string,
    nodeId: string,
    educationCategory: string | null | undefined,
    payload: TenantCurriculumQuestionPayload,
  ): Promise<TenantCurriculumQuestion> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumQuestion>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/questions`,
      this.toCurriculumQuestionBody(payload),
    ));
    return this.normalizeCurriculumQuestion(response);
  }

  async listBasicEducationExamQuestions(
    stageId: string,
    gradeId: string,
    subjectId: string,
  ): Promise<TenantCurriculumQuestion[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantCurriculumQuestion[]>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}/questions`,
    ));
    return (response ?? []).map((question) => this.normalizeCurriculumQuestion(question));
  }

  async listBasicEducationExams(
    stageId: string,
    gradeId: string,
    subjectId: string,
    assessmentKind: 'EXAM' | 'HOME_WORK' = 'EXAM',
  ): Promise<TenantBasicEducationExam[]> {
    await this.authApi.ensureLoggedIn();
    const params = assessmentKind === 'EXAM'
      ? undefined
      : new HttpParams().set('assessmentKind', assessmentKind);
    const response = await firstValueFrom(this.http.get<TenantBasicEducationExam[]>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}`,
      { params },
    ));
    return response ?? [];
  }

  async listUniversityEducationExams(
    universityId: string,
    collegeId: string,
  ): Promise<TenantBasicEducationExam[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantBasicEducationExam[]>(
      `${this.platformSettingsUrl}/exams/university-education/${universityId}/colleges/${collegeId}`,
    ));
    return response ?? [];
  }

  async createUniversityEducationExam(
    universityId: string,
    collegeId: string,
    subjectId: string,
    payload: TenantBasicEducationExamPayload,
  ): Promise<TenantBasicEducationExam> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.post<TenantBasicEducationExam>(
      `${this.platformSettingsUrl}/exams/university-education/${universityId}/colleges/${collegeId}/subjects/${subjectId}`,
      {
        title: payload.title.trim(),
        instructions: payload.instructions?.trim() || null,
        shuffleQuestions: payload.shuffleQuestions,
        showResultsImmediately: payload.showResultsImmediately,
        allowRetakes: payload.allowRetakes,
        questionIds: payload.questionIds,
        ...(payload.assessmentKind ? { assessmentKind: payload.assessmentKind } : {}),
      },
    ));
  }

  async listBasicEducationExamLinkedQuestions(
    stageId: string,
    gradeId: string,
    subjectId: string,
    examId: string,
  ): Promise<TenantCurriculumQuestion[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantCurriculumQuestion[]>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}/${examId}/questions`,
    ));
    return (response ?? []).map((question) => this.normalizeCurriculumQuestion(question));
  }

  async createEditableBasicEducationExamQuestionCopy(
    stageId: string,
    gradeId: string,
    subjectId: string,
    examId: string,
    questionId: string,
  ): Promise<TenantCurriculumQuestion> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumQuestion>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}/${examId}/questions/${questionId}/editable-copy`,
      {},
    ));
    return this.normalizeCurriculumQuestion(response);
  }

  async createBasicEducationExam(
    stageId: string,
    gradeId: string,
    subjectId: string,
    payload: TenantBasicEducationExamPayload,
  ): Promise<TenantBasicEducationExam> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.post<TenantBasicEducationExam>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}`,
      {
        title: payload.title.trim(),
        instructions: payload.instructions?.trim() || null,
        shuffleQuestions: payload.shuffleQuestions,
        showResultsImmediately: payload.showResultsImmediately,
        allowRetakes: payload.allowRetakes,
        questionIds: payload.questionIds,
        ...(payload.assessmentKind ? { assessmentKind: payload.assessmentKind } : {}),
      },
    ));
  }

  async updateBasicEducationExam(
    stageId: string,
    gradeId: string,
    subjectId: string,
    examId: string,
    payload: TenantBasicEducationExamPayload,
  ): Promise<TenantBasicEducationExam> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.put<TenantBasicEducationExam>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}/${examId}`,
      {
        title: payload.title.trim(),
        instructions: payload.instructions?.trim() || null,
        shuffleQuestions: payload.shuffleQuestions,
        showResultsImmediately: payload.showResultsImmediately,
        allowRetakes: payload.allowRetakes,
        questionIds: payload.questionIds,
        ...(payload.assessmentKind ? { assessmentKind: payload.assessmentKind } : {}),
      },
    ));
  }

  async updateUniversityEducationExam(
    universityId: string,
    collegeId: string,
    subjectId: string,
    examId: string,
    payload: TenantBasicEducationExamPayload,
  ): Promise<TenantBasicEducationExam> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.put<TenantBasicEducationExam>(
      `${this.platformSettingsUrl}/exams/university-education/${universityId}/colleges/${collegeId}/subjects/${subjectId}/${examId}`,
      {
        title: payload.title.trim(),
        instructions: payload.instructions?.trim() || null,
        shuffleQuestions: payload.shuffleQuestions,
        showResultsImmediately: payload.showResultsImmediately,
        allowRetakes: payload.allowRetakes,
        questionIds: payload.questionIds,
        ...(payload.assessmentKind ? { assessmentKind: payload.assessmentKind } : {}),
      },
    ));
  }

  async deleteBasicEducationExam(
    stageId: string,
    gradeId: string,
    subjectId: string,
    examId: string,
  ): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}/${examId}`,
    ));
  }

  async deleteUniversityEducationExam(
    universityId: string,
    collegeId: string,
    subjectId: string,
    examId: string,
  ): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(
      `${this.platformSettingsUrl}/exams/university-education/${universityId}/colleges/${collegeId}/subjects/${subjectId}/${examId}`,
    ));
  }

  async updateBasicEducationExamStatus(
    stageId: string,
    gradeId: string,
    subjectId: string,
    examId: string,
    payload: TenantBasicEducationExamStatusPayload,
  ): Promise<TenantBasicEducationExam> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.patch<TenantBasicEducationExam>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}/${examId}/status`,
      {
        status: payload.status.trim(),
      },
    ));
  }

  async updateUniversityEducationExamStatus(
    universityId: string,
    collegeId: string,
    subjectId: string,
    examId: string,
    payload: TenantBasicEducationExamStatusPayload,
  ): Promise<TenantBasicEducationExam> {
    await this.authApi.ensureLoggedIn();
    return await firstValueFrom(this.http.patch<TenantBasicEducationExam>(
      `${this.platformSettingsUrl}/exams/university-education/${universityId}/colleges/${collegeId}/subjects/${subjectId}/${examId}/status`,
      {
        status: payload.status.trim(),
      },
    ));
  }

  async createBasicEducationExamQuestion(
    stageId: string,
    gradeId: string,
    subjectId: string,
    payload: TenantCurriculumQuestionPayload,
  ): Promise<TenantCurriculumQuestion> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumQuestion>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}/curriculum/questions`,
      this.toCurriculumQuestionBody(payload),
    ));
    return this.normalizeCurriculumQuestion(response);
  }

  async updateBasicEducationExamQuestion(
    stageId: string,
    gradeId: string,
    subjectId: string,
    questionId: string,
    payload: TenantCurriculumQuestionPayload,
  ): Promise<TenantCurriculumQuestion> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.put<TenantCurriculumQuestion>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}/curriculum/questions/${questionId}`,
      this.toCurriculumQuestionBody(payload),
    ));
    return this.normalizeCurriculumQuestion(response);
  }

  async deleteBasicEducationExamQuestion(
    stageId: string,
    gradeId: string,
    subjectId: string,
    questionId: string,
  ): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}/curriculum/questions/${questionId}`,
    ));
  }

  async updateCurriculumQuestion(
    subjectId: string,
    nodeId: string,
    questionId: string,
    payload: TenantCurriculumQuestionPayload,
  ): Promise<TenantCurriculumQuestion> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.put<TenantCurriculumQuestion>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/questions/${questionId}`,
      this.toCurriculumQuestionBody(payload),
    ));
    return this.normalizeCurriculumQuestion(response);
  }

  async updateCurriculumQuestionForCategory(
    subjectId: string,
    nodeId: string,
    questionId: string,
    educationCategory: string | null | undefined,
    payload: TenantCurriculumQuestionPayload,
  ): Promise<TenantCurriculumQuestion> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.put<TenantCurriculumQuestion>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/questions/${questionId}`,
      this.toCurriculumQuestionBody(payload),
    ));
    return this.normalizeCurriculumQuestion(response);
  }

  async uploadCurriculumQuestionMedia(file: File): Promise<TenantCurriculumQuestionMediaUpload> {
    await this.authApi.ensureLoggedIn();
    const body = new FormData();
    body.append('file', file);
    return await firstValueFrom(this.http.post<TenantCurriculumQuestionMediaUpload>(
      `${this.subjectsBaseUrl()}/curriculum/questions/media`,
      body,
    ));
  }

  async deleteCurriculumQuestion(subjectId: string, nodeId: string, questionId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(`${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/questions/${questionId}`));
  }

  async createCurriculumQuestionAnswer(
    subjectId: string,
    nodeId: string,
    questionId: string,
    payload: TenantCurriculumQuestionAnswerPayload,
  ): Promise<TenantCurriculumQuestionAnswer> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumQuestionAnswer>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/questions/${questionId}/answers`,
      this.toCurriculumQuestionAnswerBody(payload),
    ));
    return this.normalizeCurriculumQuestionAnswer(response);
  }

  async createCurriculumQuestionAnswerForCategory(
    subjectId: string,
    nodeId: string,
    questionId: string,
    educationCategory: string | null | undefined,
    payload: TenantCurriculumQuestionAnswerPayload,
  ): Promise<TenantCurriculumQuestionAnswer> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumQuestionAnswer>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/questions/${questionId}/answers`,
      this.toCurriculumQuestionAnswerBody(payload),
    ));
    return this.normalizeCurriculumQuestionAnswer(response);
  }

  async createBasicEducationExamQuestionAnswer(
    stageId: string,
    gradeId: string,
    subjectId: string,
    questionId: string,
    payload: TenantCurriculumQuestionAnswerPayload,
  ): Promise<TenantCurriculumQuestionAnswer> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumQuestionAnswer>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}/curriculum/questions/${questionId}/answers`,
      this.toCurriculumQuestionAnswerBody(payload),
    ));
    return this.normalizeCurriculumQuestionAnswer(response);
  }

  async updateCurriculumQuestionAnswer(
    subjectId: string,
    nodeId: string,
    questionId: string,
    answerId: string,
    payload: Partial<TenantCurriculumQuestionAnswerPayload>,
  ): Promise<TenantCurriculumQuestionAnswer> {
    await this.authApi.ensureLoggedIn();
    const body: Record<string, string | number | boolean | null> = {};
    if (payload.answer !== undefined) {
      body['answer'] = payload.answer.trim();
      body['description'] = payload.description?.trim() || null;
      body['mediaUrl'] = payload.mediaUrl ?? null;
      body['mediaFileName'] = payload.mediaFileName ?? null;
      body['mediaOriginalName'] = payload.mediaOriginalName ?? null;
      body['mediaContentType'] = payload.mediaContentType ?? null;
      body['mediaSizeBytes'] = payload.mediaSizeBytes ?? null;
    }
    if (payload.correct !== undefined) {
      body['correct'] = payload.correct;
    }
    const response = await firstValueFrom(this.http.patch<TenantCurriculumQuestionAnswer>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/questions/${questionId}/answers/${answerId}`,
      body,
    ));
    return this.normalizeCurriculumQuestionAnswer(response);
  }

  async updateCurriculumQuestionAnswerForCategory(
    subjectId: string,
    nodeId: string,
    questionId: string,
    answerId: string,
    educationCategory: string | null | undefined,
    payload: Partial<TenantCurriculumQuestionAnswerPayload>,
  ): Promise<TenantCurriculumQuestionAnswer> {
    await this.authApi.ensureLoggedIn();
    const body: Record<string, string | number | boolean | null> = {};
    if (payload.answer !== undefined) {
      body['answer'] = payload.answer.trim();
      body['description'] = payload.description?.trim() || null;
      body['mediaUrl'] = payload.mediaUrl ?? null;
      body['mediaFileName'] = payload.mediaFileName ?? null;
      body['mediaOriginalName'] = payload.mediaOriginalName ?? null;
      body['mediaContentType'] = payload.mediaContentType ?? null;
      body['mediaSizeBytes'] = payload.mediaSizeBytes ?? null;
    }
    if (payload.correct !== undefined) {
      body['correct'] = payload.correct;
    }
    const response = await firstValueFrom(this.http.patch<TenantCurriculumQuestionAnswer>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/questions/${questionId}/answers/${answerId}`,
      body,
    ));
    return this.normalizeCurriculumQuestionAnswer(response);
  }

  async updateBasicEducationExamQuestionAnswer(
    stageId: string,
    gradeId: string,
    subjectId: string,
    questionId: string,
    answerId: string,
    payload: Partial<TenantCurriculumQuestionAnswerPayload>,
  ): Promise<TenantCurriculumQuestionAnswer> {
    await this.authApi.ensureLoggedIn();
    const body: Record<string, string | number | boolean | null> = {};
    if (payload.answer !== undefined) {
      body['answer'] = payload.answer.trim();
    }
    if (payload.correct !== undefined) {
      body['correct'] = payload.correct;
    }
    if (payload.description !== undefined) {
      body['description'] = payload.description?.trim() || null;
    }
    if (payload.mediaUrl !== undefined) {
      body['mediaUrl'] = payload.mediaUrl;
    }
    if (payload.mediaFileName !== undefined) {
      body['mediaFileName'] = payload.mediaFileName;
    }
    if (payload.mediaOriginalName !== undefined) {
      body['mediaOriginalName'] = payload.mediaOriginalName;
    }
    if (payload.mediaContentType !== undefined) {
      body['mediaContentType'] = payload.mediaContentType;
    }
    if (payload.mediaSizeBytes !== undefined) {
      body['mediaSizeBytes'] = payload.mediaSizeBytes;
    }
    const response = await firstValueFrom(this.http.patch<TenantCurriculumQuestionAnswer>(
      `${this.platformSettingsUrl}/exams/basic-education/${stageId}/grades/${gradeId}/subjects/${subjectId}/curriculum/questions/${questionId}/answers/${answerId}`,
      body,
    ));
    return this.normalizeCurriculumQuestionAnswer(response);
  }

  async listCurriculumMaterialFolders(subjectId: string, nodeId: string, educationCategory?: string | null): Promise<TenantCurriculumMaterialFolder[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantCurriculumMaterialFolder[]>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/material-folders`,
    ));
    return (response ?? []).map((folder) => this.normalizeCurriculumMaterialFolder(folder));
  }

  async getCurriculumMaterialFolder(subjectId: string, nodeId: string, folderId: string): Promise<TenantCurriculumMaterialFolder> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantCurriculumMaterialFolder>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}`,
    ));
    return this.normalizeCurriculumMaterialFolder(response);
  }

  async createCurriculumMaterialFolder(
    subjectId: string,
    nodeId: string,
    payload: TenantCurriculumMaterialFolderPayload,
    educationCategory?: string | null,
  ): Promise<TenantCurriculumMaterialFolder> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumMaterialFolder>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/material-folders`,
      this.toCurriculumMaterialFolderBody(payload),
    ));
    return this.normalizeCurriculumMaterialFolder(response);
  }

  async updateCurriculumMaterialFolder(
    subjectId: string,
    nodeId: string,
    folderId: string,
    payload: TenantCurriculumMaterialFolderPayload,
  ): Promise<TenantCurriculumMaterialFolder> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.put<TenantCurriculumMaterialFolder>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}`,
      this.toCurriculumMaterialFolderBody(payload),
    ));
    return this.normalizeCurriculumMaterialFolder(response);
  }

  async deleteCurriculumMaterialFolder(subjectId: string, nodeId: string, folderId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}`,
    ));
  }

  async listCurriculumSkills(subjectId: string, nodeId: string): Promise<TenantCurriculumSkill[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantCurriculumSkill[]>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/skills`,
    ));
    return (response ?? []).map((skill) => this.normalizeCurriculumSkill(skill));
  }

  async listCurriculumSkillsForCategory(subjectId: string, nodeId: string, educationCategory: string | null | undefined): Promise<TenantCurriculumSkill[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantCurriculumSkill[]>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/skills`,
    ));
    return (response ?? []).map((skill) => this.normalizeCurriculumSkill(skill));
  }

  async createCurriculumSkill(
    subjectId: string,
    nodeId: string,
    payload: TenantCurriculumSkillPayload,
  ): Promise<TenantCurriculumSkill> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumSkill>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/skills`,
      this.toCurriculumSkillBody(payload),
    ));
    return this.normalizeCurriculumSkill(response);
  }

  async createCurriculumSkillForCategory(
    subjectId: string,
    nodeId: string,
    educationCategory: string | null | undefined,
    payload: TenantCurriculumSkillPayload,
  ): Promise<TenantCurriculumSkill> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumSkill>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/skills`,
      this.toCurriculumSkillBody(payload),
    ));
    return this.normalizeCurriculumSkill(response);
  }

  async updateCurriculumSkill(
    subjectId: string,
    nodeId: string,
    skillId: string,
    payload: TenantCurriculumSkillPayload,
  ): Promise<TenantCurriculumSkill> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.put<TenantCurriculumSkill>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/skills/${skillId}`,
      this.toCurriculumSkillBody(payload),
    ));
    return this.normalizeCurriculumSkill(response);
  }

  async deleteCurriculumSkill(subjectId: string, nodeId: string, skillId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/skills/${skillId}`,
    ));
  }

  async listCurriculumMaterialFiles(subjectId: string, nodeId: string, folderId: string, educationCategory?: string | null): Promise<TenantCurriculumMaterialFile[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantCurriculumMaterialFile[]>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}/files`,
    ));
    return (response ?? []).map((file) => this.normalizeCurriculumMaterialFile(file));
  }

  async uploadCurriculumMaterialFile(subjectId: string, nodeId: string, folderId: string, file: File): Promise<TenantCurriculumMaterialFile> {
    await this.authApi.ensureLoggedIn();
    const body = new FormData();
    body.append('file', file);
    const response = await firstValueFrom(this.http.post<TenantCurriculumMaterialFile>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}/files`,
      body,
    ));
    return this.normalizeCurriculumMaterialFile(response);
  }

  async uploadCurriculumMaterialFileWithProgress(
    subjectId: string,
    nodeId: string,
    folderId: string,
    file: File,
    onProgress: (loaded: number, total: number) => void,
  ): Promise<TenantCurriculumMaterialFile> {
    await this.authApi.ensureLoggedIn();
    const body = new FormData();
    body.append('file', file);
    return firstValueFrom(this.http.post<TenantCurriculumMaterialFile>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}/files`,
      body,
      { observe: 'events', reportProgress: true },
    ).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          onProgress(event.loaded, event.total ?? file.size);
        }
      }),
      filter((event) => event.type === HttpEventType.Response),
      map((event) => this.normalizeCurriculumMaterialFile(event.body as TenantCurriculumMaterialFile)),
    ));
  }

  async deleteCurriculumMaterialFile(subjectId: string, nodeId: string, folderId: string, fileId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}/files/${fileId}`,
    ));
  }

  async listCurriculumMaterialNotes(subjectId: string, nodeId: string, folderId: string, educationCategory?: string | null): Promise<TenantCurriculumMaterialNote[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantCurriculumMaterialNote[]>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}/notes`,
    ));
    return (response ?? []).map((note) => this.normalizeCurriculumMaterialNote(note));
  }

  async createCurriculumMaterialNote(
    subjectId: string,
    nodeId: string,
    folderId: string,
    payload: TenantCurriculumMaterialNotePayload,
  ): Promise<TenantCurriculumMaterialNote> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumMaterialNote>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}/notes`,
      this.toCurriculumMaterialNoteBody(payload),
    ));
    return this.normalizeCurriculumMaterialNote(response);
  }

  async updateCurriculumMaterialNote(
    subjectId: string,
    nodeId: string,
    folderId: string,
    noteId: string,
    payload: TenantCurriculumMaterialNotePayload,
  ): Promise<TenantCurriculumMaterialNote> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.put<TenantCurriculumMaterialNote>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}/notes/${noteId}`,
      this.toCurriculumMaterialNoteBody(payload),
    ));
    return this.normalizeCurriculumMaterialNote(response);
  }

  async deleteCurriculumMaterialNote(subjectId: string, nodeId: string, folderId: string, noteId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}/notes/${noteId}`,
    ));
  }

  async listCurriculumMaterialLinks(subjectId: string, nodeId: string, folderId: string, educationCategory?: string | null): Promise<TenantCurriculumMaterialLink[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<TenantCurriculumMaterialLink[]>(
      `${this.subjectsBaseUrlForCategory(educationCategory)}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}/links`,
    ));
    return (response ?? []).map((link) => this.normalizeCurriculumMaterialLink(link));
  }

  async createCurriculumMaterialLink(
    subjectId: string,
    nodeId: string,
    folderId: string,
    payload: TenantCurriculumMaterialLinkPayload,
  ): Promise<TenantCurriculumMaterialLink> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.post<TenantCurriculumMaterialLink>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}/links`,
      this.toCurriculumMaterialLinkBody(payload),
    ));
    return this.normalizeCurriculumMaterialLink(response);
  }

  async deleteCurriculumMaterialLink(subjectId: string, nodeId: string, folderId: string, linkId: string): Promise<void> {
    await this.authApi.ensureLoggedIn();
    await firstValueFrom(this.http.delete<void>(
      `${this.subjectsBaseUrl()}/${subjectId}/curriculum/nodes/${nodeId}/material-folders/${folderId}/links/${linkId}`,
    ));
  }

  async listStageOptions(): Promise<TenantSubjectStageOption[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<EducationalStage[]>(this.stagesUrl));
    return (response ?? []).map((stage) => ({
      value: stage.id,
      label: stage.name,
    }));
  }

  async listGradeOptions(): Promise<TenantSubjectGradeOption[]> {
    await this.authApi.ensureLoggedIn();
    const response = await firstValueFrom(this.http.get<Grade[]>(this.gradesUrl));
    return (response ?? []).map((grade) => ({
      value: grade.id,
      label: grade.name,
      stageId: grade.stageId,
    }));
  }

  toUserMessage(error: unknown, fallbackMessage = 'Unable to load subjects. Please try again.'): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.extractApiMessage(error.error);
      if (message) {
        return message;
      }
      if (error.status === 403) {
        return 'You do not have permission to manage tenant subjects.';
      }
      if (error.status === 404) {
        return 'The selected subject, academic level, or grade could not be found.';
      }
    }
    return fallbackMessage;
  }

  private normalizeSubject(subject: TenantSubjectResponse): TenantSubject {
    return {
      ...subject,
      stageId: subject.stageId ?? '',
      stageName: subject.stageName ?? (subject as TenantSubjectResponse & { universityName?: string }).universityName ?? '',
      gradeId: subject.gradeId ?? '',
      gradeName: subject.gradeName ?? (subject as TenantSubjectResponse & { collegeName?: string }).collegeName ?? '',
      assignedGroupsCount: subject.assignedGroupsCount ?? (subject as TenantSubjectResponse & { groupCount?: number }).groupCount ?? 0,
      assignedTeachersCount: subject.assignedTeachersCount ?? subject.teachers?.length ?? 0,
      totalStudentsCount: subject.totalStudentsCount ?? (subject as TenantSubjectResponse & { studentCount?: number }).studentCount ?? 0,
      groups: subject.groups ?? [],
      teachers: subject.teachers ?? [],
    };
  }

  private subjectsBaseUrl(): string {
    return this.router.url.startsWith('/tenant/university-subjects') || this.router.url.startsWith('/tenant/questions-bank/university-education')
      ? this.universitySubjectsUrl
      : this.subjectsUrl;
  }

  private subjectsBaseUrlForCategory(educationCategory: string | null | undefined): string {
    return educationCategory === 'UNIVERSITY_EDUCATION' ? this.universitySubjectsUrl : this.subjectsBaseUrl();
  }

  private normalizeCurriculumNode(node: TenantSubjectCurriculumNode): TenantSubjectCurriculumNode {
    return {
      id: node.id,
      label: node.label,
      icon: node.icon || ((node.children ?? []).length ? 'folder' : 'description'),
      description: node.description ?? null,
      children: (node.children ?? []).map((child) => this.normalizeCurriculumNode(child)),
    };
  }

  private normalizeCurriculumQuestion(question: TenantCurriculumQuestion): TenantCurriculumQuestion {
    return {
      id: question.id,
      curriculumNodeId: question.curriculumNodeId ?? null,
      question: question.question,
      type: question.type,
      answer: question.answer ?? null,
      description: question.description ?? null,
      mediaUrl: question.mediaUrl ?? null,
      mediaFileName: question.mediaFileName ?? null,
      mediaOriginalName: question.mediaOriginalName ?? null,
      mediaContentType: question.mediaContentType ?? null,
      mediaSizeBytes: question.mediaSizeBytes ?? null,
      bloomId: question.bloomId ?? null,
      difficultyId: question.difficultyId ?? null,
      weight: question.weight ?? null,
      skillId: question.skillId ?? null,
      questionSource: question.questionSource ?? null,
      answerExplanation: question.answerExplanation ?? null,
      tags: question.tags ?? [],
      answers: (question.answers ?? []).map((answer) => this.normalizeCurriculumQuestionAnswer(answer)),
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  private normalizeQuestionBankOverview(overview: TenantQuestionBankOverview): TenantQuestionBankOverview {
    return {
      basicEducationQuestions: overview.basicEducationQuestions ?? 0,
      universityEducationQuestions: overview.universityEducationQuestions ?? 0,
      stagesCount: overview.stagesCount ?? 0,
      universitiesCount: overview.universitiesCount ?? 0,
      tags: (overview.tags ?? []).map((tag) => this.normalizeQuestionBankTag(tag)),
      taggedQuestions: (overview.taggedQuestions ?? []).map((question) => this.normalizeQuestionBankTaggedQuestion(question)),
    };
  }

  private normalizeQuestionBankTag(tag: TenantQuestionBankTagSummary): TenantQuestionBankTagSummary {
    return {
      name: tag.name,
      totalQuestions: tag.totalQuestions ?? 0,
    };
  }

  private normalizeQuestionBankTaggedQuestion(question: TenantQuestionBankTaggedQuestion): TenantQuestionBankTaggedQuestion {
    return {
      id: question.id,
      question: question.question,
      type: question.type,
      subjectId: question.subjectId,
      subjectName: question.subjectName,
      curriculumNodeId: question.curriculumNodeId,
      curriculumNodeName: question.curriculumNodeName,
      track: question.track,
      stageId: question.stageId ?? null,
      stageName: question.stageName ?? null,
      gradeId: question.gradeId ?? null,
      gradeName: question.gradeName ?? null,
      universityId: question.universityId ?? null,
      universityName: question.universityName ?? null,
      tags: question.tags ?? [],
      createdAt: question.createdAt,
    };
  }

  mediaUrlToAbsolute(url: string | null | undefined): string | null {
    if (!url) {
      return null;
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const apiOrigin = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
  }

  private toCurriculumQuestionBody(payload: TenantCurriculumQuestionPayload): Record<string, string | number | string[] | null> {
    const body: Record<string, string | number | string[] | null> = {
      question: payload.question.trim(),
      type: payload.type,
      answer: payload.answer?.trim() || null,
      description: payload.description?.trim() || null,
      mediaUrl: payload.mediaUrl,
      mediaFileName: payload.mediaFileName,
      mediaOriginalName: payload.mediaOriginalName,
      mediaContentType: payload.mediaContentType,
      mediaSizeBytes: payload.mediaSizeBytes,
      bloomId: payload.bloomId || null,
      difficultyId: payload.difficultyId || null,
      weight: payload.weight,
      skillId: payload.skillId || null,
      curriculumNodeId: payload.curriculumNodeId || null,
      questionSource: payload.questionSource?.trim() || null,
      answerExplanation: payload.answerExplanation?.trim() || null,
    };
    if (payload.tags !== undefined) {
      body['tags'] = payload.tags;
    }
    return body;
  }

  private toCurriculumQuestionAnswerBody(payload: TenantCurriculumQuestionAnswerPayload): Record<string, string | number | boolean | null> {
    return {
      answer: payload.answer.trim(),
      correct: payload.correct,
      description: payload.description?.trim() || null,
      mediaUrl: payload.mediaUrl ?? null,
      mediaFileName: payload.mediaFileName ?? null,
      mediaOriginalName: payload.mediaOriginalName ?? null,
      mediaContentType: payload.mediaContentType ?? null,
      mediaSizeBytes: payload.mediaSizeBytes ?? null,
    };
  }

  private toCurriculumMaterialFolderBody(payload: TenantCurriculumMaterialFolderPayload): Record<string, string | null> {
    return {
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
    };
  }

  private toCurriculumSkillBody(payload: TenantCurriculumSkillPayload): Record<string, string | null> {
    return {
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
    };
  }

  private toCurriculumMaterialNoteBody(payload: TenantCurriculumMaterialNotePayload): Record<string, string> {
    return {
      title: payload.title.trim(),
      contentJson: payload.contentJson,
    };
  }

  private toCurriculumMaterialLinkBody(payload: TenantCurriculumMaterialLinkPayload): Record<string, string> {
    return {
      title: payload.title.trim(),
      url: payload.url.trim(),
    };
  }

  private normalizeCurriculumMaterialFolder(folder: TenantCurriculumMaterialFolder): TenantCurriculumMaterialFolder {
    return {
      id: folder.id,
      name: folder.name,
      description: folder.description ?? null,
      fileTypes: folder.fileTypes ?? [],
      filesCount: folder.filesCount ?? 0,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  private normalizeCurriculumSkill(skill: TenantCurriculumSkill): TenantCurriculumSkill {
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description ?? null,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };
  }

  private normalizeCurriculumMaterialFile(file: TenantCurriculumMaterialFile): TenantCurriculumMaterialFile {
    return {
      id: file.id,
      url: this.mediaUrlToAbsolute(file.url) ?? file.url,
      fileName: file.fileName,
      originalName: file.originalName,
      contentType: file.contentType ?? null,
      sizeBytes: file.sizeBytes ?? null,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  private normalizeCurriculumMaterialNote(note: TenantCurriculumMaterialNote): TenantCurriculumMaterialNote {
    return {
      id: note.id,
      title: note.title,
      contentJson: note.contentJson,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }

  private normalizeCurriculumMaterialLink(link: TenantCurriculumMaterialLink): TenantCurriculumMaterialLink {
    return {
      id: link.id,
      title: link.title,
      url: link.url,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    };
  }

  private normalizeCurriculumQuestionAnswer(answer: TenantCurriculumQuestionAnswer): TenantCurriculumQuestionAnswer {
    return {
      id: answer.id,
      answer: answer.answer,
      correct: !!answer.correct,
      description: answer.description ?? null,
      mediaUrl: answer.mediaUrl ?? null,
      mediaFileName: answer.mediaFileName ?? null,
      mediaOriginalName: answer.mediaOriginalName ?? null,
      mediaContentType: answer.mediaContentType ?? null,
      mediaSizeBytes: answer.mediaSizeBytes ?? null,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
    };
  }

  private extractApiMessage(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
      return null;
    }
    const apiError = error as { message?: unknown; details?: unknown };
    if (Array.isArray(apiError.details)) {
      const first = apiError.details.find((detail): detail is string => typeof detail === 'string' && detail.trim().length > 0);
      if (first) {
        return first.trim();
      }
    }
    if (typeof apiError.message === 'string' && apiError.message.trim()) {
      return apiError.message.trim();
    }
    return null;
  }
}
