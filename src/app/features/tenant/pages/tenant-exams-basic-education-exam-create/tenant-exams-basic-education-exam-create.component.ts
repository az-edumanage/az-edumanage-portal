import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantCollegesDataService } from '../../data-access/tenant-colleges-data.service';
import { TenantEducationalStagesDataService } from '../../data-access/tenant-educational-stages-data.service';
import { TenantGradesDataService } from '../../data-access/tenant-grades-data.service';
import { TenantBasicEducationExam, TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantUniversitySubjectsDataService } from '../../data-access/tenant-university-subjects-data.service';
import { TenantCollege } from '../../models/tenant-colleges.models';
import { EducationalStage } from '../../models/tenant-educational-stages.models';
import { Grade } from '../../models/tenant-grades.models';
import { BloomLevel, QuestionDifficulty, TenantCurriculumQuestion, TenantCurriculumSkill, TenantSubject, TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';
import { TenantUniversitySubject } from '../../models/tenant-university-subjects.models';

type BasicEducationExamStatus = 'Draft' | 'Published' | 'Scheduled';
type ExamStatusFilter = BasicEducationExamStatus | 'All';
type BasicQuestionDrawerSource = 'basic' | 'bank';

interface BasicEducationGradeExam {
  id: string;
  title: string;
  instructions: string | null;
  subjectId: string | null;
  subjectName: string | null;
  date: string;
  status: BasicEducationExamStatus;
  shuffleQuestions: boolean;
  showResultsImmediately: boolean;
  allowRetakes: boolean;
  questionCount: number;
  submissionCount: number;
}

interface ExamQuestionRow {
  id: string;
  nodeId: string | null;
  question: string;
  type: string;
  curriculumItem: string;
  answerCount: number;
  weight: number | null;
  answer: string | null;
  description: string | null;
  bloomId: string | null;
  difficultyId: string | null;
  skillId: string | null;
  questionSource: string | null;
  answerExplanation: string | null;
  tags: string[];
  answers: TenantCurriculumQuestion['answers'];
}

interface BasicQuestionLoadResult {
  question: TenantCurriculumQuestion;
  nodeId: string;
}

function scopeText(gradeName: string, subjectName: string): string {
  return subjectName === 'All subjects' || subjectName === 'Subject'
    ? gradeName
    : `${gradeName}, ${subjectName}`;
}

@Component({
  selector: 'app-tenant-exams-basic-education-exam-create',
  imports: [RouterModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <nav class="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <a routerLink="/tenant/exams" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">Exams</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a [routerLink]="educationTrackRoute()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ educationTrackLabel() }}</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        <a [routerLink]="parentContextRoute()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ parentContextLabel() }}</a>
        <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        @if (!isUniversityEducationContext()) {
          <a [routerLink]="gradeContextRoute()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ scopeName() }}</a>
          <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
          <span class="font-medium text-slate-600 dark:text-slate-300">{{ selectedSubjectLabel() }}</span>
          <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
        }
        @if (isCreateMode()) {
          <a [routerLink]="listRoute()" [queryParams]="routeQueryParams()" class="font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300">{{ scopeTypeLabel() }} Exams</a>
          <mat-icon class="text-base text-slate-400">chevron_right</mat-icon>
          <span class="font-semibold text-slate-900 dark:text-slate-100">Create Exam</span>
        } @else {
          <span class="font-semibold text-slate-900 dark:text-slate-100">{{ scopeTypeLabel() }} Exams</span>
        }
      </nav>

      <section class="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ isCreateMode() ? 'Create Exam' : scopeName() + ' Exams' }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ sectionDescription() }}</p>
          </div>
          @if (hasExamScope()) {
            <div class="flex flex-wrap gap-2">
              @for (item of examMetadata(); track item.label) {
                <div class="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <mat-icon class="text-base">{{ item.icon }}</mat-icon>
                  <span class="text-xs font-bold uppercase tracking-wide text-indigo-500 dark:text-indigo-300/80">{{ item.label }}</span>
                  <span>{{ item.value }}</span>
                </div>
              }
            </div>
          }
        </div>

        @if (loadError()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-rose-500">error</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Unable to load exam context</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ loadError() }}</p>
          </div>
        } @else if (loading()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">hourglass_empty</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Loading exam context</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Please wait while the exam scope loads.</p>
          </div>
        } @else if (!hasExamScope()) {
          <div class="px-5 py-12 text-center">
            <mat-icon class="text-3xl text-slate-400">search_off</mat-icon>
            <h3 class="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">{{ scopeTypeLabel() }} not found</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">The selected {{ scopeTypeLower() }} is not available for this education track.</p>
          </div>
        } @else if (isCreateMode()) {
          <form [formGroup]="examForm" class="grid grid-cols-1 gap-6 p-5 lg:grid-cols-3" (ngSubmit)="onSubmit()">
            <div class="space-y-5 lg:col-span-2">
              <div class="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
                  <h3 class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <mat-icon class="text-base">add_task</mat-icon>
                    {{ editingExamId() ? 'Edit Exam' : 'Create Exam' }}
                  </h3>
                  <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  @if (!isUniversityEducationContext()) {
                    <label class="md:col-span-2">
                      <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Subject</span>
                      <select
                        formControlName="subjectId"
                        class="h-[46px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:border-indigo-100 disabled:bg-indigo-50 disabled:text-indigo-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/20 dark:disabled:border-indigo-500/20 dark:disabled:bg-indigo-500/10 dark:disabled:text-indigo-100"
                        (change)="setSelectedSubjectId($any($event.target).value)"
                      >
                        <option value="">Select subject</option>
                        @for (subject of subjects(); track subject.id) {
                          <option [value]="subject.id">{{ subject.name }}</option>
                        }
                      </select>
                      @if (!selectedSubject()) {
                        <span class="mt-1 block text-xs font-semibold text-rose-600 dark:text-rose-300">Choose a subject so this exam is linked correctly.</span>
                      }
                    </label>
                  }
                  <label class="md:col-span-2">
                    <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Exam Title</span>
                    <input formControlName="title" type="text" placeholder="e.g. First Term Science Exam" class="h-[46px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/20">
                  </label>
                  <label class="md:col-span-2">
                    <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Instructions</span>
                    <textarea formControlName="instructions" rows="4" placeholder="Enter instructions for students..." class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/20"></textarea>
                  </label>
                </div>
              </div>

              <div class="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                <div class="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 class="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                      <mat-icon class="text-lg text-indigo-600 dark:text-indigo-300">quiz</mat-icon>
                      Questions
                    </h3>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ examQuestionsDescription() }}</p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/30"
                    [attr.aria-expanded]="questionOptionsOpen()"
                    aria-controls="question-options-modal"
                    (click)="toggleQuestionOptions()"
                  >
                    <mat-icon class="text-base">add</mat-icon>
                    Add Questions
                  </button>
                </div>

                @if (examQuestionsLoading()) {
                  <div class="px-5 py-8 text-center">
                    <mat-icon class="text-3xl text-slate-400">hourglass_empty</mat-icon>
                    <h4 class="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Loading questions</h4>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ basicQuestionLoadingDescription() }}</p>
                  </div>
                } @else if (examQuestionsError()) {
                  <div class="px-5 py-8 text-center">
                    <mat-icon class="text-3xl text-rose-500">error</mat-icon>
                    <h4 class="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Unable to load questions</h4>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ examQuestionsError() }}</p>
                  </div>
                } @else if (examQuestionRows().length === 0) {
                  <div class="px-5 py-8 text-center">
                    <mat-icon class="text-4xl text-slate-400">post_add</mat-icon>
                    <h4 class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">Questions will be added after exam setup</h4>
                    <p class="mx-auto mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">Create the exam shell first, then attach questions from the question bank or manual entry flow.</p>
                  </div>
                } @else {
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                      <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                        <tr>
                          <th class="px-5 py-3">Question</th>
                          <th class="px-5 py-3">Type</th>
                          <th class="px-5 py-3">Curriculum</th>
                          <th class="px-5 py-3">Answers</th>
                          <th class="px-5 py-3">Weight</th>
                          <th class="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        @for (question of examQuestionRows(); track question.id) {
                          <tr
                            class="cursor-pointer transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-200 focus-within:bg-slate-50 dark:hover:bg-slate-800/60 dark:focus:bg-slate-800/60 dark:focus:ring-indigo-500/30 dark:focus-within:bg-slate-800/60"
                            [class.bg-indigo-50]="selectedExamQuestionId() === question.id"
                            [class.ring-2]="selectedExamQuestionId() === question.id"
                            [class.ring-inset]="selectedExamQuestionId() === question.id"
                            [class.ring-indigo-200]="selectedExamQuestionId() === question.id"
                            tabindex="0"
                            role="button"
                            [attr.aria-pressed]="selectedExamQuestionId() === question.id"
                            (click)="selectExamQuestion(question)"
                            (keydown.enter)="selectExamQuestion(question)"
                            (keydown.space)="selectExamQuestion(question); $event.preventDefault()"
                          >
                            <td class="max-w-md px-5 py-4">
                              <p class="line-clamp-2 font-semibold text-slate-900 dark:text-slate-100">{{ question.question }}</p>
                            </td>
                            <td class="px-5 py-4">
                              <span class="inline-flex rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{{ questionTypeLabel(question.type) }}</span>
                            </td>
                            <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ question.curriculumItem }}</td>
                            <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ question.answerCount }}</td>
                            <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ question.weight ?? '-' }}</td>
                            <td class="px-5 py-4">
                              <div class="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
                                  aria-label="Edit question"
                                  (click)="editExamQuestion(question, $event)"
                                >
                                  <mat-icon class="text-base">edit</mat-icon>
                                </button>
                                <button
                                  type="button"
                                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-100 text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                  aria-label="Delete question"
                                  [disabled]="deletingQuestionId() === question.id"
                                  (click)="openDeleteExamQuestionModal(question, $event)"
                                >
                                  <mat-icon class="text-base">{{ deletingQuestionId() === question.id ? 'hourglass_empty' : 'delete' }}</mat-icon>
                                </button>
                              </div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>

            <aside class="space-y-5">
              <div class="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
                <h3 class="text-sm font-bold text-slate-600 dark:text-slate-300">Exam Scope</h3>
                <dl class="mt-4 space-y-3 text-sm">
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">{{ parentScopeTypeLabel() }}</dt>
                    <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ parentContextLabel() }}</dd>
                  </div>
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">{{ scopeTypeLabel() }}</dt>
                    <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ scopeName() }}</dd>
                  </div>
                  @if (!isUniversityEducationContext()) {
                    <div>
                      <dt class="text-slate-500 dark:text-slate-400">Subject</dt>
                      <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ selectedSubjectLabel() }}</dd>
                    </div>
                  }
                  <div>
                    <dt class="text-slate-500 dark:text-slate-400">{{ isUniversityEducationContext() ? 'Subjects' : 'Students' }}</dt>
                    <dd class="font-semibold text-slate-900 dark:text-slate-100">{{ isUniversityEducationContext() ? universitySubjects().length : selectedGrade()?.studentCount }}</dd>
                  </div>
                </dl>
              </div>

              <div class="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
                <h3 class="text-sm font-bold text-slate-600 dark:text-slate-300">Settings</h3>
                <div class="mt-4 space-y-3">
                  <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" formControlName="shuffleQuestions" class="rounded border-slate-300 text-indigo-600">
                    <span>Shuffle questions</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" formControlName="showResultsImmediately" class="rounded border-slate-300 text-indigo-600">
                    <span>Show results immediately</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" formControlName="allowRetakes" class="rounded border-slate-300 text-indigo-600">
                    <span>Allow retakes</span>
                  </label>
                </div>
              </div>

              @if (submitMessage()) {
                <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {{ submitMessage() }}
                </div>
              }

              <div class="flex flex-col gap-3">
                <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" [disabled]="savingExam() || examForm.invalid || (!isUniversityEducationContext() && !selectedSubject())">
                  <mat-icon class="text-base">assignment</mat-icon>
                    {{ savingExam() ? 'Saving Exam' : editingExamId() ? 'Save Exam' : 'Create Exam' }}
                </button>
                <a [routerLink]="listRoute()" [queryParams]="routeQueryParams()" class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancel
                </a>
              </div>
            </aside>

            @if (deleteQuestionModal(); as question) {
              <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" (click)="closeDeleteExamQuestionModal()">
                <section
                  id="delete-question-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="delete-question-modal-title"
                  class="w-full max-w-lg rounded-xl border border-slate-200 bg-white text-left shadow-xl dark:border-slate-800 dark:bg-slate-900"
                  (click)="$event.stopPropagation()"
                >
                  <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                      <h3 id="delete-question-modal-title" class="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
                        <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                          <mat-icon class="text-base">delete</mat-icon>
                        </span>
                        Delete question
                      </h3>
                      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Delete this question from the exam draft?</p>
                    </div>
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-indigo-500/30"
                      aria-label="Close delete question"
                      [disabled]="deletingQuestionId() === question.id"
                      (click)="closeDeleteExamQuestionModal()"
                    >
                      <mat-icon class="text-base">close</mat-icon>
                    </button>
                  </div>

                  <div class="px-5 py-4">
                    <p class="line-clamp-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">{{ question.question }}</p>
                    <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">Only this selected question will be removed. Existing questions stay in the Questions section.</p>
                    @if (examQuestionsError()) {
                      <div class="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                        {{ examQuestionsError() }}
                      </div>
                    }
                  </div>

                  <div class="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end dark:border-slate-800">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-indigo-500/30"
                      [disabled]="deletingQuestionId() === question.id"
                      (click)="closeDeleteExamQuestionModal()"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                      [disabled]="deletingQuestionId() === question.id"
                      (click)="confirmDeleteExamQuestion()"
                    >
                      <mat-icon class="text-base">delete</mat-icon>
                      @if (deletingQuestionId() === question.id) {
                        Deleting...
                      } @else {
                        Delete question
                      }
                    </button>
                  </div>
                </section>
              </div>
            }

            @if (questionOptionsOpen()) {
              <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" (click)="closeQuestionOptions()">
                <section
                  id="question-options-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="question-options-title"
                  class="w-full max-w-3xl rounded-xl border border-slate-200 bg-white text-left shadow-xl dark:border-slate-800 dark:bg-slate-900"
                  (click)="$event.stopPropagation()"
                >
                  <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                      <h3 id="question-options-title" class="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
                        <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                          <mat-icon class="text-base">post_add</mat-icon>
                        </span>
                        Add questions
                      </h3>
                      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose how questions should be attached to this exam.</p>
                    </div>
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-indigo-500/30"
                      aria-label="Close add questions"
                      (click)="closeQuestionOptions()"
                    >
                      <mat-icon class="text-base">close</mat-icon>
                    </button>
                  </div>

                  <div class="p-5">
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      @for (option of questionOptions; track option.label) {
                        <button
                          type="button"
                          class="flex min-h-32 flex-col items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:focus:ring-indigo-500/30"
                          (click)="selectQuestionOption(option.kind)"
                        >
                          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <mat-icon class="text-lg">{{ option.icon }}</mat-icon>
                          </span>
                          <span class="min-w-0">
                            <span class="block text-sm font-bold text-slate-900 dark:text-slate-100">{{ option.label }}</span>
                            <span class="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{{ option.description }}</span>
                          </span>
                        </button>
                      }
                    </div>

                    @if (questionContextLoading()) {
                      <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Loading question setup...
                      </div>
                    }
                    @if (questionContextError()) {
                      <div class="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                        {{ questionContextError() }}
                      </div>
                    }
                  </div>
                </section>
              </div>
            }

            @if (basicQuestionsDrawerOpen()) {
              <div class="fixed inset-0 z-50 flex justify-end bg-slate-950/55" role="presentation" (click)="closeBasicQuestionsDrawer()">
                <aside
                  id="basic-questions-drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="basic-questions-drawer-title"
                  class="flex h-full w-full max-w-6xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
                  (click)="$event.stopPropagation()"
                >
                  <div class="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
                    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white">
                            <mat-icon class="text-sm">playlist_add_check</mat-icon>
                            {{ basicQuestionSelection().length }} selected
                          </span>
                          <span class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                            <mat-icon class="text-sm text-indigo-500 dark:text-indigo-300">menu_book</mat-icon>
                            {{ selectedSubjectLabel() }}
                          </span>
                        </div>
                        <h3 id="basic-questions-drawer-title" class="mt-4 text-xl font-bold text-slate-950 dark:text-white">{{ basicQuestionDrawerTitle() }}</h3>
                        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ basicQuestionDrawerDescription() }}</p>
                      </div>
                      <button
                        type="button"
                        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Close questions drawer"
                        (click)="closeBasicQuestionsDrawer()"
                      >
                        <mat-icon class="text-base">close</mat-icon>
                      </button>
                    </div>

                    <div class="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <label class="relative block">
                        <span class="sr-only">Search questions</span>
                        <mat-icon class="pointer-events-none absolute left-3 top-1/2 text-lg text-slate-400 -translate-y-1/2 dark:text-slate-500">search</mat-icon>
                        <input
                          type="search"
                          class="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-indigo-500/60 dark:focus:ring-indigo-500/20"
                          placeholder="Search questions, curriculum, tags..."
                          [value]="basicQuestionSearchTerm()"
                          (input)="updateBasicQuestionSearch($event)"
                        />
                      </label>
                      <div class="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                        <mat-icon class="text-lg text-indigo-600 dark:text-indigo-300">filter_list</mat-icon>
                        <span>Filter</span>
                        <select
                          class="h-9 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500/60 dark:focus:ring-indigo-500/20"
                          aria-label="Filter questions by type"
                          [value]="basicQuestionTypeFilter()"
                          (change)="updateBasicQuestionTypeFilter($event)"
                        >
                          <option value="All">All types</option>
                          @for (type of basicQuestionTypes(); track type) {
                            <option [value]="type">{{ questionTypeLabel(type) }}</option>
                          }
                        </select>
                      </div>
                    </div>
                  </div>

                  <div class="flex-1 overflow-y-auto px-6 py-5">
                    @if (basicQuestionsLoading()) {
                      <div class="rounded-lg border border-slate-200 px-5 py-10 text-center dark:border-slate-800">
                        <mat-icon class="text-3xl text-slate-400">hourglass_empty</mat-icon>
                        <h4 class="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{{ basicQuestionLoadingTitle() }}</h4>
                        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ basicQuestionLoadingDescription() }}</p>
                      </div>
                    } @else if (basicQuestionsError()) {
                      <div class="rounded-lg border border-rose-100 bg-rose-50 px-5 py-10 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
                        <mat-icon class="text-3xl text-rose-500">error</mat-icon>
                        <h4 class="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{{ basicQuestionErrorTitle() }}</h4>
                        <p class="mt-1 text-sm text-rose-700 dark:text-rose-200">{{ basicQuestionsError() }}</p>
                      </div>
                    } @else if (filteredBasicQuestionRows().length === 0) {
                      <div class="rounded-lg border border-slate-200 px-5 py-10 text-center dark:border-slate-800">
                        <mat-icon class="text-4xl text-slate-400">manage_search</mat-icon>
                        <h4 class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{{ basicQuestionEmptyTitle() }}</h4>
                        <p class="mx-auto mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">Adjust the search text or type filter to choose questions.</p>
                      </div>
                    } @else {
                      <div class="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                        <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                            <tr>
                              <th class="w-12 px-5 py-3">
                                <span class="sr-only">Select</span>
                              </th>
                              <th class="px-5 py-3">Question</th>
                              <th class="px-5 py-3">Type</th>
                              <th class="px-5 py-3">Curriculum</th>
                              <th class="px-5 py-3">Answers</th>
                              <th class="px-5 py-3">Weight</th>
                              <th class="px-5 py-3">Difficulty</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            @for (question of filteredBasicQuestionRows(); track question.id) {
                              <tr
                                class="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-900/70"
                                [class.bg-indigo-50]="isBasicQuestionSelected(question.id)"
                                (click)="toggleBasicQuestionSelection(question.id)"
                              >
                                <td class="px-5 py-4">
                                  <input
                                    type="checkbox"
                                    class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    [checked]="isBasicQuestionSelected(question.id)"
                                    [attr.aria-label]="'Select ' + question.question"
                                    (click)="toggleBasicQuestionSelection(question.id); $event.stopPropagation()"
                                  />
                                </td>
                                <td class="max-w-xl px-5 py-4">
                                  <p class="line-clamp-2 font-semibold text-slate-900 dark:text-slate-100">{{ question.question }}</p>
                                  @if (question.tags.length > 0) {
                                    <div class="mt-2 flex flex-wrap gap-1.5">
                                      @for (tag of question.tags; track tag) {
                                        <span class="inline-flex rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{{ tag }}</span>
                                      }
                                    </div>
                                  }
                                </td>
                                <td class="px-5 py-4">
                                  <span class="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{{ questionTypeLabel(question.type) }}</span>
                                </td>
                                <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ question.curriculumItem }}</td>
                                <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ question.answerCount }}</td>
                                <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ question.weight ?? '-' }}</td>
                                <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ difficultyDisplayName(question.difficultyId) }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  </div>

                  <div class="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <p class="text-sm font-medium text-slate-600 dark:text-slate-300">{{ basicQuestionSelection().length }} selected from {{ basicQuestionRows().length }} questions.</p>
                    <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        (click)="closeBasicQuestionsDrawer()"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-indigo-500/30"
                        [disabled]="basicQuestionSelection().length === 0 || savingExam()"
                        (click)="addSelectedBasicQuestions()"
                      >
                        <mat-icon class="text-base">playlist_add_check</mat-icon>
                        {{ savingExam() ? 'Saving selected' : 'Add selected' }}
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            }

            @if (selectedExamQuestionRow(); as selectedQuestion) {
              <div class="fixed inset-0 z-50 flex justify-end bg-slate-950/55" role="presentation" (click)="closeQuestionDrawer()">
                <aside
                  id="question-details-drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="question-details-drawer-title"
                  class="flex h-full w-full max-w-4xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
                  (click)="$event.stopPropagation()"
                >
                  <div class="border-b border-slate-200 bg-slate-50/80 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/70">
                    <div class="flex items-start justify-between gap-4">
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm shadow-indigo-500/20">
                            <mat-icon class="text-sm">quiz</mat-icon>
                            {{ questionTypeLabel(selectedQuestion.type) }}
                          </span>
                          <span class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                            <mat-icon class="text-sm text-indigo-500 dark:text-indigo-300">account_tree</mat-icon>
                            {{ selectedQuestion.curriculumItem }}
                          </span>
                          @if (selectedQuestion.weight !== null) {
                            <span class="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                              <mat-icon class="text-sm">monitor_weight</mat-icon>
                              {{ selectedQuestion.weight }} weight
                            </span>
                          }
                        </div>
                        <h3 id="question-details-drawer-title" class="mt-4 text-xl font-bold text-slate-950 dark:text-white">Question details</h3>
                        <div class="mt-4 rounded-lg border border-indigo-200 bg-white p-4 shadow-sm dark:border-indigo-500/30 dark:bg-slate-950">
                          <p class="text-sm font-semibold leading-6 text-slate-900 dark:text-slate-100">{{ selectedQuestion.question }}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Close question details"
                        (click)="closeQuestionDrawer()"
                      >
                        <mat-icon class="text-base">close</mat-icon>
                      </button>
                    </div>
                  </div>

                  <div class="flex-1 overflow-y-auto bg-white px-6 py-5 dark:bg-slate-950">
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      @for (metric of selectedQuestionMetrics(); track metric.label) {
                        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-950 dark:text-indigo-300">
                            <mat-icon class="text-lg">{{ metric.icon }}</mat-icon>
                          </div>
                          <p class="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ metric.label }}</p>
                          <p class="mt-1 truncate text-base font-bold text-slate-950 dark:text-white" [title]="metric.value">{{ metric.value }}</p>
                        </div>
                      }
                    </div>

                    <section class="mt-5 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div class="flex items-center justify-between gap-3">
                        <h4 class="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <mat-icon class="text-base">fact_check</mat-icon>
                          </span>
                          Answer overview
                        </h4>
                        <span class="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{{ selectedQuestion.answerCount }} answers</span>
                      </div>
                      @if (selectedQuestion.answer) {
                        <div class="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                          <p class="text-sm leading-6 text-slate-700 dark:text-slate-200">{{ selectedQuestion.answer }}</p>
                        </div>
                      } @else if (selectedQuestion.answers.length > 0) {
                        <div class="mt-4 space-y-2">
                          @for (answer of selectedQuestion.answers; track answer.id) {
                            <div class="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
                              <span class="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">{{ answer.answer || 'Media answer' }}</span>
                              @if (answer.correct) {
                                <span class="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                                  <mat-icon class="text-sm">check_circle</mat-icon>
                                  Correct
                                </span>
                              }
                            </div>
                          }
                        </div>
                      } @else {
                        <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">No answers have been added yet.</p>
                      }
                    </section>

                    <section class="mt-5 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
                      <h4 class="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500">
                          <mat-icon class="text-base">analytics</mat-icon>
                        </span>
                        Analytical Data
                      </h4>
                      <dl class="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div class="rounded-lg border border-indigo-100 bg-white p-3 dark:border-indigo-500/20 dark:bg-slate-900">
                          <dt class="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Topic</dt>
                          <dd class="mt-1 font-semibold text-slate-900 dark:text-slate-100">{{ selectedQuestion.curriculumItem }}</dd>
                        </div>
                        <div class="rounded-lg border border-indigo-100 bg-white p-3 dark:border-indigo-500/20 dark:bg-slate-900">
                          <dt class="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Bloom's Taxonomy</dt>
                          <dd class="mt-1 font-semibold text-slate-900 dark:text-slate-100">{{ bloomDisplayName(selectedQuestion.bloomId) }}</dd>
                        </div>
                        <div class="rounded-lg border border-indigo-100 bg-white p-3 dark:border-indigo-500/20 dark:bg-slate-900">
                          <dt class="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Skill</dt>
                          <dd class="mt-1 font-semibold text-slate-900 dark:text-slate-100">{{ skillDisplayName(selectedQuestion.skillId) }}</dd>
                        </div>
                        <div class="rounded-lg border border-indigo-100 bg-white p-3 dark:border-indigo-500/20 dark:bg-slate-900">
                          <dt class="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Difficulty</dt>
                          <dd class="mt-1 font-semibold text-slate-900 dark:text-slate-100">{{ difficultyDisplayName(selectedQuestion.difficultyId) }}</dd>
                        </div>
                        <div class="rounded-lg border border-indigo-100 bg-white p-3 dark:border-indigo-500/20 dark:bg-slate-900">
                          <dt class="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">The Weight</dt>
                          <dd class="mt-1 font-semibold text-slate-900 dark:text-slate-100">{{ selectedQuestion.weight ?? '-' }}</dd>
                        </div>
                      </dl>
                    </section>

                    <section class="mt-5 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                      <h4 class="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                          <mat-icon class="text-base">sell</mat-icon>
                        </span>
                        Application Data
                      </h4>
                      <dl class="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                          <dt class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Question Source</dt>
                          <dd class="mt-1 font-semibold text-slate-900 dark:text-slate-100">{{ selectedQuestion.questionSource || '-' }}</dd>
                        </div>
                        <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                          <dt class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</dt>
                          <dd class="mt-1 font-semibold leading-6 text-slate-900 dark:text-slate-100">{{ selectedQuestion.description || '-' }}</dd>
                        </div>
                        <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-900 sm:col-span-2">
                          <dt class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Answer Explanation</dt>
                          <dd class="mt-1 font-semibold leading-6 text-slate-900 dark:text-slate-100">{{ selectedQuestion.answerExplanation || '-' }}</dd>
                        </div>
                      </dl>
                      @if (selectedQuestion.tags.length > 0) {
                        <div class="mt-4">
                          <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tags</p>
                          <div class="mt-2 flex flex-wrap gap-2">
                            @for (tag of selectedQuestion.tags; track tag) {
                              <span class="inline-flex rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{{ tag }}</span>
                            }
                          </div>
                        </div>
                      }
                    </section>
                  </div>

                  <div class="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      (click)="closeQuestionDrawer()"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/30"
                      (click)="editExamQuestion(selectedQuestion, $event)"
                    >
                      <mat-icon class="text-base">edit</mat-icon>
                      Edit Question
                    </button>
                  </div>
                </aside>
              </div>
            }
          </form>
        } @else {
          <div class="space-y-6 p-5">
            <section class="rounded-lg border border-slate-200 dark:border-slate-800" aria-labelledby="grade-exams-heading">
              <div class="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 id="grade-exams-heading" class="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                    <mat-icon class="text-lg text-indigo-600 dark:text-indigo-300">assignment</mat-icon>
                    Exams List
                  </h3>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ examsListDescription() }}</p>
                </div>
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div class="grid grid-cols-3 gap-2 text-center text-sm">
                    <div class="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800">
                      <p class="font-bold text-slate-900 dark:text-slate-100">{{ exams().length }}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">Total</p>
                    </div>
                    <div class="rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-500/10">
                      <p class="font-bold text-emerald-700 dark:text-emerald-300">{{ publishedExamCount() }}</p>
                      <p class="text-xs text-emerald-700/80 dark:text-emerald-300/80">Published</p>
                    </div>
                    <div class="rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-500/10">
                      <p class="font-bold text-amber-700 dark:text-amber-300">{{ draftExamCount() }}</p>
                      <p class="text-xs text-amber-700/80 dark:text-amber-300/80">Drafts</p>
                    </div>
                  </div>
                  <a [routerLink]="createRoute()" [queryParams]="routeQueryParams()" (click)="resetQuestionDraftForNewExam()" class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/30">
                    <mat-icon class="text-base">add</mat-icon>
                    Create Exam
                  </a>
                </div>
              </div>

              @if (exams().length === 0) {
                <div class="px-5 py-10 text-center">
                  <mat-icon class="text-4xl text-slate-300 dark:text-slate-600">assignment_late</mat-icon>
                  <h4 class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">No exams created yet</h4>
                  <p class="mx-auto mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">Use Create Exam to prepare the first exam for this grade.</p>
                </div>
              } @else {
                <div class="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <label class="relative block">
                    <span class="sr-only">Search exams</span>
                    <mat-icon class="pointer-events-none absolute left-3 top-1/2 text-lg text-slate-400 -translate-y-1/2 dark:text-slate-500">search</mat-icon>
                    <input
                      type="search"
                      class="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-indigo-500/60 dark:focus:ring-indigo-500/20"
                      placeholder="Search exams by title or subject..."
                      [value]="examSearchTerm()"
                      (input)="updateExamSearch($event)"
                    />
                  </label>

                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <div class="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                      <mat-icon class="text-lg text-indigo-600 dark:text-indigo-300">filter_list</mat-icon>
                      <span>Advanced Filters</span>
                      <select
                        class="h-9 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500/60 dark:focus:ring-indigo-500/20"
                        aria-label="Filter exams by status"
                        [value]="examStatusFilter()"
                        (change)="updateExamStatusFilter($event)"
                      >
                        <option value="All">All statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                        <option value="Scheduled">Scheduled</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      class="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white dark:focus:ring-indigo-500/20"
                      [disabled]="!hasExamFilters()"
                      (click)="clearExamFilters()"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                @if (filteredExams().length === 0) {
                  <div class="px-5 py-10 text-center">
                    <mat-icon class="text-4xl text-slate-300 dark:text-slate-600">manage_search</mat-icon>
                    <h4 class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">No exams match the filters</h4>
                    <p class="mx-auto mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">Adjust the search text or status filter to view saved exams.</p>
                  </div>
                } @else {
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                      <tr>
                        <th class="px-5 py-3">Exam</th>
                        <th class="px-5 py-3">Subject</th>
                        <th class="px-5 py-3">Date</th>
                        <th class="px-5 py-3">Questions</th>
                        <th class="px-5 py-3">Submissions</th>
                        <th class="px-5 py-3">Status</th>
                        <th class="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                      @for (exam of filteredExams(); track exam.id) {
                        <tr
                          class="cursor-pointer transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-200 dark:hover:bg-slate-800/60 dark:focus:bg-slate-800/60 dark:focus:ring-indigo-500/30"
                          tabindex="0"
                          role="button"
                          [attr.aria-label]="'Open questions for ' + exam.title"
                          (click)="openExamQuestionsDrawer(exam)"
                          (keydown.enter)="openExamQuestionsDrawer(exam)"
                          (keydown.space)="openExamQuestionsDrawer(exam); $event.preventDefault()"
                        >
                          <td class="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">{{ exam.title }}</td>
                          <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ exam.subjectName || selectedSubjectLabel() }}</td>
                          <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ exam.date }}</td>
                          <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ exam.questionCount }}</td>
                          <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ exam.submissionCount }}</td>
                          <td class="px-5 py-4">
                            <span class="inline-flex rounded-md px-2 py-1 text-xs font-bold" [class]="statusClass(exam.status)">{{ exam.status }}</span>
                          </td>
                          <td class="px-5 py-4">
                            <div class="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
                                [attr.aria-label]="'Edit ' + exam.title"
                                (click)="editExam(exam, $event)"
                              >
                                <mat-icon class="text-base">edit</mat-icon>
                              </button>
                              <button
                                type="button"
                                class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
                                [attr.aria-label]="'Delete ' + exam.title"
                                [disabled]="deletingExamId() === exam.id"
                                (click)="openDeleteExamModal(exam, $event)"
                              >
                                <mat-icon class="text-base">{{ deletingExamId() === exam.id ? 'hourglass_empty' : 'delete' }}</mat-icon>
                              </button>
                              <button
                                type="button"
                                class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
                                [attr.aria-label]="exam.status === 'Published' ? 'Set draft ' + exam.title : 'Publish ' + exam.title"
                                [disabled]="updatingExamStatusId() === exam.id"
                                (click)="toggleExamStatus(exam, $event)"
                              >
                                <mat-icon class="text-base">{{ updatingExamStatusId() === exam.id ? 'hourglass_empty' : exam.status === 'Published' ? 'unpublished' : 'publish' }}</mat-icon>
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                }
              }
            </section>

            @if (deleteExamModal(); as exam) {
              <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" (click)="closeDeleteExamModal()">
                <section
                  id="delete-exam-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="delete-exam-modal-title"
                  class="w-full max-w-lg rounded-xl border border-slate-200 bg-white text-left shadow-xl dark:border-slate-800 dark:bg-slate-900"
                  (click)="$event.stopPropagation()"
                >
                  <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                      <h3 id="delete-exam-modal-title" class="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white">
                        <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                          <mat-icon class="text-base">delete</mat-icon>
                        </span>
                        Delete exam
                      </h3>
                      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Delete this saved exam?</p>
                    </div>
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-indigo-500/30"
                      aria-label="Close delete exam"
                      [disabled]="deletingExamId() === exam.id"
                      (click)="closeDeleteExamModal()"
                    >
                      <mat-icon class="text-base">close</mat-icon>
                    </button>
                  </div>

                  <div class="px-5 py-4">
                    <p class="line-clamp-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">{{ exam.title }}</p>
                    <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">Only this exam will be removed from the saved exams list.</p>
                    @if (submitMessage()) {
                      <div class="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                        {{ submitMessage() }}
                      </div>
                    }
                  </div>

                  <div class="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end dark:border-slate-800">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-indigo-500/30"
                      [disabled]="deletingExamId() === exam.id"
                      (click)="closeDeleteExamModal()"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                      [disabled]="deletingExamId() === exam.id"
                      (click)="confirmDeleteExam()"
                    >
                      <mat-icon class="text-base">delete</mat-icon>
                      @if (deletingExamId() === exam.id) {
                        Deleting...
                      } @else {
                        Delete exam
                      }
                    </button>
                  </div>
                </section>
              </div>
            }

            @if (selectedListExam(); as selectedExam) {
              <div class="fixed inset-0 z-50 flex bg-slate-950/45" role="presentation" (click)="closeExamQuestionsDrawer()">
                <aside
                  id="exam-questions-drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="exam-questions-drawer-title"
                  class="ml-auto flex h-full w-full max-w-5xl flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
                  (click)="$event.stopPropagation()"
                >
                  <div class="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
                    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white">
                            <mat-icon class="text-sm">assignment</mat-icon>
                            {{ selectedExam.status }}
                          </span>
                          <span class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                            <mat-icon class="text-sm">menu_book</mat-icon>
                            {{ selectedExam.subjectName || selectedSubjectLabel() }}
                          </span>
                        </div>
                        <h3 id="exam-questions-drawer-title" class="mt-4 text-xl font-bold text-slate-950 dark:text-white">{{ selectedExam.title }}</h3>
                        <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Questions linked to this saved exam.</p>
                      </div>
                      <button
                        type="button"
                        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Close exam questions"
                        (click)="closeExamQuestionsDrawer()"
                      >
                        <mat-icon class="text-base">close</mat-icon>
                      </button>
                    </div>

                    <div class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div class="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Questions</p>
                        <p class="mt-1 text-lg font-bold text-slate-950 dark:text-white">{{ selectedExam.questionCount }}</p>
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Created</p>
                        <p class="mt-1 text-lg font-bold text-slate-950 dark:text-white">{{ selectedExam.date }}</p>
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Grade</p>
                        <p class="mt-1 truncate text-lg font-bold text-slate-950 dark:text-white">{{ scopeName() }}</p>
                      </div>
                      <div class="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                        <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Submissions</p>
                        <p class="mt-1 text-lg font-bold text-slate-950 dark:text-white">{{ selectedExam.submissionCount }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="flex-1 overflow-y-auto px-6 py-5">
                    @if (examDrawerQuestionsLoading()) {
                      <div class="rounded-lg border border-slate-200 px-5 py-10 text-center dark:border-slate-800">
                        <mat-icon class="text-3xl text-slate-400">hourglass_empty</mat-icon>
                        <h4 class="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Loading exam questions</h4>
                        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Questions linked to this exam will appear here.</p>
                      </div>
                    } @else if (examDrawerQuestionsError()) {
                      <div class="rounded-lg border border-rose-100 bg-rose-50 px-5 py-10 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
                        <mat-icon class="text-3xl text-rose-500">error</mat-icon>
                        <h4 class="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Unable to load exam questions</h4>
                        <p class="mt-1 text-sm text-rose-700 dark:text-rose-200">{{ examDrawerQuestionsError() }}</p>
                      </div>
                    } @else if (examDrawerQuestionRows().length === 0) {
                      <div class="rounded-lg border border-slate-200 px-5 py-10 text-center dark:border-slate-800">
                        <mat-icon class="text-4xl text-slate-400">playlist_remove</mat-icon>
                        <h4 class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">No questions linked</h4>
                        <p class="mx-auto mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">This exam was saved without attached questions.</p>
                      </div>
                    } @else {
                      <div class="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                        <table class="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                          <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                            <tr>
                              <th class="px-5 py-3">Question</th>
                              <th class="px-5 py-3">Type</th>
                              <th class="px-5 py-3">Curriculum</th>
                              <th class="px-5 py-3">Answers</th>
                              <th class="px-5 py-3">Weight</th>
                              <th class="px-5 py-3">Difficulty</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            @for (question of examDrawerQuestionRows(); track question.id) {
                              <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                                <td class="max-w-lg px-5 py-4">
                                  <p class="line-clamp-2 font-semibold text-slate-900 dark:text-slate-100">{{ question.question }}</p>
                                  @if (question.tags.length > 0) {
                                    <div class="mt-2 flex flex-wrap gap-1.5">
                                      @for (tag of question.tags; track tag) {
                                        <span class="inline-flex rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{{ tag }}</span>
                                      }
                                    </div>
                                  }
                                </td>
                                <td class="px-5 py-4">
                                  <span class="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{{ questionTypeLabel(question.type) }}</span>
                                </td>
                                <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ question.curriculumItem }}</td>
                                <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ question.answerCount }}</td>
                                <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ question.weight ?? '-' }}</td>
                                <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ difficultyDisplayName(question.difficultyId) }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  </div>

                  <div class="flex justify-end border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      (click)="closeExamQuestionsDrawer()"
                    >
                      Close
                    </button>
                  </div>
                </aside>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class TenantExamsBasicEducationExamCreateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly collegesData = inject(TenantCollegesDataService);
  private readonly stagesData = inject(TenantEducationalStagesDataService);
  private readonly gradesData = inject(TenantGradesDataService);
  private readonly subjectsData = inject(TenantSubjectsDataService);
  private readonly universitySubjectsData = inject(TenantUniversitySubjectsDataService);

  readonly stageId = signal('');
  readonly gradeId = signal('');
  readonly subjectId = signal('');
  private readonly routeSubjectId = signal('');
  readonly editingExamId = signal('');
  readonly universityId = signal('');
  readonly collegeId = signal('');
  readonly isCreateMode = signal(false);
  readonly stages = signal<EducationalStage[]>([]);
  readonly grades = signal<Grade[]>([]);
  readonly subjects = signal<TenantSubject[]>([]);
  readonly college = signal<TenantCollege | null>(null);
  readonly universitySubjects = signal<TenantUniversitySubject[]>([]);
  readonly exams = signal<BasicEducationGradeExam[]>([]);
  readonly examSearchTerm = signal('');
  readonly examStatusFilter = signal<ExamStatusFilter>('All');
  readonly examQuestionRows = signal<ExamQuestionRow[]>([]);
  readonly bloomLevels = signal<BloomLevel[]>([]);
  readonly questionDifficulties = signal<QuestionDifficulty[]>([]);
  readonly curriculumSkills = signal<TenantCurriculumSkill[]>([]);
  readonly selectedExamQuestionId = signal<string | null>(null);
  readonly examQuestionsLoading = signal(false);
  readonly examQuestionsError = signal<string | null>(null);
  readonly selectedListExamId = signal<string | null>(null);
  readonly examDrawerQuestionRows = signal<ExamQuestionRow[]>([]);
  readonly examDrawerQuestionsLoading = signal(false);
  readonly examDrawerQuestionsError = signal<string | null>(null);
  readonly basicQuestionsDrawerOpen = signal(false);
  readonly basicQuestionDrawerSource = signal<BasicQuestionDrawerSource>('basic');
  readonly basicQuestionRows = signal<ExamQuestionRow[]>([]);
  readonly basicQuestionSelection = signal<string[]>([]);
  readonly basicQuestionSearchTerm = signal('');
  readonly basicQuestionTypeFilter = signal('All');
  readonly basicQuestionsLoading = signal(false);
  readonly basicQuestionsError = signal<string | null>(null);
  readonly deletingQuestionId = signal<string | null>(null);
  readonly deleteQuestionModal = signal<ExamQuestionRow | null>(null);
  readonly deleteExamModal = signal<BasicEducationGradeExam | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly savingExam = signal(false);
  readonly updatingExamStatusId = signal<string | null>(null);
  readonly deletingExamId = signal<string | null>(null);
  readonly submitMessage = signal<string | null>(null);
  readonly questionOptionsOpen = signal(false);
  readonly questionContextLoading = signal(false);
  readonly questionContextError = signal<string | null>(null);
  readonly questionOptions = [
    {
      kind: 'insert',
      label: 'Insert question',
      description: 'Write a new question for this exam.',
      icon: 'edit_note',
    },
    {
      kind: 'basic',
      label: 'Add from basic questions',
      description: 'Use saved questions for this subject.',
      icon: 'playlist_add',
    },
    {
      kind: 'bank',
      label: 'Add from questions bank',
      description: 'Browse the tenant question bank.',
      icon: 'library_books',
    },
  ];

  readonly selectedStage = computed(() => this.stages().find((stage) => stage.id === this.stageId()) ?? null);
  readonly selectedGrade = computed(() => this.grades().find((grade) => grade.id === this.gradeId() && grade.stageId === this.stageId()) ?? null);
  readonly selectedSubject = computed(() => {
    const selectedId = this.subjectId();
    if (selectedId) {
      return this.subjects().find((subject) => subject.id === selectedId) ?? null;
    }

    return this.subjects().length === 1 ? this.subjects()[0] : null;
  });
  readonly publishedExamCount = computed(() => this.exams().filter((exam) => exam.status === 'Published').length);
  readonly draftExamCount = computed(() => this.exams().filter((exam) => exam.status === 'Draft').length);
  readonly filteredExams = computed(() => {
    const search = this.examSearchTerm().trim().toLowerCase();
    const status = this.examStatusFilter();
    return this.exams().filter((exam) => {
      const matchesStatus = status === 'All' || exam.status === status;
      const matchesSearch = !search || [
        exam.title,
        exam.subjectName ?? '',
        exam.date,
        exam.status,
      ].some((value) => value.toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
  });
  readonly hasExamFilters = computed(() => this.examSearchTerm().trim().length > 0 || this.examStatusFilter() !== 'All');
  readonly selectedListExam = computed(() => {
    const selectedId = this.selectedListExamId();
    return selectedId ? this.exams().find((exam) => exam.id === selectedId) ?? null : null;
  });
  readonly selectedExamQuestionRow = computed(() => {
    const selectedId = this.selectedExamQuestionId();
    return selectedId ? this.examQuestionRows().find((question) => question.id === selectedId) ?? null : null;
  });
  readonly basicQuestionTypes = computed(() => Array.from(new Set(this.basicQuestionRows().map((question) => question.type))).sort());
  readonly basicQuestionDrawerTitle = computed(() => this.basicQuestionDrawerSource() === 'bank' ? 'Add from questions bank' : 'Add from basic questions');
  readonly basicQuestionDrawerDescription = computed(() => this.basicQuestionDrawerSource() === 'bank' ? 'Select questions from the tenant question bank, then attach them to the exam draft.' : 'Select saved questions from this subject, then attach them to the exam draft.');
  readonly basicQuestionLoadingTitle = computed(() => this.basicQuestionDrawerSource() === 'bank' ? 'Loading questions bank' : 'Loading basic questions');
  readonly basicQuestionLoadingDescription = computed(() => this.basicQuestionDrawerSource() === 'bank' ? 'Question bank entries for this subject will appear here.' : 'Saved subject questions will appear here.');
  readonly basicQuestionErrorTitle = computed(() => this.basicQuestionDrawerSource() === 'bank' ? 'Unable to load questions bank' : 'Unable to load basic questions');
  readonly basicQuestionEmptyTitle = computed(() => this.basicQuestionDrawerSource() === 'bank' ? 'No question bank questions match the filters' : 'No basic questions match the filters');
  readonly filteredBasicQuestionRows = computed(() => {
    const search = this.basicQuestionSearchTerm().trim().toLowerCase();
    const type = this.basicQuestionTypeFilter();
    return this.basicQuestionRows().filter((question) => {
      const matchesType = type === 'All' || question.type === type;
      const matchesSearch = !search || [
        question.question,
        question.curriculumItem,
        this.questionTypeLabel(question.type),
        this.difficultyDisplayName(question.difficultyId),
        this.skillDisplayName(question.skillId),
        question.questionSource ?? '',
        ...question.tags,
      ].some((value) => value.toLowerCase().includes(search));
      return matchesType && matchesSearch;
    });
  });
  readonly listRoute = computed(() =>
    this.isUniversityEducationContext()
      ? ['/tenant/exams/university-education', this.universityId(), 'colleges', this.collegeId(), 'create']
      : ['/tenant/exams/basic-education', this.stageId(), 'grades', this.gradeId(), 'create'],
  );
  readonly createRoute = computed(() => [...this.listRoute(), 'new']);

  readonly examForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    instructions: [''],
    subjectId: [''],
    shuffleQuestions: [true],
    showResultsImmediately: [false],
    allowRetakes: [false],
  });

  ngOnInit(): void {
    this.stageId.set(this.route.snapshot.paramMap.get('stageId') ?? '');
    this.gradeId.set(this.route.snapshot.paramMap.get('gradeId') ?? '');
    const initialSubjectId = this.route.snapshot.queryParamMap.get('subjectId') ?? '';
    this.routeSubjectId.set(initialSubjectId);
    this.subjectId.set(initialSubjectId);
    this.editingExamId.set(this.route.snapshot.queryParamMap.get('examId') ?? '');
    this.examForm.controls.subjectId.setValue(this.subjectId(), { emitEvent: false });
    this.universityId.set(this.route.snapshot.paramMap.get('universityId') ?? '');
    this.collegeId.set(this.route.snapshot.paramMap.get('collegeId') ?? '');
    this.isCreateMode.set(this.route.snapshot.data['mode'] === 'create');
    void this.loadContext();
  }

  async onSubmit(): Promise<void> {
    this.submitMessage.set(null);
    if (this.examForm.invalid || !this.hasExamScope() || (!this.isUniversityEducationContext() && !this.selectedSubject())) {
      this.examForm.markAllAsTouched();
      return;
    }

    const value = this.examForm.getRawValue();
    const subject = this.selectedSubject();
    if (!this.isUniversityEducationContext() && subject) {
      this.savingExam.set(true);
      try {
        const payload = {
          title: value.title.trim() || this.defaultDraftExamTitle(subject.name),
          instructions: value.instructions || null,
          shuffleQuestions: value.shuffleQuestions,
          showResultsImmediately: value.showResultsImmediately,
          allowRetakes: value.allowRetakes,
          questionIds: this.selectedExamQuestionIds(subject.id),
        };
        if (this.editingExamId()) {
          await this.subjectsData.updateBasicEducationExam(this.stageId(), this.gradeId(), subject.id, this.editingExamId(), payload);
        } else {
          await this.subjectsData.createBasicEducationExam(this.stageId(), this.gradeId(), subject.id, payload);
        }
        sessionStorage.setItem(this.examQuestionDraftStorageKey(subject.id), JSON.stringify([]));
        await this.router.navigate(this.listRoute(), { queryParams: this.routeQueryParams() });
      } catch (error) {
        this.submitMessage.set(this.subjectsData.toUserMessage(error, 'Unable to save exam. Please try again.'));
      } finally {
        this.savingExam.set(false);
      }
      return;
    }

    this.exams.update((exams) => [
      {
        id: `draft-${Date.now()}`,
        title: value.title,
        instructions: value.instructions || null,
        subjectId: this.isUniversityEducationContext() ? null : subject?.id ?? null,
        subjectName: this.isUniversityEducationContext() ? null : subject?.name ?? null,
        date: this.todayDateString(),
        status: 'Draft',
        shuffleQuestions: value.shuffleQuestions,
        showResultsImmediately: value.showResultsImmediately,
        allowRetakes: value.allowRetakes,
        questionCount: 0,
        submissionCount: 0,
      },
      ...exams,
    ]);
    this.submitMessage.set(`Exam draft is ready for ${scopeText(this.scopeName(), this.selectedSubjectLabel())}.`);
    this.examForm.reset({
      title: '',
      instructions: '',
      subjectId: subject?.id ?? '',
      shuffleQuestions: true,
      showResultsImmediately: false,
      allowRetakes: false,
    });
  }

  statusClass(status: BasicEducationExamStatus): string {
    const classes: Record<BasicEducationExamStatus, string> = {
      Draft: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
      Published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
      Scheduled: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
    };
    return classes[status];
  }

  updateExamSearch(event: Event): void {
    this.examSearchTerm.set((event.target as HTMLInputElement | null)?.value ?? '');
  }

  updateExamStatusFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value;
    if (value === 'Draft' || value === 'Published' || value === 'Scheduled') {
      this.examStatusFilter.set(value);
      return;
    }
    this.examStatusFilter.set('All');
  }

  clearExamFilters(): void {
    this.examSearchTerm.set('');
    this.examStatusFilter.set('All');
  }

  async editExam(exam: BasicEducationGradeExam, event: Event): Promise<void> {
    event.stopPropagation();
    const subjectId = exam.subjectId || this.selectedSubject()?.id;
    if (!subjectId || this.isUniversityEducationContext()) {
      return;
    }

    await this.router.navigate(this.createRoute(), {
      queryParams: {
        subjectId,
        examId: exam.id,
      },
    });
  }

  openDeleteExamModal(exam: BasicEducationGradeExam, event: Event): void {
    event.stopPropagation();
    this.submitMessage.set(null);
    this.deleteExamModal.set(exam);
  }

  closeDeleteExamModal(): void {
    if (this.deletingExamId()) {
      return;
    }
    this.deleteExamModal.set(null);
  }

  async confirmDeleteExam(): Promise<void> {
    const exam = this.deleteExamModal();
    if (!exam) {
      return;
    }
    const subjectId = exam.subjectId || this.selectedSubject()?.id;
    if (!subjectId || this.isUniversityEducationContext()) {
      return;
    }

    this.deletingExamId.set(exam.id);
    this.submitMessage.set(null);
    try {
      await this.subjectsData.deleteBasicEducationExam(this.stageId(), this.gradeId(), subjectId, exam.id);
      this.exams.update((exams) => exams.filter((item) => item.id !== exam.id));
      if (this.selectedListExamId() === exam.id) {
        this.closeExamQuestionsDrawer();
      }
      this.deleteExamModal.set(null);
    } catch (error) {
      this.submitMessage.set(this.subjectsData.toUserMessage(error, 'Unable to delete exam. Please try again.'));
    } finally {
      this.deletingExamId.set(null);
    }
  }

  async toggleExamStatus(exam: BasicEducationGradeExam, event?: Event): Promise<void> {
    event?.stopPropagation();
    const subjectId = exam.subjectId || this.selectedSubject()?.id;
    if (!subjectId || this.isUniversityEducationContext()) {
      return;
    }

    const nextStatus: BasicEducationExamStatus = exam.status === 'Published' ? 'Draft' : 'Published';
    this.updatingExamStatusId.set(exam.id);
    this.submitMessage.set(null);
    try {
      const updated = await this.subjectsData.updateBasicEducationExamStatus(
        this.stageId(),
        this.gradeId(),
        subjectId,
        exam.id,
        { status: this.toApiExamStatus(nextStatus) },
      );
      const row = this.toGradeExamRow(updated);
      this.exams.update((exams) => exams.map((item) => item.id === row.id ? row : item));
      if (this.selectedListExamId() === row.id) {
        this.selectedListExamId.set(row.id);
      }
    } catch (error) {
      this.submitMessage.set(this.subjectsData.toUserMessage(error, 'Unable to update exam status. Please try again.'));
    } finally {
      this.updatingExamStatusId.set(null);
    }
  }

  isUniversityEducationContext(): boolean {
    return !!this.universityId() && !!this.collegeId();
  }

  hasExamScope(): boolean {
    return this.isUniversityEducationContext() ? !!this.college() : !!this.selectedStage() && !!this.selectedGrade();
  }

  educationTrackLabel(): string {
    return this.isUniversityEducationContext() ? 'University Education' : 'Basic Education';
  }

  educationTrackRoute(): string {
    return this.isUniversityEducationContext() ? '/tenant/exams/university-education' : '/tenant/exams/basic-education';
  }

  parentContextLabel(): string {
    if (this.isUniversityEducationContext()) {
      return this.college()?.universityName || 'Colleges';
    }

    return this.selectedStage()?.name || 'Grades';
  }

  parentContextRoute(): string[] {
    if (this.isUniversityEducationContext()) {
      return ['/tenant/exams/university-education', this.universityId()];
    }

    return ['/tenant/exams/basic-education', this.stageId()];
  }

  gradeContextRoute(): string[] {
    return ['/tenant/exams/basic-education', this.stageId(), 'grades', this.gradeId()];
  }

  parentScopeTypeLabel(): string {
    return this.isUniversityEducationContext() ? 'University' : 'Stage';
  }

  scopeTypeLabel(): string {
    return this.isUniversityEducationContext() ? 'College' : 'Grade';
  }

  scopeTypeLower(): string {
    return this.scopeTypeLabel().toLowerCase();
  }

  scopeName(): string {
    if (this.isUniversityEducationContext()) {
      return this.college()?.name || 'College';
    }

    return this.selectedGrade()?.name || 'Grade';
  }

  selectedSubjectLabel(): string {
    return this.selectedSubject()?.name || (this.subjects().length > 1 ? 'All subjects' : 'Subject');
  }

  isSubjectSelectorLocked(): boolean {
    return !this.isUniversityEducationContext() && !!this.routeSubjectId() && this.selectedSubject()?.id === this.routeSubjectId();
  }

  toggleQuestionOptions(): void {
    this.questionOptionsOpen.update((open) => !open);
  }

  closeQuestionOptions(): void {
    this.questionOptionsOpen.set(false);
  }

  selectExamQuestion(question: ExamQuestionRow): void {
    this.selectedExamQuestionId.set(question.id);
  }

  closeQuestionDrawer(): void {
    this.selectedExamQuestionId.set(null);
  }

  async openBasicQuestionsDrawer(): Promise<void> {
    const subject = this.selectedSubject();
    if (!subject) {
      this.questionContextError.set('Choose a subject before adding basic questions.');
      return;
    }

    this.prepareBasicQuestionsDrawer('basic');
    try {
      const curriculum = await this.subjectsData.getSubjectCurriculum(subject.id);
      await this.loadCurriculumSkills(subject.id, curriculum);
      const questions = await this.loadSubjectCurriculumQuestions(subject.id, curriculum);
      this.basicQuestionRows.set(questions.map(({ question, nodeId }) => this.toExamQuestionRow(question, curriculum, nodeId)));
    } catch (error) {
      this.basicQuestionRows.set([]);
      this.basicQuestionsError.set(this.subjectsData.toUserMessage(error, 'Unable to load basic questions. Please try again.'));
    } finally {
      this.basicQuestionsLoading.set(false);
    }
  }

  async openQuestionsBankDrawer(): Promise<void> {
    const subject = this.selectedSubject();
    if (!subject) {
      this.questionContextError.set('Choose a subject before adding questions from the bank.');
      return;
    }

    this.prepareBasicQuestionsDrawer('bank');
    try {
      const [curriculum, questions] = await Promise.all([
        this.subjectsData.getSubjectCurriculum(subject.id),
        this.subjectsData.listBasicEducationExamQuestions(this.stageId(), this.gradeId(), subject.id),
      ]);
      await this.loadCurriculumSkills(subject.id, curriculum);
      this.basicQuestionRows.set(questions.map((question) => this.toExamQuestionRow(question, curriculum)));
    } catch (error) {
      this.basicQuestionRows.set([]);
      this.basicQuestionsError.set(this.subjectsData.toUserMessage(error, 'Unable to load questions bank. Please try again.'));
    } finally {
      this.basicQuestionsLoading.set(false);
    }
  }

  private prepareBasicQuestionsDrawer(source: BasicQuestionDrawerSource): void {
    this.questionOptionsOpen.set(false);
    this.basicQuestionDrawerSource.set(source);
    this.basicQuestionsDrawerOpen.set(true);
    this.basicQuestionsLoading.set(true);
    this.basicQuestionsError.set(null);
    this.basicQuestionSearchTerm.set('');
    this.basicQuestionTypeFilter.set('All');
    this.basicQuestionSelection.set([]);
  }

  closeBasicQuestionsDrawer(): void {
    this.basicQuestionsDrawerOpen.set(false);
    this.basicQuestionsError.set(null);
    this.basicQuestionsLoading.set(false);
  }

  updateBasicQuestionSearch(event: Event): void {
    this.basicQuestionSearchTerm.set((event.target as HTMLInputElement | null)?.value ?? '');
  }

  updateBasicQuestionTypeFilter(event: Event): void {
    this.basicQuestionTypeFilter.set((event.target as HTMLSelectElement | null)?.value || 'All');
  }

  isBasicQuestionSelected(questionId: string): boolean {
    return this.basicQuestionSelection().includes(questionId);
  }

  toggleBasicQuestionSelection(questionId: string): void {
    this.basicQuestionSelection.update((selected) =>
      selected.includes(questionId)
        ? selected.filter((id) => id !== questionId)
        : [...selected, questionId],
    );
  }

  async addSelectedBasicQuestions(): Promise<void> {
    const subject = this.selectedSubject();
    if (!subject) {
      this.basicQuestionsError.set('Choose a subject before adding basic questions.');
      return;
    }

    const selectedIds = this.basicQuestionSelection();
    if (selectedIds.length === 0) {
      return;
    }
    const currentTitle = this.examForm.controls.title.value.trim();
    if (!currentTitle) {
      this.examForm.controls.title.setValue(this.defaultDraftExamTitle(subject.name), { emitEvent: false });
    }
    if (this.examForm.invalid) {
      this.examForm.markAllAsTouched();
      this.basicQuestionsError.set('Fix the exam details before saving selected questions.');
      return;
    }

    const currentIds = this.examQuestionRows().map((question) => question.id);
    const mergedIds = [...currentIds];
    for (const selectedId of selectedIds) {
      if (!mergedIds.includes(selectedId)) {
        mergedIds.push(selectedId);
      }
    }

    this.savingExam.set(true);
    this.basicQuestionsError.set(null);
    this.examQuestionsError.set(null);
    try {
      const value = this.examForm.getRawValue();
      const payload = {
        title: value.title,
        instructions: value.instructions || null,
        shuffleQuestions: value.shuffleQuestions,
        showResultsImmediately: value.showResultsImmediately,
        allowRetakes: value.allowRetakes,
        questionIds: mergedIds,
      };
      const savedExam = this.editingExamId()
        ? await this.subjectsData.updateBasicEducationExam(this.stageId(), this.gradeId(), subject.id, this.editingExamId(), payload)
        : await this.subjectsData.createBasicEducationExam(this.stageId(), this.gradeId(), subject.id, payload);

      this.editingExamId.set(savedExam.id);
      sessionStorage.setItem(this.examQuestionDraftStorageKey(subject.id), JSON.stringify(mergedIds));
      await this.loadPersistedExamQuestionRows(subject.id, savedExam.id);
      await this.loadBasicEducationExams();
      await this.router.navigate(this.createRoute(), {
        queryParams: { subjectId: subject.id, examId: savedExam.id },
        replaceUrl: true,
      });
      this.closeBasicQuestionsDrawer();
    } catch (error) {
      this.basicQuestionsError.set(this.subjectsData.toUserMessage(error, 'Unable to save selected questions. Please try again.'));
    } finally {
      this.savingExam.set(false);
    }
  }

  async openExamQuestionsDrawer(exam: BasicEducationGradeExam): Promise<void> {
    this.selectedListExamId.set(exam.id);
    this.examDrawerQuestionRows.set([]);
    this.examDrawerQuestionsError.set(null);
    if (this.isUniversityEducationContext()) {
      return;
    }

    const subjectId = exam.subjectId || this.selectedSubject()?.id;
    if (!subjectId) {
      this.examDrawerQuestionsError.set('Choose a subject before viewing exam questions.');
      return;
    }

    this.examDrawerQuestionsLoading.set(true);
    try {
      const [curriculum, questions] = await Promise.all([
        this.subjectsData.getSubjectCurriculum(subjectId),
        this.subjectsData.listBasicEducationExamLinkedQuestions(this.stageId(), this.gradeId(), subjectId, exam.id),
      ]);
      await this.loadCurriculumSkills(subjectId, curriculum);
      this.examDrawerQuestionRows.set(questions.map((question) => this.toExamQuestionRow(question, curriculum)));
    } catch (error) {
      this.examDrawerQuestionRows.set([]);
      this.examDrawerQuestionsError.set(this.subjectsData.toUserMessage(error, 'Unable to load exam questions. Please try again.'));
    } finally {
      this.examDrawerQuestionsLoading.set(false);
    }
  }

  closeExamQuestionsDrawer(): void {
    this.selectedListExamId.set(null);
    this.examDrawerQuestionRows.set([]);
    this.examDrawerQuestionsError.set(null);
    this.examDrawerQuestionsLoading.set(false);
  }

  async editExamQuestion(question: ExamQuestionRow, event: Event): Promise<void> {
    event.stopPropagation();
    const subject = this.selectedSubject();
    if (!subject) {
      this.examQuestionsError.set('Choose a subject before editing questions.');
      return;
    }

    let questionId = question.id;
    const examId = this.editingExamId();
    this.examQuestionsError.set(null);
    if (examId) {
      try {
        const editableQuestion = await this.subjectsData.createEditableBasicEducationExamQuestionCopy(
          this.stageId(),
          this.gradeId(),
          subject.id,
          examId,
          question.id,
        );
        questionId = editableQuestion.id;
        this.replaceSelectedExamQuestionId(subject.id, question.id, questionId);
        this.examQuestionRows.update((questions) => questions.map((item) => item.id === question.id ? { ...item, id: questionId } : item));
        if (this.selectedExamQuestionId() === question.id) {
          this.selectedExamQuestionId.set(questionId);
        }
      } catch (error) {
        this.examQuestionsError.set(this.subjectsData.toUserMessage(error, 'Unable to prepare this question for editing. Please try again.'));
        return;
      }
    }

    const queryParams: { subjectId: string; examId?: string } = { subjectId: subject.id };
    if (examId) {
      queryParams.examId = examId;
    }
    await this.router.navigate([
      '/tenant/exams/basic-education',
      this.stageId(),
      'grades',
      this.gradeId(),
      'create',
      'new',
      'subjects',
      subject.id,
      'curriculum',
      'editQuestion',
      questionId,
    ], { queryParams });
  }

  openDeleteExamQuestionModal(question: ExamQuestionRow, event: Event): void {
    event.stopPropagation();
    this.examQuestionsError.set(null);
    this.deleteQuestionModal.set(question);
  }

  closeDeleteExamQuestionModal(): void {
    if (this.deletingQuestionId()) {
      return;
    }
    this.deleteQuestionModal.set(null);
  }

  confirmDeleteExamQuestion(): void {
    const question = this.deleteQuestionModal();
    const subject = this.selectedSubject();
    if (!subject || !question) {
      return;
    }

    this.examQuestionsError.set(null);
    this.removeSelectedExamQuestionId(subject.id, question.id);
    this.examQuestionRows.update((questions) => questions.filter((item) => item.id !== question.id));
    if (this.selectedExamQuestionId() === question.id) {
      this.selectedExamQuestionId.set(null);
    }
    this.deleteQuestionModal.set(null);
  }

  async selectQuestionOption(kind: string): Promise<void> {
    if (kind === 'basic') {
      await this.openBasicQuestionsDrawer();
      return;
    }

    if (kind === 'bank') {
      await this.openQuestionsBankDrawer();
      return;
    }

    if (kind !== 'insert') {
      return;
    }

    const subject = this.selectedSubject();
    if (!subject) {
      this.questionContextError.set('Choose a subject before adding questions.');
      return;
    }

    this.questionContextLoading.set(true);
    this.questionContextError.set(null);
    try {
      this.questionOptionsOpen.set(false);
      const queryParams: { subjectId: string; examId?: string } = { subjectId: subject.id };
      if (this.editingExamId()) {
        queryParams.examId = this.editingExamId();
      }
      await this.router.navigate([
        '/tenant/exams/basic-education',
        subject.stageId || this.stageId(),
        'grades',
        subject.gradeId || this.gradeId(),
        'create',
        'new',
        'subjects',
        subject.id,
        'curriculum',
        'addQuestion',
      ], { queryParams });
    } catch (error) {
      this.questionContextError.set(this.subjectsData.toUserMessage(error, 'Unable to load question setup. Please try again.'));
    } finally {
      this.questionContextLoading.set(false);
    }
  }

  setSelectedSubjectId(subjectId: string): void {
    if (this.isSubjectSelectorLocked() && subjectId !== this.routeSubjectId()) {
      this.examForm.controls.subjectId.setValue(this.routeSubjectId(), { emitEvent: false });
      this.syncSubjectControlLock();
      return;
    }

    this.subjectId.set(subjectId);
    this.examForm.controls.subjectId.setValue(subjectId, { emitEvent: false });
    if (this.isCreateMode()) {
      void this.loadExamQuestions();
    }
  }

  routeQueryParams(): { subjectId: string } | null {
    const subjectId = this.selectedSubject()?.id ?? this.subjectId();
    return !this.isUniversityEducationContext() && subjectId ? { subjectId } : null;
  }

  resetQuestionDraftForNewExam(): void {
    const subject = this.selectedSubject();
    if (this.isUniversityEducationContext() || !subject) {
      return;
    }

    sessionStorage.setItem(this.examQuestionDraftStorageKey(subject.id), JSON.stringify([]));
    this.examQuestionRows.set([]);
    this.selectedExamQuestionId.set(null);
  }

  defaultDraftExamTitle(subjectName: string): string {
    const title = (subjectName || "Subject") + " Exam";
    return title.length > 120 ? title.slice(0, 120).trim() : title;
  }

  sectionDescription(): string {
    if (this.isUniversityEducationContext()) {
      return this.isCreateMode()
        ? 'Create a new exam for this college.'
        : 'Review existing exams and create a new exam for this college.';
    }

    const subjectLabel = this.selectedSubjectLabel();
    return this.isCreateMode()
      ? `Create a new exam for ${scopeText(this.scopeName(), subjectLabel)}.`
      : `Review existing exams for ${scopeText(this.scopeName(), subjectLabel)}.`;
  }

  examsListDescription(): string {
    if (this.isUniversityEducationContext()) {
      return `${this.exams().length} exams prepared for ${this.scopeName()}.`;
    }

    return `${this.exams().length} exams prepared for ${scopeText(this.scopeName(), this.selectedSubjectLabel())}.`;
  }

  examMetadata(): { label: string; value: string; icon: string }[] {
    if (this.isUniversityEducationContext()) {
      return [
        { label: 'College', value: this.scopeName(), icon: 'account_balance' },
        { label: 'Subjects', value: `${this.universitySubjects().length}`, icon: 'menu_book' },
      ];
    }

    return [
      { label: 'Grade', value: this.scopeName(), icon: 'school' },
      { label: 'Subject', value: this.selectedSubjectLabel(), icon: 'menu_book' },
    ];
  }

  examQuestionsDescription(): string {
    const count = this.examQuestionRows().length;
    if (count > 0) {
      return `${count} saved ${count === 1 ? 'question' : 'questions'} linked to ${this.selectedSubjectLabel()}.`;
    }

    return 'Create or attach questions, then review them here before saving the exam.';
  }

  questionTypeLabel(type: string): string {
    return type
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  bloomDisplayName(bloomId: string | null): string {
    if (!bloomId) {
      return '-';
    }

    const level = this.bloomLevels().find((item) => item.id === bloomId);
    return level ? `${level.levelOrder}. ${level.nameEn}` : bloomId;
  }

  difficultyDisplayName(difficultyId: string | null): string {
    if (!difficultyId) {
      return '-';
    }

    return this.questionDifficulties().find((item) => item.id === difficultyId)?.nameEn ?? difficultyId;
  }

  skillDisplayName(skillId: string | null): string {
    if (!skillId) {
      return '-';
    }

    return this.curriculumSkills().find((item) => item.id === skillId)?.name ?? skillId;
  }

  selectedQuestionMetrics(): { label: string; value: string; icon: string }[] {
    const question = this.selectedExamQuestionRow();
    if (!question) {
      return [];
    }

    return [
      { label: 'Type', value: this.questionTypeLabel(question.type), icon: 'category' },
      { label: 'Curriculum', value: question.curriculumItem, icon: 'account_tree' },
      { label: 'Answers', value: String(question.answerCount), icon: 'fact_check' },
      { label: 'Weight', value: question.weight == null ? '-' : String(question.weight), icon: 'monitor_weight' },
    ];
  }

  private async loadContext(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      if (this.isUniversityEducationContext()) {
        const [college, subjects] = await Promise.all([
          this.collegesData.getCollege(this.collegeId()),
          this.universitySubjectsData.listSubjects({ collegeId: this.collegeId() }),
        ]);
        this.college.set(college);
        this.universitySubjects.set(subjects);
      } else {
        const [stages, grades, subjects, bloomLevels, questionDifficulties] = await Promise.all([
          this.stagesData.listStages(),
          this.gradesData.listGrades(),
          this.subjectsData.listSubjects({ stageId: this.stageId(), gradeId: this.gradeId() }),
          this.subjectsData.listBloomLevels(),
          this.subjectsData.listQuestionDifficulties(),
        ]);
        this.stages.set(stages);
        this.grades.set(grades);
        this.subjects.set(subjects);
        this.bloomLevels.set(bloomLevels);
        this.questionDifficulties.set(questionDifficulties);
        this.syncSelectedSubject();
        await this.loadExamQuestions();
        await this.loadBasicEducationExams();
        if (this.isCreateMode() && this.editingExamId()) {
          await this.loadExamForEditing();
        }
      }
      if (this.isUniversityEducationContext()) {
        this.exams.set(this.buildInitialExams());
      }
    } catch (error) {
      this.loadError.set(
        this.isUniversityEducationContext()
          ? this.universitySubjectsData.toUserMessage(error, 'Unable to load college exam context. Please try again.')
          : this.gradesData.toUserMessage(error),
      );
      this.stages.set([]);
      this.grades.set([]);
      this.subjects.set([]);
      this.college.set(null);
      this.universitySubjects.set([]);
      this.exams.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadBasicEducationExams(): Promise<void> {
    const subject = this.selectedSubject();
    if (!subject) {
      this.exams.set([]);
      return;
    }
    const exams = await this.subjectsData.listBasicEducationExams(this.stageId(), this.gradeId(), subject.id);
    this.exams.set(exams.map((exam) => this.toGradeExamRow(exam)));
  }

  private async loadExamForEditing(): Promise<void> {
    const subject = this.selectedSubject();
    const examId = this.editingExamId();
    if (!subject || !examId) {
      return;
    }

    const exam = this.exams().find((item) => item.id === examId);
    if (!exam) {
      this.submitMessage.set('Unable to find the selected exam for editing.');
      return;
    }

    this.examForm.patchValue({
      title: exam.title,
      instructions: exam.instructions ?? '',
      subjectId: subject.id,
      shuffleQuestions: exam.shuffleQuestions,
      showResultsImmediately: exam.showResultsImmediately,
      allowRetakes: exam.allowRetakes,
    }, { emitEvent: false });
    this.examQuestionsLoading.set(true);
    this.examQuestionsError.set(null);
    try {
      await this.loadPersistedExamQuestionRows(subject.id, exam.id);
    } catch (error) {
      this.examQuestionRows.set([]);
      this.examQuestionsError.set(this.subjectsData.toUserMessage(error, 'Unable to load exam questions. Please try again.'));
    } finally {
      this.examQuestionsLoading.set(false);
    }
  }

  private async loadPersistedExamQuestionRows(subjectId: string, examId: string): Promise<void> {
    this.examQuestionsLoading.set(true);
    this.examQuestionsError.set(null);
    try {
      const [curriculum, questions] = await Promise.all([
        this.subjectsData.getSubjectCurriculum(subjectId),
        this.subjectsData.listBasicEducationExamLinkedQuestions(this.stageId(), this.gradeId(), subjectId, examId),
      ]);
      await this.loadCurriculumSkills(subjectId, curriculum);
      this.examQuestionRows.set(questions.map((question) => this.toExamQuestionRow(question, curriculum)));
      sessionStorage.setItem(this.examQuestionDraftStorageKey(subjectId), JSON.stringify(questions.map((question) => question.id)));
      if (this.selectedExamQuestionId() && !questions.some((question) => question.id === this.selectedExamQuestionId())) {
        this.selectedExamQuestionId.set(null);
      }
    } finally {
      this.examQuestionsLoading.set(false);
    }
  }

  private toGradeExamRow(exam: TenantBasicEducationExam): BasicEducationGradeExam {
    const subject = this.subjects().find((item) => item.id === exam.subjectId);
    return {
      id: exam.id,
      title: exam.title,
      instructions: exam.instructions,
      subjectId: exam.subjectId,
      subjectName: subject?.name ?? this.selectedSubjectLabel(),
      date: exam.createdAt.slice(0, 10),
      status: this.toExamStatus(exam.status),
      shuffleQuestions: exam.shuffleQuestions,
      showResultsImmediately: exam.showResultsImmediately,
      allowRetakes: exam.allowRetakes,
      questionCount: exam.questionCount,
      submissionCount: 0,
    };
  }

  private toExamStatus(status: string): BasicEducationExamStatus {
    const normalized = status.toUpperCase();
    if (normalized === 'PUBLISHED') {
      return 'Published';
    }
    if (normalized === 'SCHEDULED') {
      return 'Scheduled';
    }
    return 'Draft';
  }

  private toApiExamStatus(status: BasicEducationExamStatus): string {
    return status.toUpperCase();
  }

  private buildInitialExams(): BasicEducationGradeExam[] {
    const scopeId = this.isUniversityEducationContext() ? this.collegeId() : this.gradeId();
    const subject = this.selectedSubject();
    const submissionCount = this.isUniversityEducationContext()
      ? this.universitySubjects().reduce((total, subject) => total + subject.studentCount, 0)
      : Math.min(this.selectedGrade()?.studentCount ?? 0, 18);

    return [
      {
        id: `${scopeId}-term-one`,
        title: 'First Term Exam',
        instructions: null,
        subjectId: subject?.id ?? null,
        subjectName: subject?.name ?? null,
        date: '2026-06-24',
        status: 'Scheduled',
        shuffleQuestions: true,
        showResultsImmediately: false,
        allowRetakes: false,
        questionCount: 42,
        submissionCount: 0,
      },
      {
        id: `${scopeId}-monthly-assessment`,
        title: 'Monthly Assessment',
        instructions: null,
        subjectId: subject?.id ?? null,
        subjectName: subject?.name ?? null,
        date: '2026-05-28',
        status: 'Published',
        shuffleQuestions: true,
        showResultsImmediately: false,
        allowRetakes: false,
        questionCount: 25,
        submissionCount,
      },
    ];
  }

  private syncSelectedSubject(): void {
    const selectedId = this.subjectId();
    const hasSelectedSubject = !!selectedId && this.subjects().some((subject) => subject.id === selectedId);
    if (hasSelectedSubject) {
      this.examForm.controls.subjectId.setValue(selectedId, { emitEvent: false });
      this.syncSubjectControlLock();
      return;
    }

    if (this.subjects().length === 1) {
      this.setSelectedSubjectId(this.subjects()[0].id);
      this.syncSubjectControlLock();
      return;
    }

    this.setSelectedSubjectId('');
    this.syncSubjectControlLock();
  }

  private syncSubjectControlLock(): void {
    const subjectControl = this.examForm.controls.subjectId;
    if (this.isSubjectSelectorLocked()) {
      subjectControl.disable({ emitEvent: false });
      return;
    }

    subjectControl.enable({ emitEvent: false });
  }

  private async loadExamQuestions(): Promise<void> {
    if (this.isUniversityEducationContext()) {
      this.examQuestionRows.set([]);
      this.examQuestionsLoading.set(false);
      this.examQuestionsError.set(null);
      return;
    }

    const subject = this.selectedSubject();
    if (!subject) {
      this.examQuestionRows.set([]);
      this.examQuestionsLoading.set(false);
      this.examQuestionsError.set(null);
      return;
    }
    const selectedQuestionIds = this.selectedExamQuestionIds(subject.id);
    if (selectedQuestionIds.length === 0) {
      this.examQuestionRows.set([]);
      this.examQuestionsLoading.set(false);
      this.examQuestionsError.set(null);
      return;
    }

    this.examQuestionsLoading.set(true);
    this.examQuestionsError.set(null);
    try {
      const curriculum = await this.subjectsData.getSubjectCurriculum(subject.id);
      await this.loadCurriculumSkills(subject.id, curriculum);
      const questions = await this.subjectsData.listBasicEducationExamQuestions(this.stageId(), this.gradeId(), subject.id);
      const rows = questions
        .filter((question) => selectedQuestionIds.includes(question.id))
        .map((question) => this.toExamQuestionRow(question, curriculum));
      this.examQuestionRows.set(rows);
      if (this.selectedExamQuestionId() && !rows.some((question) => question.id === this.selectedExamQuestionId())) {
        this.selectedExamQuestionId.set(null);
      }
    } catch (error) {
      this.examQuestionRows.set([]);
      this.examQuestionsError.set(this.subjectsData.toUserMessage(error, 'Unable to load saved questions. Please try again.'));
    } finally {
      this.examQuestionsLoading.set(false);
    }
  }

  private selectedExamQuestionIds(subjectId: string): string[] {
    try {
      const value = sessionStorage.getItem(this.examQuestionDraftStorageKey(subjectId));
      const parsed = value ? JSON.parse(value) : [];
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && !!item) : [];
    } catch {
      return [];
    }
  }

  private examQuestionDraftStorageKey(subjectId: string): string {
    return `tenant.exam-draft.questions.basic.${this.stageId()}.${this.gradeId()}.${subjectId}`;
  }

  private async loadCurriculumSkills(subjectId: string, curriculum: TenantSubjectCurriculumNode | null): Promise<void> {
    const nodeIds = curriculum ? this.collectCurriculumNodeIds(curriculum) : [];
    if (nodeIds.length === 0) {
      this.curriculumSkills.set([]);
      return;
    }

    const results = await Promise.allSettled(nodeIds.map((nodeId) => this.subjectsData.listCurriculumSkills(subjectId, nodeId)));
    const skills = results
      .flatMap((result) => result.status === 'fulfilled' ? result.value : [])
      .filter((skill, index, all) => all.findIndex((item) => item.id === skill.id) === index);
    this.curriculumSkills.set(skills);
  }

  private collectCurriculumNodeIds(node: TenantSubjectCurriculumNode): string[] {
    return [
      node.id,
      ...node.children.flatMap((child) => this.collectCurriculumNodeIds(child)),
    ].filter((id) => !!id && id !== 'curriculum');
  }

  private async loadSubjectCurriculumQuestions(subjectId: string, curriculum: TenantSubjectCurriculumNode | null): Promise<BasicQuestionLoadResult[]> {
    const nodeIds = curriculum ? this.collectCurriculumNodeIds(curriculum) : [];
    if (nodeIds.length === 0) {
      return [];
    }
    const results = await Promise.allSettled(nodeIds.map(async (nodeId) => ({
      nodeId,
      questions: await this.subjectsData.listCurriculumQuestions(subjectId, nodeId),
    })));
    return results
      .flatMap((result) => result.status === 'fulfilled' ? result.value : [])
      .flatMap(({ nodeId, questions }) => questions.map((question) => ({ question, nodeId })))
      .filter(({ question }, index, all) => all.findIndex((item) => item.question.id === question.id) === index);
  }

  private removeSelectedExamQuestionId(subjectId: string, questionId: string): void {
    const selectedIds = this.selectedExamQuestionIds(subjectId).filter((id) => id !== questionId);
    sessionStorage.setItem(this.examQuestionDraftStorageKey(subjectId), JSON.stringify(selectedIds));
  }

  private replaceSelectedExamQuestionId(subjectId: string, currentQuestionId: string, nextQuestionId: string): void {
    const selectedIds = this.selectedExamQuestionIds(subjectId).map((id) => id === currentQuestionId ? nextQuestionId : id);
    sessionStorage.setItem(this.examQuestionDraftStorageKey(subjectId), JSON.stringify([...new Set(selectedIds)]));
  }

  private toExamQuestionRow(question: TenantCurriculumQuestion, curriculum: TenantSubjectCurriculumNode | null, fallbackNodeId?: string | null): ExamQuestionRow {
    const nodeId = question.curriculumNodeId ?? fallbackNodeId ?? null;
    return {
      id: question.id,
      nodeId,
      question: question.question || '(Media question)',
      type: question.type,
      curriculumItem: this.curriculumNodePathLabel(curriculum, nodeId) ?? curriculum?.label ?? this.selectedSubjectLabel(),
      answerCount: question.answers.length,
      weight: question.weight,
      answer: question.answer,
      description: question.description,
      bloomId: question.bloomId,
      difficultyId: question.difficultyId,
      skillId: question.skillId,
      questionSource: question.questionSource,
      answerExplanation: question.answerExplanation,
      tags: question.tags ?? [],
      answers: question.answers,
    };
  }

  private curriculumNodePathLabel(node: TenantSubjectCurriculumNode | null, nodeId?: string | null, parents: string[] = []): string | null {
    if (!node || !nodeId) {
      return null;
    }
    const path = [...parents, node.label];
    if (node.id === nodeId) {
      return path.join(' / ');
    }
    for (const child of node.children) {
      const label = this.curriculumNodePathLabel(child, nodeId, path);
      if (label) {
        return label;
      }
    }
    return null;
  }

  private todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
