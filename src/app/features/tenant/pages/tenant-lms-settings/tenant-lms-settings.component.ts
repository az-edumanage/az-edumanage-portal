import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { firstValueFrom } from "rxjs";
import { QuillModule } from "ngx-quill";
import { environment } from "../../../../../environments/environment";
import { AuthIdentityService } from "../../../../core/auth/auth-identity.service";
import {
  SaveTenantLmsSettingsRequest,
  TenantLmsAboutTeacherSettings,
  TenantLmsCourseItem,
  TenantLmsCourse,
  TenantLmsCourseCurriculumNode,
  TenantLmsCourseMedia,
  SaveTenantLmsCourseRequest as SaveManagedCourseRequest,
  TenantLmsCoursesSettings,
  TenantLmsGradesSettings,
  TenantLmsHeroSettings,
  TenantLmsSettingsDataService,
  TenantLmsSettingsView,
} from "../../data-access/tenant-lms-settings-data.service";
import { TenantGradesDataService } from "../../data-access/tenant-grades-data.service";
import { TenantUserCreateDataService } from "../../data-access/tenant-user-create-data.service";
import { TenantUsersDataService } from "../../data-access/tenant-users-data.service";
import { CourseBuilderDevRepository } from "../../data-access/course-builder-dev.repository";
import { Grade } from "../../models/tenant-grades.models";
import { TenantUserRoleOption } from "../../models/tenant-user-create.models";
import { TenantUser } from "../../models/tenant-users.models";
import { parseCourseBuilderExternalVideo, validateCourseBuilderVideoFile } from "./course-builder-utils";

function createCourseContentId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") {
    try {
      return cryptoApi.randomUUID();
    } catch {
      // Custom tenant hosts can run over HTTP, where randomUUID may be blocked.
    }
  }

  if (typeof cryptoApi?.getRandomValues === "function") {
    try {
      const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
      return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
    } catch {
      // Fall through to a collision-resistant local editor ID.
    }
  }

  return `course-content-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

const LMS_SECTION_DEFINITIONS = [
  { key: "navbar", label: "Navbar", description: "Announcement bar and primary website navigation.", icon: "web_asset" },
  { key: "hero", label: "Hero section", description: "Homepage introduction, actions, and headline statistics.", icon: "view_carousel" },
  { key: "grades", label: "Grades", description: "Available school grade levels.", icon: "school" },
  { key: "aboutTeacher", label: "About teacher", description: "Teacher profile, experience, and portrait.", icon: "person" },
  { key: "courses", label: "Courses", description: "Main course catalog preview.", icon: "play_lesson" },
  { key: "bestseller", label: "Bestseller", description: "Most popular courses.", icon: "local_fire_department" },
  { key: "addedRecently", label: "Added recently", description: "Newest course releases.", icon: "new_releases" },
  { key: "testYourself", label: "Test yourself", description: "Interactive knowledge check.", icon: "quiz" },
  { key: "curriculumPreview", label: "Curriculum preview", description: "Sample lesson list and free lesson preview.", icon: "menu_book" },
  { key: "platformTour", label: "Platform tour", description: "Overview of the learning experience.", icon: "tour" },
  { key: "upcomingLiveSessions", label: "Upcoming live sessions", description: "Scheduled live reviews and booking links.", icon: "live_tv" },
  { key: "howItWorks", label: "How does it work", description: "The student onboarding steps.", icon: "account_tree" },
  { key: "whyPlatform", label: "Why the platform", description: "Learning tools and platform benefits.", icon: "auto_awesome" },
  { key: "whyOnline", label: "Why online", description: "Online learning comparison table.", icon: "compare_arrows" },
  { key: "successStories", label: "Success stories", description: "Student results and achievements.", icon: "emoji_events" },
  { key: "studentOpinions", label: "Student opinions", description: "Student reviews and testimonials.", icon: "reviews" },
  { key: "store", label: "Store", description: "Books and learning materials.", icon: "storefront" },
  { key: "trustedCertified", label: "Trusted and certified", description: "Accreditation and media logos.", icon: "verified" },
  { key: "pricesPackages", label: "Prices and packages", description: "Subscriptions, plans, and current offer.", icon: "sell" },
  { key: "faq", label: "Frequently Asked Questions", description: "Common questions from students and parents.", icon: "help" },
  { key: "tipsArticles", label: "Tips and articles", description: "Latest study advice and articles.", icon: "article" },
  { key: "application", label: "Application", description: "Mobile application download promotion.", icon: "smartphone" },
  { key: "newsletter", label: "Newsletter", description: "Email newsletter subscription.", icon: "mail" },
  { key: "readyToStart", label: "Ready to start", description: "Final homepage call to action.", icon: "rocket_launch" },
  { key: "footer", label: "Footer", description: "Footer navigation, payments, and legal copy.", icon: "vertical_align_bottom" },
] as const;

const DEFAULT_NAVIGATION: ReadonlyArray<{
  key: string;
  label: string;
  route: string;
  enabled: boolean;
}> = [
  { key: "grades", label: "الصفوف", route: "/#grades", enabled: true },
  { key: "courses", label: "الكورسات", route: "/courses", enabled: true },
  { key: "aboutTeacher", label: "عن المدرس", route: "/#about", enabled: true },
  { key: "store", label: "المتجر", route: "/store", enabled: true },
  { key: "pricesPackages", label: "الأسعار", route: "/pricing", enabled: true },
  { key: "testYourself", label: "اختبر نفسك", route: "/quiz", enabled: true },
];

type CourseProgressStatus = "not-started" | "in-progress" | "completed" | "expired";

interface CourseEnrollmentRow {
  userId: string;
  userName: string;
  email: string;
  role: string;
  progressStatus: CourseProgressStatus;
  enrollmentDate: string;
  completionDate: string | null;
  expirationDate: string;
  progress: number;
}

interface CourseContentNodeModalState {
  mode: "add" | "edit";
  parentId: string;
  sectionIndex: number | null;
  lessonIndex: number | null;
  subItemIndex: number | null;
}

type CourseBuilderVideoSource = "none" | "url" | "upload" | "camera" | "screen";
type CourseBuilderAudioSource = "none" | "upload" | "record";
type CourseBuilderDocumentSource = "none" | "upload" | "slideshare";
type CourseBuilderDocumentPreviewKind = "pdf" | "docx" | "pptx" | "xlsx" | "unsupported";
type CourseBuilderAutosaveState = "saved" | "saving" | "failed" | "dirty";
type CourseBuilderBlockType = "text" | "image" | "file" | "embed" | "quiz" | "assignment" | "divider";
type CourseContentUnitType = "SECTION" | "VIDEO" | "AUDIO" | "DOCUMENT" | "CONTENT" | "WEB_CONTENT" | "IFRAME" | "QUIZ" | "ASSIGNMENT" | "RESOURCE" | "LIVE_SESSION";
type CourseBuilderAddMenuCategory = "standard" | "activities" | "more";
type CourseMediaStatus = "LOCAL_PREVIEW" | "UPLOADING" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
type CourseBuilderQuestionType = "multipleChoice" | "fillGaps" | "ordering" | "matching" | "freeText" | "likertScale" | "import" | "existing";

interface CourseBuilderBlock {
  id: string;
  type: CourseBuilderBlockType;
  title: string;
  payload: Record<string, unknown>;
}

interface ExternalVideoConfig {
  provider: "YOUTUBE" | "VIMEO";
  videoId: string;
  url: string;
  embedUrl: string;
}

interface CourseBuilderValidationBlocker {
  id: string;
  message: string;
  nodeId?: string;
}

interface CourseBuilderQuestionOption {
  type: CourseBuilderQuestionType;
  label: string;
  icon: string;
}

interface ExistingCourseQuestionOption {
  block: CourseBuilderBlock;
  nodeTitle: string;
  courseTitle: string;
}

interface MultipleChoiceQuestionDraft {
  blockId: string | null;
  question: string;
  answers: string[];
  correctIndex: number;
}

interface FillGapsQuestionDraft {
  blockId: string | null;
  question: string;
}

interface OrderingQuestionDraft {
  blockId: string | null;
  question: string;
  items: string[];
}

interface MatchPairsQuestionDraft {
  blockId: string | null;
  question: string;
  pairs: Array<{ left: string; right: string }>;
}

interface FreeTextQuestionDraft {
  blockId: string | null;
  question: string;
  minimumPoints: number;
  rule: {
    operator: string;
    words: string;
    points: number;
  };
}

type ImportQuestionsType = "GIFT" | "AIKEN";
type ImportCheatsheetSection = "multipleChoice" | "trueFalse" | "fillGaps" | "matching" | "freeText";

interface ImportQuestionsDraft {
  type: ImportQuestionsType;
  data: string;
  validationMessage: string | null;
  validationError: string | null;
}

interface ImportedQuestion {
  title: string;
  payload: Record<string, unknown>;
}

const DEFAULT_HERO: TenantLmsHeroSettings = {
  badge: "◆ خبرة 18 سنة في تدريس الرياضيات",
  headline: "الرياضة مش حفظ…",
  highlightedHeadline: "الرياضة طريقة تفكير",
  description: "منصة الأستاذ عبدالله أبوالعز لطلاب الصف الأول والثاني والثالث الثانوي. شرح من الصفر، مسائل محلولة خطوة بخطوة، وامتحانات إلكترونية توصّلك للقمة بثقة.",
  primaryButtonLabel: "ابدأ مجانًا ▸",
  primaryButtonRoute: "/#grades",
  secondaryButtonLabel: "شاهد حصة مجانية",
  secondaryButtonRoute: "/#sample",
  miniStats: [
    { value: "+25k", label: "طالب وطالبة" },
    { value: "98%", label: "نسبة نجاح" },
    { value: "+540", label: "حصة مسجّلة" },
  ],
  imageUrl: "/abdullah.jpg",
  imageAlt: "الأستاذ عبدالله أبوالعز",
  imageBadge: "∫ مدرّس الرياضيات",
  imageName: "عبدالله أبوالعز",
  imageCaption: "خبرة 18 سنة في الثانوية العامة",
  stats: [
    { value: "18", label: "سنة خبرة في التدريس" },
    { value: "+25k", label: "طالب على المنصة" },
    { value: "98%", label: "نسبة نجاح الطلاب" },
    { value: "+1,200", label: "طالب من الأوائل" },
  ],
};

const DEFAULT_GRADES: TenantLmsGradesSettings = {
  eyebrow: "الصفوف الدراسية",
  headline: "اختار صفّك وابدأ على طول",
  description: "كل صف ليه منهجه المنظّم بالوحدات والدروس، متوافق مع منهج وزارة التربية والتعليم.",
  items: [
    {
      number: "01",
      title: "الصف الأول الثانوي",
      description: "تأسيس قوي في الجبر والهندسة وحساب المثلثات يبني أساس باقي السنين.",
      unitsLabel: "6 وحدات · 92 حصة",
      actionLabel: "ادخل المنهج",
      route: "/courses",
    },
    {
      number: "02",
      title: "الصف الثاني الثانوي",
      description: "بحت وتطبيقي: التفاضل، حساب المثلثات، والميكانيكا بأسلوب مبسّط.",
      unitsLabel: "8 وحدات · 134 حصة",
      actionLabel: "ادخل المنهج",
      route: "/courses",
    },
    {
      number: "03",
      title: "الصف الثالث الثانوي",
      description: "المراجعة النهائية والتفاضل والتكامل والاستاتيكا والديناميكا للامتحان.",
      unitsLabel: "9 وحدات · 168 حصة",
      actionLabel: "ادخل المنهج",
      route: "/courses",
    },
  ],
};

const DEFAULT_ABOUT_TEACHER: TenantLmsAboutTeacherSettings = {
  eyebrow: "نبذة عن المدرس",
  headline: "الأستاذ عبدالله أبوالعز",
  firstParagraphPrefix: "على مدار ",
  experienceHighlight: "18 سنة",
  firstParagraphSuffix: "، حوّل الأستاذ عبدالله أبوالعز آلاف الطلاب من الخوف من الرياضيات إلى التفوّق فيها. فلسفته بسيطة: الرياضة مش مادة بتتحفظ، دي طريقة تفكير بتتعلّم.",
  secondParagraph: "بأسلوب بيفكّك أصعب المسائل لخطوات واضحة، وبيبني أساس متين يمشي مع الطالب من أولى ثانوي لحد ما يحقّق حلمه في الكلية. مش بس بيشرحلك الحل… بيعلّمك تفكّر زي عالم رياضيات.",
  imageUrl: "/abdullah.jpg",
  imageAlt: "الأستاذ عبدالله أبوالعز",
  stats: [
    { value: "18", label: "سنة خبرة" },
    { value: "3", label: "صفوف دراسية" },
    { value: "+25k", label: "طالب" },
    { value: "+1,200", label: "من الأوائل" },
  ],
  signature: "— عبدالله أبوالعز",
};

const DEFAULT_COURSES: TenantLmsCoursesSettings = {
  eyebrow: "الكورسات",
  headline: "كورسات مبنية على المنهج بالكامل",
  description: "اختار الكورس اللي يناسب صفّك وترمك، واتعلّم في أي وقت ومن أي مكان.",
  items: [
    { courseId: "", gradeId: "", imageUrl: "", imageAlt: "التفاضل والتكامل", symbol: "∫ dx", level: "الثالث الثانوي", title: "التفاضل والتكامل — كامل", lessonsLabel: "◷ 42 حصة", ratingLabel: "★ 4.9", price: "650 ج", oldPrice: "900 ج", actionLabel: "التفاصيل", route: "/courses/calculus" },
    { courseId: "", gradeId: "", imageUrl: "", imageAlt: "حساب المثلثات", symbol: "sin θ", level: "الأول الثانوي", title: "حساب المثلثات من الصفر", lessonsLabel: "◷ 28 حصة", ratingLabel: "★ 4.8", price: "450 ج", oldPrice: "", actionLabel: "التفاصيل", route: "/courses/calculus" },
    { courseId: "", gradeId: "", imageUrl: "", imageAlt: "الميكانيكا", symbol: "F = ma", level: "الثاني الثانوي", title: "الميكانيكا — استاتيكا وديناميكا", lessonsLabel: "◷ 36 حصة", ratingLabel: "★ 4.9", price: "550 ج", oldPrice: "", actionLabel: "التفاصيل", route: "/courses/calculus" },
  ],
  allCoursesLabel: "شوف كل الكورسات ▸",
  allCoursesRoute: "/courses",
};

@Component({
  selector: "app-tenant-lms-settings",
  imports: [CommonModule, MatIconModule, FormsModule, ReactiveFormsModule, RouterLink, DragDropModule, QuillModule],
  template: `
    <section class="lms-page">
      @if (loading()) {
        <section class="lms-loading" aria-live="polite">
          <span class="lms-skeleton lms-skeleton-title"></span>
          <span class="lms-skeleton"></span>
          <span class="lms-skeleton lms-skeleton-short"></span>
        </section>
      } @else if (loadError()) {
        <section class="lms-notice lms-notice-error" role="alert">
          <mat-icon>error_outline</mat-icon>
          <div>
            <strong>Settings could not be loaded</strong>
            <p>{{ loadError() }}</p>
          </div>
          <button type="button" (click)="load()">Try again</button>
        </section>
      } @else if (settings()) {
        <form
          id="lms-settings-form"
          class="lms-workspace"
          [class.is-content-authoring]="isCourseContentNodePreview()"
          [formGroup]="form"
          (ngSubmit)="save()"
        >
          <nav class="lms-section-nav" aria-label="LMS website settings">
            <div class="lms-nav-group">
              <button
                type="button"
                class="lms-nav-trigger"
                [class.is-current]="isPublishingGroupActive()"
                [attr.aria-expanded]="publishingExpanded()"
                aria-controls="lms-publishing-pages"
                (click)="togglePublishingGroup()"
                ><mat-icon>language</mat-icon
                ><span
                  ><strong>Publishing</strong
                  ><small>Domain, status, and sections</small></span
                ><mat-icon class="lms-nav-chevron">{{ publishingExpanded() ? "expand_less" : "expand_more" }}</mat-icon></button
              >
              @if (publishingExpanded()) {
              <div id="lms-publishing-pages" class="lms-subpage-nav" aria-label="Homepage sections">
                <a
                  [routerLink]="['/tenant/lms-settings', 'publishing']"
                  [class.is-current]="activePage() === 'publishing'"
                  [attr.aria-current]="activePage() === 'publishing' ? 'page' : null"
                >
                  <span>Overview</span>
                </a>
                @for (section of sectionDefinitions; track section.key) {
                  <a
                    [routerLink]="['/tenant/lms-settings', section.key]"
                    [class.is-current]="activePage() === section.key"
                    [attr.aria-current]="activePage() === section.key ? 'page' : null"
                  >
                    <span>{{ section.label }}</span>
                    <span class="lms-nav-state" [class.is-active]="sectionEnabled(section.key)">
                      {{ sectionEnabled(section.key) ? "On" : "Off" }}
                    </span>
                  </a>
                }
              </div>
              }
            </div>
            <a
              [routerLink]="['/tenant/lms-settings', 'appearance']"
              [class.is-current]="activePage() === 'appearance'"
              [attr.aria-current]="activePage() === 'appearance' ? 'page' : null"
              ><mat-icon>dashboard_customize</mat-icon
              ><span
                ><strong>Appearance</strong
                ><small>Website template</small></span
              ></a
            >
            <div class="lms-nav-group">
              <button type="button" class="lms-nav-trigger" [class.is-current]="isContentGroupActive()" [attr.aria-expanded]="contentExpanded()" aria-controls="lms-content-pages" (click)="toggleContentGroup()">
                <mat-icon>edit_note</mat-icon><span><strong>Content</strong><small>Courses and learning material</small></span><mat-icon class="lms-nav-chevron">{{ contentExpanded() ? "expand_less" : "expand_more" }}</mat-icon>
              </button>
              @if (contentExpanded()) {
                <div id="lms-content-pages" class="lms-subpage-nav" aria-label="LMS content">
                  <a [routerLink]="['/tenant/lms-settings', 'content']" [class.is-current]="activePage() === 'content'" [attr.aria-current]="activePage() === 'content' ? 'page' : null"><span>Website copy</span></a>
                  <a [routerLink]="['/tenant/lms-settings', 'content', 'courses']" [class.is-current]="activePage() === 'contentCourses'" [attr.aria-current]="activePage() === 'contentCourses' ? 'page' : null"><span>Courses</span><span class="lms-nav-count">{{ managedCourses().length }}</span></a>
                  <a [routerLink]="['/tenant/lms-settings', 'content', 'learners']" [class.is-current]="activePage() === 'contentUsers'" [attr.aria-current]="activePage() === 'contentUsers' ? 'page' : null"><span>Learners</span><span class="lms-nav-count">{{ contentLearners().length }}</span></a>
                </div>
              }
            </div>
          </nav>

          <div class="lms-settings-content">
            @if (activePage() === "publishing") {
            <section class="lms-section lms-publishing-overview">
              <div class="lms-section-heading">
                <div>
                  <h2>Publishing</h2>
                  <p>
                    Control where the site is available to students and parents.
                  </p>
                </div>
                <span
                  class="lms-status"
                  [class.lms-status-live]="form.controls.websiteEnabled.value"
                >
                  <span></span
                  >{{
                    form.controls.websiteEnabled.value
                      ? "Published"
                      : "Not published"
                  }}
                </span>
              </div>
              <div class="lms-domain-row">
                <div class="lms-domain-copy">
                  <span>Public website address</span>
                  <a [href]="previewUrl()" target="_blank" rel="noreferrer">{{
                    displayWebsiteUrl()
                  }}</a>
                  <small>The tenant slug determines this address.</small>
                </div>
                <button
                  type="button"
                  class="lms-button lms-button-secondary"
                  [disabled]="
                    saving() ||
                    !settings()?.lmsEnabled ||
                    (!form.controls.websiteEnabled.value && form.invalid)
                  "
                  (click)="
                    form.controls.websiteEnabled.value
                      ? openWebsite()
                      : createWebsiteDomain()
                  "
                >
                  <mat-icon>{{
                    saving()
                      ? "sync"
                      : form.controls.websiteEnabled.value
                        ? "open_in_new"
                        : "add_link"
                  }}</mat-icon>
                  {{
                    form.controls.websiteEnabled.value
                      ? "Open website"
                      : "Create domain"
                  }}
                </button>
              </div>
              <div class="lms-publishing-pages-heading">
                <div>
                  <h3>Homepage sections</h3>
                  <p>Select a section to edit its content and visibility.</p>
                </div>
                <span>{{ enabledSectionCount() }} of {{ sectionDefinitions.length }} visible</span>
              </div>
              <div class="lms-publishing-page-grid">
                @for (section of sectionDefinitions; track section.key) {
                  <a
                    class="lms-publishing-page-card"
                    [routerLink]="['/tenant/lms-settings', section.key]"
                    [attr.aria-label]="'Edit ' + section.label + '. ' + (sectionEnabled(section.key) ? 'Visible' : 'Hidden')"
                  >
                    <span class="lms-publishing-page-icon"><mat-icon>{{ section.icon }}</mat-icon></span>
                    <span class="lms-publishing-page-copy">
                      <strong>{{ section.label }}</strong>
                      <small>{{ section.description }}</small>
                    </span>
                    <span class="lms-publishing-page-state" [class.is-active]="sectionEnabled(section.key)">
                      {{ sectionEnabled(section.key) ? "Visible" : "Hidden" }}
                    </span>
                    <mat-icon class="lms-publishing-page-arrow">arrow_forward</mat-icon>
                  </a>
                }
              </div>
            </section>
            } @else if (activePage() === "navbar") {
              <section class="lms-section lms-section-page">
                <div class="lms-section-heading">
                  <div class="lms-section-title">
                    <span class="lms-section-row-icon"><mat-icon>web_asset</mat-icon></span>
                    <div>
                      <p class="lms-section-parent">Publishing / Homepage sections</p>
                      <h2>Navbar</h2>
                      <p>Edit the RTL logo, navigation links, and action buttons.</p>
                    </div>
                  </div>
                  <span class="lms-status" [class.lms-status-live]="sectionEnabled('navbar')">
                    <span></span>{{ sectionEnabled('navbar') ? "Visible" : "Hidden" }}
                  </span>
                </div>

                <div class="lms-section-control">
                  <div>
                    <strong>Display navbar on website</strong>
                    <p>Show or hide the announcement and complete navigation area.</p>
                  </div>
                  <button
                    type="button"
                    class="lms-switch"
                    role="switch"
                    aria-label="Display navbar"
                    [attr.aria-checked]="sectionEnabled('navbar')"
                    [class.is-active]="sectionEnabled('navbar')"
                    [disabled]="saving() || !settings()?.lmsEnabled"
                    (click)="toggleSection('navbar')"
                  ><span></span></button>
                </div>

                <fieldset class="lms-field-group">
                  <legend>Logo details</legend>
                  <p>These details appear from right to left beside the logo mark.</p>
                  <div class="lms-fields">
                    <label><span>Logo image URL</span><input class="tenant-lms-input lms-route-input" formControlName="logoImageUrl" type="url" inputmode="url" placeholder="https://example.com/logo.png" (blur)="onNavbarContentChange()" /></label>
                    <label><span>Teacher name</span><input class="tenant-lms-input" formControlName="teacherName" autocomplete="name" (blur)="onNavbarContentChange()" /></label>
                    <label><span>Subject</span><input class="tenant-lms-input" formControlName="subject" (blur)="onNavbarContentChange()" /></label>
                    <label><span>Grade</span><input class="tenant-lms-input" formControlName="audience" (blur)="onNavbarContentChange()" /></label>
                  </div>
                </fieldset>

                <fieldset class="lms-field-group" formArrayName="navigation">
                  <legend>Navigation links</legend>
                  <p>Rename each link, choose its route, or remove it from the public navbar. Changes publish when you leave a field.</p>
                  <div class="lms-navbar-list">
                    @for (item of form.controls.navigation.controls; track item.controls.key.value; let index = $index) {
                      <div class="lms-navbar-item" [formGroupName]="index">
                        <div class="lms-navbar-item-heading">
                          <span class="lms-order">{{ index + 1 }}</span>
                          <strong>{{ item.controls.label.value || "Navigation item" }}</strong>
                          <label class="lms-enabled-control">
                            <input
                              type="checkbox"
                              formControlName="enabled"
                              [attr.aria-label]="'Show ' + (item.controls.label.value || 'navigation item')"
                              (change)="onNavigationVisibilityChange(index, $any($event.target).checked)"
                            />
                            <span>Show link</span>
                          </label>
                        </div>
                        <div class="lms-fields">
                          <label><span>Link name</span><input class="tenant-lms-input" formControlName="label" (blur)="onNavbarContentChange()" /></label>
                          <label><span>Route</span><input class="tenant-lms-input lms-route-input" formControlName="route" inputmode="url" placeholder="/courses or /#section" (blur)="onNavbarContentChange()" /></label>
                        </div>
                      </div>
                    }
                  </div>
                </fieldset>

                <fieldset class="lms-field-group">
                  <legend>Action buttons</legend>
                  <p>Set the visible name and destination for the two navbar buttons.</p>
                  <div class="lms-button-editor">
                    <div>
                      <strong>Primary button</strong>
                      <div class="lms-fields">
                        <label><span>Button name</span><input class="tenant-lms-input" formControlName="primaryCtaLabel" (blur)="onNavbarContentChange()" /></label>
                        <label><span>Route</span><input class="tenant-lms-input lms-route-input" formControlName="primaryCtaRoute" inputmode="url" (blur)="onNavbarContentChange()" /></label>
                      </div>
                    </div>
                    <div>
                      <strong>Secondary button</strong>
                      <div class="lms-fields">
                        <label><span>Button name</span><input class="tenant-lms-input" formControlName="secondaryCtaLabel" (blur)="onNavbarContentChange()" /></label>
                        <label><span>Route</span><input class="tenant-lms-input lms-route-input" formControlName="secondaryCtaRoute" inputmode="url" (blur)="onNavbarContentChange()" /></label>
                      </div>
                    </div>
                  </div>
                </fieldset>

                <div class="lms-section-help">
                  <mat-icon>info</mat-icon>
                  <p>Use routes such as <strong>/courses</strong>, <strong>/#about</strong>, or a complete external URL.</p>
                </div>
              </section>
            } @else if (activePage() === "hero") {
              <section class="lms-section lms-section-page" formGroupName="hero">
                <div class="lms-section-heading">
                  <div class="lms-section-title">
                    <span class="lms-section-row-icon"><mat-icon>view_carousel</mat-icon></span>
                    <div>
                      <p class="lms-section-parent">Publishing / Homepage sections</p>
                      <h2>Hero section</h2>
                      <p>Edit every message, action, statistic, and portrait shown above the fold.</p>
                    </div>
                  </div>
                  <span class="lms-status" [class.lms-status-live]="sectionEnabled('hero')">
                    <span></span>{{ sectionEnabled('hero') ? "Visible" : "Hidden" }}
                  </span>
                </div>

                <div class="lms-section-control">
                  <div>
                    <strong>Display hero on website</strong>
                    <p>Show or hide the complete hero and summary statistics.</p>
                  </div>
                  <button type="button" class="lms-switch" role="switch" aria-label="Display hero"
                    [attr.aria-checked]="sectionEnabled('hero')" [class.is-active]="sectionEnabled('hero')"
                    [disabled]="saving() || !settings()?.lmsEnabled" (click)="toggleSection('hero')"><span></span></button>
                </div>

                <fieldset class="lms-field-group">
                  <legend>Message</legend>
                  <p>Set the badge, two headline lines, and supporting description.</p>
                  <div class="lms-fields">
                    <label class="lms-field-wide"><span>Experience badge</span><input class="tenant-lms-input" formControlName="badge" dir="rtl" /></label>
                    <label><span>Headline</span><input class="tenant-lms-input" formControlName="headline" dir="rtl" /></label>
                    <label><span>Highlighted headline</span><input class="tenant-lms-input" formControlName="highlightedHeadline" dir="rtl" /></label>
                    <label class="lms-field-wide"><span>Description</span><textarea class="tenant-lms-input" formControlName="description" rows="4" dir="rtl"></textarea></label>
                  </div>
                </fieldset>

                <fieldset class="lms-field-group">
                  <legend>Action buttons</legend>
                  <p>Set the label and destination for each hero action.</p>
                  <div class="lms-button-editor">
                    <div><strong>Primary button</strong><div class="lms-fields">
                      <label><span>Button name</span><input class="tenant-lms-input" formControlName="primaryButtonLabel" dir="rtl" /></label>
                      <label><span>Route</span><input class="tenant-lms-input lms-route-input" formControlName="primaryButtonRoute" placeholder="/#grades" /></label>
                    </div></div>
                    <div><strong>Secondary button</strong><div class="lms-fields">
                      <label><span>Button name</span><input class="tenant-lms-input" formControlName="secondaryButtonLabel" dir="rtl" /></label>
                      <label><span>Route</span><input class="tenant-lms-input lms-route-input" formControlName="secondaryButtonRoute" placeholder="/#sample" /></label>
                    </div></div>
                  </div>
                </fieldset>

                <fieldset class="lms-field-group" formArrayName="miniStats">
                  <legend>Headline statistics</legend>
                  <p>Edit the three compact statistics below the action buttons.</p>
                  <div class="lms-stat-editor">
                    @for (stat of form.controls.hero.controls.miniStats.controls; track $index; let index = $index) {
                      <div class="lms-navbar-item" [formGroupName]="index">
                        <div class="lms-navbar-item-heading"><span class="lms-order">{{ index + 1 }}</span><strong>Statistic {{ index + 1 }}</strong></div>
                        <div class="lms-fields"><label><span>Value</span><input class="tenant-lms-input" formControlName="value" dir="rtl" /></label><label><span>Label</span><input class="tenant-lms-input" formControlName="label" dir="rtl" /></label></div>
                      </div>
                    }
                  </div>
                </fieldset>

                <fieldset class="lms-field-group">
                  <legend>Teacher image</legend>
                  <p>Use a hosted image URL or upload an image from this device.</p>
                  <div class="lms-image-layout">
                    <div class="lms-image-editor">
                      <div class="lms-image-source" role="radiogroup" aria-label="Teacher image source">
                        <button type="button" role="radio" [attr.aria-checked]="heroImageMode() === 'url'" [class.is-active]="heroImageMode() === 'url'" (click)="heroImageMode.set('url')"><mat-icon>link</mat-icon>Image URL</button>
                        <button type="button" role="radio" [attr.aria-checked]="heroImageMode() === 'upload'" [class.is-active]="heroImageMode() === 'upload'" (click)="heroImageMode.set('upload')"><mat-icon>upload</mat-icon>Upload image</button>
                      </div>
                      @if (heroImageMode() === "url") {
                        <label><span>Image URL</span><input class="tenant-lms-input lms-route-input" formControlName="imageUrl" type="text" inputmode="url" placeholder="https://example.com/teacher.jpg" /></label>
                      } @else {
                        <label class="lms-upload-control" [class.is-uploading]="uploadingHeroImage()">
                          <input type="file" accept="image/png,image/jpeg,image/webp" (click)="rememberHeroUploadScroll($event)" (change)="onHeroImageSelected($event)" [disabled]="uploadingHeroImage()" />
                          <mat-icon>{{ uploadingHeroImage() ? "sync" : "add_photo_alternate" }}</mat-icon>
                          <span><strong>{{ uploadingHeroImage() ? "Uploading image..." : "Choose image" }}</strong><small>PNG, JPG, or WebP</small></span>
                        </label>
                        @if (heroImageUploadError()) { <p class="lms-field-error" role="alert">{{ heroImageUploadError() }}</p> }
                      }
                      <div class="lms-fields">
                        <label><span>Image badge</span><input class="tenant-lms-input" formControlName="imageBadge" dir="rtl" /></label>
                        <label><span>Alternative text</span><input class="tenant-lms-input" formControlName="imageAlt" dir="rtl" /></label>
                        <label><span>Teacher name</span><input class="tenant-lms-input" formControlName="imageName" dir="rtl" /></label>
                        <label><span>Caption</span><input class="tenant-lms-input" formControlName="imageCaption" dir="rtl" /></label>
                      </div>
                    </div>
                    <div class="lms-image-preview">
                      @if (heroImagePreviewUrl()) { <img [src]="heroImagePreviewUrl()" [alt]="form.controls.hero.controls.imageAlt.value || 'Hero image preview'" /> }
                      @else { <mat-icon>image</mat-icon><span>Image preview</span> }
                    </div>
                  </div>
                </fieldset>

                <fieldset class="lms-field-group" formArrayName="stats">
                  <legend>Summary statistics</legend>
                  <p>Edit the four statistics displayed in the full-width row below the hero.</p>
                  <div class="lms-stat-editor lms-stat-editor-four">
                    @for (stat of form.controls.hero.controls.stats.controls; track $index; let index = $index) {
                      <div class="lms-navbar-item" [formGroupName]="index">
                        <div class="lms-navbar-item-heading"><span class="lms-order">{{ index + 1 }}</span><strong>Statistic {{ index + 1 }}</strong></div>
                        <div class="lms-fields"><label><span>Value</span><input class="tenant-lms-input" formControlName="value" dir="rtl" /></label><label><span>Label</span><input class="tenant-lms-input" formControlName="label" dir="rtl" /></label></div>
                      </div>
                    }
                  </div>
                </fieldset>
              </section>
            } @else if (activePage() === "grades") {
              <section class="lms-section lms-section-page" formGroupName="grades">
                <div class="lms-section-heading">
                  <div class="lms-section-title">
                    <span class="lms-section-row-icon"><mat-icon>school</mat-icon></span>
                    <div>
                      <p class="lms-section-parent">Publishing / Homepage sections</p>
                      <h2>Grades</h2>
                      <p>Edit the section introduction and every field displayed on the three grade cards.</p>
                    </div>
                  </div>
                  <span class="lms-status" [class.lms-status-live]="sectionEnabled('grades')">
                    <span></span>{{ sectionEnabled('grades') ? "Visible" : "Hidden" }}
                  </span>
                </div>

                <div class="lms-section-control">
                  <div>
                    <strong>Display grades on website</strong>
                    <p>Show or hide the complete Grades section on the tenant LMS homepage.</p>
                  </div>
                  <button type="button" class="lms-switch" role="switch" aria-label="Display grades"
                    [attr.aria-checked]="sectionEnabled('grades')" [class.is-active]="sectionEnabled('grades')"
                    [disabled]="saving() || !settings()?.lmsEnabled" (click)="toggleSection('grades')"><span></span></button>
                </div>

                <fieldset class="lms-field-group">
                  <legend>Section introduction</legend>
                  <p>Edit the label, heading, and supporting text displayed above the grade cards.</p>
                  <div class="lms-fields">
                    <label class="lms-field-wide"><span>Section label</span><input class="tenant-lms-input" formControlName="eyebrow" dir="rtl" /></label>
                    <label class="lms-field-wide"><span>Headline</span><input class="tenant-lms-input" formControlName="headline" dir="rtl" /></label>
                    <label class="lms-field-wide"><span>Description</span><textarea class="tenant-lms-input" formControlName="description" rows="3" dir="rtl"></textarea></label>
                  </div>
                </fieldset>

                <fieldset class="lms-field-group" formArrayName="items">
                  <legend>Grade cards</legend>
                  <p>Edit every value and destination shown on each card. Cards keep their current website order.</p>
                  <div class="lms-grade-editor">
                    @for (item of form.controls.grades.controls.items.controls; track $index; let index = $index) {
                      <div class="lms-navbar-item" [formGroupName]="index">
                        <div class="lms-navbar-item-heading">
                          <span class="lms-order">{{ index + 1 }}</span>
                          <strong>{{ item.controls.title.value || "Grade card " + (index + 1) }}</strong>
                        </div>
                        <div class="lms-fields lms-fields-three">
                          <label><span>Card number</span><input class="tenant-lms-input" formControlName="number" dir="rtl" /></label>
                          <label class="lms-grade-title-field"><span>Grade name</span><input class="tenant-lms-input" formControlName="title" dir="rtl" /></label>
                          <label><span>Units and lessons</span><input class="tenant-lms-input" formControlName="unitsLabel" dir="rtl" /></label>
                          <label class="lms-field-wide"><span>Description</span><textarea class="tenant-lms-input" formControlName="description" rows="3" dir="rtl"></textarea></label>
                          <label><span>Action name</span><input class="tenant-lms-input" formControlName="actionLabel" dir="rtl" /></label>
                          <label><span>Action route</span><input class="tenant-lms-input lms-route-input" formControlName="route" inputmode="url" placeholder="/courses" /></label>
                        </div>
                      </div>
                    }
                  </div>
                </fieldset>
              </section>
            } @else if (activePage() === "aboutTeacher") {
              <section class="lms-section lms-section-page" formGroupName="aboutTeacher">
                <div class="lms-section-heading">
                  <div class="lms-section-title">
                    <span class="lms-section-row-icon"><mat-icon>person</mat-icon></span>
                    <div>
                      <p class="lms-section-parent">Publishing / Homepage sections</p>
                      <h2>About teacher</h2>
                      <p>Edit the teacher portrait, biography, achievements, and signature.</p>
                    </div>
                  </div>
                  <span class="lms-status" [class.lms-status-live]="sectionEnabled('aboutTeacher')">
                    <span></span>{{ sectionEnabled('aboutTeacher') ? "Visible" : "Hidden" }}
                  </span>
                </div>

                <div class="lms-section-control">
                  <div>
                    <strong>Display About teacher on website</strong>
                    <p>Show or hide the complete teacher biography section.</p>
                  </div>
                  <button type="button" class="lms-switch" role="switch" aria-label="Display About teacher"
                    [attr.aria-checked]="sectionEnabled('aboutTeacher')" [class.is-active]="sectionEnabled('aboutTeacher')"
                    [disabled]="saving() || !settings()?.lmsEnabled" (click)="toggleSection('aboutTeacher')"><span></span></button>
                </div>

                <fieldset class="lms-field-group">
                  <legend>Section content</legend>
                  <p>Edit the label, teacher name, and biography shown beside the portrait.</p>
                  <div class="lms-fields">
                    <label><span>Section label</span><input class="tenant-lms-input" formControlName="eyebrow" dir="rtl" /></label>
                    <label><span>Teacher heading</span><input class="tenant-lms-input" formControlName="headline" dir="rtl" /></label>
                    <label><span>First paragraph opening</span><input class="tenant-lms-input" formControlName="firstParagraphPrefix" dir="rtl" /></label>
                    <label><span>Highlighted experience</span><input class="tenant-lms-input" formControlName="experienceHighlight" dir="rtl" /></label>
                    <label class="lms-field-wide"><span>First paragraph continuation</span><textarea class="tenant-lms-input" formControlName="firstParagraphSuffix" rows="4" dir="rtl"></textarea></label>
                    <label class="lms-field-wide"><span>Second paragraph</span><textarea class="tenant-lms-input" formControlName="secondParagraph" rows="4" dir="rtl"></textarea></label>
                    <label class="lms-field-wide"><span>Signature</span><input class="tenant-lms-input" formControlName="signature" dir="rtl" /></label>
                  </div>
                </fieldset>

                <fieldset class="lms-field-group">
                  <legend>Teacher portrait</legend>
                  <p>Use a hosted image URL or upload an image from this device.</p>
                  <div class="lms-image-layout">
                    <div class="lms-image-editor">
                      <div class="lms-image-source" role="radiogroup" aria-label="About teacher image source">
                        <button type="button" role="radio" [attr.aria-checked]="aboutImageMode() === 'url'" [class.is-active]="aboutImageMode() === 'url'" (click)="aboutImageMode.set('url')"><mat-icon>link</mat-icon>Image URL</button>
                        <button type="button" role="radio" [attr.aria-checked]="aboutImageMode() === 'upload'" [class.is-active]="aboutImageMode() === 'upload'" (click)="aboutImageMode.set('upload')"><mat-icon>upload</mat-icon>Upload image</button>
                      </div>
                      @if (aboutImageMode() === "url") {
                        <label><span>Image URL</span><input class="tenant-lms-input lms-route-input" formControlName="imageUrl" type="text" inputmode="url" placeholder="https://example.com/teacher.jpg" /></label>
                      } @else {
                        <label class="lms-upload-control" [class.is-uploading]="uploadingAboutImage()">
                          <input type="file" accept="image/png,image/jpeg,image/webp" (click)="rememberHeroUploadScroll($event)" (change)="onAboutImageSelected($event)" [disabled]="uploadingAboutImage()" />
                          <mat-icon>{{ uploadingAboutImage() ? "sync" : "add_photo_alternate" }}</mat-icon>
                          <span><strong>{{ uploadingAboutImage() ? "Uploading image..." : "Choose image" }}</strong><small>PNG, JPG, or WebP</small></span>
                        </label>
                        @if (aboutImageUploadError()) { <p class="lms-field-error" role="alert">{{ aboutImageUploadError() }}</p> }
                      }
                      <label><span>Alternative text</span><input class="tenant-lms-input" formControlName="imageAlt" dir="rtl" /></label>
                    </div>
                    <div class="lms-image-preview">
                      @if (aboutImagePreviewUrl()) { <img [src]="aboutImagePreviewUrl()" [alt]="form.controls.aboutTeacher.controls.imageAlt.value || 'About teacher image preview'" /> }
                      @else { <mat-icon>image</mat-icon><span>Image preview</span> }
                    </div>
                  </div>
                </fieldset>

                <fieldset class="lms-field-group" formArrayName="stats">
                  <legend>Teacher achievements</legend>
                  <p>Edit the four statistics displayed beneath the biography.</p>
                  <div class="lms-stat-editor lms-stat-editor-four">
                    @for (stat of form.controls.aboutTeacher.controls.stats.controls; track $index; let index = $index) {
                      <div class="lms-navbar-item" [formGroupName]="index">
                        <div class="lms-navbar-item-heading"><span class="lms-order">{{ index + 1 }}</span><strong>Achievement {{ index + 1 }}</strong></div>
                        <div class="lms-fields"><label><span>Value</span><input class="tenant-lms-input" formControlName="value" dir="rtl" /></label><label><span>Label</span><input class="tenant-lms-input" formControlName="label" dir="rtl" /></label></div>
                      </div>
                    }
                  </div>
                </fieldset>
              </section>
            } @else if (activePage() === "courses") {
              <section class="lms-section lms-section-page" formGroupName="courses">
                <div class="lms-section-heading">
                  <div class="lms-section-title"><span class="lms-section-row-icon"><mat-icon>play_lesson</mat-icon></span><div>
                    <p class="lms-section-parent">Publishing / Homepage sections</p><h2>Courses</h2>
                    <p>Edit the section content and manage every course card shown on the homepage.</p>
                  </div></div>
                  <span class="lms-status" [class.lms-status-live]="sectionEnabled('courses')"><span></span>{{ sectionEnabled('courses') ? "Visible" : "Hidden" }}</span>
                </div>
                <div class="lms-section-control">
                  <div><strong>Display Courses on website</strong><p>Show or hide the complete course preview section.</p></div>
                  <button type="button" class="lms-switch" role="switch" aria-label="Display Courses" [attr.aria-checked]="sectionEnabled('courses')" [class.is-active]="sectionEnabled('courses')" [disabled]="saving() || !settings()?.lmsEnabled" (click)="toggleSection('courses')"><span></span></button>
                </div>
                <fieldset class="lms-field-group">
                  <legend>Section introduction</legend><p>Edit the label, heading, supporting text, and final link.</p>
                  <div class="lms-fields">
                    <label><span>Section label</span><input class="tenant-lms-input" formControlName="eyebrow" dir="rtl" /></label>
                    <label><span>Headline</span><input class="tenant-lms-input" formControlName="headline" dir="rtl" /></label>
                    <label class="lms-field-wide"><span>Description</span><textarea class="tenant-lms-input" formControlName="description" rows="3" dir="rtl"></textarea></label>
                    <label><span>View all button</span><input class="tenant-lms-input" formControlName="allCoursesLabel" dir="rtl" /></label>
                    <label><span>View all route</span><input class="tenant-lms-input lms-route-input" formControlName="allCoursesRoute" /></label>
                  </div>
                </fieldset>
                <fieldset class="lms-field-group" formArrayName="items">
                  <div class="lms-manager-heading"><div><legend>Course cards</legend><p>Add, edit, or remove course cards. Images use a 16:10 crop on the website.</p></div><button type="button" class="lms-button lms-button-secondary" (click)="addCourse()" [disabled]="form.controls.courses.controls.items.length >= 24"><mat-icon>add</mat-icon>Add course</button></div>
                  <div class="lms-homepage-course-toolbar" role="search">
                    <label class="lms-course-search"><mat-icon>search</mat-icon><span class="lms-visually-hidden">Search course cards</span><input type="search" placeholder="Search cards by title, level, price, or route" [value]="homepageCourseCardSearch()" (input)="setHomepageCourseCardSearch($event)" /></label>
                  </div>
                  @if (filteredHomepageCourseCardCount()) {
                    <div class="lms-course-editor lms-course-card-accordion">
                      @for (courseIndex of pagedHomepageCourseCardIndexes(); track courseIndex) {
                        @if (form.controls.courses.controls.items.at(courseIndex); as item) {
                          <article class="lms-navbar-item lms-course-item lms-homepage-course-card" [class.is-expanded]="isHomepageCourseCardExpanded(courseIndex)" [formGroupName]="courseIndex">
                            <div class="lms-homepage-course-card-head">
                              <button type="button" class="lms-homepage-course-card-toggle" [attr.aria-expanded]="isHomepageCourseCardExpanded(courseIndex)" [attr.aria-controls]="'homepage-course-card-panel-' + courseIndex" (click)="toggleHomepageCourseCard(courseIndex)">
                                <span class="lms-order">{{ courseIndex + 1 }}</span>
                                <span class="lms-homepage-course-card-title">
                                  <strong>{{ item.controls.title.value || "New course" }}</strong>
                                  <small>{{ item.controls.level.value || "No level" }} · {{ item.controls.route.value || "No route" }}</small>
                                </span>
                                <span class="lms-homepage-course-card-facts"><span>{{ item.controls.lessonsLabel.value || "No lessons" }}</span><span>{{ item.controls.price.value || "No price" }}</span></span>
                                <mat-icon>{{ isHomepageCourseCardExpanded(courseIndex) ? "expand_less" : "expand_more" }}</mat-icon>
                              </button>
                              <button type="button" class="lms-remove-button" (click)="removeCourse(courseIndex)" [attr.aria-label]="'Remove ' + (item.controls.title.value || 'course')"><mat-icon>delete_outline</mat-icon>Remove</button>
                            </div>
                            @if (isHomepageCourseCardExpanded(courseIndex)) {
                              <div class="lms-homepage-course-card-panel" [id]="'homepage-course-card-panel-' + courseIndex">
                                <label class="lms-course-selector">
                                  <span>Grade / level</span>
                                  <select class="tenant-lms-input" formControlName="gradeId" (change)="selectHomepageCourseGrade(courseIndex, $event)">
                                    <option value="">Choose a grade</option>
                                    @for (grade of tenantGrades(); track grade.id) {
                                      <option [value]="grade.id">{{ grade.name }} · {{ grade.level }}</option>
                                    }
                                  </select>
                                  <small>Grades are loaded from Tenant Grades.</small>
                                </label>
                                <label class="lms-course-selector">
                                  <span>Related content course</span>
                                  <select class="tenant-lms-input" formControlName="courseId" (change)="selectHomepageCourse(courseIndex, $event)" [disabled]="!item.controls.gradeId.value">
                                    <option value="">{{ item.controls.gradeId.value ? "Choose a course" : "Choose a grade first" }}</option>
                                    @for (course of homepageCourseOptions(courseIndex); track course.id) {
                                      <option [value]="course.id">{{ course.title }} · {{ course.gradeName }}{{ course.published ? "" : " · Draft" }}</option>
                                    }
                                  </select>
                                  <small>Select a course created in Content / Courses. Its details will fill this card and can still be customized below.</small>
                                </label>
                                @if (!coursesLoading() && !managedCourses().length) {
                                  <div class="lms-inline-notice"><mat-icon>info</mat-icon><span>No content courses are available.</span><a [routerLink]="['/tenant/lms-settings/content/courses/new']">Create a course</a></div>
                                } @else if (!coursesLoading() && item.controls.gradeId.value && !homepageCourseOptions(courseIndex).length) {
                                  <div class="lms-inline-notice"><mat-icon>info</mat-icon><span>No content courses match this grade.</span><a [routerLink]="['/tenant/lms-settings/content/courses/new']">Create a course</a></div>
                                }
                                <div class="lms-course-media">
                                  <div class="lms-image-editor">
                                    <label><span>Thumbnail URL</span><input class="tenant-lms-input lms-route-input" formControlName="imageUrl" placeholder="https://example.com/course.jpg" /></label>
                                    <label class="lms-upload-control" [class.is-uploading]="uploadingCourseIndex() === courseIndex">
                                      <input type="file" accept="image/png,image/jpeg,image/webp" (click)="rememberHeroUploadScroll($event)" (change)="onCourseThumbnailSelected(courseIndex, $event)" [disabled]="uploadingCourseIndex() !== null" />
                                      <mat-icon>{{ uploadingCourseIndex() === courseIndex ? "sync" : "add_photo_alternate" }}</mat-icon><span><strong>{{ uploadingCourseIndex() === courseIndex ? "Uploading thumbnail..." : "Upload thumbnail" }}</strong><small>PNG, JPG, or WebP</small></span>
                                    </label>
                                    @if (courseImageUploadError(courseIndex)) { <p class="lms-field-error" role="alert">{{ courseImageUploadError(courseIndex) }}</p> }
                                    <label><span>Alternative text</span><input class="tenant-lms-input" formControlName="imageAlt" dir="rtl" /></label>
                                  </div>
                                  <div class="lms-course-preview">@if (coursePreviewUrl(courseIndex)) { <img [src]="coursePreviewUrl(courseIndex)" [alt]="item.controls.imageAlt.value" /> } @else if (item.controls.symbol.value) { <span class="lms-course-symbol">{{ item.controls.symbol.value }}</span> } @else { <mat-icon class="lms-course-placeholder">image_not_supported</mat-icon> }</div>
                                </div>
                                <div class="lms-fields lms-fields-three">
                                  <label><span>Fallback symbol <small>(optional)</small></span><input class="tenant-lms-input" formControlName="symbol" placeholder="For example, ∫ dx" /></label>
                                  <label><span>Display level</span><input class="tenant-lms-input" formControlName="level" dir="rtl" /></label>
                                  <label><span>Course title</span><input class="tenant-lms-input" formControlName="title" dir="rtl" /></label>
                                  <label><span>Lessons</span><input class="tenant-lms-input" formControlName="lessonsLabel" dir="rtl" /></label>
                                  <label><span>Rating</span><input class="tenant-lms-input" formControlName="ratingLabel" dir="rtl" /></label>
                                  <label><span>Price</span><input class="tenant-lms-input" formControlName="price" dir="rtl" /></label>
                                  <label><span>Old price (optional)</span><input class="tenant-lms-input" formControlName="oldPrice" dir="rtl" /></label>
                                  <label><span>Button label</span><input class="tenant-lms-input" formControlName="actionLabel" dir="rtl" /></label>
                                  <label><span>Course route</span><input class="tenant-lms-input lms-route-input" formControlName="route" /></label>
                                </div>
                              </div>
                            }
                          </article>
                        }
                      }
                    </div>
                    <div class="lms-report-pagination lms-homepage-course-pagination">
                      <span>Showing {{ homepageCourseCardResultStart() }}-{{ homepageCourseCardResultEnd() }} of {{ filteredHomepageCourseCardCount() }} course cards</span>
                      <div><button type="button" class="lms-page-button lms-page-icon-button" (click)="goToHomepageCourseCardPage(homepageCourseCardPage() - 1)" [disabled]="homepageCourseCardPage() === 1" title="Previous page" aria-label="Previous course cards page"><mat-icon>chevron_left</mat-icon></button><span class="lms-page-summary">Page {{ homepageCourseCardPage() }} of {{ homepageCourseCardPageCount() }}</span><button type="button" class="lms-page-button lms-page-icon-button" (click)="goToHomepageCourseCardPage(homepageCourseCardPage() + 1)" [disabled]="homepageCourseCardPage() === homepageCourseCardPageCount()" title="Next page" aria-label="Next course cards page"><mat-icon>chevron_right</mat-icon></button></div>
                    </div>
                  } @else {
                    <div class="lms-empty-editor"><mat-icon>{{ form.controls.courses.controls.items.length ? "search_off" : "play_lesson" }}</mat-icon><strong>{{ form.controls.courses.controls.items.length ? "No course cards match" : "No courses yet" }}</strong><span>{{ form.controls.courses.controls.items.length ? "Try another title, level, price, or route." : "Add a course to show it on the homepage." }}</span></div>
                  }
                </fieldset>
              </section>
            } @else if (selectedSection(); as section) {
              <section class="lms-section lms-section-page">
                <div class="lms-section-heading">
                  <div class="lms-section-title">
                    <span class="lms-section-row-icon"><mat-icon>{{ section.icon }}</mat-icon></span>
                    <div>
                      <p class="lms-section-parent">Publishing / Homepage sections</p>
                      <h2>{{ section.label }}</h2>
                      <p>{{ section.description }}</p>
                    </div>
                  </div>
                  <span class="lms-status" [class.lms-status-live]="sectionEnabled(section.key)">
                    <span></span>{{ sectionEnabled(section.key) ? "Visible" : "Hidden" }}
                  </span>
                </div>
                <div class="lms-section-control">
                  <div>
                    <strong>Display on website</strong>
                    <p>Turn this section on or off on the tenant LMS homepage.</p>
                  </div>
                  <button
                    type="button"
                    class="lms-switch"
                    role="switch"
                    [attr.aria-label]="'Display ' + section.label"
                    [attr.aria-checked]="sectionEnabled(section.key)"
                    [class.is-active]="sectionEnabled(section.key)"
                    [disabled]="saving() || !settings()?.lmsEnabled"
                    (click)="toggleSection(section.key)"
                  ><span></span></button>
                </div>
                <div class="lms-section-help">
                  <mat-icon>info</mat-icon>
                  <p>The visibility change is published after you select <strong>Save changes</strong>.</p>
                </div>
              </section>
            }

            @if (activePage() === "contentCourses") {
              @if (courseMode() === "list") {
              <section class="lms-section lms-section-page lms-course-index">
                <div class="lms-section-heading lms-course-index-heading">
                  <div class="lms-section-title"><span class="lms-section-row-icon"><mat-icon>video_library</mat-icon></span><div><p class="lms-section-parent">Content / Courses</p><h2>Courses</h2><p>Search, filter, and manage the courses available in this tenant LMS.</p></div></div>
                  <a class="lms-button lms-button-primary" [routerLink]="['/tenant/lms-settings/content/courses/new']"><mat-icon>add</mat-icon>Create new course</a>
                </div>

                @if (courseError()) { <div class="lms-inline-alert is-error lms-index-alert" role="alert"><mat-icon>error_outline</mat-icon>{{ courseError() }}</div> }
                @if (courseMessage()) { <div class="lms-inline-alert is-success lms-index-alert" role="status"><mat-icon>check_circle</mat-icon>{{ courseMessage() }}</div> }

                <div class="lms-course-toolbar" role="search">
                  <label class="lms-course-search"><mat-icon>search</mat-icon><span class="lms-visually-hidden">Search courses</span><input type="search" placeholder="Search by course title, grade, or route" [value]="courseSearch()" (input)="setCourseSearch($event)" /></label>
                  <label><span class="lms-visually-hidden">Filter by status</span><select class="tenant-lms-input" [value]="courseStatusFilter()" (change)="setCourseStatusFilter($event)"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select></label>
                  <label><span class="lms-visually-hidden">Filter by grade</span><select class="tenant-lms-input" [value]="courseGradeFilter()" (change)="setCourseGradeFilter($event)"><option value="all">All grades</option>@for (grade of tenantGrades(); track grade.id) { <option [value]="grade.id">{{ grade.name }}</option> }</select></label>
                </div>

                @if (coursesLoading()) {
                  <div class="lms-course-loading"><span class="lms-skeleton"></span><span class="lms-skeleton lms-skeleton-short"></span></div>
                } @else if (filteredManagedCourses().length) {
                  <div class="lms-course-card-list" aria-label="Course cards">
                    @for (course of pagedManagedCourses(); track course.id) {
                      <article class="lms-course-index-card" [class.is-expanded]="isCourseCardExpanded(course.id)">
                        <button type="button" class="lms-course-index-card-head" [attr.aria-expanded]="isCourseCardExpanded(course.id)" [attr.aria-controls]="'course-card-panel-' + course.id" (click)="toggleCourseCard(course.id)">
                          <span class="lms-course-index-thumb">@if (course.thumbnailUrl) { <img [src]="resolveAssetUrl(course.thumbnailUrl)" alt="" /> } @else { <mat-icon>play_lesson</mat-icon> }</span>
                          <span class="lms-course-index-main">
                            <span class="lms-course-index-title-row"><strong>{{ course.title }}</strong><span class="lms-course-status" [class.is-published]="course.published"><span></span>{{ course.published ? 'Published' : 'Draft' }}</span></span>
                            <small>/courses/{{ course.slug }}</small>
                          </span>
                          <span class="lms-course-index-meta">
                            <span><mat-icon>school</mat-icon>{{ course.gradeName }}</span>
                            <span><mat-icon>menu_book</mat-icon>{{ courseLessonCount(course) }} lessons</span>
                            <span><mat-icon>payments</mat-icon>{{ course.price }} {{ course.currency }}</span>
                          </span>
                          <mat-icon class="lms-course-index-chevron">{{ isCourseCardExpanded(course.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
                        </button>
                        @if (isCourseCardExpanded(course.id)) {
                          <div class="lms-course-index-panel" [id]="'course-card-panel-' + course.id">
                            <div class="lms-course-index-copy">
                              <p>{{ course.subtitle || course.description || 'No course summary has been added yet.' }}</p>
                              <dl>
                                <div><dt>Updated</dt><dd>{{ course.updatedAt | date:'mediumDate' }}</dd></div>
                                <div><dt>Duration</dt><dd>{{ course.durationLabel || 'Not set' }}</dd></div>
                                <div><dt>Students</dt><dd>{{ course.studentsLabel || 'Not set' }}</dd></div>
                                <div><dt>Rating</dt><dd>{{ course.ratingLabel || 'Not set' }}</dd></div>
                              </dl>
                            </div>
                            <div class="lms-course-index-actions" [attr.aria-label]="'Actions for ' + course.title">
                              <a class="lms-row-action" [routerLink]="['/tenant/lms-settings/content/courses', course.id, 'edit']" [attr.aria-label]="'Edit ' + course.title" [title]="'Edit ' + course.title"><mat-icon>edit</mat-icon></a>
                              <button type="button" class="lms-row-action" (click)="cloneManagedCourse(course)" [disabled]="courseSaving()" [attr.aria-label]="'Clone ' + course.title" [title]="'Clone ' + course.title"><mat-icon>content_copy</mat-icon></button>
                              <button type="button" class="lms-row-action" disabled [attr.aria-label]="'Report for ' + course.title + ' is not available yet'" title="Report is not available yet"><mat-icon>query_stats</mat-icon></button>
                              <a class="lms-row-action" [routerLink]="coursePreviewRoute(course)" [attr.aria-label]="'Preview ' + course.title" [title]="'Preview ' + course.title"><mat-icon>visibility</mat-icon></a>
                              <button type="button" class="lms-row-action is-danger" (click)="openCourseDeleteDialog(course)" [disabled]="courseSaving()" [attr.aria-label]="'Delete ' + course.title" [title]="'Delete ' + course.title"><mat-icon>delete_outline</mat-icon></button>
                            </div>
                          </div>
                        }
                      </article>
                    }
                  </div>
                  <div class="lms-report-pagination">
                    <span>Showing {{ courseResultStart() }}-{{ courseResultEnd() }} of {{ filteredManagedCourses().length }} courses</span>
                    <div><button type="button" class="lms-page-button lms-page-icon-button" (click)="goToCoursePage(coursePage() - 1)" [disabled]="coursePage() === 1" title="Previous page" aria-label="Previous course page"><mat-icon>chevron_left</mat-icon></button><span class="lms-page-summary">Page {{ coursePage() }} of {{ coursePageCount() }}</span><button type="button" class="lms-page-button lms-page-icon-button" (click)="goToCoursePage(coursePage() + 1)" [disabled]="coursePage() === coursePageCount()" title="Next page" aria-label="Next course page"><mat-icon>chevron_right</mat-icon></button></div>
                  </div>
                } @else {
                  <div class="lms-course-empty"><mat-icon>{{ managedCourses().length ? 'search_off' : 'library_books' }}</mat-icon><strong>{{ managedCourses().length ? 'No courses match these filters' : 'Create your first course' }}</strong><p>{{ managedCourses().length ? 'Try another search term, status, or grade.' : 'Add the course details, pricing, and optional curriculum content.' }}</p>@if (!managedCourses().length) { <a class="lms-button lms-button-primary" [routerLink]="['/tenant/lms-settings/content/courses/new']"><mat-icon>add</mat-icon>Create new course</a> }</div>
                }
              </section>
              } @else if (courseMode() === "preview") {
              <section class="lms-section lms-section-page lms-course-report">
                <div class="lms-section-heading lms-course-index-heading">
                  <div class="lms-section-title"><span class="lms-section-row-icon"><mat-icon>visibility</mat-icon></span><div><p class="lms-section-parent">Content / Courses / Preview</p><h2>{{ selectedPreviewCourse()?.title || 'Course preview' }}</h2><p>Review enrolled users, progress status, and enrollment dates for this course.</p></div></div>
                  @if (selectedPreviewCourse(); as course) {
                    <a class="lms-button lms-button-primary" [routerLink]="['/tenant/lms-settings/content/courses', course.id, 'edit']"><mat-icon>edit</mat-icon>Edit course</a>
                  }
                </div>

                @if (courseError()) { <div class="lms-inline-alert is-error lms-index-alert" role="alert"><mat-icon>error_outline</mat-icon>{{ courseError() }}</div> }

                <div class="lms-report-actions">
                  <a class="lms-button lms-button-secondary" [routerLink]="['/tenant/lms-settings/content/courses']"><mat-icon>arrow_back</mat-icon>Back to courses</a>
                  <a class="lms-enroll-link" role="button" tabindex="0" (click)="openEnrollDrawer()" (keydown.enter)="openEnrollDrawer()" (keydown.space)="$event.preventDefault(); openEnrollDrawer()"><mat-icon>person_add</mat-icon><span>Enroll Learner</span></a>
                </div>

                <div class="lms-course-toolbar lms-report-toolbar" role="search">
                  <label class="lms-course-search"><mat-icon>search</mat-icon><span class="lms-visually-hidden">Search enrollments</span><input type="search" placeholder="Search by user, email, or role" [value]="enrollmentSearch()" (input)="setEnrollmentSearch($event)" /></label>
                  <label><span class="lms-visually-hidden">Filter by role</span><select class="tenant-lms-input" [value]="enrollmentRoleFilter()" (change)="setEnrollmentRoleFilter($event)"><option value="all">All roles</option>@for (role of enrollmentRoleOptions(); track role) { <option [value]="role">{{ role }}</option> }</select></label>
                  <label><span class="lms-visually-hidden">Filter by progress</span><select class="tenant-lms-input" [value]="enrollmentProgressFilter()" (change)="setEnrollmentProgressFilter($event)"><option value="all">All progress</option><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="completed">Completed</option><option value="expired">Expired</option></select></label>
                </div>

                @if (coursesLoading()) {
                  <div class="lms-course-loading"><span class="lms-skeleton"></span><span class="lms-skeleton lms-skeleton-short"></span></div>
                } @else if (pagedCourseEnrollmentRows().length) {
                  <div class="lms-course-table-wrap">
                    <table class="lms-course-table lms-report-table">
                      <thead><tr><th>Users</th><th>Role</th><th>Progress status</th><th>Enrollment date</th><th>Completion date</th><th>Expiration date</th><th>Actinos</th></tr></thead>
                      <tbody>
                        @for (row of pagedCourseEnrollmentRows(); track row.userId) {
                          <tr>
                            <td><div class="lms-user-cell"><span>{{ row.userName.charAt(0) }}</span><div><strong>{{ row.userName }}</strong><small>{{ row.email }}</small></div></div></td>
                            <td>{{ row.role }}</td>
                            <td><span class="lms-progress-pill" [class.is-completed]="row.progressStatus === 'completed'" [class.is-in-progress]="row.progressStatus === 'in-progress'" [class.is-not-started]="row.progressStatus === 'not-started'" [class.is-expired]="row.progressStatus === 'expired'"><mat-icon>{{ progressStatusIcon(row.progressStatus) }}</mat-icon>{{ progressStatusLabel(row.progressStatus) }}<small>{{ row.progress }}%</small></span></td>
                            <td>{{ row.enrollmentDate | date:'mediumDate' }}</td>
                            <td>{{ row.completionDate ? (row.completionDate | date:'mediumDate') : '—' }}</td>
                            <td>{{ row.expirationDate | date:'mediumDate' }}</td>
                            <td class="lms-course-actions-cell">
                              <div class="lms-course-row-actions">
                                <span class="lms-course-actions-more" aria-hidden="true"><mat-icon>more_horiz</mat-icon></span>
                                <div class="lms-course-actions" [attr.aria-label]="'Actions for ' + row.userName">
                                  <button type="button" class="lms-row-action" (click)="resetUserCourseProgress(row.userId)" [attr.aria-label]="'Reset progress for ' + row.userName" [title]="'Reset progress for ' + row.userName"><mat-icon>restart_alt</mat-icon></button>
                                  <button type="button" class="lms-row-action" [attr.aria-label]="'Preview ' + row.userName" [title]="'Preview ' + row.userName"><mat-icon>visibility</mat-icon></button>
                                  <button type="button" class="lms-row-action is-danger" (click)="removeUserFromCourse(row.userId)" [attr.aria-label]="'Remove ' + row.userName" [title]="'Remove ' + row.userName"><mat-icon>person_remove</mat-icon></button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  <div class="lms-report-pagination">
                    <span>Showing {{ enrollmentResultStart() }}-{{ enrollmentResultEnd() }} of {{ filteredCourseEnrollmentRows().length }} users</span>
                    <div><label class="lms-page-size">Rows<select [value]="enrollmentPageSize()" (change)="setEnrollmentPageSize($event)"><option [value]="5">5</option><option [value]="10">10</option><option [value]="20">20</option></select></label><button type="button" class="lms-page-button lms-page-icon-button" (click)="goToEnrollmentPage(enrollmentPage() - 1)" [disabled]="enrollmentPage() === 1" title="Previous page" aria-label="Previous enrollment page"><mat-icon>chevron_left</mat-icon></button><span class="lms-page-summary">Page {{ enrollmentPage() }} of {{ enrollmentPageCount() }}</span><button type="button" class="lms-page-button lms-page-icon-button" (click)="goToEnrollmentPage(enrollmentPage() + 1)" [disabled]="enrollmentPage() === enrollmentPageCount()" title="Next page" aria-label="Next enrollment page"><mat-icon>chevron_right</mat-icon></button></div>
                  </div>
                } @else {
                  <div class="lms-course-empty"><mat-icon>person_search</mat-icon><strong>No users match these filters</strong><p>Use search, role, and progress filters to narrow this course enrollment list.</p></div>
                }
              </section>
              } @else if (isCourseContentNodePreview()) {
              <section class="lms-course-authoring-page" aria-label="Course builder workspace">
                <header class="lms-builder-header">
                  <div class="lms-builder-header-main">
                    <button type="button" class="lms-builder-back" (click)="closeCourseContentPreview()" aria-label="Back to course builder" title="Back to course builder"><mat-icon>arrow_back</mat-icon></button>
                    <span class="lms-builder-course-icon"><mat-icon>{{ courseContentPreviewIcon() }}</mat-icon></span>
                    <div>
                      <p class="lms-builder-breadcrumb">Courses / {{ courseForm.controls.title.value || 'New course' }} / Builder</p>
                      <h2>{{ courseContentAuthoringTitle() }}</h2>
                    </div>
                    <span class="lms-builder-status" [class.is-published]="courseForm.controls.published.value">{{ courseForm.controls.published.value ? 'Published' : 'Draft' }}</span>
                  </div>
                  <div class="lms-builder-header-actions">
                    <button type="button" class="lms-autosave-state" [class.is-saving]="builderAutosaveState() === 'saving'" [class.is-failed]="builderAutosaveState() === 'failed'" (click)="builderAutosaveState() === 'failed' ? retryBuilderAutosave() : null" [title]="builderAutosaveState() === 'failed' ? 'Retry autosave' : builderAutosaveLabel()"><mat-icon>{{ builderAutosaveIcon() }}</mat-icon>{{ builderAutosaveLabel() }}</button>
                    <button type="button" class="lms-builder-secondary" [disabled]="isBuilderRootSelected() || isBuilderFolderSelected()" (click)="previewSelectedBuilderUnit()"><mat-icon>visibility</mat-icon>Preview</button>
                    <button type="button" class="lms-builder-secondary" [disabled]="isBuilderRootSelected() || isBuilderFolderSelected()" (click)="toggleBuilderInspector()"><mat-icon>tune</mat-icon>Settings</button>
                    <button type="button" class="lms-builder-primary" [disabled]="courseSaving()" (click)="publishCourseFromBuilder()"><mat-icon>publish</mat-icon>{{ courseForm.controls.published.value ? 'Update publish' : 'Publish course' }}</button>
                  </div>
                </header>

                <div class="lms-builder-shell" [class.has-inspector]="builderInspectorOpen() && !isCourseAuthoringRootSelected() && !isBuilderFolderSelected()">
                  <aside class="lms-builder-curriculum" aria-label="Course curriculum">
                    <div class="lms-builder-sidebar-head">
                      <div>
                        <h3>{{ courseContentAuthoringTitle() }}</h3>
                        <p>{{ courseContentSummary() }}</p>
                      </div>
                    </div>
                    <div class="lms-builder-sidebar-actions">
                      <div class="lms-builder-add-control" role="presentation" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                        <button
                          type="button"
                          class="lms-builder-add-button"
                          aria-haspopup="menu"
                          [attr.aria-expanded]="builderAddMenuOpen()"
                          (click)="toggleBuilderAddMenu()"
                        >
                          <mat-icon>add</mat-icon>
                          Add
                        </button>

                        @if (builderAddMenuOpen()) {
                          <div class="lms-builder-add-menu" role="menu" aria-label="Add course content">
                            <div class="lms-builder-add-menu-primary">
                              <button
                                type="button"
                                role="menuitem"
                                [class.is-active]="builderAddMenuCategory() === 'standard'"
                                (mouseenter)="selectBuilderAddMenuCategory('standard')"
                                (focus)="selectBuilderAddMenuCategory('standard')"
                              >
                                <mat-icon>description</mat-icon>
                                <span><strong>Standard Content</strong><small>Add Text, Video, Presentation, etc</small></span>
                                <mat-icon>chevron_right</mat-icon>
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                [class.is-active]="builderAddMenuCategory() === 'activities'"
                                (mouseenter)="selectBuilderAddMenuCategory('activities')"
                                (focus)="selectBuilderAddMenuCategory('activities')"
                              >
                                <mat-icon>psychology</mat-icon>
                                <span><strong>Learning Activities</strong><small>Add Test, Assignment, Survey, Live session</small></span>
                                <mat-icon>chevron_right</mat-icon>
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                [class.is-active]="builderAddMenuCategory() === 'more'"
                                (mouseenter)="selectBuilderAddMenuCategory('more')"
                                (focus)="selectBuilderAddMenuCategory('more')"
                              >
                                <mat-icon>apps</mat-icon>
                                <span><strong>More</strong><small>Add section, clone units, etc</small></span>
                                <mat-icon>chevron_right</mat-icon>
                              </button>
                            </div>

                            @if (builderAddMenuCategory()) {
                              <div
                                class="lms-builder-add-submenu"
                                [class.is-activities]="builderAddMenuCategory() === 'activities'"
                                [class.is-more]="builderAddMenuCategory() === 'more'"
                                role="menu"
                                [attr.aria-label]="builderAddMenuCategoryLabel()"
                              >
                              @if (builderAddMenuCategory() === 'standard') {
                                <button type="button" role="menuitem" (click)="addContentUnitFromMenu()"><mat-icon>description</mat-icon><span>Content</span></button>
                                <button type="button" role="menuitem" (click)="addWebContentUnitFromMenu()"><mat-icon>cloud</mat-icon><span>Web content</span></button>
                                <button type="button" role="menuitem" (click)="addVideoUnitFromMenu()"><mat-icon>play_arrow</mat-icon><span>Video</span></button>
                                <button type="button" role="menuitem" (click)="addAudioUnitFromMenu()"><mat-icon>volume_up</mat-icon><span>Audio</span></button>
                                <button type="button" role="menuitem" (click)="addDocumentUnitFromMenu()"><mat-icon>present_to_all</mat-icon><span>Presentation | Document</span></button>
                                <button type="button" role="menuitem" (click)="addIframeUnitFromMenu()"><mat-icon>code</mat-icon><span>iFrame</span></button>
                              } @else if (builderAddMenuCategory() === 'activities') {
                                <button type="button" role="menuitem" (click)="addTestUnitFromMenu()"><mat-icon>quiz</mat-icon><span>Test</span></button>
                                <button type="button" role="menuitem" (click)="addSurveyUnitFromMenu()"><mat-icon>check_box</mat-icon><span>Survey</span></button>
                                <button type="button" role="menuitem" (click)="addCourseContentFromMenu('ASSIGNMENT')"><mat-icon>edit</mat-icon><span>Assignment</span></button>
                                <button type="button" role="menuitem" (click)="addLiveSessionUnitFromMenu()"><mat-icon>groups</mat-icon><span>Instructor-led training</span></button>
                                <button type="button" role="menuitem" (click)="addScormUnitFromMenu()"><mat-icon>inventory_2</mat-icon><span>SCORM | xAPI | cmi5</span></button>
                              } @else {
                                <button type="button" role="menuitem" (click)="addCourseContentFromMenu('SECTION')"><mat-icon>format_quote</mat-icon><span>Section</span></button>
                                <button type="button" role="menuitem" (click)="addCourseCloneFromMenu()"><mat-icon>content_copy</mat-icon><span>Clone from another course</span></button>
                                <button type="button" role="menuitem" (click)="addLinkedCourseFromMenu()"><mat-icon>link</mat-icon><span>Link from another course</span></button>
                              }
                              </div>
                            }
                          </div>
                        }
                      </div>
                      <div class="lms-builder-sidebar-tools" aria-label="Curriculum actions">
                        <button type="button" [disabled]="isBuilderRootSelected() || isBuilderFolderSelected()" (click)="previewSelectedBuilderUnit()" aria-label="Preview selected item" title="Preview selected item"><mat-icon>visibility</mat-icon></button>
                        <button type="button" [disabled]="isBuilderRootSelected()" (click)="duplicateCourseContentNode(activeCourseContentPreviewId() || '')" aria-label="Duplicate selected item" title="Duplicate selected item"><mat-icon>content_copy</mat-icon></button>
                        <button type="button" [disabled]="isBuilderRootSelected() || isBuilderFolderSelected()" (click)="toggleBuilderInspector()" aria-label="Open selected item settings" title="Open selected item settings"><mat-icon>settings</mat-icon></button>
                      </div>
                    </div>
                    <div class="lms-builder-tree" role="tree">
                      @if (hasVisibleAuthoringCurriculumItems()) {
                        <ng-container *ngTemplateOutlet="builderTreeNodes; context: { nodes: courseContentAuthoringChildren(), parentId: courseContentAuthoringRootId() }"></ng-container>
                      } @else {
                        <div class="lms-builder-empty-sidebar">
                          <mat-icon>playlist_add</mat-icon>
                          <strong>Add content to your course</strong>
                          <span>Drag and drop files here, or click the Add button above, to build your course.</span>
                        </div>
                      }
                    </div>
                  </aside>

                  <main class="lms-builder-editor" [attr.aria-label]="isCourseAuthoringRootSelected() ? 'Course editor' : 'Unit editor'">
                    <section class="lms-builder-canvas" [class.is-full-unit-editor]="isContentUnitEditor() || isWebContentUnitEditor() || isIframeUnitEditor() || isVideoUnitEditor() || isAudioUnitEditor() || isDocumentUnitEditor() || isTestUnitEditor() || isLiveSessionUnitEditor() || isScormUnitEditor()" [class.is-test-unit-editor]="isTestUnitEditor()" [class.is-live-session-unit-editor]="isLiveSessionUnitEditor()" [class.is-scorm-unit-editor]="isScormUnitEditor()">
                      @if (isCourseAuthoringRootSelected() || isBuilderFolderSelected()) {
                        <section class="lms-course-level-editor" aria-label="Course content editor">
                          @if (isCourseAuthoringRootSelected()) {
                            <label class="lms-course-description-editor" for="course-builder-description">
                              <span>Add a course description up to 5000 characters</span>
                              <textarea id="course-builder-description" rows="2" maxlength="5000" [formControl]="courseForm.controls.description" placeholder="Explain what learners will study and who this course is for."></textarea>
                            </label>
                          }

                          <section class="lms-course-content-editor-panel">
                            <header class="lms-course-content-editor-tabs">
                              <div role="tablist" aria-label="Course editor sections">
                                <button type="button" role="tab" [class.is-active]="builderCourseEditorTab() === 'content'" [attr.aria-selected]="builderCourseEditorTab() === 'content'" (click)="builderCourseEditorTab.set('content')">Content</button>
                                <button type="button" role="tab" [class.is-active]="builderCourseEditorTab() === 'files'" [attr.aria-selected]="builderCourseEditorTab() === 'files'" (click)="builderCourseEditorTab.set('files')">Files</button>
                              </div>
                              <span>All units must be completed</span>
                            </header>

                            @if (builderCourseEditorTab() === 'content') {
                              @if (hasVisibleAuthoringCurriculumItems()) {
                                <div class="lms-course-editor-item-list" aria-label="Course content">
                                  @for (node of filteredBuilderNodes(courseContentAuthoringChildren()); track node) {
                                    <div class="lms-course-editor-item-row">
                                      <button type="button" class="lms-course-editor-item-open" (click)="openCourseContentPreview(node.controls['id'].value)">
                                        <mat-icon>{{ courseNodeIcon(node) }}</mat-icon>
                                        <span><strong>{{ courseNodeTitle(node) }}</strong><small>{{ courseContentNodeMeta(node) }}</small></span>
                                        <mat-icon>chevron_right</mat-icon>
                                      </button>
                                      @if (!courseNodeIsFolder(node)) {
                                        <button type="button" class="lms-course-editor-item-free" [class.is-active]="courseNodeFreePreview(node)" (click)="$event.stopPropagation(); toggleCourseContentNodeFreePreview(node.controls['id'].value)" [attr.aria-label]="courseNodeFreePreview(node) ? 'Remove free preview from ' + courseNodeTitle(node) : 'Make ' + courseNodeTitle(node) + ' free preview'" [title]="courseNodeFreePreview(node) ? 'Remove free preview' : 'Make free preview'"><mat-icon>workspace_premium</mat-icon></button>
                                      }
                                      <button type="button" class="lms-course-editor-item-delete" (click)="$event.stopPropagation(); removeCourseContentNode(node.controls['id'].value)" aria-label="Delete item"><mat-icon>delete</mat-icon></button>
                                    </div>
                                  }
                                </div>
                              } @else {
                                <div class="lms-course-editor-empty" role="status">
                                  <mat-icon>playlist_add</mat-icon>
                                  <strong>This course is empty</strong>
                                  <span>Drag and drop files here, or click the Add button to the left, to build your course.</span>
                                </div>
                              }
                            } @else {
                              <div class="lms-course-editor-empty" role="status">
                                <mat-icon>folder_open</mat-icon>
                                <strong>No course files yet</strong>
                                <span>Files attached to this course will appear here.</span>
                              </div>
                            }
                          </section>
                        </section>
                      } @else if (isAudioUnitEditor()) {
                        <section class="lms-audio-unit-editor" aria-label="Audio unit editor">
                          <p class="lms-media-editor-kicker">Add content</p>
                          <div
                            class="lms-audio-source-grid"
                            (dragover)="$event.preventDefault()"
                            (drop)="handleBuilderAudioDrop($event)"
                          >
                            <label class="lms-audio-source-card">
                              <input type="file" accept="audio/*" (change)="handleBuilderAudioUpload($event)" />
                              <mat-icon>upload</mat-icon>
                              <strong>Upload a file</strong>
                              <span>or Drag-n-Drop here</span>
                            </label>
                            <button type="button" class="lms-audio-source-card" (click)="startBuilderAudioRecording()">
                              <mat-icon>mic_none</mat-icon>
                              <strong>{{ builderRecordingActive() ? 'Recording audio…' : 'Record audio' }}</strong>
                              <span>{{ builderRecordingActive() ? recordingTimerLabel() : 'Use your microphone' }}</span>
                            </button>
                          </div>

                          @if (builderUploadError()) {
                            <p class="lms-builder-error" role="alert"><mat-icon>error_outline</mat-icon>{{ builderUploadError() }}</p>
                          }
                          @if (builderUploadPreviewUrl()) {
                            <div class="lms-audio-preview">
                              <audio [src]="builderUploadPreviewUrl()" controls preload="metadata"></audio>
                              <div>
                                <strong>{{ builderUploadFileName() }}</strong>
                                <span>{{ builderUploadStatus() }}</span>
                              </div>
                              <button type="button" (click)="clearBuilderUpload()">Replace</button>
                            </div>
                          }
                          @if (builderRecordingActive()) {
                            <div class="lms-recorder-actions">
                              <span class="lms-recording-timer">{{ recordingTimerLabel() }}</span>
                              <button type="button" class="lms-builder-secondary" (click)="stopBuilderRecording()"><mat-icon>stop</mat-icon>Stop recording</button>
                            </div>
                          }
                          @if (builderRecordingError()) {
                            <p class="lms-builder-error" role="alert"><mat-icon>error_outline</mat-icon>{{ builderRecordingError() }}</p>
                          }
                        </section>
                      } @else if (isIframeUnitEditor()) {
                        <section class="lms-iframe-unit-editor" aria-label="Iframe unit editor">
                          <p class="lms-media-editor-kicker">Add content</p>
                          <form class="lms-iframe-url-editor" (submit)="$event.preventDefault(); saveBuilderIframeUrl()">
                            <div class="lms-iframe-url-control">
                              <input
                                id="course-builder-iframe-url"
                                type="url"
                                inputmode="url"
                                autocomplete="url"
                                [ngModel]="builderIframeUrl()"
                                [ngModelOptions]="{ standalone: true }"
                                (ngModelChange)="setBuilderIframeUrl($event)"
                                placeholder="Paste the URL of the webpage you want to embed"
                                aria-label="Webpage URL to embed"
                              />
                              <button type="submit" aria-label="Embed webpage">
                                <mat-icon>keyboard_return</mat-icon>
                              </button>
                            </div>
                            @if (builderIframeError()) {
                              <p class="lms-webpage-url-error" role="alert"><mat-icon>error_outline</mat-icon>{{ builderIframeError() }}</p>
                            }
                          </form>
                          <div class="lms-iframe-preview">
                            @if (builderIframePreviewActive() && builderIframePreviewUrl()) {
                              <iframe
                                [src]="builderIframePreviewUrl()"
                                title="Embedded webpage preview"
                                loading="lazy"
                                referrerpolicy="strict-origin-when-cross-origin"
                                allowfullscreen
                              ></iframe>
                            }
                          </div>
                        </section>
                      } @else if (isDocumentUnitEditor()) {
                        <section class="lms-document-unit-editor" aria-label="Document unit editor">
                          <p class="lms-media-editor-kicker">Add content</p>

                          @if (effectiveBuilderDocumentSource() === 'upload' && builderUploadPreviewUrl()) {
                            <section class="lms-document-preview-shell" aria-label="Uploaded document preview">
                              <header>
                                <div>
                                  <mat-icon>description</mat-icon>
                                  <span>
                                    <strong>{{ builderUploadFileName() }}</strong>
                                    <small>{{ builderUploadStatus() }}</small>
                                  </span>
                                </div>
                                <button type="button" (click)="clearBuilderUpload()">
                                  <mat-icon>edit</mat-icon>
                                  Change
                                </button>
                              </header>

                              <div class="lms-document-preview-stage">
                                @if (builderDocumentPreviewLoading()) {
                                  <div class="lms-document-preview-state" role="status">
                                    <mat-icon>hourglass_top</mat-icon>
                                    <strong>Preparing document preview</strong>
                                    <span>Large documents may take a moment.</span>
                                  </div>
                                }
                                @if (builderDocumentPreviewKind() === 'pdf' && builderDocumentPdfPreviewUrl()) {
                                  <iframe
                                    [src]="builderDocumentPdfPreviewUrl()"
                                    [title]="builderUploadFileName() || 'PDF document preview'"
                                  ></iframe>
                                } @else if (builderDocumentPreviewKind() === 'docx' || builderDocumentPreviewKind() === 'pptx' || builderDocumentPreviewKind() === 'xlsx') {
                                  <div #builderDocumentPreviewHost class="lms-document-render-host"></div>
                                } @else if (builderDocumentPreviewKind() === 'unsupported') {
                                  <div class="lms-document-preview-state">
                                    <mat-icon>file_present</mat-icon>
                                    <strong>Preview is unavailable for this legacy format</strong>
                                    <span>Convert the file to DOCX, PPTX, XLSX, or PDF to preview it inside the editor.</span>
                                  </div>
                                }
                                @if (builderDocumentPreviewError()) {
                                  <p class="lms-builder-error lms-document-preview-error" role="alert">
                                    <mat-icon>error_outline</mat-icon>
                                    {{ builderDocumentPreviewError() }}
                                  </p>
                                }
                              </div>
                            </section>
                          } @else if (effectiveBuilderDocumentSource() === 'slideshare' && builderDocumentPresentationPreviewUrl()) {
                            <section class="lms-document-preview-shell" aria-label="Shared presentation preview">
                              <header>
                                <div>
                                  <mat-icon>co_present</mat-icon>
                                  <span>
                                    <strong>Shared presentation</strong>
                                    <small>{{ activeBuilderSlideShareUrl() }}</small>
                                  </span>
                                </div>
                                <button type="button" (click)="selectBuilderDocumentSource('slideshare', true)">
                                  <mat-icon>edit</mat-icon>
                                  Change
                                </button>
                              </header>
                              <div class="lms-document-preview-stage is-presentation">
                                <iframe
                                  [src]="builderDocumentPresentationPreviewUrl()"
                                  title="Shared presentation preview"
                                  allowfullscreen
                                ></iframe>
                              </div>
                            </section>
                          } @else if (effectiveBuilderDocumentSource() !== 'slideshare') {
                            <div
                              class="lms-document-source-grid"
                              (dragover)="$event.preventDefault()"
                              (drop)="handleBuilderDocumentDrop($event)"
                            >
                              <label class="lms-document-source-card">
                                <input
                                  type="file"
                                  accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
                                  (change)="handleBuilderDocumentUpload($event)"
                                />
                                <mat-icon>upload</mat-icon>
                                <strong>Upload a file</strong>
                                <span>or Drag-n-Drop here</span>
                                <small>DOC, PDF, XLS, PPT, PPTX, XLSX, DOCX (1 GB)</small>
                              </label>
                              <button type="button" class="lms-document-source-card" (click)="selectBuilderDocumentSource('slideshare')">
                                <mat-icon>co_present</mat-icon>
                                <strong>Use SlideShare</strong>
                                <span>Paste a public presentation link</span>
                              </button>
                            </div>
                          } @else {
                            <form class="lms-document-slideshare-panel" (submit)="$event.preventDefault(); saveBuilderSlideShareUrl()">
                              <header>
                                <div><strong>Shared presentation</strong><span>Use a public Google Slides or SlideShare presentation URL.</span></div>
                                <button type="button" (click)="selectBuilderDocumentSource('none')">Change method</button>
                              </header>
                              <label>
                                <span>Presentation URL</span>
                                <div>
                                  <mat-icon>link</mat-icon>
                                  <input
                                    type="url"
                                    inputmode="url"
                                    autocomplete="url"
                                    placeholder="https://docs.google.com/presentation/d/..."
                                    [ngModel]="builderDocumentUrl()"
                                    [ngModelOptions]="{ standalone: true }"
                                    (ngModelChange)="setBuilderDocumentUrl($event)"
                                  />
                                  <button type="submit">Save presentation</button>
                                </div>
                              </label>
                              @if (builderDocumentUrlError()) {
                                <p class="lms-builder-error" role="alert"><mat-icon>error_outline</mat-icon>{{ builderDocumentUrlError() }}</p>
                              }
                            </form>
                          }

                          @if (builderUploadError()) {
                            <p class="lms-builder-error" role="alert"><mat-icon>error_outline</mat-icon>{{ builderUploadError() }}</p>
                          }
                        </section>
                      } @else {
                      <div class="lms-unit-editor-head" [class.is-survey-unit-head]="isSurveyUnitEditor()" [class.is-live-session-unit-head]="isLiveSessionUnitEditor()" [class.is-scorm-unit-head]="isScormUnitEditor()">
                        <div class="lms-unit-title-field">
                          <label for="course-builder-unit-title">Unit title</label>
                          <input id="course-builder-unit-title" type="text" [ngModel]="courseContentPreviewTitle()" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateCourseContentPreviewTitle($event)" (blur)="markBuilderSaved()" />
                          @if (isSurveyUnitEditor() || isLiveSessionUnitEditor()) {
                            <textarea
                              aria-label="Unit description"
                              rows="2"
                              [ngModel]="courseContentPreviewDescriptionValue()"
                              [ngModelOptions]="{ standalone: true }"
                              (ngModelChange)="updateCourseContentPreviewDescription($event)"
                              placeholder="Add description here"
                            ></textarea>
                          }
                        </div>
                        @if (!isSurveyUnitEditor() && !isLiveSessionUnitEditor() && !isScormUnitEditor()) {
                          <div class="lms-unit-head-actions">
                            <span class="lms-unit-type-pill"><mat-icon>{{ courseContentPreviewIcon() }}</mat-icon>{{ courseContentPreviewTypeLabel() }}</span>
                            <button type="button" class="lms-builder-icon-button" (click)="selectPreviousCourseContentNode()" aria-label="Previous unit" title="Previous unit"><mat-icon>keyboard_arrow_up</mat-icon></button>
                            <button type="button" class="lms-builder-icon-button" (click)="selectNextCourseContentNode()" aria-label="Next unit" title="Next unit"><mat-icon>keyboard_arrow_down</mat-icon></button>
                            <button type="button" class="lms-builder-icon-button" (click)="openEditCourseContentNodeById(activeCourseContentPreviewId() || '')" aria-label="More unit actions" title="More unit actions"><mat-icon>more_horiz</mat-icon></button>
                          </div>
                        }
                      </div>

                      @if (isContentUnitEditor()) {
                        <section class="lms-content-unit-editor" aria-label="Content unit editor">
                          <quill-editor
                            class="lms-content-unit-quill"
                            [modules]="builderContentEditorModules"
                            [ngModel]="contentUnitHtml()"
                            [ngModelOptions]="{ standalone: true }"
                            (ngModelChange)="updateContentUnitHtml($event)"
                            placeholder="Start writing your content..."
                          ></quill-editor>
                        </section>
                      } @else if (isTestUnitEditor()) {
                        <section class="lms-test-unit-editor" [class.is-survey-unit-editor]="isSurveyUnitEditor()" [attr.aria-label]="isSurveyUnitEditor() ? 'Survey unit editor' : 'Test unit editor'">
                          @if (testQuestionBlocks().length === 0) {
                            <div class="lms-test-empty">
                              <div class="lms-test-empty-copy">
                                <h3>There are no questions yet!</h3>
                                <p>Add questions from the list below to create your {{ isSurveyUnitEditor() ? 'survey' : 'test' }}.</p>
                              </div>
                              <div class="lms-test-question-grid" aria-label="Question types">
                                @for (option of activeQuestionOptions(); track option.type) {
                                  <button type="button" class="lms-test-question-card" (click)="openTestQuestionType(option.type)">
                                    <mat-icon>{{ option.icon }}</mat-icon>
                                    <strong>{{ option.label }}</strong>
                                  </button>
                                }
                              </div>
                            </div>
                          } @else {
                            <div class="lms-test-question-list">
                              <header>
                                <p>{{ testQuestionBlocks().length }} question{{ testQuestionBlocks().length === 1 ? '' : 's' }} in total</p>
                              </header>
                              @for (block of testQuestionBlocks(); track block.id; let questionIndex = $index) {
                                <article class="lms-test-question-row" [class.is-selected]="builderSelectedBlockId() === block.id" [class.is-expanded]="expandedTestQuestionId() === block.id">
                                  <div class="lms-test-question-main">
                                    <mat-icon>{{ testQuestionIcon(block) }}</mat-icon>
                                    <strong>{{ blockPayloadString(block, 'title') || testQuestionLabel(block) }}</strong>
                                  </div>
                                  <div class="lms-test-question-actions">
                                    <button type="button" aria-label="Edit question" (click)="openTestQuestionBlock(block)">
                                      <mat-icon>edit</mat-icon>
                                    </button>
                                    <button type="button" aria-label="Delete question" (click)="removeBuilderBlock(block.id)">
                                      <mat-icon>delete</mat-icon>
                                    </button>
                                    <button type="button" [attr.aria-expanded]="expandedTestQuestionId() === block.id" aria-label="Show answers" (click)="toggleTestQuestionAnswers(block.id)">
                                      <mat-icon>{{ expandedTestQuestionId() === block.id ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</mat-icon>
                                    </button>
                                  </div>
                                  @if (expandedTestQuestionId() === block.id) {
                                    <div class="lms-test-question-answers">
                                      @if (quizAnswers(block).length) {
                                        @for (answer of quizAnswers(block); track $index; let answerIndex = $index) {
                                          <div class="lms-test-question-answer" [class.is-correct]="quizCorrectIndex(block) === answerIndex" [class.is-ordered]="isOrderingQuestion(block)">
                                            @if (isOrderingQuestion(block)) {
                                              <span aria-hidden="true">{{ answerIndex + 1 }}</span>
                                            } @else {
                                              <span aria-hidden="true"></span>
                                            }
                                            <p>{{ answer || 'Empty answer' }}</p>
                                          </div>
                                        }
                                      } @else if (quizMatchingPairs(block).length) {
                                        @for (pair of quizMatchingPairs(block); track $index; let pairIndex = $index) {
                                          <div class="lms-test-question-answer is-matching">
                                            <span aria-hidden="true">{{ pairIndex + 1 }}</span>
                                            <p>{{ pair.left || 'Empty item' }}</p>
                                            <mat-icon aria-hidden="true">sync_alt</mat-icon>
                                            <p>{{ pair.right || 'Empty match' }}</p>
                                          </div>
                                        }
                                      } @else if (isFreeTextQuestion(block)) {
                                        <div class="lms-test-question-answer is-free-text">
                                          <mat-icon aria-hidden="true">rule</mat-icon>
                                          <p>{{ freeTextQuestionRuleSummary(block) }}</p>
                                        </div>
                                      } @else {
                                        <p class="lms-test-question-no-answers">No answers added.</p>
                                      }
                                    </div>
                                  }
                                </article>
                              }
                            </div>
                            <div class="lms-test-bottom-bar" aria-label="Question types">
                              @for (option of activeQuestionOptions(); track option.type) {
                                <button type="button" [attr.aria-label]="option.label" [title]="option.label" (click)="openTestQuestionType(option.type)">
                                  <mat-icon>{{ option.icon }}</mat-icon>
                                </button>
                              }
                            </div>
                          }
                        </section>
                      } @else if (isLiveSessionUnitEditor()) {
                        <section class="lms-live-session-unit-editor" aria-label="Instructor-led training unit editor">
                          <div class="lms-live-session-empty">
                            <div class="lms-live-session-copy">
                              <h3>There are no sessions yet!</h3>
                              <p>Add sessions from the list below to create your ILT unit.</p>
                            </div>
                            <div class="lms-live-session-grid" aria-label="Session types">
                              <button type="button" class="lms-live-session-card" (click)="openBuilderInspector()" aria-label="Configure online session using integrated tool" title="Configure online session using integrated tool">
                                <mat-icon>podcasts</mat-icon>
                                <strong>Online session</strong>
                                <span>(integrated tool)</span>
                              </button>
                              <button type="button" class="lms-live-session-card" (click)="openBuilderInspector()" aria-label="Configure in-person session" title="Configure in-person session">
                                <mat-icon>home_work</mat-icon>
                                <strong>In-person session</strong>
                              </button>
                              <button type="button" class="lms-live-session-card" (click)="openBuilderInspector()" aria-label="Configure online session using other external tools" title="Configure online session using other external tools">
                                <mat-icon>groups</mat-icon>
                                <strong>Online session</strong>
                                <span>(other external tools)</span>
                              </button>
                            </div>
                          </div>
                        </section>
                      } @else if (isScormUnitEditor()) {
                        <section class="lms-scorm-unit-editor" aria-label="SCORM xAPI cmi5 unit editor">
                          @if (builderUploadFileName()) {
                            <div class="lms-scorm-upload-summary">
                              <mat-icon>inventory_2</mat-icon>
                              <div>
                                <strong>{{ builderUploadFileName() }}</strong>
                                <span>{{ builderUploadStatus() }}</span>
                              </div>
                              <button type="button" (click)="clearBuilderUpload()">Replace</button>
                            </div>
                          } @else {
                            <label
                              class="lms-scorm-upload-drop"
                              (dragover)="$event.preventDefault()"
                              (drop)="handleBuilderScormDrop($event)"
                            >
                              <input type="file" accept=".zip,.xapi,.cmi5,application/zip,application/x-zip-compressed" (change)="handleBuilderScormUpload($event)" />
                              <mat-icon>upload</mat-icon>
                              <strong>Upload a SCORM, xAPI, or cmi5 file</strong>
                              <span>or Drag-n-Drop here</span>
                            </label>
                          }
                          @if (builderUploadError()) {
                            <p class="lms-builder-error lms-scorm-upload-error" role="alert"><mat-icon>error_outline</mat-icon>{{ builderUploadError() }}</p>
                          }
                        </section>
                      } @else if (isWebContentUnitEditor()) {
                        <section class="lms-webpage-unit-editor" aria-label="Webpage unit editor">
                          <form class="lms-webpage-url-editor" (submit)="$event.preventDefault(); saveBuilderWebContentUrl()">
                            <label for="course-builder-webpage-url">Webpage URL</label>
                            <div class="lms-webpage-url-control">
                              <mat-icon>language</mat-icon>
                              <input
                                id="course-builder-webpage-url"
                                type="url"
                                inputmode="url"
                                autocomplete="url"
                                [ngModel]="builderWebContentUrl()"
                                [ngModelOptions]="{ standalone: true }"
                                (ngModelChange)="setBuilderWebContentUrl($event)"
                                placeholder="Paste the URL of the webpage you want"
                                aria-describedby="course-builder-webpage-help"
                              />
                              <button type="submit" aria-label="Load webpage"><mat-icon>keyboard_return</mat-icon></button>
                            </div>
                            <p id="course-builder-webpage-help"><mat-icon>info_outline</mat-icon>Use a complete HTTP or HTTPS webpage address.</p>
                            @if (builderWebContentError()) {
                              <p class="lms-webpage-url-error" role="alert"><mat-icon>error_outline</mat-icon>{{ builderWebContentError() }}</p>
                            }
                          </form>

                          <div class="lms-webpage-preview">
                            @if (builderWebContentPreviewActive() && builderWebContentPreviewUrl()) {
                              <iframe [src]="builderWebContentPreviewUrl()" title="Webpage content preview" loading="lazy"></iframe>
                            } @else {
                              <div class="lms-webpage-preview-empty">
                                <mat-icon>public</mat-icon>
                                <strong>Webpage preview</strong>
                                <span>Enter a webpage URL above, then press Enter to load it here.</span>
                              </div>
                            }
                          </div>
                        </section>
                      } @else {
                      <div class="lms-video-source-panel">
                        <div class="lms-editor-section-heading">
                          <div><h3>Add video content</h3><p>Choose how you want to add the video for this lesson.</p></div>
                          <span>Recommended: upload or URL</span>
                        </div>

                        @if (effectiveBuilderVideoSource() === 'none') {
                          <div class="lms-video-source-grid">
                            <button type="button" class="lms-video-source-card" (click)="selectBuilderVideoSource('url')"><mat-icon>link</mat-icon><strong>Add from YouTube or external URL</strong><span>Paste a YouTube, Vimeo, or supported video URL.</span></button>
                            <button type="button" class="lms-video-source-card" (click)="selectBuilderVideoSource('upload')"><mat-icon>upload_file</mat-icon><strong>Upload a video</strong><span>Upload MP4, WebM, MOV, or another supported format.</span></button>
                            <button type="button" class="lms-video-source-card" (click)="selectBuilderVideoSource('upload')"><mat-icon>video_library</mat-icon><strong>Select a course file</strong><span>Choose a video file already available to this course.</span></button>
                            <button type="button" class="lms-video-source-card" (click)="selectBuilderVideoSource('camera')"><mat-icon>videocam</mat-icon><strong>Record a video</strong><span>Record using your camera and microphone.</span></button>
                            <button type="button" class="lms-video-source-card" (click)="selectBuilderVideoSource('screen')"><mat-icon>desktop_windows</mat-icon><strong>Record your screen</strong><span>Capture your screen, browser tab, and optional microphone.</span></button>
                          </div>
                        } @else if (effectiveBuilderVideoSource() === 'url') {
                          <div class="lms-video-config-panel">
                            <div class="lms-video-config-head"><strong>External video URL</strong><button type="button" (click)="selectBuilderVideoSource('none')">Change method</button></div>
                            <label class="lms-builder-field"><span>Video URL</span><input type="url" placeholder="https://youtube.com/watch?v=..." [ngModel]="builderExternalVideoUrl()" [ngModelOptions]="{ standalone: true }" (ngModelChange)="setBuilderExternalVideoUrl($event)" /></label>
                            @if (builderExternalVideoError()) { <p class="lms-builder-error"><mat-icon>error_outline</mat-icon>{{ builderExternalVideoError() }}</p> }
                            @if (builderExternalVideoPreviewUrl()) { <div class="lms-builder-video-preview"><iframe [src]="builderExternalVideoPreviewUrl()" title="External video preview" loading="lazy" allowfullscreen></iframe></div> }
                            <div class="lms-builder-inline-actions"><button type="button" class="lms-builder-primary" [disabled]="!activeBuilderExternalVideoConfig() || !!builderExternalVideoError()" (click)="saveBuilderExternalVideo()">Save video</button><button type="button" class="lms-builder-secondary" (click)="syncBuilderStateFromSelectedNode()">Cancel</button><button type="button" class="lms-builder-secondary" (click)="removeBuilderExternalVideo()">Remove</button></div>
                          </div>
                        } @else if (effectiveBuilderVideoSource() === 'upload') {
                          <div class="lms-video-config-panel">
                            <div class="lms-video-config-head"><strong>Video upload</strong><button type="button" (click)="selectBuilderVideoSource('none')">Change method</button></div>
                            <label class="lms-builder-upload-drop" (dragover)="$event.preventDefault()" (drop)="handleBuilderVideoDrop($event)"><input type="file" accept="video/mp4,video/webm,video/quicktime" (change)="handleBuilderVideoUpload($event)" /><mat-icon>cloud_upload</mat-icon><strong>Drop a video here or browse</strong><span>MP4, WebM, or MOV. Production upload should use signed storage URLs.</span></label>
                            @if (builderUploadError()) { <p class="lms-builder-error"><mat-icon>error_outline</mat-icon>{{ builderUploadError() }}</p> }
                            @if (builderUploadPreviewUrl()) { <video class="lms-builder-local-video" [src]="builderUploadPreviewUrl()" controls preload="metadata"></video> }
                            @if (builderUploadFileName()) {
                              <div class="lms-builder-upload-progress"><div><strong>{{ builderUploadFileName() }}</strong><span>{{ builderUploadStatus() }}</span></div><progress max="100" [value]="builderUploadProgress()"></progress><button type="button" (click)="clearBuilderUpload()">Replace</button></div>
                            }
                          </div>
                        } @else {
                          <div class="lms-video-config-panel">
                            <div class="lms-video-config-head"><strong>{{ builderVideoSource() === 'camera' ? 'Camera recording' : 'Screen recording' }}</strong><button type="button" (click)="selectBuilderVideoSource('none')">Change method</button></div>
                            <div class="lms-recorder-state"><mat-icon>{{ builderVideoSource() === 'camera' ? 'videocam' : 'screen_share' }}</mat-icon><strong>{{ builderRecorderSupported() ? 'Ready to request browser permission' : 'Recording is not supported in this browser' }}</strong><span>{{ builderVideoSource() === 'screen' ? 'System audio depends on browser and operating system support.' : 'Camera and microphone permission is requested only when recording starts.' }}</span></div>
                            <div class="lms-recorder-actions"><button type="button" class="lms-builder-primary" [disabled]="!builderRecorderSupported()" (click)="startBuilderRecording()"><mat-icon>fiber_manual_record</mat-icon>Start recording</button><button type="button" class="lms-builder-secondary" (click)="stopBuilderRecording()"><mat-icon>stop</mat-icon>Stop</button></div>
                          </div>
                        }

                        @if (!isVideoUnitEditor() && !isAudioUnitEditor()) {
                          <div class="lms-lesson-content-divider"><span></span><strong>Or add lesson content</strong><span></span></div>
                          <div class="lms-quick-blocks">
                            <button type="button" (click)="addLessonBlock('text')"><mat-icon>notes</mat-icon>Text</button>
                            <button type="button" (click)="addLessonBlock('image')"><mat-icon>image</mat-icon>Image</button>
                            <button type="button" (click)="addLessonBlock('file')"><mat-icon>attach_file</mat-icon>File</button>
                            <button type="button" (click)="addLessonBlock('embed')"><mat-icon>code</mat-icon>Embed</button>
                            <button type="button" (click)="addLessonBlock('quiz')"><mat-icon>quiz</mat-icon>Quiz</button>
                            <button type="button" (click)="addLessonBlock('assignment')"><mat-icon>assignment</mat-icon>Assignment</button>
                            <button type="button" (click)="addLessonBlock('divider')"><mat-icon>horizontal_rule</mat-icon>Divider</button>
                          </div>
                        }
                      </div>

                      @if (!isVideoUnitEditor() && !isAudioUnitEditor() && !isTestUnitEditor()) {
                        <section class="lms-block-editor" aria-label="Structured lesson content">
                        <div class="lms-editor-section-heading"><div><h3>Lesson blocks</h3><p>Structured JSON blocks, ready for backend storage.</p></div><button type="button" (click)="addLessonBlock('text')"><mat-icon>add</mat-icon>Add content</button></div>
                        <div class="lms-content-block-list" cdkDropList [cdkDropListData]="builderBlocks()" (cdkDropListDropped)="dropBuilderBlock($event)">
                        @for (block of builderBlocks(); track block.id; let i = $index) {
                          <article class="lms-content-block" cdkDrag tabindex="0" role="button" [class.is-selected]="builderSelectedBlockId() === block.id" (click)="selectBuilderBlock(block.id)" (keydown.enter)="selectBuilderBlock(block.id)" (keydown.space)="selectBuilderBlock(block.id); $event.preventDefault()">
                            <span class="lms-block-handle"><mat-icon>drag_indicator</mat-icon></span>
                            <mat-icon>{{ builderBlockIcon(block.type) }}</mat-icon>
                            <div><strong>{{ block.title }}</strong><small>{{ builderBlockLabel(block.type) }}</small></div>
                            <button type="button" (click)="moveBuilderBlock(i, -1)" [disabled]="i === 0" aria-label="Move block up"><mat-icon>keyboard_arrow_up</mat-icon></button>
                            <button type="button" (click)="moveBuilderBlock(i, 1)" [disabled]="i === builderBlocks().length - 1" aria-label="Move block down"><mat-icon>keyboard_arrow_down</mat-icon></button>
                            <button type="button" (click)="duplicateBuilderBlock(block)" aria-label="Duplicate block"><mat-icon>content_copy</mat-icon></button>
                            <button type="button" class="is-danger" (click)="removeBuilderBlock(block.id)" aria-label="Delete block"><mat-icon>delete</mat-icon></button>
                          </article>
                          @if (builderSelectedBlockId() === block.id) {
                            <section class="lms-block-editor-detail">
                              @if (block.type === 'text') {
                                <quill-editor class="lms-quill-editor" [modules]="builderQuillModules" [ngModel]="blockPayloadString(block, 'html')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateBuilderBlockPayload(block.id, 'html', $event)" placeholder="Type lesson content here"></quill-editor>
                              } @else if (block.type === 'image') {
                                <label class="lms-builder-upload-drop"><input type="file" accept="image/png,image/jpeg,image/webp,gif" (change)="handleBuilderImageBlockUpload(block.id, $event)" /><mat-icon>image</mat-icon><strong>Select an image</strong><span>PNG, JPG, WebP, or GIF.</span></label>
                                @if (blockPayloadString(block, 'previewUrl')) { <img class="lms-block-image-preview" [src]="blockPayloadString(block, 'previewUrl')" [alt]="blockPayloadString(block, 'alt')" /> }
                                <label class="lms-builder-field"><span>Alt text</span><input type="text" [ngModel]="blockPayloadString(block, 'alt')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateBuilderBlockPayload(block.id, 'alt', $event)" /></label>
                              } @else if (block.type === 'file') {
                                <label class="lms-builder-upload-drop"><input type="file" (change)="handleBuilderFileBlockUpload(block.id, $event)" /><mat-icon>attach_file</mat-icon><strong>Select a file</strong><span>File is stored as a local development preview until backend upload exists.</span></label>
                                <label class="lms-builder-field"><span>Display title</span><input type="text" [ngModel]="blockPayloadString(block, 'title')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateBuilderBlockPayload(block.id, 'title', $event)" /></label>
                                @if (blockPayloadString(block, 'fileName')) { <p class="lms-builder-file-summary"><mat-icon>description</mat-icon>{{ blockPayloadString(block, 'fileName') }} · {{ blockPayloadString(block, 'fileSize') }}</p> }
                              } @else if (block.type === 'embed') {
                                <label class="lms-builder-field"><span>Safe URL</span><input type="url" placeholder="https://..." [ngModel]="blockPayloadString(block, 'url')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateEmbedBlockUrl(block.id, $event)" /></label>
                                @if (blockPayloadString(block, 'error')) { <p class="lms-builder-error"><mat-icon>error_outline</mat-icon>{{ blockPayloadString(block, 'error') }}</p> }
                                @if (blockPayloadString(block, 'embedUrl')) { <iframe class="lms-block-embed-preview" [src]="safeBlockEmbedUrl(block)" title="Embed preview"></iframe> }
                              } @else if (block.type === 'quiz') {
                                <label class="lms-builder-field"><span>Quiz title</span><input [ngModel]="blockPayloadString(block, 'title')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateBuilderBlockPayload(block.id, 'title', $event)" /></label>
                                <label class="lms-builder-field"><span>Question</span><input [ngModel]="blockPayloadString(block, 'question')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateBuilderBlockPayload(block.id, 'question', $event)" /></label>
                                @for (answer of quizAnswers(block); track answer; let answerIndex = $index) {
                                  <label class="lms-quiz-answer"><input type="radio" name="correct-{{ block.id }}" [checked]="quizCorrectIndex(block) === answerIndex" (change)="setQuizCorrectAnswer(block.id, answerIndex)" /><input type="text" [ngModel]="answer" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateQuizAnswer(block.id, answerIndex, $event)" /></label>
                                }
                              } @else if (block.type === 'assignment') {
                                <label class="lms-builder-field"><span>Assignment title</span><input [ngModel]="blockPayloadString(block, 'title')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateBuilderBlockPayload(block.id, 'title', $event)" /></label>
                                <label class="lms-builder-field"><span>Instructions</span><textarea rows="4" [ngModel]="blockPayloadString(block, 'instructions')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateBuilderBlockPayload(block.id, 'instructions', $event)"></textarea></label>
                                <div class="lms-builder-field-row"><label class="lms-builder-field"><span>Max score</span><input type="number" min="0" [ngModel]="blockPayloadString(block, 'maxScore')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateBuilderBlockPayload(block.id, 'maxScore', $event)" /></label><label class="lms-builder-field"><span>Due date</span><input type="date" [ngModel]="blockPayloadString(block, 'dueDate')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateBuilderBlockPayload(block.id, 'dueDate', $event)" /></label></div>
                              } @else {
                                <hr class="lms-rendered-divider" />
                              }
                            </section>
                          }
                        } @empty {
                          <div class="lms-block-empty"><mat-icon>edit_note</mat-icon><strong>Type / to add content or choose a block.</strong><p>Add text, files, embeds, quizzes, assignments, or resources under this unit.</p></div>
                        }
                        </div>
                        </section>
                      }
                      }
                      }
                    </section>
                  </main>

                  @if (builderInspectorOpen() && !isCourseAuthoringRootSelected() && !isBuilderFolderSelected()) {
                    <aside class="lms-builder-inspector" aria-label="Unit settings">
                      <div class="lms-inspector-head"><h3>Unit settings</h3><button type="button" (click)="toggleBuilderInspector()" aria-label="Close settings"><mat-icon>close</mat-icon></button></div>
                      <label class="lms-builder-field"><span>Unit title</span><input type="text" [ngModel]="courseContentPreviewTitle()" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateCourseContentPreviewTitle($event)" /></label>
                      <label class="lms-builder-field"><span>Short description</span><textarea rows="4" [ngModel]="courseContentPreviewDescription()" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateCourseContentPreviewDescription($event)"></textarea></label>
                      <label class="lms-builder-field"><span>Estimated duration</span><input type="text" [ngModel]="builderSettingString('estimatedDuration')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateBuilderSetting('estimatedDuration', $event)" placeholder="12 minutes" /></label>
                      <label class="lms-builder-check"><input type="checkbox" [checked]="builderSettingBoolean('required')" (change)="updateBuilderSetting('required', $any($event.target).checked)" /> Required unit</label>
                      <label class="lms-builder-check"><input type="checkbox" [checked]="builderSettingBoolean('freePreview')" (change)="updateBuilderSetting('freePreview', $any($event.target).checked)" /> Free preview</label>
                      <label class="lms-builder-check"><input type="checkbox" [checked]="builderSettingBoolean('allowDownload')" (change)="updateBuilderSetting('allowDownload', $any($event.target).checked)" /> Allow download</label>
                      <label class="lms-builder-field"><span>Completion rule</span><select [ngModel]="builderSettingString('completionRule')" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateBuilderSetting('completionRule', $event)"><option value="OPENED">Opened</option><option value="WATCH_PERCENTAGE">Watched percentage</option><option value="MANUAL">Manually marked complete</option></select></label>
                    </aside>
                  }
                </div>

                @if (builderPreviewOpen()) {
                  <div class="lms-course-node-modal-backdrop" role="presentation" tabindex="-1" (click)="closeBuilderPreview()" (keydown.escape)="closeBuilderPreview()">
                    <section class="lms-builder-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="builder-preview-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                      <header><div><p>Learner preview</p><h3 id="builder-preview-title">{{ courseContentPreviewTitle() }}</h3></div><button type="button" (click)="closeBuilderPreview()" aria-label="Close preview"><mat-icon>close</mat-icon></button></header>
                      <div class="lms-builder-preview-body">
                        @if (builderExternalVideoDraft()) { <iframe class="lms-block-embed-preview" [src]="builderExternalVideoPreviewUrl()" title="Video preview"></iframe> }
                        @if (builderUploadPreviewUrl()) { <video class="lms-builder-local-video" [src]="builderUploadPreviewUrl()" controls></video> }
                        @for (block of builderBlocks(); track block.id) {
                          @if (block.type === 'text') { <article class="lms-rendered-text" [innerHTML]="blockPayloadString(block, 'html')"></article> }
                          @else if (block.type === 'image') { <img class="lms-block-image-preview" [src]="blockPayloadString(block, 'previewUrl')" [alt]="blockPayloadString(block, 'alt')" /> }
                          @else if (block.type === 'file') { <p class="lms-builder-file-summary"><mat-icon>download</mat-icon>{{ blockPayloadString(block, 'title') || blockPayloadString(block, 'fileName') }}</p> }
                          @else if (block.type === 'embed' && safeBlockEmbedUrl(block)) { <iframe class="lms-block-embed-preview" [src]="safeBlockEmbedUrl(block)" title="Embed preview"></iframe> }
                          @else if (block.type === 'quiz') { <div class="lms-preview-summary-card"><mat-icon>quiz</mat-icon><strong>{{ blockPayloadString(block, 'title') }}</strong><span>{{ blockPayloadString(block, 'question') }}</span></div> }
                          @else if (block.type === 'assignment') { <div class="lms-preview-summary-card"><mat-icon>assignment</mat-icon><strong>{{ blockPayloadString(block, 'title') }}</strong><span>{{ blockPayloadString(block, 'instructions') }}</span></div> }
                          @else if (block.type === 'divider') { <hr class="lms-rendered-divider" /> }
                        }
                      </div>
                    </section>
                  </div>
                }

                @if (multipleChoiceQuestionDraft(); as draft) {
                  <div class="lms-test-question-drawer-backdrop" role="presentation" tabindex="-1" (click)="closeMultipleChoiceQuestionDrawer()" (keydown.escape)="closeMultipleChoiceQuestionDrawer()">
                    <aside class="lms-test-question-drawer lms-multiple-choice-question-drawer" role="dialog" aria-modal="true" aria-labelledby="test-multiple-choice-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                      <header>
                        <h3 id="test-multiple-choice-title">{{ draft.blockId ? 'Edit multiple choice question' : 'Add multiple choice question' }}</h3>
                        <button type="button" aria-label="Close question editor" (click)="closeMultipleChoiceQuestionDrawer()"><mat-icon>close</mat-icon></button>
                      </header>
                      <div class="lms-test-question-drawer-body">
                        <label class="lms-test-question-field">
                          <mat-icon>view_column</mat-icon>
                          <input type="text" [ngModel]="draft.question" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateMultipleChoiceQuestion($event)" placeholder="Enter a question here" />
                        </label>

                        <div class="lms-test-answer-list" aria-label="Answers">
                          @for (answer of draft.answers; track $index; let answerIndex = $index) {
                            <label class="lms-test-answer-row">
                              <input type="radio" name="course-builder-multiple-choice-answer" [checked]="draft.correctIndex === answerIndex" (click)="setMultipleChoiceCorrectAnswer(answerIndex)" />
                              <input type="text" [attr.data-test-answer-index]="answerIndex" [ngModel]="answer" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateMultipleChoiceAnswer(answerIndex, $event)" (keydown.enter)="addMultipleChoiceAnswerAfter(answerIndex, $event)" [placeholder]="answerIndex === draft.answers.length - 1 ? 'Add an answer (optional)' : 'Add an answer'" />
                              @if (draft.answers.length > 2) {
                                <button type="button" aria-label="Remove answer" (click)="removeMultipleChoiceAnswer(answerIndex)"><mat-icon>close</mat-icon></button>
                              }
                            </label>
                          }
                        </div>

                        <label class="lms-multiple-choice-single-toggle">
                          <input type="checkbox" checked disabled />
                          <span>Only one answer can be selected</span>
                        </label>
                      </div>
                      <footer>
                        <button type="button" class="lms-builder-primary" [disabled]="!canSaveMultipleChoiceQuestion()" (click)="saveMultipleChoiceQuestion()">Save</button>
                        <button type="button" class="lms-builder-secondary" (click)="closeMultipleChoiceQuestionDrawer()">Cancel</button>
                      </footer>
                    </aside>
                  </div>
                }

                @if (fillGapsQuestionDraft(); as draft) {
                  <div class="lms-test-question-drawer-backdrop" role="presentation" tabindex="-1" (click)="closeFillGapsQuestionDrawer()" (keydown.escape)="closeFillGapsQuestionDrawer()">
                    <aside class="lms-test-question-drawer" role="dialog" aria-modal="true" aria-labelledby="test-fill-gaps-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                      <header>
                        <h3 id="test-fill-gaps-title">{{ draft.blockId ? 'Edit fill the gaps question' : 'Add fill the gaps question' }}</h3>
                        <button type="button" aria-label="Close question editor" (click)="closeFillGapsQuestionDrawer()"><mat-icon>close</mat-icon></button>
                      </header>
                      <div class="lms-test-question-drawer-body">
                        <label class="lms-test-question-field">
                          <mat-icon>keyboard_tab</mat-icon>
                          <input type="text" [ngModel]="draft.question" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateFillGapsQuestion($event)" placeholder="Question" />
                        </label>
                        @if (!draft.question.trim()) {
                          <p class="lms-test-question-error">This is a required field</p>
                        }
                        <p class="lms-test-question-note">
                          Note: Compose the question and use [brackets] for the possible answers. For example, The quick brown [fox] jumps over the lazy [dog].
                        </p>
                      </div>
                      <footer>
                        <button type="button" class="lms-builder-primary" [disabled]="!canSaveFillGapsQuestion()" (click)="saveFillGapsQuestion()">Save</button>
                        <button type="button" class="lms-builder-secondary" (click)="closeFillGapsQuestionDrawer()">Cancel</button>
                      </footer>
                    </aside>
                  </div>
                }

                @if (orderingQuestionDraft(); as draft) {
                  <div class="lms-test-question-drawer-backdrop" role="presentation" tabindex="-1" (click)="closeOrderingQuestionDrawer()" (keydown.escape)="closeOrderingQuestionDrawer()">
                    <aside class="lms-test-question-drawer" role="dialog" aria-modal="true" aria-labelledby="test-ordering-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                      <header>
                        <h3 id="test-ordering-title">{{ draft.blockId ? 'Edit ordering question' : 'Add ordering question' }}</h3>
                        <button type="button" aria-label="Close question editor" (click)="closeOrderingQuestionDrawer()"><mat-icon>close</mat-icon></button>
                      </header>
                      <div class="lms-test-question-drawer-body">
                        <label class="lms-test-question-field">
                          <mat-icon>format_list_numbered</mat-icon>
                          <input type="text" [ngModel]="draft.question" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateOrderingQuestion($event)" placeholder="Enter a question here" />
                        </label>
                        <p class="lms-test-question-note">Note: Add possible answers in the correct order. We'll present them randomly for the end-user.</p>

                        <div class="lms-test-ordering-list" aria-label="Ordering items">
                          @for (item of draft.items; track $index; let itemIndex = $index) {
                            <label class="lms-test-ordering-row">
                              <mat-icon>drag_indicator</mat-icon>
                              <input type="text" [attr.data-test-ordering-index]="itemIndex" [ngModel]="item" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateOrderingItem(itemIndex, $event)" (keydown.enter)="addOrderingItemAfter(itemIndex, $event)" [placeholder]="orderingItemPlaceholder(itemIndex)" />
                              @if (draft.items.length > 2) {
                                <button type="button" aria-label="Remove ordering item" (click)="removeOrderingItem(itemIndex)"><mat-icon>close</mat-icon></button>
                              }
                            </label>
                          }
                        </div>
                      </div>
                      <footer>
                        <button type="button" class="lms-builder-primary" [disabled]="!canSaveOrderingQuestion()" (click)="saveOrderingQuestion()">Save</button>
                        <button type="button" class="lms-builder-secondary" (click)="closeOrderingQuestionDrawer()">Cancel</button>
                      </footer>
                    </aside>
                  </div>
                }

                @if (matchPairsQuestionDraft(); as draft) {
                  <div class="lms-test-question-drawer-backdrop" role="presentation" tabindex="-1" (click)="closeMatchPairsQuestionDrawer()" (keydown.escape)="closeMatchPairsQuestionDrawer()">
                    <aside class="lms-test-question-drawer" role="dialog" aria-modal="true" aria-labelledby="test-match-pairs-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                      <header>
                        <h3 id="test-match-pairs-title">{{ draft.blockId ? 'Edit match the pairs question' : 'Add match the pairs question' }}</h3>
                        <button type="button" aria-label="Close question editor" (click)="closeMatchPairsQuestionDrawer()"><mat-icon>close</mat-icon></button>
                      </header>
                      <div class="lms-test-question-drawer-body">
                        <label class="lms-test-question-field">
                          <mat-icon>dynamic_feed</mat-icon>
                          <input type="text" [ngModel]="draft.question" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateMatchPairsQuestion($event)" placeholder="Enter a question here" />
                        </label>
                        <p class="lms-test-question-note">Note: Add possible answers in the correct order. We'll present them randomly for the end-user.</p>

                        <div class="lms-test-matching-list" aria-label="Matching pairs">
                          @for (pair of draft.pairs; track $index; let pairIndex = $index) {
                            <div class="lms-test-matching-pair">
                              <label class="lms-test-matching-card">
                                <input type="text" [attr.data-test-match-left-index]="pairIndex" [ngModel]="pair.left" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateMatchPairItem(pairIndex, 'left', $event)" (keydown.enter)="addMatchPairAfter(pairIndex, $event)" [placeholder]="matchingPairPlaceholder(pairIndex)" />
                              </label>
                              <span class="lms-test-matching-connector" aria-hidden="true"></span>
                              <label class="lms-test-matching-card">
                                <input type="text" [attr.data-test-match-right-index]="pairIndex" [ngModel]="pair.right" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateMatchPairItem(pairIndex, 'right', $event)" (keydown.enter)="addMatchPairAfter(pairIndex, $event)" [placeholder]="matchingPairPlaceholder(pairIndex)" />
                              </label>
                              @if (draft.pairs.length > 2) {
                                <button type="button" aria-label="Remove matching pair" (click)="removeMatchPair(pairIndex)"><mat-icon>close</mat-icon></button>
                              }
                            </div>
                          }
                        </div>
                      </div>
                      <footer>
                        <button type="button" class="lms-builder-primary" [disabled]="!canSaveMatchPairsQuestion()" (click)="saveMatchPairsQuestion()">Save</button>
                        <button type="button" class="lms-builder-secondary" (click)="closeMatchPairsQuestionDrawer()">Cancel</button>
                      </footer>
                    </aside>
                  </div>
                }

                @if (freeTextQuestionDraft(); as draft) {
                  <div class="lms-test-question-drawer-backdrop" role="presentation" tabindex="-1" (click)="closeFreeTextQuestionDrawer()" (keydown.escape)="closeFreeTextQuestionDrawer()">
                    <aside class="lms-test-question-drawer" role="dialog" aria-modal="true" aria-labelledby="test-free-text-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                      <header>
                        <h3 id="test-free-text-title">{{ draft.blockId ? 'Edit free text question' : 'Add free text question' }}</h3>
                        <button type="button" aria-label="Close question editor" (click)="closeFreeTextQuestionDrawer()"><mat-icon>close</mat-icon></button>
                      </header>
                      <div class="lms-test-question-drawer-body">
                        <label class="lms-test-question-field">
                          <mat-icon>text_fields</mat-icon>
                          <input type="text" [ngModel]="draft.question" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateFreeTextQuestion($event)" placeholder="Enter a question here" />
                        </label>

                        <label class="lms-free-text-threshold">
                          <span>Consider correct when accumulated points are greater or equal to</span>
                          <input type="number" min="0" [ngModel]="draft.minimumPoints" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateFreeTextMinimumPoints($event)" />
                        </label>

                        <section class="lms-free-text-rules" aria-label="Free text scoring rules">
                          <h4>Rules <mat-icon aria-hidden="true">info</mat-icon></h4>
                          <div class="lms-free-text-rule-card">
                            <label>
                              <span>When</span>
                              <select [ngModel]="draft.rule.operator" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateFreeTextRuleOperator($event)">
                                <option value="contains">contains</option>
                                <option value="equals">equals</option>
                                <option value="startsWith">starts with</option>
                                <option value="endsWith">ends with</option>
                              </select>
                            </label>
                            <label>
                              <span>the word</span>
                              <input type="text" [ngModel]="draft.rule.words" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateFreeTextRuleWords($event)" placeholder="e.g., fast  |  quick" />
                            </label>
                            <label>
                              <span>add</span>
                              <select [ngModel]="draft.rule.points" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateFreeTextRulePoints($event)">
                                @for (points of freeTextPointOptions; track points) {
                                  <option [ngValue]="points">{{ points }}</option>
                                }
                              </select>
                              <span>points</span>
                            </label>
                          </div>
                        </section>
                      </div>
                      <footer>
                        <button type="button" class="lms-builder-primary" [disabled]="!canSaveFreeTextQuestion()" (click)="saveFreeTextQuestion()">Save</button>
                        <button type="button" class="lms-builder-secondary" (click)="closeFreeTextQuestionDrawer()">Cancel</button>
                      </footer>
                    </aside>
                  </div>
                }

                @if (importQuestionsDraft(); as draft) {
                  <div class="lms-test-question-drawer-backdrop" role="presentation" tabindex="-1" (click)="closeImportQuestionsDrawer()" (keydown.escape)="closeImportQuestionsDrawer()">
                    <aside class="lms-test-question-drawer lms-import-question-drawer" role="dialog" aria-modal="true" aria-labelledby="test-import-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                      <header>
                        <h3 id="test-import-title">Import questions</h3>
                        <button type="button" aria-label="Close import questions" (click)="closeImportQuestionsDrawer()"><mat-icon>close</mat-icon></button>
                      </header>
                      <div class="lms-test-question-drawer-body">
                        <label class="lms-import-field">
                          <span>Type</span>
                          <select [ngModel]="draft.type" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateImportQuestionsType($event)">
                            <option value="GIFT">GIFT</option>
                            <option value="AIKEN">AIKEN</option>
                          </select>
                        </label>

                        <label class="lms-import-field">
                          <span>Data</span>
                          <textarea [ngModel]="draft.data" [ngModelOptions]="{ standalone: true }" (ngModelChange)="updateImportQuestionsData($event)"></textarea>
                        </label>

                        <div class="lms-import-validation-row">
                          <button type="button" class="lms-import-validate" [disabled]="!draft.data.trim()" (click)="validateImportQuestions()">
                            <mat-icon>check_circle</mat-icon>
                            Validate data
                          </button>
                          @if (draft.validationMessage) {
                            <p class="lms-import-message">{{ draft.validationMessage }}</p>
                          }
                          @if (draft.validationError) {
                            <p class="lms-import-error" role="alert">{{ draft.validationError }}</p>
                          }
                        </div>

                        @if (draft.type === "GIFT") {
                          <section class="lms-import-cheatsheet-list" aria-label="GIFT cheatsheet">
                            @for (section of giftCheatsheetSections; track section.id) {
                              <article class="lms-import-cheatsheet">
                                <button type="button" class="lms-import-cheatsheet-toggle" [attr.aria-expanded]="importCheatsheetOpen() === section.id" (click)="toggleImportCheatsheet(section.id)">
                                  <strong>{{ section.title }}</strong>
                                  <mat-icon>{{ importCheatsheetOpen() === section.id ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</mat-icon>
                                </button>
                                @if (importCheatsheetOpen() === section.id) {
                                  <div class="lms-import-cheatsheet-body">
                                    <p>{{ section.description }}</p>
                                    <ul>
                                      @for (rule of section.rules; track rule) {
                                        <li>{{ rule }}</li>
                                      }
                                    </ul>
                                    @if (section.extra) {
                                      <p>{{ section.extra }}</p>
                                    }
                                    <strong>Example</strong>
                                    <pre>{{ section.example }}</pre>
                                    <button type="button" class="lms-import-copy" (click)="copyGiftImportExample(section)"><mat-icon>content_copy</mat-icon>Copy to clipboard</button>
                                  </div>
                                }
                              </article>
                            }
                          </section>
                        } @else {
                          <section class="lms-import-cheatsheet" aria-label="AIKEN cheatsheet">
                            <button type="button" class="lms-import-cheatsheet-toggle" [attr.aria-expanded]="importCheatsheetOpen() === 'multipleChoice'" (click)="toggleImportCheatsheet('multipleChoice')">
                              <strong>Multiple choice <span>with a single correct answer</span></strong>
                              <mat-icon>{{ importCheatsheetOpen() === 'multipleChoice' ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</mat-icon>
                            </button>
                            @if (importCheatsheetOpen() === "multipleChoice") {
                              <div class="lms-import-cheatsheet-body">
                                <p>An AIKEN question entry must follow these rules:</p>
                                <ul>
                                  <li>The question must be typed as a single line.</li>
                                  <li>Each answer must be typed on a different line and preceded by a single letter, for example A. or A).</li>
                                  <li>The correct answer must be typed on the last line as ANSWER: followed by its letter.</li>
                                </ul>
                                <strong>Example</strong>
                                <pre>{{ aikenImportExample }}</pre>
                                <button type="button" class="lms-import-copy" (click)="copyAikenImportExample()"><mat-icon>content_copy</mat-icon>Copy to clipboard</button>
                              </div>
                            }
                          </section>
                        }
                      </div>
                      <footer>
                        <button type="button" class="lms-builder-primary" [disabled]="!canSaveImportQuestions()" (click)="saveImportQuestions()">Save</button>
                        <button type="button" class="lms-builder-secondary" (click)="closeImportQuestionsDrawer()">Cancel</button>
                      </footer>
                    </aside>
                  </div>
                }

                @if (existingQuestionsDrawerOpen()) {
                  <div class="lms-test-question-drawer-backdrop" role="presentation" tabindex="-1" (click)="closeExistingQuestionsDrawer()" (keydown.escape)="closeExistingQuestionsDrawer()">
                    <aside class="lms-test-question-drawer lms-existing-question-drawer" role="dialog" aria-modal="true" aria-labelledby="test-existing-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                      <header>
                        <h3 id="test-existing-title">Add an existing question</h3>
                        <button type="button" aria-label="Close existing questions" (click)="closeExistingQuestionsDrawer()"><mat-icon>close</mat-icon></button>
                      </header>
                      <div class="lms-test-question-drawer-body">
                        <div class="lms-existing-question-toolbar">
                          <label class="lms-existing-question-search">
                            <span class="lms-visually-hidden">Search existing questions</span>
                            <input type="search" placeholder="Search" [ngModel]="existingQuestionSearch()" [ngModelOptions]="{ standalone: true }" (ngModelChange)="existingQuestionSearch.set($event)" />
                            <mat-icon>search</mat-icon>
                          </label>
                          <button type="button" class="lms-existing-filter-button" aria-label="Filter questions" title="Filter questions"><mat-icon>filter_alt</mat-icon></button>
                        </div>

                        @if (filteredExistingCourseQuestions().length) {
                          <div class="lms-existing-question-table-shell">
                            <table class="lms-existing-question-table">
                              <thead>
                                <tr>
                                  <th scope="col">Question</th>
                                  <th scope="col">Tags</th>
                                  <th scope="col">Added <mat-icon aria-hidden="true">keyboard_arrow_down</mat-icon></th>
                                  <th scope="col">Course</th>
                                  <th scope="col"><span class="lms-visually-hidden">Preview</span></th>
                                </tr>
                              </thead>
                              <tbody>
                                @for (option of filteredExistingCourseQuestions(); track option.block.id) {
                                  <tr>
                                    <td>
                                      <div class="lms-existing-question-cell">
                                        <mat-icon>{{ testQuestionIcon(option.block) }}</mat-icon>
                                        <span>{{ existingQuestionTitle(option) }}</span>
                                      </div>
                                    </td>
                                    <td>-</td>
                                    <td>
                                      <button type="button" class="lms-existing-added-switch" [class.is-added]="isExistingQuestionAdded(option)" [attr.aria-pressed]="isExistingQuestionAdded(option)" (click)="toggleExistingCourseQuestion(option)">
                                        <span></span>
                                      </button>
                                    </td>
                                    <td>{{ option.courseTitle }}</td>
                                    <td>
                                      <button type="button" class="lms-existing-preview-button" [attr.aria-label]="'View ' + existingQuestionTitle(option)" (click)="openExistingQuestionPreview(option)">
                                        <mat-icon>visibility</mat-icon>
                                      </button>
                                    </td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                          <footer class="lms-existing-question-footer">
                            <button type="button" aria-label="Save as CSV" title="Save as CSV"><mat-icon>table_view</mat-icon></button>
                            <span>{{ filteredExistingCourseQuestions().length }} of {{ currentCourseExistingQuestions().length }}</span>
                          </footer>
                        } @else {
                          <div class="lms-existing-question-empty">
                            <mat-icon>quiz</mat-icon>
                            <strong>{{ currentCourseExistingQuestions().length ? 'No questions match your search' : 'No existing questions in this course' }}</strong>
                            <p>{{ currentCourseExistingQuestions().length ? 'Try another search term.' : 'Add questions to another unit in this course first.' }}</p>
                          </div>
                        }
                      </div>
                    </aside>
                    @if (existingQuestionPreview(); as preview) {
                      <aside class="lms-test-question-drawer lms-existing-question-preview-drawer" role="dialog" aria-modal="true" aria-labelledby="existing-question-preview-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                        <header>
                          <h3 id="existing-question-preview-title">Question preview</h3>
                          <button type="button" aria-label="Close question preview" (click)="closeExistingQuestionPreview()"><mat-icon>close</mat-icon></button>
                        </header>
                        <div class="lms-test-question-drawer-body">
                          <section class="lms-existing-preview-summary">
                            <span><mat-icon>{{ testQuestionIcon(preview.block) }}</mat-icon></span>
                            <div>
                              <strong>{{ existingQuestionTitle(preview) }}</strong>
                              <p>{{ preview.nodeTitle }} · {{ existingQuestionTypeLabel(preview.block) }}</p>
                            </div>
                          </section>

                          @if (blockPayloadString(preview.block, 'question')) {
                            <section class="lms-existing-preview-section">
                              <h4>Question</h4>
                              <p>{{ blockPayloadString(preview.block, 'question') }}</p>
                            </section>
                          }

                          <section class="lms-existing-preview-section">
                            <h4>Answers</h4>
                            @if (quizMatchingPairs(preview.block).length) {
                              <div class="lms-existing-preview-answer-list">
                                @for (pair of quizMatchingPairs(preview.block); track $index) {
                                  <div class="lms-existing-preview-answer is-pair">
                                    <span>{{ pair.left || 'Empty item' }}</span>
                                    <mat-icon>arrow_forward</mat-icon>
                                    <span>{{ pair.right || 'Empty match' }}</span>
                                  </div>
                                }
                              </div>
                            } @else if (quizAnswers(preview.block).length) {
                              <div class="lms-existing-preview-answer-list">
                                @for (answer of quizAnswers(preview.block); track $index; let answerIndex = $index) {
                                  <div class="lms-existing-preview-answer" [class.is-correct]="quizCorrectIndex(preview.block) === answerIndex">
                                    <span>{{ answerIndex + 1 }}</span>
                                    <p>{{ answer || 'Empty answer' }}</p>
                                    @if (quizCorrectIndex(preview.block) === answerIndex) {
                                      <mat-icon>check_circle</mat-icon>
                                    }
                                  </div>
                                }
                              </div>
                            } @else if (blockPayloadString(preview.block, 'questionType') === 'freeText') {
                              <p>{{ freeTextQuestionRuleSummary(preview.block) }}</p>
                            } @else {
                              <p>No answers were added for this question.</p>
                            }
                          </section>
                        </div>
                      </aside>
                    }
                  </div>
                }

                @if (builderPublishBlockers(); as blockers) {
                  <div class="lms-course-node-modal-backdrop" role="presentation" tabindex="-1" (click)="closePublishValidationDialog()" (keydown.escape)="closePublishValidationDialog()">
                    <section class="lms-builder-validation-dialog" role="dialog" aria-modal="true" aria-labelledby="builder-publish-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                      <header><div><h3 id="builder-publish-title">Course cannot be published yet</h3><p>Fix these blockers, then publish again.</p></div><button type="button" (click)="closePublishValidationDialog()" aria-label="Close validation"><mat-icon>close</mat-icon></button></header>
                      <div class="lms-builder-validation-list">
                        @for (blocker of blockers; track blocker.id) {
                          <button type="button" (click)="selectPublishBlocker(blocker)"><mat-icon>error_outline</mat-icon>{{ blocker.message }}</button>
                        }
                      </div>
                    </section>
                  </div>
                }

                @if (builderPendingDeleteNodeId()) {
                  <div class="lms-course-node-modal-backdrop" role="presentation" tabindex="-1" (click)="cancelRemoveCourseContentNode()" (keydown.escape)="cancelRemoveCourseContentNode()">
                    <section class="lms-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="builder-delete-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                      <span class="lms-confirm-icon"><mat-icon>delete</mat-icon></span>
                      <div class="lms-confirm-copy"><h3 id="builder-delete-title">Delete curriculum item?</h3><p>This removes the item and all nested sub items from this course builder.</p></div>
                      <div class="lms-confirm-actions"><button type="button" class="lms-button lms-button-secondary" (click)="cancelRemoveCourseContentNode()">Cancel</button><button type="button" class="lms-button lms-confirm-delete" (click)="confirmRemoveCourseContentNode()">Delete item</button></div>
                    </section>
                  </div>
                }

                @if (builderMediaDialog()) {
                  <div class="lms-course-node-modal-backdrop" role="presentation" tabindex="-1" (click)="closeBuilderRecordingDialog()" (keydown.escape)="closeBuilderRecordingDialog()">
                    <section class="lms-builder-recording-dialog" role="dialog" aria-modal="true" aria-labelledby="builder-recording-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                      <header><div><h3 id="builder-recording-title">{{ builderMediaDialog() === 'screen' ? 'Record screen' : 'Record video' }}</h3><p>Permission is requested only when you start recording.</p></div><button type="button" (click)="closeBuilderRecordingDialog()" aria-label="Close recorder"><mat-icon>close</mat-icon></button></header>
                      <video class="lms-builder-local-video" [srcObject]="builderMediaStream()" [src]="builderRecordedPreviewUrl()" autoplay muted playsinline controls></video>
                      @if (builderRecordingError()) { <p class="lms-builder-error"><mat-icon>error_outline</mat-icon>{{ builderRecordingError() }}</p> }
                      <div class="lms-recorder-actions"><span class="lms-recording-timer">{{ recordingTimerLabel() }}</span><button type="button" class="lms-builder-primary" [disabled]="builderRecordingActive() || !builderRecorderSupported()" (click)="startBuilderRecording()"><mat-icon>fiber_manual_record</mat-icon>Start</button><button type="button" class="lms-builder-secondary" (click)="pauseBuilderRecording()">Pause</button><button type="button" class="lms-builder-secondary" (click)="resumeBuilderRecording()">Resume</button><button type="button" class="lms-builder-secondary" (click)="stopBuilderRecording()">Stop</button><button type="button" class="lms-builder-primary" [disabled]="!builderRecordedPreviewUrl()" (click)="useBuilderRecording()">Use recording</button></div>
                    </section>
                  </div>
                }

                <ng-template #builderTreeNodes let-nodes="nodes" let-parentId="parentId">
                  <div class="lms-builder-node-list" cdkDropList [id]="builderDropListId(parentId)" [cdkDropListData]="nodes" [cdkDropListConnectedTo]="builderDropListIds()" (cdkDropListDropped)="dropCourseContentNode($event)">
                  @for (node of filteredBuilderNodes(nodes); track node) {
                    <div class="lms-builder-node" role="treeitem" cdkDrag [cdkDragData]="node" [attr.aria-expanded]="courseNodeHasChildren(node) ? isCourseNodeExpanded(node.controls['id'].value) : null" [attr.aria-selected]="activeCourseContentPreviewId() === node.controls['id'].value" [attr.aria-current]="activeCourseContentPreviewId() === node.controls['id'].value ? 'page' : null">
                      <div class="lms-builder-node-row" [class.is-selected]="activeCourseContentPreviewId() === node.controls['id'].value">
                        <span class="lms-drag-handle"><mat-icon>drag_indicator</mat-icon></span>
                        <button type="button" class="lms-builder-node-toggle" [disabled]="!courseNodeHasChildren(node)" (click)="toggleCourseContentNode(node.controls['id'].value)" [attr.aria-label]="isCourseNodeExpanded(node.controls['id'].value) ? 'Collapse ' + courseNodeTitle(node) : 'Expand ' + courseNodeTitle(node)" [title]="isCourseNodeExpanded(node.controls['id'].value) ? 'Collapse ' + courseNodeTitle(node) : 'Expand ' + courseNodeTitle(node)"><mat-icon>{{ courseNodeHasChildren(node) ? (isCourseNodeExpanded(node.controls['id'].value) ? 'expand_more' : 'chevron_right') : 'fiber_manual_record' }}</mat-icon></button>
                        <button type="button" class="lms-builder-node-title" (click)="openCourseContentPreview(node.controls['id'].value)" [title]="courseNodeTitle(node)"><mat-icon>{{ courseNodeIcon(node) }}</mat-icon><span>{{ courseNodeTitle(node) }}</span><small>{{ courseNodeHasChildren(node) ? courseNodeChildren(node).length + ' units' : 'Draft' }}</small></button>
                        @if (!courseNodeIsFolder(node)) {
                          <button type="button" class="lms-builder-node-action is-free" [class.is-active]="courseNodeFreePreview(node)" (click)="$event.stopPropagation(); toggleCourseContentNodeFreePreview(node.controls['id'].value)" [attr.aria-label]="courseNodeFreePreview(node) ? 'Remove free preview from ' + courseNodeTitle(node) : 'Make ' + courseNodeTitle(node) + ' free preview'" [title]="courseNodeFreePreview(node) ? 'Remove free preview' : 'Make free preview'"><mat-icon>workspace_premium</mat-icon></button>
                        }
                        <button type="button" class="lms-builder-node-action is-copy" (click)="duplicateCourseContentNode(node.controls['id'].value)" aria-label="Duplicate unit" title="Duplicate unit"><mat-icon>content_copy</mat-icon></button>
                        <button type="button" class="lms-builder-node-action is-danger" (click)="$event.stopPropagation(); removeCourseContentNode(node.controls['id'].value)" aria-label="Delete unit" title="Delete unit"><mat-icon>delete</mat-icon></button>
                      </div>
                      @if (courseNodeHasChildren(node) && isCourseNodeExpanded(node.controls['id'].value)) {
                        <div class="lms-builder-node-children" role="group">
                          <ng-container *ngTemplateOutlet="builderTreeNodes; context: { nodes: courseNodeChildren(node).controls, parentId: node.controls['id'].value }"></ng-container>
                        </div>
                      }
                    </div>
                  }
                  </div>
                </ng-template>
              </section>
              } @else {
              <section class="lms-section lms-section-page lms-course-builder" [formGroup]="courseForm">
                <div class="lms-section-heading">
                  <div class="lms-section-title"><span class="lms-section-row-icon"><mat-icon>video_library</mat-icon></span><div><p class="lms-section-parent">Content / Courses</p><h2>{{ editingCourseId() ? 'Edit course' : 'Create course' }}</h2><p>Create the course page, choose its tenant grade, and add optional structured learning content.</p></div></div>
                  <a class="lms-button lms-button-secondary" [routerLink]="['/tenant/lms-settings/content/courses']"><mat-icon>arrow_back</mat-icon>Back to courses</a>
                </div>

                @if (coursesLoading()) {
                  <div class="lms-course-loading"><span class="lms-skeleton"></span><span class="lms-skeleton lms-skeleton-short"></span></div>
                } @else {
                    <div class="lms-course-form">
                      @if (courseError()) { <div class="lms-inline-alert is-error" role="alert"><mat-icon>error_outline</mat-icon>{{ courseError() }}</div> }
                      @if (courseMessage()) { <div class="lms-inline-alert is-success" role="status"><mat-icon>check_circle</mat-icon>{{ courseMessage() }}</div> }
                      @if (builderPendingDeleteNodeId()) {
                        <div class="lms-course-node-modal-backdrop" role="presentation" tabindex="-1" (click)="cancelRemoveCourseContentNode()" (keydown.escape)="cancelRemoveCourseContentNode()">
                          <section class="lms-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="course-content-delete-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
                            <span class="lms-confirm-icon"><mat-icon>delete</mat-icon></span>
                            <div class="lms-confirm-copy"><h3 id="course-content-delete-title">Delete content item?</h3><p>This removes the item and all nested sub items from this course.</p></div>
                            <div class="lms-confirm-actions"><button type="button" class="lms-button lms-button-secondary" (click)="cancelRemoveCourseContentNode()">Cancel</button><button type="button" class="lms-button lms-confirm-delete" (click)="confirmRemoveCourseContentNode()">OK, delete</button></div>
                          </section>
                        </div>
                      }

                      <section class="lms-course-accordion-card lms-course-card-details" [class.is-collapsed]="!isCourseEditorCardExpanded('details')">
                        <button type="button" class="lms-course-accordion-head" [attr.aria-expanded]="isCourseEditorCardExpanded('details')" (click)="toggleCourseEditorCard('details')">
                          <span class="lms-course-accordion-title"><mat-icon>{{ isCourseEditorCardExpanded('details') ? 'expand_more' : 'chevron_right' }}</mat-icon><span><strong>Course details</strong><small>Set the course identity, route, and cover image shown on the public detail page.</small></span></span>
                          <span class="lms-required-pill">Title, grade, and slug required</span>
                        </button>
                        @if (isCourseEditorCardExpanded('details')) {
                        <fieldset class="lms-field-group lms-course-details-group" aria-label="Course details">
                        <div class="lms-course-details-layout">
                          <div class="lms-fields lms-course-details-fields">
                            <label class="lms-field-wide"><span>Course title</span><input class="tenant-lms-input lms-course-title-input" formControlName="title" dir="rtl" placeholder="اكتب اسم الكورس" /></label>
                            <label><span>Grade</span><select class="tenant-lms-input" formControlName="gradeId"><option value="">Select a tenant grade</option>@for (grade of tenantGrades(); track grade.id) { <option [value]="grade.id">{{ grade.name }} · {{ grade.level }}</option> }</select><small class="lms-field-hint">Loaded from Tenant Grades.</small></label>
                            <label><span>Route slug</span><div class="lms-input-prefix"><span>/courses/</span><input class="tenant-lms-input" formControlName="slug" inputmode="url" placeholder="calculus" /></div><small class="lms-field-hint">Lowercase letters, numbers, and hyphens only.</small></label>
                            <label class="lms-field-wide"><span>Subtitle</span><input class="tenant-lms-input" formControlName="subtitle" dir="rtl" placeholder="Short course summary" /></label>
                            <label class="lms-field-wide"><span>Description</span><textarea class="tenant-lms-input" formControlName="description" rows="5" dir="rtl" placeholder="Explain what learners will study and who this course is for."></textarea></label>
                          </div>
                          <aside class="lms-course-thumbnail-panel" aria-label="Course thumbnail">
                            <div class="lms-course-thumbnail-head"><span>Thumbnail</span><small>16:10 image recommended</small></div>
                            <div class="lms-course-thumbnail-preview">
                              @if (courseThumbnailPreviewUrl()) {
                                <img [src]="courseThumbnailPreviewUrl()" alt="Course thumbnail preview" />
                              } @else {
                                <span><mat-icon>image</mat-icon><small>No thumbnail selected</small></span>
                              }
                            </div>
                            <label class="lms-course-thumbnail-url"><span>Image URL</span><input class="tenant-lms-input" formControlName="thumbnailUrl" type="url" placeholder="https://example.com/course.jpg" /></label>
                            <label class="lms-course-upload-control" [class.is-uploading]="courseUploading()">
                              <input type="file" accept="image/*" (change)="uploadCourseAsset($event, 'thumbnail')" [disabled]="courseUploading()" />
                              <mat-icon>{{ courseUploading() ? 'sync' : 'upload_file' }}</mat-icon>
                              <span>{{ courseUploading() ? 'Uploading thumbnail…' : 'Upload thumbnail' }}</span>
                              <small>PNG, JPG, or WebP</small>
                            </label>
                          </aside>
                        </div>
                        </fieldset>
                        }
                      </section>

                      <section class="lms-course-accordion-card lms-course-card-sales" [class.is-collapsed]="!isCourseEditorCardExpanded('sales')">
                        <button type="button" class="lms-course-accordion-head" [attr.aria-expanded]="isCourseEditorCardExpanded('sales')" (click)="toggleCourseEditorCard('sales')">
                          <span class="lms-course-accordion-title"><mat-icon>{{ isCourseEditorCardExpanded('sales') ? 'expand_more' : 'chevron_right' }}</mat-icon><span><strong>Preview and sales</strong><small>Control the public preview, price display, and course facts shown before enrollment.</small></span></span>
                          <span class="lms-required-pill">Price and currency required</span>
                        </button>
                        @if (isCourseEditorCardExpanded('sales')) {
                        <fieldset class="lms-field-group lms-preview-sales-group" aria-label="Preview and sales">
                        <div class="lms-preview-sales-layout">
                          <section class="lms-preview-media-panel" aria-label="Course preview media">
                            <div class="lms-preview-media-head">
                              <div><span>Preview media</span><small>Optional public sample before enrollment</small></div>
                              <mat-icon>{{ previewMediaIcon() }}</mat-icon>
                            </div>
                            <div class="lms-preview-media-frame" [class.has-preview]="previewMediaPreviewUrl()">
                              @if (previewMediaPreviewUrl() && coursePreviewMediaType() === 'IMAGE') {
                                <img [src]="previewMediaPreviewUrl()" alt="Course preview media" />
                              } @else if (previewMediaPreviewUrl() && coursePreviewMediaType() === 'VIDEO') {
                                <video [src]="previewMediaPreviewUrl()" controls preload="metadata"></video>
                              } @else if (previewMediaPreviewUrl() && coursePreviewMediaType() === 'AUDIO') {
                                <div class="lms-preview-audio-player"><mat-icon>graphic_eq</mat-icon><audio [src]="previewMediaPreviewUrl()" controls preload="metadata"></audio></div>
                              } @else {
                                <span><mat-icon>{{ previewMediaIcon() }}</mat-icon><small>{{ coursePreviewMediaType() === 'NONE' ? 'No preview selected' : coursePreviewMediaTypeLabel() + ' preview selected' }}</small></span>
                              }
                            </div>
                            <div class="lms-preview-media-fields">
                              <label><span>Media type</span><select class="tenant-lms-input" formControlName="previewMediaType"><option value="NONE">No preview</option><option value="VIDEO">Video</option><option value="IMAGE">Image</option><option value="AUDIO">Audio</option></select></label>
                              <label><span>Preview URL</span><input class="tenant-lms-input" formControlName="previewMediaUrl" type="url" placeholder="https://example.com/preview" /></label>
                            </div>
                            <label class="lms-course-upload-control" [class.is-uploading]="courseUploading()">
                              <input type="file" accept="video/*,audio/*,image/*" (change)="uploadCourseAsset($event, 'preview')" [disabled]="courseUploading()" />
                              <mat-icon>{{ courseUploading() ? 'sync' : 'upload_file' }}</mat-icon>
                              <span>{{ courseUploading() ? 'Uploading preview…' : 'Upload preview media' }}</span>
                              <small>Video, audio, or image</small>
                            </label>
                          </section>
                          <section class="lms-sales-panel" aria-label="Course sales details">
                            <div class="lms-sales-grid">
                              <label><span>Price</span><input class="tenant-lms-input lms-price-input" formControlName="price" type="number" min="0" step="0.01" /></label>
                              <label><span>Old price</span><input class="tenant-lms-input" formControlName="oldPrice" type="number" min="0" step="0.01" /></label>
                              <label><span>Currency</span><input class="tenant-lms-input" formControlName="currency" maxlength="12" /></label>
                              <label><span>Duration label</span><input class="tenant-lms-input" formControlName="durationLabel" placeholder="42 lessons · 21 hours" /></label>
                              <label><span>Students label</span><input class="tenant-lms-input" formControlName="studentsLabel" placeholder="6,300 students" /></label>
                              <label><span>Rating label</span><input class="tenant-lms-input" formControlName="ratingLabel" placeholder="4.9 (1,240 reviews)" /></label>
                            </div>
                            <label class="lms-publish-control lms-publish-control-polished"><input type="checkbox" formControlName="published" /><span><strong>Publish this course</strong><small>Published courses are visible on the public LMS after saving.</small></span><mat-icon>{{ courseForm.controls.published.value ? 'public' : 'visibility_off' }}</mat-icon></label>
                          </section>
                        </div>
                        </fieldset>
                        <div class="lms-two-column-editor">
                          <fieldset class="lms-field-group"><div class="lms-manager-heading"><div><legend>What students will learn</legend><p>Outcome checklist on the course page.</p></div><button type="button" class="lms-icon-button" (click)="addTextItem('learningOutcomes')" aria-label="Add learning outcome"><mat-icon>add</mat-icon></button></div><div formArrayName="learningOutcomes" class="lms-simple-list">@for (control of learningOutcomeControls().controls; track control; let i = $index) { <div><input class="tenant-lms-input" [formControlName]="i" dir="rtl" /><button type="button" (click)="removeTextItem('learningOutcomes', i)" aria-label="Remove outcome"><mat-icon>close</mat-icon></button></div> }</div></fieldset>
                          <fieldset class="lms-field-group"><div class="lms-manager-heading"><div><legend>Course includes</legend><p>PDF notes, exams, access, support, and other benefits.</p></div><button type="button" class="lms-icon-button" (click)="addTextItem('features')" aria-label="Add course feature"><mat-icon>add</mat-icon></button></div><div formArrayName="features" class="lms-simple-list">@for (control of featureControls().controls; track control; let i = $index) { <div><input class="tenant-lms-input" [formControlName]="i" dir="rtl" /><button type="button" (click)="removeTextItem('features', i)" aria-label="Remove feature"><mat-icon>close</mat-icon></button></div> }</div></fieldset>
                        </div>
                        }
                      </section>

                      <section class="lms-course-accordion-card lms-course-card-content" [class.is-collapsed]="!isCourseEditorCardExpanded('content')">
                        <button type="button" class="lms-course-accordion-head" [attr.aria-expanded]="isCourseEditorCardExpanded('content')" (click)="toggleCourseEditorCard('content')">
                          <span class="lms-course-accordion-title"><mat-icon>{{ isCourseEditorCardExpanded('content') ? 'expand_more' : 'chevron_right' }}</mat-icon><span><strong>Course content</strong><small>Build a clear section and lesson tree, then attach media resources to each lesson.</small></span></span>
                          <span class="lms-required-pill">{{ courseContentSummary() }}</span>
                        </button>
                        @if (isCourseEditorCardExpanded('content')) {
                        <fieldset class="lms-field-group lms-course-content-group" aria-label="Course content">
                        <div class="lms-course-content-browser">
                          <aside class="lms-course-content-tree-panel" aria-label="Course content tree panel">
                            <div class="lms-course-content-panel-header"><h3>Content tree</h3></div>
                            <div class="lms-course-content-tree" role="tree" aria-label="Course content tree">
                              <div class="lms-course-tree-node" role="treeitem" aria-expanded="true" [attr.aria-selected]="selectedCourseContentId() === 'content-root'">
                                <div class="lms-course-tree-row lms-course-tree-row-root" [class.is-selected]="selectedCourseContentId() === 'content-root'">
                                  <button type="button" class="lms-course-tree-toggle" aria-label="Course content expanded" (click)="toggleCourseContentNode('content-root')"><mat-icon>{{ isCourseNodeExpanded('content-root') ? 'expand_more' : 'chevron_right' }}</mat-icon></button>
                                  <mat-icon class="lms-course-tree-icon">folder</mat-icon>
                                  <button type="button" class="lms-course-tree-label" (click)="selectCourseContentRoot()">Course <small>{{ courseContentSummary() }}</small></button>
                                  <div class="lms-course-tree-actions">
                                    <button type="button" class="lms-course-tree-action" (click)="openAddCourseContentNode('content-root')" aria-label="Add item under Course"><mat-icon>add</mat-icon></button>
                                  </div>
                                </div>
                              </div>
                              @if (isCourseNodeExpanded('content-root')) {
                                <div class="lms-course-tree-children" role="group">
                                  <ng-container *ngTemplateOutlet="courseContentTreeNodes; context: { nodes: curriculumControls().controls }"></ng-container>
                                </div>
                              }
                            </div>
                          </aside>

                          <section class="lms-course-content-table-panel" aria-label="Course content table">
                            <div class="lms-course-content-table-header">
                              <h3>{{ selectedCourseContentTitle() }}</h3>
                              <div>
                                <button type="button" aria-label="Search content"><mat-icon>search</mat-icon></button>
                                <button type="button" aria-label="Filter content"><mat-icon>filter_list</mat-icon></button>
                              </div>
                            </div>
                            <div class="lms-course-content-table-wrap">
                              <table class="lms-course-content-table">
                                <thead>
                                  <tr>
                                    <th>Content</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (item of selectedCourseChildNodes(); track item) {
                                    <tr class="lms-course-content-row" (click)="selectCourseContentNode(item.controls['id'].value)" role="button" tabindex="0" (keydown.enter)="selectCourseContentNode(item.controls['id'].value)" (keydown.space)="selectCourseContentNode(item.controls['id'].value); $event.preventDefault()">
                                      <td><div class="lms-course-content-name"><mat-icon [class.lms-course-tree-icon-leaf]="!courseNodeHasChildren(item)">{{ courseNodeIcon(item) }}</mat-icon><span>{{ courseNodeTitle(item) }}</span></div></td>
                                      <td>{{ courseNodeDescription(item) }}</td>
                                      <td (click)="$event.stopPropagation()">
                                        <div class="lms-course-table-actions">
                                          <button type="button" class="lms-course-table-action" (click)="openAddCourseContentNode(item.controls['id'].value)" aria-label="Add sub item"><mat-icon>add</mat-icon></button>
                                          <button type="button" class="lms-course-table-action" (click)="openCourseContentPreview(item.controls['id'].value)" aria-label="Preview item"><mat-icon>visibility</mat-icon></button>
                                          @if (!courseNodeIsFolder(item)) {
                                            <button type="button" class="lms-course-table-action is-free" [class.is-active]="courseNodeFreePreview(item)" (click)="toggleCourseContentNodeFreePreview(item.controls['id'].value)" [attr.aria-label]="courseNodeFreePreview(item) ? 'Remove free view from ' + courseNodeTitle(item) : 'Make ' + courseNodeTitle(item) + ' free to view'" [title]="courseNodeFreePreview(item) ? 'Remove free view' : 'Make free to view'"><mat-icon>workspace_premium</mat-icon></button>
                                          }
                                          <button type="button" class="lms-course-table-action" (click)="openEditCourseContentNodeById(item.controls['id'].value)" aria-label="Edit item"><mat-icon>edit</mat-icon></button>
                                          <button type="button" class="lms-course-table-action is-danger" (click)="removeCourseContentNode(item.controls['id'].value)" aria-label="Delete item"><mat-icon>delete</mat-icon></button>
                                        </div>
                                      </td>
                                    </tr>
                                  } @empty {
                                    <tr><td colspan="3" class="lms-course-content-empty-cell"><div class="lms-empty-lesson-state lms-course-table-empty-state"><span class="lms-course-empty-icon"><mat-icon>library_add</mat-icon></span><strong>No content in this item yet</strong><small>Add the first sub item to start building this course structure.</small><button type="button" (click)="openAddCourseContentNode(selectedCourseContentId())"><mat-icon>add</mat-icon>Add sub item</button></div></td></tr>
                                  }
                                </tbody>
                              </table>
                            </div>
                          </section>
                        </div>
                        </fieldset>
                        }
                      </section>

                      <ng-template #courseContentTreeNodes let-nodes="nodes">
                        @for (node of nodes; track node) {
                          <div class="lms-course-tree-node" role="treeitem" [attr.aria-expanded]="courseNodeHasChildren(node) ? isCourseNodeExpanded(node.controls['id'].value) : null" [attr.aria-selected]="selectedCourseContentId() === node.controls['id'].value">
                            <div class="lms-course-tree-row lms-course-tree-row-lesson" [class.is-selected]="selectedCourseContentId() === node.controls['id'].value">
                              <button type="button" class="lms-course-tree-toggle" [class.lms-course-tree-toggle--hidden]="!courseNodeHasChildren(node)" [disabled]="!courseNodeHasChildren(node)" [attr.aria-label]="isCourseNodeExpanded(node.controls['id'].value) ? 'Collapse ' + courseNodeTitle(node) : 'Expand ' + courseNodeTitle(node)" (click)="toggleCourseContentNode(node.controls['id'].value)">
                                <mat-icon>{{ isCourseNodeExpanded(node.controls['id'].value) ? 'expand_more' : 'chevron_right' }}</mat-icon>
                              </button>
                              <mat-icon class="lms-course-tree-icon" [class.lms-course-tree-icon-leaf]="!courseNodeHasChildren(node)">{{ courseNodeIcon(node) }}</mat-icon>
                              <button type="button" class="lms-course-tree-label" (click)="selectCourseContentNode(node.controls['id'].value)">{{ courseNodeTitle(node) }}</button>
                              <div class="lms-course-tree-actions">
                                <button type="button" class="lms-course-tree-action" (click)="openAddCourseContentNode(node.controls['id'].value)" aria-label="Add sub item"><mat-icon>add</mat-icon></button>
                                @if (!courseNodeIsFolder(node)) {
                                  <button type="button" class="lms-course-tree-action is-free" [class.is-active]="courseNodeFreePreview(node)" (click)="toggleCourseContentNodeFreePreview(node.controls['id'].value)" [attr.aria-label]="courseNodeFreePreview(node) ? 'Remove free view from ' + courseNodeTitle(node) : 'Make ' + courseNodeTitle(node) + ' free to view'" [title]="courseNodeFreePreview(node) ? 'Remove free view' : 'Make free to view'"><mat-icon>workspace_premium</mat-icon></button>
                                }
                                <button type="button" class="lms-course-tree-action" (click)="openEditCourseContentNodeById(node.controls['id'].value)" aria-label="Edit item"><mat-icon>edit</mat-icon></button>
                                <button type="button" class="lms-course-tree-action is-danger" (click)="removeCourseContentNode(node.controls['id'].value)" aria-label="Delete item"><mat-icon>delete</mat-icon></button>
                              </div>
                            </div>
                            @if (courseNodeHasChildren(node) && isCourseNodeExpanded(node.controls['id'].value)) {
                              <div class="lms-course-tree-children" role="group">
                                <ng-container *ngTemplateOutlet="courseContentTreeNodes; context: { nodes: courseNodeChildren(node).controls }"></ng-container>
                              </div>
                            }
                          </div>
                        }
                      </ng-template>

                      @if (courseContentNodeModal(); as modal) {
                        <div class="lms-course-node-modal-backdrop" role="presentation" tabindex="-1" (click)="closeCourseContentNodeModal()" (keydown.escape)="closeCourseContentNodeModal()">
                          <div class="lms-course-node-modal" role="dialog" aria-modal="true" aria-labelledby="lms-course-node-modal-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="saveCourseContentNodeModal($event)">
                            <div class="lms-course-node-modal-header">
                              <div>
                                <h3 id="lms-course-node-modal-title">{{ courseContentNodeModalTitle(modal) }}</h3>
                                <p>Set the name and optional description.</p>
                              </div>
                              <button type="button" class="lms-course-node-modal-close" aria-label="Close dialog" (click)="closeCourseContentNodeModal()"><mat-icon>close</mat-icon></button>
                            </div>
                            <div class="lms-course-node-modal-body">
                              <label class="lms-course-node-field">
                                <span>Name</span>
                                <input type="text" [ngModel]="courseContentNodeName()" [ngModelOptions]="{ standalone: true }" (ngModelChange)="courseContentNodeName.set($event)" placeholder="Enter name" autocomplete="off" />
                              </label>
                              <label class="lms-course-node-field">
                                <span>Description</span>
                                <textarea rows="4" [ngModel]="courseContentNodeDescription()" [ngModelOptions]="{ standalone: true }" (ngModelChange)="courseContentNodeDescription.set($event)" placeholder="Enter description"></textarea>
                              </label>
                            </div>
                            <div class="lms-course-node-modal-footer">
                              <button type="button" class="lms-course-node-secondary" (click)="closeCourseContentNodeModal()">Cancel</button>
                              <button type="button" class="lms-course-node-primary" [disabled]="!courseContentNodeName().trim()" (click)="saveCourseContentNodeModal($event)">Save</button>
                            </div>
                          </div>
                        </div>
                      }

                      @if (editingCourseId()) { <div class="lms-danger-zone"><div><strong>Delete course</strong><p>Remove this course and its saved content from the tenant LMS.</p></div><button type="button" class="lms-button lms-delete-course" (click)="deleteManagedCourse()" [disabled]="courseSaving()"><mat-icon>delete</mat-icon>Delete course</button></div> }
                    </div>
                }
              </section>
              }
            }

            @if (activePage() === "appearance") {
            <section class="lms-section">
              <div class="lms-section-heading">
                <div>
                  <h2>Appearance</h2>
                  <p>Choose the layout that best fits this learning site.</p>
                </div>
                <span class="lms-selection-summary"
                  >Selected: <strong>{{ selectedTemplateName() }}</strong></span
                >
              </div>
              <div
                class="lms-template-grid"
                role="radiogroup"
                aria-label="Website template"
              >
                @for (
                  template of settings()?.templates ?? [];
                  track template.key
                ) {
                  <button
                    type="button"
                    class="lms-template"
                    role="radio"
                    [attr.aria-checked]="
                      form.controls.selectedTemplateKey.value === template.key
                    "
                    [class.lms-template-selected]="
                      form.controls.selectedTemplateKey.value === template.key
                    "
                    (click)="selectTemplate(template.key)"
                  >
                    <span class="lms-template-preview">
                      @if (template.previewImageUrl) {
                        <img
                          [src]="template.previewImageUrl"
                          [alt]="template.name + ' template preview'"
                        />
                      } @else {
                        <span class="lms-template-placeholder"
                          ><mat-icon>web</mat-icon
                          ><small>{{ template.name }}</small></span
                        >
                      }
                      @if (
                        form.controls.selectedTemplateKey.value === template.key
                      ) {
                        <span class="lms-template-check"
                          ><mat-icon>check</mat-icon></span
                        >
                      }
                    </span>
                    <span class="lms-template-copy"
                      ><strong>{{ template.name }}</strong
                      ><small>{{ template.description }}</small></span
                    >
                  </button>
                }
              </div>
            </section>
            }

            @if (activePage() === "contentUsers") {
              @if (isLearnerCreator()) {
              <section class="lms-section lms-section-page lms-learner-editor">
                <div class="lms-section-heading lms-course-index-heading">
                  <div class="lms-section-title">
                    <span class="lms-section-row-icon"><mat-icon>person_add</mat-icon></span>
                    <div>
                      <p class="lms-section-parent">Content / Learners</p>
                      <h2>Add learner</h2>
                      <p>Create a learner profile and sign-in credentials for LMS access.</p>
                    </div>
                  </div>
                  <a class="lms-button lms-button-secondary" [routerLink]="['/tenant/lms-settings/content/learners']"><mat-icon>arrow_back</mat-icon>Back to learners</a>
                </div>

                @if (contentUsersError()) { <div class="lms-inline-alert is-error lms-index-alert" role="alert"><mat-icon>error_outline</mat-icon>{{ contentUsersError() }}</div> }

                <div class="lms-learner-form-shell" [formGroup]="learnerForm">
                  <label class="lms-learner-avatar" [class.has-image]="learnerForm.controls.avatarUrl.value" [class.is-uploading]="learnerAvatarUploading()">
                    <input type="file" accept="image/*" (change)="uploadLearnerAvatar($event)" [disabled]="learnerAvatarUploading() || learnerSaving()" />
                    @if (learnerForm.controls.avatarUrl.value) {
                      <img [src]="resolveAssetUrl(learnerForm.controls.avatarUrl.value)" alt="" />
                    } @else {
                      <mat-icon>person</mat-icon>
                    }
                    <span class="lms-learner-avatar-overlay"><mat-icon>{{ learnerAvatarUploading() ? 'sync' : 'photo_camera' }}</mat-icon>{{ learnerAvatarUploading() ? 'Uploading…' : 'Upload image' }}</span>
                  </label>
                  <div class="lms-learner-fields">
                    <label><span>First name <small>*</small></span><input class="tenant-lms-input" formControlName="firstName" autocomplete="given-name" /></label>
                    <label><span>Last name <small>*</small></span><input class="tenant-lms-input" formControlName="lastName" autocomplete="family-name" /></label>
                    <label><span>Email</span><input class="tenant-lms-input" formControlName="email" type="email" autocomplete="email" /></label>
                    <label><span>Bio</span><textarea class="tenant-lms-input" formControlName="bio" rows="6"></textarea></label>
                    <div class="lms-learner-divider"></div>
                    <h3>Sign in credentials</h3>
                    <label><span>Username <small>*</small></span><input class="tenant-lms-input" formControlName="username" autocomplete="username" /></label>
                    <label><span>Password <small>*</small></span><input class="tenant-lms-input" formControlName="password" type="password" autocomplete="new-password" placeholder="Type new password" /></label>
                    <p class="lms-learner-password-help">Passwords are required to be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter and one number.</p>
                    <div class="lms-learner-divider"></div>
                    <h3>Learner status</h3>
                    <label><span>Status <small>*</small></span><select class="tenant-lms-input" formControlName="status"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                  </div>
                </div>
              </section>
              } @else {
              <section class="lms-section lms-section-page lms-course-report">
                <div class="lms-section-heading lms-course-index-heading">
                  <div class="lms-section-title">
                    <span class="lms-section-row-icon"><mat-icon>group</mat-icon></span>
                    <div>
                      <p class="lms-section-parent">Content / Learners</p>
                      <h2>Learners</h2>
                      <p>Review the learners available for LMS enrollment and course access.</p>
                    </div>
                  </div>
                  <div class="lms-split-button" aria-label="Add learner actions">
                    <a class="lms-split-button-main" [routerLink]="['/tenant/lms-settings/content/learners/new']">Add learner</a>
                    <button type="button" class="lms-split-button-toggle" aria-label="Open add learner options" [attr.aria-expanded]="addUserMenuOpen()" aria-controls="lms-add-user-menu" (click)="toggleAddUserMenu()"><mat-icon>{{ addUserMenuOpen() ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</mat-icon></button>
                    @if (addUserMenuOpen()) {
                      <div id="lms-add-user-menu" class="lms-split-menu" role="menu">
                        <button type="button" role="menuitem" (click)="importLearners()"><mat-icon>upload_file</mat-icon><span><strong>Import learners</strong><small>Upload learner list</small></span></button>
                      </div>
                    }
                  </div>
                </div>

                @if (contentUsersError()) { <div class="lms-inline-alert is-error lms-index-alert" role="alert"><mat-icon>error_outline</mat-icon>{{ contentUsersError() }}</div> }

                <div class="lms-course-toolbar lms-report-toolbar" role="search">
                  <label class="lms-course-search"><mat-icon>search</mat-icon><span class="lms-visually-hidden">Search learners</span><input type="search" placeholder="Search by name, email, or role" [value]="contentUserSearch()" (input)="setContentUserSearch($event)" /></label>
                  <label><span class="lms-visually-hidden">Filter by role</span><select class="tenant-lms-input" [value]="contentUserRoleFilter()" (change)="setContentUserRoleFilter($event)"><option value="all">All roles</option>@for (role of contentUserRoleOptions(); track role) { <option [value]="role">{{ role }}</option> }</select></label>
                  <label><span class="lms-visually-hidden">Filter by status</span><select class="tenant-lms-input" [value]="contentUserStatusFilter()" (change)="setContentUserStatusFilter($event)"><option value="all">All statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option></select></label>
                </div>

                @if (contentUsersLoading()) {
                  <div class="lms-course-loading"><span class="lms-skeleton"></span><span class="lms-skeleton lms-skeleton-short"></span></div>
                } @else if (filteredContentUsers().length) {
                  <div class="lms-course-table-wrap">
                    <table class="lms-course-table lms-content-users-table">
                      <thead><tr><th>Learner</th><th>Status</th><th>Registration</th><th>Last login</th><th><span class="lms-visually-hidden">Actions</span></th></tr></thead>
                      <tbody>
                        @for (user of pagedContentUsers(); track user.id) {
                          <tr>
                            <td><div class="lms-user-cell">@if (user.avatar) { <img [src]="user.avatar" [alt]="user.name" /> } @else { <span>{{ user.name.charAt(0) }}</span> }<div><strong>{{ user.name }}</strong><small>{{ user.email }}</small></div></div></td>
                            <td><span class="lms-user-status" [class.is-active]="user.status === 'Active'" [class.is-pending]="user.status === 'Pending'" [class.is-inactive]="user.status === 'Inactive'">{{ user.status }}</span></td>
                            <td><span class="lms-user-registration">{{ user.registrationDate ? (user.registrationDate | date:'mediumDate') : '—' }}</span></td>
                            <td>{{ user.lastLogin }}</td>
                            <td class="lms-course-actions-cell">
                              <div class="lms-course-row-actions">
                                <span class="lms-course-actions-more" aria-hidden="true"><mat-icon>more_horiz</mat-icon></span>
                                <div class="lms-course-actions" [attr.aria-label]="'Actions for ' + user.name">
                                  <button type="button" class="lms-row-action is-danger" [attr.aria-label]="'Delete ' + user.name" [title]="'Delete ' + user.name"><mat-icon>delete_outline</mat-icon></button>
                                  <a class="lms-row-action" [routerLink]="['/tenant/users', user.id, 'edit']" [attr.aria-label]="'Edit ' + user.name" [title]="'Edit ' + user.name"><mat-icon>edit</mat-icon></a>
                                  <button type="button" class="lms-row-action" [attr.aria-label]="'Report for ' + user.name" [title]="'Report for ' + user.name"><mat-icon>query_stats</mat-icon></button>
                                  <button type="button" class="lms-row-action" [attr.aria-label]="'Preview ' + user.name" [title]="'Preview ' + user.name"><mat-icon>visibility</mat-icon></button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  <div class="lms-report-pagination">
                    <span>Showing {{ contentUserResultStart() }}-{{ contentUserResultEnd() }} of {{ filteredContentUsers().length }} learners</span>
                    <div><label class="lms-page-size">Rows<select [value]="contentUserPageSize()" (change)="setContentUserPageSize($event)"><option [value]="5">5</option><option [value]="10">10</option><option [value]="20">20</option></select></label><button type="button" class="lms-page-button lms-page-icon-button" (click)="goToContentUserPage(contentUserPage() - 1)" [disabled]="contentUserPage() === 1" title="Previous page" aria-label="Previous learner page"><mat-icon>chevron_left</mat-icon></button><span class="lms-page-summary">Page {{ contentUserPage() }} of {{ contentUserPageCount() }}</span><button type="button" class="lms-page-button lms-page-icon-button" (click)="goToContentUserPage(contentUserPage() + 1)" [disabled]="contentUserPage() === contentUserPageCount()" title="Next page" aria-label="Next learner page"><mat-icon>chevron_right</mat-icon></button></div>
                  </div>
                } @else {
                  <div class="lms-course-empty"><mat-icon>person_search</mat-icon><strong>{{ contentLearners().length ? 'No learners match these filters' : 'No learners found' }}</strong><p>{{ contentLearners().length ? 'Try another search term, role, or status.' : 'Add learners from this page, then enroll them in LMS courses.' }}</p>@if (!contentLearners().length) { <a class="lms-button lms-button-primary" [routerLink]="['/tenant/lms-settings/content/learners/new']"><mat-icon>person_add</mat-icon>Add learner</a> }</div>
                }
              </section>
              }
            }

            @if (activePage() === "content") {
            <section class="lms-section">
              <div class="lms-section-heading">
                <div>
                  <h2>Website content</h2>
                  <p>Edit the information shown on the homepage.</p>
                </div>
              </div>

              <fieldset class="lms-field-group">
                <legend>Teacher profile</legend>
                <p>Identify the teacher and the students this site serves.</p>
                <div class="lms-fields">
                  <label
                    ><span>Teacher name</span
                    ><input
                      class="tenant-lms-input"
                      formControlName="teacherName"
                      autocomplete="name"
                  /></label>
                  <label
                    ><span>Subject</span
                    ><input class="tenant-lms-input" formControlName="subject"
                  /></label>
                  <label
                    ><span>Audience</span
                    ><input class="tenant-lms-input" formControlName="audience"
                  /></label>
                  <label
                    ><span>Portrait image URL</span
                    ><input
                      class="tenant-lms-input"
                      formControlName="portraitImageUrl"
                      type="url"
                      inputmode="url"
                  /></label>
                </div>
              </fieldset>

              <fieldset class="lms-field-group">
                <legend>Homepage message</legend>
                <p>Set the main message and announcement shown to visitors.</p>
                <div class="lms-fields">
                  <label class="lms-field-wide"
                    ><span>Headline</span
                    ><input class="tenant-lms-input" formControlName="headline"
                  /></label>
                  <label class="lms-field-wide"
                    ><span>Subheadline</span
                    ><textarea
                      class="tenant-lms-input"
                      formControlName="subheadline"
                      rows="4"
                    ></textarea>
                  </label>
                  <label class="lms-field-wide"
                    ><span>Announcement</span
                    ><input
                      class="tenant-lms-input"
                      formControlName="announcement"
                  /></label>
                </div>
              </fieldset>

              <fieldset class="lms-field-group">
                <legend>Call-to-action labels</legend>
                <p>Use short labels that describe what each button does.</p>
                <div class="lms-fields">
                  <label
                    ><span>Primary action</span
                    ><input
                      class="tenant-lms-input"
                      formControlName="primaryCtaLabel"
                  /></label>
                  <label
                    ><span>Secondary action</span
                    ><input
                      class="tenant-lms-input"
                      formControlName="secondaryCtaLabel"
                  /></label>
                </div>
              </fieldset>
            </section>
            }

            @if (saveMessage()) {
              <div class="lms-notice lms-notice-success" role="status">
                <mat-icon>check_circle</mat-icon
                ><span>{{ saveMessage() }}</span>
              </div>
            }
            @if (saveError()) {
              <div class="lms-notice lms-notice-error" role="alert">
                <mat-icon>error_outline</mat-icon><span>{{ saveError() }}</span>
              </div>
            }

            @if (isLearnerCreator()) {
              <footer class="lms-form-footer lms-learner-save-footer">
                <div class="lms-footer-actions">
                  <button
                    class="lms-button lms-button-primary"
                    type="button"
                    [disabled]="learnerSaving() || learnerAvatarUploading()"
                    (click)="saveLearner()"
                  >
                    {{ learnerSaving() ? "Saving..." : "Save" }}
                  </button>
                  <a class="lms-button lms-button-secondary" [routerLink]="['/tenant/lms-settings/content/learners']">Cancel</a>
                </div>
              </footer>
            } @else if (activePage() === "contentCourses" && isCourseEditor() && !isCourseContentNodePreview()) {
              <footer class="lms-form-footer">
                <div>
                  <strong>Ready to save?</strong>
                  <span>Save the course details, pricing, and learning content.</span>
                </div>
                <button
                  class="lms-button lms-button-primary"
                  type="button"
                  [disabled]="courseSaving() || courseForm.invalid"
                  (click)="saveManagedCourse()"
                >
                  <mat-icon>{{ courseSaving() ? "sync" : "save" }}</mat-icon>
                  {{ courseSaving() ? "Saving..." : "Save course" }}
                </button>
              </footer>
            } @else if (activePage() !== "contentCourses" && activePage() !== "contentUsers" && activePage() !== "publishing") {
              <footer class="lms-form-footer">
                <div>
                  <strong>Ready to publish?</strong>
                  <span>Your selected template and content will be applied together.</span>
                </div>
                <button
                  class="lms-button lms-button-primary"
                  type="submit"
                  [disabled]="saving() || !settings()?.lmsEnabled || form.invalid"
                >
                  <mat-icon>{{ saving() ? "sync" : "save" }}</mat-icon>
                  {{ saving() ? "Saving..." : "Save changes" }}
                </button>
              </footer>
            }
          </div>
        </form>
      }
      @if (enrollDrawerOpen()) {
        <div class="lms-drawer-backdrop" role="presentation" (click)="closeEnrollDrawer()">
          <aside class="lms-enroll-drawer" role="dialog" aria-modal="true" aria-labelledby="lms-enroll-title" tabindex="-1" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()">
            <div class="lms-drawer-head">
              <div>
                <p class="lms-section-parent">Course enrollment</p>
                <h3 id="lms-enroll-title">Enroll Learner</h3>
              </div>
              <button type="button" class="lms-icon-button" (click)="closeEnrollDrawer()" aria-label="Close enrollment drawer"><mat-icon>close</mat-icon></button>
            </div>
            <div class="lms-drawer-controls">
              <label class="lms-course-search"><mat-icon>search</mat-icon><span class="lms-visually-hidden">Search existing users</span><input type="search" placeholder="Search existing users" [value]="userDrawerSearch()" (input)="setUserDrawerSearch($event)" /></label>
              <label><span class="lms-visually-hidden">Filter drawer users by role</span><select class="tenant-lms-input" [value]="userDrawerRoleFilter()" (change)="setUserDrawerRoleFilter($event)"><option value="all">All roles</option>@for (role of drawerRoleOptions(); track role) { <option [value]="role">{{ role }}</option> }</select></label>
            </div>
            <label class="lms-check-all"><input type="checkbox" [checked]="allDrawerUsersEnrolled()" (change)="toggleAllDrawerUsers($event)" /><span>Check all users</span></label>
            <section class="lms-drawer-users" aria-label="Users">
              <h4>Users</h4>
              @if (filteredDrawerUsers().length) {
                @for (user of filteredDrawerUsers(); track user.id) {
                  <article class="lms-drawer-user" [class.is-selected]="isUserEnrolled(user.id)">
                    <div class="lms-user-cell"><span>{{ user.name.charAt(0) }}</span><div><strong>{{ user.name }}</strong><small>{{ user.email }} · {{ user.role }}</small></div></div>
                    <button type="button" class="lms-row-action" (click)="addUserToCourse(user)" [disabled]="isUserEnrolled(user.id)" [attr.aria-label]="'Add ' + user.name"><mat-icon>{{ isUserEnrolled(user.id) ? 'check' : 'person_add' }}</mat-icon></button>
                  </article>
                }
              } @else {
                <div class="lms-drawer-empty"><mat-icon>person_search</mat-icon><strong>No users found</strong><p>Try a different search or role filter.</p></div>
              }
            </section>
          </aside>
        </div>
      }
      @if (pendingDeleteCourse(); as course) {
        <div class="lms-confirm-backdrop" role="presentation" (click)="closeCourseDeleteDialog()">
          <section
            class="lms-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lms-delete-course-title"
            aria-describedby="lms-delete-course-description"
            tabindex="-1"
            (click)="$event.stopPropagation()"
            (keydown.enter)="$event.stopPropagation()"
          >
            <div class="lms-confirm-icon"><mat-icon>delete_outline</mat-icon></div>
            <div class="lms-confirm-copy">
              <h3 id="lms-delete-course-title">Delete course?</h3>
              <p id="lms-delete-course-description">
                This will permanently remove <strong>{{ course.title }}</strong> and its saved content from the tenant LMS.
              </p>
            </div>
            <div class="lms-confirm-actions">
              <button type="button" class="lms-button lms-button-secondary" (click)="closeCourseDeleteDialog()" [disabled]="courseSaving()">Cancel</button>
              <button type="button" class="lms-button lms-confirm-delete" (click)="confirmDeleteManagedCourseFromList()" [disabled]="courseSaving()">
                <mat-icon>{{ courseSaving() ? "sync" : "delete" }}</mat-icon>
                {{ courseSaving() ? "Deleting..." : "Delete course" }}
              </button>
            </div>
          </section>
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        color: rgb(15 23 42);
      }

      .lms-page {
        max-width: 86rem;
        margin: 0 auto;
        min-height: 100%;
      }

      :host-context(.lms-workspace-shell) .lms-page {
        width: 100%;
        max-width: none;
        margin: 0;
      }

      .lms-section-heading,
      .lms-domain-row,
      .lms-form-footer,
      .lms-notice {
        display: flex;
        align-items: center;
      }

      .lms-button {
        min-height: 2.625rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border-radius: 0.625rem;
        padding: 0.625rem 1rem;
        border: 0;
        font-size: 0.875rem;
        font-weight: 700;
        line-height: 1.25rem;
        cursor: pointer;
        transition:
          background-color 180ms ease,
          border-color 180ms ease,
          color 180ms ease;
      }

      .lms-button mat-icon {
        width: 1.125rem;
        height: 1.125rem;
        font-size: 1.125rem;
      }
      .lms-button-primary {
        background: rgb(79 70 229);
        color: white;
      }
      .lms-button-primary:hover:not(:disabled) {
        background: rgb(67 56 202);
      }
      .lms-split-button {
        position: relative;
        display: inline-flex;
        align-items: stretch;
        border-radius: 0.625rem;
        background: rgb(79 70 229);
        color: white;
      }
      .lms-split-button-main,
      .lms-split-button-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 800;
        line-height: 1.25rem;
        text-decoration: none;
        cursor: pointer;
        transition: background-color 180ms ease;
      }
      .lms-split-button-main {
        min-height: 2.5rem;
        padding: 0.625rem 1.15rem;
        border-radius: 0.625rem 0 0 0.625rem;
      }
      .lms-split-button-toggle {
        width: 2.5rem;
        border-left: 1px solid rgb(255 255 255 / .28);
        border-radius: 0 0.625rem 0.625rem 0;
      }
      .lms-split-button-toggle mat-icon {
        width: 1.15rem;
        height: 1.15rem;
        font-size: 1.15rem;
      }
      .lms-split-button:hover {
        background: rgb(67 56 202);
      }
      .lms-split-button-main:focus-visible,
      .lms-split-button-toggle:focus-visible {
        outline: 3px solid rgb(99 102 241 / .3);
        outline-offset: -3px;
      }
      .lms-split-menu {
        position: absolute;
        top: calc(100% + .5rem);
        right: 0;
        z-index: 40;
        display: grid;
        min-width: 15rem;
        overflow: hidden;
        border: 1px solid rgb(226 232 240);
        border-radius: .75rem;
        background: white;
        box-shadow: 0 12px 24px rgb(15 23 42 / .12);
        color: rgb(15 23 42);
      }
      .lms-split-menu a,
      .lms-split-menu button {
        display: flex;
        align-items: center;
        gap: .65rem;
        width: 100%;
        border: 0;
        padding: .75rem .85rem;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        text-decoration: none;
        cursor: pointer;
      }
      .lms-split-menu a + a,
      .lms-split-menu a + button,
      .lms-split-menu button + a,
      .lms-split-menu button + button {
        border-top: 1px solid rgb(241 245 249);
      }
      .lms-split-menu a:hover,
      .lms-split-menu button:hover {
        background: rgb(248 250 252);
      }
      .lms-split-menu a:focus-visible,
      .lms-split-menu button:focus-visible {
        outline: 3px solid rgb(99 102 241 / .25);
        outline-offset: -3px;
      }
      .lms-split-menu mat-icon {
        width: 1.1rem;
        height: 1.1rem;
        color: rgb(79 70 229);
        font-size: 1.1rem;
      }
      .lms-split-menu span {
        display: grid;
        gap: .1rem;
      }
      .lms-split-menu strong {
        font-size: .76rem;
      }
      .lms-split-menu small {
        color: rgb(100 116 139);
        font-size: .66rem;
      }
      .lms-button-secondary {
        border: 1px solid rgb(203 213 225);
        background: white;
        color: rgb(51 65 85);
      }
      .lms-button-secondary:hover:not(:disabled) {
        border-color: rgb(165 180 252);
        background: rgb(238 242 255);
        color: rgb(67 56 202);
      }
      .lms-button:focus-visible,
      .lms-section-nav a:focus-visible,
      .lms-nav-trigger:focus-visible,
      .lms-publishing-page-card:focus-visible,
      .lms-template:focus-visible {
        outline: 3px solid rgb(129 140 248 / 0.38);
        outline-offset: 2px;
      }
      .lms-button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .lms-workspace {
        display: grid;
        grid-template-columns: 13rem minmax(0, 1fr);
        min-height: 100%;
        gap: 0;
        align-items: start;
      }

      .lms-workspace.is-content-authoring {
        grid-template-columns: minmax(0, 1fr);
      }

      .lms-workspace.is-content-authoring .lms-section-nav {
        display: none;
      }

      .lms-workspace.is-content-authoring .lms-settings-content {
        padding-inline-start: 0;
      }

      .lms-section-nav {
        position: sticky;
        top: 0;
        display: grid;
        align-content: start;
        gap: 0.25rem;
        min-height: calc(100dvh - 8rem);
        max-height: calc(100dvh - 8rem);
        padding: 1.5rem 1.25rem 1.5rem 0;
        border-right: 1px solid rgb(226 232 240);
        overflow-y: auto;
        overscroll-behavior: contain;
      }

      .lms-nav-group {
        display: grid;
        gap: 0.25rem;
      }

      .lms-section-nav a {
        border: 0;
      }
      .lms-section-nav a,
      .lms-nav-trigger {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 0.625rem;
        color: rgb(71 85 105);
        text-decoration: none;
        transition:
          background-color 180ms ease,
          color 180ms ease;
      }

      .lms-nav-trigger {
        width: 100%;
        border: 0;
        background: transparent;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }

      .lms-section-nav a.is-current,
      .lms-nav-trigger.is-current {
        background: rgb(238 242 255);
        color: rgb(67 56 202);
      }
      .lms-nav-chevron {
        margin-left: auto;
      }
      .lms-subpage-nav {
        display: grid;
        gap: 0.125rem;
        padding: 0.25rem 0 0.5rem 2.65rem;
      }
      .lms-subpage-nav a {
        min-height: 1.75rem;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.3rem 0.45rem;
        border-radius: 0.375rem;
        color: rgb(71 85 105);
        font-size: 0.6875rem;
      }
      .lms-subpage-nav a.is-current {
        background: rgb(238 242 255);
        color: rgb(67 56 202);
        font-weight: 700;
      }
      .lms-nav-state {
        flex: 0 0 auto;
        color: rgb(148 163 184);
        font-size: 0.625rem;
        font-weight: 700;
      }
      .lms-nav-state.is-active { color: rgb(22 163 74); }
      .lms-section-nav a:hover,
      .lms-nav-trigger:hover {
        background: rgb(241 245 249);
        color: rgb(30 41 59);
      }
      .lms-section-nav mat-icon,
      .lms-nav-trigger mat-icon {
        flex: 0 0 auto;
        width: 1.25rem;
        height: 1.25rem;
        font-size: 1.25rem;
      }
      .lms-section-nav span,
      .lms-nav-trigger span {
        display: grid;
        gap: 0.1rem;
      }
      .lms-section-nav strong,
      .lms-nav-trigger strong {
        font-size: 0.8125rem;
        line-height: 1.125rem;
      }
      .lms-section-nav small,
      .lms-nav-trigger small {
        color: rgb(100 116 139);
        font-size: 0.6875rem;
        line-height: 1rem;
      }

      .lms-settings-content {
        min-width: 0;
        display: grid;
        gap: 1.5rem;
        padding: 1.5rem 0 3rem 2rem;
      }

      .lms-section {
        scroll-margin-top: 1.5rem;
        border: 1px solid rgb(226 232 240);
        border-radius: 0.875rem;
        background: white;
      }
      .lms-section-heading {
        justify-content: space-between;
        gap: 1.5rem;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid rgb(226 232 240);
      }
      .lms-section h2 {
        margin: 0;
        font-size: 1.0625rem;
        line-height: 1.5rem;
        font-weight: 750;
      }
      .lms-section-heading p {
        margin: 0.25rem 0 0;
        color: rgb(71 85 105);
        font-size: 0.8125rem;
      }

      .lms-status {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        border-radius: 999px;
        padding: 0.3rem 0.65rem;
        background: rgb(241 245 249);
        color: rgb(71 85 105);
        font-size: 0.75rem;
        font-weight: 700;
      }

      .lms-status span {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        background: rgb(148 163 184);
      }
      .lms-status-live {
        background: rgb(220 252 231);
        color: rgb(21 128 61);
      }
      .lms-status-live span {
        background: rgb(34 197 94);
      }

      .lms-domain-row {
        justify-content: space-between;
        gap: 2rem;
        padding: 1.5rem;
      }
      .lms-domain-copy {
        min-width: 0;
        display: grid;
        gap: 0.3rem;
      }
      .lms-domain-copy > span {
        color: rgb(71 85 105);
        font-size: 0.75rem;
        font-weight: 700;
      }
      .lms-domain-copy a {
        overflow-wrap: anywhere;
        color: rgb(67 56 202);
        font-size: 0.9375rem;
        font-weight: 700;
        text-decoration: none;
      }
      .lms-domain-copy a:hover {
        text-decoration: underline;
      }
      .lms-domain-copy small {
        color: rgb(100 116 139);
        font-size: 0.75rem;
      }

      .lms-section-control,
      .lms-section-title,
      .lms-section-help {
        display: flex;
        align-items: center;
      }
      .lms-section-control strong {
        font-size: 0.8125rem;
      }
      .lms-section-control p,
      .lms-section-help p {
        margin: 0.2rem 0 0;
        color: rgb(71 85 105);
        font-size: 0.75rem;
      }
      .lms-publishing-pages-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.25rem 1.5rem 0.875rem;
        border-top: 1px solid rgb(226 232 240);
      }
      .lms-publishing-pages-heading h3 {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.25rem;
      }
      .lms-publishing-pages-heading p {
        margin: 0.2rem 0 0;
        color: rgb(71 85 105);
        font-size: 0.75rem;
      }
      .lms-publishing-pages-heading > span {
        flex: 0 0 auto;
        color: rgb(71 85 105);
        font-size: 0.75rem;
        font-weight: 700;
      }
      .lms-publishing-page-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
        gap: 0.75rem;
        padding: 0 1.5rem 1.5rem;
      }
      .lms-publishing-page-card {
        min-width: 0;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 0.75rem;
        min-height: 5rem;
        padding: 0.875rem;
        border: 1px solid rgb(226 232 240);
        border-radius: 0.75rem;
        background: rgb(248 250 252);
        color: rgb(30 41 59);
        text-decoration: none;
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .lms-publishing-page-card:hover {
        border-color: rgb(165 180 252);
        background: rgb(238 242 255);
        transform: translateY(-1px);
      }
      .lms-publishing-page-icon {
        display: grid;
        place-items: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.625rem;
        background: white;
        color: rgb(79 70 229);
      }
      .lms-publishing-page-icon mat-icon,
      .lms-publishing-page-arrow {
        width: 1.125rem;
        height: 1.125rem;
        font-size: 1.125rem;
      }
      .lms-publishing-page-copy {
        min-width: 0;
        display: grid;
        gap: 0.15rem;
      }
      .lms-publishing-page-copy strong {
        overflow: hidden;
        font-size: 0.8125rem;
        line-height: 1.125rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .lms-publishing-page-copy small {
        overflow: hidden;
        color: rgb(71 85 105);
        font-size: 0.6875rem;
        line-height: 1rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .lms-publishing-page-state {
        border-radius: 999px;
        padding: 0.2rem 0.45rem;
        background: rgb(226 232 240);
        color: rgb(71 85 105);
        font-size: 0.625rem;
        font-weight: 700;
      }
      .lms-publishing-page-state.is-active {
        background: rgb(220 252 231);
        color: rgb(21 128 61);
      }
      .lms-publishing-page-arrow {
        color: rgb(100 116 139);
      }
      .lms-section-title {
        min-width: 0;
        gap: 0.875rem;
      }
      .lms-section-title .lms-section-row-icon {
        flex: 0 0 auto;
      }
      .lms-section-parent {
        margin: 0 0 0.2rem !important;
        color: rgb(67 56 202) !important;
        font-size: 0.6875rem !important;
        font-weight: 700;
      }
      .lms-section-control {
        justify-content: space-between;
        gap: 2rem;
        padding: 1.5rem;
      }
      .lms-section-help {
        gap: 0.5rem;
        margin: 0 1.5rem 1.5rem;
        padding: 0.75rem 0.875rem;
        border-radius: 0.625rem;
        background: rgb(248 250 252);
        color: rgb(71 85 105);
      }
      .lms-section-help mat-icon {
        flex: 0 0 auto;
        width: 1.125rem;
        height: 1.125rem;
        font-size: 1.125rem;
      }
      .lms-section-help p {
        margin: 0;
      }

      .lms-section-manager {
        border-top: 1px solid rgb(226 232 240);
        padding: 1.5rem;
      }
      .lms-manager-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .lms-manager-heading h3 { margin: 0; font-size: 0.9375rem; }
      .lms-manager-heading p { margin: 0.25rem 0 0; color: rgb(71 85 105); font-size: 0.75rem; }
      .lms-manager-heading > span {
        flex: 0 0 auto;
        border-radius: 999px;
        padding: 0.3rem 0.65rem;
        background: rgb(238 242 255);
        color: rgb(67 56 202);
        font-size: 0.6875rem;
        font-weight: 750;
      }
      .lms-section-list { border-top: 1px solid rgb(226 232 240); }
      .lms-section-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-height: 4.25rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgb(226 232 240);
        scroll-margin-top: 1.5rem;
      }
      .lms-section-row-icon {
        display: grid;
        place-items: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 0.625rem;
        background: rgb(241 245 249);
        color: rgb(71 85 105);
      }
      .lms-section-row-icon mat-icon { width: 1.125rem; height: 1.125rem; font-size: 1.125rem; }
      .lms-section-row-copy { min-width: 0; display: grid; gap: 0.15rem; }
      .lms-section-row-copy strong { font-size: 0.8125rem; }
      .lms-section-row-copy small { color: rgb(71 85 105); font-size: 0.6875rem; }
      .lms-switch {
        flex: 0 0 auto;
        width: 2.625rem;
        height: 1.5rem;
        margin-left: auto;
        padding: 0.1875rem;
        border: 0;
        border-radius: 999px;
        background: rgb(203 213 225);
        cursor: pointer;
        transition: background-color 180ms ease;
      }
      .lms-switch span {
        display: block;
        width: 1.125rem;
        height: 1.125rem;
        border-radius: 50%;
        background: white;
        transition: transform 180ms ease;
      }
      .lms-switch.is-active { background: rgb(79 70 229); }
      .lms-switch.is-active span { transform: translateX(1.125rem); }
      .lms-switch:focus-visible { outline: 3px solid rgb(129 140 248 / 0.38); outline-offset: 2px; }
      .lms-switch:disabled { cursor: not-allowed; opacity: 0.5; }

      .lms-selection-summary {
        flex-shrink: 0;
        color: rgb(71 85 105);
        font-size: 0.75rem;
      }
      .lms-selection-summary strong {
        color: rgb(30 41 59);
      }
      .lms-template-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
        padding: 1.5rem;
      }
      .lms-template {
        min-width: 0;
        padding: 0;
        border: 1px solid rgb(203 213 225);
        border-radius: 0.75rem;
        overflow: hidden;
        background: white;
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition:
          border-color 180ms ease,
          box-shadow 180ms ease,
          transform 180ms ease;
      }
      .lms-template:hover {
        border-color: rgb(129 140 248);
        transform: translateY(-1px);
      }
      .lms-template-selected {
        border: 2px solid rgb(79 70 229);
      }
      .lms-template-preview {
        position: relative;
        display: block;
        aspect-ratio: 16 / 10;
        overflow: hidden;
        background: rgb(15 23 42);
      }
      .lms-template-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .lms-template-placeholder {
        height: 100%;
        display: grid;
        place-content: center;
        justify-items: center;
        gap: 0.45rem;
        color: rgb(199 210 254);
        background: linear-gradient(145deg, rgb(30 41 59), rgb(49 46 129));
      }
      .lms-template-placeholder mat-icon {
        font-size: 1.75rem;
        width: 1.75rem;
        height: 1.75rem;
      }
      .lms-template-placeholder small {
        font-weight: 700;
      }
      .lms-template-check {
        position: absolute;
        top: 0.625rem;
        right: 0.625rem;
        display: grid;
        place-items: center;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: rgb(79 70 229);
        color: white;
      }
      .lms-template-check mat-icon {
        width: 1rem;
        height: 1rem;
        font-size: 1rem;
      }
      .lms-template-copy {
        display: grid;
        gap: 0.2rem;
        padding: 0.875rem;
      }
      .lms-template-copy strong {
        font-size: 0.8125rem;
      }
      .lms-template-copy small {
        color: rgb(71 85 105);
        font-size: 0.6875rem;
        line-height: 1.05rem;
      }

      .lms-field-group {
        margin: 0;
        padding: 1.5rem;
        border: 0;
      }
      .lms-field-group + .lms-field-group {
        border-top: 1px solid rgb(226 232 240);
      }
      .lms-field-group legend {
        padding: 0;
        font-size: 0.9375rem;
        font-weight: 750;
      }
      .lms-field-group > p {
        margin: 0.25rem 0 1rem;
        color: rgb(71 85 105);
        font-size: 0.75rem;
      }
      .lms-fieldset-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .lms-fieldset-head p {
        margin: 0.25rem 0 0;
        color: rgb(71 85 105);
        font-size: 0.75rem;
        line-height: 1.45;
      }
      .lms-required-pill {
        display: inline-flex;
        align-items: center;
        min-height: 1.75rem;
        flex: 0 0 auto;
        border-radius: 999px;
        background: rgb(238 242 255);
        color: rgb(67 56 202);
        padding: 0.3rem 0.65rem;
        font-size: 0.6875rem;
        font-weight: 800;
      }
      .lms-fields {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
      .lms-fields-three {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .lms-fields label {
        min-width: 0;
        display: grid;
        gap: 0.4rem;
        color: rgb(51 65 85);
        font-size: 0.75rem;
        font-weight: 700;
      }
      .lms-field-wide {
        grid-column: 1 / -1;
      }

      .tenant-lms-input {
        width: 100%;
        border-radius: 0.625rem;
        border: 1px solid rgb(203 213 225);
        background: white;
        padding: 0.7rem 0.75rem;
        color: rgb(15 23 42);
        font: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        outline: none;
        transition:
          border-color 0.16s ease,
          box-shadow 0.16s ease;
        resize: vertical;
      }

      .tenant-lms-input:focus {
        border-color: rgb(99 102 241);
        box-shadow: 0 0 0 3px rgb(99 102 241 / 0.16);
      }

      .lms-navbar-list,
      .lms-button-editor,
      .lms-grade-editor,
      .lms-course-editor {
        display: grid;
        gap: 1rem;
      }
      .lms-manager-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
      .lms-manager-heading p { margin-bottom: 0; }
      .lms-button-secondary { border: 1px solid rgb(203 213 225); background: white; color: rgb(67 56 202); }
      .lms-course-item { gap: 1.25rem; }
      .lms-homepage-course-toolbar { padding-top: 1rem; }
      .lms-course-card-accordion { gap: .75rem; padding-top: 1rem; }
      .lms-homepage-course-card { gap: 0; padding: 0; overflow: hidden; background: white; }
      .lms-homepage-course-card.is-expanded { border-color: rgb(165 180 252); background: rgb(248 250 252); }
      .lms-homepage-course-card-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: stretch; gap: .65rem; }
      .lms-homepage-course-card-toggle { min-width: 0; display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: .75rem; min-height: 4.25rem; padding: .8rem 1rem; color: rgb(15 23 42); text-align: left; }
      .lms-homepage-course-card-toggle:focus-visible { outline: 3px solid rgb(99 102 241 / .24); outline-offset: -3px; }
      .lms-homepage-course-card-toggle > mat-icon { width: 1.2rem; height: 1.2rem; color: rgb(100 116 139); font-size: 1.2rem; line-height: 1.2rem; }
      .lms-homepage-course-card-title { min-width: 0; display: grid; gap: .2rem; }
      .lms-homepage-course-card-title strong { min-width: 0; overflow: hidden; font-size: .82rem; font-weight: 850; text-overflow: ellipsis; white-space: nowrap; }
      .lms-homepage-course-card-title small { min-width: 0; overflow: hidden; color: rgb(71 85 105); font-size: .68rem; text-overflow: ellipsis; white-space: nowrap; }
      .lms-homepage-course-card-facts { display: inline-flex; align-items: center; gap: .4rem; color: rgb(51 65 85); font-size: .7rem; font-weight: 800; }
      .lms-homepage-course-card-facts span { max-width: 8rem; overflow: hidden; border-radius: 999px; background: rgb(241 245 249); padding: .3rem .55rem; text-overflow: ellipsis; white-space: nowrap; }
      .lms-homepage-course-card-head .lms-remove-button { align-self: center; margin-right: .75rem; margin-left: 0; }
      .lms-homepage-course-card-panel { display: grid; gap: 1.1rem; border-top: 1px solid rgb(226 232 240); padding: 1rem; background: white; }
      .lms-homepage-course-pagination { margin-top: 1rem; border: 1px solid rgb(226 232 240); border-radius: .75rem; }
      .lms-course-selector { display: grid; gap: .45rem; }
      .lms-course-selector > span { color: rgb(15 23 42); font-size: .75rem; font-weight: 750; }
      .lms-course-selector small { color: rgb(71 85 105); font-size: .72rem; line-height: 1.5; }
      .lms-inline-notice { display: flex; align-items: center; gap: .5rem; padding: .75rem; border-radius: .625rem; background: rgb(238 242 255); color: rgb(49 46 129); font-size: .75rem; }
      .lms-inline-notice mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-inline-notice a { margin-left: auto; color: rgb(67 56 202); font-weight: 750; }
      .lms-remove-button { margin-left: auto; display: inline-flex; align-items: center; gap: .35rem; border: 0; background: transparent; color: rgb(185 28 28); font: inherit; font-size: .75rem; font-weight: 750; cursor: pointer; }
      .lms-remove-button mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-course-media { display: grid; grid-template-columns: minmax(0, 1fr) 16rem; gap: 1.25rem; align-items: start; }
      .lms-course-preview { display: grid; place-items: center; aspect-ratio: 16 / 10; overflow: hidden; border-radius: .75rem; background: rgb(15 23 42); }
      .lms-course-preview img { width: 100%; height: 100%; object-fit: cover; }
      .lms-course-symbol { color: rgb(232 200 116); font-family: Georgia, serif; font-size: 2.75rem; font-style: italic; }
      .lms-course-placeholder { color: rgb(148 163 184); }
      .lms-empty-editor { min-height: 12rem; display: grid; place-content: center; justify-items: center; gap: .35rem; border: 1px dashed rgb(148 163 184); border-radius: .75rem; color: rgb(71 85 105); }
      .lms-empty-editor mat-icon { color: rgb(79 70 229); }
      .lms-nav-count { min-width: 1.35rem; padding: .12rem .38rem; border-radius: 999px; background: rgb(238 242 255); color: rgb(67 56 202); font-size: .65rem; font-weight: 800; text-align: center; }
      .lms-authoring-layout { display: grid; grid-template-columns: 15rem minmax(0, 1fr); align-items: start; min-height: 42rem; }
      .lms-course-list { position: sticky; top: 1rem; display: grid; gap: .35rem; max-height: calc(100vh - 11rem); overflow-y: auto; padding: 1rem; border-right: 1px solid rgb(226 232 240); }
      .lms-course-list-head { display: flex; align-items: center; justify-content: space-between; padding: .25rem .35rem .7rem; color: rgb(15 23 42); font-size: .8rem; }
      .lms-course-list-head span { color: rgb(100 116 139); }
      .lms-course-list-item { width: 100%; display: flex; align-items: center; gap: .65rem; border: 0; border-radius: .625rem; background: transparent; padding: .7rem; color: rgb(51 65 85); text-align: left; cursor: pointer; }
      .lms-course-list-item:hover { background: rgb(248 250 252); }
      .lms-course-list-item.is-current { background: rgb(238 242 255); color: rgb(67 56 202); }
      .lms-course-list-item > span:nth-child(2) { min-width: 0; display: grid; gap: .12rem; }
      .lms-course-list-item strong, .lms-course-list-item small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-list-item strong { font-size: .76rem; }.lms-course-list-item small { color: rgb(100 116 139); font-size: .65rem; }
      .lms-course-list-icon { display: grid; place-items: center; flex: 0 0 2rem; width: 2rem; height: 2rem; border-radius: .5rem; background: white; }
      .lms-course-list-icon mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; }
      .lms-course-list-empty { display: grid; justify-items: center; gap: .3rem; padding: 2rem .5rem; color: rgb(100 116 139); text-align: center; font-size: .7rem; }
      .lms-course-list-empty strong { color: rgb(51 65 85); font-size: .78rem; }
      .lms-course-form { display: grid; gap: 1rem; min-width: 0; padding: 1.25rem; }
      .lms-course-accordion-card { overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: .9rem; background: rgb(255 255 255); }
      .lms-course-card-details { order: 1; }
      .lms-course-card-content { order: 2; }
      .lms-course-card-sales { order: 3; }
      .lms-course-accordion-card.is-collapsed { background: rgb(248 250 252); }
      .lms-course-accordion-head { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 1rem; border: 0; border-bottom: 1px solid rgb(226 232 240); background: rgb(255 255 255); padding: 1rem 1.25rem; color: rgb(15 23 42); text-align: start; cursor: pointer; transition: background-color .16s ease, color .16s ease; }
      .lms-course-accordion-card.is-collapsed .lms-course-accordion-head { border-bottom-color: transparent; background: rgb(248 250 252); }
      .lms-course-accordion-head:hover,
      .lms-course-accordion-head:focus-visible { background: rgb(248 250 252); outline: none; }
      .lms-course-accordion-title { display: inline-flex; min-width: 0; align-items: center; gap: .75rem; }
      .lms-course-accordion-title > mat-icon { width: 1.2rem; height: 1.2rem; flex: 0 0 auto; color: rgb(79 70 229); font-size: 1.2rem; line-height: 1.2rem; }
      .lms-course-accordion-title > span { display: grid; min-width: 0; gap: .18rem; }
      .lms-course-accordion-title strong { overflow: hidden; font-size: .95rem; font-weight: 850; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-accordion-title small { overflow: hidden; color: rgb(71 85 105); font-size: .75rem; font-weight: 600; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-accordion-card .lms-field-group { padding: 1.25rem; }
      .lms-course-accordion-card .lms-two-column-editor { border-top: 1px solid rgb(226 232 240); padding: 1.25rem; }
      .lms-course-accordion-card .lms-two-column-editor .lms-field-group { border: 1px solid rgb(226 232 240); border-radius: .75rem; background: rgb(248 250 252); }
      .lms-inline-alert { display: flex; align-items: center; gap: .55rem; margin-bottom: 1rem; border-radius: .65rem; padding: .75rem .9rem; font-size: .78rem; font-weight: 700; }
      .lms-inline-alert.is-error { background: rgb(254 242 242); color: rgb(185 28 28); }.lms-inline-alert.is-success { background: rgb(236 253 245); color: rgb(4 120 87); }
      .lms-inline-alert mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; }
      .lms-input-prefix { display: flex; align-items: center; border: 1px solid rgb(203 213 225); border-radius: .625rem; overflow: hidden; background: rgb(248 250 252); }
      .lms-input-prefix span { padding-inline: .7rem 0; color: rgb(100 116 139); font-size: .78rem; }.lms-input-prefix .tenant-lms-input { border: 0; box-shadow: none; }
      .lms-field-hint, .lms-upload-inline small { color: rgb(100 116 139); font-size: .65rem; font-weight: 500; }
      .lms-upload-inline input[type=file] { width: 100%; border: 1px dashed rgb(148 163 184); border-radius: .625rem; padding: .58rem; background: rgb(248 250 252); font-size: .7rem; }
      .lms-course-details-layout { display: grid; grid-template-columns: minmax(0, 1fr) 18rem; gap: 1.25rem; align-items: start; }
      .lms-course-details-fields { align-content: start; }
      .lms-course-title-input { min-height: 3rem; font-size: .95rem; font-weight: 750; }
      .lms-course-thumbnail-panel { display: grid; grid-template-rows: auto minmax(9rem, 1fr) auto auto; gap: .75rem; align-self: stretch; margin-top: 1.38rem; border: 1px solid rgb(226 232 240); border-radius: .75rem; background: rgb(248 250 252); padding: .85rem; }
      .lms-course-thumbnail-head { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
      .lms-course-thumbnail-head span, .lms-course-thumbnail-url span { color: rgb(30 41 59); font-size: .75rem; font-weight: 800; }
      .lms-course-thumbnail-head small, .lms-course-upload-control small { color: rgb(71 85 105); font-size: .65rem; font-weight: 650; }
      .lms-course-thumbnail-preview { display: grid; place-items: center; aspect-ratio: 16 / 10; overflow: hidden; border: 1px solid rgb(203 213 225); border-radius: .65rem; background: rgb(241 245 249); color: rgb(71 85 105); }
      .lms-course-thumbnail-preview img { width: 100%; height: 100%; object-fit: cover; }
      .lms-course-thumbnail-preview > span { display: grid; justify-items: center; gap: .35rem; font-size: .7rem; font-weight: 700; text-align: center; }
      .lms-course-thumbnail-preview mat-icon { width: 1.4rem; height: 1.4rem; color: rgb(100 116 139); font-size: 1.4rem; }
      .lms-course-thumbnail-url { display: grid; gap: .4rem; }
      .lms-course-upload-control { display: grid; grid-template-columns: 1.15rem minmax(0, 1fr); align-items: center; gap: .15rem .45rem; border: 1px dashed rgb(148 163 184); border-radius: .65rem; background: white; padding: .7rem .75rem; color: rgb(67 56 202); cursor: pointer; transition: border-color .16s ease, background-color .16s ease, color .16s ease; }
      .lms-course-upload-control:hover, .lms-course-upload-control:focus-within { border-color: rgb(99 102 241); background: rgb(238 242 255); }
      .lms-course-upload-control input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .lms-course-upload-control mat-icon { width: 1.15rem; height: 1.15rem; font-size: 1.15rem; }
      .lms-course-upload-control span { min-width: 0; overflow: hidden; font-size: .75rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-upload-control small { grid-column: 2; }
      .lms-course-upload-control.is-uploading mat-icon { animation: lmsSpin 1s linear infinite; }
      @keyframes lmsSpin { to { transform: rotate(360deg); } }
      .lms-publish-control { display: flex; align-items: flex-start; gap: .7rem; margin-top: 1rem; border-radius: .7rem; background: rgb(248 250 252); padding: .9rem; color: rgb(30 41 59); cursor: pointer; }
      .lms-publish-control input { margin-top: .15rem; accent-color: rgb(79 70 229); }.lms-publish-control span { display: grid; gap: .1rem; }.lms-publish-control strong { font-size: .78rem; }.lms-publish-control small { color: rgb(71 85 105); font-size: .68rem; }
      .lms-preview-sales-layout { display: grid; grid-template-columns: minmax(18rem, .9fr) minmax(0, 1.1fr); gap: 1.25rem; align-items: start; }
      .lms-preview-media-panel, .lms-sales-panel { display: grid; gap: .85rem; min-width: 0; border: 1px solid rgb(226 232 240); border-radius: .75rem; background: rgb(248 250 252); padding: .85rem; }
      .lms-preview-media-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
      .lms-preview-media-head > div { display: grid; gap: .15rem; }
      .lms-preview-media-head span { color: rgb(30 41 59); font-size: .78rem; font-weight: 800; }
      .lms-preview-media-head small { color: rgb(71 85 105); font-size: .65rem; font-weight: 650; }
      .lms-preview-media-head mat-icon { width: 1.35rem; height: 1.35rem; color: rgb(79 70 229); font-size: 1.35rem; }
      .lms-preview-media-frame { display: grid; place-items: center; aspect-ratio: 16 / 9; overflow: hidden; border: 1px solid rgb(203 213 225); border-radius: .7rem; background: rgb(241 245 249); color: rgb(71 85 105); }
      .lms-preview-media-frame.has-preview { background: rgb(15 23 42); }
      .lms-preview-media-frame img,
      .lms-preview-media-frame video { width: 100%; height: 100%; object-fit: cover; }
      .lms-preview-audio-player { display: grid; width: min(100%, 28rem); justify-items: center; gap: 1rem; padding: 1rem; color: rgb(226 232 240); }
      .lms-preview-audio-player mat-icon { width: 2rem; height: 2rem; color: rgb(167 139 250); font-size: 2rem; line-height: 2rem; }
      .lms-preview-audio-player audio { width: 100%; }
      .lms-preview-media-frame > span { display: grid; justify-items: center; gap: .4rem; font-size: .72rem; font-weight: 750; text-align: center; }
      .lms-preview-media-frame mat-icon { width: 1.6rem; height: 1.6rem; color: rgb(100 116 139); font-size: 1.6rem; }
      .lms-preview-media-fields { display: grid; grid-template-columns: 8rem minmax(0, 1fr); gap: .75rem; }
      .lms-preview-media-fields label, .lms-sales-grid label { min-width: 0; display: grid; gap: .4rem; color: rgb(51 65 85); font-size: .75rem; font-weight: 700; }
      .lms-sales-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .85rem; }
      .lms-price-input { min-height: 3rem; font-size: .95rem; font-weight: 800; }
      .lms-publish-control-polished { align-items: center; justify-content: space-between; margin-top: .15rem; border: 1px solid rgb(203 213 225); background: white; transition: border-color .16s ease, background-color .16s ease; }
      .lms-publish-control-polished:hover, .lms-publish-control-polished:focus-within { border-color: rgb(99 102 241); background: rgb(238 242 255); }
      .lms-publish-control-polished mat-icon { width: 1.15rem; height: 1.15rem; flex: 0 0 auto; color: rgb(79 70 229); font-size: 1.15rem; }
      .lms-two-column-editor { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
      .lms-icon-button { display: grid; place-items: center; flex: 0 0 2rem; width: 2rem; height: 2rem; border: 1px solid rgb(203 213 225); border-radius: .5rem; background: white; color: rgb(67 56 202); cursor: pointer; }
      .lms-icon-button mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }.lms-icon-button.is-danger { color: rgb(185 28 28); }
      .lms-simple-list { display: grid; gap: .5rem; margin-top: .85rem; }.lms-simple-list > div { display: flex; gap: .4rem; }.lms-simple-list button { border: 0; background: transparent; color: rgb(185 28 28); cursor: pointer; }.lms-simple-list mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-course-content-tree { margin-top: 1rem; border: 1px solid rgb(203 213 225); border-radius: .75rem .75rem 0 0; background: white; padding: .55rem; }
      .lms-course-tree-root { min-width: 0; }
      .lms-curriculum-builder { display: grid; gap: .5rem; border: 1px solid rgb(203 213 225); border-top: 0; border-radius: 0 0 .75rem .75rem; background: white; padding: .55rem; }
      .lms-curriculum-section { display: grid; gap: .55rem; min-width: 0; }
      .lms-course-tree-row { display: flex; min-height: 2.5rem; align-items: center; gap: .5rem; border-radius: .5rem; padding: .35rem .5rem; color: rgb(15 23 42); transition: background-color .15s ease; }
      .lms-course-tree-row:hover, .lms-course-tree-row:focus-within { background: rgb(248 250 252); }
      .lms-course-tree-row-root { background: rgb(238 242 255); }
      .lms-course-tree-row-root:hover, .lms-course-tree-row-root:focus-within { background: rgb(238 242 255); }
      .lms-course-tree-toggle { display: grid; place-items: center; flex: 0 0 1.75rem; width: 1.75rem; height: 1.75rem; border-radius: 999px; color: rgb(100 116 139); }
      .lms-course-tree-toggle mat-icon { width: 1.125rem; height: 1.125rem; font-size: 1.125rem; line-height: 1.125rem; }
      .lms-course-tree-icon { width: 1.25rem; height: 1.25rem; flex: 0 0 auto; color: rgb(79 70 229); font-size: 1.25rem; line-height: 1.25rem; }
      .lms-course-tree-icon-leaf { color: rgb(100 116 139); }
      .lms-course-tree-label { min-width: 0; flex: 1 1 auto; overflow: hidden; color: rgb(15 23 42); font-size: .875rem; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-tree-label small { margin-inline-start: .45rem; color: rgb(71 85 105); font-size: .68rem; font-weight: 700; }
      .lms-course-tree-input { flex: 1 1 auto; min-width: 8rem; border-color: transparent; background: transparent; box-shadow: none; font-weight: 700; }
      .lms-course-tree-input:hover, .lms-course-tree-input:focus { border-color: rgb(203 213 225); background: white; }
      .lms-course-tree-meta { flex: 0 0 auto; border-radius: 999px; background: rgb(241 245 249); color: rgb(71 85 105); padding: .22rem .5rem; font-size: .65rem; font-weight: 800; white-space: nowrap; }
      .lms-course-tree-description { margin-inline-start: 4rem; width: calc(100% - 4rem); }
      .lms-course-tree-description-lesson { margin-inline-start: 5.4rem; width: calc(100% - 5.4rem); }
      .lms-course-tree-actions { display: inline-flex; flex: 0 0 auto; align-items: center; gap: .125rem; opacity: 0; transition: opacity .15s ease; }
      .lms-course-tree-row:hover .lms-course-tree-actions, .lms-course-tree-row:focus-within .lms-course-tree-actions, .lms-course-tree-row-root .lms-course-tree-actions { opacity: 1; }
      .lms-course-tree-action { display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border-radius: 999px; color: rgb(79 70 229); transition: background-color .15s ease, color .15s ease; }
      .lms-course-tree-action:hover, .lms-course-tree-action:focus-visible { background: rgb(238 242 255); outline: none; }
      .lms-course-tree-action.is-danger { color: rgb(185 28 28); }
      .lms-course-tree-action.is-danger:hover, .lms-course-tree-action.is-danger:focus-visible { background: rgb(254 226 226); }
      .lms-course-tree-action mat-icon { width: 1rem; height: 1rem; font-size: 1rem; line-height: 1rem; }
      .lms-course-tree-add-button { display: inline-flex; align-items: center; gap: .35rem; min-height: 1.9rem; border-radius: 999px; background: rgb(67 56 202); color: white; padding: .35rem .7rem; font-size: .72rem; font-weight: 800; transition: background-color .16s ease; }
      .lms-course-tree-add-button:hover, .lms-course-tree-add-button:focus-visible { background: rgb(79 70 229); outline: none; }
      .lms-course-tree-add-button mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-lesson-list { display: grid; gap: .55rem; margin-inline-start: 2rem; }.lms-lesson-editor { display: grid; gap: .55rem; min-width: 0; border-radius: .65rem; background: rgb(248 250 252); padding: .35rem; }
      .lms-tree-branch { display: none; }
      .lms-free-check { display: flex; align-items: center; gap: .3rem; white-space: nowrap; color: rgb(51 65 85); font-size: .68rem; font-weight: 700; }.lms-free-check input { accent-color: rgb(79 70 229); }
      .lms-media-list { display: grid; gap: .45rem; margin-inline-start: 3.15rem; border: 1px solid rgb(226 232 240); border-radius: .6rem; background: white; padding: .55rem; }
      .lms-media-list-head { display: flex; align-items: center; justify-content: space-between; gap: .75rem; color: rgb(30 41 59); font-size: .7rem; font-weight: 800; }
      .lms-media-list-head small { color: rgb(71 85 105); font-size: .65rem; font-weight: 700; }
      .lms-media-row { display: grid; grid-template-columns: 6rem minmax(8rem, .8fr) minmax(10rem, 1.2fr) 2rem 2rem; gap: .4rem; align-items: center; }
      .lms-media-upload { display: grid; place-items: center; width: 2rem; height: 2rem; border: 1px solid rgb(203 213 225); border-radius: .5rem; color: rgb(67 56 202); cursor: pointer; }.lms-media-upload input { display: none; }.lms-media-upload mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-add-media { width: fit-content; display: inline-flex; align-items: center; gap: .3rem; border: 0; background: transparent; color: rgb(67 56 202); font: inherit; font-size: .7rem; font-weight: 750; cursor: pointer; }.lms-add-media mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-empty-lesson-state { display: flex; align-items: center; gap: .55rem; margin-inline-start: 2.3rem; border: 1px dashed rgb(203 213 225); border-radius: .65rem; background: rgb(248 250 252); padding: .75rem; color: rgb(71 85 105); font-size: .75rem; }
      .lms-empty-lesson-state mat-icon { width: 1.1rem; height: 1.1rem; color: rgb(100 116 139); font-size: 1.1rem; }
      .lms-empty-lesson-state button { margin-inline-start: auto; color: rgb(67 56 202); font: inherit; font-size: .72rem; font-weight: 800; }
      .lms-course-table-empty-state { display: grid; place-items: center; align-content: center; gap: .55rem; min-height: 12rem; padding: 2rem; color: rgb(71 85 105); text-align: center; }
      .lms-course-table-empty-state .lms-course-empty-icon { display: grid; place-items: center; width: 2.65rem; height: 2.65rem; border-radius: .85rem; background: rgb(238 242 255); color: rgb(79 70 229); }
      .lms-course-table-empty-state .lms-course-empty-icon mat-icon { width: 1.35rem; height: 1.35rem; color: currentColor; font-size: 1.35rem; line-height: 1.35rem; }
      .lms-course-table-empty-state strong { color: rgb(15 23 42); font-size: .9rem; font-weight: 850; }
      .lms-course-table-empty-state small { max-width: 22rem; color: rgb(71 85 105); font-size: .73rem; font-weight: 600; line-height: 1.45; }
      .lms-course-table-empty-state button { display: inline-flex; align-items: center; gap: .35rem; margin: .25rem 0 0; border-radius: 999px; background: rgb(99 102 241); color: white; padding: .55rem .85rem; font-size: .75rem; font-weight: 850; transition: background-color .15s ease, transform .15s ease; }
      .lms-course-table-empty-state button:hover,
      .lms-course-table-empty-state button:focus-visible { background: rgb(79 70 229); outline: none; transform: translateY(-1px); }
      .lms-course-table-empty-state button mat-icon { width: 1rem; height: 1rem; color: currentColor; font-size: 1rem; line-height: 1rem; }
      .lms-course-content-empty { gap: .55rem; }
      .lms-course-content-empty .lms-button { margin-top: .35rem; }
      .lms-course-content-browser { display: grid; grid-template-columns: minmax(18rem, 34rem) minmax(0, 1fr); gap: 1.5rem; align-items: start; margin-top: 1rem; }
      .lms-course-content-tree-panel,
      .lms-course-content-table-panel { min-width: 0; overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: .75rem; background: rgb(255 255 255); box-shadow: 0 1px 2px rgb(15 23 42 / .05); }
      .lms-course-content-tree-panel { max-width: 34rem; }
      .lms-course-content-panel-header { border-bottom: 1px solid rgb(226 232 240); padding: 1.25rem 1.5rem; }
      .lms-course-content-panel-header h3 { margin: 0; color: rgb(100 116 139); font-size: .72rem; font-weight: 850; letter-spacing: .04em; text-transform: uppercase; }
      .lms-course-content-browser .lms-course-content-tree { margin: 0; border: 0; border-radius: 0; background: transparent; padding: .75rem; }
      .lms-course-tree-node { min-width: 0; }
      .lms-course-content-browser .lms-course-tree-row { min-height: 2.5rem; padding: .375rem .5rem; }
      .lms-course-content-browser .lms-course-tree-row:hover,
      .lms-course-content-browser .lms-course-tree-row:focus-within { background: rgb(248 250 252); }
      .lms-course-content-browser .lms-course-tree-row.is-selected,
      .lms-course-content-browser .lms-course-tree-row.is-selected:hover,
      .lms-course-content-browser .lms-course-tree-row.is-selected:focus-within { background: rgb(238 242 255); }
      .lms-course-content-browser .lms-course-tree-row.is-selected .lms-course-tree-label,
      .lms-course-content-browser .lms-course-tree-row.is-selected .lms-course-tree-icon,
      .lms-course-content-browser .lms-course-tree-row.is-selected .lms-course-tree-toggle,
      .lms-course-content-browser .lms-course-tree-row.is-selected .lms-course-tree-action { color: rgb(79 70 229); }
      .lms-course-content-browser .lms-course-tree-row .lms-course-tree-action.is-free.is-active,
      .lms-course-content-browser .lms-course-tree-row.is-selected .lms-course-tree-action.is-free.is-active { color: rgb(202 138 4); }
      .lms-course-content-browser .lms-course-tree-row .lms-course-tree-action.is-free:hover,
      .lms-course-content-browser .lms-course-tree-row .lms-course-tree-action.is-free:focus-visible,
      .lms-course-content-browser .lms-course-tree-row .lms-course-tree-action.is-free.is-active:hover,
      .lms-course-content-browser .lms-course-tree-row .lms-course-tree-action.is-free.is-active:focus-visible { background: rgb(254 249 195); color: rgb(161 98 7); }
      .lms-course-content-browser .lms-course-tree-row-root { background: transparent; }
      .lms-course-content-browser .lms-course-tree-row-root:hover,
      .lms-course-content-browser .lms-course-tree-row-root:focus-within { background: rgb(248 250 252); }
      .lms-course-content-browser .lms-course-tree-row-root.is-selected:hover,
      .lms-course-content-browser .lms-course-tree-row-root.is-selected:focus-within { background: rgb(238 242 255); }
      .lms-course-content-browser .lms-course-tree-label { border: 0; background: transparent; padding: 0; text-align: start; cursor: pointer; }
      .lms-course-content-browser .lms-course-tree-label:hover,
      .lms-course-content-browser .lms-course-tree-label:focus-visible { color: rgb(79 70 229); outline: none; }
      .lms-course-tree-children { margin-inline-start: 2rem; }
      .lms-course-tree-toggle--hidden { visibility: hidden; }
      .lms-course-content-browser .lms-course-tree-row-root .lms-course-tree-actions { opacity: 0; }
      .lms-course-content-browser .lms-course-tree-row:hover .lms-course-tree-actions,
      .lms-course-content-browser .lms-course-tree-row:focus-within .lms-course-tree-actions { opacity: 1; }
      .lms-course-content-table-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid rgb(226 232 240); padding: 1rem; }
      .lms-course-content-table-header h3 { min-width: 0; overflow: hidden; margin: 0; color: rgb(15 23 42); font-size: .95rem; font-weight: 850; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-content-table-header > div { display: inline-flex; align-items: center; gap: .35rem; }
      .lms-course-content-table-header button { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .5rem; color: rgb(100 116 139); transition: background-color .15s ease, color .15s ease; }
      .lms-course-content-table-header button:hover,
      .lms-course-content-table-header button:focus-visible { background: rgb(238 242 255); color: rgb(79 70 229); outline: none; }
      .lms-course-content-table-header mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; line-height: 1.1rem; }
      .lms-course-content-table-wrap { overflow-x: auto; }
      .lms-course-content-table { width: 100%; min-width: 42rem; border-collapse: collapse; color: rgb(51 65 85); font-size: .78rem; text-align: start; }
      .lms-course-content-table thead { border-bottom: 1px solid rgb(226 232 240); background: rgb(248 250 252); color: rgb(100 116 139); }
      .lms-course-content-table th,
      .lms-course-content-table td { padding: .75rem 1.5rem; text-align: start; vertical-align: middle; }
      .lms-course-content-table th { font-weight: 700; }
      .lms-course-content-table th:last-child,
      .lms-course-content-table td:last-child { text-align: right; }
      .lms-course-content-table tbody tr { border-bottom: 1px solid rgb(226 232 240); }
      .lms-course-content-table tbody tr:last-child { border-bottom: 0; }
      .lms-course-content-row { cursor: pointer; transition: background-color .15s ease; }
      .lms-course-content-row:hover,
      .lms-course-content-row:focus-visible { background: rgb(248 250 252); outline: none; }
      .lms-course-content-name { display: inline-flex; min-width: 0; width: 100%; align-items: center; gap: .6rem; }
      .lms-course-content-name mat-icon { width: 1.2rem; height: 1.2rem; flex: 0 0 auto; color: rgb(79 70 229); font-size: 1.2rem; line-height: 1.2rem; }
      .lms-course-content-name span { min-width: 0; overflow: hidden; color: rgb(15 23 42); font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-table-input,
      .lms-course-table-textarea { min-height: 2.15rem; border-color: transparent; background: transparent; box-shadow: none; font-weight: 700; }
      .lms-course-table-textarea { resize: vertical; color: rgb(71 85 105); font-weight: 500; }
      .lms-course-table-input:hover,
      .lms-course-table-input:focus,
      .lms-course-table-textarea:hover,
      .lms-course-table-textarea:focus { border-color: rgb(203 213 225); background: rgb(255 255 255); }
      .lms-course-table-actions { display: inline-flex; align-items: center; justify-content: flex-end; gap: .25rem; opacity: .72; transition: opacity .15s ease; }
      .lms-course-content-row:hover .lms-course-table-actions,
      .lms-course-content-row:focus-within .lms-course-table-actions { opacity: 1; }
      .lms-course-table-action { display: inline-flex; width: 2rem; height: 2rem; align-items: center; justify-content: center; border-radius: .5rem; color: rgb(100 116 139); transition: background-color .15s ease, color .15s ease, opacity .15s ease; }
      .lms-course-table-action:hover,
      .lms-course-table-action:focus-visible { background: rgb(238 242 255); color: rgb(79 70 229); outline: none; }
      .lms-course-table-action.is-free.is-active { color: rgb(202 138 4); }
      .lms-course-table-action.is-free:hover,
      .lms-course-table-action.is-free:focus-visible,
      .lms-course-table-action.is-free.is-active:hover,
      .lms-course-table-action.is-free.is-active:focus-visible { background: rgb(254 249 195); color: rgb(161 98 7); }
      .lms-course-table-action:disabled { cursor: default; opacity: .45; }
      .lms-course-table-action:disabled:hover,
      .lms-course-table-action:disabled:focus-visible { background: transparent; color: rgb(100 116 139); }
      .lms-course-table-action.is-danger:hover,
      .lms-course-table-action.is-danger:focus-visible { background: rgb(254 226 226); color: rgb(220 38 38); }
      .lms-course-table-action mat-icon { width: 1rem; height: 1rem; font-size: 1rem; line-height: 1rem; }
      .lms-course-content-preview-page { display: grid; gap: 1rem; }
      .lms-course-content-preview-summary { display: inline-flex; width: fit-content; align-items: center; gap: .75rem; border: 1px solid rgb(226 232 240); border-radius: 999px; background: rgb(248 250 252); color: rgb(71 85 105); padding: .45rem .75rem; font-size: .75rem; font-weight: 800; }
      .lms-course-content-preview-summary span { display: inline-flex; align-items: center; gap: .35rem; }
      .lms-course-content-preview-summary mat-icon { width: 1rem; height: 1rem; color: rgb(79 70 229); font-size: 1rem; line-height: 1rem; }
      .lms-course-authoring-page { min-width: 0; min-height: calc(100vh - 7.2rem); display: grid; grid-template-rows: auto minmax(0, 1fr); overflow: clip; border: 1px solid rgb(213 226 241); border-radius: 1rem; background: rgb(241 245 249); box-shadow: 0 1px 3px rgb(15 23 42 / .06); }
      .lms-builder-header { position: sticky; top: 0; z-index: 12; display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 4.45rem; border-bottom: 1px solid rgb(226 232 240); background: rgb(255 255 255 / .98); padding: .75rem 1rem; backdrop-filter: blur(10px); }
      .lms-builder-header-main,
      .lms-builder-header-actions { display: flex; align-items: center; gap: .75rem; min-width: 0; }
      .lms-builder-header-main h2 { margin: .1rem 0 0; overflow: hidden; color: rgb(15 23 42); font-size: 1rem; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }
      .lms-builder-breadcrumb { margin: 0; color: rgb(71 85 105); font-size: .68rem; font-weight: 750; }
      .lms-builder-back,
      .lms-builder-icon-button { display: grid; place-items: center; width: 2.35rem; height: 2.35rem; flex: 0 0 auto; border: 1px solid rgb(203 213 225); border-radius: .65rem; background: white; color: rgb(67 56 202); transition: border-color .15s ease, background-color .15s ease, color .15s ease, transform .15s ease; }
      .lms-builder-back:hover,
      .lms-builder-icon-button:hover,
      .lms-builder-back:focus-visible,
      .lms-builder-icon-button:focus-visible { border-color: rgb(165 180 252); background: rgb(238 242 255); outline: none; transform: translateY(-1px); }
      .lms-builder-back mat-icon,
      .lms-builder-icon-button mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; line-height: 1.1rem; }
      .lms-builder-course-icon { display: grid; place-items: center; width: 2.45rem; height: 2.45rem; flex: 0 0 auto; border: 1px solid rgb(224 231 255); border-radius: .7rem; background: rgb(238 242 255); color: rgb(79 70 229); }
      .lms-builder-course-icon mat-icon { width: 1.2rem; height: 1.2rem; font-size: 1.2rem; line-height: 1.2rem; }
      .lms-builder-status,
      .lms-autosave-state { display: inline-flex; align-items: center; gap: .35rem; border-radius: 999px; background: rgb(241 245 249); color: rgb(51 65 85); padding: .38rem .65rem; font-size: .68rem; font-weight: 850; white-space: nowrap; }
      .lms-builder-status.is-published { background: rgb(220 252 231); color: rgb(22 101 52); }
      .lms-autosave-state { background: rgb(236 253 245); color: rgb(4 120 87); }
      .lms-autosave-state.is-saving { background: rgb(239 246 255); color: rgb(29 78 216); }
      .lms-autosave-state.is-failed { background: rgb(254 242 242); color: rgb(185 28 28); }
      .lms-autosave-state mat-icon { width: .95rem; height: .95rem; font-size: .95rem; line-height: .95rem; }
      .lms-builder-primary,
      .lms-builder-secondary { display: inline-flex; align-items: center; justify-content: center; gap: .45rem; min-height: 2.35rem; border-radius: .65rem; padding: .55rem .85rem; font-size: .76rem; font-weight: 850; transition: background-color .15s ease, border-color .15s ease, color .15s ease, opacity .15s ease, transform .15s ease; }
      .lms-builder-primary { border: 1px solid rgb(109 40 217); background: rgb(109 40 217); color: white; box-shadow: none; }
      .lms-builder-primary:hover:not(:disabled),
      .lms-builder-primary:focus-visible { border-color: rgb(91 33 182); background: rgb(91 33 182); outline: none; transform: translateY(-1px); }
      .lms-builder-primary:disabled { cursor: not-allowed; opacity: .6; transform: none; }
      .lms-builder-secondary { border: 1px solid rgb(203 213 225); background: white; color: rgb(67 56 202); }
      .lms-builder-secondary:hover,
      .lms-builder-secondary:focus-visible { border-color: rgb(165 180 252); background: rgb(238 242 255); outline: none; }
      .lms-builder-primary mat-icon,
      .lms-builder-secondary mat-icon { width: 1rem; height: 1rem; font-size: 1rem; line-height: 1rem; }
      .lms-builder-shell { min-width: 0; min-height: 0; display: grid; grid-template-columns: minmax(17rem, 20rem) minmax(0, 1fr); gap: .75rem; overflow: hidden; padding: .75rem; }
      .lms-builder-shell.has-inspector { grid-template-columns: minmax(17rem, 20rem) minmax(0, 1fr) minmax(17rem, 20rem); }
      .lms-builder-curriculum,
      .lms-builder-editor,
      .lms-builder-inspector { min-height: 0; overflow: auto; border: 1px solid rgb(213 226 241); border-radius: .9rem; background: white; box-shadow: 0 1px 2px rgb(15 23 42 / .04); }
      .lms-builder-editor { min-width: 0; }
      .lms-builder-curriculum { position: relative; z-index: 4; display: grid; grid-template-rows: auto auto minmax(0, 1fr); overflow: visible; }
      .lms-builder-editor,
      .lms-builder-inspector { position: relative; z-index: 1; }
      .lms-builder-sidebar-head,
      .lms-inspector-head { display: flex; align-items: center; justify-content: space-between; gap: .75rem; border-bottom: 1px solid rgb(226 232 240); padding: .9rem 1rem; }
      .lms-builder-sidebar-head h3,
      .lms-inspector-head h3 { margin: 0; color: rgb(15 23 42); font-size: .92rem; font-weight: 900; }
      .lms-builder-sidebar-head p { margin: .18rem 0 0; color: rgb(71 85 105); font-size: .68rem; font-weight: 750; }
      .lms-builder-sidebar-actions { position: relative; display: flex; align-items: center; justify-content: space-between; gap: .75rem; border-bottom: 1px solid rgb(226 232 240); background: rgb(248 250 252); padding: .75rem 1rem; }
      .lms-builder-add-control { display: inline-flex; }
      .lms-builder-add-button { display: inline-flex; min-height: 2.35rem; align-items: center; justify-content: center; gap: .4rem; border: 1px solid rgb(109 40 217); border-radius: .65rem; background: rgb(109 40 217); color: white; padding: .5rem .85rem; font-size: .76rem; font-weight: 850; transition: background-color .15s ease, border-color .15s ease; }
      .lms-builder-add-button:hover,
      .lms-builder-add-button:focus-visible { border-color: rgb(91 33 182); background: rgb(91 33 182); outline: none; }
      .lms-builder-add-button:focus-visible { box-shadow: 0 0 0 3px rgb(109 40 217 / .2); }
      .lms-builder-add-button mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; line-height: 1.1rem; }
      .lms-builder-add-menu { position: absolute; z-index: 20; inset-inline-start: .4rem; top: calc(100% + .4rem); width: min(22rem, calc(100vw - 2rem)); animation: lms-builder-menu-in .16s cubic-bezier(.22, 1, .36, 1); }
      .lms-builder-add-menu-primary,
      .lms-builder-add-submenu { overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: .5rem; background: white; box-shadow: 0 8px 18px rgb(15 23 42 / .14); }
      .lms-builder-add-menu-primary > button { display: grid; width: 100%; min-height: 4.15rem; grid-template-columns: 1.4rem minmax(0, 1fr) 1rem; align-items: center; gap: .75rem; color: rgb(15 23 42); padding: .65rem .9rem; text-align: start; transition: background-color .15s ease, color .15s ease; }
      .lms-builder-add-menu-primary > button:hover,
      .lms-builder-add-menu-primary > button:focus-visible,
      .lms-builder-add-menu-primary > button.is-active { background: rgb(248 250 252); color: rgb(67 56 202); outline: none; }
      .lms-builder-add-menu-primary > button > mat-icon { width: 1.2rem; height: 1.2rem; color: rgb(30 41 59); font-size: 1.2rem; line-height: 1.2rem; }
      .lms-builder-add-menu-primary > button:hover > mat-icon,
      .lms-builder-add-menu-primary > button:focus-visible > mat-icon,
      .lms-builder-add-menu-primary > button.is-active > mat-icon { color: rgb(67 56 202); }
      .lms-builder-add-menu-primary > button > span { min-width: 0; display: grid; gap: .15rem; }
      .lms-builder-add-menu strong { font-size: .8rem; font-weight: 900; }
      .lms-builder-add-menu small { overflow: hidden; color: rgb(71 85 105); font-size: .68rem; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
      .lms-builder-add-submenu { position: absolute; inset-inline-start: calc(100% + .25rem); top: 0; width: min(22rem, calc(100vw - 2rem)); padding-block: .25rem; animation: lms-builder-submenu-in .16s cubic-bezier(.22, 1, .36, 1); }
      .lms-builder-add-submenu.is-activities { top: 4.15rem; }
      .lms-builder-add-submenu.is-more { top: 8.3rem; }
      .lms-builder-add-submenu > button { display: grid; width: 100%; min-height: 2.6rem; grid-template-columns: 1.25rem minmax(0, 1fr); align-items: center; gap: .7rem; color: rgb(30 41 59); padding: .55rem 1rem; text-align: start; transition: background-color .15s ease, color .15s ease; }
      .lms-builder-add-submenu > button:hover,
      .lms-builder-add-submenu > button:focus-visible { background: rgb(248 250 252); color: rgb(67 56 202); outline: none; }
      .lms-builder-add-submenu > button:disabled { cursor: not-allowed; opacity: .45; }
      .lms-builder-add-submenu mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; line-height: 1.1rem; }
      .lms-builder-add-submenu span { font-size: .78rem; font-weight: 650; }
      @keyframes lms-builder-menu-in { from { opacity: 0; transform: translateY(-.35rem); } to { opacity: 1; transform: translateY(0); } }
      @keyframes lms-builder-submenu-in { from { opacity: 0; transform: translateX(-.35rem); } to { opacity: 1; transform: translateX(0); } }
      .lms-builder-sidebar-tools { display: flex; align-items: center; gap: .45rem; }
      .lms-builder-sidebar-tools button { display: grid; place-items: center; width: 2.35rem; height: 2.35rem; flex: 0 0 auto; border: 1px solid rgb(203 213 225); border-radius: .65rem; background: white; color: rgb(71 85 105); transition: border-color .15s ease, background-color .15s ease, color .15s ease; }
      .lms-builder-sidebar-tools button:hover:not(:disabled),
      .lms-builder-sidebar-tools button:focus-visible { border-color: rgb(165 180 252); background: rgb(238 242 255); color: rgb(67 56 202); outline: none; }
      .lms-builder-sidebar-tools button:focus-visible { box-shadow: 0 0 0 3px rgb(99 102 241 / .16); }
      .lms-builder-sidebar-tools button:disabled { cursor: not-allowed; opacity: .42; }
      .lms-builder-sidebar-tools mat-icon { width: 1.05rem; height: 1.05rem; font-size: 1.05rem; line-height: 1.05rem; }
      .lms-builder-tree { min-height: 0; display: grid; align-content: start; gap: .28rem; overflow: auto; padding: .7rem .55rem 1rem; }
      .lms-builder-tree:has(.lms-builder-empty-sidebar) { align-content: center; }
      .lms-builder-tree-root > button,
      .lms-builder-node-row { display: flex; width: 100%; min-height: 2.75rem; align-items: center; gap: .42rem; border: 1px solid transparent; border-radius: .7rem; padding: .38rem .5rem; color: rgb(15 23 42); text-align: start; transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
      .lms-builder-tree-root.is-selected > button,
      .lms-builder-node-row.is-selected { border-color: rgb(167 139 250); background: rgb(245 243 255); box-shadow: 0 1px 0 rgb(109 40 217 / .12), inset 0 0 0 1px rgb(221 214 254); }
      :host-context([dir="rtl"]) .lms-builder-tree-root.is-selected > button,
      :host-context([dir="rtl"]) .lms-builder-node-row.is-selected { box-shadow: 0 1px 2px rgb(109 40 217 / .08); }
      .lms-builder-tree-root > button:hover,
      .lms-builder-node-row:hover,
      .lms-builder-node-row:focus-within { background: rgb(248 250 252); transform: translateY(-1px); }
      .lms-builder-tree-root mat-icon,
      .lms-builder-node-title mat-icon { width: 1.1rem; height: 1.1rem; color: rgb(79 70 229); font-size: 1.1rem; line-height: 1.1rem; }
      .lms-builder-tree-root span,
      .lms-builder-node-title span { min-width: 0; overflow: hidden; flex: 1 1 auto; font-size: .8rem; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }
      .lms-builder-tree-root small,
      .lms-builder-node-title small { color: rgb(100 116 139); font-size: .63rem; font-weight: 800; white-space: nowrap; }
      .lms-builder-node-children { display: grid; gap: .25rem; margin-inline-start: .85rem; padding-inline-start: .45rem; }
      .lms-drag-handle { display: grid; place-items: center; width: 1.1rem; color: rgb(148 163 184); }
      .lms-drag-handle mat-icon { width: .95rem; height: .95rem; font-size: .95rem; }
      .lms-builder-node-toggle,
      .lms-builder-node-action { display: grid; place-items: center; width: 1.65rem; height: 1.65rem; flex: 0 0 auto; border-radius: .5rem; color: rgb(100 116 139); }
      .lms-builder-node-toggle:disabled { color: rgb(203 213 225); }
      .lms-builder-node-action { opacity: 0; color: rgb(79 70 229); transition: background-color .15s ease, color .15s ease, opacity .15s ease, transform .15s ease; }
      .lms-builder-node-row:hover .lms-builder-node-action,
      .lms-builder-node-row:focus-within .lms-builder-node-action { opacity: 1; }
      .lms-builder-node-action:hover,
      .lms-builder-node-action:focus-visible { background: rgb(238 242 255); color: rgb(67 56 202); outline: none; transform: translateY(-1px); }
      .lms-builder-node-action.is-free.is-active { opacity: 1; color: rgb(202 138 4); }
      .lms-builder-node-action.is-free:hover,
      .lms-builder-node-action.is-free:focus-visible,
      .lms-builder-node-action.is-free.is-active:hover,
      .lms-builder-node-action.is-free.is-active:focus-visible { background: rgb(254 249 195); color: rgb(161 98 7); }
      .lms-builder-node-action.is-copy:hover,
      .lms-builder-node-action.is-copy:focus-visible { background: rgb(224 231 255); color: rgb(55 48 163); }
      .lms-builder-node-action.is-danger:hover,
      .lms-builder-node-action.is-danger:focus-visible { background: rgb(254 226 226); color: rgb(220 38 38); }
      .lms-builder-node-title { display: flex; min-width: 0; flex: 1 1 auto; align-items: center; gap: .45rem; }
      .lms-builder-empty-sidebar { display: grid; justify-items: center; gap: .45rem; padding: 2rem 1.25rem; color: rgb(71 85 105); text-align: center; }
      .lms-builder-empty-sidebar mat-icon { color: rgb(109 40 217); }
      .lms-builder-empty-sidebar strong { color: rgb(15 23 42); font-size: .84rem; }
      .lms-builder-empty-sidebar span { max-width: 15rem; font-size: .72rem; line-height: 1.45; text-wrap: pretty; }
      .lms-builder-editor { background: rgb(248 250 252); padding: .75rem; }
      .lms-builder-canvas { width: min(100%, 72.5rem); min-width: 0; display: grid; gap: 1rem; margin-inline: auto; }
      .lms-builder-canvas.is-full-unit-editor { width: 100%; min-height: 100%; grid-template-rows: auto minmax(32rem, 1fr); }
      .lms-builder-canvas.is-test-unit-editor { width: min(100%, 60rem); min-height: auto; align-content: start; grid-template-rows: auto auto; padding: .65rem 0 4.75rem; }
      .lms-course-level-editor { display: grid; gap: 1.5rem; padding: clamp(.75rem, 2vw, 1.5rem); }
      .lms-course-description-editor { display: grid; gap: .65rem; color: rgb(100 116 139); font-size: .86rem; }
      .lms-course-description-editor span { padding-inline: .1rem; }
      .lms-course-description-editor textarea { width: 100%; min-height: 4.5rem; resize: vertical; border: 0; border-bottom: 1px solid rgb(203 213 225); background: transparent; color: rgb(15 23 42); padding: .65rem .1rem; font: inherit; font-size: .9rem; line-height: 1.55; outline: none; }
      .lms-course-description-editor textarea::placeholder { color: rgb(71 85 105); opacity: 1; }
      .lms-course-description-editor textarea:focus { border-color: rgb(79 70 229); box-shadow: 0 2px 0 rgb(79 70 229 / .14); }
      .lms-course-content-editor-panel { min-height: 23rem; overflow: hidden; border: 1px solid rgb(203 213 225); border-radius: .75rem; background: white; }
      .lms-course-content-editor-tabs { display: flex; min-height: 3.75rem; align-items: end; justify-content: space-between; gap: 1rem; border-bottom: 1px solid rgb(203 213 225); padding-inline: 1rem; }
      .lms-course-content-editor-tabs > div { display: flex; align-items: end; gap: .25rem; }
      .lms-course-content-editor-tabs button { min-height: 3.75rem; border-bottom: 3px solid transparent; color: rgb(51 65 85); padding: .2rem .75rem 0; font-size: .8rem; font-weight: 750; }
      .lms-course-content-editor-tabs button:hover,
      .lms-course-content-editor-tabs button:focus-visible { color: rgb(67 56 202); outline: none; }
      .lms-course-content-editor-tabs button.is-active { border-color: rgb(67 56 202); color: rgb(15 23 42); font-weight: 900; }
      .lms-course-content-editor-tabs > span { align-self: center; color: rgb(71 85 105); font-size: .7rem; }
      .lms-course-editor-empty { min-height: 18.5rem; display: grid; place-content: center; justify-items: center; gap: .4rem; padding: 2rem; color: rgb(71 85 105); text-align: center; }
      .lms-course-editor-empty mat-icon { width: 1.35rem; height: 1.35rem; color: rgb(67 56 202); font-size: 1.35rem; line-height: 1.35rem; }
      .lms-course-editor-empty strong { color: rgb(55 48 163); font-size: .82rem; font-weight: 900; }
      .lms-course-editor-empty span { max-width: 42rem; font-size: .78rem; line-height: 1.5; text-wrap: pretty; }
      .lms-course-editor-item-list { display: grid; }
      .lms-course-editor-item-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: stretch; border-bottom: 1px solid rgb(226 232 240); transition: background-color .15s ease; }
      .lms-course-editor-item-open { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .75rem; min-height: 4.25rem; padding: .75rem 1rem; color: rgb(15 23 42); text-align: start; }
      .lms-course-editor-item-free,
      .lms-course-editor-item-delete { display: grid; place-items: center; width: 2.75rem; min-height: 4.25rem; color: rgb(100 116 139); transition: background-color .15s ease, color .15s ease; }
      @media (prefers-reduced-motion: reduce) {
        .lms-builder-add-menu,
        .lms-builder-add-submenu { animation: none; }
      }
      .lms-course-editor-item-row:hover,
      .lms-course-editor-item-row:focus-within { background: rgb(248 250 252); }
      .lms-course-editor-item-open:focus-visible,
      .lms-course-editor-item-free:focus-visible,
      .lms-course-editor-item-delete:focus-visible { outline: none; box-shadow: inset 0 0 0 2px rgb(129 140 248); }
      .lms-course-editor-item-free.is-active { color: rgb(202 138 4); }
      .lms-course-editor-item-free:hover,
      .lms-course-editor-item-free:focus-visible,
      .lms-course-editor-item-free.is-active:hover,
      .lms-course-editor-item-free.is-active:focus-visible { background: rgb(254 249 195); color: rgb(161 98 7); }
      .lms-course-editor-item-delete:hover,
      .lms-course-editor-item-delete:focus-visible { background: rgb(254 226 226); color: rgb(220 38 38); }
      .lms-course-editor-item-open > mat-icon:first-child { color: rgb(79 70 229); }
      .lms-course-editor-item-open > mat-icon:last-child { color: rgb(100 116 139); }
      .lms-course-editor-item-free mat-icon,
      .lms-course-editor-item-delete mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; line-height: 1.1rem; }
      .lms-course-editor-item-list span { min-width: 0; }
      .lms-course-editor-item-list strong,
      .lms-course-editor-item-list small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-editor-item-list strong { font-size: .82rem; font-weight: 850; }
      .lms-course-editor-item-list small { margin-top: .2rem; color: rgb(71 85 105); font-size: .7rem; }
      .lms-builder-empty-canvas { min-height: min(30rem, calc(100vh - 15rem)); display: grid; place-content: center; justify-items: center; gap: 1rem; border: 1px dashed rgb(165 180 252); border-radius: .9rem; background: rgb(255 255 255); padding: clamp(1.5rem, 6vw, 4rem); color: rgb(71 85 105); text-align: center; }
      .lms-builder-empty-canvas-icon { display: grid; place-items: center; width: 3.5rem; height: 3.5rem; border-radius: 1rem; background: rgb(224 231 255); color: rgb(79 70 229); }
      .lms-builder-empty-canvas-icon mat-icon { width: 1.75rem; height: 1.75rem; font-size: 1.75rem; line-height: 1.75rem; }
      .lms-builder-empty-canvas-eyebrow { margin: 0 0 .35rem; color: rgb(67 56 202); font-size: .72rem; font-weight: 900; }
      .lms-builder-empty-canvas h3 { margin: 0; color: rgb(15 23 42); font-size: 1.2rem; font-weight: 900; text-wrap: balance; }
      .lms-builder-empty-canvas p:not(.lms-builder-empty-canvas-eyebrow) { max-width: 38rem; margin: .45rem 0 0; font-size: .84rem; line-height: 1.55; text-wrap: pretty; }
      .lms-builder-empty-canvas-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: .65rem; }
      .lms-builder-primary:focus-visible,
      .lms-builder-secondary:focus-visible { box-shadow: 0 0 0 3px rgb(99 102 241 / .24); }
      .lms-unit-editor-head,
      .lms-video-source-panel,
      .lms-block-editor { border: 1px solid rgb(226 232 240); border-radius: .8rem; background: white; padding: 1rem; box-shadow: 0 1px 2px rgb(15 23 42 / .04); }
      .lms-unit-editor-head { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
      .lms-unit-editor-head.is-survey-unit-head { align-items: start; border-color: rgb(213 226 241); background: white; padding: 1.5rem 2rem 1.1rem; box-shadow: 0 1px 2px rgb(15 23 42 / .04); }
      .lms-unit-title-field { min-width: 0; flex: 1 1 auto; display: grid; gap: .35rem; }
      .lms-unit-title-field label,
      .lms-builder-field span { color: rgb(71 85 105); font-size: .7rem; font-weight: 850; }
      .lms-unit-title-field input { width: 100%; border: 0; border-bottom: 1px solid rgb(226 232 240); background: transparent; color: rgb(15 23 42); padding: .35rem 0 .45rem; font: inherit; font-size: 1.35rem; font-weight: 900; outline: none; }
      .lms-unit-title-field input:focus { border-color: rgb(99 102 241); }
      .lms-unit-title-field textarea { width: 100%; max-width: 70ch; resize: vertical; border: 0; background: transparent; color: rgb(51 65 85); padding: .45rem 0 0; font: inherit; font-size: .95rem; line-height: 1.45; outline: none; }
      .lms-unit-title-field textarea::placeholder { color: rgb(100 116 139); opacity: 1; }
      .lms-unit-title-field textarea:focus { box-shadow: inset 0 -1px 0 rgb(99 102 241); }
      .lms-unit-editor-head.is-survey-unit-head .lms-unit-title-field { max-width: none; justify-self: stretch; }
      .lms-unit-editor-head.is-survey-unit-head .lms-unit-title-field label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .lms-unit-editor-head.is-survey-unit-head .lms-unit-title-field input { max-width: 44rem; border-bottom-color: rgb(226 232 240); padding-bottom: .35rem; font-size: 1.55rem; font-weight: 900; }
      .lms-unit-head-actions { display: flex; align-items: center; gap: .45rem; }
      .lms-unit-type-pill { display: inline-flex; align-items: center; gap: .35rem; border-radius: 999px; background: rgb(238 242 255); color: rgb(67 56 202); padding: .4rem .65rem; font-size: .68rem; font-weight: 900; white-space: nowrap; }
      .lms-unit-type-pill mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-content-unit-editor { min-height: min(46rem, calc(100vh - 15rem)); overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: .95rem; background: white; box-shadow: 0 1px 2px rgb(15 23 42 / .04); }
      .lms-content-unit-quill { display: block; min-height: inherit; background: white; }
      .lms-content-unit-quill ::ng-deep .ql-toolbar { position: sticky; z-index: 2; top: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: .35rem; border: 0; border-bottom: 1px solid rgb(226 232 240); background: rgb(255 255 255 / .96); padding: .8rem 1rem; backdrop-filter: blur(8px); }
      .lms-content-unit-quill ::ng-deep .ql-formats { display: inline-flex; align-items: center; gap: .25rem; margin: 0; }
      .lms-content-unit-quill ::ng-deep .ql-toolbar button { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; box-sizing: border-box; border: 1px solid rgb(226 232 240); border-radius: 999px; background: white; padding: .45rem; box-shadow: 0 2px 6px rgb(15 23 42 / .08); }
      .lms-content-unit-quill ::ng-deep .ql-toolbar button svg { width: 100%; height: 100%; }
      .lms-content-unit-quill ::ng-deep .ql-toolbar .ql-picker { width: 6.75rem; height: 2.25rem; }
      .lms-content-unit-quill ::ng-deep .ql-toolbar .ql-picker-label { display: flex; align-items: center; width: 100%; height: 100%; box-sizing: border-box; overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: .7rem; background: white; padding: 0 2rem 0 .75rem; box-shadow: 0 2px 6px rgb(15 23 42 / .08); }
      .lms-content-unit-quill ::ng-deep .ql-toolbar .ql-picker-label::before { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .lms-content-unit-quill ::ng-deep .ql-toolbar .ql-picker-label svg { inset-inline-end: .5rem; }
      .lms-content-unit-quill ::ng-deep .ql-toolbar button:hover,
      .lms-content-unit-quill ::ng-deep .ql-toolbar button:focus-visible,
      .lms-content-unit-quill ::ng-deep .ql-toolbar button.ql-active,
      .lms-content-unit-quill ::ng-deep .ql-toolbar .ql-picker-label:hover,
      .lms-content-unit-quill ::ng-deep .ql-toolbar .ql-picker-label:focus-visible { border-color: rgb(165 180 252); background: rgb(238 242 255); outline: none; }
      .lms-content-unit-quill ::ng-deep .ql-toolbar .ql-picker-options { inset-inline-start: 0; min-width: 8.5rem; border: 1px solid rgb(226 232 240); border-radius: .65rem; box-shadow: 0 12px 30px rgb(15 23 42 / .16); }
      .lms-content-unit-quill ::ng-deep .ql-container { min-height: min(40rem, calc(100vh - 20rem)); border: 0; color: rgb(15 23 42); font-family: inherit; font-size: .95rem; }
      .lms-content-unit-quill ::ng-deep .ql-editor { min-height: min(40rem, calc(100vh - 20rem)); padding: clamp(1.5rem, 4vw, 4rem); line-height: 1.7; }
      .lms-content-unit-quill ::ng-deep .ql-editor.ql-blank::before { inset-inline: clamp(1.5rem, 4vw, 4rem); color: rgb(148 163 184); font-style: normal; }
      .lms-test-unit-editor { position: relative; min-height: min(46rem, calc(100vh - 15rem)); display: grid; align-content: start; gap: 1.5rem; padding: clamp(1rem, 2vw, 1.5rem) clamp(1rem, 2vw, 1.5rem) 6.75rem; }
      .lms-test-unit-editor.is-survey-unit-editor { min-height: auto; align-content: start; border: 1px solid rgb(213 226 241); border-radius: .9rem; background: white; padding: 2rem 2rem 2.25rem; box-shadow: 0 1px 2px rgb(15 23 42 / .04); }
      .lms-test-empty { min-height: min(34rem, calc(100vh - 24rem)); display: grid; align-content: start; justify-items: center; gap: 1.5rem; padding-block: 2rem; text-align: center; }
      .lms-test-unit-editor.is-survey-unit-editor .lms-test-empty { min-height: auto; gap: 1.3rem; padding-block: 0; }
      .lms-test-empty h3 { margin: 0; color: rgb(15 23 42); font-size: 1.08rem; font-weight: 900; }
      .lms-test-empty p,
      .lms-test-question-list p { margin: 0; color: rgb(71 85 105); font-size: .95rem; line-height: 1.45; }
      .lms-test-empty p { margin-block-start: .55rem; }
      .lms-test-question-grid { width: min(100%, 39.5rem); display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: .85rem; justify-content: center; }
      .lms-test-unit-editor.is-survey-unit-editor .lms-test-question-grid { width: min(100%, 36rem); grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .lms-test-question-card { grid-column: span 2; min-height: 8.75rem; display: grid; place-content: center; justify-items: center; gap: .85rem; border: 1px solid rgb(203 213 225); border-radius: .75rem; background: white; color: rgb(30 41 59); padding: 1rem; text-align: center; transition: border-color .16s ease, background .16s ease, color .16s ease, transform .16s ease, box-shadow .16s ease; }
      .lms-test-question-card:nth-last-child(2) { grid-column: 2 / span 2; }
      .lms-test-question-card:nth-last-child(1) { grid-column: 4 / span 2; }
      .lms-test-unit-editor.is-survey-unit-editor .lms-test-question-card { grid-column: span 1; min-height: 7.75rem; border-color: rgb(213 226 241); background: rgb(255 255 255); }
      .lms-test-unit-editor.is-survey-unit-editor .lms-test-question-card:nth-last-child(2) { grid-column: auto; }
      .lms-test-unit-editor.is-survey-unit-editor .lms-test-question-card:nth-last-child(1) { grid-column: 2; }
      .lms-test-question-card:hover,
      .lms-test-question-card:focus-visible { border-color: rgb(167 139 250); background: rgb(250 245 255); color: rgb(109 40 217); outline: none; box-shadow: 0 6px 12px rgb(15 23 42 / .06); transform: translateY(-1px); }
      .lms-test-question-card mat-icon { width: 1.55rem; height: 1.55rem; color: currentColor; font-size: 1.55rem; line-height: 1.55rem; }
      .lms-test-question-card strong { max-width: 9rem; color: rgb(15 23 42); font-size: .88rem; font-weight: 900; line-height: 1.25; }
      .lms-test-question-card:hover strong,
      .lms-test-question-card:focus-visible strong { color: rgb(67 56 202); }
      .lms-test-question-list { width: min(100%, 62.5rem); display: grid; gap: 1rem; justify-self: center; padding-bottom: 4.75rem; }
      .lms-test-question-list > header { display: flex; align-items: center; justify-content: flex-end; min-height: 2rem; border-bottom: 1px solid rgb(226 232 240); padding-block-end: .85rem; }
      .lms-test-question-list > header p { font-style: italic; }
      .lms-test-question-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: .75rem; border: 1px solid rgb(203 213 225); border-radius: .75rem; background: white; padding: 1rem 1.15rem; }
      .lms-test-question-row.is-selected { border-color: rgb(167 139 250); background: rgb(250 245 255); }
      .lms-test-question-row.is-expanded { align-items: start; }
      .lms-test-question-main { min-width: 0; display: flex; align-items: center; gap: 1.2rem; color: rgb(15 23 42); }
      .lms-test-question-main mat-icon { flex: 0 0 auto; width: 1.25rem; height: 1.25rem; color: rgb(15 23 42); font-size: 1.25rem; line-height: 1.25rem; }
      .lms-test-question-main strong { min-width: 0; overflow: hidden; color: rgb(15 23 42); font-size: .95rem; font-weight: 850; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
      .lms-test-question-actions { display: flex; align-items: center; gap: .45rem; }
      .lms-test-question-actions button,
      .lms-test-bottom-bar button { display: grid; place-items: center; width: 2.1rem; height: 2.1rem; border-radius: .45rem; color: rgb(15 23 42); transition: background .16s ease, color .16s ease; }
      .lms-test-question-actions button:hover,
      .lms-test-question-actions button:focus-visible,
      .lms-test-bottom-bar button:hover,
      .lms-test-bottom-bar button:focus-visible { background: rgb(238 242 255); color: rgb(67 56 202); outline: none; }
      .lms-test-question-actions button:nth-child(2):hover,
      .lms-test-question-actions button:nth-child(2):focus-visible { background: rgb(254 226 226); color: rgb(185 28 28); }
      .lms-test-question-actions mat-icon,
      .lms-test-bottom-bar mat-icon { width: 1.15rem; height: 1.15rem; font-size: 1.15rem; line-height: 1.15rem; }
      .lms-test-question-answers { grid-column: 1 / -1; display: grid; gap: 1rem; padding: .25rem 0 .1rem 2.45rem; }
      .lms-test-question-answer { display: flex; align-items: center; gap: .85rem; color: rgb(15 23 42); }
      .lms-test-question-answer span { width: 1.05rem; height: 1.05rem; border: 1px solid rgb(15 23 42); border-radius: 999px; background: white; box-shadow: inset 0 0 0 .25rem white; }
      .lms-test-question-answer.is-correct span { border-color: rgb(49 46 129); background: rgb(67 56 202); }
      .lms-test-question-answer.is-ordered span { display: grid; place-items: center; width: 1.35rem; height: 1.35rem; border-color: rgb(203 213 225); border-radius: .35rem; box-shadow: none; color: rgb(30 41 59); font-size: .72rem; font-weight: 900; }
      .lms-test-question-answer.is-matching { display: grid; grid-template-columns: auto minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; }
      .lms-test-question-answer.is-matching span { display: grid; place-items: center; width: 1.35rem; height: 1.35rem; border-color: rgb(203 213 225); border-radius: .35rem; box-shadow: none; color: rgb(30 41 59); font-size: .72rem; font-weight: 900; }
      .lms-test-question-answer.is-matching mat-icon { width: 1rem; height: 1rem; color: rgb(100 116 139); font-size: 1rem; line-height: 1rem; }
      .lms-test-question-answer.is-free-text mat-icon { width: 1rem; height: 1rem; color: rgb(100 116 139); font-size: 1rem; line-height: 1rem; }
      .lms-test-question-answer p,
      .lms-test-question-no-answers { margin: 0; color: rgb(30 41 59); font-size: .86rem; line-height: 1.45; }
      .lms-test-question-no-answers { padding-inline-start: 1.9rem; color: rgb(100 116 139); }
      .lms-builder-canvas.is-live-session-unit-editor { width: min(100%, 66rem); min-height: auto; align-content: start; grid-template-rows: auto auto; padding: .65rem 0 4.75rem; }
      .lms-unit-editor-head.is-live-session-unit-head { align-items: start; border: 0; background: transparent; padding: 2.2rem 0 1.2rem; box-shadow: none; }
      .lms-unit-editor-head.is-live-session-unit-head .lms-unit-title-field { max-width: 40rem; margin-inline: auto; }
      .lms-unit-editor-head.is-live-session-unit-head .lms-unit-title-field label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .lms-unit-editor-head.is-live-session-unit-head .lms-unit-title-field input { border-bottom: 0; padding: 0; font-size: 1.55rem; font-weight: 900; text-align: start; }
      .lms-unit-editor-head.is-live-session-unit-head .lms-unit-title-field textarea { min-height: 2.25rem; padding-top: .95rem; color: rgb(100 116 139); font-size: .98rem; }
      .lms-live-session-unit-editor { min-height: min(42rem, calc(100vh - 18rem)); display: grid; align-content: start; justify-items: center; padding-block-start: 2.75rem; }
      .lms-live-session-empty { width: min(100%, 42rem); display: grid; justify-items: center; gap: 2rem; text-align: center; }
      .lms-live-session-copy h3 { margin: 0; color: rgb(15 23 42); font-size: 1.1rem; font-weight: 900; text-wrap: balance; }
      .lms-live-session-copy p { margin: .85rem 0 0; color: rgb(71 85 105); font-size: .98rem; line-height: 1.45; text-wrap: pretty; }
      .lms-live-session-grid { width: 100%; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
      .lms-live-session-card { min-height: 12.5rem; display: grid; place-content: center; justify-items: center; gap: .55rem; border: 1px solid rgb(203 213 225); border-radius: .35rem; background: white; color: rgb(15 23 42); padding: 1rem; text-align: center; transition: border-color .16s ease, background-color .16s ease, color .16s ease, box-shadow .16s ease, transform .16s ease; }
      .lms-live-session-card:hover,
      .lms-live-session-card:focus-visible { border-color: rgb(109 40 217); background: rgb(250 245 255); color: rgb(91 33 182); outline: none; box-shadow: 0 3px 8px rgb(15 23 42 / .08); transform: translateY(-1px); }
      .lms-live-session-card mat-icon { width: 1.55rem; height: 1.55rem; color: rgb(15 23 42); font-size: 1.55rem; line-height: 1.55rem; }
      .lms-live-session-card:hover mat-icon,
      .lms-live-session-card:focus-visible mat-icon { color: rgb(91 33 182); }
      .lms-live-session-card strong { max-width: 10rem; color: currentColor; font-size: .9rem; font-weight: 900; line-height: 1.3; }
      .lms-live-session-card span { max-width: 9.5rem; color: currentColor; font-size: .82rem; font-weight: 850; line-height: 1.35; }
      .lms-builder-canvas.is-scorm-unit-editor { width: min(100%, 62.5rem); min-height: auto; align-content: start; grid-template-rows: auto auto; padding: .65rem 0 4.75rem; }
      .lms-unit-editor-head.is-scorm-unit-head { justify-content: start; border: 0; background: transparent; padding: 2.2rem 0 1rem; box-shadow: none; }
      .lms-unit-editor-head.is-scorm-unit-head .lms-unit-title-field { max-width: 62.5rem; margin-inline: auto; }
      .lms-unit-editor-head.is-scorm-unit-head .lms-unit-title-field label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .lms-unit-editor-head.is-scorm-unit-head .lms-unit-title-field input { border-bottom: 0; padding: 0; color: rgb(15 23 42); font-size: 1.55rem; font-weight: 900; }
      .lms-scorm-unit-editor { min-height: min(36rem, calc(100vh - 18rem)); display: grid; align-content: start; justify-items: center; }
      .lms-scorm-upload-drop { width: min(100%, 62.5rem); min-height: min(34.5rem, calc(100vh - 20rem)); display: grid; place-content: center; justify-items: center; gap: .35rem; border-radius: .2rem; background: rgb(244 244 245); color: rgb(71 85 105); padding: 2rem; text-align: center; cursor: pointer; transition: background-color .16s ease, box-shadow .16s ease; }
      .lms-scorm-upload-drop:hover,
      .lms-scorm-upload-drop:focus-within { background: rgb(241 245 249); box-shadow: inset 0 0 0 2px rgb(167 139 250); }
      .lms-scorm-upload-drop input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
      .lms-scorm-upload-drop mat-icon { width: 3rem; height: 3rem; color: rgb(71 85 105); font-size: 3rem; line-height: 3rem; }
      .lms-scorm-upload-drop strong { margin-block-start: .35rem; color: rgb(71 85 105); font-size: .95rem; font-weight: 500; line-height: 1.4; }
      .lms-scorm-upload-drop span { color: rgb(71 85 105); font-size: .75rem; line-height: 1.4; }
      .lms-scorm-upload-summary { width: min(100%, 62.5rem); display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .85rem; border: 1px solid rgb(203 213 225); border-radius: .55rem; background: white; padding: 1rem; }
      .lms-scorm-upload-summary > mat-icon { color: rgb(109 40 217); }
      .lms-scorm-upload-summary div { min-width: 0; }
      .lms-scorm-upload-summary strong,
      .lms-scorm-upload-summary span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .lms-scorm-upload-summary strong { color: rgb(15 23 42); font-size: .86rem; font-weight: 900; }
      .lms-scorm-upload-summary span { margin-top: .2rem; color: rgb(71 85 105); font-size: .76rem; }
      .lms-scorm-upload-summary button { color: rgb(91 33 182); font-size: .78rem; font-weight: 900; }
      .lms-scorm-upload-summary button:hover,
      .lms-scorm-upload-summary button:focus-visible { text-decoration: underline; outline: none; }
      .lms-scorm-upload-error { width: min(100%, 62.5rem); margin-block-start: 1rem; }
      .lms-test-bottom-bar { position: fixed; inset-inline: 5rem 1.5rem; bottom: 0; z-index: 38; display: flex; align-items: center; justify-content: center; gap: 1.2rem; min-height: 3.75rem; border-top: 1px solid rgb(203 213 225); background: rgb(255 255 255 / .96); backdrop-filter: blur(8px); }
      .lms-workspace.is-content-authoring .lms-test-bottom-bar { inset-inline-start: 5rem; }
      .lms-test-question-drawer-backdrop { position: fixed; inset: 0; z-index: 72; display: flex; justify-content: flex-end; background: rgb(15 23 42 / .42); }
      .lms-test-question-drawer { width: min(48rem, 100%); height: 100%; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; background: white; box-shadow: -18px 0 44px rgb(15 23 42 / .18); }
      .lms-multiple-choice-question-drawer { width: min(48rem, 100%); box-shadow: none; }
      .lms-test-question-drawer header,
      .lms-test-question-drawer footer { display: flex; align-items: center; gap: 1rem; padding: 1rem 2rem; }
      .lms-test-question-drawer header { justify-content: space-between; border-bottom: 1px solid rgb(226 232 240); }
      .lms-test-question-drawer h3 { margin: 0; color: rgb(15 23 42); font-size: 1rem; font-weight: 900; }
      .lms-test-question-drawer header button { display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border-radius: .55rem; color: rgb(15 23 42); }
      .lms-test-question-drawer header button:hover,
      .lms-test-question-drawer header button:focus-visible { background: rgb(248 250 252); outline: none; }
      .lms-test-question-drawer-body { min-height: 0; overflow-y: auto; display: grid; align-content: start; gap: 2rem; padding: 2rem; }
      .lms-multiple-choice-question-drawer .lms-test-question-drawer-body { gap: 2.2rem; padding: 2rem 3rem; }
      .lms-test-question-field { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 1rem; }
      .lms-test-question-field mat-icon { width: 1.35rem; height: 1.35rem; color: rgb(15 23 42); font-size: 1.35rem; line-height: 1.35rem; }
      .lms-test-question-field input,
      .lms-test-answer-row input[type="text"] { min-width: 0; border: 0; border-bottom: 1px solid transparent; outline: 0; background: transparent; color: rgb(15 23 42); font: inherit; font-size: .92rem; padding: .55rem .2rem; }
      .lms-test-question-field input:focus,
      .lms-test-answer-row input[type="text"]:focus { border-bottom-color: rgb(99 102 241); }
      .lms-test-question-field input::placeholder,
      .lms-test-answer-row input[type="text"]::placeholder { color: rgb(100 116 139); opacity: 1; }
      .lms-test-answer-list { display: grid; gap: 1.15rem; padding-inline-start: 2.4rem; }
      .lms-multiple-choice-question-drawer .lms-test-answer-list { gap: 1.65rem; padding-inline-start: 1rem; }
      .lms-test-answer-row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .75rem; color: rgb(15 23 42); }
      .lms-test-answer-row input[type="checkbox"] { width: 1.05rem; height: 1.05rem; accent-color: rgb(98 0 238); }
      .lms-test-answer-row input[type="radio"] { width: 1.15rem; height: 1.15rem; appearance: none; border: 1px solid rgb(100 116 139); border-radius: 999px; background: white; box-shadow: inset 0 0 0 .22rem white; }
      .lms-test-answer-row input[type="radio"]:checked { border-color: rgb(79 70 229); background: rgb(79 70 229); }
      .lms-test-answer-row input[type="radio"]:focus-visible { outline: 2px solid rgb(99 102 241); outline-offset: 2px; }
      .lms-test-answer-row > button { display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border-radius: .45rem; color: rgb(100 116 139); }
      .lms-test-answer-row > button:hover,
      .lms-test-answer-row > button:focus-visible { background: rgb(248 250 252); color: rgb(15 23 42); outline: none; }
      .lms-test-answer-row > button mat-icon { width: 1rem; height: 1rem; font-size: 1rem; line-height: 1rem; }
      .lms-multiple-choice-single-toggle { display: inline-flex; align-items: center; gap: .65rem; margin-inline-start: 1rem; color: rgb(15 23 42); font-size: .82rem; }
      .lms-multiple-choice-single-toggle input { position: relative; width: 1.9rem; height: 1rem; appearance: none; border: 0; border-radius: 999px; background: rgb(203 213 225); }
      .lms-multiple-choice-single-toggle input::after { content: ""; position: absolute; top: .13rem; left: .13rem; width: .74rem; height: .74rem; border-radius: 999px; background: white; box-shadow: 0 1px 2px rgb(15 23 42 / .18); }
      .lms-test-question-drawer footer { border-top: 1px solid rgb(226 232 240); }
      .lms-multiple-choice-question-drawer footer { justify-content: flex-start; padding-inline: 3rem; }
      .lms-test-question-drawer footer .lms-builder-primary:disabled { border-color: rgb(148 163 184); background: white; color: rgb(148 163 184); box-shadow: none; opacity: 1; }
      .lms-test-question-drawer footer .lms-builder-primary:not(:disabled) { box-shadow: none; }
      .lms-test-ordering-list { display: grid; gap: 1rem; }
      .lms-test-ordering-row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .75rem; min-height: 3.6rem; border: 1px solid rgb(203 213 225); border-radius: .2rem; padding: .35rem .55rem .35rem .85rem; color: rgb(15 23 42); }
      .lms-test-ordering-row:focus-within { border-color: rgb(99 102 241); box-shadow: 0 0 0 3px rgb(99 102 241 / .12); }
      .lms-test-ordering-row > mat-icon { width: 1.15rem; height: 1.15rem; color: rgb(71 85 105); font-size: 1.15rem; line-height: 1.15rem; }
      .lms-test-ordering-row input { min-width: 0; border: 0; outline: 0; background: transparent; color: rgb(15 23 42); font: inherit; font-size: .92rem; padding: .65rem .25rem; }
      .lms-test-ordering-row input::placeholder { color: rgb(100 116 139); opacity: 1; }
      .lms-test-ordering-row > button { display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border-radius: .45rem; color: rgb(100 116 139); }
      .lms-test-ordering-row > button:hover,
      .lms-test-ordering-row > button:focus-visible { background: rgb(248 250 252); color: rgb(15 23 42); outline: none; }
      .lms-test-ordering-row > button mat-icon { width: 1rem; height: 1rem; font-size: 1rem; line-height: 1rem; }
      .lms-test-matching-list { display: grid; gap: 1.8rem; }
      .lms-test-matching-pair { display: grid; grid-template-columns: minmax(0, 1fr) 1.25rem minmax(0, 1fr) auto; align-items: center; gap: .65rem; }
      .lms-test-matching-card { position: relative; display: grid; align-items: center; min-height: 5.9rem; border: 1px solid rgb(100 116 139); border-radius: .2rem; background: white; padding: .75rem 1rem; }
      .lms-test-matching-card:focus-within { border-color: rgb(99 102 241); box-shadow: 0 0 0 3px rgb(99 102 241 / .12); }
      .lms-test-matching-card:first-child::after,
      .lms-test-matching-card:nth-child(3)::before { content: ""; position: absolute; top: 50%; width: .75rem; height: 3rem; transform: translateY(-50%); border: 1px solid rgb(100 116 139); background: white; }
      .lms-test-matching-card:first-child::after { right: -.75rem; border-left: 0; border-radius: 0 .25rem .25rem 0; }
      .lms-test-matching-card:nth-child(3)::before { left: -.75rem; border-right: 0; border-radius: .25rem 0 0 .25rem; }
      .lms-test-matching-card input { min-width: 0; border: 0; outline: 0; background: transparent; color: rgb(15 23 42); font: inherit; font-size: .92rem; padding: .65rem .25rem; }
      .lms-test-matching-card input::placeholder { color: rgb(100 116 139); opacity: 1; }
      .lms-test-matching-connector { width: 100%; height: 1px; background: transparent; }
      .lms-test-matching-pair > button { display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border-radius: .45rem; color: rgb(100 116 139); }
      .lms-test-matching-pair > button:hover,
      .lms-test-matching-pair > button:focus-visible { background: rgb(248 250 252); color: rgb(15 23 42); outline: none; }
      .lms-test-matching-pair > button mat-icon { width: 1rem; height: 1rem; font-size: 1rem; line-height: 1rem; }
      .lms-free-text-threshold { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; color: rgb(15 23 42); font-size: .9rem; line-height: 1.45; }
      .lms-free-text-threshold input { width: 5.6rem; border: 0; border-radius: .2rem; background: rgb(241 245 249); color: rgb(15 23 42); font: inherit; font-weight: 800; padding: .75rem .9rem; }
      .lms-free-text-threshold input:focus { outline: 2px solid rgb(99 102 241); outline-offset: 1px; }
      .lms-free-text-rules { display: grid; gap: .7rem; }
      .lms-free-text-rules h4 { display: flex; align-items: center; gap: .35rem; margin: 0; color: rgb(15 23 42); font-size: .86rem; font-weight: 900; }
      .lms-free-text-rules h4 mat-icon { width: 1rem; height: 1rem; color: rgb(79 70 229); font-size: 1rem; line-height: 1rem; }
      .lms-free-text-rule-card { display: flex; flex-wrap: wrap; align-items: center; gap: .8rem .7rem; border-radius: .2rem; background: rgb(199 210 254); padding: .75rem .8rem; color: rgb(15 23 42); }
      .lms-free-text-rule-card label { display: inline-flex; align-items: center; gap: .65rem; min-width: 0; }
      .lms-free-text-rule-card span { white-space: nowrap; }
      .lms-free-text-rule-card input,
      .lms-free-text-rule-card select { min-height: 2.55rem; border: 1px solid transparent; border-radius: .2rem; background: white; color: rgb(15 23 42); font: inherit; padding: .45rem .75rem; }
      .lms-free-text-rule-card input { width: min(20rem, 100%); min-width: 12rem; }
      .lms-free-text-rule-card select { min-width: 5rem; }
      .lms-free-text-rule-card input:focus,
      .lms-free-text-rule-card select:focus { border-color: rgb(79 70 229); outline: 2px solid rgb(79 70 229); outline-offset: 1px; }
      .lms-free-text-rule-card input::placeholder { color: rgb(100 116 139); opacity: 1; }
      .lms-import-question-drawer { width: min(46rem, 100%); }
      .lms-existing-question-drawer { width: min(44rem, 100%); }
      .lms-import-field { display: grid; gap: .55rem; color: rgb(15 23 42); font-size: .86rem; font-weight: 850; }
      .lms-import-field select,
      .lms-import-field textarea { width: 100%; border: 0; border-radius: .25rem; background: rgb(248 250 252); color: rgb(15 23 42); font: inherit; font-size: .92rem; padding: .8rem .9rem; outline: 1px solid transparent; }
      .lms-import-field select:focus,
      .lms-import-field textarea:focus { outline: 2px solid rgb(99 102 241); outline-offset: 1px; }
      .lms-import-field textarea { min-height: 10rem; resize: vertical; line-height: 1.5; }
      .lms-import-validation-row { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; }
      .lms-import-validate { display: inline-flex; align-items: center; gap: .45rem; min-height: 2.55rem; border: 1px solid rgb(148 163 184); border-radius: .25rem; background: white; color: rgb(71 85 105); padding: .45rem .75rem; font-size: .82rem; font-weight: 750; }
      .lms-import-validate:disabled { cursor: not-allowed; opacity: .48; }
      .lms-import-validate:not(:disabled):hover,
      .lms-import-validate:not(:disabled):focus-visible { border-color: rgb(99 102 241); color: rgb(67 56 202); outline: none; }
      .lms-import-validate mat-icon { width: 1rem; height: 1rem; font-size: 1rem; line-height: 1rem; }
      .lms-import-message,
      .lms-import-error { margin: 0; font-size: .78rem; font-weight: 750; }
      .lms-import-message { color: rgb(21 128 61); }
      .lms-import-error { color: rgb(185 28 28); }
      .lms-import-cheatsheet-list { display: grid; gap: 1rem; }
      .lms-import-cheatsheet { border: 1px solid rgb(203 213 225); border-radius: .25rem; background: white; }
      .lms-import-cheatsheet-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem 1.4rem; color: rgb(15 23 42); text-align: start; }
      .lms-import-cheatsheet-toggle:hover,
      .lms-import-cheatsheet-toggle:focus-visible { background: rgb(248 250 252); outline: none; }
      .lms-import-cheatsheet-toggle strong { font-size: .96rem; font-weight: 900; }
      .lms-import-cheatsheet-toggle span { font-weight: 600; }
      .lms-import-cheatsheet-toggle mat-icon { width: 1.2rem; height: 1.2rem; font-size: 1.2rem; line-height: 1.2rem; }
      .lms-import-cheatsheet-body { display: grid; gap: .8rem; padding: 0 1.4rem 1.25rem; color: rgb(15 23 42); font-size: .86rem; line-height: 1.55; }
      .lms-import-cheatsheet-body p,
      .lms-import-cheatsheet-body ul { margin: 0; }
      .lms-import-cheatsheet-body ul { padding-inline-start: 1.35rem; }
      .lms-import-cheatsheet-body pre { overflow: auto; margin: 0; border-radius: .25rem; background: rgb(248 250 252); color: rgb(15 23 42); padding: .9rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .82rem; line-height: 1.45; white-space: pre-wrap; }
      .lms-import-copy { justify-self: start; display: inline-flex; align-items: center; gap: .55rem; color: rgb(67 56 202); font-size: .82rem; font-weight: 750; }
      .lms-import-copy:hover,
      .lms-import-copy:focus-visible { color: rgb(49 46 129); outline: none; }
      .lms-import-copy mat-icon { width: 1rem; height: 1rem; font-size: 1rem; line-height: 1rem; }
      .lms-existing-question-drawer .lms-test-question-drawer-body { gap: 1rem; padding-block-start: 1.8rem; }
      .lms-existing-question-toolbar { display: flex; align-items: center; gap: 1.25rem; }
      .lms-existing-question-search { width: min(16.5rem, 100%); min-height: 2.5rem; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: .5rem; border-radius: .3rem; background: rgb(248 250 252); padding: 0 .65rem 0 .85rem; }
      .lms-existing-question-search:focus-within { box-shadow: 0 0 0 2px rgb(99 102 241 / .28); }
      .lms-existing-question-search input { min-width: 0; border: 0; outline: 0; background: transparent; color: rgb(15 23 42); font: inherit; font-size: .82rem; }
      .lms-existing-question-search input::placeholder { color: rgb(15 23 42); opacity: 1; font-style: italic; }
      .lms-existing-question-search mat-icon,
      .lms-existing-filter-button mat-icon { width: 1.25rem; height: 1.25rem; color: rgb(15 23 42); font-size: 1.25rem; line-height: 1.25rem; }
      .lms-existing-filter-button { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: .3rem; color: rgb(15 23 42); }
      .lms-existing-filter-button:hover,
      .lms-existing-filter-button:focus-visible { background: rgb(248 250 252); outline: none; }
      .lms-existing-question-table-shell { min-height: 0; overflow: auto; border-radius: .25rem; background: white; }
      .lms-existing-question-table { width: 100%; min-width: 40rem; border-collapse: collapse; color: rgb(15 23 42); font-size: .82rem; }
      .lms-existing-question-table thead th { height: 3.4rem; border-bottom: 1px solid rgb(148 163 184); background: rgb(248 250 252); color: rgb(15 23 42); padding: 0 1.5rem; text-align: start; font-weight: 850; }
      .lms-existing-question-table th:nth-child(1) { width: 34%; }
      .lms-existing-question-table th:nth-child(2) { width: 10%; }
      .lms-existing-question-table th:nth-child(3) { width: 12%; }
      .lms-existing-question-table th:nth-child(4) { width: 34%; }
      .lms-existing-question-table th:last-child { width: 4rem; }
      .lms-existing-question-table th mat-icon { width: 1rem; height: 1rem; vertical-align: middle; font-size: 1rem; line-height: 1rem; }
      .lms-existing-question-table tbody tr { background: white; }
      .lms-existing-question-table tbody tr:nth-child(4n + 1),
      .lms-existing-question-table tbody tr:nth-child(4n + 2) { background: rgb(250 250 251); }
      .lms-existing-question-table td { height: 3.35rem; padding: 0 1.5rem; vertical-align: middle; }
      .lms-existing-question-cell { min-width: 0; display: flex; align-items: center; gap: .7rem; }
      .lms-existing-question-cell mat-icon { width: 1.15rem; height: 1.15rem; flex: 0 0 auto; color: rgb(15 23 42); font-size: 1.15rem; line-height: 1.15rem; }
      .lms-existing-question-cell span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 750; }
      .lms-existing-added-switch { position: relative; width: 2.05rem; height: 1.1rem; border-radius: 999px; background: rgb(148 163 184); transition: background .16s ease; }
      .lms-existing-added-switch span { position: absolute; inset-block-start: .15rem; inset-inline-start: .15rem; width: .8rem; height: .8rem; border-radius: 999px; background: white; box-shadow: 0 1px 2px rgb(15 23 42 / .2); transition: transform .16s ease; }
      .lms-existing-added-switch.is-added { background: rgb(79 0 229); }
      .lms-existing-added-switch.is-added span { transform: translateX(.95rem); }
      .lms-existing-added-switch:focus-visible { outline: 2px solid rgb(99 102 241); outline-offset: 2px; }
      .lms-existing-preview-button { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .3rem; color: rgb(15 23 42); }
      .lms-existing-preview-button:hover,
      .lms-existing-preview-button:focus-visible { background: rgb(241 245 249); outline: none; }
      .lms-existing-preview-button mat-icon { width: 1rem; height: 1rem; font-size: 1rem; line-height: 1rem; }
      .lms-existing-question-preview-drawer { position: absolute; inset-block: 0; inset-inline-end: 0; z-index: 2; width: min(32rem, 100%); border-inline-start: 1px solid rgb(226 232 240); box-shadow: -14px 0 30px rgb(15 23 42 / .12); }
      .lms-existing-question-preview-drawer .lms-test-question-drawer-body { gap: 1.25rem; }
      .lms-existing-preview-summary { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: .85rem; border: 1px solid rgb(226 232 240); border-radius: .45rem; background: rgb(248 250 252); padding: .9rem; }
      .lms-existing-preview-summary > span { display: grid; place-items: center; width: 2.35rem; height: 2.35rem; border-radius: .35rem; background: rgb(238 242 255); color: rgb(79 70 229); }
      .lms-existing-preview-summary mat-icon { width: 1.2rem; height: 1.2rem; font-size: 1.2rem; line-height: 1.2rem; }
      .lms-existing-preview-summary strong { display: block; overflow-wrap: anywhere; color: rgb(15 23 42); font-size: .92rem; font-weight: 900; line-height: 1.35; }
      .lms-existing-preview-summary p { margin: .2rem 0 0; color: rgb(71 85 105); font-size: .76rem; font-weight: 700; }
      .lms-existing-preview-section { display: grid; gap: .65rem; }
      .lms-existing-preview-section h4 { margin: 0; color: rgb(15 23 42); font-size: .82rem; font-weight: 900; }
      .lms-existing-preview-section > p { margin: 0; color: rgb(30 41 59); font-size: .86rem; line-height: 1.55; overflow-wrap: anywhere; }
      .lms-existing-preview-answer-list { display: grid; gap: .6rem; }
      .lms-existing-preview-answer { display: grid; grid-template-columns: 1.45rem minmax(0, 1fr) auto; align-items: center; gap: .65rem; min-height: 2.75rem; border: 1px solid rgb(226 232 240); border-radius: .35rem; background: white; padding: .55rem .7rem; }
      .lms-existing-preview-answer > span:first-child { display: grid; place-items: center; width: 1.45rem; height: 1.45rem; border-radius: 999px; background: rgb(241 245 249); color: rgb(30 41 59); font-size: .72rem; font-weight: 900; }
      .lms-existing-preview-answer p { min-width: 0; margin: 0; color: rgb(30 41 59); font-size: .84rem; line-height: 1.45; overflow-wrap: anywhere; }
      .lms-existing-preview-answer > mat-icon { width: 1.05rem; height: 1.05rem; color: rgb(21 128 61); font-size: 1.05rem; line-height: 1.05rem; }
      .lms-existing-preview-answer.is-correct { border-color: rgb(134 239 172); background: rgb(240 253 244); }
      .lms-existing-preview-answer.is-pair { grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); }
      .lms-existing-preview-answer.is-pair span { min-width: 0; color: rgb(30 41 59); font-size: .84rem; font-weight: 750; overflow-wrap: anywhere; }
      .lms-existing-preview-answer.is-pair mat-icon { width: 1rem; height: 1rem; color: rgb(100 116 139); font-size: 1rem; line-height: 1rem; }
      .lms-existing-question-footer { min-height: 3.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: auto; padding: .2rem 0 0; }
      .lms-existing-question-footer button { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: .35rem; background: rgb(224 224 255); color: rgb(15 23 42); }
      .lms-existing-question-footer button:hover,
      .lms-existing-question-footer button:focus-visible { background: rgb(205 205 255); outline: none; }
      .lms-existing-question-footer button mat-icon { width: 1.15rem; height: 1.15rem; font-size: 1.15rem; line-height: 1.15rem; }
      .lms-existing-question-footer span { color: rgb(15 23 42); font-size: .8rem; font-weight: 750; }
      .lms-existing-question-empty { min-height: 18rem; display: grid; place-content: center; justify-items: center; gap: .45rem; color: rgb(71 85 105); text-align: center; }
      .lms-existing-question-empty mat-icon { width: 3rem; height: 3rem; color: rgb(99 102 241); font-size: 3rem; line-height: 3rem; }
      .lms-existing-question-empty strong { color: rgb(15 23 42); font-size: .95rem; }
      .lms-existing-question-empty p { max-width: 24rem; margin: 0; font-size: .78rem; line-height: 1.5; }
      .lms-test-question-error,
      .lms-test-question-note { margin: 0; padding-inline-start: 2.35rem; font-size: .8rem; line-height: 1.6; }
      .lms-test-question-error { color: rgb(220 38 38); }
      .lms-test-question-note { max-width: 44rem; color: rgb(71 85 105); font-style: italic; }
      .lms-test-question-drawer footer { justify-content: flex-start; border-top: 1px solid rgb(226 232 240); background: rgb(248 250 252); }
      .lms-webpage-unit-editor { min-height: min(46rem, calc(100vh - 15rem)); display: grid; grid-template-rows: auto minmax(24rem, 1fr); overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: .95rem; background: white; box-shadow: 0 1px 2px rgb(15 23 42 / .04); }
      .lms-webpage-url-editor { display: grid; gap: .55rem; border-bottom: 1px solid rgb(226 232 240); padding: 1rem; }
      .lms-webpage-url-editor > label { color: rgb(30 41 59); font-size: .76rem; font-weight: 850; }
      .lms-webpage-url-control { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .65rem; min-height: 3rem; border: 1px solid rgb(203 213 225); border-radius: .75rem; background: rgb(248 250 252); padding: .25rem .35rem .25rem .85rem; transition: border-color .16s ease, box-shadow .16s ease, background .16s ease; }
      .lms-webpage-url-control:focus-within { border-color: rgb(99 102 241); background: white; box-shadow: 0 0 0 3px rgb(99 102 241 / .14); }
      .lms-webpage-url-control > mat-icon { width: 1.15rem; height: 1.15rem; color: rgb(71 85 105); font-size: 1.15rem; }
      .lms-webpage-url-control input { min-width: 0; border: 0; outline: 0; background: transparent; color: rgb(15 23 42); font: inherit; font-size: .9rem; }
      .lms-webpage-url-control input::placeholder { color: rgb(71 85 105); font-style: italic; opacity: 1; }
      .lms-webpage-url-control button { display: grid; width: 2.35rem; height: 2.35rem; place-items: center; border-radius: .6rem; background: rgb(79 70 229); color: white; transition: background .16s ease, transform .16s ease; }
      .lms-webpage-url-control button:hover { background: rgb(67 56 202); transform: translateY(-1px); }
      .lms-webpage-url-control button:focus-visible { outline: 3px solid rgb(99 102 241 / .24); outline-offset: 2px; }
      .lms-webpage-url-control button mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; }
      .lms-webpage-url-editor > p { display: flex; align-items: center; gap: .4rem; margin: 0; color: rgb(71 85 105); font-size: .76rem; line-height: 1.4; }
      .lms-webpage-url-editor > p mat-icon { width: 1rem; height: 1rem; flex: 0 0 auto; font-size: 1rem; }
      .lms-webpage-url-editor > p.lms-webpage-url-error { color: rgb(185 28 28); font-weight: 750; }
      .lms-webpage-preview { min-height: 0; background: rgb(248 250 252); }
      .lms-webpage-preview iframe { display: block; width: 100%; height: 100%; min-height: min(38rem, calc(100vh - 25rem)); border: 0; background: white; }
      .lms-webpage-preview-empty { min-height: min(38rem, calc(100vh - 25rem)); display: grid; place-content: center; justify-items: center; gap: .45rem; padding: 2rem; color: rgb(71 85 105); text-align: center; }
      .lms-webpage-preview-empty mat-icon { width: 2.5rem; height: 2.5rem; border-radius: .75rem; background: rgb(238 242 255); color: rgb(79 70 229); padding: .6rem; font-size: 1.3rem; }
      .lms-webpage-preview-empty strong { color: rgb(30 41 59); font-size: .95rem; }
      .lms-webpage-preview-empty span { max-width: 34rem; font-size: .8rem; line-height: 1.5; }
      .lms-iframe-unit-editor { min-height: min(46rem, calc(100vh - 15rem)); display: grid; grid-template-rows: auto auto minmax(30rem, 1fr); align-content: start; gap: 1rem; padding: clamp(1rem, 2vw, 1.5rem); }
      .lms-iframe-url-editor { display: grid; gap: .55rem; }
      .lms-iframe-url-control { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: .5rem; min-height: 3rem; border: 1px solid rgb(226 232 240); border-radius: .35rem; background: rgb(248 250 252); padding: .25rem .35rem .25rem .75rem; transition: border-color .16s ease, box-shadow .16s ease, background .16s ease; }
      .lms-iframe-url-control:focus-within { border-color: rgb(99 102 241); background: white; box-shadow: 0 0 0 3px rgb(99 102 241 / .14); }
      .lms-iframe-url-control input { min-width: 0; border: 0; outline: 0; background: transparent; color: rgb(15 23 42); font: inherit; font-size: .9rem; font-style: italic; }
      .lms-iframe-url-control input::placeholder { color: rgb(71 85 105); opacity: 1; }
      .lms-iframe-url-control button { display: grid; width: 2.35rem; height: 2.35rem; place-items: center; border-radius: .35rem; color: rgb(30 41 59); transition: background .16s ease, color .16s ease; }
      .lms-iframe-url-control button:hover,
      .lms-iframe-url-control button:focus-visible { background: rgb(238 242 255); color: rgb(67 56 202); outline: none; }
      .lms-iframe-url-control button mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; }
      .lms-iframe-url-editor > p { display: flex; align-items: center; gap: .4rem; margin: 0; color: rgb(185 28 28); font-size: .76rem; font-weight: 750; }
      .lms-iframe-url-editor > p mat-icon { width: 1rem; height: 1rem; flex: 0 0 auto; font-size: 1rem; }
      .lms-iframe-preview { min-height: min(36rem, calc(100vh - 24rem)); overflow: hidden; border: 1px solid rgb(241 245 249); border-radius: .35rem; background: white; }
      .lms-iframe-preview iframe { display: block; width: 100%; height: 100%; min-height: min(36rem, calc(100vh - 24rem)); border: 0; background: white; }
      .lms-audio-unit-editor { min-height: min(46rem, calc(100vh - 15rem)); display: grid; align-content: start; gap: 1rem; padding: clamp(1rem, 2vw, 1.5rem); }
      .lms-media-editor-kicker { margin: 0; color: rgb(148 163 184); font-size: .92rem; }
      .lms-audio-source-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; min-height: min(34rem, calc(100vh - 24rem)); }
      .lms-audio-source-card { display: grid; place-content: center; justify-items: center; gap: .35rem; min-height: 22rem; border: 0; border-radius: .15rem; background: rgb(248 250 252); color: rgb(71 85 105); padding: 2rem; text-align: center; cursor: pointer; transition: background .16s ease, color .16s ease, box-shadow .16s ease; }
      .lms-audio-source-card:hover,
      .lms-audio-source-card:focus-visible { background: rgb(241 245 249); color: rgb(30 41 59); outline: none; box-shadow: inset 0 0 0 2px rgb(165 180 252); }
      .lms-audio-source-card input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .lms-audio-source-card mat-icon { width: 3rem; height: 3rem; margin-bottom: .6rem; color: rgb(71 85 105); font-size: 3rem; line-height: 3rem; }
      .lms-audio-source-card strong { font-size: 1rem; font-weight: 500; }
      .lms-audio-source-card span { font-size: .72rem; }
      .lms-audio-preview { display: grid; grid-template-columns: minmax(12rem, 1fr) minmax(0, 1fr) auto; align-items: center; gap: 1rem; border: 1px solid rgb(226 232 240); border-radius: .75rem; background: white; padding: .85rem 1rem; }
      .lms-audio-preview audio { width: 100%; }
      .lms-audio-preview > div { min-width: 0; }
      .lms-audio-preview strong,
      .lms-audio-preview span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .lms-audio-preview strong { color: rgb(15 23 42); font-size: .8rem; }
      .lms-audio-preview span { margin-top: .2rem; color: rgb(71 85 105); font-size: .7rem; }
      .lms-audio-preview button { color: rgb(67 56 202); font-size: .72rem; font-weight: 900; }
      .lms-document-unit-editor { min-height: min(46rem, calc(100vh - 15rem)); display: grid; align-content: start; gap: 1rem; padding: clamp(1rem, 2vw, 1.5rem); }
      .lms-document-source-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; min-height: min(34rem, calc(100vh - 24rem)); }
      .lms-document-source-card { position: relative; display: grid; place-content: center; justify-items: center; gap: .35rem; min-height: 22rem; border: 0; border-radius: .15rem; background: rgb(248 250 252); color: rgb(71 85 105); padding: 2rem; text-align: center; cursor: pointer; transition: background .16s ease, color .16s ease, box-shadow .16s ease; }
      .lms-document-source-card:hover,
      .lms-document-source-card:focus-visible { background: rgb(79 0 229); color: white; outline: none; box-shadow: inset 0 0 0 2px rgb(67 0 202); }
      .lms-document-source-card input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .lms-document-source-card mat-icon { width: 3rem; height: 3rem; margin-bottom: .6rem; color: currentColor; font-size: 3rem; line-height: 3rem; }
      .lms-document-source-card strong { font-size: 1rem; font-weight: 500; }
      .lms-document-source-card span { font-size: .72rem; }
      .lms-document-source-card small { position: absolute; inset-block-start: calc(50% - 6.5rem); max-width: 17rem; border-radius: .35rem; background: rgb(15 23 42); color: white; padding: .55rem .7rem; font-size: .68rem; line-height: 1.35; opacity: 0; pointer-events: none; transform: translateY(.25rem); transition: opacity .16s ease, transform .16s ease; }
      .lms-document-source-card:hover small,
      .lms-document-source-card:focus-within small { opacity: 1; transform: translateY(0); }
      .lms-document-slideshare-panel { min-height: min(34rem, calc(100vh - 24rem)); display: grid; align-content: start; gap: 1rem; border: 1px solid rgb(226 232 240); border-radius: .9rem; background: rgb(248 250 252); padding: 1.25rem; }
      .lms-document-slideshare-panel header { display: flex; align-items: start; justify-content: space-between; gap: 1rem; }
      .lms-document-slideshare-panel header div,
      .lms-document-slideshare-panel label { display: grid; gap: .25rem; }
      .lms-document-slideshare-panel header strong,
      .lms-document-slideshare-panel label > span { color: rgb(15 23 42); font-size: .82rem; font-weight: 850; }
      .lms-document-slideshare-panel header span { color: rgb(71 85 105); font-size: .75rem; }
      .lms-document-slideshare-panel header button { color: rgb(67 56 202); font-size: .75rem; font-weight: 850; }
      .lms-document-slideshare-panel label > div { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .55rem; border: 1px solid rgb(203 213 225); border-radius: .7rem; background: white; padding: .35rem .4rem .35rem .75rem; }
      .lms-document-slideshare-panel label > div:focus-within { border-color: rgb(99 102 241); box-shadow: 0 0 0 3px rgb(99 102 241 / .14); }
      .lms-document-slideshare-panel input { min-width: 0; border: 0; outline: 0; background: transparent; color: rgb(15 23 42); font: inherit; font-size: .82rem; }
      .lms-document-slideshare-panel label button { border-radius: .55rem; background: rgb(79 70 229); color: white; padding: .65rem .85rem; font-size: .75rem; font-weight: 850; }
      .lms-document-preview-shell { min-height: min(38rem, calc(100vh - 22rem)); overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: .4rem; background: white; }
      .lms-document-preview-shell > header { min-height: 3.1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .65rem .85rem; }
      .lms-document-preview-shell > header > div { min-width: 0; display: flex; align-items: center; gap: .55rem; color: rgb(51 65 85); }
      .lms-document-preview-shell > header > div > mat-icon { flex: 0 0 auto; color: rgb(79 70 229); }
      .lms-document-preview-shell > header span { min-width: 0; display: grid; gap: .1rem; }
      .lms-document-preview-shell > header strong,
      .lms-document-preview-shell > header small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .lms-document-preview-shell > header strong { color: rgb(15 23 42); font-size: .78rem; }
      .lms-document-preview-shell > header small { max-width: min(60vw, 42rem); color: rgb(71 85 105); font-size: .67rem; }
      .lms-document-preview-shell > header button { display: inline-flex; align-items: center; gap: .35rem; flex: 0 0 auto; border-radius: .5rem; color: rgb(67 56 202); padding: .45rem .55rem; font-size: .74rem; font-weight: 850; }
      .lms-document-preview-shell > header button:hover,
      .lms-document-preview-shell > header button:focus-visible { background: rgb(238 242 255); outline: none; }
      .lms-document-preview-shell > header button mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-document-preview-stage { position: relative; min-height: min(34rem, calc(100vh - 26rem)); overflow: auto; border-top: 1px solid rgb(226 232 240); background: rgb(241 245 249); }
      .lms-document-preview-stage > iframe { display: block; width: 100%; height: min(42rem, calc(100vh - 22rem)); border: 0; background: white; }
      .lms-document-preview-stage.is-presentation { overflow: hidden; aspect-ratio: 16 / 9; min-height: 0; background: rgb(15 23 42); }
      .lms-document-preview-stage.is-presentation > iframe { height: 100%; min-height: 30rem; }
      .lms-document-render-host { min-height: inherit; padding: 1rem; }
      .lms-document-render-host ::ng-deep .docx-wrapper { background: rgb(226 232 240); padding: 1.25rem 0; }
      .lms-document-render-host ::ng-deep .docx { margin: 0 auto 1rem; box-shadow: 0 2px 7px rgb(15 23 42 / .16); }
      .lms-document-render-host ::ng-deep .pptx-preview-wrapper,
      .lms-document-render-host ::ng-deep .pptx-wrapper { margin-inline: auto; }
      .lms-document-render-host ::ng-deep table { width: max-content; min-width: 100%; border-collapse: collapse; background: white; color: rgb(15 23 42); font-size: .76rem; }
      .lms-document-render-host ::ng-deep th,
      .lms-document-render-host ::ng-deep td { border: 1px solid rgb(203 213 225); padding: .45rem .6rem; text-align: start; }
      .lms-document-preview-state { min-height: min(34rem, calc(100vh - 26rem)); display: grid; place-content: center; justify-items: center; gap: .45rem; padding: 2rem; color: rgb(71 85 105); text-align: center; }
      .lms-document-preview-state mat-icon { width: 3rem; height: 3rem; color: rgb(79 70 229); font-size: 3rem; line-height: 3rem; }
      .lms-document-preview-state strong { color: rgb(30 41 59); font-size: .95rem; }
      .lms-document-preview-state span { max-width: 34rem; font-size: .78rem; line-height: 1.5; }
      .lms-document-preview-error { position: absolute; inset-block-end: 1rem; inset-inline: 1rem; justify-content: center; border-radius: .6rem; background: rgb(254 242 242); padding: .75rem; }
      .lms-document-upload-summary { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .8rem; border: 1px solid rgb(226 232 240); border-radius: .75rem; background: white; padding: .85rem 1rem; }
      .lms-document-upload-summary > mat-icon { color: rgb(79 70 229); }
      .lms-document-upload-summary > div { min-width: 0; }
      .lms-document-upload-summary strong,
      .lms-document-upload-summary span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .lms-document-upload-summary strong { color: rgb(15 23 42); font-size: .8rem; }
      .lms-document-upload-summary span { margin-top: .2rem; color: rgb(71 85 105); font-size: .7rem; }
      .lms-document-upload-summary button { color: rgb(67 56 202); font-size: .72rem; font-weight: 900; }
      .lms-editor-section-heading { display: flex; align-items: start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
      .lms-editor-section-heading h3 { margin: 0; color: rgb(15 23 42); font-size: 1rem; font-weight: 900; }
      .lms-editor-section-heading p { margin: .25rem 0 0; color: rgb(71 85 105); font-size: .78rem; line-height: 1.45; }
      .lms-editor-section-heading > span { border-radius: 999px; background: rgb(245 243 255); color: rgb(91 33 182); padding: .35rem .6rem; font-size: .65rem; font-weight: 900; white-space: nowrap; }
      .lms-editor-section-heading button { display: inline-flex; align-items: center; gap: .35rem; color: rgb(67 56 202); font-size: .75rem; font-weight: 900; }
      .lms-video-source-grid { display: grid; grid-template-columns: repeat(2, minmax(16rem, 1fr)); gap: .85rem; }
      .lms-builder-canvas.is-full-unit-editor .lms-video-source-panel { min-height: min(46rem, calc(100vh - 15rem)); display: grid; align-content: start; }
      .lms-builder-canvas.is-full-unit-editor .lms-video-source-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); grid-auto-rows: minmax(12rem, auto); }
      .lms-builder-canvas.is-full-unit-editor .lms-video-source-card:nth-child(1),
      .lms-builder-canvas.is-full-unit-editor .lms-video-source-card:nth-child(2) { grid-column: span 3; }
      .lms-builder-canvas.is-full-unit-editor .lms-video-source-card:nth-child(n + 3) { grid-column: span 2; }
      .lms-video-source-card { display: grid; gap: .45rem; min-height: 8.5rem; border: 1px solid rgb(203 213 225); border-radius: .8rem; background: white; padding: 1rem; color: rgb(15 23 42); text-align: start; transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease; }
      .lms-builder-canvas.is-full-unit-editor .lms-video-source-card { place-content: center; justify-items: center; text-align: center; }
      .lms-builder-canvas.is-full-unit-editor .lms-video-source-card mat-icon { width: 3.25rem; height: 3.25rem; display: grid; place-items: center; padding: .8rem; font-size: 1.65rem; line-height: 1.65rem; }
      .lms-video-source-card:hover,
      .lms-video-source-card:focus-visible { border-color: rgb(129 140 248); box-shadow: 0 4px 10px rgb(79 70 229 / .1); outline: none; transform: translateY(-1px); }
      .lms-video-source-card mat-icon { width: 2rem; height: 2rem; border-radius: .7rem; background: rgb(238 242 255); color: rgb(79 70 229); padding: .42rem; font-size: 1.15rem; line-height: 1.15rem; }
      .lms-video-source-card strong { font-size: .88rem; font-weight: 900; }
      .lms-video-source-card span { color: rgb(71 85 105); font-size: .76rem; line-height: 1.45; }
      .lms-video-config-panel { display: grid; gap: .85rem; border: 1px solid rgb(226 232 240); border-radius: .85rem; background: rgb(248 250 252); padding: 1rem; }
      .lms-video-config-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
      .lms-video-config-head strong { color: rgb(15 23 42); font-size: .9rem; }
      .lms-video-config-head button { color: rgb(67 56 202); font-size: .72rem; font-weight: 900; }
      .lms-builder-field { display: grid; gap: .45rem; }
      .lms-builder-field input,
      .lms-builder-field select,
      .lms-builder-field textarea { width: 100%; border: 1px solid rgb(203 213 225); border-radius: .7rem; background: white; padding: .7rem .8rem; color: rgb(15 23 42); font: inherit; font-size: .8rem; outline: none; }
      .lms-builder-field textarea { resize: vertical; }
      .lms-builder-field input:focus,
      .lms-builder-field select:focus,
      .lms-builder-field textarea:focus { border-color: rgb(99 102 241); box-shadow: 0 0 0 3px rgb(99 102 241 / .16); }
      .lms-builder-error { display: inline-flex; align-items: center; gap: .35rem; margin: 0; color: rgb(185 28 28); font-size: .75rem; font-weight: 800; }
      .lms-builder-video-preview { aspect-ratio: 16 / 9; overflow: hidden; border-radius: .85rem; background: rgb(15 23 42); }
      .lms-builder-video-preview iframe { width: 100%; height: 100%; border: 0; }
      .lms-builder-upload-drop { display: grid; place-items: center; gap: .45rem; min-height: 10rem; border: 1px dashed rgb(148 163 184); border-radius: .85rem; background: white; color: rgb(71 85 105); padding: 1.25rem; text-align: center; cursor: pointer; }
      .lms-builder-upload-drop:hover,
      .lms-builder-upload-drop:focus-within { border-color: rgb(99 102 241); background: rgb(238 242 255); }
      .lms-builder-upload-drop input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
      .lms-builder-upload-drop mat-icon { color: rgb(79 70 229); font-size: 2rem; }
      .lms-builder-upload-drop strong { color: rgb(15 23 42); font-size: .9rem; }
      .lms-builder-upload-drop span { font-size: .75rem; line-height: 1.45; }
      .lms-builder-upload-progress { display: grid; grid-template-columns: minmax(0, 1fr) 12rem auto; gap: .75rem; align-items: center; }
      .lms-builder-upload-progress div { display: grid; gap: .15rem; }
      .lms-builder-upload-progress strong { color: rgb(15 23 42); font-size: .8rem; }
      .lms-builder-upload-progress span { color: rgb(71 85 105); font-size: .7rem; }
      .lms-builder-upload-progress progress { width: 100%; accent-color: rgb(79 70 229); }
      .lms-builder-upload-progress button { color: rgb(67 56 202); font-size: .72rem; font-weight: 900; }
      .lms-recorder-state { display: grid; justify-items: center; gap: .45rem; border-radius: .85rem; background: white; padding: 1.35rem; color: rgb(71 85 105); text-align: center; }
      .lms-recorder-state mat-icon { display: grid; place-items: center; width: 2.6rem; height: 2.6rem; border-radius: .8rem; background: rgb(238 242 255); color: rgb(79 70 229); font-size: 1.35rem; }
      .lms-recorder-state strong { color: rgb(15 23 42); font-size: .9rem; }
      .lms-recorder-state span { max-width: 34rem; font-size: .76rem; line-height: 1.5; }
      .lms-recorder-actions { display: flex; justify-content: flex-end; gap: .55rem; }
      .lms-lesson-content-divider { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: .75rem; margin: 1rem 0; color: rgb(100 116 139); font-size: .7rem; font-weight: 900; }
      .lms-lesson-content-divider span { height: 1px; background: rgb(226 232 240); }
      .lms-quick-blocks { display: flex; flex-wrap: wrap; gap: .5rem; }
      .lms-quick-blocks button { display: inline-flex; align-items: center; gap: .35rem; min-height: 2.1rem; border: 1px solid rgb(226 232 240); border-radius: 999px; background: white; color: rgb(51 65 85); padding: .45rem .65rem; font-size: .72rem; font-weight: 850; }
      .lms-quick-blocks button:hover,
      .lms-quick-blocks button:focus-visible { border-color: rgb(165 180 252); background: rgb(238 242 255); color: rgb(67 56 202); outline: none; }
      .lms-quick-blocks mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-block-editor { display: grid; gap: .65rem; }
      .lms-content-block-list { display: grid; gap: .65rem; }
      .lms-content-block { display: grid; grid-template-columns: auto auto minmax(0, 1fr) repeat(4, auto); align-items: center; gap: .55rem; border: 1px solid rgb(226 232 240); border-radius: .8rem; background: white; padding: .7rem; }
      .lms-content-block.is-selected { border-color: rgb(129 140 248); box-shadow: 0 0 0 3px rgb(99 102 241 / .12); }
      .lms-content-block > mat-icon { width: 2rem; height: 2rem; border-radius: .65rem; background: rgb(238 242 255); color: rgb(79 70 229); padding: .45rem; font-size: 1.1rem; }
      .lms-content-block strong { color: rgb(15 23 42); font-size: .82rem; }
      .lms-content-block small { display: block; margin-top: .12rem; color: rgb(100 116 139); font-size: .68rem; }
      .lms-content-block button { display: grid; place-items: center; width: 1.9rem; height: 1.9rem; border-radius: .55rem; color: rgb(100 116 139); }
      .lms-content-block button:hover:not(:disabled),
      .lms-content-block button:focus-visible { background: rgb(238 242 255); color: rgb(67 56 202); outline: none; }
      .lms-content-block button.is-danger:hover,
      .lms-content-block button.is-danger:focus-visible { background: rgb(254 226 226); color: rgb(185 28 28); }
      .lms-content-block button:disabled { opacity: .4; }
      .lms-content-block button mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-block-handle { color: rgb(148 163 184); }
      .lms-block-empty { display: grid; justify-items: center; gap: .45rem; border: 1px dashed rgb(203 213 225); border-radius: .85rem; background: rgb(248 250 252); padding: 2rem; color: rgb(71 85 105); text-align: center; }
      .lms-block-empty mat-icon { color: rgb(79 70 229); font-size: 2rem; }
      .lms-block-empty strong { color: rgb(15 23 42); font-size: .9rem; }
      .lms-block-empty p { max-width: 34rem; margin: 0; font-size: .76rem; line-height: 1.5; }
      .lms-block-editor-detail { display: grid; gap: .8rem; border: 1px solid rgb(226 232 240); border-radius: .85rem; background: rgb(248 250 252); padding: 1rem; }
      .lms-quill-editor { display: block; background: white; }
      .lms-quill-editor ::ng-deep .ql-toolbar { border-radius: .7rem .7rem 0 0; border-color: rgb(203 213 225); }
      .lms-quill-editor ::ng-deep .ql-container { min-height: 11rem; border-radius: 0 0 .7rem .7rem; border-color: rgb(203 213 225); color: rgb(15 23 42); font-family: inherit; }
      .lms-block-image-preview,
      .lms-builder-local-video { width: 100%; max-height: 24rem; border-radius: .85rem; border: 1px solid rgb(226 232 240); background: rgb(15 23 42); object-fit: contain; }
      .lms-block-embed-preview { width: 100%; aspect-ratio: 16 / 9; border: 1px solid rgb(226 232 240); border-radius: .85rem; background: rgb(15 23 42); }
      .lms-builder-file-summary { display: inline-flex; align-items: center; gap: .4rem; margin: 0; color: rgb(51 65 85); font-size: .78rem; font-weight: 800; }
      .lms-builder-file-summary mat-icon { width: 1rem; height: 1rem; color: rgb(79 70 229); font-size: 1rem; }
      .lms-quiz-answer { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: .55rem; }
      .lms-builder-field-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
      .lms-rendered-divider { width: 100%; border: 0; border-top: 1px solid rgb(203 213 225); margin: .5rem 0; }
      .lms-rendered-text { color: rgb(15 23 42); line-height: 1.65; }
      .lms-builder-inline-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .5rem; }
      .lms-builder-preview-dialog,
      .lms-builder-validation-dialog,
      .lms-builder-recording-dialog { width: min(100%, 54rem); max-height: min(90vh, 54rem); display: grid; grid-template-rows: auto minmax(0, 1fr); overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: .95rem; background: white; box-shadow: 0 24px 64px rgb(15 23 42 / .24); }
      .lms-builder-recording-dialog { width: min(100%, 46rem); gap: 1rem; padding-bottom: 1rem; }
      .lms-builder-preview-dialog header,
      .lms-builder-validation-dialog header,
      .lms-builder-recording-dialog header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid rgb(226 232 240); padding: 1rem 1.25rem; }
      .lms-builder-preview-dialog header p,
      .lms-builder-validation-dialog header p,
      .lms-builder-recording-dialog header p { margin: .2rem 0 0; color: rgb(71 85 105); font-size: .75rem; }
      .lms-builder-preview-dialog header h3,
      .lms-builder-validation-dialog header h3,
      .lms-builder-recording-dialog header h3 { margin: 0; color: rgb(15 23 42); font-size: 1rem; font-weight: 900; }
      .lms-builder-preview-dialog header button,
      .lms-builder-validation-dialog header button,
      .lms-builder-recording-dialog header button { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .55rem; color: rgb(100 116 139); }
      .lms-builder-preview-body { display: grid; gap: 1rem; overflow: auto; padding: 1.25rem; }
      .lms-preview-summary-card { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .25rem .65rem; border: 1px solid rgb(226 232 240); border-radius: .8rem; background: rgb(248 250 252); padding: .85rem; }
      .lms-preview-summary-card mat-icon { grid-row: span 2; color: rgb(79 70 229); }
      .lms-preview-summary-card strong { color: rgb(15 23 42); font-size: .85rem; }
      .lms-preview-summary-card span { color: rgb(71 85 105); font-size: .76rem; }
      .lms-builder-validation-list { display: grid; gap: .55rem; overflow: auto; padding: 1rem; }
      .lms-builder-validation-list button { display: flex; align-items: center; gap: .55rem; border: 1px solid rgb(254 202 202); border-radius: .75rem; background: rgb(254 242 242); color: rgb(153 27 27); padding: .75rem; text-align: start; font-size: .78rem; font-weight: 800; }
      .lms-recording-timer { align-self: center; border-radius: 999px; background: rgb(254 242 242); color: rgb(185 28 28); padding: .45rem .7rem; font-size: .78rem; font-weight: 900; }
      .cdk-drag-preview { box-sizing: border-box; border-radius: .8rem; box-shadow: 0 12px 28px rgb(15 23 42 / .2); }
      .cdk-drag-placeholder { opacity: .35; }
      .cdk-drop-list-dragging .lms-builder-node-row,
      .cdk-drop-list-dragging .lms-content-block { transition: transform .18s ease; }
      .lms-builder-inspector { display: grid; align-content: start; gap: 1rem; padding: 0 1rem 1rem; }
      .lms-inspector-head { margin: 0 -1rem; }
      .lms-inspector-head button { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .55rem; color: rgb(100 116 139); }
      .lms-builder-check { display: flex; align-items: center; gap: .55rem; color: rgb(51 65 85); font-size: .78rem; font-weight: 800; }
      .lms-builder-check input { accent-color: rgb(79 70 229); }
      @media (max-width: 1280px) {
        .lms-builder-shell,
        .lms-builder-shell.has-inspector { grid-template-columns: minmax(15rem, 19rem) minmax(0, 1fr); }
        .lms-builder-inspector { position: fixed; inset-block: 5rem 1rem; inset-inline-end: 1rem; z-index: 30; width: min(20rem, calc(100vw - 2rem)); box-shadow: 0 24px 64px rgb(15 23 42 / .2); }
      }
      @media (max-width: 920px) {
        .lms-course-authoring-page { min-height: auto; overflow: visible; }
        .lms-builder-header,
        .lms-builder-header-actions { flex-wrap: wrap; }
        .lms-builder-shell,
        .lms-builder-shell.has-inspector { grid-template-columns: 1fr; overflow: visible; }
        .lms-builder-curriculum,
        .lms-builder-editor { overflow: visible; }
        .lms-video-source-grid,
        .lms-builder-canvas.is-full-unit-editor .lms-video-source-grid { grid-template-columns: 1fr; grid-auto-rows: auto; }
        .lms-builder-canvas.is-full-unit-editor .lms-video-source-card:nth-child(n) { grid-column: auto; }
        .lms-audio-source-grid { grid-template-columns: 1fr; min-height: auto; }
        .lms-audio-source-card { min-height: 14rem; }
        .lms-audio-preview { grid-template-columns: 1fr; }
        .lms-document-source-grid { grid-template-columns: 1fr; min-height: auto; }
        .lms-document-source-card { min-height: 14rem; }
        .lms-test-question-grid { width: min(100%, 28rem); grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .lms-test-unit-editor.is-survey-unit-editor .lms-test-question-grid { width: min(100%, 28rem); grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .lms-live-session-grid { grid-template-columns: 1fr; }
        .lms-live-session-card { min-height: 8rem; }
        .lms-scorm-upload-drop { min-height: 24rem; }
        .lms-test-question-card { grid-column: auto; }
        .lms-test-question-card:nth-last-child(2),
        .lms-test-question-card:nth-last-child(1) { grid-column: auto; }
        .lms-test-unit-editor.is-survey-unit-editor .lms-test-question-card:nth-last-child(1) { grid-column: auto; }
        .lms-test-question-drawer { width: min(40rem, 100%); }
        .lms-document-slideshare-panel label > div,
        .lms-document-upload-summary { grid-template-columns: 1fr; }
        .lms-unit-editor-head { align-items: stretch; flex-direction: column; }
        .lms-content-block { grid-template-columns: auto auto minmax(0, 1fr) auto auto; }
      }
      @media (max-width: 640px) {
        .lms-course-authoring-page { border-inline: 0; border-radius: 0; }
        .lms-builder-header { align-items: flex-start; padding: .75rem; }
        .lms-builder-header-main { flex: 1 1 100%; }
        .lms-builder-header-actions { width: 100%; overflow-x: auto; padding-bottom: .15rem; }
        .lms-builder-status,
        .lms-autosave-state { display: none; }
        .lms-builder-shell { gap: .75rem; padding: .75rem; }
        .lms-builder-add-submenu,
        .lms-builder-add-submenu.is-activities,
        .lms-builder-add-submenu.is-more { inset-inline-start: 0; top: calc(100% + .25rem); }
        .lms-course-level-editor { gap: 1rem; padding: .25rem; }
        .lms-course-content-editor-tabs { align-items: stretch; flex-direction: column-reverse; gap: 0; padding: .65rem .75rem 0; }
        .lms-course-content-editor-tabs > span { align-self: flex-start; }
        .lms-course-editor-empty { min-height: 15rem; padding: 1.5rem 1rem; }
        .lms-builder-add-grid { grid-template-columns: 1fr; }
        .lms-builder-canvas.is-full-unit-editor { grid-template-rows: auto minmax(24rem, 1fr); }
        .lms-content-unit-editor,
        .lms-content-unit-quill ::ng-deep .ql-container,
        .lms-content-unit-quill ::ng-deep .ql-editor { min-height: 24rem; }
        .lms-test-unit-editor { min-height: 24rem; gap: 1.5rem; padding: 1rem .25rem 6.75rem; }
        .lms-unit-editor-head.is-live-session-unit-head { padding: 1rem 0 .5rem; }
        .lms-live-session-unit-editor { min-height: 24rem; padding-block-start: 1.25rem; }
        .lms-unit-editor-head.is-scorm-unit-head { padding: 1rem 0 .5rem; }
        .lms-scorm-upload-drop { min-height: 18rem; }
        .lms-scorm-upload-summary { grid-template-columns: 1fr; justify-items: start; }
        .lms-test-question-grid { grid-template-columns: 1fr; }
        .lms-test-question-card { min-height: 7.5rem; }
        .lms-test-question-row { grid-template-columns: 1fr; padding: 1rem; }
        .lms-test-question-actions { justify-content: flex-end; }
        .lms-test-question-answers { padding-inline-start: 0; }
        .lms-test-bottom-bar { inset-inline: 0; gap: .45rem; overflow-x: auto; justify-content: flex-start; padding-inline: .75rem; }
        .lms-test-question-drawer header,
        .lms-test-question-drawer footer,
        .lms-test-question-drawer-body { padding-inline: 1rem; }
        .lms-test-answer-list { padding-inline-start: 0; }
        .lms-test-matching-pair { grid-template-columns: 1fr; gap: .55rem; }
        .lms-test-matching-connector,
        .lms-test-matching-card:first-child::after,
        .lms-test-matching-card:nth-child(3)::before { display: none; }
        .lms-test-matching-card { min-height: 3.4rem; }
        .lms-test-question-answer.is-matching { grid-template-columns: auto minmax(0, 1fr); }
        .lms-test-question-answer.is-matching mat-icon { display: none; }
        .lms-free-text-threshold,
        .lms-free-text-rule-card,
        .lms-free-text-rule-card label { align-items: stretch; flex-direction: column; }
        .lms-free-text-rule-card input,
        .lms-free-text-rule-card select { width: 100%; min-width: 0; }
        .lms-import-validation-row { align-items: stretch; flex-direction: column; }
        .lms-import-validate,
        .lms-import-copy { justify-content: center; width: 100%; }
        .lms-builder-empty-canvas { min-height: 20rem; padding: 2rem 1.25rem; }
        .lms-builder-empty-canvas-actions { width: 100%; }
        .lms-builder-empty-canvas-actions button { width: 100%; }
      }
      .lms-workspace.is-content-authoring .lms-course-authoring-page { border-color: rgb(203 213 225); background: rgb(241 245 249); box-shadow: none; }
      .lms-workspace.is-content-authoring .lms-builder-header { min-height: 4.25rem; padding: .7rem 1rem; }
      .lms-workspace.is-content-authoring .lms-builder-shell { grid-template-columns: minmax(16.5rem, 19rem) minmax(0, 1fr); gap: 1.25rem; padding: 1.25rem; }
      .lms-workspace.is-content-authoring .lms-builder-shell.has-inspector { grid-template-columns: minmax(16.5rem, 19rem) minmax(0, 1fr) minmax(17rem, 20rem); }
      .lms-workspace.is-content-authoring .lms-builder-curriculum,
      .lms-workspace.is-content-authoring .lms-builder-editor,
      .lms-workspace.is-content-authoring .lms-builder-inspector { border-color: rgb(203 213 225); border-radius: .75rem; box-shadow: none; }
      .lms-workspace.is-content-authoring .lms-builder-sidebar-head { background: white; padding: 1rem; }
      .lms-workspace.is-content-authoring .lms-builder-sidebar-actions { background: rgb(248 250 252); padding: .75rem 1rem; }
      .lms-workspace.is-content-authoring .lms-builder-tree { gap: .35rem; padding: .85rem .65rem 1rem; }
      .lms-workspace.is-content-authoring .lms-builder-node-row { min-height: 2.85rem; border-radius: .6rem; }
      .lms-workspace.is-content-authoring .lms-builder-editor { background: rgb(248 250 252); padding: 1.25rem; }
      .lms-workspace.is-content-authoring .lms-builder-canvas.is-test-unit-editor { width: min(100%, 61rem); grid-template-rows: auto auto; align-content: start; gap: 1.25rem; padding: 0 0 4.75rem; }
      .lms-workspace.is-content-authoring .lms-unit-editor-head.is-survey-unit-head { border: 1px solid rgb(203 213 225); border-radius: .75rem; background: white; padding: 1.25rem 1.5rem; box-shadow: none; }
      .lms-workspace.is-content-authoring .lms-unit-editor-head.is-survey-unit-head .lms-unit-title-field input { max-width: 42rem; border-bottom-color: rgb(203 213 225); font-size: 1.55rem; line-height: 1.25; }
      .lms-workspace.is-content-authoring .lms-unit-editor-head.is-survey-unit-head .lms-unit-title-field textarea { max-width: 56rem; color: rgb(51 65 85); }
      .lms-workspace.is-content-authoring .lms-test-unit-editor { gap: 1.25rem; padding: 1.25rem 1.25rem 6.75rem; }
      .lms-workspace.is-content-authoring .lms-test-unit-editor.is-survey-unit-editor { border: 1px solid rgb(203 213 225); border-radius: .75rem; background: white; padding: 1.5rem; box-shadow: none; }
      .lms-workspace.is-content-authoring .lms-test-empty { min-height: auto; grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr); align-items: start; justify-items: stretch; gap: 1.5rem; padding: 0; text-align: start; }
      .lms-workspace.is-content-authoring .lms-test-empty-copy { display: grid; gap: .45rem; border: 1px solid rgb(226 232 240); border-radius: .65rem; background: rgb(248 250 252); padding: 1rem; }
      .lms-workspace.is-content-authoring .lms-test-empty-copy h3 { font-size: 1rem; line-height: 1.3; }
      .lms-workspace.is-content-authoring .lms-test-empty-copy p { margin: 0; font-size: .82rem; line-height: 1.55; }
      .lms-workspace.is-content-authoring .lms-test-question-grid { width: 100%; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: .75rem; justify-content: stretch; }
      .lms-workspace.is-content-authoring .lms-test-question-card,
      .lms-workspace.is-content-authoring .lms-test-unit-editor.is-survey-unit-editor .lms-test-question-card { min-height: 5.75rem; grid-column: auto; grid-template-columns: 2.25rem minmax(0, 1fr); place-content: stretch; justify-items: start; align-items: center; gap: .8rem; border-color: rgb(203 213 225); border-radius: .65rem; background: white; padding: .85rem 1rem; text-align: start; }
      .lms-workspace.is-content-authoring .lms-test-question-card:nth-last-child(1),
      .lms-workspace.is-content-authoring .lms-test-question-card:nth-last-child(2),
      .lms-workspace.is-content-authoring .lms-test-unit-editor.is-survey-unit-editor .lms-test-question-card:nth-last-child(1),
      .lms-workspace.is-content-authoring .lms-test-unit-editor.is-survey-unit-editor .lms-test-question-card:nth-last-child(2) { grid-column: auto; }
      .lms-workspace.is-content-authoring .lms-test-question-card mat-icon { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: .65rem; background: rgb(245 243 255); color: rgb(109 40 217); font-size: 1.25rem; line-height: 2.25rem; }
      .lms-workspace.is-content-authoring .lms-test-question-card strong { max-width: none; color: rgb(15 23 42); font-size: .88rem; text-align: start; }
      .lms-workspace.is-content-authoring .lms-test-question-card:hover,
      .lms-workspace.is-content-authoring .lms-test-question-card:focus-visible { border-color: rgb(109 40 217); background: rgb(250 245 255); box-shadow: none; }
      .lms-workspace.is-content-authoring .lms-test-question-list { width: min(100%, 61rem); gap: .75rem; justify-self: stretch; padding-bottom: 4.75rem; }
      .lms-workspace.is-content-authoring .lms-test-question-list > header { justify-content: space-between; min-height: auto; padding: .1rem .15rem .75rem; }
      .lms-workspace.is-content-authoring .lms-test-question-list > header::before { content: "Questions"; color: rgb(15 23 42); font-size: .84rem; font-weight: 900; }
      .lms-workspace.is-content-authoring .lms-test-question-list > header p { color: rgb(71 85 105); font-size: .76rem; font-style: normal; font-weight: 800; }
      .lms-workspace.is-content-authoring .lms-test-question-row { grid-template-columns: minmax(0, 1fr) auto; gap: 1rem; border-color: rgb(226 232 240); border-radius: .65rem; padding: .9rem 1rem; transition: border-color .16s ease, background-color .16s ease; }
      .lms-workspace.is-content-authoring .lms-test-question-row:hover,
      .lms-workspace.is-content-authoring .lms-test-question-row:focus-within { border-color: rgb(203 213 225); background: rgb(248 250 252); }
      .lms-workspace.is-content-authoring .lms-test-question-row.is-selected { border-color: rgb(167 139 250); background: rgb(250 245 255); }
      .lms-workspace.is-content-authoring .lms-test-question-main { gap: .85rem; }
      .lms-workspace.is-content-authoring .lms-test-question-main mat-icon { display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border-radius: .55rem; background: rgb(245 243 255); color: rgb(91 33 182); font-size: 1.15rem; line-height: 2.2rem; }
      .lms-workspace.is-content-authoring .lms-test-question-main strong { white-space: normal; }
      .lms-workspace.is-content-authoring .lms-test-question-actions { gap: .25rem; }
      .lms-workspace.is-content-authoring .lms-test-question-actions button,
      .lms-workspace.is-content-authoring .lms-test-bottom-bar button { border-radius: .55rem; color: rgb(51 65 85); }
      .lms-workspace.is-content-authoring .lms-test-question-answers { gap: .65rem; margin-top: .25rem; border-top: 1px solid rgb(226 232 240); padding: .9rem 0 0 3.05rem; }
      .lms-workspace.is-content-authoring .lms-test-question-answer { gap: .7rem; }
      .lms-workspace.is-content-authoring .lms-test-question-answer p,
      .lms-workspace.is-content-authoring .lms-test-question-no-answers { color: rgb(30 41 59); font-size: .82rem; }
      @media (max-width: 920px) {
        .lms-workspace.is-content-authoring .lms-builder-shell { grid-template-columns: 1fr; padding: 1rem; }
        .lms-workspace.is-content-authoring .lms-builder-shell.has-inspector { grid-template-columns: 1fr; }
        .lms-workspace.is-content-authoring .lms-test-empty { grid-template-columns: 1fr; }
      }
      @media (max-width: 640px) {
        .lms-workspace.is-content-authoring .lms-builder-editor,
        .lms-workspace.is-content-authoring .lms-test-unit-editor.is-survey-unit-editor,
        .lms-workspace.is-content-authoring .lms-unit-editor-head.is-survey-unit-head { padding: 1rem; }
        .lms-workspace.is-content-authoring .lms-test-unit-editor { padding: .75rem .75rem 6.75rem; }
        .lms-workspace.is-content-authoring .lms-test-unit-editor.is-survey-unit-editor .lms-test-question-grid { grid-template-columns: 1fr; }
        .lms-workspace.is-content-authoring .lms-test-question-grid { grid-template-columns: 1fr; }
        .lms-workspace.is-content-authoring .lms-test-question-row { grid-template-columns: 1fr; }
        .lms-workspace.is-content-authoring .lms-test-question-answers { padding-inline-start: 0; }
      }
      .lms-course-media-detail-row td { background: rgb(248 250 252); padding: .9rem 1.5rem 1.1rem; }
      .lms-course-media-detail-row .lms-free-check { margin-bottom: .65rem; }
      .lms-course-media-detail-row .lms-media-list { margin-inline-start: 0; }
      .lms-course-content-empty-cell { padding: 0 !important; }
      .lms-course-content-empty-cell .lms-empty-editor,
      .lms-course-content-empty-cell .lms-empty-lesson-state { min-height: 12rem; margin: 0; border: 0; border-radius: 0; background: transparent; }
      .lms-course-node-modal-backdrop { position: fixed; inset: 0; z-index: 70; display: flex; align-items: center; justify-content: center; padding: 1rem; background: rgb(15 23 42 / .45); }
      .lms-course-node-modal { width: min(100%, 30rem); overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: .75rem; background: rgb(255 255 255); box-shadow: 0 24px 64px rgb(15 23 42 / .28); }
      .lms-course-node-modal-header,
      .lms-course-node-modal-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; }
      .lms-course-node-modal-header { border-bottom: 1px solid rgb(226 232 240); }
      .lms-course-node-modal-header h3 { margin: 0; color: rgb(15 23 42); font-size: 1rem; font-weight: 850; }
      .lms-course-node-modal-header p { margin: .3rem 0 0; color: rgb(100 116 139); font-size: .76rem; }
      .lms-course-node-modal-close { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .5rem; color: rgb(100 116 139); transition: background-color .15s ease, color .15s ease; }
      .lms-course-node-modal-close:hover,
      .lms-course-node-modal-close:focus-visible { background: rgb(248 250 252); color: rgb(15 23 42); outline: none; }
      .lms-course-node-modal-close mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; line-height: 1.1rem; }
      .lms-course-node-modal-body { display: grid; gap: 1rem; padding: 1.25rem; }
      .lms-course-node-field { display: grid; gap: .5rem; }
      .lms-course-node-field span { color: rgb(71 85 105); font-size: .75rem; font-weight: 800; }
      .lms-course-node-field input,
      .lms-course-node-field textarea { width: 100%; border: 1px solid rgb(203 213 225); border-radius: .5rem; background: rgb(255 255 255); padding: .65rem .75rem; color: rgb(15 23 42); font: inherit; font-size: .86rem; outline: none; }
      .lms-course-node-field input:focus,
      .lms-course-node-field textarea:focus { border-color: rgb(79 70 229); box-shadow: 0 0 0 3px rgb(79 70 229 / .14); }
      .lms-course-node-modal-footer { justify-content: flex-end; border-top: 1px solid rgb(226 232 240); }
      .lms-course-node-primary,
      .lms-course-node-secondary { display: inline-flex; min-height: 2.25rem; align-items: center; justify-content: center; border-radius: .5rem; padding: .5rem .9rem; font-size: .86rem; font-weight: 800; transition: background-color .15s ease, color .15s ease, opacity .15s ease; }
      .lms-course-node-primary { background: rgb(126 34 206); color: rgb(255 255 255); }
      .lms-course-node-primary:hover:not(:disabled),
      .lms-course-node-primary:focus-visible { background: rgb(109 40 217); outline: none; }
      .lms-course-node-primary:disabled { cursor: not-allowed; opacity: .55; }
      .lms-course-node-secondary { background: rgb(248 250 252); color: rgb(51 65 85); }
      .lms-course-node-secondary:hover,
      .lms-course-node-secondary:focus-visible { background: rgb(226 232 240); outline: none; }
      .lms-danger-zone { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 1rem; border-top: 1px solid rgb(254 202 202); padding-top: 1rem; }.lms-danger-zone strong { color: rgb(153 27 27); font-size: .8rem; }.lms-danger-zone p { margin: .2rem 0 0; color: rgb(100 116 139); font-size: .7rem; }.lms-delete-course { border: 1px solid rgb(252 165 165); background: white; color: rgb(185 28 28); }
      .lms-course-loading { display: grid; gap: .7rem; padding: 2rem; }
      .lms-course-index-heading { align-items: center; }
      .lms-index-alert { margin: 1rem 1.25rem 0; }
      .lms-course-toolbar { display: grid; grid-template-columns: minmax(16rem, 1fr) 11rem 13rem; gap: .75rem; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid rgb(226 232 240); }
      .lms-course-search { display: flex; align-items: center; gap: .55rem; min-height: 2.65rem; border: 1px solid rgb(203 213 225); border-radius: .625rem; background: white; padding-inline: .75rem; }
      .lms-course-search:focus-within { border-color: rgb(99 102 241); box-shadow: 0 0 0 3px rgb(99 102 241 / .16); }
      .lms-course-search mat-icon { width: 1.1rem; height: 1.1rem; color: rgb(100 116 139); font-size: 1.1rem; }
      .lms-course-search input { width: 100%; border: 0; outline: 0; color: rgb(15 23 42); font: inherit; font-size: .8rem; }
      .lms-course-search input::placeholder { color: rgb(71 85 105); }
      .lms-course-card-list { display: grid; gap: .75rem; padding: 1rem 1.25rem 1.1rem; }
      .lms-course-index-card { overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: .75rem; background: white; transition: border-color .16s ease, background-color .16s ease; }
      .lms-course-index-card:hover, .lms-course-index-card:focus-within { border-color: rgb(199 210 254); }
      .lms-course-index-card.is-expanded { border-color: rgb(165 180 252); background: rgb(248 250 252); }
      .lms-course-index-card-head { width: 100%; display: grid; grid-template-columns: auto minmax(12rem, 1fr) minmax(22rem, auto) auto; align-items: center; gap: .85rem; min-height: 5rem; padding: .75rem .9rem; color: inherit; text-align: left; }
      .lms-course-index-card-head:focus-visible { outline: 3px solid rgb(99 102 241 / .24); outline-offset: -3px; }
      .lms-course-index-thumb { display: grid; place-items: center; width: 4.6rem; height: 2.9rem; overflow: hidden; border-radius: .55rem; background: rgb(238 242 255); color: rgb(79 70 229); }
      .lms-course-index-thumb img { width: 100%; height: 100%; object-fit: cover; }
      .lms-course-index-thumb mat-icon { width: 1.35rem; height: 1.35rem; font-size: 1.35rem; line-height: 1.35rem; }
      .lms-course-index-main { min-width: 0; display: grid; gap: .25rem; }
      .lms-course-index-title-row { display: flex; align-items: center; gap: .55rem; min-width: 0; }
      .lms-course-index-title-row strong { min-width: 0; overflow: hidden; color: rgb(15 23 42); font-size: .84rem; font-weight: 850; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-index-main small { overflow: hidden; color: rgb(71 85 105); font-size: .68rem; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-index-meta { display: grid; grid-template-columns: repeat(3, minmax(0, auto)); justify-content: end; gap: .55rem; color: rgb(51 65 85); font-size: .7rem; font-weight: 750; }
      .lms-course-index-meta span { display: inline-flex; min-width: 0; align-items: center; gap: .3rem; white-space: nowrap; }
      .lms-course-index-meta mat-icon { width: .95rem; height: .95rem; color: rgb(79 70 229); font-size: .95rem; line-height: .95rem; }
      .lms-course-index-chevron { width: 1.25rem; height: 1.25rem; color: rgb(100 116 139); font-size: 1.25rem; line-height: 1.25rem; }
      .lms-course-index-panel { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1rem; border-top: 1px solid rgb(226 232 240); padding: 1rem .9rem 1rem 6.35rem; background: white; }
      .lms-course-index-copy { min-width: 0; display: grid; gap: .8rem; }
      .lms-course-index-copy p { max-width: 68ch; margin: 0; color: rgb(51 65 85); font-size: .76rem; line-height: 1.55; text-wrap: pretty; }
      .lms-course-index-copy dl { display: grid; grid-template-columns: repeat(4, minmax(7rem, 1fr)); gap: .65rem; margin: 0; }
      .lms-course-index-copy dl div { display: grid; gap: .2rem; min-width: 0; }
      .lms-course-index-copy dt { color: rgb(100 116 139); font-size: .65rem; font-weight: 800; }
      .lms-course-index-copy dd { min-width: 0; margin: 0; overflow: hidden; color: rgb(15 23 42); font-size: .74rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-index-actions { display: flex; align-items: flex-start; justify-content: flex-end; gap: .35rem; }
      .lms-course-table-wrap { width: 100%; overflow-x: auto; }
      .lms-course-table { width: 100%; min-width: 62rem; border-collapse: collapse; color: rgb(51 65 85); font-size: .75rem; text-align: left; }
      .lms-course-table th { background: rgb(248 250 252); padding: .75rem 1rem; color: rgb(71 85 105); font-size: .68rem; font-weight: 750; }
      .lms-course-table td { border-top: 1px solid rgb(226 232 240); padding: .85rem 1rem; vertical-align: middle; }
      .lms-course-table tbody tr { transition: background-color .16s ease, box-shadow .16s ease; }
      .lms-course-table tbody tr:hover, .lms-course-table tbody tr:focus-within { background: rgb(226 232 240 / .78); box-shadow: inset 0 0 0 1px rgb(203 213 225); }
      .lms-course-cell { display: flex; align-items: center; gap: .7rem; min-width: 15rem; }
      .lms-course-cell > img, .lms-course-cell > span { width: 3.25rem; height: 2.2rem; flex: 0 0 auto; border-radius: .45rem; object-fit: cover; }
      .lms-course-cell > span { display: grid; place-items: center; background: rgb(238 242 255); color: rgb(79 70 229); }
      .lms-course-cell > span mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; }
      .lms-course-cell > div { min-width: 0; display: grid; gap: .15rem; }
      .lms-course-cell strong { overflow: hidden; color: rgb(15 23 42); font-size: .78rem; text-overflow: ellipsis; white-space: nowrap; }
      .lms-course-cell small, .lms-course-table td small { color: rgb(100 116 139); font-size: .66rem; }
      .lms-course-status { display: inline-flex; align-items: center; gap: .35rem; border-radius: 999px; background: rgb(241 245 249); padding: .3rem .55rem; color: rgb(71 85 105); font-size: .67rem; font-weight: 750; }
      .lms-course-status > span { width: .4rem; height: .4rem; border-radius: 50%; background: rgb(148 163 184); }
      .lms-course-status.is-published { background: rgb(236 253 245); color: rgb(4 120 87); }.lms-course-status.is-published > span { background: rgb(16 185 129); }
      .lms-course-actions-cell { width: 12rem; }
      .lms-course-row-actions { position: relative; display: flex; justify-content: flex-end; min-height: 2rem; }
      .lms-course-actions-more, .lms-course-actions { display: inline-flex; align-items: center; justify-content: center; }
      .lms-course-actions-more { width: 2rem; height: 2rem; border-radius: .5rem; color: rgb(71 85 105); transition: opacity .16s ease, transform .16s ease; }
      .lms-course-actions-more mat-icon { width: 1.15rem; height: 1.15rem; font-size: 1.15rem; }
      .lms-course-actions { position: absolute; right: 0; top: 50%; gap: .25rem; transform: translateY(-50%) translateX(.3rem); opacity: 0; pointer-events: none; transition: opacity .16s ease, transform .16s ease; }
      .lms-course-table tbody tr:hover .lms-course-actions, .lms-course-table tbody tr:focus-within .lms-course-actions { transform: translateY(-50%); opacity: 1; pointer-events: auto; }
      .lms-course-table tbody tr:hover .lms-course-actions-more, .lms-course-table tbody tr:focus-within .lms-course-actions-more { opacity: 0; transform: translateX(-.25rem); }
      .lms-row-action { display: inline-grid; place-items: center; width: 2rem; height: 2rem; border: 1px solid rgb(203 213 225); border-radius: .5rem; background: white; color: rgb(51 65 85); text-decoration: none; cursor: pointer; transition: border-color .16s ease, background-color .16s ease, color .16s ease; }
      .lms-row-action:hover { border-color: rgb(99 102 241); background: rgb(238 242 255); color: rgb(67 56 202); }
      .lms-row-action:focus-visible { outline: 3px solid rgb(99 102 241 / .28); outline-offset: 1px; }
      .lms-row-action.is-danger:hover { border-color: rgb(252 165 165); background: rgb(254 242 242); color: rgb(185 28 28); }
      .lms-row-action:disabled { border-color: rgb(226 232 240); background: rgb(248 250 252); color: rgb(148 163 184); cursor: not-allowed; }
      .lms-row-action mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-confirm-backdrop { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; background: rgb(15 23 42 / .42); padding: 1.25rem; }
      .lms-confirm-dialog { width: min(28rem, 100%); display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 1rem; border: 1px solid rgb(254 202 202); border-radius: .875rem; background: white; padding: 1.25rem; box-shadow: 0 18px 48px rgb(15 23 42 / .18); }
      .lms-confirm-icon { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: .75rem; background: rgb(254 242 242); color: rgb(185 28 28); }
      .lms-confirm-icon mat-icon { width: 1.25rem; height: 1.25rem; font-size: 1.25rem; }
      .lms-confirm-copy { min-width: 0; }
      .lms-confirm-copy h3 { margin: .1rem 0 .35rem; color: rgb(15 23 42); font-size: 1rem; }
      .lms-confirm-copy p { margin: 0; color: rgb(71 85 105); font-size: .8rem; line-height: 1.55; }
      .lms-confirm-copy strong { color: rgb(15 23 42); }
      .lms-confirm-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: .65rem; padding-top: .25rem; }
      .lms-confirm-delete { border: 1px solid rgb(220 38 38); background: rgb(220 38 38); color: white; }
      .lms-confirm-delete:hover:not(:disabled) { background: rgb(185 28 28); border-color: rgb(185 28 28); }
      .lms-course-report { overflow: hidden; }
      .lms-report-actions { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; border-top: 1px solid rgb(226 232 240); }
      .lms-enroll-link { display: inline-flex; align-items: center; gap: .4rem; border: 0; background: transparent; color: rgb(67 56 202); font-size: .78rem; font-weight: 800; text-decoration: none; cursor: pointer; }
      .lms-enroll-link:hover { color: rgb(49 46 129); text-decoration: underline; text-underline-offset: .2rem; }
      .lms-enroll-link:focus-visible { outline: 3px solid rgb(99 102 241 / .28); outline-offset: .25rem; border-radius: .5rem; }
      .lms-enroll-link mat-icon { width: 1.05rem; height: 1.05rem; font-size: 1.05rem; }
      .lms-report-toolbar { border-top: 1px solid rgb(226 232 240); }
      .lms-report-table { min-width: 72rem; }
      .lms-content-users-table { min-width: 58rem; }
      .lms-learner-editor { overflow: hidden; margin-bottom: 5.5rem; }
      .lms-learner-form-shell { display: grid; grid-template-columns: 8.5rem minmax(18rem, 30rem); gap: 2rem; align-items: start; padding: 1.35rem 1.5rem 1.6rem; }
      .lms-learner-avatar { position: relative; display: grid; place-items: center; width: 7rem; height: 7rem; margin-top: 1.65rem; overflow: hidden; border-radius: 1.15rem; background: rgb(241 245 249); color: rgb(148 163 184); cursor: pointer; }
      .lms-learner-avatar input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
      .lms-learner-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .lms-learner-avatar mat-icon { width: 4.75rem; height: 4.75rem; font-size: 4.75rem; }
      .lms-learner-avatar-overlay { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: .3rem; background: rgb(15 23 42 / .62); color: white; font-size: .68rem; font-weight: 800; opacity: 0; transition: opacity .16s ease; }
      .lms-learner-avatar:hover .lms-learner-avatar-overlay, .lms-learner-avatar:focus-within .lms-learner-avatar-overlay, .lms-learner-avatar.is-uploading .lms-learner-avatar-overlay { opacity: 1; }
      .lms-learner-avatar-overlay mat-icon { width: 1.35rem; height: 1.35rem; font-size: 1.35rem; }
      .lms-learner-fields { display: grid; gap: .95rem; }
      .lms-learner-fields label { display: grid; gap: .45rem; color: rgb(15 23 42); font-size: .78rem; font-weight: 800; }
      .lms-learner-fields label > span small { color: rgb(220 38 38); font-size: .78rem; }
      .lms-learner-fields textarea.tenant-lms-input { min-height: 9rem; resize: vertical; }
      .lms-learner-divider { height: 1px; margin: .35rem 0 .2rem; background: rgb(226 232 240); }
      .lms-learner-fields h3 { margin: .25rem 0 0; color: rgb(15 23 42); font-size: .92rem; }
      .lms-learner-password-help { margin: -.35rem 0 .15rem; color: rgb(51 65 85); font-size: .7rem; font-style: italic; line-height: 1.55; }
      .lms-footer-actions { display: flex; align-items: center; justify-content: flex-end; gap: .6rem; }
      .lms-learner-save-footer .lms-footer-actions { display: flex; align-items: center; justify-content: flex-start; gap: .5rem; }
      .lms-learner-save-footer .lms-button { min-width: 5.6rem; justify-content: center; }
      .lms-user-cell { display: flex; align-items: center; gap: .65rem; min-width: 13rem; }
      .lms-user-cell > span, .lms-user-cell > img { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; flex: 0 0 auto; border-radius: 50%; background: rgb(238 242 255); color: rgb(67 56 202); font-size: .8rem; font-weight: 850; text-transform: uppercase; }
      .lms-user-cell > img { object-fit: cover; }
      .lms-user-cell > div { min-width: 0; display: grid; gap: .12rem; }
      .lms-user-cell strong, .lms-user-cell small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .lms-user-cell strong { color: rgb(15 23 42); font-size: .78rem; }
      .lms-user-cell small { color: rgb(100 116 139); font-size: .66rem; }
      .lms-user-role, .lms-user-status, .lms-user-registration { display: inline-flex; align-items: center; border-radius: 999px; padding: .28rem .55rem; font-size: .66rem; font-weight: 800; white-space: nowrap; }
      .lms-user-role { background: rgb(238 242 255); color: rgb(67 56 202); }
      .lms-user-status { background: rgb(241 245 249); color: rgb(71 85 105); }
      .lms-user-status.is-active { background: rgb(220 252 231); color: rgb(22 101 52); }
      .lms-user-status.is-pending { background: rgb(254 243 199); color: rgb(146 64 14); }
      .lms-user-status.is-inactive { background: rgb(241 245 249); color: rgb(71 85 105); }
      .lms-user-registration { background: rgb(240 253 250); color: rgb(15 118 110); }
      .lms-progress-pill { display: inline-flex; align-items: center; gap: .35rem; border-radius: 999px; background: rgb(241 245 249); padding: .3rem .55rem; color: rgb(51 65 85); font-size: .67rem; font-weight: 780; white-space: nowrap; }
      .lms-progress-pill mat-icon { width: .95rem; height: .95rem; font-size: .95rem; }
      .lms-progress-pill small { margin-left: .1rem; color: inherit; font-size: .62rem; opacity: .78; }
      .lms-progress-pill.is-completed { background: rgb(220 252 231); color: rgb(22 101 52); }
      .lms-progress-pill.is-in-progress { background: rgb(224 231 255); color: rgb(55 48 163); }
      .lms-progress-pill.is-not-started { background: rgb(241 245 249); color: rgb(71 85 105); }
      .lms-progress-pill.is-expired { background: rgb(254 242 242); color: rgb(153 27 27); }
      .lms-report-pagination { display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-top: 1px solid rgb(226 232 240); padding: .85rem 1.25rem; color: rgb(71 85 105); font-size: .72rem; }
      .lms-report-pagination > div { display: flex; align-items: center; gap: .6rem; }
      .lms-page-button { border: 1px solid rgb(203 213 225); border-radius: .5rem; background: white; padding: .45rem .7rem; color: rgb(51 65 85); font: inherit; font-size: .7rem; font-weight: 750; cursor: pointer; }
      .lms-page-button:hover:not(:disabled) { border-color: rgb(99 102 241); color: rgb(67 56 202); }
      .lms-page-button:disabled { color: rgb(148 163 184); cursor: not-allowed; }
      .lms-page-size { display: inline-flex; align-items: center; gap: .45rem; color: rgb(100 116 139); font-size: .72rem; font-weight: 800; }
      .lms-page-size select { height: 2rem; border: 1px solid rgb(203 213 225); border-radius: .5rem; background: rgb(248 250 252); padding: 0 .5rem; color: rgb(51 65 85); font: inherit; font-size: .7rem; font-weight: 800; outline: none; }
      .lms-page-size select:focus { border-color: rgb(99 102 241); box-shadow: 0 0 0 3px rgb(99 102 241 / .16); }
      .lms-page-icon-button { display: inline-grid; place-items: center; width: 2rem; height: 2rem; padding: 0; }
      .lms-page-icon-button mat-icon { width: 1.05rem; height: 1.05rem; font-size: 1.05rem; }
      .lms-page-summary { color: rgb(51 65 85); font-size: .72rem; font-weight: 800; white-space: nowrap; }
      .lms-drawer-backdrop { position: fixed; inset: 0; z-index: 65; display: flex; justify-content: flex-end; background: rgb(15 23 42 / .32); }
      .lms-enroll-drawer { width: min(30rem, 100%); height: 100%; display: grid; grid-template-rows: auto auto auto minmax(0, 1fr); border-left: 1px solid rgb(226 232 240); background: white; box-shadow: -18px 0 42px rgb(15 23 42 / .18); }
      .lms-drawer-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem; border-bottom: 1px solid rgb(226 232 240); }
      .lms-drawer-head h3 { margin: .1rem 0 0; color: rgb(15 23 42); font-size: 1rem; }
      .lms-drawer-controls { display: grid; grid-template-columns: minmax(0, 1fr) 10rem; gap: .65rem; padding: 1rem 1.25rem; border-bottom: 1px solid rgb(226 232 240); }
      .lms-check-all { display: flex; align-items: center; gap: .45rem; padding: .8rem 1.25rem; color: rgb(51 65 85); font-size: .75rem; font-weight: 750; }
      .lms-check-all input { width: 1rem; height: 1rem; accent-color: rgb(79 70 229); }
      .lms-drawer-users { min-height: 0; overflow-y: auto; padding: .25rem 1.25rem 1.25rem; }
      .lms-drawer-users h4 { margin: .5rem 0 .75rem; color: rgb(15 23 42); font-size: .78rem; }
      .lms-drawer-user { display: flex; align-items: center; justify-content: space-between; gap: .9rem; border: 1px solid rgb(226 232 240); border-radius: .75rem; background: white; padding: .75rem; }
      .lms-drawer-user + .lms-drawer-user { margin-top: .55rem; }
      .lms-drawer-user.is-selected { border-color: rgb(199 210 254); background: rgb(238 242 255 / .65); }
      .lms-drawer-empty { min-height: 14rem; display: grid; place-content: center; justify-items: center; gap: .35rem; color: rgb(100 116 139); text-align: center; font-size: .75rem; }
      .lms-drawer-empty mat-icon { color: rgb(79 70 229); }
      .lms-drawer-empty strong { color: rgb(15 23 42); }
      .lms-drawer-empty p { margin: 0; }
      .lms-course-results { border-top: 1px solid rgb(226 232 240); padding: .75rem 1.25rem; color: rgb(71 85 105); font-size: .7rem; }
      .lms-course-empty { min-height: 20rem; display: grid; place-content: center; justify-items: center; gap: .45rem; padding: 2rem; text-align: center; }
      .lms-course-empty > mat-icon { width: 2rem; height: 2rem; color: rgb(79 70 229); font-size: 2rem; }.lms-course-empty strong { color: rgb(15 23 42); font-size: .9rem; }.lms-course-empty p { max-width: 30rem; margin: 0 0 .6rem; color: rgb(71 85 105); font-size: .75rem; }
      .lms-visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; clip-path: inset(50%); }
      .lms-grade-title-field {
        grid-column: span 2;
      }
      .lms-navbar-item {
        display: grid;
        gap: 0.875rem;
        padding: 1rem;
        border: 1px solid rgb(226 232 240);
        border-radius: 0.75rem;
        background: rgb(248 250 252);
      }
      .lms-navbar-item-heading,
      .lms-enabled-control {
        display: flex;
        align-items: center;
      }
      .lms-navbar-item-heading {
        gap: 0.625rem;
      }
      .lms-navbar-item-heading > strong,
      .lms-button-editor > div > strong {
        font-size: 0.8125rem;
      }
      .lms-order {
        display: grid;
        place-items: center;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 50%;
        background: rgb(224 231 255);
        color: rgb(67 56 202);
        font-size: 0.6875rem;
        font-weight: 800;
      }
      .lms-enabled-control {
        gap: 0.45rem;
        margin-left: auto;
        cursor: pointer;
        color: rgb(51 65 85);
        font-size: 0.75rem;
        font-weight: 700;
      }
      .lms-enabled-control input {
        width: 1rem;
        height: 1rem;
        accent-color: rgb(79 70 229);
      }
      .lms-button-editor > div {
        display: grid;
        gap: 0.75rem;
        padding: 1rem 0;
      }
      .lms-button-editor > div + div {
        border-top: 1px solid rgb(226 232 240);
      }
      .lms-route-input {
        direction: ltr;
        text-align: left;
      }
      .lms-stat-editor {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.875rem;
      }
      .lms-stat-editor-four {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .lms-stat-editor .lms-fields {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }
      .lms-image-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 15rem;
        gap: 1.5rem;
        align-items: start;
      }
      .lms-image-editor {
        display: grid;
        gap: 1rem;
      }
      .lms-image-editor > label {
        display: grid;
        gap: 0.4rem;
        color: rgb(51 65 85);
        font-size: 0.75rem;
        font-weight: 700;
      }
      .lms-image-source {
        display: inline-flex;
        width: fit-content;
        padding: 0.25rem;
        border-radius: 0.625rem;
        background: rgb(241 245 249);
      }
      .lms-image-source button {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        min-height: 2.25rem;
        padding: 0.45rem 0.75rem;
        border: 0;
        border-radius: 0.45rem;
        background: transparent;
        color: rgb(71 85 105);
        font: inherit;
        font-size: 0.75rem;
        font-weight: 750;
        cursor: pointer;
      }
      .lms-image-source button.is-active {
        background: white;
        color: rgb(67 56 202);
        box-shadow: 0 1px 3px rgb(15 23 42 / 0.12);
      }
      .lms-image-source mat-icon {
        width: 1rem;
        height: 1rem;
        font-size: 1rem;
      }
      .lms-upload-control {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-height: 5rem;
        padding: 1rem;
        border: 1px dashed rgb(148 163 184);
        border-radius: 0.75rem;
        background: rgb(248 250 252);
        cursor: pointer;
      }
      .lms-upload-control:hover,
      .lms-upload-control:focus-within {
        border-color: rgb(79 70 229);
        background: rgb(238 242 255);
      }
      .lms-upload-control input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
      }
      .lms-upload-control input:disabled { cursor: wait; }
      .lms-upload-control mat-icon {
        color: rgb(79 70 229);
      }
      .lms-upload-control span {
        display: grid;
        gap: 0.15rem;
      }
      .lms-upload-control small {
        color: rgb(71 85 105);
        font-weight: 500;
      }
      .lms-upload-control.is-uploading mat-icon {
        animation: lms-spin 0.8s linear infinite;
      }
      .lms-field-error {
        margin: 0;
        color: rgb(185 28 28);
        font-size: 0.75rem;
        font-weight: 650;
      }
      .lms-image-preview {
        display: grid;
        place-items: center;
        min-height: 18rem;
        overflow: hidden;
        border-radius: 0.75rem;
        background: rgb(15 23 42);
        color: rgb(148 163 184);
      }
      .lms-image-preview img {
        width: 100%;
        height: 18rem;
        object-fit: cover;
      }
      .lms-image-preview span {
        font-size: 0.75rem;
      }

      .lms-notice {
        gap: 0.625rem;
        padding: 0.875rem 1rem;
        border-radius: 0.75rem;
        font-size: 0.8125rem;
        font-weight: 650;
      }
      .lms-notice mat-icon {
        flex: 0 0 auto;
        width: 1.25rem;
        height: 1.25rem;
        font-size: 1.25rem;
      }
      .lms-notice p {
        margin: 0.15rem 0 0;
        font-weight: 500;
      }
      .lms-notice button {
        margin-left: auto;
        border: 0;
        background: transparent;
        color: inherit;
        font-weight: 750;
        cursor: pointer;
        text-decoration: underline;
      }
      .lms-notice-error {
        border: 1px solid rgb(254 202 202);
        background: rgb(254 242 242);
        color: rgb(185 28 28);
      }
      .lms-notice-success {
        border: 1px solid rgb(167 243 208);
        background: rgb(236 253 245);
        color: rgb(4 120 87);
      }
      .lms-form-footer {
        justify-content: space-between;
        gap: 1.5rem;
        padding: 1rem 1.25rem;
        border: 1px solid rgb(203 213 225);
        border-radius: 0.875rem;
        background: rgb(248 250 252);
      }
      .lms-learner-save-footer {
        position: fixed;
        right: 2rem;
        bottom: 0;
        left: 22rem;
        z-index: 60;
        justify-content: flex-start;
        min-height: 4.5rem;
        border-width: 1px 1px 0;
        border-radius: .875rem .875rem 0 0;
        border-color: rgb(226 232 240);
        background: white;
        box-shadow: none;
      }
      .lms-form-footer > div {
        display: grid;
        gap: 0.15rem;
      }
      .lms-form-footer strong {
        font-size: 0.8125rem;
      }
      .lms-form-footer span {
        color: rgb(71 85 105);
        font-size: 0.75rem;
      }

      .lms-loading {
        display: grid;
        gap: 0.75rem;
        margin-top: 1.5rem;
        padding: 2rem;
        border: 1px solid rgb(226 232 240);
        border-radius: 0.875rem;
        background: white;
      }
      .lms-skeleton {
        display: block;
        width: 100%;
        height: 0.875rem;
        border-radius: 0.25rem;
        background: rgb(226 232 240);
        animation: lms-pulse 1.5s ease-in-out infinite;
      }
      .lms-skeleton-title {
        width: 32%;
        height: 1.25rem;
      }
      .lms-skeleton-short {
        width: 60%;
      }
      @keyframes lms-pulse {
        50% {
          opacity: 0.5;
        }
      }

      :host-context(.dark) .tenant-lms-input {
        border-color: rgb(30 41 59);
        background: rgb(15 23 42);
        color: white;
      }

      :host-context(.dark) {
        color: white;
      }
      :host-context(.dark) .lms-section-heading p,
      :host-context(.dark) .lms-template-copy small,
      :host-context(.dark) .lms-domain-copy > span,
      :host-context(.dark) .lms-domain-copy small,
      :host-context(.dark) .lms-field-group > p,
      :host-context(.dark) .lms-form-footer span {
        color: rgb(148 163 184);
      }
      :host-context(.dark) .lms-button-secondary,
      :host-context(.dark) .lms-section,
      :host-context(.dark) .lms-template,
      :host-context(.dark) .lms-loading {
        border-color: rgb(30 41 59);
        background: rgb(15 23 42);
        color: rgb(226 232 240);
      }
      :host-context(.dark) .lms-button-secondary:hover:not(:disabled) {
        border-color: rgb(67 56 202);
        background: rgb(30 27 75);
        color: rgb(199 210 254);
      }
      :host-context(.dark) .lms-section-heading,
      :host-context(.dark) .lms-field-group + .lms-field-group,
      :host-context(.dark) .lms-section-manager,
      :host-context(.dark) .lms-section-list,
      :host-context(.dark) .lms-section-row {
        border-color: rgb(30 41 59);
      }
      :host-context(.dark) .lms-section-nav {
        border-color: rgb(30 41 59);
      }
      :host-context(.dark) .lms-section-nav a.is-current,
      :host-context(.dark) .lms-nav-trigger.is-current {
        background: rgb(30 27 75);
        color: rgb(199 210 254);
      }
      :host-context(.dark) .lms-section-nav a:hover,
      :host-context(.dark) .lms-nav-trigger:hover {
        background: rgb(30 41 59);
        color: white;
      }
      :host-context(.dark) .lms-selection-summary strong,
      :host-context(.dark) .lms-fields label,
      :host-context(.dark) .lms-section-row-copy strong,
      :host-context(.dark) .lms-enabled-control {
        color: rgb(226 232 240);
      }
      :host-context(.dark) .lms-navbar-item {
        border-color: rgb(30 41 59);
        background: rgb(15 23 42);
      }
      :host-context(.dark) .lms-button-editor > div + div {
        border-color: rgb(30 41 59);
      }
      :host-context(.dark) .lms-form-footer {
        border-color: rgb(51 65 85);
        background: rgb(15 23 42);
      }
      :host-context(.dark) .lms-publishing-pages-heading,
      :host-context(.dark) .lms-section-help {
        border-color: rgb(30 41 59);
      }
      :host-context(.dark) .lms-publishing-page-card {
        border-color: rgb(30 41 59);
        background: rgb(15 23 42);
        color: rgb(226 232 240);
      }
      :host-context(.dark) .lms-publishing-page-card:hover {
        border-color: rgb(67 56 202);
        background: rgb(30 27 75);
      }
      :host-context(.dark) .lms-publishing-page-icon {
        background: rgb(30 41 59);
        color: rgb(199 210 254);
      }
      :host-context(.dark) .lms-publishing-page-copy small,
      :host-context(.dark) .lms-publishing-pages-heading p,
      :host-context(.dark) .lms-publishing-pages-heading > span {
        color: rgb(148 163 184);
      }
      :host-context(.dark) .lms-section-help {
        background: rgb(30 41 59);
      }
      :host-context(.dark) .lms-skeleton {
        background: rgb(30 41 59);
      }

      @media (max-width: 64rem) {
        .lms-workspace {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        .lms-settings-content {
          padding: 0 0 3rem;
        }
        .lms-section-nav {
          position: sticky;
          top: 0;
          z-index: 10;
          grid-auto-flow: column;
          grid-auto-columns: minmax(10rem, 1fr);
          gap: 0.375rem;
          overflow-x: auto;
          overflow-y: hidden;
          min-height: auto;
          max-height: none;
          padding: 0.5rem;
          border: 1px solid rgb(226 232 240);
          border-radius: 0.75rem;
          background: rgb(248 250 252);
        }
        .lms-nav-group,
        .lms-subpage-nav {
          display: contents;
        }
        .lms-nav-trigger {
          width: auto;
          flex: 0 0 auto;
        }
        .lms-section-nav a {
          flex: 0 0 auto;
        }
        .lms-section-nav small {
          display: none;
        }
        .lms-subpage-nav a {
          min-height: auto;
          padding: 0.75rem;
          font-size: 0.75rem;
        }
        :host-context(.dark) .lms-section-nav {
          background: rgb(15 23 42);
        }
        .lms-section {
          scroll-margin-top: 5rem;
        }
        .lms-authoring-layout { grid-template-columns: 1fr; }
        .lms-course-list { position: static; grid-auto-flow: column; grid-auto-columns: minmax(13rem, 1fr); overflow-x: auto; overflow-y: hidden; max-height: none; border-right: 0; border-bottom: 1px solid rgb(226 232 240); }
        .lms-course-list-head { display: none; }
        .lms-course-details-layout { grid-template-columns: 1fr; }
        .lms-course-thumbnail-panel { max-width: 28rem; align-self: start; margin-top: 0; }
        .lms-preview-sales-layout { grid-template-columns: 1fr; }
        .lms-course-toolbar { grid-template-columns: minmax(14rem, 1fr) 10rem 12rem; }
        .lms-course-index-card-head { grid-template-columns: auto minmax(12rem, 1fr) auto; }
        .lms-course-index-meta { grid-column: 2 / 3; grid-row: 2; justify-content: start; }
        .lms-course-index-chevron { grid-column: 3; grid-row: 1 / 3; }
        .lms-course-index-panel { grid-template-columns: 1fr; padding-left: 6.35rem; }
        .lms-course-index-actions { justify-content: flex-start; }
        .lms-learner-save-footer { right: 0; left: 0; border-radius: 0; border-width: 1px 0 0; }
      }

      @media (max-width: 48rem) {
        .lms-section-heading,
        .lms-domain-row,
        .lms-publishing-pages-heading,
        .lms-form-footer {
          align-items: flex-start;
          flex-direction: column;
        }
        .lms-domain-row .lms-button,
        .lms-form-footer .lms-button {
          width: 100%;
          margin-left: 0;
        }
        .lms-publishing-page-grid {
          grid-template-columns: 1fr;
        }
        .lms-template-grid,
        .lms-fields,
        .lms-fields-three {
          grid-template-columns: 1fr;
        }
        .lms-stat-editor,
        .lms-stat-editor-four,
        .lms-image-layout {
          grid-template-columns: 1fr;
        }
        .lms-course-media { grid-template-columns: 1fr; }
        .lms-image-preview {
          min-height: 14rem;
        }
        .lms-image-preview img {
          height: 14rem;
        }
        .lms-field-wide {
          grid-column: auto;
        }
        .lms-grade-title-field {
          grid-column: auto;
        }
        .lms-template-grid,
        .lms-field-group,
        .lms-domain-row,
        .lms-section-manager {
          padding: 1rem;
        }
        .lms-fieldset-head {
          align-items: flex-start;
          flex-direction: column;
        }
        .lms-course-accordion-head {
          align-items: flex-start;
          flex-direction: column;
        }
        .lms-course-accordion-title small {
          white-space: normal;
        }
        .lms-required-pill {
          flex: 0 1 auto;
        }
        .lms-fields,
        .lms-fields-three {
          grid-template-columns: 1fr;
        }
        .lms-course-thumbnail-panel {
          max-width: none;
          align-self: start;
          margin-top: 0;
        }
        .lms-preview-media-fields,
        .lms-sales-grid {
          grid-template-columns: 1fr;
        }
        .lms-course-content-browser {
          grid-template-columns: 1fr;
        }
        .lms-course-content-tree-panel {
          max-width: none;
        }
        .lms-course-tree-row {
          flex-wrap: wrap;
        }
        .lms-course-tree-input {
          min-width: 12rem;
        }
        .lms-course-tree-description,
        .lms-course-tree-description-lesson,
        .lms-media-list,
        .lms-empty-lesson-state {
          margin-inline-start: 0;
          width: 100%;
        }
        .lms-section-heading {
          padding: 1rem;
        }
        .lms-manager-heading { flex-direction: column; }
        .lms-homepage-course-toolbar { padding-top: .85rem; }
        .lms-homepage-course-card-head { grid-template-columns: 1fr; gap: 0; }
        .lms-homepage-course-card-toggle { grid-template-columns: auto minmax(0, 1fr) auto; }
        .lms-homepage-course-card-facts { grid-column: 2 / 3; flex-wrap: wrap; padding-top: .35rem; }
        .lms-homepage-course-card-facts span { max-width: 100%; }
        .lms-homepage-course-card-head .lms-remove-button { width: fit-content; min-height: 2.4rem; margin: 0 1rem 1rem; }
        .lms-homepage-course-pagination { align-items: flex-start; flex-direction: column; }
        .lms-two-column-editor { grid-template-columns: 1fr; }
        .lms-course-form { padding: .75rem; }
        .lms-course-toolbar { grid-template-columns: 1fr; padding: 1rem; }
        .lms-course-card-list { padding: .75rem; }
        .lms-course-index-card-head { grid-template-columns: auto minmax(0, 1fr) auto; gap: .65rem; padding: .75rem; }
        .lms-course-index-thumb { width: 3.75rem; height: 2.5rem; }
        .lms-course-index-title-row { align-items: flex-start; flex-direction: column; gap: .35rem; }
        .lms-course-index-title-row strong { white-space: normal; }
        .lms-course-index-meta { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; padding-left: 4.4rem; }
        .lms-course-index-panel { padding: .85rem .75rem; }
        .lms-course-index-copy dl { grid-template-columns: 1fr 1fr; }
        .lms-course-index-actions { flex-wrap: wrap; }
        .lms-learner-form-shell { grid-template-columns: 1fr; gap: 1rem; padding: 1rem; }
        .lms-learner-avatar { width: 5rem; height: 5rem; margin-top: 0; }
        .lms-learner-avatar mat-icon { width: 3.5rem; height: 3.5rem; font-size: 3.5rem; }
        .lms-footer-actions { width: 100%; flex-direction: column-reverse; }
        .lms-footer-actions .lms-button { width: 100%; }
        .lms-learner-save-footer .lms-footer-actions { width: auto; flex-direction: row; }
        .lms-learner-save-footer .lms-footer-actions .lms-button { width: auto; }
        .lms-lesson-list, .lms-media-list { margin-left: 0; }
        .lms-curriculum-row { align-items: flex-start; flex-wrap: wrap; }
        .lms-tree-branch { display: none; }
        .lms-media-row { grid-template-columns: 1fr 1fr 2rem 2rem; }
        .lms-media-row > input:nth-of-type(2) { grid-column: 1 / -1; grid-row: 2; }
        .lms-danger-zone { align-items: flex-start; flex-direction: column; }
        .lms-section-control {
          align-items: flex-start;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          scroll-behavior: auto !important;
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantLmsSettingsComponent implements OnInit, OnDestroy {
  @ViewChild("builderDocumentPreviewHost") private builderDocumentPreviewHost?: ElementRef<HTMLElement>;

  private readonly data = inject(TenantLmsSettingsDataService);
  private readonly gradesData = inject(TenantGradesDataService);
  private readonly userCreateData = inject(TenantUserCreateDataService);
  private readonly builderDevRepository = inject(CourseBuilderDevRepository);
  private readonly usersData = inject(TenantUsersDataService);
  private readonly fb = inject(FormBuilder);
  private readonly identity = inject(AuthIdentityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private builderAutosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private builderRecordingTimer: ReturnType<typeof setInterval> | null = null;
  private builderMediaRecorder: MediaRecorder | null = null;
  private builderRecordedChunks: Blob[] = [];
  private builderDocumentPreviewer: { preview(data: ArrayBuffer): Promise<unknown>; destroy(): void } | null = null;
  private builderDocumentPreviewToken = 0;
  private readonly builderDocumentUrlByNodeId = new Map<string, string>();
  readonly builderQuillModules = {
    toolbar: [
      ['bold', 'italic', 'strike'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean'],
    ],
    history: { delay: 700, maxStack: 100, userOnly: true },
  };
  readonly builderContentEditorModules = {
    toolbar: [
      ['clean'],
      ['image'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'bullet' }, { list: 'ordered' }],
      ['blockquote'],
      ['link'],
    ],
    history: { delay: 700, maxStack: 100, userOnly: true },
  };
  readonly testQuestionOptions: CourseBuilderQuestionOption[] = [
    { type: "multipleChoice", label: "Multiple choice", icon: "view_week" },
    { type: "fillGaps", label: "Fill the gaps", icon: "keyboard_tab" },
    { type: "ordering", label: "Ordering", icon: "format_list_numbered" },
    { type: "matching", label: "Match the pairs", icon: "dynamic_feed" },
    { type: "freeText", label: "Free text", icon: "text_fields" },
    { type: "import", label: "Import questions", icon: "input" },
    { type: "existing", label: "Existing question", icon: "add_box" },
  ];
  readonly surveyQuestionOptions: CourseBuilderQuestionOption[] = [
    { type: "multipleChoice", label: "Multiple choice", icon: "view_column" },
    { type: "freeText", label: "Free text", icon: "match_case" },
    { type: "likertScale", label: "Likert scale", icon: "chat_bubble_outline" },
    { type: "existing", label: "Existing question", icon: "add_box" },
  ];
  readonly freeTextPointOptions = [0, 1, 2, 3, 4, 5];
  readonly aikenImportExample = `What is the correct answer to this question?
A. Is it this one?
B. Maybe this answer?
C. Possibly this one?
D. Must be this one!
ANSWER: C`;
  readonly giftCheatsheetSections: Array<{
    id: ImportCheatsheetSection;
    title: string;
    description: string;
    rules: string[];
    extra?: string;
    example: string;
  }> = [
    {
      id: "multipleChoice",
      title: "Multiple choice",
      description: "A GIFT multiple choice question entry must follow these rules:",
      rules: [
        "The question must be followed by an opening curly bracket.",
        "Each option must be typed on a different line.",
        "Each wrong option must be preceded by a tilde (~).",
        "Each correct option must be preceded by an equals symbol (=).",
        "The closing curly bracket goes on the last line.",
      ],
      extra: "You can have more than one correct answer.",
      example: `Pick the odd one out {
~Europe
~Asia
=Greenland
~Australia
}`,
    },
    {
      id: "trueFalse",
      title: "True or False",
      description: "A GIFT multiple choice question of the True or False type should follow these rules:",
      rules: [
        "Each statement must be typed on a different line.",
        "The true statement must be followed by the capitalized word TRUE or the capitalized letter T inside curly brackets, for example {TRUE} or {T}.",
        "The false statement must be followed by the capitalized word FALSE or the capitalized letter F inside curly brackets, for example {FALSE} or {F}.",
      ],
      example: `Grant is buried in Grant's tomb.{FALSE}

The sun rises in the east.{TRUE}`,
    },
    {
      id: "fillGaps",
      title: "Fill the gaps",
      description: "A GIFT fill-the-gap question entry must follow these rules:",
      rules: [
        "The sentence must be typed with the missing words inside curly brackets.",
        "The missing word must be preceded by an equals symbol (=).",
      ],
      example: "The {=quick} brown {=fox} jumps {=over} the lazy {=dog}",
    },
    {
      id: "matching",
      title: "Match the pairs",
      description: "A GIFT match the pairs question entry must follow these rules:",
      rules: [
        "The question must be followed by an opening curly bracket.",
        "Each correct match must be typed on a different line.",
        "Each correct match must be preceded by an equals symbol (=).",
        "Each matched option must be separated by a hyphen and a closing angle bracket (->).",
        "The closing curly bracket must go on the last line.",
      ],
      example: `Match the capitals {
=England -> London
=Germany -> Berlin
=Greece -> Athens
}`,
    },
    {
      id: "freeText",
      title: "Free text",
      description: "A GIFT free-text question entry must follow these rules:",
      rules: [
        "The question must be followed by an opening and a closing curly bracket ({}).",
      ],
      extra: "Free-text questions are imported without grading information. You can set your grading rules, such as points and keywords, when editing the individual question from the list later.",
      example: "Write about the Spanish civil war {}",
    },
  ];
  private navbarSaveQueue: Promise<void> = Promise.resolve();
  private homepageCourseCardSaveQueue: Promise<void> = Promise.resolve();
  private heroUploadScrollContainer: HTMLElement | null = null;
  private heroUploadScrollTop = 0;
  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly routeQueryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saveMessage = signal<string | null>(null);
  readonly heroImageMode = signal<"url" | "upload">("url");
  readonly uploadingHeroImage = signal(false);
  readonly heroImageUploadError = signal<string | null>(null);
  readonly aboutImageMode = signal<"url" | "upload">("url");
  readonly uploadingAboutImage = signal(false);
  readonly aboutImageUploadError = signal<string | null>(null);
  readonly uploadingCourseIndex = signal<number | null>(null);
  readonly courseImageUploadErrors = signal<Record<number, string>>({});
  readonly settings = signal<TenantLmsSettingsView | null>(null);
  readonly publishingExpanded = signal(false);
  readonly contentExpanded = signal(true);
  readonly expandedCourseEditorCards = signal(new Set<string>());
  readonly selectedCourseContentId = signal("content-root");
  private readonly currentBuilderNodeId = signal<string | null>(null);
  readonly expandedCourseContentIds = signal(new Set<string>(["content-root"]));
  readonly courseContentNodeModal = signal<CourseContentNodeModalState | null>(null);
  readonly courseContentNodeName = signal("");
  readonly courseContentNodeDescription = signal("");
  readonly courseContentNodeUnitType = signal<CourseContentUnitType>("CONTENT");
  readonly builderSearch = signal("");
  readonly builderCourseEditorTab = signal<"content" | "files">("content");
  readonly builderAddMenuOpen = signal(false);
  readonly builderAddMenuCategory = signal<CourseBuilderAddMenuCategory | null>(null);
  readonly builderInspectorOpen = signal(true);
  readonly builderAutosaveState = signal<CourseBuilderAutosaveState>("saved");
  readonly builderLastSavedAt = signal<string | null>(null);
  readonly builderSaveError = signal<string | null>(null);
  readonly builderSaveRevision = signal(0);
  readonly builderVideoSource = signal<CourseBuilderVideoSource>("none");
  readonly builderAudioSource = signal<CourseBuilderAudioSource>("none");
  readonly builderDocumentSource = signal<CourseBuilderDocumentSource>("none");
  readonly builderDocumentUrl = signal("");
  readonly builderDocumentUrlError = signal<string | null>(null);
  readonly builderDocumentPreviewKind = signal<CourseBuilderDocumentPreviewKind | null>(null);
  readonly builderDocumentPreviewLoading = signal(false);
  readonly builderDocumentPreviewError = signal<string | null>(null);
  readonly builderExternalVideoUrl = signal("");
  readonly builderExternalVideoError = signal<string | null>(null);
  readonly builderExternalVideoDraft = signal<ExternalVideoConfig | null>(null);
  readonly builderWebContentUrl = signal("");
  readonly builderWebContentError = signal<string | null>(null);
  readonly builderWebContentPreviewActive = signal(false);
  readonly builderIframeUrl = signal("");
  readonly builderIframeError = signal<string | null>(null);
  readonly builderIframePreviewActive = signal(false);
  readonly builderUploadFileName = signal("");
  readonly builderUploadProgress = signal(0);
  readonly builderUploadStatus = signal("No file selected");
  readonly builderUploadPreviewUrl = signal<string | null>(null);
  readonly builderUploadError = signal<string | null>(null);
  readonly builderUploadMediaStatus = signal<CourseMediaStatus>("LOCAL_PREVIEW");
  readonly builderRecordingActive = signal(false);
  readonly builderMediaDialog = signal<"camera" | "screen" | null>(null);
  readonly builderMediaStream = signal<MediaStream | null>(null);
  readonly builderRecordedPreviewUrl = signal<string | null>(null);
  readonly builderRecordingError = signal<string | null>(null);
  readonly builderRecordingSeconds = signal(0);
  readonly builderPublishBlockers = signal<CourseBuilderValidationBlocker[] | null>(null);
  readonly builderPreviewOpen = signal(false);
  readonly builderSelectedBlockId = signal<string | null>(null);
  readonly expandedTestQuestionId = signal<string | null>(null);
  readonly multipleChoiceQuestionDraft = signal<MultipleChoiceQuestionDraft | null>(null);
  readonly fillGapsQuestionDraft = signal<FillGapsQuestionDraft | null>(null);
  readonly orderingQuestionDraft = signal<OrderingQuestionDraft | null>(null);
  readonly matchPairsQuestionDraft = signal<MatchPairsQuestionDraft | null>(null);
  readonly freeTextQuestionDraft = signal<FreeTextQuestionDraft | null>(null);
  readonly importQuestionsDraft = signal<ImportQuestionsDraft | null>(null);
  readonly existingQuestionsDrawerOpen = signal(false);
  readonly existingQuestionPreview = signal<ExistingCourseQuestionOption | null>(null);
  readonly existingQuestionSearch = signal("");
  readonly importCheatsheetOpen = signal<ImportCheatsheetSection | null>("multipleChoice");
  readonly builderPendingDeleteNodeId = signal<string | null>(null);
  readonly builderBlocks = signal<CourseBuilderBlock[]>([]);
  readonly coursesLoading = signal(false);
  readonly courseSaving = signal(false);
  readonly courseUploading = signal(false);
  readonly courseError = signal<string | null>(null);
  readonly courseMessage = signal<string | null>(null);
  readonly managedCourses = signal<TenantLmsCourse[]>([]);
  readonly pendingDeleteCourse = signal<TenantLmsCourse | null>(null);
  readonly tenantGrades = signal<Grade[]>([]);
  readonly tenantUsers = signal<TenantUser[]>([]);
  readonly contentUsersLoading = signal(false);
  readonly contentUsersError = signal<string | null>(null);
  readonly contentUsersLoaded = signal(false);
  readonly learnerSaving = signal(false);
  readonly learnerAvatarUploading = signal(false);
  readonly learnerRoles = signal<TenantUserRoleOption[]>([]);
  readonly enrolledUserIds = signal<string[]>([]);
  readonly enrollDrawerOpen = signal(false);
  readonly addUserMenuOpen = signal(false);
  readonly contentUserSearch = signal("");
  readonly contentUserRoleFilter = signal("all");
  readonly contentUserStatusFilter = signal<"all" | TenantUser["status"]>("all");
  readonly contentUserPage = signal(1);
  readonly contentUserPageSize = signal(10);
  readonly enrollmentSearch = signal("");
  readonly enrollmentRoleFilter = signal("all");
  readonly enrollmentProgressFilter = signal<"all" | CourseProgressStatus>("all");
  readonly enrollmentPage = signal(1);
  readonly enrollmentPageSize = signal(10);
  readonly enrollmentProgressOverrides = signal<Record<string, Partial<Pick<CourseEnrollmentRow, "progressStatus" | "progress" | "completionDate">>>>({});
  readonly userDrawerSearch = signal("");
  readonly userDrawerRoleFilter = signal("all");
  readonly editingCourseId = signal<string | null>(null);
  readonly courseSearch = signal("");
  readonly courseStatusFilter = signal<"all" | "published" | "draft">("all");
  readonly courseGradeFilter = signal("all");
  readonly coursePage = signal(1);
  readonly coursePageSize = signal(5);
  readonly expandedCourseCardId = signal<string | null>(null);
  readonly homepageCourseCardSearch = signal("");
  readonly homepageCourseCardPage = signal(1);
  readonly expandedHomepageCourseCardIndex = signal<number | null>(null);
  readonly sectionDefinitions = LMS_SECTION_DEFINITIONS;
  readonly sections = signal<Record<string, boolean>>({});
  readonly activePage = computed(() => {
    const group = this.routeParamMap().get("group");
    const page = this.routeParamMap().get("page") ?? "publishing";
    if (group === "content" && page === "courses") return "contentCourses";
    if (group === "content" && (page === "learners" || page === "users")) return "contentUsers";
    if (page === "publishing" || page === "appearance" || page === "content") {
      return page;
    }
    return this.sectionDefinitions.some((section) => section.key === page)
      ? page
      : "publishing";
  });
  readonly courseMode = computed<"list" | "create" | "edit" | "preview">(() => this.routeData()["courseMode"] ?? "list");
  readonly selectedCourseId = computed(() => this.routeParamMap().get("courseId"));
  readonly selectedPreviewCourse = computed(() => this.managedCourses().find((course) => course.id === this.selectedCourseId()) ?? null);
  readonly courseContentPreviewId = computed(() => this.routeQueryParamMap().get("contentPreview"));
  readonly activeCourseContentPreviewId = computed(() => {
    const currentNodeId = this.currentBuilderNodeId();
    if (currentNodeId && this.findCourseContentNode(currentNodeId)) return currentNodeId;
    const queryNodeId = this.courseContentPreviewId();
    if (queryNodeId) return queryNodeId;
    return null;
  });
  readonly courseContentPreviewNode = computed(() => {
    const nodeId = this.activeCourseContentPreviewId();
    return nodeId ? this.findCourseContentNode(nodeId) : null;
  });
  readonly activeBuilderSlideShareUrl = computed(() => {
    const url = this.builderDocumentUrl().trim();
    if (url) return url;
    const settings = this.activeBuilderCourseContentNode()?.controls['settings']?.value as Record<string, unknown> | undefined;
    const savedUrl = settings?.["slideShareUrl"];
    return typeof savedUrl === "string" ? savedUrl.trim() : "";
  });
  readonly effectiveBuilderDocumentSource = computed<CourseBuilderDocumentSource>(() => {
    const source = this.builderDocumentSource();
    if (source === "upload" && this.builderUploadPreviewUrl()) return "upload";
    if (source === "slideshare" || this.activeBuilderSlideShareUrl()) return "slideshare";
    return "none";
  });
  readonly activeBuilderExternalVideoConfig = computed<ExternalVideoConfig | null>(() => {
    const draft = this.builderExternalVideoDraft();
    if (draft) return draft;
    const externalVideo = this.activeBuilderCourseContentNode()?.controls['externalVideo']?.value as ExternalVideoConfig | null;
    return externalVideo ?? null;
  });
  readonly effectiveBuilderVideoSource = computed<CourseBuilderVideoSource>(() => {
    const source = this.builderVideoSource();
    if (source === "upload" && this.builderUploadPreviewUrl()) return "upload";
    if (source === "url" || this.activeBuilderExternalVideoConfig()) return "url";
    return source;
  });
  readonly builderExternalVideoPreviewUrl = computed<SafeResourceUrl | null>(() => {
    const embedUrl = this.activeBuilderExternalVideoConfig()?.embedUrl ?? this.toSupportedVideoEmbedUrl(this.builderExternalVideoUrl());
    return embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
  });
  readonly builderWebContentPreviewUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.normalizedWebContentUrl(this.builderWebContentUrl());
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  readonly builderIframePreviewUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.normalizedWebContentUrl(this.builderIframeUrl());
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  readonly builderDocumentPdfPreviewUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.builderDocumentPreviewKind() === "pdf" ? this.builderUploadPreviewUrl() : null;
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  readonly builderDocumentPresentationPreviewUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.toPresentationEmbedUrl(this.activeBuilderSlideShareUrl());
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
  readonly isCourseContentNodePreview = computed(() =>
    this.activePage() === "contentCourses" &&
    (this.courseMode() === "create" || this.courseMode() === "edit") &&
    !!this.courseContentPreviewNode(),
  );
  readonly isBuilderRootSelected = computed(() => !this.courseContentPreviewNode());
  readonly isCourseEditor = computed(() => this.activePage() === "contentCourses" && (this.courseMode() === "create" || this.courseMode() === "edit"));
  readonly isLearnerCreator = computed(() => this.activePage() === "contentUsers" && this.courseMode() === "create");
  readonly contentLearners = computed(() => this.tenantUsers().filter((user) => user.userType === "LEARNER"));
  readonly filteredContentUsers = computed(() => {
    const query = this.contentUserSearch().trim().toLocaleLowerCase();
    const role = this.contentUserRoleFilter();
    const status = this.contentUserStatusFilter();
    return this.contentLearners().filter((user) => {
      const matchesQuery = !query || [user.name, user.email, user.role].some((value) => value.toLocaleLowerCase().includes(query));
      const matchesRole = role === "all" || user.role === role;
      const matchesStatus = status === "all" || user.status === status;
      return matchesQuery && matchesRole && matchesStatus;
    });
  });
  readonly contentUserRoleOptions = computed(() => Array.from(new Set(this.contentLearners().map((user) => user.role))).sort());
  readonly filteredManagedCourses = computed(() => {
    const query = this.courseSearch().trim().toLocaleLowerCase();
    const status = this.courseStatusFilter();
    const gradeId = this.courseGradeFilter();
    return this.managedCourses().filter((course) => {
      const matchesQuery = !query || [course.title, course.gradeName, course.slug, course.subtitle ?? ""].some((value) => value.toLocaleLowerCase().includes(query));
      const matchesStatus = status === "all" || (status === "published" ? course.published : !course.published);
      const matchesGrade = gradeId === "all" || course.gradeId === gradeId;
      return matchesQuery && matchesStatus && matchesGrade;
    });
  });
  readonly pagedContentUsers = computed(() => {
    const start = (this.contentUserPage() - 1) * this.contentUserPageSize();
    return this.filteredContentUsers().slice(start, start + this.contentUserPageSize());
  });
  readonly contentUserPageCount = computed(() => Math.max(1, Math.ceil(this.filteredContentUsers().length / this.contentUserPageSize())));
  readonly contentUserResultStart = computed(() => this.filteredContentUsers().length ? (this.contentUserPage() - 1) * this.contentUserPageSize() + 1 : 0);
  readonly contentUserResultEnd = computed(() => Math.min(this.contentUserPage() * this.contentUserPageSize(), this.filteredContentUsers().length));
  readonly pagedManagedCourses = computed(() => {
    const start = (this.coursePage() - 1) * this.coursePageSize();
    return this.filteredManagedCourses().slice(start, start + this.coursePageSize());
  });
  readonly coursePageCount = computed(() => Math.max(1, Math.ceil(this.filteredManagedCourses().length / this.coursePageSize())));
  readonly courseResultStart = computed(() => this.filteredManagedCourses().length ? (this.coursePage() - 1) * this.coursePageSize() + 1 : 0);
  readonly courseResultEnd = computed(() => Math.min(this.coursePage() * this.coursePageSize(), this.filteredManagedCourses().length));
  readonly courseEnrollmentRows = computed<CourseEnrollmentRow[]>(() => {
    const users = this.contentLearners().filter((user) => this.enrolledUserIds().includes(user.id));
    const overrides = this.enrollmentProgressOverrides();
    return users.map((user, index) => ({ ...this.toCourseEnrollmentRow(user, index), ...overrides[user.id] }));
  });
  readonly enrollmentRoleOptions = computed(() => Array.from(new Set(this.courseEnrollmentRows().map((row) => row.role))).sort());
  readonly drawerRoleOptions = computed(() => Array.from(new Set(this.contentLearners().map((user) => user.role))).sort());
  readonly filteredCourseEnrollmentRows = computed(() => {
    const query = this.enrollmentSearch().trim().toLocaleLowerCase();
    const role = this.enrollmentRoleFilter();
    const progress = this.enrollmentProgressFilter();
    return this.courseEnrollmentRows().filter((row) => {
      const matchesQuery = !query || [row.userName, row.email, row.role].some((value) => value.toLocaleLowerCase().includes(query));
      const matchesRole = role === "all" || row.role === role;
      const matchesProgress = progress === "all" || row.progressStatus === progress;
      return matchesQuery && matchesRole && matchesProgress;
    });
  });
  readonly pagedCourseEnrollmentRows = computed(() => {
    const start = (this.enrollmentPage() - 1) * this.enrollmentPageSize();
    return this.filteredCourseEnrollmentRows().slice(start, start + this.enrollmentPageSize());
  });
  readonly enrollmentPageCount = computed(() => Math.max(1, Math.ceil(this.filteredCourseEnrollmentRows().length / this.enrollmentPageSize())));
  readonly enrollmentResultStart = computed(() => this.filteredCourseEnrollmentRows().length ? (this.enrollmentPage() - 1) * this.enrollmentPageSize() + 1 : 0);
  readonly enrollmentResultEnd = computed(() => Math.min(this.enrollmentPage() * this.enrollmentPageSize(), this.filteredCourseEnrollmentRows().length));
  readonly filteredDrawerUsers = computed(() => {
    const query = this.userDrawerSearch().trim().toLocaleLowerCase();
    const role = this.userDrawerRoleFilter();
    return this.contentLearners().filter((user) => {
      const matchesQuery = !query || [user.name, user.email, user.role].some((value) => value.toLocaleLowerCase().includes(query));
      const matchesRole = role === "all" || user.role === role;
      return matchesQuery && matchesRole;
    });
  });
  readonly allDrawerUsersEnrolled = computed(() => {
    const users = this.filteredDrawerUsers();
    const selected = new Set(this.enrolledUserIds());
    return users.length > 0 && users.every((user) => selected.has(user.id));
  });
  readonly selectedSection = computed(() =>
    this.sectionDefinitions.find((section) => section.key === this.activePage()) ?? null,
  );
  readonly isPublishingGroupActive = computed(
    () => this.activePage() !== "appearance" && this.activePage() !== "content" && this.activePage() !== "contentCourses" && this.activePage() !== "contentUsers",
  );
  readonly isContentGroupActive = computed(() => this.activePage() === "content" || this.activePage() === "contentCourses" || this.activePage() === "contentUsers");
  readonly enabledSectionCount = computed(() =>
    this.sectionDefinitions.filter((section) => this.sectionEnabled(section.key)).length,
  );
  private readonly contentUsersRouteLoader = effect(() => {
    if (!this.settings() || this.activePage() !== "contentUsers" || this.contentUsersLoaded() || this.contentUsersLoading()) {
      return;
    }
    void this.loadContentUsers();
  });

  readonly hasLmsFromIdentity = computed(
    () =>
      this.identity.identity()?.tenantPlan?.moduleCodes?.includes("lms") ??
      false,
  );

  readonly form = this.fb.nonNullable.group({
    websiteEnabled: [true],
    selectedTemplateKey: ["classic-math", Validators.required],
    teacherName: [""],
    subject: [""],
    audience: [""],
    headline: [""],
    subheadline: [""],
    announcement: [""],
    primaryCtaLabel: [""],
    primaryCtaRoute: ["/pricing", Validators.required],
    secondaryCtaLabel: [""],
    secondaryCtaRoute: ["/login", Validators.required],
    portraitImageUrl: [""],
    logoImageUrl: [""],
    navigation: this.fb.array(
      DEFAULT_NAVIGATION.map((item) => this.fb.nonNullable.group({
        key: [item.key],
        label: [item.label, Validators.required],
        route: [item.route, Validators.required],
        enabled: [item.enabled],
      })),
    ),
    hero: this.fb.nonNullable.group({
      badge: [DEFAULT_HERO.badge, Validators.required],
      headline: [DEFAULT_HERO.headline, Validators.required],
      highlightedHeadline: [DEFAULT_HERO.highlightedHeadline, Validators.required],
      description: [DEFAULT_HERO.description, Validators.required],
      primaryButtonLabel: [DEFAULT_HERO.primaryButtonLabel, Validators.required],
      primaryButtonRoute: [DEFAULT_HERO.primaryButtonRoute, Validators.required],
      secondaryButtonLabel: [DEFAULT_HERO.secondaryButtonLabel, Validators.required],
      secondaryButtonRoute: [DEFAULT_HERO.secondaryButtonRoute, Validators.required],
      miniStats: this.fb.array(DEFAULT_HERO.miniStats.map((stat) => this.fb.nonNullable.group({
        value: [stat.value, Validators.required],
        label: [stat.label, Validators.required],
      }))),
      imageUrl: [DEFAULT_HERO.imageUrl, Validators.required],
      imageAlt: [DEFAULT_HERO.imageAlt, Validators.required],
      imageBadge: [DEFAULT_HERO.imageBadge, Validators.required],
      imageName: [DEFAULT_HERO.imageName, Validators.required],
      imageCaption: [DEFAULT_HERO.imageCaption, Validators.required],
      stats: this.fb.array(DEFAULT_HERO.stats.map((stat) => this.fb.nonNullable.group({
        value: [stat.value, Validators.required],
        label: [stat.label, Validators.required],
      }))),
    }),
    grades: this.fb.nonNullable.group({
      eyebrow: [DEFAULT_GRADES.eyebrow, Validators.required],
      headline: [DEFAULT_GRADES.headline, Validators.required],
      description: [DEFAULT_GRADES.description, Validators.required],
      items: this.fb.array(DEFAULT_GRADES.items.map((item) => this.fb.nonNullable.group({
        number: [item.number, Validators.required],
        title: [item.title, Validators.required],
        description: [item.description, Validators.required],
        unitsLabel: [item.unitsLabel, Validators.required],
        actionLabel: [item.actionLabel, Validators.required],
        route: [item.route, Validators.required],
      }))),
    }),
    aboutTeacher: this.fb.nonNullable.group({
      eyebrow: [DEFAULT_ABOUT_TEACHER.eyebrow, Validators.required],
      headline: [DEFAULT_ABOUT_TEACHER.headline, Validators.required],
      firstParagraphPrefix: [DEFAULT_ABOUT_TEACHER.firstParagraphPrefix, Validators.required],
      experienceHighlight: [DEFAULT_ABOUT_TEACHER.experienceHighlight, Validators.required],
      firstParagraphSuffix: [DEFAULT_ABOUT_TEACHER.firstParagraphSuffix, Validators.required],
      secondParagraph: [DEFAULT_ABOUT_TEACHER.secondParagraph, Validators.required],
      imageUrl: [DEFAULT_ABOUT_TEACHER.imageUrl, Validators.required],
      imageAlt: [DEFAULT_ABOUT_TEACHER.imageAlt, Validators.required],
      stats: this.fb.array(DEFAULT_ABOUT_TEACHER.stats.map((stat) => this.fb.nonNullable.group({
        value: [stat.value, Validators.required],
        label: [stat.label, Validators.required],
      }))),
      signature: [DEFAULT_ABOUT_TEACHER.signature, Validators.required],
    }),
    courses: this.fb.nonNullable.group({
      eyebrow: [DEFAULT_COURSES.eyebrow, Validators.required],
      headline: [DEFAULT_COURSES.headline, Validators.required],
      description: [DEFAULT_COURSES.description, Validators.required],
      items: this.fb.array(DEFAULT_COURSES.items.map((item) => this.createCourseGroup(item))),
      allCoursesLabel: [DEFAULT_COURSES.allCoursesLabel, Validators.required],
      allCoursesRoute: [DEFAULT_COURSES.allCoursesRoute, Validators.required],
    }),
  });

  readonly courseForm = this.fb.nonNullable.group({
    gradeId: ["", Validators.required], slug: ["", [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    title: ["", Validators.required], subtitle: [""], description: [""], thumbnailUrl: [""],
    previewMediaUrl: [""], previewMediaType: ["NONE"], price: [0, [Validators.required, Validators.min(0)]],
    oldPrice: this.fb.control<number | null>(null, Validators.min(0)), currency: ["EGP", Validators.required],
    durationLabel: [""], studentsLabel: [""], ratingLabel: [""], published: [false],
    learningOutcomes: this.fb.array<FormControl<string>>([]), features: this.fb.array<FormControl<string>>([]),
    curriculum: this.fb.array<FormGroup<any>>([]),
  });

  readonly learnerForm = this.fb.nonNullable.group({
    avatarUrl: [""],
    firstName: ["", Validators.required],
    lastName: ["", Validators.required],
    email: ["", Validators.email],
    bio: [""],
    username: ["", Validators.required],
    password: ["", [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
    status: ["active", Validators.required],
    roleId: [""],
  });

  private readonly heroImageUrlValue = toSignal(
    this.form.controls.hero.controls.imageUrl.valueChanges,
    { initialValue: this.form.controls.hero.controls.imageUrl.value },
  );

  readonly heroImagePreviewUrl = computed(() =>
    this.resolveAssetUrl(this.heroImageUrlValue()),
  );

  private readonly aboutImageUrlValue = toSignal(
    this.form.controls.aboutTeacher.controls.imageUrl.valueChanges,
    { initialValue: this.form.controls.aboutTeacher.controls.imageUrl.value },
  );

  readonly aboutImagePreviewUrl = computed(() =>
    this.resolveAssetUrl(this.aboutImageUrlValue()),
  );

  private readonly courseThumbnailUrlValue = toSignal(
    this.courseForm.controls.thumbnailUrl.valueChanges,
    { initialValue: this.courseForm.controls.thumbnailUrl.value },
  );

  readonly courseThumbnailPreviewUrl = computed(() =>
    this.resolveAssetUrl(this.courseThumbnailUrlValue()),
  );

  private readonly coursePreviewMediaTypeValue = toSignal(
    this.courseForm.controls.previewMediaType.valueChanges,
    { initialValue: this.courseForm.controls.previewMediaType.value },
  );

  private readonly coursePreviewMediaUrlValue = toSignal(
    this.courseForm.controls.previewMediaUrl.valueChanges,
    { initialValue: this.courseForm.controls.previewMediaUrl.value },
  );

  readonly coursePreviewMediaType = computed(() => this.coursePreviewMediaTypeValue());

  readonly previewMediaPreviewUrl = computed(() =>
    this.resolveAssetUrl(this.coursePreviewMediaUrlValue()),
  );

  readonly coursePreviewMediaTypeLabel = computed(() => {
    switch (this.coursePreviewMediaType()) {
      case "VIDEO": return "Video";
      case "IMAGE": return "Image";
      case "AUDIO": return "Audio";
      default: return "No";
    }
  });

  readonly previewMediaIcon = computed(() => {
    switch (this.coursePreviewMediaType()) {
      case "VIDEO": return "play_circle";
      case "IMAGE": return "image";
      case "AUDIO": return "graphic_eq";
      default: return "hide_source";
    }
  });

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    this.clearBuilderAutosaveTimer();
    this.revokeBuilderObjectUrls();
    this.stopAllBuilderMediaTracks();
  }

  @HostListener("window:beforeunload", ["$event"])
  protectUnsavedBuilderChanges(event: BeforeUnloadEvent): void {
    if (this.builderAutosaveState() === "dirty" || this.builderAutosaveState() === "saving") {
      event.preventDefault();
      event.returnValue = "";
    }
  }

  @HostListener("document:click")
  closeBuilderAddMenu(): void {
    this.builderAddMenuOpen.set(false);
    this.builderAddMenuCategory.set(null);
  }

  @HostListener("document:keydown.escape")
  closeBuilderAddMenuOnEscape(): void {
    this.closeBuilderAddMenu();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const settings = await this.data.getSettings();
      this.applySettings(settings);
      await this.loadManagedCourseData();
      await this.ensureContentUsersLoaded();
      if (this.courseMode() !== "create" || this.courseContentPreviewId()) {
        await this.loadBuilderDevSnapshot();
      }
      this.syncCourseContentSelectionFromRoute();
      this.syncBuilderStateFromSelectedNode();
    } catch {
      this.loadError.set("Unable to load LMS settings right now.");
    } finally {
      this.loading.set(false);
    }
  }

  selectTemplate(templateKey: string): void {
    this.form.controls.selectedTemplateKey.setValue(templateKey);
    this.saveMessage.set(null);
  }

  sectionEnabled(key: string): boolean {
    return this.sections()[key] !== false;
  }

  toggleSection(key: string): void {
    if (this.saving() || !this.settings()?.lmsEnabled) {
      return;
    }
    this.sections.update((sections) => ({ ...sections, [key]: !this.sectionEnabled(key) }));
    this.saveMessage.set(null);
  }

  togglePublishingGroup(): void {
    this.publishingExpanded.update((expanded) => !expanded);
  }

  toggleContentGroup(): void { this.contentExpanded.update((expanded) => !expanded); }

  async loadManagedCourseData(): Promise<void> {
    this.coursesLoading.set(true);
    this.courseError.set(null);
    try {
      const [courses, grades] = await Promise.all([this.data.listManagedCourses(), this.gradesData.listGrades()]);
      this.managedCourses.set(courses);
      this.tenantGrades.set(grades);
      this.reconcileHomepageCourseCardsWithGrades();
      this.ensureCoursePageInRange();
      if (this.courseMode() === "create") {
        this.startNewCourse();
      } else if (this.courseMode() === "edit") {
        const courseId = this.routeParamMap().get("courseId");
        const selectedCourse = courses.find((course) => course.id === courseId);
        if (selectedCourse) this.editManagedCourse(selectedCourse);
        else this.courseError.set("This course could not be found.");
      } else if (this.courseMode() === "preview") {
        const courseId = this.routeParamMap().get("courseId");
        if (!courses.some((course) => course.id === courseId)) {
          this.courseError.set("This course could not be found.");
        }
        await this.loadCoursePreviewUsers();
      }
    } catch (error) {
      this.courseError.set(this.gradesData.toUserMessage(error, "Unable to load courses and tenant grades."));
    } finally { this.coursesLoading.set(false); }
  }

  private async loadCoursePreviewUsers(): Promise<void> {
    try {
      await this.usersData.loadLearners();
      const users = this.usersData.users();
      this.tenantUsers.set(users);
      this.contentUsersLoaded.set(true);
      if (!this.enrolledUserIds().length) {
        const learners = users.filter((user) => user.userType === "LEARNER");
        this.enrolledUserIds.set(learners.slice(0, Math.min(learners.length, 12)).map((user) => user.id));
      }
      this.ensureEnrollmentPageInRange();
    } catch {
      this.tenantUsers.set([]);
      this.enrolledUserIds.set([]);
      this.courseError.set("Unable to load existing users for course enrollment.");
    }
  }

  private async ensureContentUsersLoaded(): Promise<void> {
    if (this.contentUsersLoaded() || this.contentUsersLoading()) {
      return;
    }
    await this.loadContentUsers();
  }

  private async loadContentUsers(): Promise<void> {
    this.contentUsersLoading.set(true);
    this.contentUsersError.set(null);
    try {
      await this.usersData.loadLearners();
      this.tenantUsers.set(this.usersData.users());
      this.contentUsersLoaded.set(true);
      this.ensureContentUserPageInRange();
    } catch {
      this.tenantUsers.set([]);
      this.contentUsersLoaded.set(false);
      this.contentUsersError.set("Unable to load tenant users right now.");
    } finally {
      this.contentUsersLoading.set(false);
    }
  }

  async saveLearner(): Promise<void> {
    if (this.learnerForm.invalid || this.learnerSaving()) {
      this.learnerForm.markAllAsTouched();
      this.contentUsersError.set(this.learnerValidationMessage());
      return;
    }
    this.learnerSaving.set(true);
    this.contentUsersError.set(null);
    try {
      const raw = this.learnerForm.getRawValue();
      await firstValueFrom(this.userCreateData.createLearner({
        fullName: `${raw.firstName.trim()} ${raw.lastName.trim()}`.trim(),
        email: raw.email.trim(),
        username: raw.username.trim(),
        avatarUrl: raw.avatarUrl.trim() || null,
        roleId: "",
        enabled: raw.status === "active",
        sendInvite: false,
        password: raw.password,
      }));
      this.learnerForm.reset({ avatarUrl: "", firstName: "", lastName: "", email: "", bio: "", username: "", password: "", status: "active", roleId: this.learnerRoles()[0]?.id ?? "" });
      this.contentUsersLoaded.set(false);
      await this.loadContentUsers();
      await this.router.navigate(["/tenant/lms-settings/content/learners"]);
    } catch (error: any) {
      this.contentUsersError.set(error?.error?.message || "Unable to save this learner.");
    } finally {
      this.learnerSaving.set(false);
    }
  }

  private learnerValidationMessage(): string {
    const controls = this.learnerForm.controls;
    if (controls.firstName.invalid) return "First name is required.";
    if (controls.lastName.invalid) return "Last name is required.";
    if (controls.email.invalid) return "Enter a valid email address or leave it empty.";
    if (controls.username.invalid) return "Username is required.";
    if (controls.password.hasError("required")) return "Password is required.";
    if (controls.password.invalid) return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
    if (controls.status.invalid) return "Choose learner status.";
    return "Complete the required learner details before saving.";
  }

  startNewCourse(): void {
    this.editingCourseId.set(null); this.courseError.set(null); this.courseMessage.set(null);
    this.courseForm.reset({ gradeId: "", slug: "", title: "", subtitle: "", description: "", thumbnailUrl: "", previewMediaUrl: "", previewMediaType: "NONE", price: 0, oldPrice: null, currency: "EGP", durationLabel: "", studentsLabel: "", ratingLabel: "", published: false });
    this.learningOutcomeControls().clear(); this.featureControls().clear(); this.curriculumControls().clear();
    this.selectedCourseContentId.set("content-root");
  }

  setCourseSearch(event: Event): void { this.courseSearch.set((event.target as HTMLInputElement).value); this.resetCourseListPaging(); }
  setCourseStatusFilter(event: Event): void { this.courseStatusFilter.set((event.target as HTMLSelectElement).value as "all" | "published" | "draft"); this.resetCourseListPaging(); }
  setCourseGradeFilter(event: Event): void { this.courseGradeFilter.set((event.target as HTMLSelectElement).value); this.resetCourseListPaging(); }
  isCourseCardExpanded(courseId: string): boolean { return this.expandedCourseCardId() === courseId; }
  toggleCourseCard(courseId: string): void {
    this.expandedCourseCardId.update((expandedId) => expandedId === courseId ? null : courseId);
  }
  setHomepageCourseCardSearch(event: Event): void {
    this.homepageCourseCardSearch.set((event.target as HTMLInputElement).value);
    this.resetHomepageCourseCardPaging();
  }
  homepageCourseOptions(index: number): TenantLmsCourse[] {
    const gradeId = this.form.controls.courses.controls.items.at(index)?.controls.gradeId.value;
    if (!gradeId) {
      return [];
    }
    return this.managedCourses().filter((course) => course.gradeId === gradeId);
  }
  private homepageCourseGradeName(gradeId: string): string {
    return this.tenantGrades().find((grade) => grade.id === gradeId)?.name ?? "";
  }
  private reconcileHomepageCourseCardsWithGrades(): void {
    const grades = this.tenantGrades();
    const courses = this.managedCourses();
    this.form.controls.courses.controls.items.controls.forEach((item) => {
      if (item.controls.gradeId.value) return;
      const selectedCourse = courses.find((course) => course.id === item.controls.courseId.value);
      const grade = selectedCourse
        ? grades.find((candidate) => candidate.id === selectedCourse.gradeId)
        : grades.find((candidate) => candidate.name === item.controls.level.value || candidate.level === item.controls.level.value);
      if (!grade) return;
      item.patchValue({
        gradeId: grade.id,
        level: selectedCourse?.gradeName ?? grade.name,
      }, { emitEvent: false });
    });
  }
  filteredHomepageCourseCardIndexes(): number[] {
    const query = this.homepageCourseCardSearch().trim().toLocaleLowerCase();
    const items = this.form.controls.courses.controls.items.controls;
    return items.reduce<number[]>((indexes, item, index) => {
      const values = [
        item.controls.title.value,
        item.controls.level.value,
        this.homepageCourseGradeName(item.controls.gradeId.value),
        item.controls.route.value,
        item.controls.lessonsLabel.value,
        item.controls.ratingLabel.value,
        item.controls.price.value,
        item.controls.oldPrice.value,
        item.controls.actionLabel.value,
      ];
      if (!query || values.some((value) => `${value ?? ""}`.toLocaleLowerCase().includes(query))) {
        indexes.push(index);
      }
      return indexes;
    }, []);
  }
  pagedHomepageCourseCardIndexes(): number[] {
    const start = (this.homepageCourseCardPage() - 1) * 5;
    return this.filteredHomepageCourseCardIndexes().slice(start, start + 5);
  }
  filteredHomepageCourseCardCount(): number { return this.filteredHomepageCourseCardIndexes().length; }
  homepageCourseCardPageCount(): number { return Math.max(1, Math.ceil(this.filteredHomepageCourseCardCount() / 5)); }
  homepageCourseCardResultStart(): number { return this.filteredHomepageCourseCardCount() ? (this.homepageCourseCardPage() - 1) * 5 + 1 : 0; }
  homepageCourseCardResultEnd(): number { return Math.min(this.homepageCourseCardPage() * 5, this.filteredHomepageCourseCardCount()); }
  isHomepageCourseCardExpanded(index: number): boolean { return this.expandedHomepageCourseCardIndex() === index; }
  toggleHomepageCourseCard(index: number): void {
    this.expandedHomepageCourseCardIndex.update((expandedIndex) => expandedIndex === index ? null : index);
  }
  setContentUserSearch(event: Event): void { this.contentUserSearch.set((event.target as HTMLInputElement).value); this.contentUserPage.set(1); }
  setContentUserRoleFilter(event: Event): void { this.contentUserRoleFilter.set((event.target as HTMLSelectElement).value); this.contentUserPage.set(1); }
  setContentUserStatusFilter(event: Event): void { this.contentUserStatusFilter.set((event.target as HTMLSelectElement).value as "all" | TenantUser["status"]); this.contentUserPage.set(1); }
  toggleAddUserMenu(): void { this.addUserMenuOpen.update((open) => !open); }
  closeAddUserMenu(): void { this.addUserMenuOpen.set(false); }
  importLearners(): void { this.closeAddUserMenu(); }
  setEnrollmentSearch(event: Event): void { this.enrollmentSearch.set((event.target as HTMLInputElement).value); this.enrollmentPage.set(1); }
  setEnrollmentRoleFilter(event: Event): void { this.enrollmentRoleFilter.set((event.target as HTMLSelectElement).value); this.enrollmentPage.set(1); }
  setEnrollmentProgressFilter(event: Event): void { this.enrollmentProgressFilter.set((event.target as HTMLSelectElement).value as "all" | CourseProgressStatus); this.enrollmentPage.set(1); }
  setUserDrawerSearch(event: Event): void { this.userDrawerSearch.set((event.target as HTMLInputElement).value); }
  setUserDrawerRoleFilter(event: Event): void { this.userDrawerRoleFilter.set((event.target as HTMLSelectElement).value); }
  goToEnrollmentPage(page: number): void {
    this.enrollmentPage.set(Math.min(Math.max(page, 1), this.enrollmentPageCount()));
  }
  goToCoursePage(page: number): void {
    this.coursePage.set(Math.min(Math.max(page, 1), this.coursePageCount()));
    this.expandedCourseCardId.set(null);
  }
  goToHomepageCourseCardPage(page: number): void {
    this.homepageCourseCardPage.set(Math.min(Math.max(page, 1), this.homepageCourseCardPageCount()));
    this.expandedHomepageCourseCardIndex.set(null);
  }
  goToContentUserPage(page: number): void {
    this.contentUserPage.set(Math.min(Math.max(page, 1), this.contentUserPageCount()));
  }
  setCoursePageSize(event: Event): void {
    this.coursePageSize.set(this.toValidPageSize((event.target as HTMLSelectElement).value));
    this.coursePage.set(1);
  }
  setContentUserPageSize(event: Event): void {
    this.contentUserPageSize.set(this.toValidPageSize((event.target as HTMLSelectElement).value));
    this.contentUserPage.set(1);
  }
  setEnrollmentPageSize(event: Event): void {
    this.enrollmentPageSize.set(this.toValidPageSize((event.target as HTMLSelectElement).value));
    this.enrollmentPage.set(1);
  }
  openEnrollDrawer(): void { this.enrollDrawerOpen.set(true); }
  closeEnrollDrawer(): void { this.enrollDrawerOpen.set(false); }
  isUserEnrolled(userId: string): boolean { return this.enrolledUserIds().includes(userId); }
  addUserToCourse(user: TenantUser): void {
    if (this.isUserEnrolled(user.id)) return;
    this.enrolledUserIds.update((ids) => [...ids, user.id]);
    this.ensureEnrollmentPageInRange();
  }
  toggleAllDrawerUsers(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const drawerIds = this.filteredDrawerUsers().map((user) => user.id);
    if (checked) {
      const next = new Set(this.enrolledUserIds());
      drawerIds.forEach((id) => next.add(id));
      this.enrolledUserIds.set(Array.from(next));
    } else {
      const drawerSet = new Set(drawerIds);
      this.enrolledUserIds.update((ids) => ids.filter((id) => !drawerSet.has(id)));
    }
    this.ensureEnrollmentPageInRange();
  }
  removeUserFromCourse(userId: string): void {
    this.enrolledUserIds.update((ids) => ids.filter((id) => id !== userId));
    this.enrollmentProgressOverrides.update((overrides) => {
      const { [userId]: _removed, ...remaining } = overrides;
      return remaining;
    });
    this.ensureEnrollmentPageInRange();
  }
  resetUserCourseProgress(userId: string): void {
    this.enrollmentProgressOverrides.update((overrides) => ({
      ...overrides,
      [userId]: { progressStatus: "not-started", progress: 0, completionDate: null },
    }));
    this.ensureEnrollmentPageInRange();
  }
  progressStatusLabel(status: CourseProgressStatus): string {
    switch (status) {
      case "completed": return "Completed";
      case "expired": return "Expired";
      case "in-progress": return "In progress";
      default: return "Not started";
    }
  }
  progressStatusIcon(status: CourseProgressStatus): string {
    switch (status) {
      case "completed": return "check_circle";
      case "expired": return "schedule";
      case "in-progress": return "trending_up";
      default: return "radio_button_unchecked";
    }
  }
  courseLessonCount(course: TenantLmsCourse): number {
    const countNodes = (nodes: TenantLmsCourseCurriculumNode[]): number => nodes.reduce((total, node) => total + (node.children.length ? countNodes(node.children) : 1), 0);
    return countNodes(course.curriculum);
  }

  coursePreviewRoute(course: TenantLmsCourse): string[] {
    return ["/tenant/lms-settings/content/courses", course.id, "preview"];
  }

  private toCourseEnrollmentRow(user: TenantUser, index: number): CourseEnrollmentRow {
    const statuses: CourseProgressStatus[] = ["in-progress", "completed", "not-started", "expired"];
    const status = statuses[index % statuses.length];
    const enrolledAt = new Date(2026, 6, 1 + (index % 18));
    const expiresAt = new Date(enrolledAt);
    expiresAt.setMonth(expiresAt.getMonth() + 3);
    const completedAt = status === "completed" ? new Date(enrolledAt.getTime() + 1000 * 60 * 60 * 24 * (7 + (index % 10))) : null;
    const progress = status === "completed" ? 100 : status === "in-progress" ? 35 + ((index * 13) % 55) : status === "expired" ? 18 : 0;
    return {
      userId: user.id,
      userName: user.name,
      email: user.email,
      role: user.role,
      progressStatus: status,
      enrollmentDate: enrolledAt.toISOString(),
      completionDate: completedAt?.toISOString() ?? null,
      expirationDate: expiresAt.toISOString(),
      progress,
    };
  }

  private ensureEnrollmentPageInRange(): void {
    this.enrollmentPage.set(Math.min(this.enrollmentPage(), this.enrollmentPageCount()));
  }

  private ensureCoursePageInRange(): void {
    this.coursePage.set(Math.min(this.coursePage(), this.coursePageCount()));
  }

  private resetCourseListPaging(): void {
    this.coursePage.set(1);
    this.expandedCourseCardId.set(null);
  }

  private resetHomepageCourseCardPaging(): void {
    this.homepageCourseCardPage.set(1);
    this.expandedHomepageCourseCardIndex.set(null);
  }

  private ensureContentUserPageInRange(): void {
    this.contentUserPage.set(Math.min(this.contentUserPage(), this.contentUserPageCount()));
  }

  private toValidPageSize(value: string): number {
    const pageSize = Number(value);
    return [5, 10, 20].includes(pageSize) ? pageSize : 10;
  }

  coursePublicUrl(course: TenantLmsCourse): string {
    const baseUrl = this.previewUrl();
    if (baseUrl === "#") {
      return "#";
    }
    try {
      const url = new URL(baseUrl);
      url.pathname = `/courses/${course.slug}`;
      return url.toString();
    } catch {
      return `${baseUrl.replace(/\/$/, "")}/courses/${course.slug}`;
    }
  }

  editManagedCourse(course: TenantLmsCourse): void {
    this.editingCourseId.set(course.id); this.courseError.set(null); this.courseMessage.set(null);
    this.courseForm.patchValue({ gradeId: course.gradeId, slug: course.slug, title: course.title, subtitle: course.subtitle ?? "", description: course.description ?? "", thumbnailUrl: course.thumbnailUrl ?? "", previewMediaUrl: course.previewMediaUrl ?? "", previewMediaType: course.previewMediaType ?? "NONE", price: course.price, oldPrice: course.oldPrice, currency: course.currency, durationLabel: course.durationLabel ?? "", studentsLabel: course.studentsLabel ?? "", ratingLabel: course.ratingLabel ?? "", published: course.published });
    this.learningOutcomeControls().clear(); course.learningOutcomes.forEach((item) => this.learningOutcomeControls().push(this.fb.nonNullable.control(item)));
    this.featureControls().clear(); course.features.forEach((item) => this.featureControls().push(this.fb.nonNullable.control(item)));
    this.curriculumControls().clear(); course.curriculum.forEach((node) => this.curriculumControls().push(this.createCurriculumGroup(node)));
    this.selectedCourseContentId.set("content-root");
    this.courseForm.markAsPristine();
  }

  learningOutcomeControls(): FormArray<FormControl<string>> { return this.courseForm.controls.learningOutcomes; }
  featureControls(): FormArray<FormControl<string>> { return this.courseForm.controls.features; }
  curriculumControls(): FormArray<FormGroup<any>> { return this.courseForm.controls.curriculum; }
  childControls(sectionIndex: number): FormArray<FormGroup<any>> { return this.curriculumControls().at(sectionIndex).controls['children'] as FormArray<FormGroup<any>>; }
  grandChildControls(sectionIndex: number, lessonIndex: number): FormArray<FormGroup<any>> { return this.childControls(sectionIndex).at(lessonIndex).controls['children'] as FormArray<FormGroup<any>>; }
  mediaControls(sectionIndex: number, lessonIndex: number): FormArray<FormGroup<any>> { return this.childControls(sectionIndex).at(lessonIndex).controls['media'] as FormArray<FormGroup<any>>; }
  courseNodeTitle(node: FormGroup<any>): string {
    return String(node.controls['title']?.value || "").trim() || "Untitled content";
  }
  courseNodeDescription(node: FormGroup<any>): string {
    return String(node.controls['description']?.value || "").trim() || "No description";
  }
  courseNodeChildren(node: FormGroup<any>): FormArray<FormGroup<any>> {
    return node.controls['children'] as FormArray<FormGroup<any>>;
  }
  courseNodeHasChildren(node: FormGroup<any>): boolean {
    return this.courseNodeChildren(node).length > 0;
  }
  courseNodeIsFolder(node: FormGroup<any>): boolean {
    return node.controls['unitType']?.value === "SECTION" || this.courseNodeHasChildren(node);
  }
  courseNodeFreePreview(node: FormGroup<any>): boolean {
    return Boolean(node.controls['freePreview']?.value);
  }
  courseContentNodeMeta(node: FormGroup<any>): string {
    if (this.courseNodeIsFolder(node)) {
      const childCount = this.courseNodeChildren(node).length;
      return `${childCount} ${childCount === 1 ? "unit" : "units"}`;
    }
    const description = String(node.controls['description']?.value || "").trim();
    return description || this.courseContentNodeUnitTypeLabel(node);
  }
  courseNodeIcon(node: FormGroup<any>): string {
    if (node.controls['unitType']?.value === "SECTION") return "folder";
    if (node.controls['unitType']?.value === "WEB_CONTENT") return "cloud";
    if (node.controls['unitType']?.value === "IFRAME") return "code";
    if (node.controls['unitType']?.value === "VIDEO") return "play_arrow";
    if (node.controls['unitType']?.value === "AUDIO") return "volume_up";
    if (node.controls['unitType']?.value === "DOCUMENT") return "present_to_all";
    if (node.controls['unitType']?.value === "QUIZ") return "quiz";
    if (node.controls['unitType']?.value === "LIVE_SESSION") return "groups";
    if (node.controls['unitType']?.value === "RESOURCE" && this.courseNodeTitle(node).toLocaleLowerCase().includes("scorm")) return "inventory_2";
    return this.courseNodeHasChildren(node) ? "folder" : "description";
  }
  private courseContentNodeUnitTypeLabel(node: FormGroup<any>): string {
    const unitType = node.controls['unitType']?.value as CourseContentUnitType | undefined;
    switch (unitType) {
      case "WEB_CONTENT": return "Webpage";
      case "IFRAME": return "iFrame";
      case "VIDEO": return "Video";
      case "AUDIO": return "Audio";
      case "DOCUMENT": return "Document";
      case "QUIZ": return "Test";
      case "ASSIGNMENT": return "Assignment";
      case "RESOURCE": return "Resource";
      case "LIVE_SESSION": return "Instructor-led training";
      case "CONTENT": return "Content";
      case "SECTION": return "Section";
      default: return "Draft course unit";
    }
  }
  isCourseEditorCardExpanded(cardId: string): boolean {
    return this.expandedCourseEditorCards().has(cardId);
  }
  toggleCourseEditorCard(cardId: string): void {
    const expanded = new Set(this.expandedCourseEditorCards());
    if (expanded.has(cardId)) {
      expanded.delete(cardId);
    } else {
      expanded.add(cardId);
    }
    this.expandedCourseEditorCards.set(expanded);
  }
  isCourseNodeExpanded(nodeId: string): boolean {
    return this.expandedCourseContentIds().has(nodeId);
  }
  toggleCourseContentNode(nodeId: string): void {
    const expanded = new Set(this.expandedCourseContentIds());
    if (expanded.has(nodeId)) {
      expanded.delete(nodeId);
    } else {
      expanded.add(nodeId);
    }
    this.expandedCourseContentIds.set(expanded);
  }

  selectCourseContentRoot(): void {
    this.selectedCourseContentId.set("content-root");
  }

  selectCourseContentNode(nodeId: string): void {
    if (nodeId === "content-root") {
      this.selectCourseContentRoot();
      return;
    }
    if (!this.findCourseContentNode(nodeId)) return;
    this.selectedCourseContentId.set(nodeId);
  }

  selectCourseSection(sectionIndex: number): void {
    const section = this.curriculumControls().at(sectionIndex);
    if (!section) return;
    this.selectedCourseContentId.set(section.controls['id'].value);
  }

  selectCourseLesson(sectionIndex: number, lessonIndex: number): void {
    const lesson = this.childControls(sectionIndex).at(lessonIndex);
    if (!lesson) return;
    this.selectedCourseContentId.set(lesson.controls['id'].value);
  }

  selectCourseSubItem(sectionIndex: number, lessonIndex: number, subItemIndex: number): void {
    const subItem = this.grandChildControls(sectionIndex, lessonIndex).at(subItemIndex);
    if (!subItem) return;
    this.selectedCourseContentId.set(subItem.controls['id'].value);
  }

  selectedCourseSectionIndex(): number | null {
    const selectedId = this.selectedCourseContentId();
    const sections = this.curriculumControls();
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
      const section = sections.at(sectionIndex);
      if (section.controls['id'].value === selectedId) {
        return sectionIndex;
      }
      const children = section.controls['children'] as FormArray<FormGroup<any>>;
      for (let lessonIndex = 0; lessonIndex < children.length; lessonIndex += 1) {
        const lesson = children.at(lessonIndex);
        if (lesson.controls['id'].value === selectedId) {
          return sectionIndex;
        }
        const subItems = lesson.controls['children'] as FormArray<FormGroup<any>>;
        for (let subItemIndex = 0; subItemIndex < subItems.length; subItemIndex += 1) {
          if (subItems.at(subItemIndex).controls['id'].value === selectedId) {
            return sectionIndex;
          }
        }
      }
    }
    return null;
  }

  selectedCourseLessonIndex(): number | null {
    const selectedId = this.selectedCourseContentId();
    const sectionIndex = this.selectedCourseSectionIndex();
    if (sectionIndex === null) return null;
    const children = this.childControls(sectionIndex);
    for (let lessonIndex = 0; lessonIndex < children.length; lessonIndex += 1) {
      const lesson = children.at(lessonIndex);
      if (lesson.controls['id'].value === selectedId) {
        return lessonIndex;
      }
      const subItems = lesson.controls['children'] as FormArray<FormGroup<any>>;
      for (let subItemIndex = 0; subItemIndex < subItems.length; subItemIndex += 1) {
        if (subItems.at(subItemIndex).controls['id'].value === selectedId) {
          return lessonIndex;
        }
      }
    }
    return null;
  }

  selectedCourseLessonControls(): FormGroup<any>[] {
    const sectionIndex = this.selectedCourseSectionIndex();
    return sectionIndex === null ? [] : this.childControls(sectionIndex).controls;
  }

  selectedCourseSubItemControls(): FormGroup<any>[] {
    const sectionIndex = this.selectedCourseSectionIndex();
    const lessonIndex = this.selectedCourseLessonIndex();
    return sectionIndex === null || lessonIndex === null ? [] : this.grandChildControls(sectionIndex, lessonIndex).controls;
  }

  selectedCourseContentTitle(): string {
    const selectedNode = this.findSelectedCourseContentNode();
    if (selectedNode) {
      return this.courseNodeTitle(selectedNode);
    }
    const sectionIndex = this.selectedCourseSectionIndex();
    if (sectionIndex === null) {
      return "Course";
    }
    return this.courseNodeTitle(this.curriculumControls().at(sectionIndex));
  }

  selectedCourseChildNodes(): FormGroup<any>[] {
    if (this.selectedCourseContentId() === "content-root") {
      return this.curriculumControls().controls;
    }
    const selectedNode = this.findSelectedCourseContentNode();
    return selectedNode ? this.courseNodeChildren(selectedNode).controls : [];
  }

  openCourseContentPreview(nodeId: string): void {
    const node = this.findCourseContentNode(nodeId);
    if (!node) return;
    this.persistVisibleBuilderMediaState();
    this.selectedCourseContentId.set(nodeId);
    this.currentBuilderNodeId.set(nodeId);
    if (this.courseNodeIsFolder(node)) {
      this.builderCourseEditorTab.set("content");
      this.builderInspectorOpen.set(false);
    }
    this.syncBuilderStateFromNode(node);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { contentPreview: nodeId },
      queryParamsHandling: "merge",
    });
  }

  closeCourseContentPreview(): void {
    this.selectedCourseContentId.set("content-root");
    this.currentBuilderNodeId.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { contentPreview: null },
      queryParamsHandling: "merge",
    });
  }

  courseContentPreviewTitle(): string {
    const node = this.courseContentPreviewNode();
    return node ? this.courseNodeTitle(node) : (this.courseForm.controls.title.value || "New course");
  }

  courseContentAuthoringRootNode(): FormGroup<any> | null {
    const nodeId = this.activeCourseContentPreviewId();
    if (!nodeId) return null;
    const activeNode = this.findCourseContentNode(nodeId);
    if (activeNode && this.courseNodeIsFolder(activeNode)) return activeNode;
    for (const node of this.curriculumControls().controls) {
      if (
        node.controls['id'].value === nodeId ||
        this.findCourseContentNodeInArray(this.courseNodeChildren(node), nodeId)
      ) {
        return node;
      }
    }
    return this.courseContentPreviewNode();
  }

  courseContentAuthoringRootId(): string {
    return String(this.courseContentAuthoringRootNode()?.controls['id'].value || "content-root");
  }

  courseContentAuthoringTitle(): string {
    const node = this.courseContentAuthoringRootNode();
    return node ? this.courseNodeTitle(node) : (this.courseForm.controls.title.value || "New course");
  }

  courseContentAuthoringChildren(): FormGroup<any>[] {
    const node = this.courseContentAuthoringRootNode();
    return node ? this.courseNodeChildren(node).controls : [];
  }

  isCourseAuthoringRootSelected(): boolean {
    return this.activeCourseContentPreviewId() === this.courseContentAuthoringRootId();
  }

  isBuilderFolderSelected(): boolean {
    const node = this.courseContentPreviewNode();
    return node ? this.courseNodeIsFolder(node) : false;
  }

  hasVisibleAuthoringCurriculumItems(): boolean {
    return this.filteredBuilderNodes(this.courseContentAuthoringChildren()).length > 0;
  }

  toggleBuilderAddMenu(): void {
    const nextOpen = !this.builderAddMenuOpen();
    this.builderAddMenuOpen.set(nextOpen);
    this.builderAddMenuCategory.set(null);
  }

  selectBuilderAddMenuCategory(category: CourseBuilderAddMenuCategory | null): void {
    this.builderAddMenuCategory.set(category);
  }

  builderAddMenuCategoryLabel(): string {
    switch (this.builderAddMenuCategory()) {
      case "standard":
        return "Standard Content";
      case "activities":
        return "Learning Activities";
      case "more":
        return "More";
      default:
        return "Add content";
    }
  }

  addCourseContentFromMenu(unitType: CourseContentUnitType): void {
    const parentId = this.courseContentAuthoringRootId();
    this.closeBuilderAddMenu();
    this.openAddCourseContentNode(parentId, unitType);
  }

  addContentUnitFromMenu(): void {
    const parentId = this.courseContentAuthoringRootId();
    if (parentId !== "content-root" && !this.findCourseContentNode(parentId)) return;

    this.closeBuilderAddMenu();
    const textBlock = this.createBuilderBlock("text");
    const group = this.createCurriculumGroup({
      id: createCourseContentId(),
      title: "Content unit",
      description: "",
      freePreview: false,
      media: [],
      children: [],
    } as TenantLmsCourseCurriculumNode);
    group.controls['unitType'].setValue("CONTENT");
    group.controls['blocks'].setValue([textBlock]);

    if (parentId === "content-root") {
      this.curriculumControls().push(group);
    } else {
      this.courseNodeChildren(this.findCourseContentNode(parentId)!).push(group);
    }

    const expanded = new Set(this.expandedCourseContentIds());
    expanded.add(parentId);
    this.expandedCourseContentIds.set(expanded);
    this.builderInspectorOpen.set(false);
    this.openCourseContentPreview(String(group.controls['id'].value));
    this.builderSelectedBlockId.set(textBlock.id);
    this.markBuilderDirty();
  }

  addWebContentUnitFromMenu(): void {
    const parentId = this.courseContentAuthoringRootId();
    if (parentId !== "content-root" && !this.findCourseContentNode(parentId)) return;

    this.closeBuilderAddMenu();
    const group = this.createCurriculumGroup({
      id: createCourseContentId(),
      title: "Webpage unit",
      description: "",
      freePreview: false,
      media: [],
      children: [],
    } as TenantLmsCourseCurriculumNode);
    group.controls['unitType'].setValue("WEB_CONTENT");
    group.controls['settings'].setValue({
      ...group.controls['settings'].value,
      webpageUrl: "",
    });

    if (parentId === "content-root") {
      this.curriculumControls().push(group);
    } else {
      this.courseNodeChildren(this.findCourseContentNode(parentId)!).push(group);
    }

    const expanded = new Set(this.expandedCourseContentIds());
    expanded.add(parentId);
    this.expandedCourseContentIds.set(expanded);
    this.builderInspectorOpen.set(false);
    this.openCourseContentPreview(String(group.controls['id'].value));
    this.markBuilderDirty();
  }

  addIframeUnitFromMenu(): void {
    const parentId = this.courseContentAuthoringRootId();
    if (parentId !== "content-root" && !this.findCourseContentNode(parentId)) return;

    this.closeBuilderAddMenu();
    const group = this.createCurriculumGroup({
      id: createCourseContentId(),
      title: "Iframe unit",
      description: "",
      freePreview: false,
      media: [],
      children: [],
    } as TenantLmsCourseCurriculumNode);
    group.controls['unitType'].setValue("IFRAME");
    group.controls['settings'].setValue({
      ...group.controls['settings'].value,
      iframeUrl: "",
    });

    if (parentId === "content-root") {
      this.curriculumControls().push(group);
    } else {
      this.courseNodeChildren(this.findCourseContentNode(parentId)!).push(group);
    }

    const expanded = new Set(this.expandedCourseContentIds());
    expanded.add(parentId);
    this.expandedCourseContentIds.set(expanded);
    this.builderInspectorOpen.set(false);
    this.openCourseContentPreview(String(group.controls['id'].value));
    this.markBuilderDirty();
  }

  addVideoUnitFromMenu(): void {
    const parentId = this.courseContentAuthoringRootId();
    if (parentId !== "content-root" && !this.findCourseContentNode(parentId)) return;

    this.closeBuilderAddMenu();
    const group = this.createCurriculumGroup({
      id: createCourseContentId(),
      title: "Video unit",
      description: "",
      freePreview: false,
      media: [],
      children: [],
    } as TenantLmsCourseCurriculumNode);
    group.controls['unitType'].setValue("VIDEO");

    if (parentId === "content-root") {
      this.curriculumControls().push(group);
    } else {
      this.courseNodeChildren(this.findCourseContentNode(parentId)!).push(group);
    }

    const expanded = new Set(this.expandedCourseContentIds());
    expanded.add(parentId);
    this.expandedCourseContentIds.set(expanded);
    this.builderInspectorOpen.set(false);
    this.openCourseContentPreview(String(group.controls['id'].value));
    this.markBuilderDirty();
  }

  addAudioUnitFromMenu(): void {
    const parentId = this.courseContentAuthoringRootId();
    if (parentId !== "content-root" && !this.findCourseContentNode(parentId)) return;

    this.closeBuilderAddMenu();
    const group = this.createCurriculumGroup({
      id: createCourseContentId(),
      title: "Audio unit",
      description: "",
      freePreview: false,
      media: [],
      children: [],
    } as TenantLmsCourseCurriculumNode);
    group.controls['unitType'].setValue("AUDIO");

    if (parentId === "content-root") {
      this.curriculumControls().push(group);
    } else {
      this.courseNodeChildren(this.findCourseContentNode(parentId)!).push(group);
    }

    const expanded = new Set(this.expandedCourseContentIds());
    expanded.add(parentId);
    this.expandedCourseContentIds.set(expanded);
    this.builderInspectorOpen.set(false);
    this.builderAudioSource.set("none");
    this.openCourseContentPreview(String(group.controls['id'].value));
    this.markBuilderDirty();
  }

  addDocumentUnitFromMenu(): void {
    const parentId = this.courseContentAuthoringRootId();
    if (parentId !== "content-root" && !this.findCourseContentNode(parentId)) return;

    this.closeBuilderAddMenu();
    const group = this.createCurriculumGroup({
      id: createCourseContentId(),
      title: "Document unit",
      description: "",
      freePreview: false,
      media: [],
      children: [],
    } as TenantLmsCourseCurriculumNode);
    group.controls['unitType'].setValue("DOCUMENT");

    if (parentId === "content-root") {
      this.curriculumControls().push(group);
    } else {
      this.courseNodeChildren(this.findCourseContentNode(parentId)!).push(group);
    }

    const expanded = new Set(this.expandedCourseContentIds());
    expanded.add(parentId);
    this.expandedCourseContentIds.set(expanded);
    this.builderInspectorOpen.set(false);
    this.builderDocumentSource.set("none");
    this.builderDocumentUrl.set("");
    this.builderDocumentUrlError.set(null);
    this.openCourseContentPreview(String(group.controls['id'].value));
    this.markBuilderDirty();
  }

  addTestUnitFromMenu(): void {
    this.addAssessmentUnitFromMenu("Test unit", "QUIZ");
  }

  addSurveyUnitFromMenu(): void {
    this.addAssessmentUnitFromMenu("Survey unit", "QUIZ");
  }

  addLiveSessionUnitFromMenu(): void {
    const parentId = this.courseContentAuthoringRootId();
    if (parentId !== "content-root" && !this.findCourseContentNode(parentId)) return;

    this.closeBuilderAddMenu();
    const group = this.createCurriculumGroup({
      id: createCourseContentId(),
      title: "ILT unit",
      description: "",
      freePreview: false,
      media: [],
      children: [],
    } as TenantLmsCourseCurriculumNode);
    group.controls['unitType'].setValue("LIVE_SESSION");
    group.controls['blocks'].setValue([]);

    if (parentId === "content-root") {
      this.curriculumControls().push(group);
    } else {
      this.courseNodeChildren(this.findCourseContentNode(parentId)!).push(group);
    }

    const expanded = new Set(this.expandedCourseContentIds());
    expanded.add(parentId);
    this.expandedCourseContentIds.set(expanded);
    this.builderInspectorOpen.set(false);
    this.openCourseContentPreview(String(group.controls['id'].value));
    this.markBuilderDirty();
  }

  addScormUnitFromMenu(): void {
    const parentId = this.courseContentAuthoringRootId();
    if (parentId !== "content-root" && !this.findCourseContentNode(parentId)) return;

    this.closeBuilderAddMenu();
    const group = this.createCurriculumGroup({
      id: createCourseContentId(),
      title: "Scorm unit",
      description: "",
      freePreview: false,
      media: [],
      children: [],
    } as TenantLmsCourseCurriculumNode);
    group.controls['unitType'].setValue("RESOURCE");
    group.controls['blocks'].setValue([]);
    group.controls['settings'].setValue({
      ...group.controls['settings'].value,
      resourceKind: "SCORM",
    });

    if (parentId === "content-root") {
      this.curriculumControls().push(group);
    } else {
      this.courseNodeChildren(this.findCourseContentNode(parentId)!).push(group);
    }

    const expanded = new Set(this.expandedCourseContentIds());
    expanded.add(parentId);
    this.expandedCourseContentIds.set(expanded);
    this.builderInspectorOpen.set(false);
    this.openCourseContentPreview(String(group.controls['id'].value));
    this.markBuilderDirty();
  }

  private addAssessmentUnitFromMenu(title: string, unitType: CourseContentUnitType): void {
    const parentId = this.courseContentAuthoringRootId();
    if (parentId !== "content-root" && !this.findCourseContentNode(parentId)) return;

    this.closeBuilderAddMenu();
    const group = this.createCurriculumGroup({
      id: createCourseContentId(),
      title,
      description: "",
      freePreview: false,
      media: [],
      children: [],
    } as TenantLmsCourseCurriculumNode);
    group.controls['unitType'].setValue(unitType);
    group.controls['blocks'].setValue([]);

    if (parentId === "content-root") {
      this.curriculumControls().push(group);
    } else {
      this.courseNodeChildren(this.findCourseContentNode(parentId)!).push(group);
    }

    const expanded = new Set(this.expandedCourseContentIds());
    expanded.add(parentId);
    this.expandedCourseContentIds.set(expanded);
    this.builderInspectorOpen.set(false);
    this.openCourseContentPreview(String(group.controls['id'].value));
    this.markBuilderDirty();
  }

  addCourseCloneFromMenu(): void {
    this.addCourseContentFromMenu("CONTENT");
  }

  addLinkedCourseFromMenu(): void {
    this.addCourseContentFromMenu("RESOURCE");
  }

  courseContentPreviewDescription(): string {
    const node = this.courseContentPreviewNode();
    return node ? this.courseNodeDescription(node) : "Add a section to begin organizing this course.";
  }

  courseContentPreviewDescriptionValue(): string {
    const node = this.courseContentPreviewNode();
    return node ? String(node.controls['description']?.value || "") : "";
  }

  courseContentPreviewIcon(): string {
    const node = this.courseContentPreviewNode();
    return node ? this.courseNodeIcon(node) : "folder";
  }

  courseContentPreviewTypeLabel(): string {
    const node = this.courseContentPreviewNode();
    if (!node) return "Course";
    if (node.controls['unitType']?.value === "WEB_CONTENT") return "Webpage";
    if (node.controls['unitType']?.value === "IFRAME") return "iFrame";
    if (node.controls['unitType']?.value === "VIDEO") return "Video";
    if (node.controls['unitType']?.value === "AUDIO") return "Audio";
    if (node.controls['unitType']?.value === "DOCUMENT") return "Document";
    if (node.controls['unitType']?.value === "QUIZ") return this.isSurveyUnitEditor() ? "Survey" : "Test";
    if (node.controls['unitType']?.value === "LIVE_SESSION") return "Instructor-led training";
    if (node.controls['unitType']?.value === "RESOURCE" && this.isScormUnitEditor()) return "SCORM | xAPI | cmi5";
    if (node.controls['unitType']?.value === "CONTENT" && !this.courseNodeHasChildren(node)) return "Content";
    return this.courseNodeHasChildren(node) ? "Folder" : "File";
  }

  isContentUnitEditor(): boolean {
    if (this.isCourseAuthoringRootSelected()) return false;
    return this.courseContentPreviewNode()?.controls['unitType']?.value === "CONTENT";
  }

  isWebContentUnitEditor(): boolean {
    if (this.isCourseAuthoringRootSelected()) return false;
    return this.courseContentPreviewNode()?.controls['unitType']?.value === "WEB_CONTENT";
  }

  isIframeUnitEditor(): boolean {
    if (this.isCourseAuthoringRootSelected()) return false;
    return this.courseContentPreviewNode()?.controls['unitType']?.value === "IFRAME";
  }

  isVideoUnitEditor(): boolean {
    if (this.isCourseAuthoringRootSelected()) return false;
    return this.courseContentPreviewNode()?.controls['unitType']?.value === "VIDEO";
  }

  isAudioUnitEditor(): boolean {
    if (this.isCourseAuthoringRootSelected()) return false;
    return this.courseContentPreviewNode()?.controls['unitType']?.value === "AUDIO";
  }

  isDocumentUnitEditor(): boolean {
    if (this.isCourseAuthoringRootSelected()) return false;
    return this.courseContentPreviewNode()?.controls['unitType']?.value === "DOCUMENT";
  }

  isTestUnitEditor(): boolean {
    if (this.isCourseAuthoringRootSelected()) return false;
    return this.courseContentPreviewNode()?.controls['unitType']?.value === "QUIZ";
  }

  isLiveSessionUnitEditor(): boolean {
    if (this.isCourseAuthoringRootSelected()) return false;
    return this.courseContentPreviewNode()?.controls['unitType']?.value === "LIVE_SESSION";
  }

  isScormUnitEditor(): boolean {
    if (this.isCourseAuthoringRootSelected()) return false;
    const node = this.courseContentPreviewNode();
    if (!node || node.controls['unitType']?.value !== "RESOURCE") return false;
    const settings = node.controls['settings']?.value as Record<string, unknown> | undefined;
    return settings?.["resourceKind"] === "SCORM" || this.courseNodeTitle(node).toLocaleLowerCase().includes("scorm");
  }

  isSurveyUnitEditor(): boolean {
    if (!this.isTestUnitEditor()) return false;
    return this.courseContentPreviewTitle().toLocaleLowerCase().includes("survey");
  }

  activeQuestionOptions(): CourseBuilderQuestionOption[] {
    return this.isSurveyUnitEditor() ? this.surveyQuestionOptions : this.testQuestionOptions;
  }

  private questionOptionForType(type: CourseBuilderQuestionType): CourseBuilderQuestionOption {
    return [...this.testQuestionOptions, ...this.surveyQuestionOptions].find((item) => item.type === type) ?? this.testQuestionOptions[0];
  }

  contentUnitHtml(): string {
    const block = this.builderBlocks().find((item) => item.type === "text");
    return block ? this.blockPayloadString(block, "html") : "";
  }

  updateContentUnitHtml(value: string | null): void {
    const html = value ?? "";
    const textBlock = this.builderBlocks().find((item) => item.type === "text");
    if (textBlock) {
      this.updateBuilderBlockPayload(textBlock.id, "html", html);
      return;
    }

    const block = this.createBuilderBlock("text");
    block.payload["html"] = html;
    this.builderBlocks.update((blocks) => [block, ...blocks]);
    this.builderSelectedBlockId.set(block.id);
    this.persistBuilderBlocksToSelectedNode();
    this.markBuilderDirty();
  }

  setBuilderWebContentUrl(value: string): void {
    this.builderWebContentUrl.set(value);
    this.builderWebContentError.set(null);
    this.builderWebContentPreviewActive.set(false);
    this.updateBuilderSetting("webpageUrl", value);
  }

  saveBuilderWebContentUrl(): void {
    const normalizedUrl = this.normalizedWebContentUrl(this.builderWebContentUrl());
    if (!normalizedUrl) {
      this.builderWebContentError.set("Enter a valid HTTP or HTTPS webpage address.");
      this.builderWebContentPreviewActive.set(false);
      return;
    }

    this.builderWebContentUrl.set(normalizedUrl);
    this.builderWebContentError.set(null);
    this.builderWebContentPreviewActive.set(true);
    this.updateBuilderSetting("webpageUrl", normalizedUrl);
  }

  setBuilderIframeUrl(value: string): void {
    this.builderIframeUrl.set(value);
    this.builderIframeError.set(null);
    this.builderIframePreviewActive.set(false);
    this.updateBuilderSetting("iframeUrl", value);
  }

  saveBuilderIframeUrl(): void {
    const normalizedUrl = this.normalizedWebContentUrl(this.builderIframeUrl());
    if (!normalizedUrl) {
      this.builderIframeError.set("Enter a valid HTTP or HTTPS webpage address.");
      this.builderIframePreviewActive.set(false);
      return;
    }

    this.builderIframeUrl.set(normalizedUrl);
    this.builderIframeError.set(null);
    this.builderIframePreviewActive.set(true);
    this.updateBuilderSetting("iframeUrl", normalizedUrl);
  }

  private normalizedWebContentUrl(value: string): string | null {
    const candidate = value.trim();
    if (!candidate) return null;
    try {
      const url = new URL(candidate);
      return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
    } catch {
      return null;
    }
  }

  courseContentPreviewChildren(): FormGroup<any>[] {
    const node = this.courseContentPreviewNode();
    return node ? this.courseNodeChildren(node).controls : [];
  }

  updateCourseContentPreviewTitle(value: string): void {
    const node = this.courseContentPreviewNode();
    if (!node) return;
    node.controls['title'].setValue(value);
    this.markBuilderDirty();
  }

  updateCourseContentPreviewDescription(value: string): void {
    const node = this.courseContentPreviewNode();
    if (!node) return;
    node.controls['description'].setValue(value);
    this.markBuilderDirty();
  }

  toggleBuilderInspector(): void {
    this.builderInspectorOpen.update((open) => !open);
  }

  openBuilderInspector(): void {
    this.builderInspectorOpen.set(true);
  }

  builderAutosaveIcon(): string {
    switch (this.builderAutosaveState()) {
      case "saving": return "sync";
      case "failed": return "error_outline";
      case "dirty": return "edit";
      default: return "check_circle";
    }
  }

  builderAutosaveLabel(): string {
    switch (this.builderAutosaveState()) {
      case "saving": return this.editingCourseId() ? "Saving to backend..." : "Saving draft...";
      case "failed": return this.builderSaveError() || "Couldn’t save, retry";
      case "dirty": return "Unsaved changes";
      default: return this.builderLastSavedAt() ? `Saved ${this.builderLastSavedAt()}` : "All changes saved";
    }
  }

  selectBuilderVideoSource(source: CourseBuilderVideoSource): void {
    this.builderVideoSource.set(source);
    this.builderExternalVideoError.set(null);
    if (source === "camera" || source === "screen") {
      this.builderMediaDialog.set(source);
    }
  }

  setBuilderExternalVideoUrl(value: string): void {
    this.builderExternalVideoUrl.set(value);
    const trimmed = value.trim();
    if (!trimmed) {
      this.builderExternalVideoError.set(null);
      this.builderExternalVideoDraft.set(null);
      return;
    }
    const config = this.parseSupportedVideoUrl(trimmed);
    if (!config) {
      this.builderExternalVideoError.set("Use a valid YouTube or Vimeo URL.");
    } else {
      this.builderExternalVideoError.set(null);
      this.builderExternalVideoDraft.set(config);
    }
  }

  saveBuilderExternalVideo(): void {
    const config = this.builderExternalVideoDraft();
    const node = this.activeBuilderCourseContentNode();
    if (!config || !node || this.builderExternalVideoError()) return;
    node.controls['externalVideo'].setValue(config);
    node.controls['unitType'].setValue("VIDEO");
    this.builderVideoSource.set("url");
    this.markBuilderDirty();
  }

  removeBuilderExternalVideo(): void {
    const node = this.activeBuilderCourseContentNode();
    if (!node) return;
    node.controls['externalVideo'].setValue(null);
    this.builderExternalVideoDraft.set(null);
    this.builderExternalVideoUrl.set("");
    this.builderExternalVideoError.set(null);
    this.markBuilderDirty();
  }

  async handleBuilderVideoUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      await this.applyBuilderVideoFile(file);
    } finally {
      input.value = "";
    }
  }

  async handleBuilderVideoDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) await this.applyBuilderVideoFile(file);
  }

  async handleBuilderAudioUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      await this.applyBuilderAudioFile(file);
    } finally {
      input.value = "";
    }
  }

  async handleBuilderAudioDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) await this.applyBuilderAudioFile(file);
  }

  private async applyBuilderAudioFile(file: File): Promise<void> {
    const maxBytes = 1024 * 1024 * 1024;
    if (!file.type.startsWith("audio/")) {
      this.builderUploadError.set("Unsupported audio format. Choose an audio file.");
      this.builderUploadProgress.set(0);
      return;
    }
    if (file.size > maxBytes) {
      this.builderUploadError.set("The audio file is too large. Maximum size is 1 GB.");
      this.builderUploadProgress.set(0);
      return;
    }

    this.revokeBuilderUploadPreviewUrl();
    const previewUrl = URL.createObjectURL(file);
    this.builderAudioSource.set("upload");
    this.builderUploadFileName.set(file.name);
    this.builderUploadPreviewUrl.set(previewUrl);
    this.builderUploadError.set(null);
    this.writeSelectedNodeValue("unitType", "AUDIO");
    await this.persistBuilderUploadedMedia(file, previewUrl, "AUDIO");
  }

  async startBuilderAudioRecording(): Promise<void> {
    if (this.builderRecordingActive()) return;
    this.builderAudioSource.set("record");
    await this.startBuilderRecording();
  }

  selectBuilderDocumentSource(source: CourseBuilderDocumentSource, clearSavedUrl = false): void {
    this.builderDocumentSource.set(source);
    this.builderDocumentUrlError.set(null);
    if (clearSavedUrl) {
      this.builderDocumentUrl.set("");
      this.writeSelectedNodeSetting("slideShareUrl", "");
      const nodeId = this.activeBuilderCourseContentNode()?.controls['id']?.value;
      if (nodeId) this.builderDocumentUrlByNodeId.delete(nodeId);
      this.markBuilderDirty();
    }
  }

  setBuilderDocumentUrl(value: string): void {
    this.builderDocumentUrl.set(value);
    this.builderDocumentUrlError.set(null);
  }

  saveBuilderSlideShareUrl(): void {
    const value = this.builderDocumentUrl().trim();
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      this.builderDocumentUrlError.set("Enter a valid presentation URL.");
      return;
    }
    if (!["http:", "https:"].includes(parsed.protocol) || !this.toPresentationEmbedUrl(parsed.toString())) {
      this.builderDocumentUrlError.set("Use a public Google Slides or SlideShare presentation URL.");
      return;
    }

    const node = this.activeBuilderCourseContentNode();
    if (!node) return;
    const settings = node.controls['settings']?.value as Record<string, unknown> | undefined;
    const slideShareUrl = parsed.toString();
    node.controls['settings'].setValue({ ...settings, slideShareUrl });
    node.controls['unitType'].setValue("DOCUMENT");
    this.builderDocumentUrlByNodeId.set(String(node.controls['id'].value), slideShareUrl);
    this.builderDocumentUrl.set(slideShareUrl);
    this.builderDocumentUrlError.set(null);
    this.builderDocumentSource.set("slideshare");
    this.markBuilderDirty();
  }

  async handleBuilderDocumentUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      await this.applyBuilderDocumentFile(file);
    } finally {
      input.value = "";
    }
  }

  async handleBuilderDocumentDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) await this.applyBuilderDocumentFile(file);
  }

  handleBuilderScormUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.applyBuilderScormFile(file);
    input.value = "";
  }

  handleBuilderScormDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.applyBuilderScormFile(file);
  }

  private applyBuilderScormFile(file: File): void {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const acceptedExtensions = new Set(["zip", "xapi", "cmi5"]);
    const maxBytes = 1024 * 1024 * 1024;
    if (!acceptedExtensions.has(extension)) {
      this.builderUploadError.set("Unsupported package format. Choose a SCORM, xAPI, or cmi5 package.");
      this.builderUploadProgress.set(0);
      return;
    }
    if (file.size > maxBytes) {
      this.builderUploadError.set("The package is too large. Maximum size is 1 GB.");
      this.builderUploadProgress.set(0);
      return;
    }

    this.revokeBuilderUploadPreviewUrl();
    this.builderUploadFileName.set(file.name);
    this.builderUploadPreviewUrl.set(null);
    this.builderUploadError.set(null);
    this.builderUploadMediaStatus.set("READY");
    this.builderUploadProgress.set(100);
    this.builderUploadStatus.set(`${this.formatFileSize(file.size)} · local package ready. Backend upload endpoint required.`);
    this.writeSelectedNodeValue("upload", {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      status: "READY",
      uploaded: false,
    });
    this.writeSelectedNodeValue("unitType", "RESOURCE");
    this.writeSelectedNodeSetting("resourceKind", "SCORM");
    this.markBuilderDirty();
  }

  private async applyBuilderDocumentFile(file: File): Promise<void> {
    const acceptedExtensions = new Set(["doc", "docx", "pdf", "xls", "xlsx", "ppt", "pptx"]);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const maxBytes = 1024 * 1024 * 1024;
    if (!acceptedExtensions.has(extension)) {
      this.builderUploadError.set("Unsupported document format. Choose a DOC, PDF, XLS, or PPT file.");
      this.builderUploadProgress.set(0);
      return;
    }
    if (file.size > maxBytes) {
      this.builderUploadError.set("The document is too large. Maximum size is 1 GB.");
      this.builderUploadProgress.set(0);
      return;
    }

    this.revokeBuilderUploadPreviewUrl();
    const previewUrl = URL.createObjectURL(file);
    this.builderDocumentSource.set("upload");
    this.builderDocumentPreviewKind.set(this.documentPreviewKind(file.name));
    this.builderDocumentPreviewError.set(null);
    this.builderUploadFileName.set(file.name);
    this.builderUploadPreviewUrl.set(previewUrl);
    this.builderUploadError.set(null);
    this.writeSelectedNodeValue("unitType", "DOCUMENT");
    void this.prepareBuilderDocumentPreview(file);
    await this.persistBuilderUploadedMedia(file, previewUrl, "DOCUMENT");
  }

  private documentPreviewKind(fileName: string): CourseBuilderDocumentPreviewKind {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return "pdf";
    if (extension === "docx") return "docx";
    if (extension === "pptx") return "pptx";
    if (extension === "xls" || extension === "xlsx") return "xlsx";
    return "unsupported";
  }

  private async prepareBuilderDocumentPreview(file: File): Promise<void> {
    const kind = this.documentPreviewKind(file.name);
    const token = ++this.builderDocumentPreviewToken;
    this.destroyBuilderDocumentPreview();
    this.builderDocumentPreviewKind.set(kind);
    this.builderDocumentPreviewError.set(null);

    if (kind === "pdf" || kind === "unsupported") {
      this.builderDocumentPreviewLoading.set(false);
      return;
    }

    this.builderDocumentPreviewLoading.set(true);
    try {
      await new Promise((resolve) => setTimeout(resolve));
      if (token !== this.builderDocumentPreviewToken) return;
      const host = this.builderDocumentPreviewHost?.nativeElement;
      if (!host) throw new Error("Document preview container is unavailable.");
      const arrayBuffer = await file.arrayBuffer();
      if (token !== this.builderDocumentPreviewToken) return;

      if (kind === "docx") {
        const module = await import("docx-preview");
        if (token !== this.builderDocumentPreviewToken) return;
        await module.renderAsync(arrayBuffer, host, host, {
          breakPages: true,
          ignoreWidth: false,
          ignoreHeight: false,
          inWrapper: true,
        });
      } else if (kind === "pptx") {
        const module = await import("pptx-preview");
        if (token !== this.builderDocumentPreviewToken) return;
        this.builderDocumentPreviewer = module.init(host, { width: 960, height: 540, mode: "list" });
        await this.builderDocumentPreviewer.preview(arrayBuffer);
      } else {
        const XLSX = await import("xlsx");
        if (token !== this.builderDocumentPreviewToken) return;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = sheetName ? workbook.Sheets[sheetName] : null;
        if (!sheet) throw new Error("The spreadsheet does not contain a visible sheet.");
        const parsed = new DOMParser().parseFromString(XLSX.utils.sheet_to_html(sheet), "text/html");
        host.replaceChildren(...Array.from(parsed.body.childNodes).map((node) => document.importNode(node, true)));
      }
    } catch (error) {
      if (token !== this.builderDocumentPreviewToken) return;
      this.builderDocumentPreviewError.set(
        error instanceof Error && error.message === "The spreadsheet does not contain a visible sheet."
          ? error.message
          : "Unable to render this document inside the editor. Try a PDF or a newer Office file.",
      );
    } finally {
      if (token === this.builderDocumentPreviewToken) this.builderDocumentPreviewLoading.set(false);
    }
  }

  private async restoreBuilderDocumentPreview(fileName: string, previewUrl: string): Promise<void> {
    const kind = this.documentPreviewKind(fileName);
    this.builderDocumentPreviewKind.set(kind);
    if (kind === "pdf" || kind === "unsupported") return;
    try {
      const blob = await fetch(previewUrl).then((response) => {
        if (!response.ok) throw new Error("Unable to load local document preview.");
        return response.blob();
      });
      await this.prepareBuilderDocumentPreview(new File([blob], fileName, { type: blob.type }));
    } catch {
      this.builderDocumentPreviewError.set("The local preview expired. Choose the document again.");
    }
  }

  private toPresentationEmbedUrl(rawUrl: string): string | null {
    const value = rawUrl.trim();
    if (!value) return null;
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return null;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) return null;

    if (parsed.hostname.toLowerCase() === "docs.google.com") {
      const match = parsed.pathname.match(/\/presentation\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/);
      return match?.[1]
        ? `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`
        : null;
    }

    return /(^|\.)slideshare\.net$/i.test(parsed.hostname) ? parsed.toString() : null;
  }

  private destroyBuilderDocumentPreview(): void {
    this.builderDocumentPreviewer?.destroy();
    this.builderDocumentPreviewer = null;
    this.builderDocumentPreviewHost?.nativeElement.replaceChildren();
  }

  private async applyBuilderVideoFile(file: File): Promise<void> {
    const maxBytes = 1024 * 1024 * 1024;
    const fileError = validateCourseBuilderVideoFile(file, maxBytes);
    if (fileError) {
      this.builderUploadError.set(fileError);
      this.builderUploadProgress.set(0);
      return;
    }
    this.revokeBuilderUploadPreviewUrl();
    const previewUrl = URL.createObjectURL(file);
    this.builderUploadFileName.set(file.name);
    this.builderUploadPreviewUrl.set(previewUrl);
    this.builderUploadError.set(null);
    this.writeSelectedNodeValue("unitType", "VIDEO");
    this.writeSelectedNodeValue("externalVideo", null);
    await this.persistBuilderUploadedMedia(file, previewUrl, "VIDEO");
  }

  private async persistBuilderUploadedMedia(file: File, previewUrl: string, unitType: CourseContentUnitType): Promise<void> {
    const node = this.activeBuilderCourseContentNode();
    if (!node) return;

    this.builderUploadMediaStatus.set("UPLOADING");
    this.builderUploadProgress.set(20);
    this.builderUploadStatus.set(`${this.formatFileSize(file.size)} · uploading...`);
    this.writeSelectedNodeValue("upload", {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      previewUrl,
      status: "UPLOADING",
      uploaded: false,
    });

    try {
      const uploaded = await this.data.uploadManagedCourseMedia(file);
      const media: TenantLmsCourseMedia = {
        id: createCourseContentId(),
        type: uploaded.mediaType,
        title: node.controls['title']?.value || file.name,
        url: uploaded.url,
        fileName: uploaded.fileName,
        contentType: uploaded.contentType,
        durationLabel: "",
      };
      const mediaControls = node.controls['media'] as FormArray<FormGroup<any>>;
      if (mediaControls.length) mediaControls.setControl(0, this.createMediaGroup(media));
      else mediaControls.push(this.createMediaGroup(media));
      this.builderUploadMediaStatus.set("READY");
      this.builderUploadProgress.set(100);
      this.builderUploadStatus.set(`${this.formatFileSize(file.size)} · uploaded`);
      this.writeSelectedNodeValue("unitType", unitType);
      this.writeSelectedNodeValue("upload", {
        fileName: uploaded.fileName,
        fileSize: file.size,
        mimeType: uploaded.contentType,
        previewUrl,
        url: uploaded.url,
        status: "READY",
        uploaded: true,
      });
      this.markBuilderDirty();
    } catch {
      this.builderUploadMediaStatus.set("FAILED");
      this.builderUploadProgress.set(0);
      this.builderUploadStatus.set("Upload failed");
      this.builderUploadError.set("The file could not be uploaded. Try again.");
      this.writeSelectedNodeValue("upload", {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        previewUrl,
        status: "FAILED",
        uploaded: false,
      });
    }
  }

  clearBuilderUpload(): void {
    this.builderDocumentPreviewToken += 1;
    this.destroyBuilderDocumentPreview();
    this.revokeBuilderUploadPreviewUrl();
    this.builderUploadFileName.set("");
    this.builderUploadProgress.set(0);
    this.builderUploadStatus.set("No file selected");
    this.builderUploadError.set(null);
    this.builderUploadMediaStatus.set("LOCAL_PREVIEW");
    this.builderDocumentPreviewKind.set(null);
    this.builderDocumentPreviewLoading.set(false);
    this.builderDocumentPreviewError.set(null);
    this.writeSelectedNodeValue("upload", null);
    this.removeSelectedPrimaryMedia();
    if (this.isAudioUnitEditor()) this.builderAudioSource.set("none");
    if (this.isDocumentUnitEditor()) this.builderDocumentSource.set("none");
    this.markBuilderDirty();
  }

  private removeSelectedPrimaryMedia(): void {
    const node = this.activeBuilderCourseContentNode();
    const mediaControls = node?.controls['media'] as FormArray<FormGroup<any>> | undefined;
    if (mediaControls?.length) mediaControls.removeAt(0);
  }

  builderRecorderSupported(): boolean {
    if (typeof navigator === "undefined" || !navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      return false;
    }
    return this.builderVideoSource() === "screen"
      ? typeof navigator.mediaDevices.getDisplayMedia === "function"
      : typeof navigator.mediaDevices.getUserMedia === "function";
  }

  async startBuilderRecording(): Promise<void> {
    if (!this.builderRecorderSupported()) return;
    try {
      this.builderRecordingError.set(null);
      const mode = this.builderMediaDialog() ?? this.builderVideoSource();
      const stream = this.isAudioUnitEditor()
        ? await navigator.mediaDevices.getUserMedia({ audio: true })
        : mode === "screen"
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.stopAllBuilderMediaTracks();
      this.builderMediaStream.set(stream);
      this.builderRecordedChunks = [];
      this.builderMediaRecorder = new MediaRecorder(stream);
      this.builderMediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.builderRecordedChunks.push(event.data);
      };
      this.builderMediaRecorder.onstop = () => this.finishBuilderRecording();
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (this.builderRecordingActive()) this.stopBuilderRecording();
        };
      });
      this.builderRecordingSeconds.set(0);
      this.builderRecordingTimer = setInterval(() => this.builderRecordingSeconds.update((seconds) => seconds + 1), 1000);
      this.builderMediaRecorder.start();
      this.builderRecordingActive.set(true);
    } catch (error: any) {
      this.builderRecordingError.set(error?.name === "NotAllowedError" ? "Permission denied." : "Unable to start recording.");
      this.builderRecordingActive.set(false);
    }
  }

  stopBuilderRecording(): void {
    if (this.builderMediaRecorder && this.builderMediaRecorder.state !== "inactive") {
      this.builderMediaRecorder.stop();
    } else {
      this.finishBuilderRecording();
    }
  }

  pauseBuilderRecording(): void {
    if (this.builderMediaRecorder?.state === "recording") this.builderMediaRecorder.pause();
  }

  resumeBuilderRecording(): void {
    if (this.builderMediaRecorder?.state === "paused") this.builderMediaRecorder.resume();
  }

  private finishBuilderRecording(): void {
    this.builderRecordingActive.set(false);
    this.clearBuilderRecordingTimer();
    this.stopAllBuilderMediaTracks();
    if (!this.builderRecordedChunks.length) return;
    const audioRecording = this.isAudioUnitEditor();
    const mimeType = audioRecording ? "audio/webm" : "video/webm";
    const fileName = audioRecording ? "audio-recording.webm" : "recording.webm";
    const blob = new Blob(this.builderRecordedChunks, { type: mimeType });
    this.revokeBuilderRecordedPreviewUrl();
    const previewUrl = URL.createObjectURL(blob);
    this.builderRecordedPreviewUrl.set(previewUrl);
    this.builderUploadFileName.set(fileName);
    this.builderUploadPreviewUrl.set(previewUrl);
    this.builderUploadProgress.set(100);
    this.builderUploadStatus.set(`${this.formatFileSize(blob.size)} · recording ready. Backend upload endpoint required.`);
    this.writeSelectedNodeValue("upload", {
      fileName,
      fileSize: blob.size,
      mimeType,
      previewUrl,
      status: "READY",
      uploaded: false,
    });
    this.writeSelectedNodeValue("unitType", audioRecording ? "AUDIO" : "VIDEO");
    this.builderMediaDialog.set(null);
    this.markBuilderDirty();
  }

  addLessonBlock(type: CourseBuilderBlockType): void {
    const block = this.createBuilderBlock(type);
    this.builderBlocks.update((blocks) => [...blocks, block]);
    this.builderSelectedBlockId.set(block.id);
    this.persistBuilderBlocksToSelectedNode();
    this.markBuilderDirty();
  }

  addTestQuestion(type: CourseBuilderQuestionType): void {
    const option = this.questionOptionForType(type);
    const block = this.createBuilderBlock("quiz");
    block.title = option.label;
    block.payload = {
      ...block.payload,
      questionType: option.type,
      title: option.label,
    };
    this.builderBlocks.update((blocks) => [...blocks, block]);
    this.builderSelectedBlockId.set(block.id);
    this.persistBuilderBlocksToSelectedNode();
    this.writeSelectedNodeValue("unitType", "QUIZ");
    this.markBuilderDirty();
  }

  openTestQuestionType(type: CourseBuilderQuestionType): void {
    if (type === "multipleChoice") {
      this.openMultipleChoiceQuestionDrawer();
      return;
    }
    if (type === "fillGaps") {
      this.openFillGapsQuestionDrawer();
      return;
    }
    if (type === "ordering") {
      this.openOrderingQuestionDrawer();
      return;
    }
    if (type === "matching") {
      this.openMatchPairsQuestionDrawer();
      return;
    }
    if (type === "freeText") {
      this.openFreeTextQuestionDrawer();
      return;
    }
    if (type === "likertScale") {
      this.addTestQuestion(type);
      return;
    }
    if (type === "import") {
      this.openImportQuestionsDrawer();
      return;
    }
    if (type === "existing") {
      this.openExistingQuestionsDrawer();
      return;
    }

    this.addTestQuestion(type);
  }

  openTestQuestionBlock(block: CourseBuilderBlock): void {
    const questionType = block.payload["questionType"] as CourseBuilderQuestionType | undefined;
    if (questionType === "multipleChoice") {
      this.openMultipleChoiceQuestionDrawer(block);
      return;
    }
    if (questionType === "fillGaps") {
      this.openFillGapsQuestionDrawer(block);
      return;
    }
    if (questionType === "ordering") {
      this.openOrderingQuestionDrawer(block);
      return;
    }
    if (questionType === "matching") {
      this.openMatchPairsQuestionDrawer(block);
      return;
    }
    if (questionType === "freeText") {
      this.openFreeTextQuestionDrawer(block);
      return;
    }
    if (questionType === "import") {
      this.openImportQuestionsDrawer();
      return;
    }
    if (questionType === "existing") {
      this.openExistingQuestionsDrawer();
      return;
    }

    this.selectBuilderBlock(block.id);
  }

  toggleTestQuestionAnswers(blockId: string): void {
    this.expandedTestQuestionId.update((current) => current === blockId ? null : blockId);
    this.builderSelectedBlockId.set(blockId);
  }

  openMultipleChoiceQuestionDrawer(block?: CourseBuilderBlock): void {
    const answers = block ? this.quizAnswers(block) : ["", ""];
    this.builderSelectedBlockId.set(block?.id ?? null);
    this.fillGapsQuestionDraft.set(null);
    this.orderingQuestionDraft.set(null);
    this.matchPairsQuestionDraft.set(null);
    this.freeTextQuestionDraft.set(null);
    this.importQuestionsDraft.set(null);
    this.existingQuestionsDrawerOpen.set(false);
    this.multipleChoiceQuestionDraft.set({
      blockId: block?.id ?? null,
      question: block ? this.blockPayloadString(block, "question") : "",
      answers: answers.length ? answers : ["", ""],
      correctIndex: block ? this.quizCorrectIndex(block) : -1,
    });
  }

  closeMultipleChoiceQuestionDrawer(): void {
    this.multipleChoiceQuestionDraft.set(null);
  }

  openFillGapsQuestionDrawer(block?: CourseBuilderBlock): void {
    this.builderSelectedBlockId.set(block?.id ?? null);
    this.multipleChoiceQuestionDraft.set(null);
    this.orderingQuestionDraft.set(null);
    this.matchPairsQuestionDraft.set(null);
    this.freeTextQuestionDraft.set(null);
    this.importQuestionsDraft.set(null);
    this.existingQuestionsDrawerOpen.set(false);
    this.fillGapsQuestionDraft.set({
      blockId: block?.id ?? null,
      question: block ? this.blockPayloadString(block, "question") : "",
    });
  }

  closeFillGapsQuestionDrawer(): void {
    this.fillGapsQuestionDraft.set(null);
  }

  updateFillGapsQuestion(question: string): void {
    this.fillGapsQuestionDraft.update((draft) => draft ? { ...draft, question } : draft);
  }

  canSaveFillGapsQuestion(): boolean {
    const draft = this.fillGapsQuestionDraft();
    return Boolean(draft?.question.trim());
  }

  saveFillGapsQuestion(): void {
    const draft = this.fillGapsQuestionDraft();
    if (!draft || !this.canSaveFillGapsQuestion()) return;
    const question = draft.question.trim();
    const title = question;
    const payload = {
      title,
      question,
      answers: this.extractFillGapsAnswers(question),
      questionType: "fillGaps",
    };

    if (draft.blockId) {
      this.builderBlocks.update((blocks) => blocks.map((block) => block.id === draft.blockId ? { ...block, title, payload } : block));
      this.builderSelectedBlockId.set(draft.blockId);
    } else {
      const block = this.createBuilderBlock("quiz");
      block.title = title;
      block.payload = payload;
      this.builderBlocks.update((blocks) => [...blocks, block]);
      this.builderSelectedBlockId.set(block.id);
    }

    this.persistBuilderBlocksToSelectedNode();
    this.writeSelectedNodeValue("unitType", "QUIZ");
    this.closeFillGapsQuestionDrawer();
    this.markBuilderDirty();
  }

  private extractFillGapsAnswers(question: string): string[] {
    return Array.from(question.matchAll(/\[([^\]]+)\]/g))
      .flatMap((match) => match[1].split("/"))
      .map((answer) => answer.trim())
      .filter(Boolean);
  }

  openOrderingQuestionDrawer(block?: CourseBuilderBlock): void {
    const items = block ? this.quizAnswers(block) : ["", ""];
    this.builderSelectedBlockId.set(block?.id ?? null);
    this.multipleChoiceQuestionDraft.set(null);
    this.fillGapsQuestionDraft.set(null);
    this.matchPairsQuestionDraft.set(null);
    this.freeTextQuestionDraft.set(null);
    this.importQuestionsDraft.set(null);
    this.existingQuestionsDrawerOpen.set(false);
    this.orderingQuestionDraft.set({
      blockId: block?.id ?? null,
      question: block ? this.blockPayloadString(block, "question") : "",
      items: items.length >= 2 ? items : ["", ""],
    });
  }

  closeOrderingQuestionDrawer(): void {
    this.orderingQuestionDraft.set(null);
  }

  updateOrderingQuestion(question: string): void {
    this.orderingQuestionDraft.update((draft) => draft ? { ...draft, question } : draft);
  }

  updateOrderingItem(index: number, value: string): void {
    this.orderingQuestionDraft.update((draft) => {
      if (!draft) return draft;
      const items = [...draft.items];
      items[index] = value;
      return { ...draft, items };
    });
  }

  addOrderingItemAfter(index: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const draft = this.orderingQuestionDraft();
    if (!draft || !draft.items[index]?.trim()) return;
    const items = [...draft.items];
    items.splice(index + 1, 0, "");
    this.orderingQuestionDraft.set({ ...draft, items });
    setTimeout(() => {
      const nextInput = globalThis.document?.querySelector<HTMLInputElement>(`.lms-test-ordering-row input[data-test-ordering-index="${index + 1}"]`);
      nextInput?.focus();
    });
  }

  removeOrderingItem(index: number): void {
    this.orderingQuestionDraft.update((draft) => {
      if (!draft || draft.items.length <= 2) return draft;
      return { ...draft, items: draft.items.filter((_, itemIndex) => itemIndex !== index) };
    });
  }

  orderingItemPlaceholder(index: number): string {
    if (index === 0) return "Add the first item";
    if (index === 1) return "Add the second item";
    return "Add another item";
  }

  canSaveOrderingQuestion(): boolean {
    const draft = this.orderingQuestionDraft();
    if (!draft) return false;
    return Boolean(draft.question.trim() || draft.items.some((item) => item.trim()));
  }

  saveOrderingQuestion(): void {
    const draft = this.orderingQuestionDraft();
    if (!draft || !this.canSaveOrderingQuestion()) return;
    const answers = draft.items.map((item) => item.trim()).filter(Boolean);
    const title = draft.question.trim() || "Ordering";
    const payload = {
      title,
      question: draft.question.trim(),
      answers: answers.length ? answers : ["", ""],
      questionType: "ordering",
    };

    if (draft.blockId) {
      this.builderBlocks.update((blocks) => blocks.map((block) => block.id === draft.blockId ? { ...block, title, payload } : block));
      this.builderSelectedBlockId.set(draft.blockId);
    } else {
      const block = this.createBuilderBlock("quiz");
      block.title = title;
      block.payload = payload;
      this.builderBlocks.update((blocks) => [...blocks, block]);
      this.builderSelectedBlockId.set(block.id);
    }

    this.persistBuilderBlocksToSelectedNode();
    this.writeSelectedNodeValue("unitType", "QUIZ");
    this.closeOrderingQuestionDrawer();
    this.markBuilderDirty();
  }

  openMatchPairsQuestionDrawer(block?: CourseBuilderBlock): void {
    const pairs = block ? this.quizMatchingPairs(block) : [];
    this.builderSelectedBlockId.set(block?.id ?? null);
    this.multipleChoiceQuestionDraft.set(null);
    this.fillGapsQuestionDraft.set(null);
    this.orderingQuestionDraft.set(null);
    this.freeTextQuestionDraft.set(null);
    this.importQuestionsDraft.set(null);
    this.existingQuestionsDrawerOpen.set(false);
    this.matchPairsQuestionDraft.set({
      blockId: block?.id ?? null,
      question: block ? this.blockPayloadString(block, "question") : "",
      pairs: pairs.length >= 2 ? pairs : [{ left: "", right: "" }, { left: "", right: "" }],
    });
  }

  closeMatchPairsQuestionDrawer(): void {
    this.matchPairsQuestionDraft.set(null);
  }

  updateMatchPairsQuestion(question: string): void {
    this.matchPairsQuestionDraft.update((draft) => draft ? { ...draft, question } : draft);
  }

  updateMatchPairItem(index: number, side: "left" | "right", value: string): void {
    this.matchPairsQuestionDraft.update((draft) => {
      if (!draft) return draft;
      const pairs = draft.pairs.map((pair, pairIndex) => pairIndex === index ? { ...pair, [side]: value } : pair);
      return { ...draft, pairs };
    });
  }

  addMatchPairAfter(index: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const draft = this.matchPairsQuestionDraft();
    const pair = draft?.pairs[index];
    if (!draft || !pair || (!pair.left.trim() && !pair.right.trim())) return;
    const pairs = [...draft.pairs];
    pairs.splice(index + 1, 0, { left: "", right: "" });
    this.matchPairsQuestionDraft.set({ ...draft, pairs });
    setTimeout(() => {
      const nextInput = globalThis.document?.querySelector<HTMLInputElement>(`.lms-test-matching-pair input[data-test-match-left-index="${index + 1}"]`);
      nextInput?.focus();
    });
  }

  removeMatchPair(index: number): void {
    this.matchPairsQuestionDraft.update((draft) => {
      if (!draft || draft.pairs.length <= 2) return draft;
      return { ...draft, pairs: draft.pairs.filter((_, pairIndex) => pairIndex !== index) };
    });
  }

  matchingPairPlaceholder(index: number): string {
    if (index === 0) return "Add the first item";
    if (index === 1) return "Add the second item";
    return "Add another item";
  }

  canSaveMatchPairsQuestion(): boolean {
    const draft = this.matchPairsQuestionDraft();
    if (!draft) return false;
    return Boolean(draft.question.trim() || draft.pairs.some((pair) => pair.left.trim() || pair.right.trim()));
  }

  saveMatchPairsQuestion(): void {
    const draft = this.matchPairsQuestionDraft();
    if (!draft || !this.canSaveMatchPairsQuestion()) return;
    const pairs = draft.pairs
      .map((pair) => ({ left: pair.left.trim(), right: pair.right.trim() }))
      .filter((pair) => pair.left || pair.right);
    const title = draft.question.trim() || "Match the pairs";
    const payload = {
      title,
      question: draft.question.trim(),
      pairs: pairs.length ? pairs : [{ left: "", right: "" }, { left: "", right: "" }],
      questionType: "matching",
    };

    if (draft.blockId) {
      this.builderBlocks.update((blocks) => blocks.map((block) => block.id === draft.blockId ? { ...block, title, payload } : block));
      this.builderSelectedBlockId.set(draft.blockId);
    } else {
      const block = this.createBuilderBlock("quiz");
      block.title = title;
      block.payload = payload;
      this.builderBlocks.update((blocks) => [...blocks, block]);
      this.builderSelectedBlockId.set(block.id);
    }

    this.persistBuilderBlocksToSelectedNode();
    this.writeSelectedNodeValue("unitType", "QUIZ");
    this.closeMatchPairsQuestionDrawer();
    this.markBuilderDirty();
  }

  openFreeTextQuestionDrawer(block?: CourseBuilderBlock): void {
    const rule = block ? this.freeTextQuestionRule(block) : null;
    this.builderSelectedBlockId.set(block?.id ?? null);
    this.multipleChoiceQuestionDraft.set(null);
    this.fillGapsQuestionDraft.set(null);
    this.orderingQuestionDraft.set(null);
    this.matchPairsQuestionDraft.set(null);
    this.importQuestionsDraft.set(null);
    this.existingQuestionsDrawerOpen.set(false);
    this.freeTextQuestionDraft.set({
      blockId: block?.id ?? null,
      question: block ? this.blockPayloadString(block, "question") : "",
      minimumPoints: block ? this.freeTextMinimumPoints(block) : 0,
      rule: rule ?? { operator: "contains", words: "", points: 0 },
    });
  }

  closeFreeTextQuestionDrawer(): void {
    this.freeTextQuestionDraft.set(null);
  }

  updateFreeTextQuestion(question: string): void {
    this.freeTextQuestionDraft.update((draft) => draft ? { ...draft, question } : draft);
  }

  updateFreeTextMinimumPoints(value: unknown): void {
    this.freeTextQuestionDraft.update((draft) => draft ? { ...draft, minimumPoints: this.coerceNonNegativeNumber(value) } : draft);
  }

  updateFreeTextRuleOperator(operator: string): void {
    this.freeTextQuestionDraft.update((draft) => draft ? { ...draft, rule: { ...draft.rule, operator } } : draft);
  }

  updateFreeTextRuleWords(words: string): void {
    this.freeTextQuestionDraft.update((draft) => draft ? { ...draft, rule: { ...draft.rule, words } } : draft);
  }

  updateFreeTextRulePoints(value: unknown): void {
    this.freeTextQuestionDraft.update((draft) => draft ? { ...draft, rule: { ...draft.rule, points: this.coerceNonNegativeNumber(value) } } : draft);
  }

  canSaveFreeTextQuestion(): boolean {
    const draft = this.freeTextQuestionDraft();
    if (!draft) return false;
    return Boolean(draft.question.trim() || draft.rule.words.trim());
  }

  saveFreeTextQuestion(): void {
    const draft = this.freeTextQuestionDraft();
    if (!draft || !this.canSaveFreeTextQuestion()) return;
    const title = draft.question.trim() || "Free text";
    const rule = {
      operator: draft.rule.operator || "contains",
      words: draft.rule.words.trim(),
      points: this.coerceNonNegativeNumber(draft.rule.points),
    };
    const payload = {
      title,
      question: draft.question.trim(),
      minimumPoints: this.coerceNonNegativeNumber(draft.minimumPoints),
      rules: [rule],
      questionType: "freeText",
    };

    if (draft.blockId) {
      this.builderBlocks.update((blocks) => blocks.map((block) => block.id === draft.blockId ? { ...block, title, payload } : block));
      this.builderSelectedBlockId.set(draft.blockId);
    } else {
      const block = this.createBuilderBlock("quiz");
      block.title = title;
      block.payload = payload;
      this.builderBlocks.update((blocks) => [...blocks, block]);
      this.builderSelectedBlockId.set(block.id);
    }

    this.persistBuilderBlocksToSelectedNode();
    this.writeSelectedNodeValue("unitType", "QUIZ");
    this.closeFreeTextQuestionDrawer();
    this.markBuilderDirty();
  }

  openImportQuestionsDrawer(): void {
    this.builderSelectedBlockId.set(null);
    this.multipleChoiceQuestionDraft.set(null);
    this.fillGapsQuestionDraft.set(null);
    this.orderingQuestionDraft.set(null);
    this.matchPairsQuestionDraft.set(null);
    this.freeTextQuestionDraft.set(null);
    this.existingQuestionsDrawerOpen.set(false);
    this.importCheatsheetOpen.set("multipleChoice");
    this.importQuestionsDraft.set({
      type: "GIFT",
      data: "",
      validationMessage: null,
      validationError: null,
    });
  }

  closeImportQuestionsDrawer(): void {
    this.importQuestionsDraft.set(null);
  }

  openExistingQuestionsDrawer(): void {
    this.builderSelectedBlockId.set(null);
    this.multipleChoiceQuestionDraft.set(null);
    this.fillGapsQuestionDraft.set(null);
    this.orderingQuestionDraft.set(null);
    this.matchPairsQuestionDraft.set(null);
    this.freeTextQuestionDraft.set(null);
    this.importQuestionsDraft.set(null);
    this.expandedTestQuestionId.set(null);
    this.existingQuestionPreview.set(null);
    this.existingQuestionsDrawerOpen.set(true);
  }

  closeExistingQuestionsDrawer(): void {
    this.existingQuestionsDrawerOpen.set(false);
    this.existingQuestionSearch.set("");
    this.existingQuestionPreview.set(null);
    this.expandedTestQuestionId.set(null);
  }

  currentCourseExistingQuestions(): ExistingCourseQuestionOption[] {
    const selectedNodeId = this.activeCourseContentPreviewId();
    const questions: ExistingCourseQuestionOption[] = [];
    const courseTitle = this.courseForm.controls.title.value || "New course";
    const visit = (node: FormGroup<any>): void => {
      const nodeId = String(node.controls['id'].value);
      if (nodeId !== selectedNodeId) {
        const nodeTitle = String(node.controls['title'].value || "Untitled unit");
        const blocks = this.sanitizeBuilderBlocks(node.controls['blocks'].value);
        for (const block of blocks) {
          if (block.type === "quiz") questions.push({ block, nodeTitle, courseTitle });
        }
      }
      for (const child of this.courseNodeChildren(node).controls) visit(child);
    };

    for (const node of this.curriculumControls().controls) visit(node);
    return questions;
  }

  filteredExistingCourseQuestions(): ExistingCourseQuestionOption[] {
    const query = this.existingQuestionSearch().trim().toLocaleLowerCase();
    if (!query) return this.currentCourseExistingQuestions();
    return this.currentCourseExistingQuestions().filter((option) =>
      [this.existingQuestionTitle(option), option.nodeTitle, option.courseTitle]
        .some((value) => value.toLocaleLowerCase().includes(query)),
    );
  }

  existingQuestionTitle(option: ExistingCourseQuestionOption): string {
    return this.blockPayloadString(option.block, "title") || this.blockPayloadString(option.block, "question") || option.block.title || "Untitled question";
  }

  isExistingQuestionAdded(option: ExistingCourseQuestionOption): boolean {
    return this.builderBlocks().some((block) => block.payload["sourceBlockId"] === option.block.id);
  }

  openExistingQuestionPreview(option: ExistingCourseQuestionOption): void {
    this.existingQuestionPreview.set(option);
  }

  closeExistingQuestionPreview(): void {
    this.existingQuestionPreview.set(null);
  }

  existingQuestionTypeLabel(block: CourseBuilderBlock): string {
    const type = this.blockPayloadString(block, "questionType");
    if (type === "multipleChoice") return "Multiple choice";
    if (type === "fillGaps") return "Fill gaps";
    if (type === "ordering") return "Ordering";
    if (type === "matching") return "Matching";
    if (type === "freeText") return "Free text";
    return "Question";
  }

  toggleExistingQuestionPreview(blockId: string): void {
    this.expandedTestQuestionId.update((current) => current === blockId ? null : blockId);
  }

  toggleExistingCourseQuestion(option: ExistingCourseQuestionOption): void {
    if (this.isExistingQuestionAdded(option)) {
      this.builderBlocks.update((blocks) => blocks.filter((block) => block.payload["sourceBlockId"] !== option.block.id));
      this.persistBuilderBlocksToSelectedNode();
      this.markBuilderDirty();
      return;
    }
    this.appendExistingCourseQuestion(option, false);
  }

  addExistingCourseQuestion(option: ExistingCourseQuestionOption): void {
    this.appendExistingCourseQuestion(option, true);
  }

  private appendExistingCourseQuestion(option: ExistingCourseQuestionOption, closeDrawer: boolean): void {
    const copy = typeof structuredClone === "function"
      ? structuredClone(option.block)
      : JSON.parse(JSON.stringify(option.block)) as CourseBuilderBlock;
    copy.id = createCourseContentId();
    copy.title = option.block.title;
    copy.payload = {
      ...copy.payload,
      sourceBlockId: option.block.id,
      sourceNodeTitle: option.nodeTitle,
      questionType: copy.payload["questionType"] ?? "existing",
    };
    this.builderBlocks.update((blocks) => [...blocks, copy]);
    this.builderSelectedBlockId.set(copy.id);
    this.expandedTestQuestionId.set(copy.id);
    this.persistBuilderBlocksToSelectedNode();
    this.writeSelectedNodeValue("unitType", "QUIZ");
    if (closeDrawer) this.closeExistingQuestionsDrawer();
    this.markBuilderDirty();
  }

  updateImportQuestionsType(type: ImportQuestionsType): void {
    this.importCheatsheetOpen.set("multipleChoice");
    this.importQuestionsDraft.update((draft) => draft ? { ...draft, type, validationMessage: null, validationError: null } : draft);
  }

  updateImportQuestionsData(data: string): void {
    this.importQuestionsDraft.update((draft) => draft ? { ...draft, data, validationMessage: null, validationError: null } : draft);
  }

  toggleImportCheatsheet(section: ImportCheatsheetSection): void {
    this.importCheatsheetOpen.update((open) => open === section ? null : section);
  }

  validateImportQuestions(): void {
    const draft = this.importQuestionsDraft();
    if (!draft) return;
    const parsed = this.parseImportQuestions(draft);
    this.importQuestionsDraft.set({
      ...draft,
      validationMessage: parsed.length ? `${parsed.length} question${parsed.length === 1 ? "" : "s"} ready to import.` : null,
      validationError: parsed.length ? null : `No valid ${draft.type} questions found.`,
    });
  }

  canSaveImportQuestions(): boolean {
    const draft = this.importQuestionsDraft();
    return Boolean(draft && this.parseImportQuestions(draft).length);
  }

  saveImportQuestions(): void {
    const draft = this.importQuestionsDraft();
    if (!draft) return;
    const questions = this.parseImportQuestions(draft);
    if (!questions.length) {
      this.validateImportQuestions();
      return;
    }

    const blocks = questions.map((question) => {
      const block = this.createBuilderBlock("quiz");
      block.title = question.title;
      block.payload = question.payload;
      return block;
    });

    this.builderBlocks.update((current) => [...current, ...blocks]);
    this.builderSelectedBlockId.set(blocks[0]?.id ?? null);
    this.expandedTestQuestionId.set(blocks[0]?.id ?? null);
    this.persistBuilderBlocksToSelectedNode();
    this.writeSelectedNodeValue("unitType", "QUIZ");
    this.closeImportQuestionsDrawer();
    this.markBuilderDirty();
  }

  copyAikenImportExample(): void {
    void globalThis.navigator?.clipboard?.writeText(this.aikenImportExample);
  }

  copyGiftImportExample(section: { example: string }): void {
    void globalThis.navigator?.clipboard?.writeText(section.example);
  }

  private parseImportQuestions(draft: ImportQuestionsDraft): ImportedQuestion[] {
    return draft.type === "GIFT" ? this.parseGiftQuestions(draft.data) : this.parseAikenQuestions(draft.data);
  }

  private parseAikenQuestions(data: string): ImportedQuestion[] {
    return data
      .split(/\n\s*\n/g)
      .map((entry) => this.parseAikenQuestion(entry))
      .filter((question): question is ImportedQuestion => Boolean(question));
  }

  private parseAikenQuestion(entry: string): ImportedQuestion | null {
    const lines = entry
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 4) return null;

    const answerLine = lines[lines.length - 1];
    const correctMatch = answerLine.match(/^ANSWER:\s*([A-Z])$/i);
    if (!correctMatch) return null;

    const answerEntries = lines.slice(1, -1)
      .map((line) => {
        const match = line.match(/^([A-Z])[.)]\s+(.+)$/i);
        return match ? { letter: match[1].toUpperCase(), answer: match[2].trim() } : null;
      })
      .filter((item): item is { letter: string; answer: string } => Boolean(item));
    if (answerEntries.length < 2 || answerEntries.length !== lines.length - 2) return null;

    const correctLetter = correctMatch[1].toUpperCase();
    const correctIndex = answerEntries.findIndex((item) => item.letter === correctLetter);
    if (correctIndex < 0) return null;

    return {
      title: lines[0],
      payload: {
        title: lines[0],
        question: lines[0],
        answers: answerEntries.map((item) => item.answer),
        correctIndex,
        questionType: "multipleChoice",
      },
    };
  }

  private parseGiftQuestions(data: string): ImportedQuestion[] {
    const normalized = data.replace(/\r\n/g, "\n");
    const parsed: ImportedQuestion[] = [];
    const consumedLineIndexes = new Set<number>();
    const lines = normalized.split("\n");

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line) continue;

      const trueFalseQuestion = this.parseGiftTrueFalseQuestion(line);
      if (trueFalseQuestion) {
        parsed.push(trueFalseQuestion);
        consumedLineIndexes.add(index);
        continue;
      }

      const freeTextQuestion = this.parseGiftFreeTextQuestion(line);
      if (freeTextQuestion) {
        parsed.push(freeTextQuestion);
        consumedLineIndexes.add(index);
        continue;
      }

      const fillGapsQuestion = this.parseGiftFillGapsQuestion(line);
      if (fillGapsQuestion) {
        parsed.push(fillGapsQuestion);
        consumedLineIndexes.add(index);
      }
    }

    const blockPattern = /([^{}\n][^{]*?)\s*\{([\s\S]*?)\}/g;
    let match: RegExpExecArray | null;
    while ((match = blockPattern.exec(normalized)) !== null) {
      const startLine = normalized.slice(0, match.index).split("\n").length - 1;
      if (consumedLineIndexes.has(startLine)) continue;
      const questionText = match[1].trim();
      const body = match[2].trim();
      if (!questionText) continue;
      const blockQuestion = this.parseGiftBlockQuestion(questionText, body);
      if (blockQuestion) parsed.push(blockQuestion);
    }

    return parsed;
  }

  private parseGiftTrueFalseQuestion(entry: string): ImportedQuestion | null {
    const match = entry.match(/^(.+?)\s*\{\s*(TRUE|FALSE|T|F)\s*\}\s*$/i);
    if (!match) return null;
    const question = match[1].trim();
    const isTrue = /^(TRUE|T)$/i.test(match[2]);
    if (!question) return null;
    return {
      title: question,
      payload: {
        title: question,
        question,
        answers: ["True", "False"],
        correctIndex: isTrue ? 0 : 1,
        questionType: "multipleChoice",
      },
    };
  }

  private parseGiftFreeTextQuestion(entry: string): ImportedQuestion | null {
    const match = entry.match(/^(.+?)\s*\{\s*\}\s*$/);
    if (!match) return null;
    const question = match[1].trim();
    if (!question) return null;
    return {
      title: question,
      payload: {
        title: question,
        question,
        minimumPoints: 0,
        rules: [],
        questionType: "freeText",
      },
    };
  }

  private parseGiftFillGapsQuestion(entry: string): ImportedQuestion | null {
    const answers = Array.from(entry.matchAll(/\{\s*=([^}]+)\}/g))
      .map((match) => match[1].trim())
      .filter(Boolean);
    if (!answers.length) return null;
    const question = entry.replace(/\{\s*=([^}]+)\}/g, (_match, answer: string) => `[${String(answer).trim()}]`).trim();
    return {
      title: question,
      payload: {
        title: question,
        question,
        answers,
        questionType: "fillGaps",
      },
    };
  }

  private parseGiftBlockQuestion(question: string, body: string): ImportedQuestion | null {
    if (!body) return this.parseGiftFreeTextQuestion(`${question} {}`);

    const bodyLines = body
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!bodyLines.length) return null;

    if (bodyLines.every((line) => line.startsWith("=") && line.includes("->"))) {
      const pairs = bodyLines
        .map((line) => line.replace(/^=/, "").split("->"))
        .map(([left, right]) => ({ left: (left ?? "").trim(), right: (right ?? "").trim() }))
        .filter((pair) => pair.left && pair.right);
      if (pairs.length < 2) return null;
      return {
        title: question,
        payload: {
          title: question,
          question,
          pairs,
          questionType: "matching",
        },
      };
    }

    const options = bodyLines
      .map((line) => {
        const match = line.match(/^([~=])\s*(.+)$/);
        return match ? { correct: match[1] === "=", answer: match[2].trim() } : null;
      })
      .filter((option): option is { correct: boolean; answer: string } => Boolean(option && option.answer));
    if (options.length < 2 || options.length !== bodyLines.length) return null;

    const correctIndex = options.findIndex((option) => option.correct);
    if (correctIndex < 0) return null;
    return {
      title: question,
      payload: {
        title: question,
        question,
        answers: options.map((option) => option.answer),
        correctIndex,
        questionType: "multipleChoice",
      },
    };
  }

  updateMultipleChoiceQuestion(question: string): void {
    this.multipleChoiceQuestionDraft.update((draft) => draft ? { ...draft, question } : draft);
  }

  updateMultipleChoiceAnswer(index: number, value: string): void {
    this.multipleChoiceQuestionDraft.update((draft) => {
      if (!draft) return draft;
      const answers = [...draft.answers];
      answers[index] = value;
      return { ...draft, answers };
    });
  }

  addMultipleChoiceAnswerAfter(index: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const draft = this.multipleChoiceQuestionDraft();
    if (!draft || !draft.answers[index]?.trim()) return;
    const answers = [...draft.answers];
    answers.splice(index + 1, 0, "");
    this.multipleChoiceQuestionDraft.set({ ...draft, answers });
    setTimeout(() => {
      const nextInput = globalThis.document?.querySelector<HTMLInputElement>(`.lms-test-answer-row input[data-test-answer-index="${index + 1}"]`);
      nextInput?.focus();
    });
  }

  removeMultipleChoiceAnswer(index: number): void {
    this.multipleChoiceQuestionDraft.update((draft) => {
      if (!draft || draft.answers.length <= 1) return draft;
      const answers = draft.answers.filter((_, answerIndex) => answerIndex !== index);
      const correctIndex = draft.correctIndex === index ? -1 : draft.correctIndex > index ? draft.correctIndex - 1 : draft.correctIndex;
      return { ...draft, answers, correctIndex };
    });
  }

  setMultipleChoiceCorrectAnswer(index: number): void {
    this.multipleChoiceQuestionDraft.update((draft) => draft ? { ...draft, correctIndex: draft.correctIndex === index ? -1 : index } : draft);
  }

  canSaveMultipleChoiceQuestion(): boolean {
    const draft = this.multipleChoiceQuestionDraft();
    if (!draft) return false;
    return Boolean(draft.question.trim() || draft.answers.some((answer) => answer.trim()));
  }

  saveMultipleChoiceQuestion(): void {
    const draft = this.multipleChoiceQuestionDraft();
    if (!draft || !this.canSaveMultipleChoiceQuestion()) return;
    const answerEntries = draft.answers
      .map((answer, index) => ({ answer: answer.trim(), index }))
      .filter((entry) => entry.answer);
    const answers = answerEntries.map((entry) => entry.answer);
    const correctIndex = answerEntries.findIndex((entry) => entry.index === draft.correctIndex);
    const title = draft.question.trim() || "Multiple choice";
    const payload = {
      title,
      question: draft.question.trim(),
      answers: answers.length ? answers : [""],
      correctIndex,
      questionType: "multipleChoice",
    };

    if (draft.blockId) {
      this.builderBlocks.update((blocks) => blocks.map((block) => block.id === draft.blockId ? { ...block, title, payload } : block));
      this.builderSelectedBlockId.set(draft.blockId);
    } else {
      const block = this.createBuilderBlock("quiz");
      block.title = title;
      block.payload = payload;
      this.builderBlocks.update((blocks) => [...blocks, block]);
      this.builderSelectedBlockId.set(block.id);
    }

    this.persistBuilderBlocksToSelectedNode();
    this.writeSelectedNodeValue("unitType", "QUIZ");
    this.closeMultipleChoiceQuestionDrawer();
    this.markBuilderDirty();
  }

  removeBuilderBlock(blockId: string): void {
    this.builderBlocks.update((blocks) => blocks.filter((block) => block.id !== blockId));
    if (this.builderSelectedBlockId() === blockId) this.builderSelectedBlockId.set(null);
    if (this.expandedTestQuestionId() === blockId) this.expandedTestQuestionId.set(null);
    this.persistBuilderBlocksToSelectedNode();
    this.markBuilderDirty();
  }

  duplicateBuilderBlock(block: CourseBuilderBlock): void {
    const copy = structuredClone ? structuredClone(block) : JSON.parse(JSON.stringify(block)) as CourseBuilderBlock;
    copy.id = createCourseContentId();
    copy.title = `${block.title} copy`;
    this.builderBlocks.update((blocks) => [...blocks, copy]);
    this.builderSelectedBlockId.set(copy.id);
    this.persistBuilderBlocksToSelectedNode();
    this.markBuilderDirty();
  }

  moveBuilderBlock(index: number, direction: -1 | 1): void {
    const blocks = [...this.builderBlocks()];
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    this.builderBlocks.set(blocks);
    this.persistBuilderBlocksToSelectedNode();
    this.markBuilderDirty();
  }

  dropBuilderBlock(event: CdkDragDrop<CourseBuilderBlock[]>): void {
    const blocks = [...this.builderBlocks()];
    moveItemInArray(blocks, event.previousIndex, event.currentIndex);
    this.builderBlocks.set(blocks);
    this.persistBuilderBlocksToSelectedNode();
    this.markBuilderDirty();
  }

  builderBlockLabel(type: CourseBuilderBlockType): string {
    switch (type) {
      case "text": return "Text editor";
      case "image": return "Image";
      case "file": return "File attachment";
      case "embed": return "Safe embed";
      case "quiz": return "Quiz";
      case "assignment": return "Assignment";
      case "divider": return "Divider";
      default: return "Divider";
    }
  }

  builderBlockIcon(type: CourseBuilderBlockType): string {
    switch (type) {
      case "text": return "notes";
      case "image": return "image";
      case "file": return "attach_file";
      case "embed": return "code";
      case "quiz": return "quiz";
      case "assignment": return "assignment";
      case "divider": return "horizontal_rule";
      default: return "horizontal_rule";
    }
  }

  testQuestionBlocks(): CourseBuilderBlock[] {
    return this.builderBlocks().filter((block) => block.type === "quiz");
  }

  testQuestionLabel(block: CourseBuilderBlock): string {
    const type = block.payload["questionType"] as CourseBuilderQuestionType | undefined;
    return type ? this.questionOptionForType(type).label : "Multiple choice";
  }

  testQuestionIcon(block: CourseBuilderBlock): string {
    const type = block.payload["questionType"] as CourseBuilderQuestionType | undefined;
    return type ? this.questionOptionForType(type).icon : "quiz";
  }

  isOrderingQuestion(block: CourseBuilderBlock): boolean {
    return block.payload["questionType"] === "ordering";
  }

  isFreeTextQuestion(block: CourseBuilderBlock): boolean {
    return block.payload["questionType"] === "freeText";
  }

  freeTextQuestionRuleSummary(block: CourseBuilderBlock): string {
    const rule = this.freeTextQuestionRule(block);
    const minimumPoints = this.freeTextMinimumPoints(block);
    if (!rule || !rule.words) return `Correct when accumulated points are at least ${minimumPoints}.`;
    return `When answer ${this.freeTextRuleLabel(rule.operator)} "${rule.words}", add ${rule.points} point${rule.points === 1 ? "" : "s"}. Correct from ${minimumPoints} point${minimumPoints === 1 ? "" : "s"}.`;
  }

  selectBuilderBlock(blockId: string): void {
    this.builderSelectedBlockId.set(blockId);
  }

  updateBuilderBlockPayload(blockId: string, key: string, value: unknown): void {
    this.builderBlocks.update((blocks) => blocks.map((block) => block.id === blockId ? { ...block, payload: { ...block.payload, [key]: value } } : block));
    this.persistBuilderBlocksToSelectedNode();
    this.markBuilderDirty();
  }

  blockPayloadString(block: CourseBuilderBlock, key: string): string {
    const value = block.payload[key];
    return typeof value === "string" ? value : value == null ? "" : String(value);
  }

  quizAnswers(block: CourseBuilderBlock): string[] {
    return Array.isArray(block.payload["answers"]) ? block.payload["answers"] as string[] : [];
  }

  quizMatchingPairs(block: CourseBuilderBlock): Array<{ left: string; right: string }> {
    const value = block.payload["pairs"];
    if (!Array.isArray(value)) return [];
    return value.map((item) => {
      if (!item || typeof item !== "object") return { left: "", right: "" };
      const pair = item as Record<string, unknown>;
      return {
        left: typeof pair["left"] === "string" ? pair["left"] : "",
        right: typeof pair["right"] === "string" ? pair["right"] : "",
      };
    });
  }

  quizCorrectIndex(block: CourseBuilderBlock): number {
    const value = block.payload["correctIndex"];
    return typeof value === "number" ? value : -1;
  }

  freeTextMinimumPoints(block: CourseBuilderBlock): number {
    return this.coerceNonNegativeNumber(block.payload["minimumPoints"]);
  }

  freeTextQuestionRule(block: CourseBuilderBlock): FreeTextQuestionDraft["rule"] | null {
    const value = block.payload["rules"];
    const firstRule = Array.isArray(value) ? value[0] : null;
    if (!firstRule || typeof firstRule !== "object") return null;
    const rule = firstRule as Record<string, unknown>;
    return {
      operator: typeof rule["operator"] === "string" ? rule["operator"] : "contains",
      words: typeof rule["words"] === "string" ? rule["words"] : "",
      points: this.coerceNonNegativeNumber(rule["points"]),
    };
  }

  private freeTextRuleLabel(operator: string): string {
    switch (operator) {
      case "equals": return "equals";
      case "startsWith": return "starts with";
      case "endsWith": return "ends with";
      default: return "contains";
    }
  }

  private coerceNonNegativeNumber(value: unknown): number {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  }

  updateQuizAnswer(blockId: string, index: number, value: string): void {
    const block = this.builderBlocks().find((item) => item.id === blockId);
    const answers = block ? [...this.quizAnswers(block)] : [];
    answers[index] = value;
    this.updateBuilderBlockPayload(blockId, "answers", answers);
  }

  setQuizCorrectAnswer(blockId: string, index: number): void {
    this.updateBuilderBlockPayload(blockId, "correctIndex", index);
  }

  builderSettingString(key: string): string {
    const settings = this.activeBuilderCourseContentNode()?.controls['settings']?.value as Record<string, unknown> | undefined;
    const value = settings?.[key];
    return typeof value === "string" ? value : value == null ? "" : String(value);
  }

  builderSettingBoolean(key: string): boolean {
    const settings = this.activeBuilderCourseContentNode()?.controls['settings']?.value as Record<string, unknown> | undefined;
    return Boolean(settings?.[key]);
  }

  updateBuilderSetting(key: string, value: unknown): void {
    const node = this.activeBuilderCourseContentNode();
    if (!node) return;
    const settings = node.controls['settings'].value as Record<string, unknown>;
    node.controls['settings'].setValue({ ...settings, [key]: value });
    if (key === "freePreview") node.controls['freePreview'].setValue(Boolean(value));
    this.markBuilderDirty();
  }

  toggleCourseContentNodeFreePreview(nodeId: string): void {
    const node = this.findCourseContentNode(nodeId);
    if (!node || this.courseNodeIsFolder(node)) return;
    const nextFreePreview = !this.courseNodeFreePreview(node);
    const settings = node.controls['settings'].value as Record<string, unknown>;
    node.controls['freePreview'].setValue(nextFreePreview);
    node.controls['settings'].setValue({ ...settings, freePreview: nextFreePreview });
    this.markBuilderDirty();
  }

  closeBuilderRecordingDialog(): void {
    this.stopAllBuilderMediaTracks();
    this.builderMediaDialog.set(null);
    this.builderRecordingActive.set(false);
  }

  useBuilderRecording(): void {
    if (!this.builderRecordedPreviewUrl()) return;
    this.builderMediaDialog.set(null);
    this.markBuilderDirty();
  }

  recordingTimerLabel(): string {
    const seconds = this.builderRecordingSeconds();
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainder = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  filteredBuilderNodes(nodes: FormGroup<any>[]): FormGroup<any>[] {
    const query = this.builderSearch().trim().toLocaleLowerCase();
    if (!query) return nodes;
    return nodes.filter((node) =>
      this.courseNodeTitle(node).toLocaleLowerCase().includes(query) ||
      this.courseNodeDescription(node).toLocaleLowerCase().includes(query) ||
      this.courseNodeChildren(node).controls.some((child) => this.filteredBuilderNodes([child]).length > 0),
    );
  }

  builderDropListId(parentId: string): string {
    return `course-builder-list-${parentId}`;
  }

  builderDropListIds(): string[] {
    return ["content-root", ...this.flattenCourseContentIds()].map((id) => this.builderDropListId(id));
  }

  dropCourseContentNode(event: CdkDragDrop<FormGroup<any>[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    this.curriculumControls().updateValueAndValidity();
    this.markBuilderDirty();
  }

  duplicateCourseContentNode(nodeId: string): void {
    const node = this.findCourseContentNode(nodeId);
    if (!node) return;
    const clone = this.cloneCourseContentFormGroup(node);
    const inserted = this.insertCloneAfterNode(this.curriculumControls(), nodeId, clone);
    if (!inserted) return;
    const cloneId = String(clone.controls['id'].value);
    this.selectedCourseContentId.set(cloneId);
    this.openCourseContentPreview(cloneId);
    this.markBuilderDirty();
  }

  handleBuilderImageBlockUpload(blockId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      this.updateBuilderBlockPayload(blockId, "error", "Unsupported image type.");
      input.value = "";
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    this.updateBuilderBlockPayload(blockId, "previewUrl", previewUrl);
    this.updateBuilderBlockPayload(blockId, "fileName", file.name);
    this.updateBuilderBlockPayload(blockId, "fileSize", this.formatFileSize(file.size));
    input.value = "";
  }

  handleBuilderFileBlockUpload(blockId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.updateBuilderBlockPayload(blockId, "fileName", file.name);
    this.updateBuilderBlockPayload(blockId, "fileSize", this.formatFileSize(file.size));
    this.updateBuilderBlockPayload(blockId, "title", file.name);
    input.value = "";
  }

  updateEmbedBlockUrl(blockId: string, value: string): void {
    const config = this.parseSupportedVideoUrl(value);
    if (!config) {
      this.updateBuilderBlockPayload(blockId, "url", value);
      this.updateBuilderBlockPayload(blockId, "embedUrl", "");
      this.updateBuilderBlockPayload(blockId, "error", value.trim() ? "Use a valid YouTube or Vimeo URL." : "");
      return;
    }
    this.updateBuilderBlockPayload(blockId, "url", value);
    this.updateBuilderBlockPayload(blockId, "embedUrl", config.embedUrl);
    this.updateBuilderBlockPayload(blockId, "error", "");
  }

  safeBlockEmbedUrl(block: CourseBuilderBlock): SafeResourceUrl | null {
    const embedUrl = this.blockPayloadString(block, "embedUrl");
    return embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
  }

  private createBuilderBlock(type: CourseBuilderBlockType): CourseBuilderBlock {
    const defaultPayload: Record<CourseBuilderBlockType, Record<string, unknown>> = {
      text: { html: "" },
      image: { previewUrl: "", alt: "", fileName: "", fileSize: "" },
      file: { title: "", fileName: "", fileSize: "" },
      embed: { url: "", embedUrl: "", error: "" },
      quiz: { title: "Quiz", question: "", answers: ["", "", "", ""], correctIndex: -1 },
      assignment: { title: "Assignment", instructions: "", maxScore: "100", dueDate: "", submissionTypes: ["file"] },
      divider: {},
    };
    return { id: createCourseContentId(), type, title: this.builderBlockLabel(type), payload: defaultPayload[type] };
  }

  private persistBuilderBlocksToSelectedNode(): void {
    this.writeSelectedNodeValue("blocks", this.sanitizeBuilderBlocks(this.builderBlocks()));
  }

  private sanitizeBuilderBlocks(value: unknown): CourseBuilderBlock[] {
    if (!Array.isArray(value)) return [];
    return (value as CourseBuilderBlock[]).filter((block) => block.payload?.["questionType"] !== "randomized");
  }

  private writeSelectedNodeValue(controlName: string, value: unknown): void {
    const node = this.activeBuilderCourseContentNode();
    if (!node?.controls[controlName]) return;
    node.controls[controlName].setValue(value);
  }

  private writeSelectedNodeSetting(settingName: string, value: unknown): void {
    const node = this.activeBuilderCourseContentNode();
    const settingsControl = node?.controls["settings"];
    if (!settingsControl) return;
    const settings = settingsControl.value as Record<string, unknown> | undefined;
    settingsControl.setValue({ ...settings, [settingName]: value });
  }

  selectPreviousCourseContentNode(): void {
    const ids = this.flattenCourseContentIds();
    const current = this.activeCourseContentPreviewId();
    const index = current ? ids.indexOf(current) : -1;
    if (index > 0) this.openCourseContentPreview(ids[index - 1]);
  }

  selectNextCourseContentNode(): void {
    const ids = this.flattenCourseContentIds();
    const current = this.activeCourseContentPreviewId();
    const index = current ? ids.indexOf(current) : -1;
    if (index >= 0 && index < ids.length - 1) this.openCourseContentPreview(ids[index + 1]);
  }

  previewSelectedBuilderUnit(): void {
    this.builderPreviewOpen.set(true);
  }

  closeBuilderPreview(): void {
    this.builderPreviewOpen.set(false);
  }

  publishCourseFromBuilder(): void {
    const blockers = this.validateBuilderForPublish();
    if (blockers.length) {
      this.builderPublishBlockers.set(blockers);
      return;
    }
    this.courseForm.controls.published.setValue(true);
    this.builderPublishBlockers.set(null);
    this.markBuilderDirty();
    this.courseMessage.set(this.editingCourseId() ? "Course publish status will be saved to the backend." : "Save the course to publish it to the backend.");
  }

  closePublishValidationDialog(): void {
    this.builderPublishBlockers.set(null);
  }

  selectPublishBlocker(blocker: CourseBuilderValidationBlocker): void {
    if (blocker.nodeId) this.openCourseContentPreview(blocker.nodeId);
    this.builderPublishBlockers.set(null);
  }

  private markBuilderDirty(): void {
    this.builderAutosaveState.set("dirty");
    this.builderSaveError.set(null);
    this.courseForm.markAsDirty();
    this.scheduleBuilderAutosave();
  }

  markBuilderSaved(): void {
    if (this.builderAutosaveState() === "failed") return;
    this.builderAutosaveState.set("saved");
  }

  retryBuilderAutosave(): void {
    void this.saveBuilderSnapshot();
  }

  private persistVisibleBuilderMediaState(): void {
    const node = this.activeBuilderCourseContentNode();
    if (!node) return;
    const unitType = node.controls['unitType']?.value as CourseContentUnitType;

    if (unitType === "DOCUMENT" && this.builderDocumentSource() === "slideshare") {
      const slideShareUrl = this.builderDocumentUrl().trim();
      if (slideShareUrl && this.toPresentationEmbedUrl(slideShareUrl)) {
        const settings = node.controls['settings']?.value as Record<string, unknown> | undefined;
        node.controls['settings'].setValue({ ...settings, slideShareUrl });
        this.builderDocumentUrlByNodeId.set(String(node.controls['id'].value), slideShareUrl);
      }
    }

    if (unitType === "VIDEO" && this.builderVideoSource() === "url") {
      const config = this.builderExternalVideoDraft() ?? this.parseSupportedVideoUrl(this.builderExternalVideoUrl());
      if (config) {
        node.controls['externalVideo'].setValue(config);
      }
    }
  }

  private flattenCourseContentIds(): string[] {
    const ids: string[] = [];
    const visit = (nodes: FormGroup<any>[]): void => {
      for (const node of nodes) {
        ids.push(String(node.controls['id'].value));
        visit(this.courseNodeChildren(node).controls);
      }
    };
    visit(this.curriculumControls().controls);
    return ids;
  }

  private parseSupportedVideoUrl(rawUrl: string): ExternalVideoConfig | null {
    return parseCourseBuilderExternalVideo(rawUrl);
  }

  private toSupportedVideoEmbedUrl(rawUrl: string): string | null {
    return this.parseSupportedVideoUrl(rawUrl)?.embedUrl ?? null;
  }

  private scheduleBuilderAutosave(): void {
    this.clearBuilderAutosaveTimer();
    this.builderAutosaveTimer = setTimeout(() => void this.saveBuilderSnapshot(), 800);
  }

  private clearBuilderAutosaveTimer(): void {
    if (this.builderAutosaveTimer) {
      clearTimeout(this.builderAutosaveTimer);
      this.builderAutosaveTimer = null;
    }
  }

  private async saveBuilderSnapshot(): Promise<void> {
    const revision = this.builderSaveRevision() + 1;
    this.builderSaveRevision.set(revision);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.builderAutosaveState.set("failed");
      this.builderSaveError.set("You’re offline.");
      return;
    }
    this.builderAutosaveState.set("saving");
    try {
      const savedAt = new Date();
      await this.persistBuilderSnapshot(savedAt);
      if (this.builderSaveRevision() !== revision) return;
      this.builderAutosaveState.set("saved");
      this.builderSaveError.set(null);
      this.builderLastSavedAt.set(savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch {
      if (this.builderSaveRevision() !== revision) return;
      this.builderAutosaveState.set("failed");
      this.builderSaveError.set("Save failed, retry");
    }
  }

  private async persistBuilderSnapshot(savedAt: Date): Promise<void> {
    const courseId = this.editingCourseId();
    if (courseId) {
      const saved = await this.data.updateManagedCourseContent(courseId, {
        curriculum: this.sanitizeCurriculumForBackend(this.curriculumControls().controls),
      });
      this.managedCourses.update((courses) => [saved, ...courses.filter((course) => course.id !== saved.id)]);
      this.curriculumControls().markAsPristine();
      return;
    }

    const draftPayload = this.buildManagedCourseContentDraftPayload();
    if (!draftPayload) {
      await this.persistBuilderLocalSnapshot(savedAt);
      return;
    }

    const saved = await this.data.createManagedCourseContentDraft(draftPayload);
    this.editingCourseId.set(saved.id);
    this.managedCourses.update((courses) => [saved, ...courses.filter((course) => course.id !== saved.id)]);
    this.courseForm.patchValue({
      gradeId: saved.gradeId,
      slug: saved.slug,
      title: saved.title,
      currency: saved.currency,
      price: saved.price,
      published: saved.published,
    }, { emitEvent: false });
    this.courseForm.markAsPristine();
    this.curriculumControls().markAsPristine();
    await this.router.navigate(["/tenant/lms-settings/content/courses", saved.id, "edit"], { replaceUrl: true });
  }

  private async persistBuilderLocalSnapshot(savedAt: Date): Promise<void> {
    await this.builderDevRepository.save({
      courseKey: this.builderStorageKey(),
      savedAt: savedAt.toISOString(),
      curriculum: this.serializeBuilderCurriculum(this.curriculumControls().controls),
      selectedNodeId: this.currentBuilderNodeId() ?? this.selectedCourseContentId(),
    });
  }

  private async loadBuilderDevSnapshot(): Promise<void> {
    const snapshot = await this.builderDevRepository.load(this.builderStorageKey());
    if (!snapshot?.curriculum?.length) return;
    this.curriculumControls().clear();
    (snapshot.curriculum as TenantLmsCourseCurriculumNode[]).forEach((node) => this.curriculumControls().push(this.createCurriculumGroup(node)));
    if (snapshot.selectedNodeId && this.findCourseContentNode(snapshot.selectedNodeId)) {
      this.selectedCourseContentId.set(snapshot.selectedNodeId);
    }
    this.builderLastSavedAt.set(new Date(snapshot.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }

  private builderStorageKey(): string {
    return this.editingCourseId() ?? (this.courseForm.controls.slug.value || "new-course");
  }

  private serializeBuilderCurriculum(nodes: FormGroup<any>[]): unknown[] {
    return nodes.map((node) => ({
      id: node.controls['id'].value,
      title: node.controls['title'].value,
      description: node.controls['description'].value,
      freePreview: node.controls['freePreview'].value,
      unitType: node.controls['unitType'].value,
      externalVideo: node.controls['externalVideo'].value,
      blocks: this.sanitizeBuilderBlocks(node.controls['blocks'].value),
      settings: node.controls['settings'].value,
      upload: node.controls['upload'].value,
      media: ((node.controls['media'] as FormArray<FormGroup<any>>).getRawValue() as TenantLmsCourseMedia[]),
      children: this.serializeBuilderCurriculum(this.courseNodeChildren(node).controls),
    }));
  }

  private sanitizeCurriculumForBackend(nodes: FormGroup<any>[]): TenantLmsCourseCurriculumNode[] {
    return nodes.map((node) => ({
      id: node.controls['id'].value,
      title: node.controls['title'].value,
      description: node.controls['description'].value,
      freePreview: node.controls['freePreview'].value,
      unitType: node.controls['unitType'].value,
      externalVideo: node.controls['externalVideo'].value,
      blocks: this.sanitizeBuilderBlocks(node.controls['blocks'].value) as unknown as Record<string, unknown>[],
      settings: node.controls['settings'].value,
      upload: node.controls['upload'].value,
      media: ((node.controls['media'] as FormArray<FormGroup<any>>).controls.map((media) => ({
        id: media.controls['id'].value,
        type: media.controls['type'].value,
        title: media.controls['title'].value,
        url: media.controls['url'].value,
        fileName: media.controls['fileName'].value,
        contentType: media.controls['contentType'].value,
        durationLabel: media.controls['durationLabel'].value,
      })) as TenantLmsCourseMedia[]),
      children: this.sanitizeCurriculumForBackend(this.courseNodeChildren(node).controls),
    }));
  }

  syncBuilderStateFromSelectedNode(): void {
    const node = this.activeBuilderCourseContentNode();
    if (!node) return;
    this.syncBuilderStateFromNode(node);
  }

  private syncBuilderStateFromNode(node: FormGroup<any>): void {
    const nodeId = String(node.controls['id'].value);
    const externalVideo = node.controls['externalVideo']?.value as ExternalVideoConfig | null;
    const upload = node.controls['upload']?.value as { fileName?: string; previewUrl?: string; status?: CourseMediaStatus } | null;
    const settings = node.controls['settings']?.value as Record<string, unknown> | undefined;
    const webpageUrl = typeof settings?.["webpageUrl"] === "string" ? settings["webpageUrl"] : "";
    const iframeUrl = typeof settings?.["iframeUrl"] === "string" ? settings["iframeUrl"] : "";
    const savedSlideShareUrl = typeof settings?.["slideShareUrl"] === "string" ? settings["slideShareUrl"] : "";
    const slideShareUrl = savedSlideShareUrl || this.builderDocumentUrlByNodeId.get(nodeId) || "";
    if (savedSlideShareUrl) {
      this.builderDocumentUrlByNodeId.set(nodeId, savedSlideShareUrl);
    } else if (slideShareUrl) {
      node.controls['settings'].setValue({ ...settings, slideShareUrl });
    }
    const blocks = this.sanitizeBuilderBlocks(node.controls['blocks']?.value);
    if (blocks !== node.controls['blocks']?.value) {
      node.controls['blocks'].setValue(blocks);
    }
    this.builderBlocks.set(blocks);
    this.builderExternalVideoDraft.set(externalVideo);
    this.builderExternalVideoUrl.set(externalVideo?.url ?? "");
    this.builderExternalVideoError.set(null);
    this.builderWebContentUrl.set(webpageUrl);
    this.builderWebContentError.set(null);
    this.builderWebContentPreviewActive.set(Boolean(this.normalizedWebContentUrl(webpageUrl)));
    this.builderIframeUrl.set(iframeUrl);
    this.builderIframeError.set(null);
    this.builderIframePreviewActive.set(Boolean(this.normalizedWebContentUrl(iframeUrl)));
    this.builderVideoSource.set(externalVideo ? "url" : upload ? "upload" : "none");
    this.builderAudioSource.set(node.controls['unitType']?.value === "AUDIO" && upload ? "upload" : "none");
    this.builderDocumentSource.set(
      node.controls['unitType']?.value === "DOCUMENT"
        ? upload
          ? "upload"
          : slideShareUrl
            ? "slideshare"
            : "none"
        : "none",
    );
    this.builderDocumentUrl.set(slideShareUrl);
    this.builderDocumentUrlError.set(null);
    this.builderUploadFileName.set(upload?.fileName ?? "");
    this.builderUploadPreviewUrl.set(upload?.previewUrl ?? null);
    this.builderUploadMediaStatus.set(upload?.status ?? "LOCAL_PREVIEW");
    this.builderUploadProgress.set(upload ? 100 : 0);
    this.builderUploadStatus.set(upload ? "Local preview ready. Backend upload endpoint required." : "No file selected");
    this.builderDocumentPreviewKind.set(
      node.controls['unitType']?.value === "DOCUMENT" && upload?.fileName
        ? this.documentPreviewKind(upload.fileName)
        : null,
    );
    this.builderDocumentPreviewError.set(null);
    this.builderDocumentPreviewLoading.set(false);
    if (node.controls['unitType']?.value === "DOCUMENT" && upload?.fileName && upload.previewUrl) {
      void this.restoreBuilderDocumentPreview(upload.fileName, upload.previewUrl);
    }
    this.builderSelectedBlockId.set(null);
  }

  private activeBuilderCourseContentNode(): FormGroup<any> | null {
    const currentNodeId = this.currentBuilderNodeId();
    const currentNode = currentNodeId ? this.findCourseContentNode(currentNodeId) : null;
    if (currentNode) return currentNode;
    const previewId = this.courseContentPreviewId();
    const previewNode = previewId ? this.findCourseContentNode(previewId) : null;
    return previewNode ?? this.findSelectedCourseContentNode();
  }

  private syncCourseContentSelectionFromRoute(): void {
    const previewId = this.courseContentPreviewId();
    if (previewId && this.findCourseContentNode(previewId)) {
      this.selectedCourseContentId.set(previewId);
      this.currentBuilderNodeId.set(previewId);
      return;
    }
    if (!previewId) this.currentBuilderNodeId.set(null);
  }

  private validateBuilderForPublish(): CourseBuilderValidationBlocker[] {
    const blockers: CourseBuilderValidationBlocker[] = [];
    const root = this.curriculumControls().controls;
    if (!root.length) {
      blockers.push({ id: "no-section", message: "Add at least one section." });
      return blockers;
    }
    let unitCount = 0;
    const visit = (nodes: FormGroup<any>[], sectionId?: string): void => {
      for (const node of nodes) {
        const nodeId = String(node.controls['id'].value);
        const title = this.courseNodeTitle(node).trim();
        const type = node.controls['unitType']?.value as CourseContentUnitType;
        if (!title || title === "Untitled content") {
          blockers.push({ id: `title-${nodeId}`, nodeId, message: "Every section and unit must have a valid title." });
        }
        if (sectionId) unitCount += 1;
        if (type === "VIDEO" && !node.controls['externalVideo']?.value && !node.controls['upload']?.value) {
          blockers.push({ id: `video-${nodeId}`, nodeId, message: `${title} needs a video URL, upload, or recording.` });
        }
        if (type === "AUDIO" && !node.controls['upload']?.value) {
          blockers.push({ id: `audio-${nodeId}`, nodeId, message: `${title} needs an audio upload or recording.` });
        }
        if (type === "DOCUMENT") {
          const settings = node.controls['settings']?.value as Record<string, unknown> | undefined;
          if (!node.controls['upload']?.value && !String(settings?.["slideShareUrl"] ?? "").trim()) {
            blockers.push({ id: `document-${nodeId}`, nodeId, message: `${title} needs a document upload or SlideShare URL.` });
          }
        }
        const upload = node.controls['upload']?.value as { status?: CourseMediaStatus } | null;
        if (upload?.status === "UPLOADING" || upload?.status === "PROCESSING" || upload?.status === "FAILED") {
          blockers.push({ id: `upload-${nodeId}`, nodeId, message: `${title} has an upload that is not ready.` });
        }
        const blocks = Array.isArray(node.controls['blocks']?.value) ? node.controls['blocks'].value as CourseBuilderBlock[] : [];
        for (const block of blocks) {
          if (block.type === "quiz") {
            const answers = Array.isArray(block.payload["answers"]) ? block.payload["answers"] as string[] : [];
            const correctIndex = typeof block.payload["correctIndex"] === "number" ? block.payload["correctIndex"] as number : -1;
            if (!String(block.payload["question"] ?? "").trim() || correctIndex < 0 || !answers[correctIndex]?.trim()) {
              blockers.push({ id: `quiz-${block.id}`, nodeId, message: `${title} has an invalid quiz question or missing correct answer.` });
            }
          }
        }
        visit(this.courseNodeChildren(node).controls, nodeId);
      }
    };
    visit(root);
    if (!unitCount) blockers.push({ id: "no-unit", message: "Add at least one unit inside a section." });
    return blockers;
  }

  private cloneCourseContentFormGroup(node: FormGroup<any>): FormGroup<any> {
    const raw = node.getRawValue();
    const cloned = {
      ...raw,
      id: createCourseContentId(),
      title: `${this.courseNodeTitle(node)} copy`,
      children: this.cloneRawCourseContent(raw.children ?? []),
    } as TenantLmsCourseCurriculumNode;
    return this.createCurriculumGroup(cloned);
  }

  private cloneRawCourseContent(nodes: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
    return nodes.map((node) => ({
      ...node,
      id: createCourseContentId(),
      children: this.cloneRawCourseContent((node["children"] as Array<Record<string, unknown>>) ?? []),
    }));
  }

  private insertCloneAfterNode(nodes: FormArray<FormGroup<any>>, nodeId: string, clone: FormGroup<any>): boolean {
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes.at(index);
      if (String(node.controls['id'].value) === nodeId) {
        nodes.insert(index + 1, clone);
        return true;
      }
      if (this.insertCloneAfterNode(this.courseNodeChildren(node), nodeId, clone)) return true;
    }
    return false;
  }

  private formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
    return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }

  private clearBuilderRecordingTimer(): void {
    if (this.builderRecordingTimer) {
      clearInterval(this.builderRecordingTimer);
      this.builderRecordingTimer = null;
    }
  }

  private stopAllBuilderMediaTracks(): void {
    this.builderMediaStream()?.getTracks().forEach((track) => track.stop());
    this.builderMediaStream.set(null);
    this.builderMediaRecorder = null;
    this.clearBuilderRecordingTimer();
  }

  private revokeBuilderObjectUrls(): void {
    this.destroyBuilderDocumentPreview();
    this.revokeBuilderUploadPreviewUrl();
    this.revokeBuilderRecordedPreviewUrl();
  }

  private revokeBuilderUploadPreviewUrl(): void {
    const previewUrl = this.builderUploadPreviewUrl();
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    this.builderUploadPreviewUrl.set(null);
  }

  private revokeBuilderRecordedPreviewUrl(): void {
    const previewUrl = this.builderRecordedPreviewUrl();
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    this.builderRecordedPreviewUrl.set(null);
  }

  courseContentNodeModalTitle(modal: CourseContentNodeModalState): string {
    if (modal.mode === "edit") {
      return `Edit ${this.courseContentNodeName().trim() || "content item"}`;
    }
    return `Add sub under ${this.courseContentParentTitle(modal)}`;
  }

  openAddCourseContentNode(parentId: string, unitType: CourseContentUnitType = "CONTENT"): void {
    if (parentId !== "content-root" && !this.findCourseContentNode(parentId)) return;
    this.closeBuilderAddMenu();
    this.courseContentNodeName.set("");
    this.courseContentNodeDescription.set("");
    this.courseContentNodeUnitType.set(parentId === "content-root" ? "SECTION" : unitType);
    this.courseContentNodeModal.set({
      mode: "add",
      parentId,
      sectionIndex: null,
      lessonIndex: null,
      subItemIndex: null,
    });
  }

  openEditCourseContentNodeById(nodeId: string): void {
    const node = this.findCourseContentNode(nodeId);
    if (!node) return;
    this.courseContentNodeName.set(String(node.controls['title'].value || ""));
    this.courseContentNodeDescription.set(String(node.controls['description'].value || ""));
    this.courseContentNodeModal.set({
      mode: "edit",
      parentId: nodeId,
      sectionIndex: null,
      lessonIndex: null,
      subItemIndex: null,
    });
  }

  openEditCourseContentNode(sectionIndex: number, lessonIndex: number | null): void {
    const node = lessonIndex === null ? this.curriculumControls().at(sectionIndex) : this.childControls(sectionIndex).at(lessonIndex);
    if (!node) return;
    this.courseContentNodeName.set(String(node.controls['title'].value || ""));
    this.courseContentNodeDescription.set(String(node.controls['description'].value || ""));
    this.courseContentNodeModal.set({
      mode: "edit",
      parentId: String(node.controls['id'].value),
      sectionIndex,
      lessonIndex,
      subItemIndex: null,
    });
  }

  openEditCourseSubItemNode(sectionIndex: number, lessonIndex: number, subItemIndex: number): void {
    const node = this.grandChildControls(sectionIndex, lessonIndex).at(subItemIndex);
    if (!node) return;
    this.courseContentNodeName.set(String(node.controls['title'].value || ""));
    this.courseContentNodeDescription.set(String(node.controls['description'].value || ""));
    this.courseContentNodeModal.set({
      mode: "edit",
      parentId: String(node.controls['id'].value),
      sectionIndex,
      lessonIndex,
      subItemIndex,
    });
  }

  closeCourseContentNodeModal(): void {
    this.courseContentNodeModal.set(null);
    this.courseContentNodeName.set("");
    this.courseContentNodeDescription.set("");
    this.courseContentNodeUnitType.set("CONTENT");
  }

  saveCourseContentNodeModal(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const modal = this.courseContentNodeModal();
    const name = this.courseContentNodeName().trim();
    if (!modal || !name) return;
    const description = this.courseContentNodeDescription().trim();
    if (modal.mode === "edit") {
      const node = this.findCourseContentNode(modal.parentId);
      if (!node) return;
      node.patchValue({ title: name, description });
      this.closeCourseContentNodeModal();
      this.markBuilderDirty();
      return;
    }

    const group = this.createCurriculumGroup({ id: createCourseContentId(), title: name, description, freePreview: false, media: [], children: [] } as TenantLmsCourseCurriculumNode);
    group.controls['unitType'].setValue(this.courseContentNodeUnitType());
    if (modal.parentId === "content-root") {
      this.curriculumControls().push(group);
    } else {
      const parent = this.findCourseContentNode(modal.parentId);
      if (!parent) return;
      this.courseNodeChildren(parent).push(group);
    }
    const expanded = new Set(this.expandedCourseContentIds());
    expanded.add(modal.parentId);
    this.expandedCourseContentIds.set(expanded);
    this.closeCourseContentNodeModal();
    this.selectedCourseContentId.set(modal.parentId);
    this.markBuilderDirty();
  }

  removeCourseContentNode(nodeId: string): void {
    this.builderPendingDeleteNodeId.set(nodeId);
  }

  confirmRemoveCourseContentNode(): void {
    const nodeId = this.builderPendingDeleteNodeId();
    if (!nodeId) return;
    const activePreviewId = this.activeCourseContentPreviewId();
    const node = this.findCourseContentNode(nodeId);
    const redirectAfterDelete =
      activePreviewId && node && (activePreviewId === nodeId || this.courseContentNodeContainsId(node, activePreviewId))
        ? this.findCourseContentParentId(nodeId)
        : null;
    const removed = this.removeCourseContentNodeFromArray(this.curriculumControls(), nodeId);
    if (!removed) {
      this.builderPendingDeleteNodeId.set(null);
      return;
    }
    const expanded = new Set(this.expandedCourseContentIds());
    expanded.delete(nodeId);
    this.expandedCourseContentIds.set(expanded);
    this.ensureSelectedCourseContentInRange();
    if (redirectAfterDelete && redirectAfterDelete !== "content-root" && this.findCourseContentNode(redirectAfterDelete)) {
      this.openCourseContentPreview(redirectAfterDelete);
    } else if (this.activeCourseContentPreviewId() === nodeId || (activePreviewId && !this.findCourseContentNode(activePreviewId))) {
      this.closeCourseContentPreview();
    }
    this.builderPendingDeleteNodeId.set(null);
    this.markBuilderDirty();
  }

  cancelRemoveCourseContentNode(): void {
    this.builderPendingDeleteNodeId.set(null);
  }

  removeCourseSubItem(sectionIndex: number, lessonIndex: number, subItemIndex: number): void {
    this.grandChildControls(sectionIndex, lessonIndex).removeAt(subItemIndex);
    this.ensureSelectedCourseContentInRange();
  }

  private resolveCourseContentParent(parentId: string): { sectionIndex: number | null; lessonIndex: number | null } | null {
    if (parentId === "content-root") {
      return { sectionIndex: null, lessonIndex: null };
    }
    const sections = this.curriculumControls();
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
      if (sections.at(sectionIndex).controls['id'].value === parentId) {
        return { sectionIndex, lessonIndex: null };
      }
      const lessons = this.childControls(sectionIndex);
      for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex += 1) {
        if (lessons.at(lessonIndex).controls['id'].value === parentId) {
          return { sectionIndex, lessonIndex };
        }
      }
    }
    return null;
  }

  private courseContentParentTitle(modal: CourseContentNodeModalState): string {
    if (modal.parentId === "content-root") {
      return "Course";
    }
    const node = this.findCourseContentNode(modal.parentId);
    return node ? this.courseNodeTitle(node) : "Course";
  }

  private findSelectedCourseContentNode(): FormGroup<any> | null {
    return this.findCourseContentNode(this.selectedCourseContentId());
  }

  private findCourseContentNode(nodeId: string): FormGroup<any> | null {
    if (nodeId === "content-root") return null;
    return this.findCourseContentNodeInArray(this.curriculumControls(), nodeId);
  }

  private findCourseContentNodeInArray(nodes: FormArray<FormGroup<any>>, nodeId: string): FormGroup<any> | null {
    for (const node of nodes.controls) {
      if (node.controls['id'].value === nodeId) return node;
      const found = this.findCourseContentNodeInArray(this.courseNodeChildren(node), nodeId);
      if (found) return found;
    }
    return null;
  }

  private findCourseContentParentId(nodeId: string): string | null {
    return this.findCourseContentParentIdInArray(this.curriculumControls(), nodeId, "content-root");
  }

  private findCourseContentParentIdInArray(nodes: FormArray<FormGroup<any>>, nodeId: string, parentId: string): string | null {
    for (const node of nodes.controls) {
      const currentId = String(node.controls['id'].value);
      if (currentId === nodeId) return parentId;
      const found = this.findCourseContentParentIdInArray(this.courseNodeChildren(node), nodeId, currentId);
      if (found) return found;
    }
    return null;
  }

  private courseContentNodeContainsId(node: FormGroup<any>, nodeId: string): boolean {
    return this.findCourseContentNodeInArray(this.courseNodeChildren(node), nodeId) !== null;
  }

  private removeCourseContentNodeFromArray(nodes: FormArray<FormGroup<any>>, nodeId: string): boolean {
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes.at(index);
      if (node.controls['id'].value === nodeId) {
        nodes.removeAt(index);
        return true;
      }
      if (this.removeCourseContentNodeFromArray(this.courseNodeChildren(node), nodeId)) {
        return true;
      }
    }
    return false;
  }

  focusCourseNode(node: FormGroup<any>): void {
    node.markAsTouched();
  }

  private ensureSelectedCourseContentInRange(): void {
    if (this.selectedCourseContentId() === "content-root") return;
    if (!this.findSelectedCourseContentNode()) {
      this.selectedCourseContentId.set("content-root");
    }
  }

  courseContentSummary(): string {
    const sections = this.curriculumControls().length;
    let lessons = 0;
    let media = 0;
    for (let sectionIndex = 0; sectionIndex < sections; sectionIndex += 1) {
      const lessonControls = this.childControls(sectionIndex);
      lessons += this.countCourseContentDescendants(lessonControls);
      for (let lessonIndex = 0; lessonIndex < lessonControls.length; lessonIndex += 1) {
        media += this.mediaControls(sectionIndex, lessonIndex).length;
      }
    }
    return `${sections} sections · ${lessons} lessons · ${media} media`;
  }

  private countCourseContentDescendants(nodes: FormArray<FormGroup<any>>): number {
    let count = 0;
    for (const node of nodes.controls) {
      count += 1;
      count += this.countCourseContentDescendants(node.controls['children'] as FormArray<FormGroup<any>>);
    }
    return count;
  }

  addTextItem(kind: "learningOutcomes" | "features"): void { this.courseForm.controls[kind].push(this.fb.nonNullable.control("", Validators.required)); }
  removeTextItem(kind: "learningOutcomes" | "features", index: number): void { this.courseForm.controls[kind].removeAt(index); }
  addCurriculumSection(): void {
    const group = this.createCurriculumGroup({ id: createCourseContentId(), title: "", description: "", freePreview: false, media: [], children: [] });
    this.curriculumControls().push(group);
    this.selectedCourseContentId.set("content-root");
    this.markBuilderDirty();
  }
  removeCurriculumSection(index: number): void { this.curriculumControls().removeAt(index); this.ensureSelectedCourseContentInRange(); this.markBuilderDirty(); }
  addCurriculumLesson(sectionIndex: number): void {
    const group = this.createCurriculumGroup({ id: createCourseContentId(), title: "", description: "", freePreview: false, media: [], children: [] });
    this.childControls(sectionIndex).push(group);
    this.selectCourseSection(sectionIndex);
    this.markBuilderDirty();
  }
  removeCurriculumLesson(sectionIndex: number, lessonIndex: number): void { this.childControls(sectionIndex).removeAt(lessonIndex); this.ensureSelectedCourseContentInRange(); this.markBuilderDirty(); }
  addLessonMedia(sectionIndex: number, lessonIndex: number): void {
    this.mediaControls(sectionIndex, lessonIndex).push(this.createMediaGroup({ id: createCourseContentId(), type: "VIDEO", title: "", url: "", fileName: "", contentType: "", durationLabel: "" }));
    this.selectCourseLesson(sectionIndex, lessonIndex);
    this.markBuilderDirty();
  }
  removeLessonMedia(sectionIndex: number, lessonIndex: number, mediaIndex: number): void { this.mediaControls(sectionIndex, lessonIndex).removeAt(mediaIndex); this.markBuilderDirty(); }

  async uploadLearnerAvatar(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.learnerAvatarUploading.set(true);
    this.contentUsersError.set(null);
    try {
      const uploaded = await firstValueFrom(this.userCreateData.uploadUserAvatar(file));
      this.learnerForm.controls.avatarUrl.setValue(uploaded.url);
      this.learnerForm.controls.avatarUrl.markAsDirty();
    } catch {
      this.contentUsersError.set("The learner image could not be uploaded.");
    } finally {
      this.learnerAvatarUploading.set(false);
      input.value = "";
    }
  }

  async uploadCourseAsset(event: Event, target: "thumbnail" | "preview"): Promise<void> {
    const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
    this.courseUploading.set(true); this.courseError.set(null);
    try { const uploaded = await this.data.uploadManagedCourseMedia(file); if (target === "thumbnail") this.courseForm.controls.thumbnailUrl.setValue(uploaded.url); else { this.courseForm.controls.previewMediaUrl.setValue(uploaded.url); this.courseForm.controls.previewMediaType.setValue(uploaded.mediaType === "VIDEO" || uploaded.mediaType === "IMAGE" || uploaded.mediaType === "AUDIO" ? uploaded.mediaType : "NONE"); } }
    catch { this.courseError.set("The course asset could not be uploaded."); }
    finally { this.courseUploading.set(false); input.value = ""; }
  }

  async uploadLessonMedia(sectionIndex: number, lessonIndex: number, mediaIndex: number, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
    this.courseUploading.set(true); this.courseError.set(null);
    try { const uploaded = await this.data.uploadManagedCourseMedia(file); this.mediaControls(sectionIndex, lessonIndex).at(mediaIndex).patchValue({ type: uploaded.mediaType, url: uploaded.url, fileName: uploaded.fileName, contentType: uploaded.contentType, title: this.mediaControls(sectionIndex, lessonIndex).at(mediaIndex).controls['title'].value || file.name }); this.markBuilderDirty(); }
    catch { this.courseError.set("The lesson media could not be uploaded."); }
    finally { this.courseUploading.set(false); input.value = ""; }
  }

  async saveManagedCourse(): Promise<void> {
    if (this.courseForm.invalid || this.courseSaving()) { this.courseForm.markAllAsTouched(); this.courseError.set("Complete the course title, route slug, and grade before saving."); return; }
    this.courseSaving.set(true); this.courseError.set(null); this.courseMessage.set(null);
    try {
      const saved = this.editingCourseId() ? await this.data.updateManagedCourse(this.editingCourseId()!, this.buildManagedCoursePayload()) : await this.data.createManagedCourse(this.buildManagedCoursePayload());
      this.managedCourses.update((courses) => [saved, ...courses.filter((course) => course.id !== saved.id)]);
      this.courseMessage.set("Course saved successfully.");
      await this.router.navigate(["/tenant/lms-settings/content/courses"]);
    } catch (error: any) { this.courseError.set(error?.error?.message || "Unable to save this course."); }
    finally { this.courseSaving.set(false); }
  }

  private buildManagedCoursePayload(): SaveManagedCourseRequest {
    const raw = this.courseForm.getRawValue();
    return {
      ...raw,
      curriculum: this.sanitizeCurriculumForBackend(this.curriculumControls().controls),
      subtitle: raw.subtitle || null,
      description: raw.description || null,
      thumbnailUrl: raw.thumbnailUrl || null,
      previewMediaUrl: raw.previewMediaUrl || null,
      oldPrice: raw.oldPrice || null,
      durationLabel: raw.durationLabel || null,
      studentsLabel: raw.studentsLabel || null,
      ratingLabel: raw.ratingLabel || null,
    } as SaveManagedCourseRequest;
  }

  private buildManagedCourseContentDraftPayload(): SaveManagedCourseRequest | null {
    const raw = this.courseForm.getRawValue();
    const gradeId = raw.gradeId || this.tenantGrades()[0]?.id;
    if (!gradeId) {
      this.builderSaveError.set("Add a tenant grade before backend draft save.");
      return null;
    }
    const slug = raw.slug && /^[a-z0-9-]+$/.test(raw.slug)
      ? raw.slug
      : this.nextCourseDraftSlug();
    return {
      gradeId,
      slug,
      title: raw.title?.trim() || "Untitled course",
      subtitle: raw.subtitle || null,
      description: raw.description || null,
      thumbnailUrl: raw.thumbnailUrl || null,
      previewMediaUrl: raw.previewMediaUrl || null,
      previewMediaType: raw.previewMediaType || "NONE",
      price: raw.price ?? 0,
      oldPrice: raw.oldPrice || null,
      currency: raw.currency || "EGP",
      durationLabel: raw.durationLabel || null,
      studentsLabel: raw.studentsLabel || null,
      ratingLabel: raw.ratingLabel || null,
      published: false,
      learningOutcomes: this.learningOutcomeControls().getRawValue(),
      features: this.featureControls().getRawValue(),
      curriculum: this.sanitizeCurriculumForBackend(this.curriculumControls().controls),
    } as SaveManagedCourseRequest;
  }

  private nextCourseDraftSlug(): string {
    const existing = new Set(this.managedCourses().map((course) => course.slug));
    let slug = `course-draft-${Date.now().toString(36)}`;
    while (existing.has(slug)) {
      slug = `course-draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return slug;
  }

  async deleteManagedCourse(): Promise<void> {
    const id = this.editingCourseId(); if (!id || !globalThis.confirm?.("Delete this course and all of its saved content?")) return;
    this.courseSaving.set(true); this.courseError.set(null);
    try { await this.data.deleteManagedCourse(id); this.managedCourses.update((courses) => courses.filter((course) => course.id !== id)); this.ensureCoursePageInRange(); this.startNewCourse(); await this.router.navigate(["/tenant/lms-settings/content/courses"]); }
    catch { this.courseError.set("Unable to delete this course."); }
    finally { this.courseSaving.set(false); }
  }

  openCourseDeleteDialog(course: TenantLmsCourse): void {
    if (this.courseSaving()) {
      return;
    }
    this.pendingDeleteCourse.set(course);
  }

  closeCourseDeleteDialog(): void {
    if (this.courseSaving()) {
      return;
    }
    this.pendingDeleteCourse.set(null);
  }

  async confirmDeleteManagedCourseFromList(): Promise<void> {
    const course = this.pendingDeleteCourse();
    if (!course || this.courseSaving()) {
      return;
    }
    this.courseSaving.set(true);
    this.courseError.set(null);
    this.courseMessage.set(null);
    try {
      await this.data.deleteManagedCourse(course.id);
      this.managedCourses.update((courses) => courses.filter((item) => item.id !== course.id));
      this.ensureCoursePageInRange();
      this.pendingDeleteCourse.set(null);
      this.courseMessage.set("Course deleted successfully.");
    } catch {
      this.courseError.set("Unable to delete this course.");
    } finally {
      this.courseSaving.set(false);
    }
  }

  async cloneManagedCourse(course: TenantLmsCourse): Promise<void> {
    if (this.courseSaving()) {
      return;
    }
    this.courseSaving.set(true);
    this.courseError.set(null);
    this.courseMessage.set(null);
    try {
      const payload: SaveManagedCourseRequest = {
        gradeId: course.gradeId,
        slug: this.nextCourseCloneSlug(course.slug),
        title: `${course.title} copy`,
        subtitle: course.subtitle,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        previewMediaUrl: course.previewMediaUrl,
        previewMediaType: course.previewMediaType,
        price: course.price,
        oldPrice: course.oldPrice,
        currency: course.currency,
        durationLabel: course.durationLabel,
        studentsLabel: course.studentsLabel,
        ratingLabel: course.ratingLabel,
        published: false,
        learningOutcomes: [...course.learningOutcomes],
        features: [...course.features],
        curriculum: this.cloneCourseCurriculum(course.curriculum),
      };
      const cloned = await this.data.createManagedCourse(payload);
      this.managedCourses.update((courses) => [cloned, ...courses]);
      this.coursePage.set(1);
      this.courseMessage.set("Course cloned as a draft.");
    } catch {
      this.courseError.set("Unable to clone this course.");
    } finally {
      this.courseSaving.set(false);
    }
  }

  private nextCourseCloneSlug(slug: string): string {
    const base = `${slug.replace(/-copy(?:-\d+)?$/, "")}-copy`;
    const existing = new Set(this.managedCourses().map((course) => course.slug));
    if (!existing.has(base)) {
      return base;
    }
    let index = 2;
    while (existing.has(`${base}-${index}`)) {
      index += 1;
    }
    return `${base}-${index}`;
  }

  private cloneCourseCurriculum(nodes: TenantLmsCourseCurriculumNode[]): TenantLmsCourseCurriculumNode[] {
    return nodes.map((node) => ({
      ...node,
      id: createCourseContentId(),
      media: node.media.map((media) => ({ ...media, id: createCourseContentId() })),
      children: this.cloneCourseCurriculum(node.children),
    }));
  }

  private createCurriculumGroup(node: TenantLmsCourseCurriculumNode): FormGroup<any> {
    const extended = node as TenantLmsCourseCurriculumNode & {
      unitType?: CourseContentUnitType;
      blocks?: CourseBuilderBlock[];
      settings?: Record<string, unknown>;
      externalVideo?: ExternalVideoConfig | null;
      upload?: Record<string, unknown>;
    };
    return this.fb.nonNullable.group({
      id: [node.id || createCourseContentId()],
      title: [node.title, Validators.required],
      description: [node.description ?? ""],
      freePreview: [node.freePreview],
      unitType: [extended.unitType ?? "CONTENT"],
      externalVideo: [extended.externalVideo ?? null],
      blocks: [this.sanitizeBuilderBlocks(extended.blocks)],
      settings: [extended.settings ?? { required: true, allowDownload: false, estimatedDuration: "", completionRule: "OPENED" }],
      upload: [extended.upload ?? null],
      media: this.fb.array((node.media ?? []).map((item) => this.createMediaGroup(item))),
      children: this.fb.array((node.children ?? []).map((item) => this.createCurriculumGroup(item))),
    });
  }
  private createMediaGroup(media: TenantLmsCourseMedia): FormGroup<any> {
    return this.fb.nonNullable.group({ id: [media.id || createCourseContentId()], type: [media.type, Validators.required], title: [media.title, Validators.required], url: [media.url, Validators.required], fileName: [media.fileName ?? ""], contentType: [media.contentType ?? ""], durationLabel: [media.durationLabel ?? ""] });
  }

  async onNavigationVisibilityChange(index: number, enabled: boolean): Promise<void> {
    const navigationItem = this.form.controls.navigation.at(index);
    if (!navigationItem) {
      return;
    }
    navigationItem.controls.enabled.setValue(enabled, { emitEvent: false });
    await this.onNavbarContentChange(
      enabled ? "Navigation link is visible." : "Navigation link is hidden.",
    );
  }

  onNavbarContentChange(successMessage = "Navbar changes published."): Promise<void> {
    const queuedSave = this.navbarSaveQueue.then(() => this.save(successMessage, true));
    this.navbarSaveQueue = queuedSave.catch(() => undefined);
    return queuedSave;
  }

  rememberHeroUploadScroll(event: Event): void {
    const input = event.currentTarget as HTMLElement;
    this.heroUploadScrollContainer = input.closest("main") as HTMLElement | null;
    this.heroUploadScrollTop = this.heroUploadScrollContainer?.scrollTop ?? 0;
  }

  async onHeroImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.uploadingHeroImage()) {
      this.restoreHeroUploadScroll();
      return;
    }
    if (!file.type.startsWith("image/")) {
      this.heroImageUploadError.set("Choose a PNG, JPG, or WebP image.");
      input.value = "";
      input.blur();
      this.restoreHeroUploadScroll();
      return;
    }
    this.uploadingHeroImage.set(true);
    this.heroImageUploadError.set(null);
    this.saveMessage.set(null);
    try {
      const uploaded = await this.data.uploadHeroImage(file);
      this.form.controls.hero.controls.imageUrl.setValue(uploaded.url);
      this.form.controls.hero.controls.imageUrl.markAsDirty();
      this.saveMessage.set("Image uploaded. Select Save changes to publish it.");
    } catch {
      this.heroImageUploadError.set("The image could not be uploaded. Try another file.");
    } finally {
      this.uploadingHeroImage.set(false);
      input.value = "";
      input.blur();
      this.restoreHeroUploadScroll();
    }
  }

  async onAboutImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.uploadingAboutImage()) {
      this.restoreHeroUploadScroll();
      return;
    }
    if (!file.type.startsWith("image/")) {
      this.aboutImageUploadError.set("Choose a PNG, JPG, or WebP image.");
      input.value = "";
      input.blur();
      this.restoreHeroUploadScroll();
      return;
    }
    this.uploadingAboutImage.set(true);
    this.aboutImageUploadError.set(null);
    this.saveMessage.set(null);
    try {
      const uploaded = await this.data.uploadAboutTeacherImage(file);
      this.form.controls.aboutTeacher.controls.imageUrl.setValue(uploaded.url);
      this.form.controls.aboutTeacher.controls.imageUrl.markAsDirty();
      this.saveMessage.set("Image uploaded. Select Save changes to publish it.");
    } catch {
      this.aboutImageUploadError.set("The image could not be uploaded. Try another file.");
    } finally {
      this.uploadingAboutImage.set(false);
      input.value = "";
      input.blur();
      this.restoreHeroUploadScroll();
    }
  }

  addCourse(): void {
    if (this.form.controls.courses.controls.items.length >= 24) return;
    this.form.controls.courses.controls.items.push(this.createCourseGroup({
      courseId: "", gradeId: "", imageUrl: "", imageAlt: "صورة الكورس", symbol: "", level: "",
      title: "كورس جديد", lessonsLabel: "◷ 0 حصة", ratingLabel: "★ 5.0", price: "0 ج",
      oldPrice: "", actionLabel: "التفاصيل", route: "/courses",
    }));
    this.form.markAsDirty();
    this.homepageCourseCardPage.set(this.homepageCourseCardPageCount());
    this.expandedHomepageCourseCardIndex.set(null);
  }

  removeCourse(index: number): void {
    this.form.controls.courses.controls.items.removeAt(index);
    this.courseImageUploadErrors.set({});
    this.homepageCourseCardPage.set(Math.min(this.homepageCourseCardPage(), this.homepageCourseCardPageCount()));
    this.expandedHomepageCourseCardIndex.set(null);
    this.form.markAsDirty();
  }

  coursePreviewUrl(index: number): string {
    return this.resolveAssetUrl(this.form.controls.courses.controls.items.at(index)?.controls.imageUrl.value);
  }

  async selectHomepageCourseGrade(index: number, event: Event): Promise<void> {
    const gradeId = (event.target as HTMLSelectElement).value;
    const item = this.form.controls.courses.controls.items.at(index);
    if (!item) return;
    const grade = this.tenantGrades().find((candidate) => candidate.id === gradeId);
    const selectedCourse = this.managedCourses().find((course) => course.id === item.controls.courseId.value);
    item.patchValue({
      gradeId,
      level: grade ? grade.name : "",
      courseId: selectedCourse?.gradeId === gradeId ? selectedCourse.id : "",
    });
    this.markHomepageCourseCardChanged(item);
    this.saveMessage.set(null);
    await this.saveHomepageCourseCardChange();
  }

  async selectHomepageCourse(index: number, event: Event): Promise<void> {
    const courseId = (event.target as HTMLSelectElement).value;
    const item = this.form.controls.courses.controls.items.at(index);
    if (!item) return;
    const course = this.managedCourses().find((candidate) => candidate.id === courseId);
    if (!course) {
      item.controls.courseId.setValue("");
      this.markHomepageCourseCardChanged(item);
      this.saveMessage.set(null);
      await this.saveHomepageCourseCardChange();
      return;
    }
    const lessonCount = this.courseLessonCount(course);
    item.patchValue({
      courseId: course.id,
      gradeId: course.gradeId,
      imageUrl: course.thumbnailUrl ?? "",
      imageAlt: course.title,
      level: course.gradeName,
      title: course.title,
      lessonsLabel: `◷ ${lessonCount} حصة`,
      ratingLabel: course.ratingLabel ? `★ ${course.ratingLabel.replace(/^★\s*/, "")}` : "",
      price: this.formatHomepageCoursePrice(course.price, course.currency),
      oldPrice: course.oldPrice == null ? "" : this.formatHomepageCoursePrice(course.oldPrice, course.currency),
      route: `/courses/${course.slug}`,
    });
    this.markHomepageCourseCardChanged(item);
    this.saveMessage.set(null);
    await this.saveHomepageCourseCardChange();
  }

  private markHomepageCourseCardChanged(item: ReturnType<TenantLmsSettingsComponent["createCourseGroup"]>): void {
    item.markAsDirty();
    item.controls.courseId.markAsDirty();
    item.controls.gradeId.markAsDirty();
    this.form.controls.courses.markAsDirty();
    this.form.markAsDirty();
    this.form.updateValueAndValidity();
  }

  private saveHomepageCourseCardChange(): Promise<void> {
    const queuedSave = this.homepageCourseCardSaveQueue.then(() => this.save("Course card relation saved.", true, true));
    this.homepageCourseCardSaveQueue = queuedSave.catch(() => undefined);
    return queuedSave;
  }

  private formatHomepageCoursePrice(value: number, currency: string): string {
    const currencyLabel = currency.toUpperCase() === "EGP" ? "ج" : currency.toUpperCase();
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} ${currencyLabel}`;
  }

  courseImageUploadError(index: number): string | null {
    return this.courseImageUploadErrors()[index] ?? null;
  }

  async onCourseThumbnailSelected(index: number, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.uploadingCourseIndex() !== null) return;
    if (!file.type.startsWith("image/")) {
      this.courseImageUploadErrors.update((errors) => ({ ...errors, [index]: "Choose a PNG, JPG, or WebP image." }));
      input.value = "";
      return;
    }
    this.uploadingCourseIndex.set(index);
    this.courseImageUploadErrors.update((errors) => { const next = { ...errors }; delete next[index]; return next; });
    try {
      const uploaded = await this.data.uploadCourseThumbnail(file);
      const control = this.form.controls.courses.controls.items.at(index)?.controls.imageUrl;
      control?.setValue(uploaded.url);
      control?.markAsDirty();
      this.saveMessage.set("Thumbnail uploaded. Select Save changes to publish it.");
    } catch {
      this.courseImageUploadErrors.update((errors) => ({ ...errors, [index]: "The thumbnail could not be uploaded. Try another file." }));
    } finally {
      this.uploadingCourseIndex.set(null);
      input.value = "";
      this.restoreHeroUploadScroll();
    }
  }

  private createCourseGroup(item: TenantLmsCourseItem) {
    return this.fb.nonNullable.group({
      courseId: [item.courseId ?? ""],
      gradeId: [item.gradeId ?? ""],
      imageUrl: [item.imageUrl], imageAlt: [item.imageAlt, Validators.required],
      symbol: [item.symbol ?? ""], level: [item.level, Validators.required],
      title: [item.title, Validators.required], lessonsLabel: [item.lessonsLabel, Validators.required],
      ratingLabel: [item.ratingLabel, Validators.required], price: [item.price, Validators.required],
      oldPrice: [item.oldPrice], actionLabel: [item.actionLabel, Validators.required], route: [item.route, Validators.required],
    });
  }

  private restoreHeroUploadScroll(): void {
    const container = this.heroUploadScrollContainer;
    const scrollTop = this.heroUploadScrollTop;
    globalThis.requestAnimationFrame?.(() => {
      if (container) {
        container.scrollTop = scrollTop;
      }
    });
  }

  async save(
    successMessage = "LMS website settings saved.",
    preserveForm = false,
    allowInvalidForm = false,
  ): Promise<void> {
    if ((!allowInvalidForm && this.form.invalid) || this.saving() || !this.settings()?.lmsEnabled) {
      if (!allowInvalidForm) {
        this.form.markAllAsTouched();
      }
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    this.saveMessage.set(null);
    try {
      const value = this.form.getRawValue();
      const {
        navigation,
        primaryCtaRoute,
        secondaryCtaRoute,
        logoImageUrl,
        ...settingsValue
      } = value;
      const payload: SaveTenantLmsSettingsRequest = {
        ...settingsValue,
        portraitImageUrl: value.portraitImageUrl || null,
        sections: this.sections(),
        navbar: {
          logoImageUrl: logoImageUrl || null,
          navigation,
          primaryButtonRoute: primaryCtaRoute,
          secondaryButtonRoute: secondaryCtaRoute,
        },
      };
      const settings = await this.data.saveSettings(payload);
      if (preserveForm) {
        this.settings.set({
          ...settings,
          lmsEnabled: settings.lmsEnabled || this.hasLmsFromIdentity(),
        });
      } else {
        this.applySettings(settings);
      }
      this.saveMessage.set(successMessage);
    } catch {
      this.saveError.set("Unable to save LMS settings.");
    } finally {
      this.saving.set(false);
    }
  }

  selectedTemplateName(): string {
    const selected = this.form.controls.selectedTemplateKey.value;
    return (
      this.settings()?.templates.find((template) => template.key === selected)
        ?.name ?? selected
    );
  }

  async createWebsiteDomain(): Promise<void> {
    if (!this.settings()?.lmsEnabled || this.saving()) {
      return;
    }
    this.form.controls.websiteEnabled.setValue(true);
    await this.save("LMS website domain is active.");
  }

  openWebsite(): void {
    const url = this.previewUrl();
    if (url === "#") {
      return;
    }
    window.open(url, "_blank", "noopener");
  }

  previewUrl(): string {
    const settings = this.settings();
    if (!settings) {
      return "#";
    }
    if (this.isLocalHost()) {
      return `http://${settings.tenantSlug}-lms.local.az-edumanage.test:4400/?tenant=${encodeURIComponent(settings.tenantSlug)}`;
    }
    return this.productionWebsiteUrl(settings);
  }

  displayWebsiteUrl(): string {
    const settings = this.settings();
    if (!settings) {
      return "";
    }
    if (this.isLocalHost()) {
      return this.previewUrl();
    }
    return this.productionWebsiteUrl(settings);
  }

  private isLocalHost(): boolean {
    const hostname = globalThis.location?.hostname ?? "";
    return (
      hostname === "localhost" || hostname.endsWith(".local.az-edumanage.test")
    );
  }

  private productionWebsiteUrl(settings: TenantLmsSettingsView): string {
    if (settings.websiteUrl?.trim()) {
      return settings.websiteUrl.trim();
    }
    const host =
      settings.websiteHost?.trim() ||
      this.derivedWebsiteHost(settings.tenantSlug);
    return `https://${host}`;
  }

  private derivedWebsiteHost(slug: string): string {
    const hostname = globalThis.location?.hostname ?? "";
    if (hostname.endsWith(".local.az-edumanage.test")) {
      return `${slug}-lms.local.az-edumanage.test`;
    }
    const parts = hostname.split(".");
    const root =
      parts.length > 2 ? parts.slice(1).join(".") : "az-edumanage.com";
    return `${slug}-lms.${root}`;
  }

  resolveAssetUrl(value: string | null | undefined): string {
    const url = value?.trim();
    if (!url) {
      return "";
    }
    if (/^(https?:|data:|blob:)/i.test(url)) {
      return url;
    }
    if (url.startsWith("/api/v1/")) {
      return `${environment.apiBaseUrl.replace(/\/api\/v1\/?$/, "")}${url}`;
    }
    return url;
  }

  private applySettings(settings: TenantLmsSettingsView): void {
    const navbar = settings.navbar ?? {
      logoImageUrl: null,
      navigation: DEFAULT_NAVIGATION.map((item) => ({ ...item })),
      primaryButtonRoute: "/pricing",
      secondaryButtonRoute: "/login",
    };
    const navigationByKey = new Map(navbar.navigation.map((item) => [item.key, item]));
    const navigation = DEFAULT_NAVIGATION.map((defaultItem) => ({
      ...defaultItem,
      ...navigationByKey.get(defaultItem.key),
      key: defaultItem.key,
    }));
    this.settings.set({
      ...settings,
      lmsEnabled: settings.lmsEnabled || this.hasLmsFromIdentity(),
    });
    this.sections.set(
      Object.fromEntries(
        this.sectionDefinitions.map((section) => [section.key, settings.sections?.[section.key] !== false]),
      ),
    );
    const hero = settings.hero ?? DEFAULT_HERO;
    const grades = settings.grades ?? DEFAULT_GRADES;
    const aboutTeacher = settings.aboutTeacher ?? DEFAULT_ABOUT_TEACHER;
    const courses = settings.courses ?? DEFAULT_COURSES;
    const courseItems = this.form.controls.courses.controls.items;
    courseItems.clear({ emitEvent: false });
    courses.items.forEach((item) => courseItems.push(this.createCourseGroup(item), { emitEvent: false }));
    this.form.reset({
      websiteEnabled: settings.websiteEnabled,
      selectedTemplateKey: settings.selectedTemplateKey,
      teacherName: settings.brand.teacherName,
      subject: settings.brand.subject,
      audience: settings.brand.audience,
      headline: settings.brand.headline,
      subheadline: settings.brand.subheadline,
      announcement: settings.brand.announcement,
      primaryCtaLabel: settings.brand.primaryCtaLabel,
      primaryCtaRoute: navbar.primaryButtonRoute,
      secondaryCtaLabel: settings.brand.secondaryCtaLabel,
      secondaryCtaRoute: navbar.secondaryButtonRoute,
      portraitImageUrl: settings.brand.portraitImageUrl ?? "",
      logoImageUrl: navbar.logoImageUrl ?? "",
      navigation,
      hero: {
        badge: hero.badge,
        headline: hero.headline,
        highlightedHeadline: hero.highlightedHeadline,
        description: hero.description,
        primaryButtonLabel: hero.primaryButtonLabel,
        primaryButtonRoute: hero.primaryButtonRoute,
        secondaryButtonLabel: hero.secondaryButtonLabel,
        secondaryButtonRoute: hero.secondaryButtonRoute,
        miniStats: hero.miniStats,
        imageUrl: hero.imageUrl,
        imageAlt: hero.imageAlt,
        imageBadge: hero.imageBadge,
        imageName: hero.imageName,
        imageCaption: hero.imageCaption,
        stats: hero.stats,
      },
      grades: {
        eyebrow: grades.eyebrow,
        headline: grades.headline,
        description: grades.description,
        items: grades.items,
      },
      aboutTeacher: {
        eyebrow: aboutTeacher.eyebrow,
        headline: aboutTeacher.headline,
        firstParagraphPrefix: aboutTeacher.firstParagraphPrefix,
        experienceHighlight: aboutTeacher.experienceHighlight,
        firstParagraphSuffix: aboutTeacher.firstParagraphSuffix,
        secondParagraph: aboutTeacher.secondParagraph,
        imageUrl: aboutTeacher.imageUrl,
        imageAlt: aboutTeacher.imageAlt,
        stats: aboutTeacher.stats,
        signature: aboutTeacher.signature,
      },
      courses: {
        eyebrow: courses.eyebrow,
        headline: courses.headline,
        description: courses.description,
        items: courses.items,
        allCoursesLabel: courses.allCoursesLabel,
        allCoursesRoute: courses.allCoursesRoute,
      },
    });
    this.heroImageMode.set(hero.imageUrl.startsWith("/api/v1/public/website-assets/") ? "upload" : "url");
    this.aboutImageMode.set(aboutTeacher.imageUrl.startsWith("/api/v1/public/website-assets/") ? "upload" : "url");
    if (!settings.lmsEnabled && !this.hasLmsFromIdentity()) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  }
}
