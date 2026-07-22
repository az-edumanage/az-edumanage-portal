import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { firstValueFrom } from "rxjs";
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
import { Grade } from "../../models/tenant-grades.models";
import { TenantUserRoleOption } from "../../models/tenant-user-create.models";
import { TenantUser } from "../../models/tenant-users.models";

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
    { courseId: "", imageUrl: "", imageAlt: "التفاضل والتكامل", symbol: "∫ dx", level: "الثالث الثانوي", title: "التفاضل والتكامل — كامل", lessonsLabel: "◷ 42 حصة", ratingLabel: "★ 4.9", price: "650 ج", oldPrice: "900 ج", actionLabel: "التفاصيل", route: "/courses/calculus" },
    { courseId: "", imageUrl: "", imageAlt: "حساب المثلثات", symbol: "sin θ", level: "الأول الثانوي", title: "حساب المثلثات من الصفر", lessonsLabel: "◷ 28 حصة", ratingLabel: "★ 4.8", price: "450 ج", oldPrice: "", actionLabel: "التفاصيل", route: "/courses/calculus" },
    { courseId: "", imageUrl: "", imageAlt: "الميكانيكا", symbol: "F = ma", level: "الثاني الثانوي", title: "الميكانيكا — استاتيكا وديناميكا", lessonsLabel: "◷ 36 حصة", ratingLabel: "★ 4.9", price: "550 ج", oldPrice: "", actionLabel: "التفاصيل", route: "/courses/calculus" },
  ],
  allCoursesLabel: "شوف كل الكورسات ▸",
  allCoursesRoute: "/courses",
};

@Component({
  selector: "app-tenant-lms-settings",
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, RouterLink],
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
                  <div class="lms-course-editor">
                    @for (item of form.controls.courses.controls.items.controls; track item; let index = $index) {
                      <article class="lms-navbar-item lms-course-item" [formGroupName]="index">
                        <div class="lms-navbar-item-heading"><span class="lms-order">{{ index + 1 }}</span><strong>{{ item.controls.title.value || "New course" }}</strong><button type="button" class="lms-remove-button" (click)="removeCourse(index)" [attr.aria-label]="'Remove ' + (item.controls.title.value || 'course')"><mat-icon>delete_outline</mat-icon>Remove</button></div>
                        <label class="lms-course-selector">
                          <span>Content course</span>
                          <select class="tenant-lms-input" formControlName="courseId" (change)="selectHomepageCourse(index, $event)">
                            <option value="">Choose a course</option>
                            @for (course of managedCourses(); track course.id) {
                              <option [value]="course.id">{{ course.title }} · {{ course.gradeName }}{{ course.published ? "" : " · Draft" }}</option>
                            }
                          </select>
                          <small>Select a course created in Content / Courses. Its details will fill this card and can still be customized below.</small>
                        </label>
                        @if (!coursesLoading() && !managedCourses().length) {
                          <div class="lms-inline-notice"><mat-icon>info</mat-icon><span>No content courses are available.</span><a [routerLink]="['/tenant/lms-settings/content/courses/new']">Create a course</a></div>
                        }
                        <div class="lms-course-media">
                          <div class="lms-image-editor">
                            <label><span>Thumbnail URL</span><input class="tenant-lms-input lms-route-input" formControlName="imageUrl" placeholder="https://example.com/course.jpg" /></label>
                            <label class="lms-upload-control" [class.is-uploading]="uploadingCourseIndex() === index">
                              <input type="file" accept="image/png,image/jpeg,image/webp" (click)="rememberHeroUploadScroll($event)" (change)="onCourseThumbnailSelected(index, $event)" [disabled]="uploadingCourseIndex() !== null" />
                              <mat-icon>{{ uploadingCourseIndex() === index ? "sync" : "add_photo_alternate" }}</mat-icon><span><strong>{{ uploadingCourseIndex() === index ? "Uploading thumbnail..." : "Upload thumbnail" }}</strong><small>PNG, JPG, or WebP</small></span>
                            </label>
                            @if (courseImageUploadError(index)) { <p class="lms-field-error" role="alert">{{ courseImageUploadError(index) }}</p> }
                            <label><span>Alternative text</span><input class="tenant-lms-input" formControlName="imageAlt" dir="rtl" /></label>
                          </div>
                          <div class="lms-course-preview">@if (coursePreviewUrl(index)) { <img [src]="coursePreviewUrl(index)" [alt]="item.controls.imageAlt.value" /> } @else if (item.controls.symbol.value) { <span class="lms-course-symbol">{{ item.controls.symbol.value }}</span> } @else { <mat-icon class="lms-course-placeholder">image_not_supported</mat-icon> }</div>
                        </div>
                        <div class="lms-fields lms-fields-three">
                          <label><span>Fallback symbol <small>(optional)</small></span><input class="tenant-lms-input" formControlName="symbol" placeholder="For example, ∫ dx" /></label>
                          <label><span>Grade / level</span><input class="tenant-lms-input" formControlName="level" dir="rtl" /></label>
                          <label><span>Course title</span><input class="tenant-lms-input" formControlName="title" dir="rtl" /></label>
                          <label><span>Lessons</span><input class="tenant-lms-input" formControlName="lessonsLabel" dir="rtl" /></label>
                          <label><span>Rating</span><input class="tenant-lms-input" formControlName="ratingLabel" dir="rtl" /></label>
                          <label><span>Price</span><input class="tenant-lms-input" formControlName="price" dir="rtl" /></label>
                          <label><span>Old price (optional)</span><input class="tenant-lms-input" formControlName="oldPrice" dir="rtl" /></label>
                          <label><span>Button label</span><input class="tenant-lms-input" formControlName="actionLabel" dir="rtl" /></label>
                          <label><span>Course route</span><input class="tenant-lms-input lms-route-input" formControlName="route" /></label>
                        </div>
                      </article>
                    } @empty { <div class="lms-empty-editor"><mat-icon>play_lesson</mat-icon><strong>No courses yet</strong><span>Add a course to show it on the homepage.</span></div> }
                  </div>
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
                  <div class="lms-course-table-wrap">
                    <table class="lms-course-table">
                      <thead><tr><th>Course</th><th>Grade</th><th>Content</th><th>Price</th><th>Status</th><th>Updated</th><th><span class="lms-visually-hidden">Actions</span></th></tr></thead>
                      <tbody>
                        @for (course of pagedManagedCourses(); track course.id) {
                          <tr>
                            <td><div class="lms-course-cell">@if (course.thumbnailUrl) { <img [src]="resolveAssetUrl(course.thumbnailUrl)" alt="" /> } @else { <span><mat-icon>play_lesson</mat-icon></span> }<div><strong>{{ course.title }}</strong><small>/courses/{{ course.slug }}</small></div></div></td>
                            <td>{{ course.gradeName }}</td>
                            <td><strong>{{ courseLessonCount(course) }}</strong><small> lessons</small></td>
                            <td>{{ course.price }} {{ course.currency }}</td>
                            <td><span class="lms-course-status" [class.is-published]="course.published"><span></span>{{ course.published ? 'Published' : 'Draft' }}</span></td>
                            <td>{{ course.updatedAt | date:'mediumDate' }}</td>
                            <td class="lms-course-actions-cell">
                              <div class="lms-course-row-actions">
                                <span class="lms-course-actions-more" aria-hidden="true"><mat-icon>more_horiz</mat-icon></span>
                                <div class="lms-course-actions" [attr.aria-label]="'Actions for ' + course.title">
                                  <button type="button" class="lms-row-action is-danger" (click)="openCourseDeleteDialog(course)" [disabled]="courseSaving()" [attr.aria-label]="'Delete ' + course.title" [title]="'Delete ' + course.title"><mat-icon>delete_outline</mat-icon></button>
                                  <a class="lms-row-action" [routerLink]="['/tenant/lms-settings/content/courses', course.id, 'edit']" [attr.aria-label]="'Edit ' + course.title" [title]="'Edit ' + course.title"><mat-icon>edit</mat-icon></a>
                                  <button type="button" class="lms-row-action" (click)="cloneManagedCourse(course)" [disabled]="courseSaving()" [attr.aria-label]="'Clone ' + course.title" [title]="'Clone ' + course.title"><mat-icon>content_copy</mat-icon></button>
                                  <button type="button" class="lms-row-action" disabled [attr.aria-label]="'Report for ' + course.title + ' is not available yet'" title="Report is not available yet"><mat-icon>query_stats</mat-icon></button>
                                  <a class="lms-row-action" [routerLink]="coursePreviewRoute(course)" [attr.aria-label]="'Preview ' + course.title" [title]="'Preview ' + course.title"><mat-icon>visibility</mat-icon></a>
                                </div>
                              </div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  <div class="lms-report-pagination">
                    <span>Showing {{ courseResultStart() }}-{{ courseResultEnd() }} of {{ filteredManagedCourses().length }} courses</span>
                    <div><label class="lms-page-size">Rows<select [value]="coursePageSize()" (change)="setCoursePageSize($event)"><option [value]="5">5</option><option [value]="10">10</option><option [value]="20">20</option></select></label><button type="button" class="lms-page-button lms-page-icon-button" (click)="goToCoursePage(coursePage() - 1)" [disabled]="coursePage() === 1" title="Previous page" aria-label="Previous course page"><mat-icon>chevron_left</mat-icon></button><span class="lms-page-summary">Page {{ coursePage() }} of {{ coursePageCount() }}</span><button type="button" class="lms-page-button lms-page-icon-button" (click)="goToCoursePage(coursePage() + 1)" [disabled]="coursePage() === coursePageCount()" title="Next page" aria-label="Next course page"><mat-icon>chevron_right</mat-icon></button></div>
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

                      <fieldset class="lms-field-group">
                        <legend>Course details</legend><p>These fields build the public course route and the main information shown on its detail page.</p>
                        <div class="lms-fields">
                          <label><span>Course title</span><input class="tenant-lms-input" formControlName="title" dir="rtl" /></label>
                          <label><span>Grade</span><select class="tenant-lms-input" formControlName="gradeId"><option value="">Select a tenant grade</option>@for (grade of tenantGrades(); track grade.id) { <option [value]="grade.id">{{ grade.name }} · {{ grade.level }}</option> }</select><small class="lms-field-hint">Loaded from Tenant Grades.</small></label>
                          <label><span>Route slug</span><div class="lms-input-prefix"><span>/courses/</span><input class="tenant-lms-input" formControlName="slug" inputmode="url" placeholder="calculus" /></div></label>
                          <label><span>Subtitle</span><input class="tenant-lms-input" formControlName="subtitle" dir="rtl" /></label>
                          <label class="lms-field-wide"><span>Description</span><textarea class="tenant-lms-input" formControlName="description" rows="4" dir="rtl"></textarea></label>
                          <label><span>Thumbnail URL</span><input class="tenant-lms-input" formControlName="thumbnailUrl" type="url" /></label>
                          <label class="lms-upload-inline"><span>Upload thumbnail</span><input type="file" accept="image/*" (change)="uploadCourseAsset($event, 'thumbnail')" [disabled]="courseUploading()" /><small>{{ courseUploading() ? 'Uploading…' : 'PNG, JPG, or WebP' }}</small></label>
                        </div>
                      </fieldset>

                      <fieldset class="lms-field-group">
                        <legend>Preview and sales</legend><p>Match the public page preview, facts, pricing, and enrollment summary.</p>
                        <div class="lms-fields lms-fields-three">
                          <label><span>Preview media type</span><select class="tenant-lms-input" formControlName="previewMediaType"><option value="NONE">No preview</option><option value="VIDEO">Video</option><option value="IMAGE">Image</option><option value="AUDIO">Audio</option></select></label>
                          <label><span>Preview URL</span><input class="tenant-lms-input" formControlName="previewMediaUrl" type="url" /></label>
                          <label class="lms-upload-inline"><span>Upload preview</span><input type="file" accept="video/*,audio/*,image/*" (change)="uploadCourseAsset($event, 'preview')" [disabled]="courseUploading()" /></label>
                          <label><span>Price</span><input class="tenant-lms-input" formControlName="price" type="number" min="0" step="0.01" /></label>
                          <label><span>Old price</span><input class="tenant-lms-input" formControlName="oldPrice" type="number" min="0" step="0.01" /></label>
                          <label><span>Currency</span><input class="tenant-lms-input" formControlName="currency" maxlength="12" /></label>
                          <label><span>Duration label</span><input class="tenant-lms-input" formControlName="durationLabel" placeholder="42 lessons · 21 hours" /></label>
                          <label><span>Students label</span><input class="tenant-lms-input" formControlName="studentsLabel" placeholder="6,300 students" /></label>
                          <label><span>Rating label</span><input class="tenant-lms-input" formControlName="ratingLabel" placeholder="4.9 (1,240 reviews)" /></label>
                        </div>
                        <label class="lms-publish-control"><input type="checkbox" formControlName="published" /><span><strong>Publish this course</strong><small>Only published courses are available on the public LMS.</small></span></label>
                      </fieldset>

                      <div class="lms-two-column-editor">
                        <fieldset class="lms-field-group"><div class="lms-manager-heading"><div><legend>What students will learn</legend><p>Outcome checklist on the course page.</p></div><button type="button" class="lms-icon-button" (click)="addTextItem('learningOutcomes')" aria-label="Add learning outcome"><mat-icon>add</mat-icon></button></div><div formArrayName="learningOutcomes" class="lms-simple-list">@for (control of learningOutcomeControls().controls; track control; let i = $index) { <div><input class="tenant-lms-input" [formControlName]="i" dir="rtl" /><button type="button" (click)="removeTextItem('learningOutcomes', i)" aria-label="Remove outcome"><mat-icon>close</mat-icon></button></div> }</div></fieldset>
                        <fieldset class="lms-field-group"><div class="lms-manager-heading"><div><legend>Course includes</legend><p>PDF notes, exams, access, support, and other benefits.</p></div><button type="button" class="lms-icon-button" (click)="addTextItem('features')" aria-label="Add course feature"><mat-icon>add</mat-icon></button></div><div formArrayName="features" class="lms-simple-list">@for (control of featureControls().controls; track control; let i = $index) { <div><input class="tenant-lms-input" [formControlName]="i" dir="rtl" /><button type="button" (click)="removeTextItem('features', i)" aria-label="Remove feature"><mat-icon>close</mat-icon></button></div> }</div></fieldset>
                      </div>

                      <fieldset class="lms-field-group">
                        <div class="lms-manager-heading"><div><legend>Course content</legend><p>Optional. Build sections and lessons, then attach video, PDF, image, audio, files, or links to each lesson.</p></div><button type="button" class="lms-button lms-button-secondary" (click)="addCurriculumSection()"><mat-icon>create_new_folder</mat-icon>Add section</button></div>
                        <div formArrayName="curriculum" class="lms-curriculum-builder">
                          @for (section of curriculumControls().controls; track section; let sectionIndex = $index) {
                            <article class="lms-curriculum-section" [formGroupName]="sectionIndex">
                              <div class="lms-curriculum-row"><span class="lms-tree-handle"><mat-icon>folder</mat-icon></span><input class="tenant-lms-input" formControlName="title" placeholder="Section title" dir="rtl" /><button type="button" class="lms-icon-button" (click)="addCurriculumLesson(sectionIndex)" aria-label="Add lesson"><mat-icon>add</mat-icon></button><button type="button" class="lms-icon-button is-danger" (click)="removeCurriculumSection(sectionIndex)" aria-label="Remove section"><mat-icon>delete_outline</mat-icon></button></div>
                              <textarea class="tenant-lms-input" formControlName="description" rows="2" placeholder="Optional section description" dir="rtl"></textarea>
                              <div formArrayName="children" class="lms-lesson-list">
                                @for (lesson of childControls(sectionIndex).controls; track lesson; let lessonIndex = $index) {
                                  <section class="lms-lesson-editor" [formGroupName]="lessonIndex">
                                    <div class="lms-curriculum-row"><span class="lms-tree-branch"></span><mat-icon>play_lesson</mat-icon><input class="tenant-lms-input" formControlName="title" placeholder="Lesson title" dir="rtl" /><label class="lms-free-check"><input type="checkbox" formControlName="freePreview" />Free preview</label><button type="button" class="lms-icon-button is-danger" (click)="removeCurriculumLesson(sectionIndex, lessonIndex)" aria-label="Remove lesson"><mat-icon>close</mat-icon></button></div>
                                    <textarea class="tenant-lms-input" formControlName="description" rows="2" placeholder="Lesson summary" dir="rtl"></textarea>
                                    <div formArrayName="media" class="lms-media-list">
                                      @for (media of mediaControls(sectionIndex, lessonIndex).controls; track media; let mediaIndex = $index) {
                                        <div class="lms-media-row" [formGroupName]="mediaIndex"><select class="tenant-lms-input" formControlName="type"><option value="VIDEO">Video</option><option value="PDF">PDF</option><option value="IMAGE">Image</option><option value="AUDIO">Audio</option><option value="FILE">File</option><option value="LINK">Link</option></select><input class="tenant-lms-input" formControlName="title" placeholder="Resource title" dir="rtl" /><input class="tenant-lms-input" formControlName="url" placeholder="URL or upload a file" /><label class="lms-media-upload" title="Upload media"><input type="file" (change)="uploadLessonMedia(sectionIndex, lessonIndex, mediaIndex, $event)" [disabled]="courseUploading()" /><mat-icon>upload_file</mat-icon></label><button type="button" class="lms-icon-button is-danger" (click)="removeLessonMedia(sectionIndex, lessonIndex, mediaIndex)" aria-label="Remove media"><mat-icon>close</mat-icon></button></div>
                                      }
                                      <button type="button" class="lms-add-media" (click)="addLessonMedia(sectionIndex, lessonIndex)"><mat-icon>attach_file</mat-icon>Add media</button>
                                    </div>
                                  </section>
                                }
                              </div>
                            </article>
                          } @empty { <div class="lms-empty-editor"><mat-icon>account_tree</mat-icon><strong>No curriculum tree</strong><span>This course can be saved without content, or add a section when you are ready.</span></div> }
                        </div>
                      </fieldset>

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
            } @else if (activePage() === "contentCourses" && isCourseEditor()) {
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
          <aside class="lms-enroll-drawer" role="dialog" aria-modal="true" aria-labelledby="lms-enroll-title" (click)="$event.stopPropagation()">
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
            (click)="$event.stopPropagation()"
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
        max-width: none;
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
      .lms-course-form { min-width: 0; padding: 1.25rem; }
      .lms-inline-alert { display: flex; align-items: center; gap: .55rem; margin-bottom: 1rem; border-radius: .65rem; padding: .75rem .9rem; font-size: .78rem; font-weight: 700; }
      .lms-inline-alert.is-error { background: rgb(254 242 242); color: rgb(185 28 28); }.lms-inline-alert.is-success { background: rgb(236 253 245); color: rgb(4 120 87); }
      .lms-inline-alert mat-icon { width: 1.1rem; height: 1.1rem; font-size: 1.1rem; }
      .lms-input-prefix { display: flex; align-items: center; border: 1px solid rgb(203 213 225); border-radius: .625rem; overflow: hidden; background: rgb(248 250 252); }
      .lms-input-prefix span { padding-inline: .7rem 0; color: rgb(100 116 139); font-size: .78rem; }.lms-input-prefix .tenant-lms-input { border: 0; box-shadow: none; }
      .lms-field-hint, .lms-upload-inline small { color: rgb(100 116 139); font-size: .65rem; font-weight: 500; }
      .lms-upload-inline input[type=file] { width: 100%; border: 1px dashed rgb(148 163 184); border-radius: .625rem; padding: .58rem; background: rgb(248 250 252); font-size: .7rem; }
      .lms-publish-control { display: flex; align-items: flex-start; gap: .7rem; margin-top: 1rem; border-radius: .7rem; background: rgb(248 250 252); padding: .9rem; color: rgb(30 41 59); cursor: pointer; }
      .lms-publish-control input { margin-top: .15rem; accent-color: rgb(79 70 229); }.lms-publish-control span { display: grid; gap: .1rem; }.lms-publish-control strong { font-size: .78rem; }.lms-publish-control small { color: rgb(71 85 105); font-size: .68rem; }
      .lms-two-column-editor { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
      .lms-icon-button { display: grid; place-items: center; flex: 0 0 2rem; width: 2rem; height: 2rem; border: 1px solid rgb(203 213 225); border-radius: .5rem; background: white; color: rgb(67 56 202); cursor: pointer; }
      .lms-icon-button mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }.lms-icon-button.is-danger { color: rgb(185 28 28); }
      .lms-simple-list { display: grid; gap: .5rem; margin-top: .85rem; }.lms-simple-list > div { display: flex; gap: .4rem; }.lms-simple-list button { border: 0; background: transparent; color: rgb(185 28 28); cursor: pointer; }.lms-simple-list mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-curriculum-builder { display: grid; gap: .8rem; margin-top: 1rem; }
      .lms-curriculum-section { display: grid; gap: .7rem; border: 1px solid rgb(203 213 225); border-radius: .75rem; padding: .9rem; background: rgb(248 250 252); }
      .lms-curriculum-row { display: flex; align-items: center; gap: .5rem; }.lms-curriculum-row > .tenant-lms-input { flex: 1; }
      .lms-tree-handle { color: rgb(79 70 229); }.lms-tree-handle mat-icon, .lms-curriculum-row > mat-icon { width: 1.15rem; height: 1.15rem; font-size: 1.15rem; color: rgb(100 116 139); }
      .lms-lesson-list { display: grid; gap: .65rem; margin-left: 1.25rem; }.lms-lesson-editor { display: grid; gap: .55rem; border-radius: .65rem; background: white; padding: .75rem; }
      .lms-tree-branch { width: .75rem; height: 1.4rem; border-left: 1px solid rgb(148 163 184); border-bottom: 1px solid rgb(148 163 184); }
      .lms-free-check { display: flex; align-items: center; gap: .3rem; white-space: nowrap; color: rgb(51 65 85); font-size: .68rem; font-weight: 700; }.lms-free-check input { accent-color: rgb(79 70 229); }
      .lms-media-list { display: grid; gap: .45rem; margin-left: 2.4rem; }.lms-media-row { display: grid; grid-template-columns: 6rem minmax(8rem, .8fr) minmax(10rem, 1.2fr) 2rem 2rem; gap: .4rem; align-items: center; }
      .lms-media-upload { display: grid; place-items: center; width: 2rem; height: 2rem; border: 1px solid rgb(203 213 225); border-radius: .5rem; color: rgb(67 56 202); cursor: pointer; }.lms-media-upload input { display: none; }.lms-media-upload mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
      .lms-add-media { width: fit-content; display: inline-flex; align-items: center; gap: .3rem; border: 0; background: transparent; color: rgb(67 56 202); font: inherit; font-size: .7rem; font-weight: 750; cursor: pointer; }.lms-add-media mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
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
        .lms-course-toolbar { grid-template-columns: minmax(14rem, 1fr) 10rem 12rem; }
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
        .lms-section-heading {
          padding: 1rem;
        }
        .lms-manager-heading { flex-direction: column; }
        .lms-two-column-editor { grid-template-columns: 1fr; }
        .lms-course-form { padding: .75rem; }
        .lms-course-toolbar { grid-template-columns: 1fr; padding: 1rem; }
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
export class TenantLmsSettingsComponent implements OnInit {
  private readonly data = inject(TenantLmsSettingsDataService);
  private readonly gradesData = inject(TenantGradesDataService);
  private readonly userCreateData = inject(TenantUserCreateDataService);
  private readonly usersData = inject(TenantUsersDataService);
  private readonly fb = inject(FormBuilder);
  private readonly identity = inject(AuthIdentityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private navbarSaveQueue: Promise<void> = Promise.resolve();
  private heroUploadScrollContainer: HTMLElement | null = null;
  private heroUploadScrollTop = 0;
  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
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
  readonly coursePageSize = signal(10);
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

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const settings = await this.data.getSettings();
      this.applySettings(settings);
      await this.loadManagedCourseData();
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
  }

  setCourseSearch(event: Event): void { this.courseSearch.set((event.target as HTMLInputElement).value); this.coursePage.set(1); }
  setCourseStatusFilter(event: Event): void { this.courseStatusFilter.set((event.target as HTMLSelectElement).value as "all" | "published" | "draft"); this.coursePage.set(1); }
  setCourseGradeFilter(event: Event): void { this.courseGradeFilter.set((event.target as HTMLSelectElement).value); this.coursePage.set(1); }
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
    this.courseForm.markAsPristine();
  }

  learningOutcomeControls(): FormArray<FormControl<string>> { return this.courseForm.controls.learningOutcomes; }
  featureControls(): FormArray<FormControl<string>> { return this.courseForm.controls.features; }
  curriculumControls(): FormArray<FormGroup<any>> { return this.courseForm.controls.curriculum; }
  childControls(sectionIndex: number): FormArray<FormGroup<any>> { return this.curriculumControls().at(sectionIndex).controls['children'] as FormArray<FormGroup<any>>; }
  mediaControls(sectionIndex: number, lessonIndex: number): FormArray<FormGroup<any>> { return this.childControls(sectionIndex).at(lessonIndex).controls['media'] as FormArray<FormGroup<any>>; }

  addTextItem(kind: "learningOutcomes" | "features"): void { this.courseForm.controls[kind].push(this.fb.nonNullable.control("", Validators.required)); }
  removeTextItem(kind: "learningOutcomes" | "features", index: number): void { this.courseForm.controls[kind].removeAt(index); }
  addCurriculumSection(): void { this.curriculumControls().push(this.createCurriculumGroup({ id: createCourseContentId(), title: "", description: "", freePreview: false, media: [], children: [] })); }
  removeCurriculumSection(index: number): void { this.curriculumControls().removeAt(index); }
  addCurriculumLesson(sectionIndex: number): void { this.childControls(sectionIndex).push(this.createCurriculumGroup({ id: createCourseContentId(), title: "", description: "", freePreview: false, media: [], children: [] })); }
  removeCurriculumLesson(sectionIndex: number, lessonIndex: number): void { this.childControls(sectionIndex).removeAt(lessonIndex); }
  addLessonMedia(sectionIndex: number, lessonIndex: number): void { this.mediaControls(sectionIndex, lessonIndex).push(this.createMediaGroup({ id: createCourseContentId(), type: "VIDEO", title: "", url: "", fileName: "", contentType: "", durationLabel: "" })); }
  removeLessonMedia(sectionIndex: number, lessonIndex: number, mediaIndex: number): void { this.mediaControls(sectionIndex, lessonIndex).removeAt(mediaIndex); }

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
    try { const uploaded = await this.data.uploadManagedCourseMedia(file); this.mediaControls(sectionIndex, lessonIndex).at(mediaIndex).patchValue({ type: uploaded.mediaType, url: uploaded.url, fileName: uploaded.fileName, contentType: uploaded.contentType, title: this.mediaControls(sectionIndex, lessonIndex).at(mediaIndex).controls['title'].value || file.name }); }
    catch { this.courseError.set("The lesson media could not be uploaded."); }
    finally { this.courseUploading.set(false); input.value = ""; }
  }

  async saveManagedCourse(): Promise<void> {
    if (this.courseForm.invalid || this.courseSaving()) { this.courseForm.markAllAsTouched(); this.courseError.set("Complete the course title, route slug, and grade before saving."); return; }
    this.courseSaving.set(true); this.courseError.set(null); this.courseMessage.set(null);
    try {
      const raw = this.courseForm.getRawValue();
      const payload = { ...raw, subtitle: raw.subtitle || null, description: raw.description || null, thumbnailUrl: raw.thumbnailUrl || null, previewMediaUrl: raw.previewMediaUrl || null, oldPrice: raw.oldPrice || null, durationLabel: raw.durationLabel || null, studentsLabel: raw.studentsLabel || null, ratingLabel: raw.ratingLabel || null } as SaveManagedCourseRequest;
      const saved = this.editingCourseId() ? await this.data.updateManagedCourse(this.editingCourseId()!, payload) : await this.data.createManagedCourse(payload);
      this.managedCourses.update((courses) => [saved, ...courses.filter((course) => course.id !== saved.id)]);
      this.courseMessage.set("Course saved successfully.");
      await this.router.navigate(["/tenant/lms-settings/content/courses"]);
    } catch (error: any) { this.courseError.set(error?.error?.message || "Unable to save this course."); }
    finally { this.courseSaving.set(false); }
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
    return this.fb.nonNullable.group({ id: [node.id || createCourseContentId()], title: [node.title, Validators.required], description: [node.description ?? ""], freePreview: [node.freePreview], media: this.fb.array((node.media ?? []).map((item) => this.createMediaGroup(item))), children: this.fb.array((node.children ?? []).map((item) => this.createCurriculumGroup(item))) });
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
      courseId: "", imageUrl: "", imageAlt: "صورة الكورس", symbol: "", level: "المرحلة الثانوية",
      title: "كورس جديد", lessonsLabel: "◷ 0 حصة", ratingLabel: "★ 5.0", price: "0 ج",
      oldPrice: "", actionLabel: "التفاصيل", route: "/courses",
    }));
    this.form.markAsDirty();
  }

  removeCourse(index: number): void {
    this.form.controls.courses.controls.items.removeAt(index);
    this.courseImageUploadErrors.set({});
    this.form.markAsDirty();
  }

  coursePreviewUrl(index: number): string {
    return this.resolveAssetUrl(this.form.controls.courses.controls.items.at(index)?.controls.imageUrl.value);
  }

  selectHomepageCourse(index: number, event: Event): void {
    const courseId = (event.target as HTMLSelectElement).value;
    const course = this.managedCourses().find((candidate) => candidate.id === courseId);
    if (!course) return;
    const item = this.form.controls.courses.controls.items.at(index);
    if (!item) return;
    const lessonCount = this.courseLessonCount(course);
    item.patchValue({
      courseId: course.id,
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
    item.markAsDirty();
    this.saveMessage.set(null);
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
  ): Promise<void> {
    if (this.form.invalid || this.saving() || !this.settings()?.lmsEnabled) {
      this.form.markAllAsTouched();
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
