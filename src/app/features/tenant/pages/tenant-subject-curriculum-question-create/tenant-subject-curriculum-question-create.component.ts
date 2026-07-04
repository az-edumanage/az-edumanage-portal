import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import 'mathlive';
import type { MathfieldElement } from 'mathlive';
import { I18nService } from '../../../../core/services/i18n.service';
import { TenantQuestionSource, TenantQuestionSourceSettingsService } from '../../data-access/tenant-question-source-settings.service';
import { TenantQuestionType, TenantQuestionTypeSettingsService } from '../../data-access/tenant-question-type-settings.service';
import { TenantCurriculumQuestionMediaPayload, TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { TenantGroupSearchableSelectorComponent } from '../../components/tenant-group-searchable-selector/tenant-group-searchable-selector.component';
import { TenantGroupSelectorOption } from '../../models/tenant-group-create.models';
import { BloomLevel, QuestionDifficulty, TenantCurriculumQuestion, TenantCurriculumQuestionAnswer, TenantCurriculumSkill, TenantSubjectCurriculumNode } from '../../models/tenant-subjects.models';
import { TenantSubjectDetailsFacade } from '../../state/tenant-subject-details.facade';

interface CurriculumPathItem {
  id: string;
  label: string;
}

interface AnswerDraft {
  answer: string;
  description: string;
  correct: boolean;
}

interface BulkAnswerInput {
  answer: string;
  correct: boolean;
}

interface BulkQuestionInput {
  question: string;
  answers: BulkAnswerInput[];
}

interface QuestionMediaOption {
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  kind: 'image' | 'video' | 'audio' | 'file';
  file: File | null;
  mediaUrl: string | null;
  mediaFileName: string | null;
  mediaOriginalName: string | null;
  mediaContentType: string | null;
  mediaSizeBytes: number | null;
}

type QuestionCreateLabelKey =
  | 'subject'
  | 'subjectDetails'
  | 'curriculum'
  | 'addQuestion'
  | 'editQuestion'
  | 'saveQuestion'
  | 'saving'
  | 'cancel'
  | 'loadingTitle'
  | 'loadingText'
  | 'loadErrorTitle'
  | 'backToCurriculum'
  | 'questionInformation'
  | 'questionInformationHint'
  | 'analyticalData'
  | 'analyticalDataHint'
  | 'topic'
  | 'bloomTaxonomy'
  | 'selectBloomTaxonomy'
  | 'searchBloomTaxonomy'
  | 'noBloomTaxonomyFound'
  | 'loadingBloomTaxonomy'
  | 'unableToLoadBloomTaxonomy'
  | 'difficulty'
  | 'skill'
  | 'selectSkill'
  | 'searchSkills'
  | 'noSkillsFound'
  | 'loadingSkills'
  | 'unableToLoadSkills'
  | 'addSkillValue'
  | 'enterSkillBeforeAdd'
  | 'unableToSaveSkill'
  | 'loadingQuestionDifficulties'
  | 'unableToLoadQuestionDifficulties'
  | 'selected'
  | 'theWeight'
  | 'enterWeight'
  | 'applicationData'
  | 'applicationDataHint'
  | 'tags'
  | 'suggestedTags'
  | 'writeTag'
  | 'optional'
  | 'questionSource'
  | 'answerExplanation'
  | 'selectQuestionSource'
  | 'searchQuestionSources'
  | 'noQuestionSourcesFound'
  | 'loadingQuestionSources'
  | 'unableToLoadQuestionSources'
  | 'addQuestionSourceValue'
  | 'enterQuestionSourceBeforeAdd'
  | 'type'
  | 'loadingQuestionTypes'
  | 'unableToLoadQuestionTypes'
  | 'selectQuestionType'
  | 'searchQuestionTypes'
  | 'noQuestionTypesFound'
  | 'typeRequired'
  | 'multipleQuestions'
  | 'multipleQuestionsHint'
  | 'singleQuestion'
  | 'singleQuestionHint'
  | 'question'
  | 'questionEditor'
  | 'enterQuestion'
  | 'openMathEditor'
  | 'uploadMediaOption'
  | 'removeMediaOption'
  | 'answer'
  | 'answers'
  | 'selectTrueFalse'
  | 'true'
  | 'false'
  | 'correct'
  | 'add'
  | 'noAnswers'
  | 'description'
  | 'addNotes'
  | 'curriculumItem'
  | 'currentItem'
  | 'path'
  | 'tip'
  | 'bulkTrueFalseHint'
  | 'bulkShortAnswerHint'
  | 'bulkEssayHint'
  | 'bulkChoiceHint'
  | 'closeMultipleQuestions'
  | 'save'
  | 'mathEditor'
  | 'mathEditorHint'
  | 'equation'
  | 'insertedLatexHint'
  | 'insert'
  | 'addAnswer'
  | 'addAnswerShortHint'
  | 'addAnswerEssayHint'
  | 'addAnswerDefaultHint'
  | 'enterAnswer'
  | 'openMathEditorAnswer'
  | 'uploadAnswerFile'
  | 'removeAnswerFile'
  | 'answerDescription'
  | 'answerFile'
  | 'answerImage'
  | 'mediaFile'
  | 'questionOrMediaRequired'
  | 'answerRequired'
  | 'trueFalseRequired'
  | 'unableToSaveQuestion'
  | 'unableToUpdateAnswer'
  | 'missingCurriculumContext'
  | 'shortAnswerTooLong'
  | 'oneAnswerOnly'
  | 'singleAnswerQuestionError'
  | 'invalidQuestionsFormat'
  | 'enterAtLeastOneQuestion'
  | 'answerLinesAfterQuestion'
  | 'invalidChoiceFormat'
  | 'invalidTrueFalseFormat'
  | 'questionMustHaveAnswer'
  | 'questionMustHaveCorrect'
  | 'questionMustHaveOneCorrect'
  | 'questionMustHaveOneAnswer'
  | 'questionAnswerTooLong'
  | 'questionHasEmptyAnswer'
  | 'unableToSaveQuestions'
  | 'unableToSaveAnswer'
  | 'enterQuestionBeforeAnswer';

const QUESTION_CREATE_LABELS: Record<QuestionCreateLabelKey, { en: string; ar: string }> = {
  subject: { en: 'Subject', ar: 'المادة' },
  subjectDetails: { en: 'Subject Details', ar: 'تفاصيل المادة' },
  curriculum: { en: 'Curriculum', ar: 'المنهج' },
  addQuestion: { en: 'Add Question', ar: 'إضافة سؤال' },
  editQuestion: { en: 'Edit Question', ar: 'تعديل السؤال' },
  saveQuestion: { en: 'Save Question', ar: 'حفظ السؤال' },
  saving: { en: 'Saving...', ar: 'جاري الحفظ...' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  loadingTitle: { en: 'Loading curriculum details', ar: 'جاري تحميل تفاصيل المنهج' },
  loadingText: { en: 'Please wait while the question form is prepared.', ar: 'يرجى الانتظار حتى يتم تجهيز نموذج السؤال.' },
  loadErrorTitle: { en: 'Unable to load curriculum details', ar: 'تعذر تحميل تفاصيل المنهج' },
  backToCurriculum: { en: 'Back to Curriculum', ar: 'العودة إلى المنهج' },
  questionInformation: { en: 'Question Information', ar: 'بيانات السؤال' },
  questionInformationHint: { en: 'Choose the type, write the question, then add answers when needed.', ar: 'اختر النوع، اكتب السؤال، ثم أضف الإجابات عند الحاجة.' },
  analyticalData: { en: 'Analytical Data', ar: 'البيانات التحليلية' },
  analyticalDataHint: { en: 'Attach analytical metadata to this question.', ar: 'اربط بيانات تحليلية بهذا السؤال.' },
  topic: { en: 'Topic', ar: 'الموضوع' },
  bloomTaxonomy: { en: "Bloom's Taxonomy", ar: 'تصنيف بلوم' },
  selectBloomTaxonomy: { en: "Select Bloom's Taxonomy level", ar: 'اختر مستوى تصنيف بلوم' },
  searchBloomTaxonomy: { en: "Search Bloom's Taxonomy...", ar: 'بحث في تصنيف بلوم...' },
  noBloomTaxonomyFound: { en: "No Bloom's Taxonomy levels found", ar: 'لا توجد مستويات تصنيف بلوم' },
  loadingBloomTaxonomy: { en: "Loading Bloom's Taxonomy levels...", ar: 'جاري تحميل مستويات تصنيف بلوم...' },
  unableToLoadBloomTaxonomy: { en: "Unable to load Bloom's Taxonomy levels.", ar: 'تعذر تحميل مستويات تصنيف بلوم.' },
  difficulty: { en: 'Difficulty', ar: 'الصعوبة' },
  skill: { en: 'Skill', ar: 'المهارة' },
  selectSkill: { en: 'Select skill', ar: 'اختر المهارة' },
  searchSkills: { en: 'Search skills...', ar: 'بحث في المهارات...' },
  noSkillsFound: { en: 'No skills found', ar: 'لا توجد مهارات' },
  loadingSkills: { en: 'Loading skills...', ar: 'جاري تحميل المهارات...' },
  unableToLoadSkills: { en: 'Unable to load skills.', ar: 'تعذر تحميل المهارات.' },
  addSkillValue: { en: 'Add skill', ar: 'إضافة مهارة' },
  enterSkillBeforeAdd: { en: 'Type a skill name before adding it.', ar: 'اكتب اسم المهارة قبل إضافتها.' },
  unableToSaveSkill: { en: 'Unable to save skill. Please try again.', ar: 'تعذر حفظ المهارة. حاول مرة أخرى.' },
  loadingQuestionDifficulties: { en: 'Loading question difficulties...', ar: 'جاري تحميل مستويات صعوبة السؤال...' },
  unableToLoadQuestionDifficulties: { en: 'Unable to load question difficulties.', ar: 'تعذر تحميل مستويات صعوبة السؤال.' },
  selected: { en: 'Selected', ar: 'محدد' },
  theWeight: { en: 'The Weight', ar: 'الوزن' },
  enterWeight: { en: 'Enter weight', ar: 'أدخل الوزن' },
  applicationData: { en: 'Application Data', ar: 'بيانات تطبيقية' },
  applicationDataHint: { en: 'Attach usage, source, and review metadata.', ar: 'حرك - اسحب واستراجع من التحليل.' },
  tags: { en: 'Tags', ar: 'الوسوم (Tags)' },
  suggestedTags: { en: 'Suggested tags', ar: 'اقتراحات (لمنع التكرار):' },
  writeTag: { en: 'Write a tag...', ar: 'اكتب وسم...' },
  optional: { en: 'Optional', ar: 'اختياري' },
  questionSource: { en: 'Question Source', ar: 'مصدر السؤال' },
  answerExplanation: { en: 'Answer Explanation', ar: 'شرح الإجابة (تغذية راجعة)' },
  selectQuestionSource: { en: 'Select source', ar: 'اختر المصدر' },
  searchQuestionSources: { en: 'Search sources...', ar: 'بحث في المصادر...' },
  noQuestionSourcesFound: { en: 'No sources found', ar: 'لا توجد مصادر' },
  loadingQuestionSources: { en: 'Loading question sources...', ar: 'جاري تحميل مصادر الأسئلة...' },
  unableToLoadQuestionSources: { en: 'Unable to load question sources.', ar: 'تعذر تحميل مصادر الأسئلة.' },
  addQuestionSourceValue: { en: 'Add source', ar: 'إضافة مصدر' },
  enterQuestionSourceBeforeAdd: { en: 'Type a source name before adding it.', ar: 'اكتب اسم المصدر قبل إضافته.' },
  type: { en: 'Type', ar: 'النوع' },
  loadingQuestionTypes: { en: 'Loading question types...', ar: 'جاري تحميل أنواع الأسئلة...' },
  unableToLoadQuestionTypes: { en: 'Unable to load question types', ar: 'تعذر تحميل أنواع الأسئلة' },
  selectQuestionType: { en: 'Select question type', ar: 'اختر نوع السؤال' },
  searchQuestionTypes: { en: 'Search question types...', ar: 'بحث في أنواع الأسئلة...' },
  noQuestionTypesFound: { en: 'No question types found', ar: 'لا توجد أنواع أسئلة' },
  typeRequired: { en: 'Type is required.', ar: 'نوع السؤال مطلوب.' },
  multipleQuestions: { en: 'Multiple Questions', ar: 'أسئلة متعددة' },
  multipleQuestionsHint: { en: 'Paste many questions in one overlay.', ar: 'ألصق عدة أسئلة في نافذة واحدة.' },
  singleQuestion: { en: 'Single Question', ar: 'سؤال واحد' },
  singleQuestionHint: { en: 'Use the current question and answer form.', ar: 'استخدم نموذج السؤال والإجابة الحالي.' },
  question: { en: 'Question', ar: 'السؤال' },
  questionEditor: { en: 'Question editor', ar: 'محرر السؤال' },
  enterQuestion: { en: 'Enter the question', ar: 'أدخل السؤال' },
  openMathEditor: { en: 'Open MathLive editor', ar: 'فتح محرر MathLive' },
  uploadMediaOption: { en: 'Upload media option', ar: 'رفع ملف للسؤال' },
  removeMediaOption: { en: 'Remove media option', ar: 'حذف ملف السؤال' },
  answer: { en: 'Answer', ar: 'الإجابة' },
  answers: { en: 'Answers', ar: 'الإجابات' },
  selectTrueFalse: { en: 'Select whether the question statement is true or false.', ar: 'حدد هل عبارة السؤال صحيحة أم خاطئة.' },
  true: { en: 'True', ar: 'صح' },
  false: { en: 'False', ar: 'خطأ' },
  correct: { en: 'Correct', ar: 'صحيحة' },
  add: { en: 'Add', ar: 'إضافة' },
  noAnswers: { en: 'No answers added yet.', ar: 'لم تتم إضافة إجابات بعد.' },
  description: { en: 'Description', ar: 'الوصف' },
  addNotes: { en: 'Add notes or explanation', ar: 'أضف ملاحظات أو شرح' },
  curriculumItem: { en: 'Curriculum Item', ar: 'عنصر المنهج' },
  currentItem: { en: 'Current item', ar: 'العنصر الحالي' },
  path: { en: 'Path', ar: 'المسار' },
  tip: { en: 'For multiple-choice questions, save the question first or add answers here so the options are linked to this curriculum item.', ar: 'في أسئلة الاختيار من متعدد، احفظ السؤال أولاً أو أضف الإجابات هنا حتى ترتبط الخيارات بعنصر المنهج.' },
  bulkTrueFalseHint: { en: 'Each question starts with q : or س :, ends with ? or ؟, then comma and true, false, or صح.', ar: 'يبدأ كل سؤال بـ q : أو س : وينتهي بـ ? أو ؟ ثم فاصلة ثم true أو false أو صح.' },
  bulkShortAnswerHint: { en: 'Each question starts with Q : or س : and ends with ? or ؟. Add one answer that starts with - then tab space. Mark it correct, and keep it to 5 words or fewer.', ar: 'يبدأ كل سؤال بـ Q : أو س : وينتهي بـ ? أو ؟. أضف إجابة واحدة تبدأ بـ - ثم مسافة Tab. اجعلها صحيحة وبحد أقصى 5 كلمات.' },
  bulkEssayHint: { en: 'Each question starts with Q : or س : and ends with ? or ؟. Add one answer that starts with - then tab space. Essay answers can use unlimited words.', ar: 'يبدأ كل سؤال بـ Q : أو س : وينتهي بـ ? أو ؟. أضف إجابة واحدة تبدأ بـ - ثم مسافة Tab. إجابات المقال بدون حد للكلمات.' },
  bulkChoiceHint: { en: 'Each question starts with Q : or س : and ends with ? or ؟. Each answer starts with - then tab space. Correct answers use correct or صح before a comma.', ar: 'يبدأ كل سؤال بـ Q : أو س : وينتهي بـ ? أو ؟. تبدأ كل إجابة بـ - ثم مسافة Tab. الإجابات الصحيحة تستخدم correct أو صح قبل الفاصلة.' },
  closeMultipleQuestions: { en: 'Close multiple questions overlay', ar: 'إغلاق نافذة الأسئلة المتعددة' },
  save: { en: 'Save', ar: 'حفظ' },
  mathEditor: { en: 'MathLive Editor', ar: 'محرر MathLive' },
  mathEditorHint: { en: 'Write the equation, then insert it into the selected field.', ar: 'اكتب المعادلة، ثم أدرجها في الحقل المحدد.' },
  equation: { en: 'Equation', ar: 'المعادلة' },
  insertedLatexHint: { en: 'Inserted value is saved as LaTeX in the selected text.', ar: 'سيتم حفظ القيمة المدرجة بصيغة LaTeX داخل النص المحدد.' },
  insert: { en: 'Insert', ar: 'إدراج' },
  addAnswer: { en: 'Add Answer', ar: 'إضافة إجابة' },
  addAnswerShortHint: { en: 'Add one answer only, no more than 5 words.', ar: 'أضف إجابة واحدة فقط، بحد أقصى 5 كلمات.' },
  addAnswerEssayHint: { en: 'Add one answer only. Essay answers can use unlimited words.', ar: 'أضف إجابة واحدة فقط. إجابات المقال بدون حد للكلمات.' },
  addAnswerDefaultHint: { en: 'Add the answer text and optional notes shown in the answer table.', ar: 'أضف نص الإجابة والملاحظات الاختيارية التي تظهر في جدول الإجابات.' },
  enterAnswer: { en: 'Enter answer', ar: 'أدخل الإجابة' },
  openMathEditorAnswer: { en: 'Open MathLive editor for answer', ar: 'فتح محرر MathLive للإجابة' },
  uploadAnswerFile: { en: 'Upload answer file', ar: 'رفع ملف للإجابة' },
  removeAnswerFile: { en: 'Remove answer file', ar: 'حذف ملف الإجابة' },
  answerDescription: { en: 'Answer description', ar: 'وصف الإجابة' },
  answerFile: { en: 'Answer file', ar: 'ملف الإجابة' },
  answerImage: { en: 'Answer image', ar: 'صورة الإجابة' },
  mediaFile: { en: 'Media file', ar: 'ملف وسائط' },
  questionOrMediaRequired: { en: 'Question or media file is required.', ar: 'السؤال أو ملف الوسائط مطلوب.' },
  answerRequired: { en: 'Answer is required.', ar: 'الإجابة مطلوبة.' },
  trueFalseRequired: { en: 'Select True or False as the correct answer.', ar: 'اختر صح أو خطأ كإجابة صحيحة.' },
  unableToSaveQuestion: { en: 'Unable to save question. Please try again.', ar: 'تعذر حفظ السؤال. حاول مرة أخرى.' },
  unableToUpdateAnswer: { en: 'Unable to update answer. Please try again.', ar: 'تعذر تحديث الإجابة. حاول مرة أخرى.' },
  missingCurriculumContext: { en: 'Missing curriculum context.', ar: 'بيانات المنهج غير مكتملة.' },
  shortAnswerTooLong: { en: 'Short Answer must be no more than 5 words.', ar: 'يجب ألا تزيد الإجابة القصيرة عن 5 كلمات.' },
  oneAnswerOnly: { en: 'questions can have one answer only.', ar: 'يمكن أن يحتوي على إجابة واحدة فقط.' },
  singleAnswerQuestionError: { en: 'questions must have one answer only.', ar: 'يجب أن يحتوي على إجابة واحدة فقط.' },
  invalidQuestionsFormat: { en: 'Invalid questions format.', ar: 'تنسيق الأسئلة غير صحيح.' },
  enterAtLeastOneQuestion: { en: 'Enter at least one question.', ar: 'أدخل سؤالاً واحداً على الأقل.' },
  answerLinesAfterQuestion: { en: 'Answer lines must come after a question line.', ar: 'يجب أن تأتي أسطر الإجابة بعد سطر السؤال.' },
  invalidChoiceFormat: { en: 'Invalid format. Questions must start with Q : or س : and answers must start with -.', ar: 'تنسيق غير صحيح. يجب أن تبدأ الأسئلة بـ Q : أو س : وأن تبدأ الإجابات بـ -.' },
  invalidTrueFalseFormat: { en: 'Invalid format. True / False questions must start with q : or س :, end with ? or ؟, then comma and true, false, or صح.', ar: 'تنسيق غير صحيح. يجب أن تبدأ أسئلة الصح والخطأ بـ q : أو س : وتنتهي بـ ? أو ؟ ثم فاصلة ثم true أو false أو صح.' },
  questionMustHaveAnswer: { en: 'must have at least one answer.', ar: 'يجب أن يحتوي على إجابة واحدة على الأقل.' },
  questionMustHaveCorrect: { en: 'must have one correct answer.', ar: 'يجب أن يحتوي على إجابة صحيحة واحدة.' },
  questionMustHaveOneCorrect: { en: 'must have exactly one correct answer.', ar: 'يجب أن يحتوي على إجابة صحيحة واحدة فقط.' },
  questionMustHaveOneAnswer: { en: 'must have one answer only.', ar: 'يجب أن يحتوي على إجابة واحدة فقط.' },
  questionAnswerTooLong: { en: 'answer must be no more than 5 words.', ar: 'يجب ألا تزيد الإجابة عن 5 كلمات.' },
  questionHasEmptyAnswer: { en: 'has an empty answer.', ar: 'يحتوي على إجابة فارغة.' },
  unableToSaveQuestions: { en: 'Unable to save questions. Please try again.', ar: 'تعذر حفظ الأسئلة. حاول مرة أخرى.' },
  unableToSaveAnswer: { en: 'Unable to save answer. Please try again.', ar: 'تعذر حفظ الإجابة. حاول مرة أخرى.' },
  enterQuestionBeforeAnswer: { en: 'Enter the question or upload media before adding answers.', ar: 'أدخل السؤال أو ارفع ملف وسائط قبل إضافة الإجابات.' },
};

const QUESTION_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  MULTIPLE_CHOICE: { en: 'Multiple Choice', ar: 'اختيار من متعدد' },
  TRUE_FALSE: { en: 'True / False', ar: 'صح / خطأ' },
  SHORT_ANSWER: { en: 'Short Answer', ar: 'إجابة قصيرة' },
  ESSAY: { en: 'Essay', ar: 'مقال' },
  MCQ: { en: 'MCQ', ar: 'اختيار إجابة واحدة' },
};

@Component({
  selector: 'app-tenant-subject-curriculum-question-create',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatIconModule, TenantGroupSearchableSelectorComponent],
  templateUrl: './tenant-subject-curriculum-question-create.component.html',
  styleUrls: ['./tenant-subject-curriculum-question-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TenantSubjectCurriculumQuestionCreateComponent implements OnInit, OnDestroy {
  @ViewChild('mathField') private readonly mathField?: ElementRef<MathfieldElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(TenantSubjectDetailsFacade);
  private readonly data = inject(TenantSubjectsDataService);
  private readonly questionTypeSettings = inject(TenantQuestionTypeSettingsService);
  private readonly questionSourceSettings = inject(TenantQuestionSourceSettingsService);
  private readonly i18n = inject(I18nService);

  readonly subject = this.facade.subject;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly curriculumLoading = signal(false);
  readonly curriculumError = signal<string | null>(null);
  readonly questionTypes = signal<TenantQuestionType[]>([]);
  readonly questionTypesLoading = signal(false);
  readonly questionTypeError = signal<string | null>(null);
  readonly questionSources = signal<TenantQuestionSource[]>([]);
  readonly questionSourcesLoading = signal(false);
  readonly questionSourcesError = signal<string | null>(null);
  readonly questionSourceSaving = signal(false);
  readonly questionSourceInlineError = signal<string | null>(null);
  readonly selectedQuestionType = signal('');
  readonly selectedBloomTaxonomyId = signal('');
  readonly selectedSkillId = signal('');
  readonly selectedQuestionSource = signal('');
  readonly selectedQuestionDifficultyId = signal('');
  readonly typeSelectorOpen = signal(false);
  readonly typeSearchQuery = signal('');
  readonly bloomTaxonomySelectorOpen = signal(false);
  readonly bloomTaxonomySearchQuery = signal('');
  readonly skillSelectorOpen = signal(false);
  readonly skillSearchQuery = signal('');
  readonly questionSourceSelectorOpen = signal(false);
  readonly questionSourceSearchQuery = signal('');
  readonly currentQuestionId = signal<string | null>(null);
  readonly editingQuestionId = signal<string | null>(null);
  readonly multipleChoiceAnswers = signal<TenantCurriculumQuestionAnswer[]>([]);
  readonly answerDrafts = signal<Record<string, AnswerDraft>>({});
  readonly multipleChoiceMode = signal<'single' | 'multiple' | null>(null);
  readonly showBulkQuestionOverlay = signal(false);
  readonly bulkQuestionsText = signal('');
  readonly bulkQuestionError = signal<string | null>(null);
  readonly bulkQuestionSaving = signal(false);
  readonly questionMediaOption = signal<QuestionMediaOption | null>(null);
  readonly questionContentError = signal<string | null>(null);
  readonly trueFalseAnswer = signal<boolean | null>(null);
  readonly trueFalseAnswerError = signal<string | null>(null);
  readonly showMathEditor = signal(false);
  readonly mathEditorValue = signal('');
  readonly mathEditorTarget = signal<'question' | 'answer' | 'answerDraft' | 'bulk'>('question');
  readonly mathEditorExistingExpression = signal<string | null>(null);
  readonly mathEditorAnswerDraftId = signal<string | null>(null);
  readonly questionSaving = signal(false);
  readonly questionSaveError = signal<string | null>(null);
  readonly applicationTags = signal<string[]>([]);
  readonly suggestedApplicationTags = signal<string[]>([
    'high-yield',
    'EXAM 2024 FINAL',
    'EXAM 2023',
    'امتحان شهر',
    'مراجعة نهائية',
    'امتحان تيرم',
    'امتحان نهائي',
    'اسئلة درس',
    'متكرر',
  ]);
  readonly bloomLevels = signal<BloomLevel[]>([]);
  readonly bloomLevelsLoading = signal(false);
  readonly bloomLevelsError = signal<string | null>(null);
  readonly questionDifficulties = signal<QuestionDifficulty[]>([]);
  readonly questionDifficultiesLoading = signal(false);
  readonly questionDifficultiesError = signal<string | null>(null);
  readonly skills = signal<TenantCurriculumSkill[]>([]);
  readonly skillsLoading = signal(false);
  readonly skillsError = signal<string | null>(null);
  readonly skillSaving = signal(false);
  readonly skillInlineError = signal<string | null>(null);
  readonly showAnswerModal = signal(false);
  readonly newAnswer = signal('');
  readonly newAnswerDescription = signal('');
  readonly newAnswerMediaOption = signal<QuestionMediaOption | null>(null);
  readonly newAnswerError = signal<string | null>(null);
  readonly answerSaving = signal(false);
  readonly answerSavingError = signal<string | null>(null);
  readonly answerUpdatingId = signal<string | null>(null);
  readonly selectedNodeId = signal<string | null>(null);
  readonly routeStageId = signal<string | null>(null);
  readonly routeGradeId = signal<string | null>(null);
  readonly curriculumRoot = signal<TenantSubjectCurriculumNode | null>(null);
  readonly questionForm = this.fb.nonNullable.group({
    question: [''],
    type: ['', Validators.required],
    answer: [''],
    description: [''],
    bloomId: [''],
    difficultyId: [''],
    skillId: [''],
    weight: [''],
    applicationTagInput: [''],
    questionSource: [''],
    answerExplanation: [''],
  });
  readonly subjectDetailsLink = computed(() => {
    const subject = this.subject();
    return subject ? [this.subjectsRootLink(), subject.id] : [this.subjectsRootLink()];
  });
  readonly curriculumLink = computed(() => {
    const subject = this.subject();
    return subject ? [this.subjectsRootLink(), subject.id, 'curriculum'] : [this.subjectsRootLink()];
  });
  readonly detailsLink = computed(() => {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    if (this.isExamQuestionRoute()) {
      return this.curriculumLink();
    }
    return subject && nodeId ? [this.subjectsRootLink(), subject.id, 'curriculum', nodeId] : this.curriculumLink();
  });
  readonly examCreateLink = computed(() => {
    if (this.isUniversityExamQuestionRoute()) {
      const universityId = this.route.snapshot?.paramMap?.get('universityId');
      const collegeId = this.route.snapshot?.paramMap?.get('collegeId');
      return universityId && collegeId
        ? [this.universityEducationExamsRoot(), universityId, 'colleges', collegeId, 'create', 'new']
        : [this.universityEducationExamsRoot()];
    }
    const stageId = this.routeStageId();
    const gradeId = this.routeGradeId();
    return stageId && gradeId
      ? [this.basicEducationExamsRoot(), stageId, 'grades', gradeId, 'create', 'new']
      : [this.basicEducationExamsRoot()];
  });
  readonly examCreateQueryParams = computed(() => {
    const subjectId = this.subject()?.id ?? null;
    if (!subjectId) {
      return null;
    }
    const examId = this.route.snapshot?.queryParamMap?.get('examId') ?? null;
    return examId ? { subjectId, examId } : { subjectId };
  });
  readonly isEditMode = computed(() => !!this.editingQuestionId());
  readonly pageTitle = computed(() => this.isEditMode() ? this.label('editQuestion') : this.label('addQuestion'));
  readonly saveButtonLabel = computed(() => this.label('saveQuestion'));
  readonly selectedNode = computed(() => {
    const root = this.curriculumRoot();
    const nodeId = this.selectedNodeId();
    return root && nodeId ? this.findNode([root], nodeId) : null;
  });
  readonly selectedPath = computed<CurriculumPathItem[]>(() => {
    const root = this.curriculumRoot();
    const nodeId = this.selectedNodeId();
    return root && nodeId ? this.findNodePath([root], nodeId) : [];
  });
  readonly curriculumScopeLabel = computed(() => {
    const root = this.curriculumRoot();
    const subject = this.subject();
    if (root?.label) {
      return this.breadcrumbPathLabel(root, true);
    }
    if (subject) {
      return this.isArabic() ? `منهج ${subject.name}` : `${subject.name} Curriculum`;
    }
    return this.label('curriculum');
  });
  readonly curriculumContextPath = computed<CurriculumPathItem[]>(() => {
    if (this.isExamQuestionRoute()) {
      const root = this.curriculumRoot();
      return [{
        id: root?.id ?? 'curriculum',
        label: this.curriculumScopeLabel(),
      }];
    }
    return this.selectedPath();
  });
  readonly curriculumContextTitle = computed(() => {
    if (this.isExamQuestionRoute()) {
      return this.curriculumScopeLabel();
    }
    return this.selectedNode()?.label ?? this.curriculumScopeLabel();
  });
  readonly curriculumContextDescription = computed(() => {
    if (this.isExamQuestionRoute()) {
      return this.curriculumRoot()?.description ?? null;
    }
    return this.selectedNode()?.description ?? null;
  });
  readonly questionTypeOptions = computed<TenantGroupSelectorOption[]>(() => {
    const query = this.typeSearchQuery().trim().toLowerCase();
    return this.questionTypes()
      .filter((type) => {
        if (!query) {
          return true;
        }
        return type.name.toLowerCase().includes(query) || type.code.toLowerCase().includes(query);
      })
      .map((type) => ({
        id: type.code,
        name: this.questionTypeLabel(type.code, type.name),
        subtitle: type.code,
      }));
  });
  readonly selectedQuestionTypeLabel = computed(() => {
    const code = this.selectedQuestionType();
    const type = this.questionTypes().find((item) => item.code === code);
    return type ? this.questionTypeLabel(type.code, type.name) : '';
  });
  readonly bloomTaxonomyOptions = computed<TenantGroupSelectorOption[]>(() => {
    const query = this.bloomTaxonomySearchQuery().trim().toLowerCase();
    return this.bloomLevels()
      .filter((level) => {
        if (!query) {
          return true;
        }
        return [level.code, level.nameEn, level.nameAr, String(level.levelOrder)]
          .some((value) => value.toLowerCase().includes(query));
      })
      .map((level) => ({
        id: level.id,
        name: this.bloomLevelLabel(level),
        subtitle: level.code,
      }));
  });
  readonly selectedBloomTaxonomyLabel = computed(() => {
    const selectedId = this.selectedBloomTaxonomyId();
    const level = this.bloomLevels().find((item) => item.id === selectedId);
    return level ? this.bloomLevelLabel(level) : '';
  });
  readonly skillOptions = computed<TenantGroupSelectorOption[]>(() => {
    const query = this.skillSearchQuery().trim().toLowerCase();
    return this.skills()
      .filter((skill) => {
        if (!query) {
          return true;
        }
        return skill.name.toLowerCase().includes(query) || (skill.description ?? '').toLowerCase().includes(query);
      })
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        subtitle: skill.description ?? undefined,
      }));
  });
  readonly selectedSkillLabel = computed(() => {
    const selectedId = this.selectedSkillId();
    return this.skills().find((item) => item.id === selectedId)?.name ?? '';
  });
  readonly selectedQuestionDifficultyLabel = computed(() => {
    const selectedId = this.selectedQuestionDifficultyId();
    const difficulty = this.questionDifficulties().find((item) => item.id === selectedId);
    return difficulty ? this.questionDifficultyLabel(difficulty) : '';
  });
  readonly questionSourceOptions = computed<TenantGroupSelectorOption[]>(() => {
    const query = this.questionSourceSearchQuery().trim().toLowerCase();
    return this.questionSources()
      .filter((source) => {
        if (!query) {
          return true;
        }
        return source.source.toLowerCase().includes(query) || (source.description ?? '').toLowerCase().includes(query);
      })
      .map((source) => ({
        id: source.id,
        name: source.source,
        subtitle: source.description ?? undefined,
      }));
  });
  readonly selectedQuestionSourceLabel = computed(() => this.selectedQuestionSource());
  readonly questionSourceOptionalLabel = computed(() => `${this.label('questionSource')} (${this.label('optional')})`);
  readonly addSkillFooterLabel = computed(() => {
    const value = this.skillSearchQuery().trim();
    return value ? `${this.label('addSkillValue')}: ${value}` : this.label('addSkillValue');
  });
  readonly addQuestionSourceFooterLabel = computed(() => {
    const value = this.questionSourceSearchQuery().trim();
    return value ? `${this.label('addQuestionSourceValue')}: ${value}` : this.label('addQuestionSourceValue');
  });
  readonly typeSelectorPlaceholder = computed(() => {
    if (this.questionTypesLoading()) {
      return this.label('loadingQuestionTypes');
    }
    if (this.questionTypeError()) {
      return this.label('unableToLoadQuestionTypes');
    }
    return this.label('selectQuestionType');
  });
  readonly bloomTaxonomyPlaceholder = computed(() => {
    if (this.bloomLevelsLoading()) {
      return this.label('loadingBloomTaxonomy');
    }
    if (this.bloomLevelsError()) {
      return this.label('unableToLoadBloomTaxonomy');
    }
    return this.label('selectBloomTaxonomy');
  });
  readonly skillPlaceholder = computed(() => {
    if (this.skillsLoading()) {
      return this.label('loadingSkills');
    }
    if (this.skillsError()) {
      return this.label('unableToLoadSkills');
    }
    return this.label('selectSkill');
  });
  readonly questionSourcePlaceholder = computed(() => {
    if (this.questionSourcesLoading()) {
      return this.label('loadingQuestionSources');
    }
    if (this.questionSourcesError()) {
      return this.label('unableToLoadQuestionSources');
    }
    return this.label('selectQuestionSource');
  });
  readonly hasSelectedQuestionType = computed(() => !!this.selectedQuestionType());
  readonly isMultipleChoice = computed(() => this.selectedQuestionType() === 'MULTIPLE_CHOICE');
  readonly isMcq = computed(() => this.selectedQuestionType() === 'MCQ');
  readonly isTrueFalse = computed(() => this.selectedQuestionType() === 'TRUE_FALSE');
  readonly isShortAnswer = computed(() => this.selectedQuestionType() === 'SHORT_ANSWER');
  readonly isEssay = computed(() => this.selectedQuestionType() === 'ESSAY');
  readonly isChoiceQuestionType = computed(() => this.isMultipleChoice() || this.isMcq() || this.isTrueFalse() || this.isShortAnswer() || this.isEssay());
  readonly answerCorrectHint = computed(() => {
    if (this.isShortAnswer()) {
      return this.label('addAnswerShortHint');
    }
    if (this.isEssay()) {
      return this.label('addAnswerEssayHint');
    }
    return this.isMcq()
      ? (this.isArabic() ? 'حدد إجابة واحدة كإجابة صحيحة.' : 'Mark one answer as correct.')
      : (this.isArabic() ? 'حدد إجابة واحدة أو أكثر كإجابة صحيحة.' : 'Mark one or more answers as correct.');
  });
  readonly showSingleQuestionForm = computed(() => this.hasSelectedQuestionType() && (!this.isChoiceQuestionType() || this.isEditMode() || this.multipleChoiceMode() === 'single'));

  @HostListener('document:click')
  closeOpenPanels(): void {
    this.typeSelectorOpen.set(false);
    this.bloomTaxonomySelectorOpen.set(false);
    this.skillSelectorOpen.set(false);
    this.questionSourceSelectorOpen.set(false);
  }

  ngOnInit(): void {
    this.selectedQuestionType.set(this.questionForm.controls.type.value);
    this.selectedBloomTaxonomyId.set(this.questionForm.controls.bloomId.value);
    this.selectedSkillId.set(this.questionForm.controls.skillId.value);
    this.selectedQuestionSource.set(this.questionForm.controls.questionSource.value);
    this.selectedQuestionDifficultyId.set(this.questionForm.controls.difficultyId.value);
    this.questionForm.controls.type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedQuestionType.set(value));
    this.questionForm.controls.bloomId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedBloomTaxonomyId.set(value));
    this.questionForm.controls.skillId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedSkillId.set(value));
    this.questionForm.controls.questionSource.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedQuestionSource.set(value));
    this.questionForm.controls.difficultyId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedQuestionDifficultyId.set(value));
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.routeStageId.set(params.get('stageId'));
        this.routeGradeId.set(params.get('gradeId'));
        this.selectedNodeId.set(params.get('nodeId'));
        this.editingQuestionId.set(params.get('questionId'));
        this.currentQuestionId.set(params.get('questionId'));
        void this.loadSubjectAndCurriculum(params.get('id'));
        void this.loadQuestionTypes();
        void this.loadQuestionSources();
        void this.loadBloomLevels();
        void this.loadQuestionDifficulties();
      });
  }

  ngOnDestroy(): void {
    this.revokeQuestionMediaPreview();
    this.revokeAnswerMediaPreview();
  }

  cancel(): void {
    if (this.isExamQuestionRoute()) {
      void this.router.navigate(this.examCreateLink(), { queryParams: this.examCreateQueryParams() });
      return;
    }

    void this.router.navigate(this.detailsLink());
  }

  usesBasicEducationQuestionBankStore(): boolean {
    return (this.isExamQuestionRoute() && !this.isUniversityExamQuestionRoute()) || this.router.url.startsWith('/tenant/questions-bank/basic-education');
  }

  isExamQuestionRoute(): boolean {
    return this.isBasicEducationExamQuestionRoute() || this.isUniversityExamQuestionRoute();
  }

  private isBasicEducationExamQuestionRoute(): boolean {
    return this.router.url.startsWith('/tenant/exams/basic-education') || this.router.url.startsWith('/teacher/exams/basic-education');
  }

  private isUniversityExamQuestionRoute(): boolean {
    return this.router.url.startsWith('/tenant/exams/university-education') || this.router.url.startsWith('/teacher/exams/university-education');
  }

  isArabic(): boolean {
    return this.i18n.language() === 'ar';
  }

  pageDirection(): 'rtl' | 'ltr' {
    return this.isArabic() ? 'rtl' : 'ltr';
  }

  label(key: QuestionCreateLabelKey): string {
    return QUESTION_CREATE_LABELS[key][this.i18n.language()];
  }

  bloomLevelLabel(level: BloomLevel): string {
    const name = this.isArabic() ? level.nameAr : level.nameEn;
    return `${level.levelOrder}. ${name}`;
  }

  questionDifficultyLabel(difficulty: QuestionDifficulty): string {
    return this.isArabic() ? difficulty.nameAr : difficulty.nameEn;
  }

  questionDifficultyDescription(difficulty: QuestionDifficulty): string {
    return (this.isArabic() ? difficulty.descriptionAr : difficulty.descriptionEn) ?? difficulty.code;
  }

  selectQuestionDifficulty(difficultyId: string): void {
    const control = this.questionForm.controls.difficultyId;
    control.setValue(control.value === difficultyId ? '' : difficultyId);
    control.markAsDirty();
    control.markAsTouched();
  }

  setQuestionWeightValue(value: string): void {
    const digitsOnly = value.replace(/\D/g, '');
    this.questionForm.controls.weight.setValue(digitsOnly);
    this.questionForm.controls.weight.markAsDirty();
  }

  preventNonNumericWeightInput(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab'];
    if (allowedKeys.includes(event.key) || /^\d$/.test(event.key)) {
      return;
    }
    event.preventDefault();
  }

  pasteQuestionWeightValue(event: ClipboardEvent): void {
    event.preventDefault();
    this.setQuestionWeightValue(event.clipboardData?.getData('text') ?? '');
  }

  addApplicationTag(tag: string): void {
    const normalizedTag = tag.trim();
    if (!normalizedTag || this.applicationTags().some((item) => item.toLowerCase() === normalizedTag.toLowerCase())) {
      this.questionForm.controls.applicationTagInput.setValue('');
      return;
    }
    this.applicationTags.update((tags) => [...tags, normalizedTag]);
    this.questionForm.controls.applicationTagInput.setValue('');
  }

  removeApplicationTag(tag: string): void {
    this.applicationTags.update((tags) => tags.filter((item) => item !== tag));
  }

  addApplicationTagFromKeyboard(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    this.addApplicationTag(this.questionForm.controls.applicationTagInput.value);
  }

  breadcrumbSeparatorIcon(): string {
    return this.isArabic() ? 'chevron_left' : 'chevron_right';
  }

  subjectsListLink(): unknown[] {
    return [this.subjectsRootLink()];
  }

  breadcrumbPathLabel(item: CurriculumPathItem, first: boolean): string {
    const subject = this.subject();
    if (first && this.isArabic()) {
      return subject ? `منهج ${subject.name}` : 'منهج اسم المادة';
    }
    return item.label;
  }

  pathItemIcon(): string {
    return this.isArabic() ? 'chevron_left' : 'chevron_right';
  }

  questionTypeLabel(code: string, fallback: string): string {
    return QUESTION_TYPE_LABELS[code]?.[this.i18n.language()] ?? fallback;
  }

  inputPaddingWithActions(): string {
    return this.isArabic() ? 'pl-20' : 'pr-20';
  }

  singleInputPaddingWithAction(): string {
    return this.isArabic() ? 'pl-12' : 'pr-12';
  }

  mathActionPosition(offset: 'near' | 'far'): string {
    if (this.isArabic()) {
      return offset === 'near' ? 'left-1' : 'left-10';
    }
    return offset === 'near' ? 'right-1' : 'right-10';
  }

  topMathActionPosition(): string {
    return this.isArabic() ? 'left-2' : 'right-2';
  }

  bulkQuestionPlaceholder(): string {
    if (this.isTrueFalse()) {
      return 'q : Water boils at 100 degrees? , true\nس : الشمس تشرق من الشرق؟ , صح';
    }
    if (this.isShortAnswer()) {
      return this.isArabic()
        ? 'س : ما اسم الدرس؟\n-\tصح, الدرس الأول'
        : 'Q : What is the lesson title?\n-\tcorrect, Lesson 1';
    }
    if (this.isEssay()) {
      return this.isArabic()
        ? 'س : اشرح فكرة الدرس؟\n-\tصح, اكتب اجابة المقال كاملة هنا بدون حد للكلمات.'
        : 'Q : Explain the lesson idea?\n-\tcorrect, Write the full essay answer here with as many words as needed.';
    }
    return this.isArabic()
      ? 'س : ما اسم الدرس؟\n-\tصح, الدرس الأول\n-\tالدرس الثاني'
      : 'Q : What is the lesson title?\n-\tcorrect, Lesson 1\n-\tLesson 2';
  }

  answerModalHint(): string {
    if (this.isShortAnswer()) {
      return this.label('addAnswerShortHint');
    }
    if (this.isEssay()) {
      return this.label('addAnswerEssayHint');
    }
    return this.label('addAnswerDefaultHint');
  }

  bulkQuestionHint(): string {
    if (this.isTrueFalse()) {
      return this.label('bulkTrueFalseHint');
    }
    if (this.isShortAnswer()) {
      return this.label('bulkShortAnswerHint');
    }
    if (this.isEssay()) {
      return this.label('bulkEssayHint');
    }
    return this.label('bulkChoiceHint');
  }

  formatQuestionError(question: string, key: 'questionMustHaveAnswer' | 'questionMustHaveCorrect' | 'questionMustHaveOneCorrect' | 'questionMustHaveOneAnswer' | 'questionAnswerTooLong' | 'questionHasEmptyAnswer'): string {
    return this.isArabic()
      ? `السؤال "${question}" ${this.label(key)}`
      : `Question "${question}" ${this.label(key)}`;
  }

  async saveQuestion(): Promise<void> {
    this.questionContentError.set(null);
    if (!this.hasQuestionContent()) {
      this.questionContentError.set(this.label('questionOrMediaRequired'));
    }
    if (this.questionForm.invalid || this.questionContentError()) {
      this.questionForm.markAllAsTouched();
      return;
    }
    if (this.isEditMode() && this.isChoiceQuestionType() && this.hasBlankAnswerDraft()) {
      this.questionSaveError.set(this.isSingleAnswerQuestionType()
        ? `${this.selectedQuestionTypeLabel()} ${this.label('questionMustHaveOneAnswer')}`
        : this.label('answerRequired'));
      return;
    }
    if (this.isSingleAnswerQuestionType() && this.showSingleQuestionForm() && this.multipleChoiceAnswers().length !== 1) {
      this.questionSaveError.set(`${this.selectedQuestionTypeLabel()} ${this.label('singleAnswerQuestionError')}`);
      return;
    }
    if (this.isTrueFalse() && this.showSingleQuestionForm() && this.trueFalseAnswer() === null) {
      this.trueFalseAnswerError.set(this.label('trueFalseRequired'));
      return;
    }

    this.questionSaving.set(true);
    this.questionSaveError.set(null);
    try {
      const saved = await this.saveQuestionToBackend();
      if (this.isTrueFalse() && this.showSingleQuestionForm()) {
        await this.saveTrueFalseAnswers(saved.id);
      } else if (this.isEditMode() && this.isChoiceQuestionType()) {
        await this.saveAnswerDrafts(saved.id);
      }
      this.rememberExamQuestion(saved.id);
      await this.attachQuestionToEditingExam(saved.id);
      this.navigateAfterQuestionSave();
    } catch (error) {
      this.questionSaveError.set(
        error instanceof Error && error.message === 'Answer is required.'
          ? this.label('answerRequired')
          : this.data.toUserMessage(error, this.label('unableToSaveQuestion')),
      );
    } finally {
      this.questionSaving.set(false);
    }
  }

  openAnswerModal(): void {
    this.newAnswer.set('');
    this.newAnswerDescription.set('');
    this.revokeAnswerMediaPreview();
    this.newAnswerMediaOption.set(null);
    this.newAnswerError.set(null);
    this.answerSavingError.set(null);
    this.showAnswerModal.set(true);
  }

  closeAnswerModal(): void {
    if (this.answerSaving()) {
      return;
    }
    this.showAnswerModal.set(false);
    this.newAnswer.set('');
    this.newAnswerDescription.set('');
    this.revokeAnswerMediaPreview();
    this.newAnswerMediaOption.set(null);
    this.newAnswerError.set(null);
    this.answerSavingError.set(null);
  }

  setNewAnswer(value: string): void {
    this.newAnswer.set(value);
    this.newAnswerError.set(null);
  }

  setNewAnswerDescription(value: string): void {
    this.newAnswerDescription.set(value);
  }

  onAnswerMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      return;
    }

    this.revokeAnswerMediaPreview();
    const previewUrl = URL.createObjectURL(file);
    this.newAnswerMediaOption.set({
      name: file.name,
      size: file.size,
      type: file.type || this.label('mediaFile'),
      previewUrl,
      kind: this.resolveMediaKind(file.type),
      file,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: file.name,
      mediaContentType: file.type || null,
      mediaSizeBytes: file.size,
    });
    input.value = '';
  }

  removeAnswerMedia(): void {
    this.revokeAnswerMediaPreview();
    this.newAnswerMediaOption.set(null);
  }

  setQuestionValue(value: string): void {
    this.questionForm.controls.question.setValue(value);
    if (value.trim() || this.questionMediaOption()) {
      this.questionContentError.set(null);
    }
  }

  toggleTypeSelector(): void {
    this.typeSelectorOpen.update((isOpen) => !isOpen);
  }

  setTypeSearchQuery(value: string): void {
    this.typeSearchQuery.set(value);
  }

  toggleBloomTaxonomySelector(): void {
    this.bloomTaxonomySelectorOpen.update((isOpen) => !isOpen);
  }

  setBloomTaxonomySearchQuery(value: string): void {
    this.bloomTaxonomySearchQuery.set(value);
  }

  selectBloomTaxonomy(name: string): void {
    const selected = this.bloomLevels().find((level) => level.id === name || this.bloomLevelLabel(level) === name);
    if (!selected) {
      return;
    }
    this.questionForm.controls.bloomId.setValue(selected.id);
    this.questionForm.controls.bloomId.markAsDirty();
    this.questionForm.controls.bloomId.markAsTouched();
    this.bloomTaxonomySearchQuery.set('');
    this.bloomTaxonomySelectorOpen.set(false);
  }

  toggleSkillSelector(): void {
    this.skillSelectorOpen.update((isOpen) => !isOpen);
  }

  setSkillSearchQuery(value: string): void {
    this.skillSearchQuery.set(value);
    this.skillInlineError.set(null);
  }

  selectSkill(name: string): void {
    const selected = this.skills().find((skill) => skill.id === name || skill.name === name);
    if (!selected) {
      return;
    }
    this.questionForm.controls.skillId.setValue(selected.id);
    this.questionForm.controls.skillId.markAsDirty();
    this.questionForm.controls.skillId.markAsTouched();
    this.skillSearchQuery.set('');
    this.skillSelectorOpen.set(false);
  }

  async addSkillFromSearch(): Promise<void> {
    const name = this.skillSearchQuery().trim();
    if (!name) {
      this.skillInlineError.set(this.label('enterSkillBeforeAdd'));
      return;
    }
    const existing = this.skills().find((skill) => skill.name.trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      this.selectSkill(existing.id);
      return;
    }
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    if (!subject || !nodeId) {
      this.skillInlineError.set(this.label('missingCurriculumContext'));
      return;
    }
    this.skillSaving.set(true);
    this.skillInlineError.set(null);
    try {
      const educationCategory = this.routeEducationCategory();
      const created = educationCategory
        ? await this.data.createCurriculumSkillForCategory(subject.id, nodeId, educationCategory, { name, description: null })
        : await this.data.createCurriculumSkill(subject.id, nodeId, { name, description: null });
      this.skills.update((skills) => [...skills, created]);
      this.questionForm.controls.skillId.setValue(created.id);
      this.questionForm.controls.skillId.markAsDirty();
      this.questionForm.controls.skillId.markAsTouched();
      this.skillSearchQuery.set('');
      this.skillSelectorOpen.set(false);
    } catch (error) {
      this.skillInlineError.set(this.data.toUserMessage(error, this.label('unableToSaveSkill')));
    } finally {
      this.skillSaving.set(false);
    }
  }

  toggleQuestionSourceSelector(): void {
    this.questionSourceSelectorOpen.update((isOpen) => !isOpen);
  }

  setQuestionSourceSearchQuery(value: string): void {
    this.questionSourceSearchQuery.set(value);
    this.questionSourceInlineError.set(null);
  }

  selectQuestionSource(name: string): void {
    const selected = this.questionSources().find((source) => source.source === name || source.id === name);
    if (!selected) {
      return;
    }
    this.questionForm.controls.questionSource.setValue(selected.source);
    this.questionForm.controls.questionSource.markAsDirty();
    this.questionForm.controls.questionSource.markAsTouched();
    this.questionSourceSearchQuery.set('');
    this.questionSourceSelectorOpen.set(false);
  }

  async addQuestionSourceFromSearch(): Promise<void> {
    const source = this.questionSourceSearchQuery().trim();
    if (!source) {
      this.questionSourceInlineError.set(this.label('enterQuestionSourceBeforeAdd'));
      return;
    }
    const existing = this.questionSources().find((item) => item.source.trim().toLowerCase() === source.toLowerCase());
    if (existing) {
      this.selectQuestionSource(existing.id);
      return;
    }
    this.questionSourceSaving.set(true);
    this.questionSourceInlineError.set(null);
    try {
      const created = await this.questionSourceSettings.createQuestionSource({
        source,
        educationCategory: this.currentQuestionSourceEducationCategory(),
        description: null,
      });
      this.questionSources.update((sources) => [...sources, created]);
      this.questionForm.controls.questionSource.setValue(created.source);
      this.questionForm.controls.questionSource.markAsDirty();
      this.questionForm.controls.questionSource.markAsTouched();
      this.questionSourceSearchQuery.set('');
      this.questionSourceSelectorOpen.set(false);
    } catch (error) {
      this.questionSourceInlineError.set(this.questionSourceSettings.toUserMessage(error));
    } finally {
      this.questionSourceSaving.set(false);
    }
  }

  selectQuestionType(name: string): void {
    const selected = this.questionTypes().find((type) => type.name === name || this.questionTypeLabel(type.code, type.name) === name || type.code === name);
    if (!selected) {
      return;
    }
    this.questionForm.controls.type.setValue(selected.code);
    this.questionForm.controls.type.markAsDirty();
    this.questionForm.controls.type.markAsTouched();
    this.selectedQuestionType.set(selected.code);
    this.multipleChoiceMode.set(this.isChoiceTypeCode(selected.code) && !this.isEditMode() ? null : 'single');
    this.trueFalseAnswer.set(null);
    this.trueFalseAnswerError.set(null);
    this.typeSearchQuery.set('');
    this.typeSelectorOpen.set(false);
  }

  selectMultipleChoiceMode(mode: 'single' | 'multiple'): void {
    this.multipleChoiceMode.set(mode);
    this.trueFalseAnswerError.set(null);
    if (mode === 'multiple') {
      this.openBulkQuestionOverlay();
    }
  }

  selectTrueFalseAnswer(value: boolean): void {
    this.trueFalseAnswer.set(value);
    this.trueFalseAnswerError.set(null);
  }

  onQuestionMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      return;
    }

    this.revokeQuestionMediaPreview();
    const previewUrl = URL.createObjectURL(file);
    this.questionMediaOption.set({
      name: file.name,
      size: file.size,
      type: file.type || this.label('mediaFile'),
      previewUrl,
      kind: this.resolveMediaKind(file.type),
      file,
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: file.name,
      mediaContentType: file.type || null,
      mediaSizeBytes: file.size,
    });
    this.questionContentError.set(null);
    input.value = '';
  }

  openMathEditor(target: 'question' | 'answer' | 'bulk' = 'question'): void {
    const existingExpression = target === 'question' ? this.findFirstLatexExpression(this.questionForm.controls.question.value) : null;
    const initialValue = existingExpression?.latex ?? '';
    this.mathEditorTarget.set(target);
    this.mathEditorAnswerDraftId.set(null);
    this.mathEditorExistingExpression.set(existingExpression?.source ?? null);
    this.mathEditorValue.set(initialValue);
    this.showMathEditor.set(true);
    setTimeout(() => {
      const field = this.mathField?.nativeElement;
      if (field) {
        field.value = initialValue;
        field.focus();
      }
    });
  }

  openAnswerDraftMathEditor(answer: TenantCurriculumQuestionAnswer): void {
    const answerValue = this.answerDraftValue(answer, 'answer');
    const existingExpression = this.findFirstLatexExpression(answerValue);
    const initialValue = existingExpression?.latex ?? '';
    this.mathEditorTarget.set('answerDraft');
    this.mathEditorAnswerDraftId.set(answer.id);
    this.mathEditorExistingExpression.set(existingExpression?.source ?? null);
    this.mathEditorValue.set(initialValue);
    this.showMathEditor.set(true);
    setTimeout(() => {
      const field = this.mathField?.nativeElement;
      if (field) {
        field.value = initialValue;
        field.focus();
      }
    });
  }

  closeMathEditor(): void {
    this.showMathEditor.set(false);
    this.mathEditorValue.set('');
    this.mathEditorExistingExpression.set(null);
    this.mathEditorAnswerDraftId.set(null);
  }

  setMathEditorValue(event: Event): void {
    const field = event.target as MathfieldElement;
    this.mathEditorValue.set(field.value);
  }

  insertMathExpression(): void {
    const value = this.mathEditorValue().trim();
    if (!value) {
      return;
    }
    const expression = `\\(${value}\\)`;
    if (this.mathEditorTarget() === 'answer') {
      const currentAnswer = this.newAnswer().trim();
      this.setNewAnswer(currentAnswer ? `${currentAnswer} ${expression}` : expression);
    } else if (this.mathEditorTarget() === 'answerDraft') {
      const answerId = this.mathEditorAnswerDraftId();
      if (!answerId) {
        return;
      }
      const currentAnswer = this.answerDrafts()[answerId]?.answer.trim() ?? '';
      const existingExpression = this.mathEditorExistingExpression();
      this.setAnswerDraftValue(answerId, 'answer', existingExpression && currentAnswer.includes(existingExpression)
        ? currentAnswer.replace(existingExpression, expression)
        : currentAnswer ? `${currentAnswer} ${expression}` : expression);
    } else if (this.mathEditorTarget() === 'bulk') {
      const currentBulkQuestions = this.bulkQuestionsText().trimEnd();
      this.setBulkQuestionsText(currentBulkQuestions ? `${currentBulkQuestions} ${expression}` : expression);
    } else {
      const currentQuestion = this.questionForm.controls.question.value.trim();
      const existingExpression = this.mathEditorExistingExpression();
      this.setQuestionValue(existingExpression && currentQuestion.includes(existingExpression)
        ? currentQuestion.replace(existingExpression, expression)
        : currentQuestion ? `${currentQuestion} ${expression}` : expression);
    }
    this.closeMathEditor();
  }

  removeQuestionMedia(): void {
    this.revokeQuestionMediaPreview();
    this.questionMediaOption.set(null);
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  mediaAbsoluteUrl(url: string | null | undefined): string | null {
    return this.data.mediaUrlToAbsolute(url);
  }

  answerMediaKind(answer: TenantCurriculumQuestionAnswer): QuestionMediaOption['kind'] {
    return this.resolveMediaKind(answer.mediaContentType ?? '');
  }

  openBulkQuestionOverlay(): void {
    this.bulkQuestionError.set(null);
    this.showBulkQuestionOverlay.set(true);
  }

  closeBulkQuestionOverlay(): void {
    if (this.bulkQuestionSaving()) {
      return;
    }
    this.showBulkQuestionOverlay.set(false);
    this.bulkQuestionError.set(null);
  }

  setBulkQuestionsText(value: string): void {
    this.bulkQuestionsText.set(value);
    this.bulkQuestionError.set(null);
  }

  async saveBulkQuestions(): Promise<void> {
    if (this.bulkQuestionSaving()) {
      return;
    }
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    if (!subject || (!nodeId && !this.isExamQuestionRoute())) {
      this.bulkQuestionError.set(this.label('missingCurriculumContext'));
      return;
    }

    let questions: BulkQuestionInput[];
    try {
      questions = this.isTrueFalse()
        ? this.parseBulkTrueFalseQuestions(this.bulkQuestionsText())
        : this.parseBulkQuestions(this.bulkQuestionsText());
      if (this.isSingleAnswerBulkType()) {
        this.assertSingleAnswerBulkQuestions(questions);
      }
    } catch (error) {
      this.bulkQuestionError.set(error instanceof Error ? error.message : this.label('invalidQuestionsFormat'));
      return;
    }

    this.bulkQuestionSaving.set(true);
    this.bulkQuestionError.set(null);
    try {
      for (const item of questions) {
        const savedQuestion = await this.createQuestionForCurrentContext(subject.id, nodeId ?? '', {
          question: item.question,
          type: this.selectedQuestionType(),
          answer: null,
          description: null,
          bloomId: this.questionForm.controls.bloomId.value || null,
          difficultyId: this.questionForm.controls.difficultyId.value || null,
          skillId: this.questionForm.controls.skillId.value || null,
          weight: this.questionWeightPayloadValue(),
          ...this.applicationDataPayloadPart(),
          ...this.applicationTagPayloadPart(),
          ...this.emptyMediaPayload(),
        });
        this.rememberExamQuestion(savedQuestion.id);
        for (const answer of item.answers) {
          await this.createQuestionAnswerForCurrentContext(subject.id, nodeId ?? '', savedQuestion.id, {
            answer: answer.answer,
            correct: answer.correct,
            description: null,
          });
        }
      }
      this.navigateAfterQuestionSave();
    } catch (error) {
      this.bulkQuestionError.set(this.data.toUserMessage(error, this.label('unableToSaveQuestions')));
    } finally {
      this.bulkQuestionSaving.set(false);
    }
  }

  async saveAnswer(): Promise<void> {
    if (this.answerSaving()) {
      return;
    }
    const answer = this.newAnswer().trim();
    const hasAnswerMedia = !!this.newAnswerMediaOption();
    this.newAnswerError.set(answer || hasAnswerMedia ? null : this.label('answerRequired'));
    this.answerSavingError.set(null);
    if (!answer && !hasAnswerMedia) {
      return;
    }
    if (this.isSingleAnswerQuestionType() && this.multipleChoiceAnswers().length) {
      this.newAnswerError.set(`${this.selectedQuestionTypeLabel()} ${this.label('oneAnswerOnly')}`);
      return;
    }
    const shortAnswerError = this.isShortAnswer() ? this.validateShortAnswerText(answer) : null;
    if (shortAnswerError) {
      this.newAnswerError.set(shortAnswerError);
      return;
    }
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      this.answerSavingError.set(this.isArabic() ? 'أدخل السؤال والنوع قبل إضافة الإجابات.' : 'Enter the question and type before adding answers.');
      return;
    }
    if (!this.hasQuestionContent()) {
      this.questionContentError.set(this.label('questionOrMediaRequired'));
      this.answerSavingError.set(this.label('enterQuestionBeforeAnswer'));
      return;
    }

    this.answerSaving.set(true);
    try {
      const question = await this.saveQuestionToBackend();
      const subject = this.subject();
      const nodeId = this.selectedNodeId();
      if (!subject || (!nodeId && !this.isExamQuestionRoute())) {
        throw new Error(this.label('missingCurriculumContext'));
      }
      const savedAnswer = await this.createQuestionAnswerForCurrentContext(subject.id, nodeId ?? '', question.id, {
        answer,
        correct: this.isTrueFalse() ? answer.toLowerCase() === 'true' : this.isSingleAnswerQuestionType(),
        description: this.newAnswerDescription(),
        ...await this.resolveAnswerMediaPayload(),
      });
      this.multipleChoiceAnswers.update((answers) => [...answers, savedAnswer]);
      this.answerDrafts.update((drafts) => ({
        ...drafts,
        [savedAnswer.id]: {
          answer: savedAnswer.answer,
          description: savedAnswer.description ?? '',
          correct: savedAnswer.correct,
        },
      }));
      this.showAnswerModal.set(false);
      this.newAnswer.set('');
      this.newAnswerDescription.set('');
      this.revokeAnswerMediaPreview();
      this.newAnswerMediaOption.set(null);
      this.newAnswerError.set(null);
    } catch (error) {
      this.answerSavingError.set(this.data.toUserMessage(error, this.label('unableToSaveAnswer')));
    } finally {
      this.answerSaving.set(false);
    }
  }

  async toggleAnswerCorrect(answer: TenantCurriculumQuestionAnswer, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const correct = input.checked;
    if (this.isEditMode()) {
      this.setAnswerDraftCorrect(answer.id, correct);
      return;
    }
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    const questionId = this.currentQuestionId();
    if (!subject || (!nodeId && !this.isExamQuestionRoute()) || !questionId) {
      input.checked = answer.correct;
      return;
    }

    this.answerUpdatingId.set(answer.id);
    this.questionSaveError.set(null);
    try {
      const updated = await this.updateQuestionAnswerForCurrentContext(subject.id, nodeId ?? '', questionId, answer.id, { correct });
      if (this.isSingleCorrectType() && correct) {
        const otherCorrectAnswers = this.multipleChoiceAnswers().filter((item) => item.id !== answer.id && item.correct);
        const updatedOtherAnswers = await Promise.all(otherCorrectAnswers.map((item) =>
          this.updateQuestionAnswerForCurrentContext(subject.id, nodeId ?? '', questionId, item.id, { correct: false }),
        ));
        const updatedById = new Map([updated, ...updatedOtherAnswers].map((item) => [item.id, item]));
        this.multipleChoiceAnswers.update((answers) => answers.map((item) => updatedById.get(item.id) ?? item));
        this.answerDrafts.set(this.toAnswerDrafts(this.multipleChoiceAnswers()));
      } else {
        this.multipleChoiceAnswers.update((answers) => answers.map((item) => item.id === updated.id ? updated : item));
      }
    } catch (error) {
      input.checked = answer.correct;
      this.questionSaveError.set(this.data.toUserMessage(error, this.label('unableToUpdateAnswer')));
    } finally {
      this.answerUpdatingId.set(null);
    }
  }

  private async loadSubjectAndCurriculum(subjectId: string | null): Promise<void> {
    this.curriculumRoot.set(null);
    const educationCategory = this.routeEducationCategory();
    if (educationCategory) {
      await this.facade.loadSubject(subjectId, educationCategory);
    } else {
      await this.facade.loadSubject(subjectId);
    }
    const subject = this.subject();
    if (subject) {
      await this.loadCurriculum(subject.id);
      const nodeId = this.selectedNodeId();
      const questionId = this.editingQuestionId();
      if (nodeId) {
        await this.loadSkills(subject.id, nodeId);
      } else if (this.isExamQuestionRoute()) {
        await this.loadSkills(subject.id, '');
      }
      if ((nodeId || this.isExamQuestionRoute()) && questionId) {
        await this.loadQuestionForEdit(subject.id, nodeId ?? '', questionId);
      }
    }
  }

  private findFirstLatexExpression(value: string): { source: string; latex: string } | null {
    const match = value.match(/\\\((.+?)\\\)/);
    if (!match) {
      return null;
    }
    return {
      source: match[0],
      latex: match[1],
    };
  }

  private async loadQuestionForEdit(subjectId: string, nodeId: string, questionId: string): Promise<void> {
    this.curriculumLoading.set(true);
    this.curriculumError.set(null);
    try {
      const stageId = this.routeStageId();
      const gradeId = this.routeGradeId();
      const examId = this.route.snapshot?.queryParamMap?.get('examId') ?? null;
      const questions = this.isExamQuestionRoute() && stageId && gradeId && examId
        ? await this.data.listBasicEducationExamLinkedQuestions(stageId, gradeId, subjectId, examId)
        : this.usesBasicEducationQuestionBankStore() && stageId && gradeId
          ? await this.data.listBasicEducationExamQuestions(stageId, gradeId, subjectId)
          : await this.listCurriculumQuestionsForCurrentCategory(subjectId, nodeId);
      const question = questions.find((item) => item.id === questionId);
      if (!question) {
        throw new Error(this.isArabic() ? 'السؤال غير موجود.' : 'Question not found.');
      }
      this.applyQuestionForEdit(question);
    } catch (error) {
      this.curriculumError.set(this.data.toUserMessage(error, this.isArabic() ? 'تعذر تحميل تفاصيل السؤال. حاول مرة أخرى.' : 'Unable to load question details. Please try again.'));
    } finally {
      this.curriculumLoading.set(false);
    }
  }

  private applyQuestionForEdit(question: TenantCurriculumQuestion): void {
    this.currentQuestionId.set(question.id);
    this.questionForm.patchValue({
      question: question.question,
      type: question.type,
      answer: question.answer ?? '',
      description: question.description ?? '',
      bloomId: question.bloomId ?? '',
      difficultyId: question.difficultyId ?? '',
      skillId: question.skillId ?? '',
      weight: question.weight == null ? '' : String(question.weight),
      questionSource: question.questionSource ?? '',
      answerExplanation: question.answerExplanation ?? '',
    });
    this.applicationTags.set(question.tags ?? []);
    this.selectedQuestionType.set(question.type);
    this.multipleChoiceMode.set('single');
    const answers = this.isSingleAnswerTypeCode(question.type) ? this.normalizeSingleAnswerQuestions(question.answers) : question.answers;
    this.multipleChoiceAnswers.set(answers);
    this.answerDrafts.set(this.toAnswerDrafts(answers));
    if (question.type === 'TRUE_FALSE') {
      this.trueFalseAnswer.set(this.resolveTrueFalseAnswer(question.answers));
    }
    this.applyQuestionMediaForEdit(question);
  }

  private async loadCurriculum(subjectId: string): Promise<void> {
    this.curriculumLoading.set(true);
    this.curriculumError.set(null);
    try {
      this.curriculumRoot.set(await this.getSubjectCurriculumForCurrentCategory(subjectId));
    } catch (error) {
      this.curriculumError.set(this.data.toUserMessage(error, this.label('loadErrorTitle')));
    } finally {
      this.curriculumLoading.set(false);
    }
  }

  private async loadQuestionTypes(): Promise<void> {
    this.questionTypesLoading.set(true);
    this.questionTypeError.set(null);
    try {
      const questionTypes = await this.questionTypeSettings.listQuestionTypes();
      this.questionTypes.set(questionTypes);
    } catch (error) {
      this.questionTypeError.set(this.questionTypeSettings.toUserMessage(error));
    } finally {
      this.questionTypesLoading.set(false);
    }
  }

  private async loadQuestionSources(): Promise<void> {
    this.questionSourcesLoading.set(true);
    this.questionSourcesError.set(null);
    try {
      this.questionSources.set(await this.questionSourceSettings.listQuestionSources(this.currentQuestionSourceEducationCategory()));
    } catch (error) {
      this.questionSourcesError.set(this.questionSourceSettings.toUserMessage(error));
    } finally {
      this.questionSourcesLoading.set(false);
    }
  }

  private async loadBloomLevels(): Promise<void> {
    this.bloomLevelsLoading.set(true);
    this.bloomLevelsError.set(null);
    try {
      this.bloomLevels.set(await this.data.listBloomLevels());
    } catch (error) {
      this.bloomLevelsError.set(this.data.toUserMessage(error, this.label('unableToLoadBloomTaxonomy')));
    } finally {
      this.bloomLevelsLoading.set(false);
    }
  }

  private async loadQuestionDifficulties(): Promise<void> {
    this.questionDifficultiesLoading.set(true);
    this.questionDifficultiesError.set(null);
    try {
      this.questionDifficulties.set(await this.data.listQuestionDifficulties());
    } catch (error) {
      this.questionDifficultiesError.set(this.data.toUserMessage(error, this.label('unableToLoadQuestionDifficulties')));
    } finally {
      this.questionDifficultiesLoading.set(false);
    }
  }

  private async loadSkills(subjectId: string, nodeId: string): Promise<void> {
    this.skillsLoading.set(true);
    this.skillsError.set(null);
    try {
      this.skills.set(await this.loadAllCurriculumSkills(subjectId, nodeId));
    } catch (error) {
      this.skillsError.set(this.data.toUserMessage(error, this.label('unableToLoadSkills')));
    } finally {
      this.skillsLoading.set(false);
    }
  }

  private async loadAllCurriculumSkills(subjectId: string, fallbackNodeId: string): Promise<TenantCurriculumSkill[]> {
    const root = this.curriculumRoot();
    const nodeIds = root ? this.collectCurriculumNodeIds(root) : [fallbackNodeId];
    const uniqueNodeIds = Array.from(new Set([fallbackNodeId, ...nodeIds].filter((id) => !!id && id !== 'curriculum')));
    if (uniqueNodeIds.length === 0) {
      return [];
    }
    const results = await Promise.allSettled(uniqueNodeIds.map((id) => this.listCurriculumSkillsForCurrentCategory(subjectId, id)));
    const firstRejected = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    if (firstRejected && results.every((result) => result.status === 'rejected')) {
      throw firstRejected.reason;
    }
    const skills = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    const byKey = new Map<string, TenantCurriculumSkill>();
    for (const skill of skills) {
      byKey.set(skill.id || skill.name.trim().toLowerCase(), skill);
    }
    return Array.from(byKey.values());
  }

  private collectCurriculumNodeIds(node: TenantSubjectCurriculumNode): string[] {
    return [node.id, ...node.children.flatMap((child) => this.collectCurriculumNodeIds(child))];
  }

  private rememberExamQuestion(questionId: string): void {
    if (!this.isExamQuestionRoute()) {
      return;
    }
    const subject = this.subject();
    const stageId = this.routeStageId();
    const gradeId = this.routeGradeId();
    if (!subject || !stageId || !gradeId || !questionId) {
      return;
    }
    const key = this.examQuestionDraftStorageKey(stageId, gradeId, subject.id);
    const current = this.readStoredExamQuestionIds(key);
    if (!current.includes(questionId)) {
      sessionStorage.setItem(key, JSON.stringify([...current, questionId]));
    }
  }

  private async attachQuestionToEditingExam(questionId: string): Promise<void> {
    if (!this.isExamQuestionRoute()) {
      return;
    }
    const subject = this.subject();
    const stageId = this.routeStageId();
    const gradeId = this.routeGradeId();
    const examId = this.route.snapshot?.queryParamMap?.get('examId') ?? null;
    if (!subject || !stageId || !gradeId || !examId || !questionId) {
      return;
    }

    const key = this.examQuestionDraftStorageKey(stageId, gradeId, subject.id);
    const mergedIds = this.readStoredExamQuestionIds(key);
    if (!mergedIds.includes(questionId)) {
      mergedIds.push(questionId);
      sessionStorage.setItem(key, JSON.stringify(mergedIds));
    }

    const exams = await this.data.listBasicEducationExams(stageId, gradeId, subject.id);
    const exam = exams.find((item) => item.id === examId);
    if (!exam) {
      return;
    }

    await this.data.updateBasicEducationExam(stageId, gradeId, subject.id, examId, {
      title: exam.title,
      instructions: exam.instructions,
      shuffleQuestions: exam.shuffleQuestions,
      showResultsImmediately: exam.showResultsImmediately,
      allowRetakes: exam.allowRetakes,
      questionIds: mergedIds,
    });
  }

  private readStoredExamQuestionIds(key: string): string[] {
    try {
      const value = sessionStorage.getItem(key);
      const parsed = value ? JSON.parse(value) : [];
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && !!item) : [];
    } catch {
      return [];
    }
  }

  private examQuestionDraftStorageKey(stageId: string, gradeId: string, subjectId: string): string {
    return `tenant.exam-draft.questions.basic.${stageId}.${gradeId}.${subjectId}`;
  }

  private async saveQuestionToBackend(): Promise<TenantCurriculumQuestion> {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    if (!subject || (!nodeId && !this.isExamQuestionRoute())) {
      throw new Error(this.label('missingCurriculumContext'));
    }
    const payload = {
      question: this.questionForm.controls.question.value,
      type: this.questionForm.controls.type.value,
      answer: this.isChoiceQuestionType() ? null : this.questionForm.controls.answer.value,
      description: this.questionForm.controls.description.value,
      bloomId: this.questionForm.controls.bloomId.value || null,
      difficultyId: this.questionForm.controls.difficultyId.value || null,
      skillId: this.questionForm.controls.skillId.value || null,
      weight: this.questionWeightPayloadValue(),
      ...this.applicationDataPayloadPart(),
      ...this.applicationTagPayloadPart(),
      ...await this.resolveQuestionMediaPayload(),
    };
    const questionId = this.currentQuestionId();
    const saved = questionId
      ? await this.updateQuestionForCurrentContext(subject.id, nodeId ?? '', questionId, payload)
      : await this.createQuestionForCurrentContext(subject.id, nodeId ?? '', payload);
    this.currentQuestionId.set(saved.id);
    this.multipleChoiceAnswers.set(saved.answers);
    return saved;
  }

  private async createQuestionForCurrentContext(
    subjectId: string,
    nodeId: string,
    payload: Parameters<TenantSubjectsDataService['createCurriculumQuestion']>[2],
  ): Promise<TenantCurriculumQuestion> {
    if (!this.usesBasicEducationQuestionBankStore()) {
      return await this.createCurriculumQuestionForCurrentCategory(subjectId, nodeId, payload);
    }
    const stageId = this.routeStageId();
    const gradeId = this.routeGradeId();
    if (!stageId || !gradeId) {
      throw new Error(this.label('missingCurriculumContext'));
    }
    return await this.data.createBasicEducationExamQuestion(stageId, gradeId, subjectId, { ...payload, curriculumNodeId: nodeId || null });
  }

  private async updateQuestionForCurrentContext(
    subjectId: string,
    nodeId: string,
    questionId: string,
    payload: Parameters<TenantSubjectsDataService['createCurriculumQuestion']>[2],
  ): Promise<TenantCurriculumQuestion> {
    if (!this.usesBasicEducationQuestionBankStore()) {
      return await this.updateCurriculumQuestionForCurrentCategory(subjectId, nodeId, questionId, payload);
    }
    const stageId = this.routeStageId();
    const gradeId = this.routeGradeId();
    if (!stageId || !gradeId) {
      throw new Error(this.label('missingCurriculumContext'));
    }
    return await this.data.updateBasicEducationExamQuestion(stageId, gradeId, subjectId, questionId, { ...payload, curriculumNodeId: nodeId || null });
  }

  private async createQuestionAnswerForCurrentContext(
    subjectId: string,
    nodeId: string,
    questionId: string,
    payload: Parameters<TenantSubjectsDataService['createCurriculumQuestionAnswer']>[3],
  ): Promise<TenantCurriculumQuestionAnswer> {
    if (!this.usesBasicEducationQuestionBankStore()) {
      return await this.createCurriculumQuestionAnswerForCurrentCategory(subjectId, nodeId, questionId, payload);
    }
    const stageId = this.routeStageId();
    const gradeId = this.routeGradeId();
    if (!stageId || !gradeId) {
      throw new Error(this.label('missingCurriculumContext'));
    }
    return await this.data.createBasicEducationExamQuestionAnswer(stageId, gradeId, subjectId, questionId, payload);
  }

  private async updateQuestionAnswerForCurrentContext(
    subjectId: string,
    nodeId: string,
    questionId: string,
    answerId: string,
    payload: Parameters<TenantSubjectsDataService['updateCurriculumQuestionAnswer']>[4],
  ): Promise<TenantCurriculumQuestionAnswer> {
    if (!this.usesBasicEducationQuestionBankStore()) {
      return await this.updateCurriculumQuestionAnswerForCurrentCategory(subjectId, nodeId, questionId, answerId, payload);
    }
    const stageId = this.routeStageId();
    const gradeId = this.routeGradeId();
    if (!stageId || !gradeId) {
      throw new Error(this.label('missingCurriculumContext'));
    }
    return await this.data.updateBasicEducationExamQuestionAnswer(stageId, gradeId, subjectId, questionId, answerId, payload);
  }

  private navigateAfterQuestionSave(): void {
    if (this.isExamQuestionRoute()) {
      void this.router.navigate(this.examCreateLink(), { queryParams: this.examCreateQueryParams() });
      return;
    }
    void this.router.navigate(this.detailsLink());
  }

  private async saveAnswerDrafts(questionId: string): Promise<void> {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    if (!subject || (!nodeId && !this.isExamQuestionRoute())) {
      throw new Error(this.label('missingCurriculumContext'));
    }

    const drafts = this.answerDrafts();
    const answers = this.multipleChoiceAnswers();
    const updatedAnswers = await Promise.all(answers.map((answer) => {
      const draft = drafts[answer.id];
      if (this.isShortAnswer()) {
        const validationError = this.validateShortAnswerText(draft.answer);
        if (validationError) {
          throw new Error(validationError);
        }
      }
      return this.updateQuestionAnswerForCurrentContext(subject.id, nodeId ?? '', questionId, answer.id, {
        answer: draft.answer,
        correct: this.isSingleAnswerQuestionType() ? true : draft.correct,
        description: draft.description,
        mediaUrl: answer.mediaUrl ?? null,
        mediaFileName: answer.mediaFileName ?? null,
        mediaOriginalName: answer.mediaOriginalName ?? null,
        mediaContentType: answer.mediaContentType ?? null,
        mediaSizeBytes: answer.mediaSizeBytes ?? null,
      });
    }));
    this.multipleChoiceAnswers.set(updatedAnswers);
    this.answerDrafts.set(this.toAnswerDrafts(updatedAnswers));
  }

  private questionWeightPayloadValue(): number | null {
    const value = this.questionForm.controls.weight.value.trim();
    return value ? Number(value) : null;
  }

  private applicationTagPayload(): string[] {
    const pendingTag = this.questionForm.controls.applicationTagInput.value.trim();
    const tags = pendingTag ? [...this.applicationTags(), pendingTag] : this.applicationTags();
    const tagsByKey = new Map<string, string>();
    for (const tag of tags) {
      const normalizedTag = tag.trim();
      if (!normalizedTag) {
        continue;
      }
      tagsByKey.set(normalizedTag.toLowerCase(), normalizedTag);
    }
    return [...tagsByKey.values()];
  }

  private applicationTagPayloadPart(): { tags: string[] } | Record<string, never> {
    const tags = this.applicationTagPayload();
    return tags.length ? { tags } : {};
  }

  private applicationDataPayloadPart(): { questionSource?: string; answerExplanation?: string } {
    const questionSource = this.questionForm.controls.questionSource.value.trim();
    const answerExplanation = this.questionForm.controls.answerExplanation.value.trim();
    return {
      ...(questionSource ? { questionSource } : {}),
      ...(answerExplanation ? { answerExplanation } : {}),
    };
  }

  private async saveTrueFalseAnswers(questionId: string): Promise<void> {
    const subject = this.subject();
    const nodeId = this.selectedNodeId();
    const correctAnswer = this.trueFalseAnswer();
    if (!subject || (!nodeId && !this.isExamQuestionRoute())) {
      throw new Error(this.label('missingCurriculumContext'));
    }
    if (correctAnswer === null) {
      throw new Error(this.label('trueFalseRequired'));
    }

    const existingAnswers = this.multipleChoiceAnswers();
    const savedAnswers = [];
    for (const option of [true, false]) {
      const answerText = option ? 'True' : 'False';
      const existing = existingAnswers.find((answer) => answer.answer.trim().toLowerCase() === answerText.toLowerCase());
      const payload = {
        answer: answerText,
        correct: option === correctAnswer,
        description: null,
      };
      const saved = existing
        ? await this.updateQuestionAnswerForCurrentContext(subject.id, nodeId ?? '', questionId, existing.id, payload)
        : await this.createQuestionAnswerForCurrentContext(subject.id, nodeId ?? '', questionId, payload);
      savedAnswers.push(saved);
    }
    this.multipleChoiceAnswers.set(savedAnswers);
    this.answerDrafts.set(this.toAnswerDrafts(savedAnswers));
  }

  answerDraftValue(answer: TenantCurriculumQuestionAnswer, field: 'answer' | 'description'): string {
    return this.answerDrafts()[answer.id]?.[field] ?? (field === 'answer' ? answer.answer : answer.description ?? '');
  }

  answerDraftCorrect(answer: TenantCurriculumQuestionAnswer): boolean {
    return this.answerDrafts()[answer.id]?.correct ?? answer.correct;
  }

  setAnswerDraftValue(answerId: string, field: 'answer' | 'description', value: string): void {
    this.answerDrafts.update((drafts) => ({
      ...drafts,
      [answerId]: {
        answer: drafts[answerId]?.answer ?? '',
        description: drafts[answerId]?.description ?? '',
        correct: drafts[answerId]?.correct ?? false,
        [field]: value,
      },
    }));
  }

  setAnswerDraftCorrect(answerId: string, correct: boolean): void {
    this.answerDrafts.update((drafts) => {
      const nextDrafts = { ...drafts };
      if (this.isSingleCorrectType() && correct) {
        for (const id of Object.keys(nextDrafts)) {
          nextDrafts[id] = { ...nextDrafts[id], correct: false };
        }
      }
      nextDrafts[answerId] = {
        answer: nextDrafts[answerId]?.answer ?? '',
        description: nextDrafts[answerId]?.description ?? '',
        correct,
      };
      return nextDrafts;
    });
    this.multipleChoiceAnswers.update((answers) => answers.map((answer) => {
      if (answer.id === answerId) {
        return { ...answer, correct };
      }
      return this.isSingleCorrectType() && correct ? { ...answer, correct: false } : answer;
    }));
  }

  private toAnswerDrafts(answers: TenantCurriculumQuestionAnswer[]): Record<string, AnswerDraft> {
    return answers.reduce<Record<string, AnswerDraft>>((drafts, answer) => {
      drafts[answer.id] = {
        answer: answer.answer,
        description: answer.description ?? '',
        correct: answer.correct,
      };
      return drafts;
    }, {});
  }

  private hasBlankAnswerDraft(): boolean {
    const drafts = this.answerDrafts();
    return this.multipleChoiceAnswers().some((answer) => {
      const draft = drafts[answer.id];
      if (this.isShortAnswer() && draft) {
        const validationError = this.validateShortAnswerText(draft.answer);
        return !!validationError;
      }
      return !draft?.answer.trim() && !answer.mediaUrl;
    });
  }

  private hasQuestionContent(): boolean {
    return !!this.questionForm.controls.question.value.trim() || !!this.questionMediaOption();
  }

  private isChoiceTypeCode(code: string): boolean {
    return code === 'MULTIPLE_CHOICE' || code === 'MCQ' || code === 'TRUE_FALSE' || code === 'SHORT_ANSWER' || code === 'ESSAY';
  }

  private isSingleCorrectType(): boolean {
    return this.isMcq() || this.isSingleAnswerQuestionType();
  }

  private isSingleAnswerQuestionType(): boolean {
    return this.isShortAnswer() || this.isEssay();
  }

  private isSingleAnswerBulkType(): boolean {
    return this.isMcq() || this.isSingleAnswerQuestionType();
  }

  private isSingleAnswerTypeCode(code: string): boolean {
    return code === 'MCQ' || code === 'SHORT_ANSWER' || code === 'ESSAY';
  }

  private normalizeSingleAnswerQuestions(answers: TenantCurriculumQuestionAnswer[]): TenantCurriculumQuestionAnswer[] {
    let foundCorrectAnswer = false;
    const normalized = answers.map((answer) => {
      if (!answer.correct) {
        return answer;
      }
      if (!foundCorrectAnswer) {
        foundCorrectAnswer = true;
        return answer;
      }
      return { ...answer, correct: false };
    });
    return this.isSingleAnswerQuestionType() ? normalized.slice(0, 1).map((answer) => ({ ...answer, correct: true })) : normalized;
  }

  private assertSingleAnswerBulkQuestions(questions: BulkQuestionInput[]): void {
    for (const question of questions) {
      const correctAnswers = question.answers.filter((answer) => answer.correct);
      if (this.isSingleAnswerQuestionType() && question.answers.length !== 1) {
        throw new Error(this.formatQuestionError(question.question, 'questionMustHaveOneAnswer'));
      }
      if (correctAnswers.length !== 1) {
        throw new Error(this.formatQuestionError(question.question, 'questionMustHaveOneCorrect'));
      }
      if (this.isShortAnswer()) {
        const validationError = this.validateShortAnswerText(question.answers[0]?.answer ?? '');
        if (validationError) {
          throw new Error(this.formatQuestionError(question.question, 'questionAnswerTooLong'));
        }
      }
    }
  }

  private validateShortAnswerText(answer: string): string | null {
    const trimmed = answer.trim();
    if (!trimmed) {
      return this.label('answerRequired');
    }
    const words = trimmed.split(/\s+/).filter(Boolean);
    return words.length > 5 ? this.label('shortAnswerTooLong') : null;
  }

  private resolveTrueFalseAnswer(answers: TenantCurriculumQuestionAnswer[]): boolean | null {
    const correct = answers.find((answer) => answer.correct);
    if (!correct) {
      return null;
    }

    const value = correct.answer.trim().toLowerCase();
    if (value === 'true' || value === 'صح') {
      return true;
    }
    if (value === 'false' || value === 'خطأ' || value === 'خطا') {
      return false;
    }
    return null;
  }

  private emptyMediaPayload(): TenantCurriculumQuestionMediaPayload {
    return {
      mediaUrl: null,
      mediaFileName: null,
      mediaOriginalName: null,
      mediaContentType: null,
      mediaSizeBytes: null,
    };
  }

  private async resolveQuestionMediaPayload(): Promise<TenantCurriculumQuestionMediaPayload> {
    const media = this.questionMediaOption();
    if (!media) {
      return this.emptyMediaPayload();
    }
    if (!media.file && media.mediaUrl) {
      return {
        mediaUrl: media.mediaUrl,
        mediaFileName: media.mediaFileName,
        mediaOriginalName: media.mediaOriginalName,
        mediaContentType: media.mediaContentType,
        mediaSizeBytes: media.mediaSizeBytes,
      };
    }
    if (!media.file) {
      return this.emptyMediaPayload();
    }
    const uploaded = await this.data.uploadCurriculumQuestionMedia(media.file);
    return {
      mediaUrl: uploaded.url,
      mediaFileName: uploaded.fileName,
      mediaOriginalName: uploaded.originalName,
      mediaContentType: uploaded.contentType,
      mediaSizeBytes: uploaded.sizeBytes,
    };
  }

  private async resolveAnswerMediaPayload(): Promise<Partial<TenantCurriculumQuestionMediaPayload>> {
    const media = this.newAnswerMediaOption();
    if (!media?.file) {
      return {};
    }
    const uploaded = await this.data.uploadCurriculumQuestionMedia(media.file);
    return {
      mediaUrl: uploaded.url,
      mediaFileName: uploaded.fileName,
      mediaOriginalName: uploaded.originalName,
      mediaContentType: uploaded.contentType,
      mediaSizeBytes: uploaded.sizeBytes,
    };
  }

  private applyQuestionMediaForEdit(question: TenantCurriculumQuestion): void {
    this.revokeQuestionMediaPreview();
    if (!question.mediaUrl) {
      this.questionMediaOption.set(null);
      return;
    }
    const previewUrl = this.data.mediaUrlToAbsolute(question.mediaUrl) ?? question.mediaUrl;
    this.questionMediaOption.set({
      name: question.mediaOriginalName || question.mediaFileName || (this.isArabic() ? 'ملف السؤال' : 'Question media'),
      size: question.mediaSizeBytes ?? 0,
      type: question.mediaContentType || this.label('mediaFile'),
      previewUrl,
      kind: this.resolveMediaKind(question.mediaContentType ?? ''),
      file: null,
      mediaUrl: question.mediaUrl,
      mediaFileName: question.mediaFileName,
      mediaOriginalName: question.mediaOriginalName,
      mediaContentType: question.mediaContentType,
      mediaSizeBytes: question.mediaSizeBytes,
    });
  }

  private resolveMediaKind(type: string): QuestionMediaOption['kind'] {
    if (type.startsWith('image/')) {
      return 'image';
    }
    if (type.startsWith('video/')) {
      return 'video';
    }
    if (type.startsWith('audio/')) {
      return 'audio';
    }
    return 'file';
  }

  private revokeQuestionMediaPreview(): void {
    const current = this.questionMediaOption();
    if (current?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(current.previewUrl);
    }
  }

  private revokeAnswerMediaPreview(): void {
    const current = this.newAnswerMediaOption();
    if (current?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(current.previewUrl);
    }
  }

  private parseBulkQuestions(value: string): BulkQuestionInput[] {
    const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const questions: BulkQuestionInput[] = [];
    let current: BulkQuestionInput | null = null;

    for (const line of lines) {
      const questionMatch = /^(?:Q\s*:|س\s*:)\s*(.+[?؟])$/iu.exec(line);
      if (questionMatch) {
        current = { question: questionMatch[1].trim(), answers: [] };
        questions.push(current);
        continue;
      }

      const answerMatch = /^-\s*(?:(correct|صح|اجابة صحيحه|اجابه صحيحه|إجابة صحيحة|إجابه صحيحه|إجابة صحيحه)\s*,\s*)?(.+)$/iu.exec(line);
      if (answerMatch) {
        if (!current) {
          throw new Error(this.label('answerLinesAfterQuestion'));
        }
        current.answers.push({
          correct: !!answerMatch[1],
          answer: answerMatch[2].trim(),
        });
        continue;
      }

      throw new Error(this.label('invalidChoiceFormat'));
    }

    if (!questions.length) {
      throw new Error(this.label('enterAtLeastOneQuestion'));
    }

    for (const question of questions) {
      if (!question.answers.length) {
        throw new Error(this.formatQuestionError(question.question, 'questionMustHaveAnswer'));
      }
      if (!question.answers.some((answer) => answer.correct)) {
        throw new Error(this.formatQuestionError(question.question, 'questionMustHaveCorrect'));
      }
      if (question.answers.some((answer) => !answer.answer)) {
        throw new Error(this.formatQuestionError(question.question, 'questionHasEmptyAnswer'));
      }
    }

    return questions;
  }

  private parseBulkTrueFalseQuestions(value: string): BulkQuestionInput[] {
    const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const questions: BulkQuestionInput[] = [];

    for (const line of lines) {
      const questionMatch = /^(?:Q\s*:|q\s*:|س\s*:)\s*(.+[?؟])\s*,\s*(true|false|صح|خطأ|خطا)$/iu.exec(line);
      if (!questionMatch) {
        throw new Error(this.label('invalidTrueFalseFormat'));
      }
      const answerValue = questionMatch[2].trim().toLowerCase();
      const isTrue = answerValue === 'true' || answerValue === 'صح';
      questions.push({
        question: questionMatch[1].trim(),
        answers: [
          { answer: 'True', correct: isTrue },
          { answer: 'False', correct: !isTrue },
        ],
      });
    }

    if (!questions.length) {
      throw new Error(this.label('enterAtLeastOneQuestion'));
    }

    return questions;
  }

  private findNode(nodes: TenantSubjectCurriculumNode[], nodeId: string): TenantSubjectCurriculumNode | null {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node;
      }

      const child = node.children.length ? this.findNode(node.children, nodeId) : null;
      if (child) {
        return child;
      }
    }

    return null;
  }

  private findNodePath(
    nodes: TenantSubjectCurriculumNode[],
    nodeId: string,
    parents: CurriculumPathItem[] = [],
  ): CurriculumPathItem[] {
    for (const node of nodes) {
      const path = [...parents, { id: node.id, label: node.label }];
      if (node.id === nodeId) {
        return path;
      }

      const childPath = node.children.length ? this.findNodePath(node.children, nodeId, path) : [];
      if (childPath.length) {
        return childPath;
      }
    }

    return [];
  }

  private subjectsRootLink(): string {
    if (this.isBasicEducationExamQuestionRoute()) {
      const stageId = this.routeStageId();
      const gradeId = this.routeGradeId();
      if (stageId && gradeId) {
        return `${this.basicEducationExamsRoot()}/${stageId}/grades/${gradeId}/create/new/subjects`;
      }
    }

    if (this.isUniversityExamQuestionRoute()) {
      const universityId = this.route.snapshot?.paramMap?.get('universityId');
      const collegeId = this.route.snapshot?.paramMap?.get('collegeId');
      if (universityId && collegeId) {
        return `${this.universityEducationExamsRoot()}/${universityId}/colleges/${collegeId}/create/new/subjects`;
      }
      return this.universityEducationExamsRoot();
    }

    if (this.router.url.startsWith('/tenant/questions-bank/basic-education')) {
      const stageId = this.route.snapshot?.paramMap?.get('stageId');
      const gradeId = this.route.snapshot?.paramMap?.get('gradeId');
      if (stageId && gradeId) {
        return `/tenant/questions-bank/basic-education/${stageId}/grades/${gradeId}/subjects`;
      }
    }

    if (this.router.url.startsWith('/tenant/questions-bank/university-education')) {
      const collegeId = this.route.snapshot?.paramMap?.get('collegeId');
      if (collegeId) {
        return `/tenant/questions-bank/university-education/colleges/${collegeId}/subjects`;
      }
      return '/tenant/questions-bank/university-education';
    }

    return this.router.url.startsWith('/tenant/university-subjects') ? '/tenant/university-subjects' : '/tenant/subjects';
  }

  private routeEducationCategory(): string | null {
    return this.router.url.startsWith('/tenant/questions-bank/university-education')
      || this.router.url.startsWith('/tenant/university-subjects')
      || this.router.url.startsWith('/tenant/exams/university-education')
      || this.router.url.startsWith('/teacher/exams/university-education')
      ? 'UNIVERSITY_EDUCATION'
      : null;
  }

  examsRoot(): string {
    return this.router.url.startsWith('/teacher/exams') ? '/teacher/exams' : '/tenant/exams';
  }

  basicEducationExamsRoot(): string {
    return `${this.examsRoot()}/basic-education`;
  }

  private universityEducationExamsRoot(): string {
    return `${this.examsRoot()}/university-education`;
  }

  private currentQuestionSourceEducationCategory(): 'BASIC_EDUCATION' | 'UNIVERSITY_EDUCATION' {
    return this.routeEducationCategory() === 'UNIVERSITY_EDUCATION' ? 'UNIVERSITY_EDUCATION' : 'BASIC_EDUCATION';
  }

  private async getSubjectCurriculumForCurrentCategory(subjectId: string): Promise<TenantSubjectCurriculumNode> {
    const educationCategory = this.routeEducationCategory();
    return educationCategory
      ? await this.data.getSubjectCurriculumForCategory(subjectId, educationCategory)
      : await this.data.getSubjectCurriculum(subjectId);
  }

  private async listCurriculumQuestionsForCurrentCategory(subjectId: string, nodeId: string): Promise<TenantCurriculumQuestion[]> {
    const educationCategory = this.routeEducationCategory();
    return educationCategory
      ? await this.data.listCurriculumQuestionsForCategory(subjectId, nodeId, educationCategory)
      : await this.data.listCurriculumQuestions(subjectId, nodeId);
  }

  private async listCurriculumSkillsForCurrentCategory(subjectId: string, nodeId: string): Promise<TenantCurriculumSkill[]> {
    const educationCategory = this.routeEducationCategory();
    return educationCategory
      ? await this.data.listCurriculumSkillsForCategory(subjectId, nodeId, educationCategory)
      : await this.data.listCurriculumSkills(subjectId, nodeId);
  }

  private async createCurriculumQuestionForCurrentCategory(
    subjectId: string,
    nodeId: string,
    payload: Parameters<TenantSubjectsDataService['createCurriculumQuestion']>[2],
  ): Promise<TenantCurriculumQuestion> {
    const educationCategory = this.routeEducationCategory();
    return educationCategory
      ? await this.data.createCurriculumQuestionForCategory(subjectId, nodeId, educationCategory, payload)
      : await this.data.createCurriculumQuestion(subjectId, nodeId, payload);
  }

  private async updateCurriculumQuestionForCurrentCategory(
    subjectId: string,
    nodeId: string,
    questionId: string,
    payload: Parameters<TenantSubjectsDataService['createCurriculumQuestion']>[2],
  ): Promise<TenantCurriculumQuestion> {
    const educationCategory = this.routeEducationCategory();
    return educationCategory
      ? await this.data.updateCurriculumQuestionForCategory(subjectId, nodeId, questionId, educationCategory, payload)
      : await this.data.updateCurriculumQuestion(subjectId, nodeId, questionId, payload);
  }

  private async createCurriculumQuestionAnswerForCurrentCategory(
    subjectId: string,
    nodeId: string,
    questionId: string,
    payload: Parameters<TenantSubjectsDataService['createCurriculumQuestionAnswer']>[3],
  ): Promise<TenantCurriculumQuestionAnswer> {
    const educationCategory = this.routeEducationCategory();
    return educationCategory
      ? await this.data.createCurriculumQuestionAnswerForCategory(subjectId, nodeId, questionId, educationCategory, payload)
      : await this.data.createCurriculumQuestionAnswer(subjectId, nodeId, questionId, payload);
  }

  private async updateCurriculumQuestionAnswerForCurrentCategory(
    subjectId: string,
    nodeId: string,
    questionId: string,
    answerId: string,
    payload: Parameters<TenantSubjectsDataService['updateCurriculumQuestionAnswer']>[4],
  ): Promise<TenantCurriculumQuestionAnswer> {
    const educationCategory = this.routeEducationCategory();
    return educationCategory
      ? await this.data.updateCurriculumQuestionAnswerForCategory(subjectId, nodeId, questionId, answerId, educationCategory, payload)
      : await this.data.updateCurriculumQuestionAnswer(subjectId, nodeId, questionId, answerId, payload);
  }
}
