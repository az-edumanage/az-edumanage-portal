import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { OwnerWebSettingsFacade } from '../../state/owner-web-settings.facade';
import { environment } from '../../../../../environments/environment';
import { QuillModule } from 'ngx-quill';
import {
  SaveWebsiteSettingsRequest,
  WebsiteSettingsView,
} from '../../data-access/owner-website-settings-data.service';

interface SaveStatus { type: 'success' | 'error'; title: string; message: string }
interface QuillSelectionChangeEvent { range: { index: number; length: number } | null }
interface HeroQuillEditor {
  getSelection(focus?: boolean): { index: number; length: number } | null;
  setSelection(index: number, length: number, source?: string): void;
  formatText(index: number, length: number, name: string, value: string, source?: string): void;
  getFormat(index: number, length?: number): Record<string, unknown>;
  root: HTMLElement;
}
type WebSettingsSection =
  | 'site'
  | 'hero'
  | 'pages'
  | 'navigation'
  | 'features'
  | 'testimonials'
  | 'pricing'
  | 'ctas'
  | 'footer'
  | 'marketing'
  | 'about'
  | 'terms'
  | 'pixel'
  | 'onboarding'
  | 'trial';
type PageFieldKey = 'pageKey' | 'title' | 'titleAr' | 'routePath' | 'visible';

const INTEGRATION_ICON_OPTIONS: readonly string[] = [
  'mail', 'account_balance', 'calendar_month', 'hub', 'public', 'school', 'payments', 'settings',
  'check_circle', 'done_all', 'sync', 'autorenew', 'cloud', 'cloud_done', 'cloud_sync', 'dns',
  'storage', 'database', 'api', 'lan', 'router', 'security', 'lock', 'verified_user', 'shield',
  'bolt', 'speed', 'insights', 'analytics', 'bar_chart', 'pie_chart', 'monitoring', 'timeline',
  'group', 'groups', 'person', 'support_agent', 'business', 'apartment', 'domain', 'workspaces',
  'description', 'assignment', 'fact_check', 'event', 'notifications', 'chat', 'forum', 'phone',
  'link', 'webhook', 'integration_instructions', 'translate', 'language', 'travel_explore',
];
const FEATURE_DETAIL_ICON_OPTIONS: readonly string[] = Array.from(new Set([
  ...INTEGRATION_ICON_OPTIONS,
  'abc',
  'add_business',
  'admin_panel_settings',
  'apps',
  'approval',
  'article',
  'assignment_turned_in',
  'auto_graph',
  'badge',
  'book',
  'bookmark',
  'build',
  'business_center',
  'campaign',
  'category',
  'celebration',
  'checklist',
  'checklist_rtl',
  'class',
  'co_present',
  'collections_bookmark',
  'contact_support',
  'dashboard',
  'developer_board',
  'devices',
  'diversity_3',
  'edit_calendar',
  'emoji_events',
  'engineering',
  'event_available',
  'event_note',
  'extension',
  'fact_check',
  'filter_alt',
  'flag',
  'folder',
  'grade',
  'history_edu',
  'inventory_2',
  'key',
  'leaderboard',
  'library_books',
  'lightbulb',
  'manage_accounts',
  'map',
  'menu_book',
  'mobile_friendly',
  'model_training',
  'notifications_active',
  'paid',
  'palette',
  'pending_actions',
  'person_add',
  'person_pin',
  'psychology',
  'qr_code_2',
  'query_stats',
  'record_voice_over',
  'rocket_launch',
  'rule',
  'schedule',
  'science',
  'send',
  'smart_display',
  'sms',
  'stacked_line_chart',
  'star',
  'task_alt',
  'timer',
  'tips_and_updates',
  'verified',
  'view_timeline',
  'workspace_premium',
])).sort();
const HERO_RICH_TEXT_CONTROLS = [
  'badgeText',
  'titleText',
  'descriptionText',
  'primaryCtaLabel',
  'secondaryCtaLabel',
  'badgeTextAr',
  'titleTextAr',
  'descriptionTextAr',
  'primaryCtaLabelAr',
  'secondaryCtaLabelAr',
] as const;
const DEFAULT_DOCS_SECTION_TITLE = 'Our Feature';
const DEFAULT_DOCS_SECTION_DESCRIPTION = 'Watch a quick walkthrough that displays feature details and platform workflow in action.';
const DEFAULT_DOCS_SECTION_TITLE_AR = 'ميزات المنصة';
const DEFAULT_DOCS_SECTION_DESCRIPTION_AR = 'شاهد عرضا سريعا يوضح تفاصيل الميزات وطريقة عمل المنصة.';
const DEFAULT_FEATURES_SECTION_TITLE = 'Precision Management Tools';
const DEFAULT_FEATURES_SECTION_DESCRIPTION =
  'Engineered for institutions that value clarity and performance. Our suite of tools covers every touchpoint of the educational journey.';
const DEFAULT_FEATURES_SECTION_TITLE_AR = 'أدوات إدارة دقيقة';
const DEFAULT_FEATURES_SECTION_DESCRIPTION_AR = 'مصممة للمؤسسات التي تقدر الوضوح والأداء. تغطي مجموعة الأدوات كل نقطة في الرحلة التعليمية.';
const DEFAULT_PRICING_SECTION_TITLE = 'Institutional Tiers';
const DEFAULT_PRICING_SECTION_DESCRIPTION = 'Scale your management as you grow your community.';
const DEFAULT_PRICING_SECTION_TITLE_AR = 'باقات المؤسسات';
const DEFAULT_PRICING_SECTION_DESCRIPTION_AR = 'وسّع إدارة مركزك مع نمو مجتمعك.';
const DEFAULT_PRICING_AUDIENCE_TEACHER_LABEL = 'Teacher';
const DEFAULT_PRICING_AUDIENCE_TEACHER_LABEL_AR = 'المعلم';
const DEFAULT_PRICING_AUDIENCE_CENTER_LABEL = 'Center';
const DEFAULT_PRICING_AUDIENCE_CENTER_LABEL_AR = 'المركز';
const DEFAULT_PRICING_BILLING_ANNUAL_LABEL = 'Annual';
const DEFAULT_PRICING_BILLING_ANNUAL_LABEL_AR = 'سنوي';
const DEFAULT_PRICING_BILLING_MONTHLY_LABEL = 'Monthly';
const DEFAULT_PRICING_BILLING_MONTHLY_LABEL_AR = 'شهري';
const DEFAULT_TRUSTED_HEADING = 'Trusted by Leading Education Teams';
const DEFAULT_TRUSTED_HEADING_AR = 'موثوق به من فرق تعليمية رائدة';
const DEFAULT_TRUSTED_DESCRIPTION = 'Institutions choose EduManage for operational control, LMS consistency, and measurable growth.';
const DEFAULT_TRUSTED_DESCRIPTION_AR = 'تختار المؤسسات EduManage للتحكم التشغيلي واتساق نظام التعلم والنمو القابل للقياس.';
const DEFAULT_TRUSTED_STAT_ONE_VALUE = '+250';
const DEFAULT_TRUSTED_STAT_ONE_VALUE_AR = '+250';
const DEFAULT_TRUSTED_STAT_ONE_LABEL = 'Active institutions';
const DEFAULT_TRUSTED_STAT_ONE_LABEL_AR = 'مؤسسات نشطة';
const DEFAULT_TRUSTED_STAT_TWO_VALUE = '+120K';
const DEFAULT_TRUSTED_STAT_TWO_VALUE_AR = '+120 ألف';
const DEFAULT_TRUSTED_STAT_TWO_LABEL = 'Learners supported';
const DEFAULT_TRUSTED_STAT_TWO_LABEL_AR = 'متعلمين مدعومين';
const DEFAULT_TRUSTED_STAT_THREE_VALUE = '< 7 days';
const DEFAULT_TRUSTED_STAT_THREE_VALUE_AR = 'أقل من 7 أيام';
const DEFAULT_TRUSTED_STAT_THREE_LABEL = 'Average onboarding';
const DEFAULT_TRUSTED_STAT_THREE_LABEL_AR = 'متوسط التفعيل';
const DEFAULT_MARKETING_STEPS = [
  {
    step: '01',
    title: 'Create Account',
    titleAr: 'أنشئ الحساب',
    description: 'Simple, secure onboarding for your primary institutional admin.',
    descriptionAr: 'بدء آمن وبسيط للمسؤول الأساسي في مؤسستك.',
  },
  {
    step: '02',
    title: 'Choose Plan',
    titleAr: 'اختر الباقة',
    description: "Select the module density that fits your center's specific needs.",
    descriptionAr: 'اختر كثافة الوحدات التي تناسب احتياجات مركزك.',
  },
  {
    step: '03',
    title: 'Setup Center',
    titleAr: 'جهز المركز',
    description: 'Import data, customize branding, and invite your core teaching staff.',
    descriptionAr: 'استورد البيانات وخصص الهوية وادع فريق التدريس الأساسي.',
  },
  {
    step: '04',
    title: 'Start Managing',
    titleAr: 'ابدأ الإدارة',
    description: 'Unleash the full potential of automated academic administration.',
    descriptionAr: 'فعّل إمكانات الإدارة الأكاديمية الآلية بالكامل.',
  },
];
const DEFAULT_ABOUT_CONTENT = {
  missionBadge: 'Our Mission',
  missionBadgeAr: 'رسالتنا',
  heroTitle: 'Architecting the Future of Academic Excellence.',
  heroTitleAr: 'نبني مستقبل التميز الأكاديمي.',
  heroDescription:
    'We believe that education should be defined by student growth, not administrative friction. Our goal is to empower institutions with the tools they need to thrive in a digital-first world.',
  heroDescriptionAr:
    'نؤمن أن التعليم يجب أن يقاس بنمو الطلاب، لا بعبء الإدارة. هدفنا أن نمنح المؤسسات الأدوات التي تحتاجها للعمل بثقة في عالم رقمي.',
  storyTitle: 'Born from Necessity',
  storyTitleAr: 'بدأت من حاجة حقيقية',
  storyLead:
    'Founded in 2022, AZ-Edumanage started as a small project at a leading technical university. We saw firsthand how fragmented systems were slowing down academic progress.',
  storyLeadAr:
    'تأسست AZ-Edumanage عام 2022 كمشروع صغير داخل جامعة تقنية رائدة. رأينا عن قرب كيف تؤدي الأنظمة المتفرقة إلى إبطاء العمل الأكاديمي.',
  storyBody:
    'Today, we serve over 450 institutions worldwide, helping them transition from legacy spreadsheets to automated intelligence.',
  storyBodyAr:
    'اليوم نخدم أكثر من 450 مؤسسة حول العالم، ونساعدها على الانتقال من الجداول التقليدية إلى إدارة ذكية ومؤتمتة.',
  imageUrl: 'https://images.unsplash.com/photo-1522071823947-091222fe236d?q=80&w=1000&auto=format&fit=crop',
  imageAlt: 'AZ-Edumanage team',
  imageAltAr: 'فريق AZ-Edumanage',
  valuesTitle: 'Our Core Values',
  valuesTitleAr: 'قيمنا الأساسية',
  partnersTitle: 'Our Partners',
  partnersTitleAr: 'شركاؤنا',
  partnersDescription: 'We collaborate with technology, payment, and implementation partners to help institutions launch faster.',
  partnersDescriptionAr: 'نتعاون مع شركاء التقنية والمدفوعات والتنفيذ لمساعدة المؤسسات على الانطلاق بسرعة أكبر.',
};
const DEFAULT_ABOUT_PARTNERS = [
  {
    name: 'Technology Partners',
    nameAr: 'شركاء التقنية',
    description: 'Cloud, integration, and learning technology providers.',
    descriptionAr: 'مزودو السحابة والتكامل وتقنيات التعلم.',
    logoUrl: '',
    websiteUrl: '',
    visible: true,
    displayOrder: 1,
  },
  {
    name: 'Payment Partners',
    nameAr: 'شركاء المدفوعات',
    description: 'Secure billing and subscription enablement partners.',
    descriptionAr: 'شركاء تمكين الفوترة والاشتراكات الآمنة.',
    logoUrl: '',
    websiteUrl: '',
    visible: true,
    displayOrder: 2,
  },
  {
    name: 'Implementation Partners',
    nameAr: 'شركاء التنفيذ',
    description: 'Local rollout and training support for education teams.',
    descriptionAr: 'دعم محلي للإطلاق والتدريب لفرق التعليم.',
    logoUrl: '',
    websiteUrl: '',
    visible: true,
    displayOrder: 3,
  },
];
const DEFAULT_TERMS_CONTENT = {
  title: 'Terms & Conditions',
  titleAr: 'الشروط والأحكام',
  lastUpdated: 'Last updated: May 2, 2026',
  lastUpdatedAr: 'آخر تحديث: 2 مايو 2026',
  contactText: 'If you have any questions about these Terms, please contact us at',
  contactTextAr: 'إذا كانت لديك أي أسئلة حول هذه الشروط، تواصل معنا عبر',
  contactEmail: 'legal@az-edumanage.com',
};
const DEFAULT_TERMS_SECTIONS = [
  {
    icon: 'gavel',
    title: 'Acceptance of Terms',
    titleAr: 'قبول الشروط',
    body: 'By accessing or using the AZ-Edumanage platform, you agree to be bound by these Terms and Conditions. If you do not agree to all terms, you may not access or use the services.',
    bodyAr: 'عند الوصول إلى منصة AZ-Edumanage أو استخدامها، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا لم توافق على جميع الشروط، فلا يجوز لك الوصول إلى الخدمات أو استخدامها.',
    bullets: [],
    bulletsAr: [],
    visible: true,
    displayOrder: 1,
  },
  {
    icon: 'account_circle',
    title: 'User Accounts',
    titleAr: 'حسابات المستخدمين',
    body: 'To access certain platform features, you must register for an account and provide accurate, current, and complete information.',
    bodyAr: 'للوصول إلى بعض ميزات المنصة، يجب عليك تسجيل حساب وتقديم معلومات دقيقة وحديثة وكاملة.',
    bullets: ['You are responsible for safeguarding your password.', 'You agree not to disclose your password to any third party.', 'You must notify us immediately if you become aware of any security breach.'],
    bulletsAr: ['أنت مسؤول عن حماية كلمة المرور الخاصة بك.', 'توافق على عدم مشاركة كلمة المرور مع أي طرف ثالث.', 'يجب إخطارنا فورا عند علمك بأي خرق أمني.'],
    visible: true,
    displayOrder: 2,
  },
  {
    icon: 'description',
    title: 'SaaS Subscription & Trial',
    titleAr: 'الاشتراك والتجربة المجانية',
    body: 'AZ-Edumanage offers a free trial for new institutions. After the trial ends, premium features may be restricted unless a valid subscription plan is selected.',
    bodyAr: 'توفر AZ-Edumanage تجربة مجانية للمؤسسات الجديدة. بعد انتهاء التجربة، قد يتم تقييد الميزات المدفوعة ما لم يتم اختيار باقة اشتراك صالحة.',
    bullets: [],
    bulletsAr: [],
    visible: true,
    displayOrder: 3,
  },
  {
    icon: 'security',
    title: 'Data Privacy & Institutional Records',
    titleAr: 'خصوصية البيانات وسجلات المؤسسة',
    body: 'As an institutional administrator, you are responsible for ensuring that student data uploaded to the platform complies with applicable educational privacy laws.',
    bodyAr: 'بصفتك مسؤولا مؤسسيا، فأنت مسؤول عن ضمان توافق بيانات الطلاب المرفوعة على المنصة مع قوانين خصوصية التعليم المعمول بها.',
    bullets: [],
    bulletsAr: [],
    visible: true,
    displayOrder: 4,
  },
  {
    icon: 'error',
    title: 'Limitation of Liability',
    titleAr: 'حدود المسؤولية',
    body: 'AZ-Edumanage, its directors, employees, partners, agents, suppliers, or affiliates are not liable for indirect, incidental, special, consequential, or punitive damages.',
    bodyAr: 'لا تتحمل AZ-Edumanage أو مديروها أو موظفوها أو شركاؤها أو وكلاؤها أو موردوها أو الشركات التابعة لها مسؤولية أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية.',
    bullets: [],
    bulletsAr: [],
    visible: true,
    displayOrder: 5,
  },
];

@Component({
  selector: 'app-owner-web-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, QuillModule],
  templateUrl: './owner-web-settings.component.html',
  styleUrl: './owner-web-settings.component.css',
})
export class OwnerWebSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(OwnerWebSettingsFacade);
  private readonly http = inject(HttpClient);

  readonly loading = this.facade.loading;
  readonly isSaving = this.facade.saving;
  readonly isPublishing = this.facade.publishing;
  readonly isBusy = computed(() => this.isSaving() || this.isPublishing());
  readonly saveStatus = signal<SaveStatus | null>(null);
  readonly settings = this.facade.settings;
  readonly integrationIconOptions = INTEGRATION_ICON_OPTIONS;
  readonly featureDetailIconOptions = FEATURE_DETAIL_ICON_OPTIONS;
  readonly tenantId = computed(() => this.settings()?.tenantId ?? this.facade.resolveTenantId());
  readonly publicWebsiteUrl = 'http://localhost:3000/';
  private readonly backendOrigin = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
  readonly apiPreviewUrl = computed(
    () => `${environment.apiBaseUrl}/public/website-settings/${this.tenantId()}`,
  );
  readonly healthState = signal<'idle' | 'checking' | 'ok' | 'failed'>('idle');
  readonly healthMessage = signal<string>('Not checked yet.');
  readonly promoEditorHtml = signal('');
  readonly promoEditorHtmlAr = signal('');
  readonly focusedFieldLabel = signal<string | null>(null);
  readonly focusedFieldRichHtml = signal('');
  readonly focusedFieldFontSize = signal('16px');
  readonly focusedFieldEditorOpen = signal(false);
  readonly docsVideoModeByIndex = signal<Record<number, 'url' | 'upload'>>({});
  readonly docsVideoUploadProgressByIndex = signal<Record<number, number>>({});
  readonly docsVideoUploadingByIndex = signal<Record<number, boolean>>({});
  readonly heroBackgroundUploadProgress = signal(0);
  readonly heroBackgroundUploading = signal(false);
  readonly heroBackgroundDragActive = signal(false);
  readonly heroBackgroundPreviewOpen = signal(false);
  readonly featureImageUploadProgressByIndex = signal<Record<number, number>>({});
  readonly featureImageUploadingByIndex = signal<Record<number, boolean>>({});
  readonly featureImageDragActiveByIndex = signal<Record<number, boolean>>({});
  readonly featureDetailImageUploadProgressByIndex = signal<Record<number, number>>({});
  readonly featureDetailImageUploadingByIndex = signal<Record<number, boolean>>({});
  readonly featureDetailImageDragActiveByIndex = signal<Record<number, boolean>>({});
  readonly featureAccordionOpenByIndex = signal<Record<number, boolean>>({});
  private focusedFieldElement: HTMLInputElement | HTMLTextAreaElement | null = null;
  private promoEditorSelectionRange: Range | null = null;
  private promoEditorSelectionRangeAr: Range | null = null;
  private focusedEditorSelectionRange: Range | null = null;
  private readonly heroEditors = new Map<string, HeroQuillEditor>();
  private readonly heroSelections = new Map<string, { index: number; length: number }>();
  readonly heroRichColors = signal<Record<string, string>>({});
  readonly activeSection = signal<WebSettingsSection>('site');
  readonly heroEditorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ color: [] }],
      [{ align: [] }],
      ['clean'],
    ],
  };
  readonly sections: readonly { key: WebSettingsSection; label: string }[] = [
    { key: 'site', label: 'Site Config' },
    { key: 'hero', label: 'Hero' },
    { key: 'pages', label: 'Pages' },
    { key: 'navigation', label: 'Navigation' },
    { key: 'features', label: 'Features' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'ctas', label: 'CTA Blocks' },
    { key: 'footer', label: 'Footer' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'about', label: 'About us' },
    { key: 'terms', label: 'Terms & conditions' },
    { key: 'pixel', label: 'Pixel' },
    { key: 'onboarding', label: 'Onboarding' },
    { key: 'trial', label: 'Trial Dashboard' },
  ];

  readonly form = this.fb.group({
    siteConfig: this.fb.group({
      siteName: ['', [Validators.required]],
      supportEmail: [''],
      contactPhone: [''],
      primaryLocale: ['en', [Validators.required]],
      defaultCurrency: ['USD', [Validators.required]],
    }),
    hero: this.fb.group({
      badgeText: [''],
      badgeTextAr: [''],
      titleText: ['', [Validators.required]],
      titleTextAr: [''],
      descriptionText: [''],
      descriptionTextAr: [''],
      backgroundImageUrl: [''],
      primaryCtaLabel: [''],
      primaryCtaLabelAr: [''],
      primaryCtaLink: [''],
      secondaryCtaLabel: [''],
      secondaryCtaLabelAr: [''],
      secondaryCtaLink: [''],
      statOneValue: ['+25'],
      statOneValueAr: ['+25'],
      statOneLabel: ['Years Experience'],
      statOneLabelAr: ['سنوات خبرة'],
      statTwoValue: ['+50'],
      statTwoValueAr: ['+50'],
      statTwoLabel: ['Global Partners'],
      statTwoLabelAr: ['شركاء عالميون'],
      statThreeValue: ['+100'],
      statThreeValueAr: ['+100'],
      statThreeLabel: ['Key Clients'],
      statThreeLabelAr: ['عملاء رئيسيون'],
      statFourValue: ['6'],
      statFourValueAr: ['6'],
      statFourLabel: ['Continents Served'],
      statFourLabelAr: ['قارات مخدومة'],
      visible: [true],
    }),
    pages: this.fb.array([]),
    navigation: this.fb.array([]),
    features: this.fb.array([]),
    testimonials: this.fb.array([]),
    pricingPlans: this.fb.array([]),
    ctas: this.fb.array([]),
    footerLinks: this.fb.array([]),
    marketing: this.fb.group({
      promo: this.fb.group({
        icon: ['campaign', [Validators.required]],
        text: ['', [Validators.required]],
        textAr: [''],
        highlight: ['-', [Validators.required]],
        highlightAr: [''],
        suffixText: ['-', [Validators.required]],
        suffixTextAr: [''],
        ctaLabel: ['', [Validators.required]],
        ctaLabelAr: [''],
      }),
      steps: this.fb.array([]),
      integrations: this.fb.group({
        title: ['', [Validators.required]],
        titleAr: [''],
        description: ['', [Validators.required]],
        descriptionAr: [''],
        items: this.fb.array([]),
        itemsAr: this.fb.array([]),
        itemIcons: this.fb.array([]),
        bullets: this.fb.array([]),
        bulletsAr: this.fb.array([]),
      }),
      contact: this.fb.group({
        title: ['', [Validators.required]],
        titleAr: [''],
        description: ['', [Validators.required]],
        descriptionAr: [''],
        hqLabel: ['Global HQ', [Validators.required]],
        hqLabelAr: [''],
        hqValue: ['', [Validators.required]],
        hqValueAr: [''],
      }),
      featuresSectionTitle: [''],
      featuresSectionTitleAr: [''],
      featuresSectionDescription: [''],
      featuresSectionDescriptionAr: [''],
      pricingSectionTitle: [''],
      pricingSectionTitleAr: [''],
      pricingSectionDescription: [''],
      pricingSectionDescriptionAr: [''],
      pricingAudienceTeacherLabel: [''],
      pricingAudienceTeacherLabelAr: [''],
      pricingAudienceCenterLabel: [''],
      pricingAudienceCenterLabelAr: [''],
      pricingBillingAnnualLabel: [''],
      pricingBillingAnnualLabelAr: [''],
      pricingBillingMonthlyLabel: [''],
      pricingBillingMonthlyLabelAr: [''],
      trustedHeading: [''],
      trustedHeadingAr: [''],
      trustedDescription: [''],
      trustedDescriptionAr: [''],
      trustedStatOneValue: [''],
      trustedStatOneValueAr: [''],
      trustedStatOneLabel: [''],
      trustedStatOneLabelAr: [''],
      trustedStatTwoValue: [''],
      trustedStatTwoValueAr: [''],
      trustedStatTwoLabel: [''],
      trustedStatTwoLabelAr: [''],
      trustedStatThreeValue: [''],
      trustedStatThreeValueAr: [''],
      trustedStatThreeLabel: [''],
      trustedStatThreeLabelAr: [''],
      docsVideoUrl: [''],
      docsSectionTitle: [''],
      docsSectionTitleAr: [''],
      docsSectionDescription: [''],
      docsSectionDescriptionAr: [''],
      docsVideos: this.fb.array([]),
      facebookPixelId: ['2231145617703009', [Validators.pattern(/^\d{5,64}$/)]],
      about: this.fb.group({
        missionBadge: [DEFAULT_ABOUT_CONTENT.missionBadge],
        missionBadgeAr: [DEFAULT_ABOUT_CONTENT.missionBadgeAr],
        heroTitle: [DEFAULT_ABOUT_CONTENT.heroTitle],
        heroTitleAr: [DEFAULT_ABOUT_CONTENT.heroTitleAr],
        heroDescription: [DEFAULT_ABOUT_CONTENT.heroDescription],
        heroDescriptionAr: [DEFAULT_ABOUT_CONTENT.heroDescriptionAr],
        storyTitle: [DEFAULT_ABOUT_CONTENT.storyTitle],
        storyTitleAr: [DEFAULT_ABOUT_CONTENT.storyTitleAr],
        storyLead: [DEFAULT_ABOUT_CONTENT.storyLead],
        storyLeadAr: [DEFAULT_ABOUT_CONTENT.storyLeadAr],
        storyBody: [DEFAULT_ABOUT_CONTENT.storyBody],
        storyBodyAr: [DEFAULT_ABOUT_CONTENT.storyBodyAr],
        imageUrl: [DEFAULT_ABOUT_CONTENT.imageUrl],
        imageAlt: [DEFAULT_ABOUT_CONTENT.imageAlt],
        imageAltAr: [DEFAULT_ABOUT_CONTENT.imageAltAr],
        valuesTitle: [DEFAULT_ABOUT_CONTENT.valuesTitle],
        valuesTitleAr: [DEFAULT_ABOUT_CONTENT.valuesTitleAr],
        partnersTitle: [DEFAULT_ABOUT_CONTENT.partnersTitle],
        partnersTitleAr: [DEFAULT_ABOUT_CONTENT.partnersTitleAr],
        partnersDescription: [DEFAULT_ABOUT_CONTENT.partnersDescription],
        partnersDescriptionAr: [DEFAULT_ABOUT_CONTENT.partnersDescriptionAr],
        partners: this.fb.array([]),
      }),
      terms: this.fb.group({
        title: [DEFAULT_TERMS_CONTENT.title],
        titleAr: [DEFAULT_TERMS_CONTENT.titleAr],
        lastUpdated: [DEFAULT_TERMS_CONTENT.lastUpdated],
        lastUpdatedAr: [DEFAULT_TERMS_CONTENT.lastUpdatedAr],
        contactText: [DEFAULT_TERMS_CONTENT.contactText],
        contactTextAr: [DEFAULT_TERMS_CONTENT.contactTextAr],
        contactEmail: [DEFAULT_TERMS_CONTENT.contactEmail],
        sections: this.fb.array([]),
      }),
    }),
    onboarding: this.fb.group({
      stepOneTitle: ['', [Validators.required]],
      stepOneDescription: ['', [Validators.required]],
      trustBadgeText: ['', [Validators.required]],
      planSelectorBadge: ['', [Validators.required]],
      provisioningTitle: ['', [Validators.required]],
      provisioningDescription: ['', [Validators.required]],
      successTitle: ['', [Validators.required]],
      successDescription: ['', [Validators.required]],
      provisioningTasks: this.fb.array([]),
    }),
    trialDashboard: this.fb.group({
      headerTitle: ['', [Validators.required]],
      headerDescription: ['', [Validators.required]],
      trialRemainingText: ['', [Validators.required]],
      trialEndsText: ['', [Validators.required]],
      trialFeatureBullets: this.fb.array([]),
      setupSteps: this.fb.array([]),
    }),
  });

  get pages(): FormArray<FormGroup> { return this.form.get('pages') as FormArray<FormGroup>; }
  get navigation(): FormArray<FormGroup> { return this.form.get('navigation') as FormArray<FormGroup>; }
  get features(): FormArray<FormGroup> { return this.form.get('features') as FormArray<FormGroup>; }
  get testimonials(): FormArray<FormGroup> { return this.form.get('testimonials') as FormArray<FormGroup>; }
  get pricingPlans(): FormArray<FormGroup> { return this.form.get('pricingPlans') as FormArray<FormGroup>; }
  get ctas(): FormArray<FormGroup> { return this.form.get('ctas') as FormArray<FormGroup>; }
  get footerLinks(): FormArray<FormGroup> { return this.form.get('footerLinks') as FormArray<FormGroup>; }
  get onboardingTasks(): FormArray<FormGroup> {
    return this.form.get(['onboarding', 'provisioningTasks']) as FormArray<FormGroup>;
  }
  get marketingSteps(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'steps']) as FormArray<FormGroup>;
  }
  get marketingIntegrationItems(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'integrations', 'items']) as FormArray<FormGroup>;
  }
  get marketingIntegrationItemsAr(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'integrations', 'itemsAr']) as FormArray<FormGroup>;
  }
  get marketingIntegrationItemIcons(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'integrations', 'itemIcons']) as FormArray<FormGroup>;
  }
  marketingIntegrationItemIconControlAt(index: number): FormControl<string> {
    return this.marketingIntegrationItemIcons.at(index).get('value') as FormControl<string>;
  }

  marketingIntegrationItemArControlAt(index: number): FormControl<string> {
    return this.marketingIntegrationItemsAr.at(index).get('value') as FormControl<string>;
  }

  marketingIntegrationBulletArControlAt(index: number): FormControl<string> {
    return this.marketingIntegrationBulletsAr.at(index).get('value') as FormControl<string>;
  }
  featureIconControlAt(index: number): FormControl<string> {
    return this.features.at(index).get('iconKey') as FormControl<string>;
  }
  get marketingIntegrationBullets(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'integrations', 'bullets']) as FormArray<FormGroup>;
  }
  get marketingIntegrationBulletsAr(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'integrations', 'bulletsAr']) as FormArray<FormGroup>;
  }
  get marketingDocsVideos(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'docsVideos']) as FormArray<FormGroup>;
  }
  get aboutPartners(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'about', 'partners']) as FormArray<FormGroup>;
  }
  get termsSections(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'terms', 'sections']) as FormArray<FormGroup>;
  }
  get trialFeatureBullets(): FormArray<FormGroup> {
    return this.form.get(['trialDashboard', 'trialFeatureBullets']) as FormArray<FormGroup>;
  }
  get trialSetupSteps(): FormArray<FormGroup> {
    return this.form.get(['trialDashboard', 'setupSteps']) as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const data = await this.facade.load();
      this.patchForm(data);
      await this.checkPublicApiHealth();
    } catch (error) {
      this.saveStatus.set({
        type: 'error',
        title: 'Load Failed',
        message: this.resolveError(error),
      });
      this.healthState.set('failed');
      this.healthMessage.set('Cannot validate public API health because settings failed to load.');
    }
  }

  async checkPublicApiHealth(): Promise<void> {
    this.healthState.set('checking');
    this.healthMessage.set('Checking public API endpoint...');
    try {
      const payload = await firstValueFrom(
        this.http.get<{ hero?: { visible?: boolean }; features?: unknown[] }>(this.apiPreviewUrl()),
      );
      const heroVisible = payload?.hero?.visible !== false;
      const featuresCount = Array.isArray(payload?.features) ? payload.features.length : 0;
      this.healthState.set('ok');
      this.healthMessage.set(`OK • hero visible: ${heroVisible ? 'yes' : 'no'} • features: ${featuresCount}`);
    } catch (error) {
      this.healthState.set('failed');
      this.healthMessage.set(this.resolveError(error));
    }
  }

  async saveDraft(): Promise<void> {
    if (this.form.invalid || this.isBusy()) {
      this.focusFirstInvalidSection('save draft');
      return;
    }

    try {
      const payload = this.buildPayload();
      const data = await this.facade.saveDraft(payload);
      this.patchForm(data);
      this.saveStatus.set({ type: 'success', title: 'Draft Saved', message: 'Website settings draft saved successfully.' });
    } catch (error) {
      this.saveStatus.set({ type: 'error', title: 'Save Failed', message: this.resolveError(error) });
    }
  }

  async publish(): Promise<void> {
    if (this.form.invalid || this.isBusy()) {
      this.focusFirstInvalidSection('publish');
      return;
    }

    try {
      const payload = this.buildPayload();
      await this.facade.saveDraft(payload);
      const data = await this.facade.publish();
      this.patchForm(data);
      this.saveStatus.set({ type: 'success', title: 'Published', message: 'Website settings published successfully.' });
    } catch (error) {
      this.saveStatus.set({ type: 'error', title: 'Publish Failed', message: this.resolveError(error) });
    }
  }

  closeStatus(): void {
    this.saveStatus.set(null);
  }

  setSection(section: WebSettingsSection): void {
    this.activeSection.set(section);
  }

  isSectionInvalid(section: WebSettingsSection): boolean {
    const control = this.sectionControl(section);
    return !!control && control.invalid;
  }

  addNavLink(): void {
    this.navigation.push(this.buildNavGroup({ label: '', routePath: '', linkType: 'internal', visible: true, displayOrder: this.navigation.length + 1 }));
  }

  removeNavLink(index: number): void {
    this.navigation.removeAt(index);
  }

  onPageFieldInput(index: number, field: PageFieldKey, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const value = field === 'visible' ? Boolean(input?.checked) : input?.value ?? '';
    const page = this.pages.at(index);
    const pageControl = page?.get(field);
    if (pageControl && pageControl.value !== value) {
      pageControl.setValue(value);
      pageControl.markAsDirty();
    }

    const nav = this.navigation.at(index);
    if (!nav) {
      return;
    }
    if (field === 'title') {
      nav.get('label')?.setValue(value);
      nav.get('label')?.markAsDirty();
    }
    if (field === 'routePath') {
      nav.get('routePath')?.setValue(value);
      nav.get('routePath')?.markAsDirty();
    }
    if (field === 'visible') {
      nav.get('visible')?.setValue(value);
      nav.get('visible')?.markAsDirty();
    }
  }

  addFeature(): void {
    this.features.push(this.buildFeatureGroup({
      iconKey: 'star',
      titleText: '',
      titleTextAr: '',
      titleFontSize: 32,
      descriptionText: '',
      descriptionTextAr: '',
      descriptionFontSize: 18,
      ctaLabel: 'Learn More',
      ctaLabelAr: '',
      ctaFontSize: 18,
      ctaLink: '/features',
      imageUrl: '',
      detailTitle: '',
      detailTitleAr: '',
      detailSummary: '',
      detailSummaryAr: '',
      detailContent: '',
      detailContentAr: '',
      detailImageUrl: '',
      detailEyebrow: '',
      detailEyebrowAr: '',
      detailPrimaryCtaLabel: '',
      detailPrimaryCtaLabelAr: '',
      detailPrimaryCtaLink: '/signup',
      detailSecondaryCtaLabel: '',
      detailSecondaryCtaLabelAr: '',
      detailSecondaryCtaLink: '#features',
      detailTrustText: '',
      detailTrustTextAr: '',
      detailMockTitle: '',
      detailMockTitleAr: '',
      detailMockSubtitle: '',
      detailMockSubtitleAr: '',
      detailMockMeta: '',
      detailMockMetaAr: '',
      detailMockProgressValue: '',
      detailMockProgressLabel: '',
      detailMockProgressLabelAr: '',
      detailMockStatOneLabel: '',
      detailMockStatOneLabelAr: '',
      detailMockStatOneValue: '',
      detailMockStatTwoLabel: '',
      detailMockStatTwoLabelAr: '',
      detailMockStatTwoValue: '',
      detailMockStatThreeLabel: '',
      detailMockStatThreeLabelAr: '',
      detailMockStatThreeValue: '',
      detailMockScanName: '',
      detailMockScanNameAr: '',
      detailMockScanStatus: '',
      detailMockScanStatusAr: '',
      detailSectionTitle: '',
      detailSectionTitleAr: '',
      detailSectionDescription: '',
      detailSectionDescriptionAr: '',
      detailCards: [],
      detailCtaTitle: '',
      detailCtaTitleAr: '',
      detailCtaDescription: '',
      detailCtaDescriptionAr: '',
      detailCtaButtonLabel: '',
      detailCtaButtonLabelAr: '',
      detailCtaButtonLink: '/signup',
      visible: true,
      displayOrder: this.features.length + 1,
    }));
    const nextIndex = this.features.length - 1;
    this.featureAccordionOpenByIndex.update((state) => ({ ...state, [nextIndex]: true }));
  }

  removeFeature(index: number): void {
    this.features.removeAt(index);
    this.featureAccordionOpenByIndex.update((state) => {
      const next: Record<number, boolean> = {};
      this.features.controls.forEach((_, i) => {
        const previousIndex = i >= index ? i + 1 : i;
        next[i] = i === 0 ? true : !!state[previousIndex];
      });
      return next;
    });
  }

  featureImageUploadProgress(index: number): number {
    return this.featureImageUploadProgressByIndex()[index] ?? 0;
  }

  featureImageUploading(index: number): boolean {
    return this.featureImageUploadingByIndex()[index] ?? false;
  }

  isFeatureAccordionOpen(index: number): boolean {
    const state = this.featureAccordionOpenByIndex();
    if (Object.prototype.hasOwnProperty.call(state, index)) {
      return !!state[index];
    }
    return index === 0;
  }

  toggleFeatureAccordion(index: number): void {
    this.featureAccordionOpenByIndex.update((state) => ({ ...state, [index]: !this.isFeatureAccordionOpen(index) }));
  }

  featureAccordionTitle(index: number): string {
    const title = String(this.features.at(index)?.get('titleText')?.value ?? '').trim();
    return title || `Feature ${index + 1}`;
  }

  featurePreviewUrl(index: number): string {
    const raw = String(this.features.at(index)?.get('imageUrl')?.value ?? '').trim();
    return this.resolveOwnerAssetUrl(raw);
  }

  featureDetailPreviewUrl(index: number): string {
    const raw = String(this.features.at(index)?.get('detailImageUrl')?.value ?? '').trim();
    return this.resolveOwnerAssetUrl(raw);
  }

  private resolveOwnerAssetUrl(raw: string): string {
    if (!raw) {
      return '';
    }
    if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }
    if (raw.startsWith('/')) {
      return `${this.backendOrigin}${raw}`;
    }
    return `${this.backendOrigin}/${raw}`;
  }

  heroBackgroundPreviewUrl(): string {
    const raw = String(this.form.get(['hero', 'backgroundImageUrl'])?.value ?? '').trim();
    if (!raw) {
      return '';
    }
    if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }
    if (raw.startsWith('/')) {
      return `${this.backendOrigin}${raw}`;
    }
    return `${this.backendOrigin}/${raw}`;
  }

  addOnboardingTask(): void {
    this.onboardingTasks.push(this.fb.group({ value: ['', Validators.required] }));
  }

  removeOnboardingTask(index: number): void {
    this.onboardingTasks.removeAt(index);
  }
  addMarketingStep(): void {
    this.marketingSteps.push(this.fb.group({
      step: ['', Validators.required],
      title: ['', Validators.required],
      titleAr: [''],
      description: ['', Validators.required],
      descriptionAr: [''],
    }));
  }
  removeMarketingStep(index: number): void {
    this.marketingSteps.removeAt(index);
  }
  addMarketingIntegrationItem(): void {
    this.marketingIntegrationItems.push(this.fb.group({ value: ['', Validators.required] }));
    this.marketingIntegrationItemsAr.push(this.fb.group({ value: [''] }));
    this.marketingIntegrationItemIcons.push(this.fb.group({ value: ['mail', Validators.required] }));
  }
  removeMarketingIntegrationItem(index: number): void {
    this.marketingIntegrationItems.removeAt(index);
    this.marketingIntegrationItemsAr.removeAt(index);
    this.marketingIntegrationItemIcons.removeAt(index);
  }
  addMarketingIntegrationBullet(): void {
    this.marketingIntegrationBullets.push(this.fb.group({ value: ['', Validators.required] }));
    this.marketingIntegrationBulletsAr.push(this.fb.group({ value: [''] }));
  }
  removeMarketingIntegrationBullet(index: number): void {
    this.marketingIntegrationBullets.removeAt(index);
    this.marketingIntegrationBulletsAr.removeAt(index);
  }
  addMarketingDocsVideo(): void {
    this.marketingDocsVideos.push(this.fb.group({
      title: [''],
      url: [''],
    }));
  }
  removeMarketingDocsVideo(index: number): void {
    this.marketingDocsVideos.removeAt(index);
    const firstUrl = this.marketingDocsVideos.at(0)?.get('url')?.value ?? '';
    (this.form.get(['marketing', 'docsVideoUrl']) as FormControl<string>).setValue(String(firstUrl));
  }
  addAboutPartner(): void {
    this.aboutPartners.push(this.buildAboutPartnerGroup({
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      logoUrl: '',
      websiteUrl: '',
      visible: true,
      displayOrder: this.aboutPartners.length + 1,
    }));
  }
  removeAboutPartner(index: number): void {
    this.aboutPartners.removeAt(index);
  }
  addTermsSection(): void {
    this.termsSections.push(this.buildTermsSectionGroup({
      icon: 'description',
      title: '',
      titleAr: '',
      body: '',
      bodyAr: '',
      bullets: [],
      bulletsAr: [],
      visible: true,
      displayOrder: this.termsSections.length + 1,
    }));
  }
  removeTermsSection(index: number): void {
    this.termsSections.removeAt(index);
  }
  setDocsVideoMode(index: number, mode: 'url' | 'upload'): void {
    this.docsVideoModeByIndex.update((current) => ({ ...current, [index]: mode }));
  }
  docsVideoMode(index: number): 'url' | 'upload' {
    return this.docsVideoModeByIndex()[index] ?? 'url';
  }
  docsVideoUploadProgress(index: number): number {
    return this.docsVideoUploadProgressByIndex()[index] ?? 0;
  }
  docsVideoUploading(index: number): boolean {
    return this.docsVideoUploadingByIndex()[index] ?? false;
  }
  async deleteDocsVideoAsset(index: number): Promise<void> {
    const url = String(this.marketingDocsVideos.at(index)?.get('url')?.value ?? '').trim();
    if (!url) {
      return;
    }
    const parsed = this.parseWebsiteAssetUrl(url);
    if (parsed) {
      await this.facade.deleteWebsiteAsset(parsed.section, parsed.fileName).catch(() => null);
    }
    const row = this.marketingDocsVideos.at(index);
    row?.get('url')?.setValue('');
    row?.markAsDirty();
    if (index === 0) {
      (this.form.get(['marketing', 'docsVideoUrl']) as FormControl<string>).setValue('');
    }
  }

  addTrialFeatureBullet(): void {
    this.trialFeatureBullets.push(this.fb.group({ value: ['', Validators.required] }));
  }

  removeTrialFeatureBullet(index: number): void {
    this.trialFeatureBullets.removeAt(index);
  }

  addTrialSetupStep(): void {
    this.trialSetupSteps.push(
      this.fb.group({
        label: ['', Validators.required],
        description: ['', Validators.required],
        status: ['pending', Validators.required],
      }),
    );
  }

  get promoTextControl(): FormControl<string> {
    return this.form.get(['marketing', 'promo', 'text']) as FormControl<string>;
  }

  get promoTextArControl(): FormControl<string> {
    return this.form.get(['marketing', 'promo', 'textAr']) as FormControl<string>;
  }

  onPromoEditorInput(event: Event): void {
    const html = (event.target as HTMLElement).innerHTML ?? '';
    this.promoEditorHtml.set(html);
    this.promoTextControl.setValue(html);
    this.promoTextControl.markAsDirty();
    this.promoTextControl.markAsTouched();
  }

  onPromoEditorInputAr(event: Event): void {
    const html = (event.target as HTMLElement).innerHTML ?? '';
    this.promoEditorHtmlAr.set(html);
    this.promoTextArControl.setValue(html);
    this.promoTextArControl.markAsDirty();
    this.promoTextArControl.markAsTouched();
  }

  capturePromoSelection(): void {
    this.promoEditorSelectionRange = this.captureSelectionRange('promo-rich-editor');
  }

  capturePromoSelectionAr(): void {
    this.promoEditorSelectionRangeAr = this.captureSelectionRange('promo-rich-editor-ar');
  }

  applyPromoCommand(command: string, value?: string): void {
    this.restoreSelectionRange(this.promoEditorSelectionRange, 'promo-rich-editor');
    document.execCommand(command, false, value);
    const editor = document.getElementById('promo-rich-editor');
    if (editor) {
      this.onPromoEditorInput({ target: editor } as unknown as Event);
    }
  }

  applyPromoCommandAr(command: string, value?: string): void {
    this.restoreSelectionRange(this.promoEditorSelectionRangeAr, 'promo-rich-editor-ar');
    document.execCommand(command, false, value);
    const editor = document.getElementById('promo-rich-editor-ar');
    if (editor) {
      this.onPromoEditorInputAr({ target: editor } as unknown as Event);
    }
  }

  onPromoColorPick(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    if (color) {
      this.applyPromoCommand('foreColor', color);
    }
  }

  onPromoColorPickAr(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    if (color) {
      this.applyPromoCommandAr('foreColor', color);
    }
  }

  onPromoFontSizePick(event: Event): void {
    const size = (event.target as HTMLSelectElement).value;
    if (size) {
      this.restoreSelectionRange(this.promoEditorSelectionRange, 'promo-rich-editor');
      this.applyFontSizeToSelection(size, 'promo-rich-editor');
      const editor = document.getElementById('promo-rich-editor');
      if (editor) {
        this.onPromoEditorInput({ target: editor } as unknown as Event);
      }
    }
  }

  onPromoFontSizePickAr(event: Event): void {
    const size = (event.target as HTMLSelectElement).value;
    if (size) {
      this.restoreSelectionRange(this.promoEditorSelectionRangeAr, 'promo-rich-editor-ar');
      this.applyFontSizeToSelection(size, 'promo-rich-editor-ar');
      const editor = document.getElementById('promo-rich-editor-ar');
      if (editor) {
        this.onPromoEditorInputAr({ target: editor } as unknown as Event);
      }
    }
  }

  async onDocsVideoFileSelected(event: Event, index?: number): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('video/')) {
      this.saveStatus.set({
        type: 'error',
        title: 'Invalid File',
        message: 'Please choose a video file.',
      });
      return;
    }

    const targetIndex = typeof index === 'number' ? index : this.marketingDocsVideos.length;
    if (typeof index !== 'number') {
      this.marketingDocsVideos.push(this.fb.group({
        title: [file.name.replace(/\.[^.]+$/, '') || 'Feature Video', Validators.required],
        url: [''],
      }));
    }
    this.docsVideoUploadingByIndex.update((current) => ({ ...current, [targetIndex]: true }));
    this.docsVideoUploadProgressByIndex.update((current) => ({ ...current, [targetIndex]: 0 }));
    this.facade.uploadWebsiteAssetWithProgress('feature-view', file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? file.size;
          const percent = total > 0 ? Math.round((event.loaded / total) * 100) : 0;
          this.docsVideoUploadProgressByIndex.update((current) => ({ ...current, [targetIndex]: percent }));
        }
        if (event.type === HttpEventType.Response && event.body) {
          const row = this.marketingDocsVideos.at(targetIndex);
          row?.get('url')?.setValue(event.body.url);
          if (!(row?.get('title')?.value ?? '').toString().trim()) {
            row?.get('title')?.setValue(file.name.replace(/\.[^.]+$/, '') || 'Feature Video');
          }
          const firstUrl = this.marketingDocsVideos.at(0)?.get('url')?.value ?? event.body.url;
          const control = this.form.get(['marketing', 'docsVideoUrl']) as FormControl<string>;
          control.setValue(String(firstUrl));
          control.markAsDirty();
          this.docsVideoUploadProgressByIndex.update((current) => ({ ...current, [targetIndex]: 100 }));
          this.saveStatus.set({
            type: 'success',
            title: 'Video Uploaded',
            message: 'Feature video uploaded to backend storage. Save draft and publish to apply.',
          });
        }
      },
      error: (error) => {
        this.saveStatus.set({
          type: 'error',
          title: 'Upload Failed',
          message: this.resolveError(error),
        });
        this.docsVideoUploadProgressByIndex.update((current) => ({ ...current, [targetIndex]: 0 }));
      },
      complete: () => {
        this.docsVideoUploadingByIndex.update((current) => ({ ...current, [targetIndex]: false }));
      },
    });
    try {
      // no-op: upload handled by observable above
    } finally {
      if (input) {
        input.value = '';
      }
    }
  }

  async onHeroBackgroundFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }
    this.uploadHeroBackgroundFile(file, input);
  }

  onHeroBackgroundDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.heroBackgroundDragActive.set(true);
  }

  onHeroBackgroundDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.heroBackgroundDragActive.set(false);
  }

  onHeroBackgroundDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.heroBackgroundDragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }
    this.uploadHeroBackgroundFile(file);
  }

  async deleteHeroBackgroundImage(): Promise<void> {
    const control = this.form.get(['hero', 'backgroundImageUrl']) as FormControl<string>;
    const url = String(control.value ?? '').trim();
    if (!url) {
      return;
    }
    const parsed = this.parseWebsiteAssetUrl(url);
    if (parsed) {
      await this.facade.deleteWebsiteAsset(parsed.section, parsed.fileName).catch(() => null);
    }
    control.setValue('');
    control.markAsDirty();
    this.heroBackgroundUploadProgress.set(0);
    this.heroBackgroundPreviewOpen.set(false);
    this.saveStatus.set({
      type: 'success',
      title: 'Image Removed',
      message: 'Hero background cleared. Save draft and publish to apply.',
    });
  }

  openHeroBackgroundPreview(): void {
    if (!this.heroBackgroundPreviewUrl()) {
      return;
    }
    this.heroBackgroundPreviewOpen.set(true);
  }

  closeHeroBackgroundPreview(): void {
    this.heroBackgroundPreviewOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.heroBackgroundPreviewOpen()) {
      this.closeHeroBackgroundPreview();
    }
  }

  private uploadHeroBackgroundFile(file: File, input?: HTMLInputElement | null): void {
    if (!file.type.startsWith('image/')) {
      this.saveStatus.set({
        type: 'error',
        title: 'Invalid File',
        message: 'Please choose an image file.',
      });
      return;
    }

    this.heroBackgroundUploading.set(true);
    this.heroBackgroundUploadProgress.set(0);

    this.facade.uploadWebsiteAssetWithProgress('hero-background', file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? file.size;
          const percent = total > 0 ? Math.round((event.loaded / total) * 100) : 0;
          this.heroBackgroundUploadProgress.set(percent);
        }
        if (event.type === HttpEventType.Response && event.body) {
          const control = this.form.get(['hero', 'backgroundImageUrl']) as FormControl<string>;
          control.setValue(event.body.url);
          control.markAsDirty();
          this.heroBackgroundUploadProgress.set(100);
          this.saveStatus.set({
            type: 'success',
            title: 'Image Uploaded',
            message: 'Hero background uploaded to backend storage. Save draft and publish to apply.',
          });
        }
      },
      error: (error) => {
        this.heroBackgroundUploadProgress.set(0);
        this.saveStatus.set({
          type: 'error',
          title: 'Upload Failed',
          message: this.resolveError(error),
        });
      },
      complete: () => {
        this.heroBackgroundUploading.set(false);
        if (input) {
          input.value = '';
        }
      },
    });
  }

  async onFeatureImageFileSelected(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }
    this.uploadFeatureImageFile(file, index, input);
  }

  onFeatureImageDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.featureImageDragActiveByIndex.update((s) => ({ ...s, [index]: true }));
  }

  onFeatureImageDragLeave(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.featureImageDragActiveByIndex.update((s) => ({ ...s, [index]: false }));
  }

  onFeatureImageDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.featureImageDragActiveByIndex.update((s) => ({ ...s, [index]: false }));
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }
    this.uploadFeatureImageFile(file, index);
  }

  featureImageDragActive(index: number): boolean {
    return !!this.featureImageDragActiveByIndex()[index];
  }

  featureDetailImageUploadProgress(index: number): number {
    return this.featureDetailImageUploadProgressByIndex()[index] ?? 0;
  }

  featureDetailImageUploading(index: number): boolean {
    return !!this.featureDetailImageUploadingByIndex()[index];
  }

  featureDetailImageDragActive(index: number): boolean {
    return !!this.featureDetailImageDragActiveByIndex()[index];
  }

  async onFeatureDetailImageFileSelected(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }
    this.uploadFeatureDetailImageFile(file, index, input);
  }

  onFeatureDetailImageDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.featureDetailImageDragActiveByIndex.update((s) => ({ ...s, [index]: true }));
  }

  onFeatureDetailImageDragLeave(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.featureDetailImageDragActiveByIndex.update((s) => ({ ...s, [index]: false }));
  }

  onFeatureDetailImageDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.featureDetailImageDragActiveByIndex.update((s) => ({ ...s, [index]: false }));
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }
    this.uploadFeatureDetailImageFile(file, index);
  }

  private uploadFeatureDetailImageFile(file: File, index: number, input?: HTMLInputElement | null): void {
    if (!file.type.startsWith('image/')) {
      this.saveStatus.set({
        type: 'error',
        title: 'Invalid File',
        message: 'Please choose an image file.',
      });
      return;
    }

    this.featureDetailImageUploadingByIndex.update((s) => ({ ...s, [index]: true }));
    this.featureDetailImageUploadProgressByIndex.update((s) => ({ ...s, [index]: 0 }));

    this.facade.uploadWebsiteAssetWithProgress('feature-detail', file).subscribe({
      next: (evt) => {
        if (evt.type === HttpEventType.UploadProgress) {
          const total = evt.total ?? file.size;
          const percent = total > 0 ? Math.round((evt.loaded / total) * 100) : 0;
          this.featureDetailImageUploadProgressByIndex.update((s) => ({ ...s, [index]: percent }));
        }
        if (evt.type === HttpEventType.Response && evt.body) {
          const control = this.features.at(index).get('detailImageUrl') as FormControl<string>;
          control.setValue(evt.body.url);
          control.markAsDirty();
          this.featureDetailImageUploadProgressByIndex.update((s) => ({ ...s, [index]: 100 }));
          this.saveStatus.set({
            type: 'success',
            title: 'Image Uploaded',
            message: 'Feature detail image uploaded. Save draft and publish to apply.',
          });
        }
      },
      error: (error) => {
        this.featureDetailImageUploadProgressByIndex.update((s) => ({ ...s, [index]: 0 }));
        this.saveStatus.set({
          type: 'error',
          title: 'Upload Failed',
          message: this.resolveError(error),
        });
      },
      complete: () => {
        this.featureDetailImageUploadingByIndex.update((s) => ({ ...s, [index]: false }));
        if (input) {
          input.value = '';
        }
      },
    });
  }

  private uploadFeatureImageFile(file: File, index: number, input?: HTMLInputElement | null): void {
    if (!file.type.startsWith('image/')) {
      this.saveStatus.set({
        type: 'error',
        title: 'Invalid File',
        message: 'Please choose an image file.',
      });
      return;
    }

    this.featureImageUploadingByIndex.update((s) => ({ ...s, [index]: true }));
    this.featureImageUploadProgressByIndex.update((s) => ({ ...s, [index]: 0 }));

    this.facade.uploadWebsiteAssetWithProgress('features', file).subscribe({
      next: (evt) => {
        if (evt.type === HttpEventType.UploadProgress) {
          const total = evt.total ?? file.size;
          const percent = total > 0 ? Math.round((evt.loaded / total) * 100) : 0;
          this.featureImageUploadProgressByIndex.update((s) => ({ ...s, [index]: percent }));
        }
        if (evt.type === HttpEventType.Response && evt.body) {
          const control = this.features.at(index).get('imageUrl') as FormControl<string>;
          control.setValue(evt.body.url);
          control.markAsDirty();
          this.featureImageUploadProgressByIndex.update((s) => ({ ...s, [index]: 100 }));
          this.saveStatus.set({
            type: 'success',
            title: 'Image Uploaded',
            message: 'Feature image uploaded to backend storage. Save draft and publish to apply.',
          });
        }
      },
      error: (error) => {
        this.featureImageUploadProgressByIndex.update((s) => ({ ...s, [index]: 0 }));
        this.saveStatus.set({
          type: 'error',
          title: 'Upload Failed',
          message: this.resolveError(error),
        });
      },
      complete: () => {
        this.featureImageUploadingByIndex.update((s) => ({ ...s, [index]: false }));
        if (input) {
          input.value = '';
        }
      },
    });
  }

  applyPromoBlockquote(): void {
    this.applyPromoCommand('formatBlock', 'blockquote');
  }

  applyPromoParagraph(): void {
    this.applyPromoCommand('formatBlock', 'p');
  }

  @HostListener('focusin', ['$event'])
  onFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }
    if (!target.classList.contains('owner-web-input') && !target.classList.contains('owner-web-textarea')) {
      return;
    }
    this.focusedFieldElement = target;
    this.focusedFieldLabel.set(target.getAttribute('placeholder') || target.getAttribute('formcontrolname') || 'Selected field');
  }

  @HostListener('dblclick', ['$event'])
  onFieldDoubleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }
    if (!target.classList.contains('owner-web-input') && !target.classList.contains('owner-web-textarea')) {
      return;
    }
    this.focusedFieldElement = target;
    this.focusedFieldLabel.set(target.getAttribute('placeholder') || target.getAttribute('formcontrolname') || 'Selected field');
    this.openFocusedFieldEditor();
  }

  openFocusedFieldEditor(): void {
    if (!this.focusedFieldElement) {
      this.saveStatus.set({
        type: 'error',
        title: 'No Field Selected',
        message: 'Focus any input field first, then open rich editor.',
      });
      return;
    }
    this.focusedFieldRichHtml.set(this.focusedFieldElement.value || '');
    this.focusedFieldFontSize.set(this.detectFontSize(this.focusedFieldElement.value || '') || '16px');
    this.focusedFieldEditorOpen.set(true);
  }

  onFocusedFieldEditorInput(event: Event): void {
    const html = (event.target as HTMLElement).innerHTML ?? '';
    this.focusedFieldRichHtml.set(html);
  }

  captureFocusedEditorSelection(): void {
    this.focusedEditorSelectionRange = this.captureSelectionRange('focused-field-rich-editor');
  }

  applyFocusedFieldCommand(command: string, value?: string): void {
    this.restoreSelectionRange(this.focusedEditorSelectionRange, 'focused-field-rich-editor');
    document.execCommand(command, false, value);
    const editor = document.getElementById('focused-field-rich-editor');
    if (editor) {
      this.onFocusedFieldEditorInput({ target: editor } as unknown as Event);
    }
  }

  onFocusedFieldColorPick(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    if (color) {
      this.applyFocusedFieldCommand('foreColor', color);
    }
  }

  onFocusedFieldFontSizePick(event: Event): void {
    const size = (event.target as HTMLSelectElement).value;
    if (size) {
      this.focusedFieldFontSize.set(size);
      this.applyFontSizeToEditor(size, 'focused-field-rich-editor');
      this.syncFeatureTitleFontSizeFromFocusedField(size);
      const editor = document.getElementById('focused-field-rich-editor');
      if (editor) {
        this.onFocusedFieldEditorInput({ target: editor } as unknown as Event);
        this.syncFocusedFieldValueFromEditor();
      }
    }
  }

  applyHeroRichFontSize(controlName: string, event: Event): void {
    const size = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(size) || size < 8 || size > 96) {
      return;
    }
    const control = this.form.get(['hero', controlName]) as FormControl<string | null> | null;
    if (!control) {
      return;
    }
    const current = String(control.value ?? '');
    const unwrapped = current.replace(/^<span style="font-size:\s*[^"]+;">([\s\S]*)<\/span>$/i, '$1');
    control.setValue(`<span style="font-size: ${size}px;">${unwrapped}</span>`);
    control.markAsDirty();
  }

  applyHeroRichColor(controlName: string, event: Event): void {
    const color = this.normalizeCssColor((event.target as HTMLInputElement).value);
    if (!color) {
      return;
    }
    const editor = this.heroEditors.get(controlName);
    const range = editor?.getSelection(true) ?? this.heroSelections.get(controlName) ?? null;
    if (!editor || !range || range.length === 0) {
      this.saveStatus.set({
        type: 'error',
        title: 'Select Text First',
        message: 'Highlight text inside this field, then choose a color.',
      });
      return;
    }
    editor.setSelection(range.index, range.length, 'silent');
    editor.formatText(range.index, range.length, 'color', color, 'user');
    this.heroSelections.set(controlName, range);
    this.setHeroRichColor(controlName, color);
    const control = this.form.get(['hero', controlName]) as FormControl<string | null> | null;
    if (!control) {
      return;
    }
    control.setValue(editor.root.innerHTML);
    control.markAsDirty();
  }

  registerHeroEditor(controlName: string, editor: HeroQuillEditor): void {
    this.heroEditors.set(controlName, editor);
  }

  rememberHeroSelection(controlName: string, event: QuillSelectionChangeEvent): void {
    if (event.range && event.range.length > 0) {
      this.heroSelections.set(controlName, event.range);
      const editor = this.heroEditors.get(controlName);
      const format = editor?.getFormat(event.range.index, event.range.length);
      const color = this.normalizeCssColor(String(format?.['color'] ?? ''));
      if (color) {
        this.setHeroRichColor(controlName, color);
      }
    }
  }

  heroRichColor(controlName: string): string {
    return this.heroRichColors()[controlName] ?? '#000000';
  }

  private setHeroRichColor(controlName: string, color: string): void {
    this.heroRichColors.update((colors) => ({ ...colors, [controlName]: color }));
  }

  private applyFontSizeToSelection(size: string, editorId: string): void {
    const editor = document.getElementById(editorId);
    if (!editor) {
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editor.innerHTML = `<span style="font-size: ${size};">${editor.innerHTML}</span>`;
      return;
    }
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      editor.innerHTML = `<span style="font-size: ${size};">${editor.innerHTML}</span>`;
      return;
    }
    if (!editor.contains(range.commonAncestorContainer)) {
      editor.innerHTML = `<span style="font-size: ${size};">${editor.innerHTML}</span>`;
      return;
    }

    const span = document.createElement('span');
    span.style.fontSize = size;
    try {
      range.surroundContents(span);
    } catch {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
  }

  private applyFontSizeToEditor(size: string, editorId: string): void {
    const editor = document.getElementById(editorId);
    if (!editor) {
      return;
    }
    const current = editor.innerHTML || '';
    const normalized = current.replace(/^<span style="font-size:\s*[^"]+;">([\s\S]*)<\/span>$/i, '$1');
    editor.innerHTML = `<span style="font-size: ${size};">${normalized}</span>`;
  }

  private captureSelectionRange(editorId: string): Range | null {
    const editor = document.getElementById(editorId);
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) {
      return null;
    }
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      return null;
    }
    return range.cloneRange();
  }

  private restoreSelectionRange(range: Range | null, editorId: string): void {
    if (!range) {
      return;
    }
    const editor = document.getElementById(editorId);
    const selection = window.getSelection();
    if (!editor || !selection) {
      return;
    }
    editor.focus();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  applyFocusedFieldEditor(): void {
    this.syncFocusedFieldValueFromEditor();
    this.focusedFieldEditorOpen.set(false);
  }

  private syncFocusedFieldValueFromEditor(): void {
    if (!this.focusedFieldElement) {
      return;
    }
    this.focusedFieldElement.value = this.focusedFieldRichHtml();
    this.focusedFieldElement.dispatchEvent(new Event('input', { bubbles: true }));
    this.focusedFieldElement.dispatchEvent(new Event('change', { bubbles: true }));
  }

  closeFocusedFieldEditor(): void {
    this.focusedFieldEditorOpen.set(false);
  }

  removeTrialSetupStep(index: number): void {
    this.trialSetupSteps.removeAt(index);
  }

  pricingFeaturesAt(planIndex: number): FormArray<FormGroup> {
    return this.pricingPlans.at(planIndex).get('features') as FormArray<FormGroup>;
  }

  featureDetailCardsAt(featureIndex: number): FormArray<FormGroup> {
    return this.features.at(featureIndex).get('detailCards') as FormArray<FormGroup>;
  }

  addFeatureDetailCard(featureIndex: number): void {
    const cards = this.featureDetailCardsAt(featureIndex);
    cards.push(this.buildFeatureDetailCardGroup({
      iconKey: 'check_circle',
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      displayOrder: cards.length + 1,
    }));
    cards.controls.forEach((group, index) => group.get('displayOrder')?.setValue(index + 1));
    cards.markAsDirty();
    this.features.at(featureIndex).markAsDirty();
  }

  removeFeatureDetailCard(featureIndex: number, cardIndex: number): void {
    const cards = this.featureDetailCardsAt(featureIndex);
    cards.removeAt(cardIndex);
    cards.controls.forEach((group, index) => group.get('displayOrder')?.setValue(index + 1));
  }

  addPricingFeature(planIndex: number): void {
    const arr = this.pricingFeaturesAt(planIndex);
    arr.push(this.buildPricingFeatureGroup({ featureText: '', included: true, displayOrder: arr.length + 1 }));
  }

  removePricingFeature(planIndex: number, featureIndex: number): void {
    this.pricingFeaturesAt(planIndex).removeAt(featureIndex);
  }

  private focusFirstInvalidSection(actionLabel: string): void {
    this.form.markAllAsTouched();
    const invalidSection = this.sections.find((section) => this.isSectionInvalid(section.key));
    if (invalidSection) {
      this.activeSection.set(invalidSection.key);
      const invalidDetails = this.collectInvalidControlPaths(this.sectionControl(invalidSection.key));
      const detailsText = invalidDetails.length ? ` Invalid fields: ${invalidDetails.join(', ')}` : '';
      this.saveStatus.set({
        type: 'error',
        title: 'Validation Required',
        message: `Please complete required fields in "${invalidSection.label}" before ${actionLabel}.${detailsText}`,
      });
    }
  }

  private sectionControl(section: WebSettingsSection): AbstractControl | null {
    switch (section) {
      case 'site':
        return this.form.get('siteConfig');
      case 'hero':
        return this.form.get('hero');
      case 'pages':
        return this.form.get('pages');
      case 'navigation':
        return this.form.get('navigation');
      case 'features':
        return this.form.get('features');
      case 'testimonials':
        return this.form.get('testimonials');
      case 'pricing':
        return this.form.get('pricingPlans');
      case 'ctas':
        return this.form.get('ctas');
      case 'footer':
        return this.form.get('footerLinks');
      case 'marketing':
        return this.form.get('marketing');
      case 'about':
        return this.form.get(['marketing', 'about']);
      case 'terms':
        return this.form.get(['marketing', 'terms']);
      case 'pixel':
        return this.form.get(['marketing', 'facebookPixelId']);
      case 'onboarding':
        return this.form.get('onboarding');
      case 'trial':
        return this.form.get('trialDashboard');
      default:
        return null;
    }
  }

  private patchForm(data: WebsiteSettingsView): void {
    this.form.patchValue({
      siteConfig: {
        siteName: data.siteConfig.siteName ?? '',
        supportEmail: data.siteConfig.supportEmail ?? '',
        contactPhone: data.siteConfig.contactPhone ?? '',
        primaryLocale: data.siteConfig.primaryLocale ?? 'en',
        defaultCurrency: data.siteConfig.defaultCurrency ?? 'USD',
      },
      hero: {
        badgeText: this.toQuillEditableHeroHtml(data.hero.badgeText ?? ''),
        badgeTextAr: this.toQuillEditableHeroHtml(data.hero.badgeTextAr ?? ''),
        titleText: this.toQuillEditableHeroHtml(data.hero.titleText ?? ''),
        titleTextAr: this.toQuillEditableHeroHtml(data.hero.titleTextAr ?? ''),
        descriptionText: this.toQuillEditableHeroHtml(data.hero.descriptionText ?? ''),
        descriptionTextAr: this.toQuillEditableHeroHtml(data.hero.descriptionTextAr ?? ''),
        backgroundImageUrl: data.hero.backgroundImageUrl ?? '',
        primaryCtaLabel: this.toQuillEditableHeroHtml(data.hero.primaryCtaLabel ?? ''),
        primaryCtaLabelAr: this.toQuillEditableHeroHtml(data.hero.primaryCtaLabelAr ?? ''),
        primaryCtaLink: data.hero.primaryCtaLink ?? '',
        secondaryCtaLabel: this.toQuillEditableHeroHtml(data.hero.secondaryCtaLabel ?? ''),
        secondaryCtaLabelAr: this.toQuillEditableHeroHtml(data.hero.secondaryCtaLabelAr ?? ''),
        secondaryCtaLink: data.hero.secondaryCtaLink ?? '',
        statOneValue: data.hero.statOneValue ?? '+25',
        statOneValueAr: data.hero.statOneValueAr ?? '+25',
        statOneLabel: data.hero.statOneLabel ?? 'Years Experience',
        statOneLabelAr: data.hero.statOneLabelAr ?? 'سنوات خبرة',
        statTwoValue: data.hero.statTwoValue ?? '+50',
        statTwoValueAr: data.hero.statTwoValueAr ?? '+50',
        statTwoLabel: data.hero.statTwoLabel ?? 'Global Partners',
        statTwoLabelAr: data.hero.statTwoLabelAr ?? 'شركاء عالميون',
        statThreeValue: data.hero.statThreeValue ?? '+100',
        statThreeValueAr: data.hero.statThreeValueAr ?? '+100',
        statThreeLabel: data.hero.statThreeLabel ?? 'Key Clients',
        statThreeLabelAr: data.hero.statThreeLabelAr ?? 'عملاء رئيسيون',
        statFourValue: data.hero.statFourValue ?? '6',
        statFourValueAr: data.hero.statFourValueAr ?? '6',
        statFourLabel: data.hero.statFourLabel ?? 'Continents Served',
        statFourLabelAr: data.hero.statFourLabelAr ?? 'قارات مخدومة',
        visible: data.hero.visible,
      },
      onboarding: {
        stepOneTitle: data.onboarding?.stepOneTitle ?? '',
        stepOneDescription: data.onboarding?.stepOneDescription ?? '',
        trustBadgeText: data.onboarding?.trustBadgeText ?? '',
        planSelectorBadge: data.onboarding?.planSelectorBadge ?? '',
        provisioningTitle: data.onboarding?.provisioningTitle ?? '',
        provisioningDescription: data.onboarding?.provisioningDescription ?? '',
        successTitle: data.onboarding?.successTitle ?? '',
        successDescription: data.onboarding?.successDescription ?? '',
      },
      marketing: {
        promo: {
          icon: data.marketing?.promo?.icon ?? 'campaign',
          text: this.resolvePromoLine(
            data.marketing?.promo?.text ?? '',
            data.marketing?.promo?.highlight ?? '',
            data.marketing?.promo?.suffixText ?? '',
          ),
          textAr: this.resolvePromoLine(
            data.marketing?.promo?.textAr ?? '',
            data.marketing?.promo?.highlightAr ?? '',
            data.marketing?.promo?.suffixTextAr ?? '',
          ),
          highlight: '-',
          highlightAr: '-',
          suffixText: '-',
          suffixTextAr: '-',
          ctaLabel: data.marketing?.promo?.ctaLabel ?? '',
          ctaLabelAr: data.marketing?.promo?.ctaLabelAr ?? '',
        },
        integrations: {
          title: data.marketing?.integrations?.title ?? '',
          titleAr: data.marketing?.integrations?.titleAr ?? '',
          description: data.marketing?.integrations?.description ?? '',
          descriptionAr: data.marketing?.integrations?.descriptionAr ?? '',
        },
        contact: {
          title: data.marketing?.contact?.title ?? '',
          titleAr: data.marketing?.contact?.titleAr ?? '',
          description: data.marketing?.contact?.description ?? '',
          descriptionAr: data.marketing?.contact?.descriptionAr ?? '',
          hqLabel: data.marketing?.contact?.hqLabel ?? 'Global HQ',
          hqLabelAr: data.marketing?.contact?.hqLabelAr ?? '',
          hqValue: data.marketing?.contact?.hqValue ?? '',
          hqValueAr: data.marketing?.contact?.hqValueAr ?? '',
        },
        featuresSectionTitle: data.marketing?.featuresSectionTitle ?? DEFAULT_FEATURES_SECTION_TITLE,
        featuresSectionTitleAr: data.marketing?.featuresSectionTitleAr ?? DEFAULT_FEATURES_SECTION_TITLE_AR,
        featuresSectionDescription: data.marketing?.featuresSectionDescription ?? DEFAULT_FEATURES_SECTION_DESCRIPTION,
        featuresSectionDescriptionAr: data.marketing?.featuresSectionDescriptionAr ?? DEFAULT_FEATURES_SECTION_DESCRIPTION_AR,
        pricingSectionTitle: data.marketing?.pricingSectionTitle ?? DEFAULT_PRICING_SECTION_TITLE,
        pricingSectionTitleAr: data.marketing?.pricingSectionTitleAr ?? DEFAULT_PRICING_SECTION_TITLE_AR,
        pricingSectionDescription: data.marketing?.pricingSectionDescription ?? DEFAULT_PRICING_SECTION_DESCRIPTION,
        pricingSectionDescriptionAr: data.marketing?.pricingSectionDescriptionAr ?? DEFAULT_PRICING_SECTION_DESCRIPTION_AR,
        pricingAudienceTeacherLabel: data.marketing?.pricingAudienceTeacherLabel ?? DEFAULT_PRICING_AUDIENCE_TEACHER_LABEL,
        pricingAudienceTeacherLabelAr: data.marketing?.pricingAudienceTeacherLabelAr ?? DEFAULT_PRICING_AUDIENCE_TEACHER_LABEL_AR,
        pricingAudienceCenterLabel: data.marketing?.pricingAudienceCenterLabel ?? DEFAULT_PRICING_AUDIENCE_CENTER_LABEL,
        pricingAudienceCenterLabelAr: data.marketing?.pricingAudienceCenterLabelAr ?? DEFAULT_PRICING_AUDIENCE_CENTER_LABEL_AR,
        pricingBillingAnnualLabel: data.marketing?.pricingBillingAnnualLabel ?? DEFAULT_PRICING_BILLING_ANNUAL_LABEL,
        pricingBillingAnnualLabelAr: data.marketing?.pricingBillingAnnualLabelAr ?? DEFAULT_PRICING_BILLING_ANNUAL_LABEL_AR,
        pricingBillingMonthlyLabel: data.marketing?.pricingBillingMonthlyLabel ?? DEFAULT_PRICING_BILLING_MONTHLY_LABEL,
        pricingBillingMonthlyLabelAr: data.marketing?.pricingBillingMonthlyLabelAr ?? DEFAULT_PRICING_BILLING_MONTHLY_LABEL_AR,
        trustedHeading: data.marketing?.trustedHeading ?? DEFAULT_TRUSTED_HEADING,
        trustedHeadingAr: data.marketing?.trustedHeadingAr ?? DEFAULT_TRUSTED_HEADING_AR,
        trustedDescription: data.marketing?.trustedDescription ?? DEFAULT_TRUSTED_DESCRIPTION,
        trustedDescriptionAr: data.marketing?.trustedDescriptionAr ?? DEFAULT_TRUSTED_DESCRIPTION_AR,
        trustedStatOneValue: data.marketing?.trustedStatOneValue ?? DEFAULT_TRUSTED_STAT_ONE_VALUE,
        trustedStatOneValueAr: data.marketing?.trustedStatOneValueAr ?? DEFAULT_TRUSTED_STAT_ONE_VALUE_AR,
        trustedStatOneLabel: data.marketing?.trustedStatOneLabel ?? DEFAULT_TRUSTED_STAT_ONE_LABEL,
        trustedStatOneLabelAr: data.marketing?.trustedStatOneLabelAr ?? DEFAULT_TRUSTED_STAT_ONE_LABEL_AR,
        trustedStatTwoValue: data.marketing?.trustedStatTwoValue ?? DEFAULT_TRUSTED_STAT_TWO_VALUE,
        trustedStatTwoValueAr: data.marketing?.trustedStatTwoValueAr ?? DEFAULT_TRUSTED_STAT_TWO_VALUE_AR,
        trustedStatTwoLabel: data.marketing?.trustedStatTwoLabel ?? DEFAULT_TRUSTED_STAT_TWO_LABEL,
        trustedStatTwoLabelAr: data.marketing?.trustedStatTwoLabelAr ?? DEFAULT_TRUSTED_STAT_TWO_LABEL_AR,
        trustedStatThreeValue: data.marketing?.trustedStatThreeValue ?? DEFAULT_TRUSTED_STAT_THREE_VALUE,
        trustedStatThreeValueAr: data.marketing?.trustedStatThreeValueAr ?? DEFAULT_TRUSTED_STAT_THREE_VALUE_AR,
        trustedStatThreeLabel: data.marketing?.trustedStatThreeLabel ?? DEFAULT_TRUSTED_STAT_THREE_LABEL,
        trustedStatThreeLabelAr: data.marketing?.trustedStatThreeLabelAr ?? DEFAULT_TRUSTED_STAT_THREE_LABEL_AR,
        docsVideoUrl: data.marketing?.docsVideoUrl ?? '',
        docsSectionTitle: data.marketing?.docsSectionTitle ?? DEFAULT_DOCS_SECTION_TITLE,
        docsSectionTitleAr: data.marketing?.docsSectionTitleAr ?? DEFAULT_DOCS_SECTION_TITLE_AR,
        docsSectionDescription: data.marketing?.docsSectionDescription ?? DEFAULT_DOCS_SECTION_DESCRIPTION,
        docsSectionDescriptionAr: data.marketing?.docsSectionDescriptionAr ?? DEFAULT_DOCS_SECTION_DESCRIPTION_AR,
        facebookPixelId: data.marketing?.facebookPixelId ?? '2231145617703009',
        docsVideos: [],
        about: {
          missionBadge: data.marketing?.about?.missionBadge ?? DEFAULT_ABOUT_CONTENT.missionBadge,
          missionBadgeAr: data.marketing?.about?.missionBadgeAr ?? DEFAULT_ABOUT_CONTENT.missionBadgeAr,
          heroTitle: data.marketing?.about?.heroTitle ?? DEFAULT_ABOUT_CONTENT.heroTitle,
          heroTitleAr: data.marketing?.about?.heroTitleAr ?? DEFAULT_ABOUT_CONTENT.heroTitleAr,
          heroDescription: data.marketing?.about?.heroDescription ?? DEFAULT_ABOUT_CONTENT.heroDescription,
          heroDescriptionAr: data.marketing?.about?.heroDescriptionAr ?? DEFAULT_ABOUT_CONTENT.heroDescriptionAr,
          storyTitle: data.marketing?.about?.storyTitle ?? DEFAULT_ABOUT_CONTENT.storyTitle,
          storyTitleAr: data.marketing?.about?.storyTitleAr ?? DEFAULT_ABOUT_CONTENT.storyTitleAr,
          storyLead: data.marketing?.about?.storyLead ?? DEFAULT_ABOUT_CONTENT.storyLead,
          storyLeadAr: data.marketing?.about?.storyLeadAr ?? DEFAULT_ABOUT_CONTENT.storyLeadAr,
          storyBody: data.marketing?.about?.storyBody ?? DEFAULT_ABOUT_CONTENT.storyBody,
          storyBodyAr: data.marketing?.about?.storyBodyAr ?? DEFAULT_ABOUT_CONTENT.storyBodyAr,
          imageUrl: data.marketing?.about?.imageUrl ?? DEFAULT_ABOUT_CONTENT.imageUrl,
          imageAlt: data.marketing?.about?.imageAlt ?? DEFAULT_ABOUT_CONTENT.imageAlt,
          imageAltAr: data.marketing?.about?.imageAltAr ?? DEFAULT_ABOUT_CONTENT.imageAltAr,
          valuesTitle: data.marketing?.about?.valuesTitle ?? DEFAULT_ABOUT_CONTENT.valuesTitle,
          valuesTitleAr: data.marketing?.about?.valuesTitleAr ?? DEFAULT_ABOUT_CONTENT.valuesTitleAr,
          partnersTitle: data.marketing?.about?.partnersTitle ?? DEFAULT_ABOUT_CONTENT.partnersTitle,
          partnersTitleAr: data.marketing?.about?.partnersTitleAr ?? DEFAULT_ABOUT_CONTENT.partnersTitleAr,
          partnersDescription: data.marketing?.about?.partnersDescription ?? DEFAULT_ABOUT_CONTENT.partnersDescription,
          partnersDescriptionAr: data.marketing?.about?.partnersDescriptionAr ?? DEFAULT_ABOUT_CONTENT.partnersDescriptionAr,
        },
        terms: {
          title: data.marketing?.terms?.title ?? DEFAULT_TERMS_CONTENT.title,
          titleAr: data.marketing?.terms?.titleAr ?? DEFAULT_TERMS_CONTENT.titleAr,
          lastUpdated: data.marketing?.terms?.lastUpdated ?? DEFAULT_TERMS_CONTENT.lastUpdated,
          lastUpdatedAr: data.marketing?.terms?.lastUpdatedAr ?? DEFAULT_TERMS_CONTENT.lastUpdatedAr,
          contactText: data.marketing?.terms?.contactText ?? DEFAULT_TERMS_CONTENT.contactText,
          contactTextAr: data.marketing?.terms?.contactTextAr ?? DEFAULT_TERMS_CONTENT.contactTextAr,
          contactEmail: data.marketing?.terms?.contactEmail ?? DEFAULT_TERMS_CONTENT.contactEmail,
        },
      },
      trialDashboard: {
        headerTitle: data.trialDashboard?.headerTitle ?? '',
        headerDescription: data.trialDashboard?.headerDescription ?? '',
        trialRemainingText: data.trialDashboard?.trialRemainingText ?? '',
        trialEndsText: data.trialDashboard?.trialEndsText ?? '',
      },
    });
    this.syncHeroRichColorsFromForm();

    this.resetFormArray(this.pages, data.pages.map((row) => this.buildPageGroup(row)));
    this.resetFormArray(this.navigation, data.navigation.map((row) => this.buildNavGroup(row)));
    this.resetFormArray(this.features, data.features.map((row) => this.buildFeatureGroup(row)));
    this.resetFormArray(this.testimonials, data.testimonials.map((row) => this.buildTestimonialGroup(row)));
    this.resetFormArray(this.pricingPlans, data.pricingPlans.map((row) => this.buildPricingPlanGroup(row)));
    this.resetFormArray(this.ctas, data.ctas.map((row) => this.buildCtaGroup(row)));
    this.resetFormArray(this.footerLinks, data.footerLinks.map((row) => this.buildFooterGroup(row)));
    this.resetFormArray(
      this.onboardingTasks,
      (data.onboarding?.provisioningTasks ?? []).map((task) => this.fb.group({ value: [task, Validators.required] })),
    );
    this.resetFormArray(
      this.marketingSteps,
      (data.marketing?.steps?.length ? data.marketing.steps : DEFAULT_MARKETING_STEPS).map((step, index) =>
        this.fb.group({
          step: [step.step, Validators.required],
          title: [step.title, Validators.required],
          titleAr: [step.titleAr ?? DEFAULT_MARKETING_STEPS[index]?.titleAr ?? ''],
          description: [step.description, Validators.required],
          descriptionAr: [step.descriptionAr ?? DEFAULT_MARKETING_STEPS[index]?.descriptionAr ?? ''],
        }),
      ),
    );
    this.resetFormArray(
      this.marketingIntegrationItems,
      (data.marketing?.integrations?.items?.length ? data.marketing.integrations.items : ['Institutional Email']).map((item) => this.fb.group({ value: [item, Validators.required] })),
    );
    this.resetFormArray(
      this.marketingIntegrationItemsAr,
      (data.marketing?.integrations?.items?.length ? data.marketing.integrations.items : ['Institutional Email']).map((_, index) =>
        this.fb.group({ value: [data.marketing?.integrations?.itemsAr?.[index] ?? ''] }),
      ),
    );
    this.resetFormArray(
      this.marketingIntegrationItemIcons,
      (
        data.marketing?.integrations?.itemIcons?.length
          ? data.marketing.integrations.itemIcons
          : (data.marketing?.integrations?.items?.length ? data.marketing.integrations.items : ['Institutional Email']).map((_, index) =>
              index === 0 ? 'mail' : index === 1 ? 'account_balance' : 'calendar_month',
            )
      ).map((item) =>
        this.fb.group({ value: [item, Validators.required] }),
      ),
    );
    this.resetFormArray(
      this.marketingIntegrationBullets,
      (data.marketing?.integrations?.bullets?.length ? data.marketing.integrations.bullets : ['Open API for custom integrations']).map((item) => this.fb.group({ value: [item, Validators.required] })),
    );
    this.resetFormArray(
      this.marketingIntegrationBulletsAr,
      (data.marketing?.integrations?.bullets?.length ? data.marketing.integrations.bullets : ['Open API for custom integrations']).map((_, index) =>
        this.fb.group({ value: [data.marketing?.integrations?.bulletsAr?.[index] ?? ''] }),
      ),
    );
    this.resetFormArray(
      this.marketingDocsVideos,
      (
        data.marketing?.docsVideos?.length
          ? data.marketing.docsVideos
          : (data.marketing?.docsVideoUrl ? [{ title: 'Feature Video', url: data.marketing.docsVideoUrl }] : [])
      ).map((row) =>
        this.fb.group({
          title: [row.title ?? 'Feature Video'],
          url: [row.url ?? ''],
        }),
      ),
    );
    this.resetFormArray(
      this.aboutPartners,
      (data.marketing?.about?.partners?.length ? data.marketing.about.partners : DEFAULT_ABOUT_PARTNERS)
        .map((partner, index) => this.buildAboutPartnerGroup({ ...partner, displayOrder: partner.displayOrder ?? index + 1 })),
    );
    this.resetFormArray(
      this.termsSections,
      (data.marketing?.terms?.sections?.length ? data.marketing.terms.sections : DEFAULT_TERMS_SECTIONS)
        .map((section, index) => this.buildTermsSectionGroup({ ...section, displayOrder: section.displayOrder ?? index + 1 })),
    );
    this.resetFormArray(
      this.trialFeatureBullets,
      (data.trialDashboard?.trialFeatureBullets ?? []).map((item) => this.fb.group({ value: [item, Validators.required] })),
    );
    this.resetFormArray(
      this.trialSetupSteps,
      (data.trialDashboard?.setupSteps ?? []).map((step) =>
        this.fb.group({
          label: [step.label, Validators.required],
          description: [step.description, Validators.required],
          status: [step.status, Validators.required],
        }),
      ),
    );
    this.promoEditorHtml.set((this.promoTextControl.value ?? '').toString());
    this.promoEditorHtmlAr.set((this.promoTextArControl.value ?? '').toString());
  }

  private resetFormArray(target: FormArray<FormGroup>, groups: FormGroup[]): void {
    target.clear();
    for (const group of groups) {
      target.push(group);
    }
  }

  private buildPageGroup(row: SaveWebsiteSettingsRequest['pages'][number]): FormGroup {
    return this.fb.group({
      pageKey: [row.pageKey, Validators.required],
      title: [row.title, Validators.required],
      titleAr: [row.titleAr ?? ''],
      routePath: [row.routePath, Validators.required],
      visible: [row.visible],
      displayOrder: [row.displayOrder],
    });
  }

  private buildNavGroup(row: SaveWebsiteSettingsRequest['navigation'][number]): FormGroup {
    return this.fb.group({
      label: [row.label, Validators.required],
      routePath: [row.routePath, Validators.required],
      linkType: [row.linkType, Validators.required],
      visible: [row.visible],
      displayOrder: [row.displayOrder],
    });
  }

  private buildFeatureGroup(row: SaveWebsiteSettingsRequest['features'][number]): FormGroup {
    return this.fb.group({
      iconKey: [row.iconKey, Validators.required],
      titleText: [row.titleText, Validators.required],
      titleTextAr: [row.titleTextAr ?? ''],
      titleFontSize: [row.titleFontSize ?? this.detectFontSize(row.titleText) ?? 32],
      descriptionText: [row.descriptionText ?? ''],
      descriptionTextAr: [row.descriptionTextAr ?? ''],
      descriptionFontSize: [row.descriptionFontSize ?? this.detectFontSize(row.descriptionText ?? '') ?? 18],
      ctaLabel: [row.ctaLabel ?? ''],
      ctaLabelAr: [row.ctaLabelAr ?? ''],
      ctaFontSize: [row.ctaFontSize ?? 18],
      ctaLink: [row.ctaLink ?? ''],
      imageUrl: [row.imageUrl ?? ''],
      detailTitle: [row.detailTitle ?? ''],
      detailTitleAr: [row.detailTitleAr ?? ''],
      detailSummary: [row.detailSummary ?? ''],
      detailSummaryAr: [row.detailSummaryAr ?? ''],
      detailContent: [row.detailContent ?? ''],
      detailContentAr: [row.detailContentAr ?? ''],
      detailImageUrl: [row.detailImageUrl ?? ''],
      detailEyebrow: [row.detailEyebrow ?? ''],
      detailEyebrowAr: [row.detailEyebrowAr ?? ''],
      detailPrimaryCtaLabel: [row.detailPrimaryCtaLabel ?? ''],
      detailPrimaryCtaLabelAr: [row.detailPrimaryCtaLabelAr ?? ''],
      detailPrimaryCtaLink: [row.detailPrimaryCtaLink ?? '/signup'],
      detailSecondaryCtaLabel: [row.detailSecondaryCtaLabel ?? ''],
      detailSecondaryCtaLabelAr: [row.detailSecondaryCtaLabelAr ?? ''],
      detailSecondaryCtaLink: [row.detailSecondaryCtaLink ?? '#features'],
      detailTrustText: [row.detailTrustText ?? ''],
      detailTrustTextAr: [row.detailTrustTextAr ?? ''],
      detailMockTitle: [row.detailMockTitle ?? ''],
      detailMockTitleAr: [row.detailMockTitleAr ?? ''],
      detailMockSubtitle: [row.detailMockSubtitle ?? ''],
      detailMockSubtitleAr: [row.detailMockSubtitleAr ?? ''],
      detailMockMeta: [row.detailMockMeta ?? ''],
      detailMockMetaAr: [row.detailMockMetaAr ?? ''],
      detailMockProgressValue: [row.detailMockProgressValue ?? ''],
      detailMockProgressLabel: [row.detailMockProgressLabel ?? ''],
      detailMockProgressLabelAr: [row.detailMockProgressLabelAr ?? ''],
      detailMockStatOneLabel: [row.detailMockStatOneLabel ?? ''],
      detailMockStatOneLabelAr: [row.detailMockStatOneLabelAr ?? ''],
      detailMockStatOneValue: [row.detailMockStatOneValue ?? ''],
      detailMockStatTwoLabel: [row.detailMockStatTwoLabel ?? ''],
      detailMockStatTwoLabelAr: [row.detailMockStatTwoLabelAr ?? ''],
      detailMockStatTwoValue: [row.detailMockStatTwoValue ?? ''],
      detailMockStatThreeLabel: [row.detailMockStatThreeLabel ?? ''],
      detailMockStatThreeLabelAr: [row.detailMockStatThreeLabelAr ?? ''],
      detailMockStatThreeValue: [row.detailMockStatThreeValue ?? ''],
      detailMockScanName: [row.detailMockScanName ?? ''],
      detailMockScanNameAr: [row.detailMockScanNameAr ?? ''],
      detailMockScanStatus: [row.detailMockScanStatus ?? ''],
      detailMockScanStatusAr: [row.detailMockScanStatusAr ?? ''],
      detailSectionTitle: [row.detailSectionTitle ?? ''],
      detailSectionTitleAr: [row.detailSectionTitleAr ?? ''],
      detailSectionDescription: [row.detailSectionDescription ?? ''],
      detailSectionDescriptionAr: [row.detailSectionDescriptionAr ?? ''],
      detailCards: this.fb.array((row.detailCards ?? []).map((card) => this.buildFeatureDetailCardGroup(card))),
      detailCtaTitle: [row.detailCtaTitle ?? ''],
      detailCtaTitleAr: [row.detailCtaTitleAr ?? ''],
      detailCtaDescription: [row.detailCtaDescription ?? ''],
      detailCtaDescriptionAr: [row.detailCtaDescriptionAr ?? ''],
      detailCtaButtonLabel: [row.detailCtaButtonLabel ?? ''],
      detailCtaButtonLabelAr: [row.detailCtaButtonLabelAr ?? ''],
      detailCtaButtonLink: [row.detailCtaButtonLink ?? '/signup'],
      visible: [row.visible],
      displayOrder: [row.displayOrder],
    });
  }

  private buildFeatureDetailCardGroup(row: NonNullable<SaveWebsiteSettingsRequest['features'][number]['detailCards']>[number]): FormGroup {
    return this.fb.group({
      iconKey: [row.iconKey ?? 'check_circle'],
      title: [row.title ?? ''],
      titleAr: [row.titleAr ?? ''],
      description: [row.description ?? ''],
      descriptionAr: [row.descriptionAr ?? ''],
      displayOrder: [row.displayOrder ?? 1],
    });
  }

  private buildFeatureDetailCardsPayload(
    featureIndex: number,
    fallbackCards: NonNullable<SaveWebsiteSettingsRequest['features'][number]['detailCards']> = [],
  ): NonNullable<SaveWebsiteSettingsRequest['features'][number]['detailCards']> {
    return this.featureDetailCardsAt(featureIndex).controls.map((cardGroup, cardIndex) => {
      const fallback = fallbackCards[cardIndex] ?? {};
      return {
        iconKey: String(cardGroup.get('iconKey')?.value ?? fallback.iconKey ?? 'check_circle').trim() || 'check_circle',
        title: this.stripHtmlToText(String(cardGroup.get('title')?.value ?? fallback.title ?? '')).trim(),
        titleAr: this.stripHtmlToText(String(cardGroup.get('titleAr')?.value ?? fallback.titleAr ?? '')).trim(),
        description: this.normalizeRichHtml(String(cardGroup.get('description')?.value ?? fallback.description ?? '')),
        descriptionAr: this.normalizeRichHtml(String(cardGroup.get('descriptionAr')?.value ?? fallback.descriptionAr ?? '')),
        displayOrder: Number(cardGroup.get('displayOrder')?.value ?? fallback.displayOrder ?? cardIndex + 1),
      };
    });
  }

  private buildTestimonialGroup(row: SaveWebsiteSettingsRequest['testimonials'][number]): FormGroup {
    return this.fb.group({
      quoteText: [row.quoteText, Validators.required],
      quoteTextAr: [row.quoteTextAr ?? ''],
      authorName: [row.authorName, Validators.required],
      authorNameAr: [row.authorNameAr ?? ''],
      authorRole: [row.authorRole ?? ''],
      authorRoleAr: [row.authorRoleAr ?? ''],
      avatarUrl: [row.avatarUrl ?? ''],
      visible: [row.visible],
      displayOrder: [row.displayOrder],
    });
  }

  private buildPricingFeatureGroup(row: SaveWebsiteSettingsRequest['pricingPlans'][number]['features'][number]): FormGroup {
    return this.fb.group({
      featureText: [row.featureText, Validators.required],
      included: [row.included],
      displayOrder: [row.displayOrder],
    });
  }

  private buildPricingPlanGroup(row: SaveWebsiteSettingsRequest['pricingPlans'][number]): FormGroup {
    return this.fb.group({
      planKey: [row.planKey, Validators.required],
      nameText: [row.nameText, Validators.required],
      subtitleText: [row.subtitleText ?? ''],
      priceText: [row.priceText, Validators.required],
      ctaLabel: [row.ctaLabel ?? ''],
      badgeLabel: [row.badgeLabel ?? ''],
      visible: [row.visible],
      displayOrder: [row.displayOrder],
      features: this.fb.array((row.features ?? []).map((feature) => this.buildPricingFeatureGroup(feature))),
    });
  }

  private buildCtaGroup(row: SaveWebsiteSettingsRequest['ctas'][number]): FormGroup {
    return this.fb.group({
      ctaKey: [row.ctaKey, Validators.required],
      titleText: [row.titleText, Validators.required],
      titleTextAr: [(row as { titleTextAr?: string | null }).titleTextAr ?? ''],
      descriptionText: [row.descriptionText ?? ''],
      descriptionTextAr: [(row as { descriptionTextAr?: string | null }).descriptionTextAr ?? ''],
      buttonLabel: [row.buttonLabel ?? ''],
      buttonLabelAr: [(row as { buttonLabelAr?: string | null }).buttonLabelAr ?? ''],
      buttonLink: [row.buttonLink ?? ''],
      visible: [row.visible],
      displayOrder: [row.displayOrder],
    });
  }

  private buildFooterGroup(row: SaveWebsiteSettingsRequest['footerLinks'][number]): FormGroup {
    return this.fb.group({
      sectionTitle: [row.sectionTitle, Validators.required],
      sectionTitleAr: [this.normalizeFooterSectionAr(row.sectionTitle, row.label, (row as { sectionTitleAr?: string | null }).sectionTitleAr)],
      label: [row.label, Validators.required],
      labelAr: [this.normalizeFooterLabelAr(row.label, (row as { labelAr?: string | null }).labelAr)],
      routePath: [row.routePath, Validators.required],
      visible: [row.visible],
      displayOrder: [row.displayOrder],
    });
  }

  private buildAboutPartnerGroup(row: NonNullable<SaveWebsiteSettingsRequest['marketing']['about']>['partners'][number]): FormGroup {
    return this.fb.group({
      name: [row.name ?? '', Validators.required],
      nameAr: [row.nameAr ?? ''],
      description: [row.description ?? ''],
      descriptionAr: [row.descriptionAr ?? ''],
      logoUrl: [row.logoUrl ?? ''],
      websiteUrl: [row.websiteUrl ?? ''],
      visible: [row.visible ?? true],
      displayOrder: [row.displayOrder ?? this.aboutPartners.length + 1],
    });
  }

  private buildTermsSectionGroup(row: NonNullable<SaveWebsiteSettingsRequest['marketing']['terms']>['sections'][number]): FormGroup {
    return this.fb.group({
      icon: [row.icon ?? 'description'],
      title: [row.title ?? '', Validators.required],
      titleAr: [row.titleAr ?? ''],
      body: [row.body ?? ''],
      bodyAr: [row.bodyAr ?? ''],
      bullets: [(row.bullets ?? []).join('\n')],
      bulletsAr: [(row.bulletsAr ?? []).join('\n')],
      visible: [row.visible ?? true],
      displayOrder: [row.displayOrder ?? this.termsSections.length + 1],
    });
  }

  private normalizeFooterSectionAr(sectionTitle: string | null | undefined, label: string | null | undefined, value: string | null | undefined): string {
    const raw = String(value ?? '').trim();
    const mapped = this.footerSectionArabicFallback(sectionTitle);
    if (!raw) {
      return mapped;
    }
    if (this.looksLikeRoute(raw) || raw === this.footerLabelArabicFallback(label)) {
      return mapped;
    }
    return raw;
  }

  private normalizeFooterLabelAr(label: string | null | undefined, value: string | null | undefined): string {
    const raw = String(value ?? '').trim();
    if (!raw || this.looksLikeRoute(raw)) {
      return this.footerLabelArabicFallback(label);
    }
    return raw;
  }

  private looksLikeRoute(value: string): boolean {
    return value.startsWith('#') || value.startsWith('/') || value.endsWith('#');
  }

  private footerSectionArabicFallback(sectionTitle: string | null | undefined): string {
    const map: Record<string, string> = {
      Product: 'المنتج',
      Solutions: 'الحلول',
      Company: 'الشركة',
      Support: 'الدعم',
      Legal: 'القانوني',
    };
    return map[String(sectionTitle ?? '').trim()] ?? '';
  }

  private footerLabelArabicFallback(label: string | null | undefined): string {
    const map: Record<string, string> = {
      LMS: 'نظام التعلم',
      Analytics: 'التحليلات',
      Finance: 'المالية',
      'Private Centers': 'المراكز الخاصة',
      Franchises: 'الامتيازات',
      Universities: 'الجامعات',
      'About Us': 'من نحن',
      Careers: 'الوظائف',
      News: 'الأخبار',
      'Help Center': 'مركز المساعدة',
      Documentation: 'التوثيق',
      'API Reference': 'مرجع API',
      Status: 'الحالة',
      'Privacy Policy': 'سياسة الخصوصية',
      'Terms of Service': 'شروط الخدمة',
    };
    return map[String(label ?? '').trim()] ?? '';
  }

  private buildPayload(): SaveWebsiteSettingsRequest {
    const raw = this.form.getRawValue();
    const normalizedFeatures = this.features.controls.map((group, index) => {
      const fallback = (raw.features?.[index] ?? {}) as Partial<SaveWebsiteSettingsRequest['features'][number]>;
      const titleTextRaw = String(group.get('titleText')?.value ?? fallback.titleText ?? '');
      const fontSizeControl = group.get('titleFontSize')?.value as number | string | null | undefined;
      const detected = this.detectFontSize(titleTextRaw);
      const detectedNum = detected ? Number.parseInt(detected.replace('px', ''), 10) : null;
      return {
        iconKey: String(group.get('iconKey')?.value ?? fallback.iconKey ?? '').trim(),
        titleText: this.stripHtmlToText(titleTextRaw),
        titleTextAr: this.stripHtmlToText(String(group.get('titleTextAr')?.value ?? (fallback as { titleTextAr?: string | null }).titleTextAr ?? '')).trim(),
        titleFontSize: this.normalizeFontSize(fontSizeControl ?? detectedNum),
        descriptionText: this.normalizeRichHtml(String(group.get('descriptionText')?.value ?? fallback.descriptionText ?? '')),
        descriptionTextAr: this.normalizeRichHtml(String(group.get('descriptionTextAr')?.value ?? (fallback as { descriptionTextAr?: string | null }).descriptionTextAr ?? '')),
        descriptionFontSize: this.normalizeFontSize(
          (group.get('descriptionFontSize')?.value as number | string | null | undefined)
            ?? this.detectFontSize(String(group.get('descriptionText')?.value ?? fallback.descriptionText ?? ''))?.replace('px', '')
            ?? (fallback as { descriptionFontSize?: number | null }).descriptionFontSize
            ?? 18,
        ),
        ctaLabel: String(group.get('ctaLabel')?.value ?? fallback.ctaLabel ?? '').trim(),
        ctaLabelAr: String(group.get('ctaLabelAr')?.value ?? (fallback as { ctaLabelAr?: string | null }).ctaLabelAr ?? '').trim(),
        ctaFontSize: this.normalizeFontSize(
          (group.get('ctaFontSize')?.value as number | string | null | undefined)
            ?? (fallback as { ctaFontSize?: number | null }).ctaFontSize
            ?? 18,
        ),
        ctaLink: String(group.get('ctaLink')?.value ?? fallback.ctaLink ?? '').trim(),
        imageUrl: String(group.get('imageUrl')?.value ?? (fallback as { imageUrl?: string | null }).imageUrl ?? '').trim(),
        detailTitle: this.stripHtmlToText(String(group.get('detailTitle')?.value ?? (fallback as { detailTitle?: string | null }).detailTitle ?? '')).trim(),
        detailTitleAr: this.stripHtmlToText(String(group.get('detailTitleAr')?.value ?? (fallback as { detailTitleAr?: string | null }).detailTitleAr ?? '')).trim(),
        detailSummary: this.normalizeRichHtml(String(group.get('detailSummary')?.value ?? (fallback as { detailSummary?: string | null }).detailSummary ?? '')),
        detailSummaryAr: this.normalizeRichHtml(String(group.get('detailSummaryAr')?.value ?? (fallback as { detailSummaryAr?: string | null }).detailSummaryAr ?? '')),
        detailContent: this.normalizeRichHtml(String(group.get('detailContent')?.value ?? (fallback as { detailContent?: string | null }).detailContent ?? '')),
        detailContentAr: this.normalizeRichHtml(String(group.get('detailContentAr')?.value ?? (fallback as { detailContentAr?: string | null }).detailContentAr ?? '')),
        detailImageUrl: String(group.get('detailImageUrl')?.value ?? (fallback as { detailImageUrl?: string | null }).detailImageUrl ?? '').trim(),
        detailEyebrow: this.stripHtmlToText(String(group.get('detailEyebrow')?.value ?? fallback.detailEyebrow ?? '')).trim(),
        detailEyebrowAr: this.stripHtmlToText(String(group.get('detailEyebrowAr')?.value ?? fallback.detailEyebrowAr ?? '')).trim(),
        detailPrimaryCtaLabel: String(group.get('detailPrimaryCtaLabel')?.value ?? fallback.detailPrimaryCtaLabel ?? '').trim(),
        detailPrimaryCtaLabelAr: String(group.get('detailPrimaryCtaLabelAr')?.value ?? fallback.detailPrimaryCtaLabelAr ?? '').trim(),
        detailPrimaryCtaLink: String(group.get('detailPrimaryCtaLink')?.value ?? fallback.detailPrimaryCtaLink ?? '').trim(),
        detailSecondaryCtaLabel: String(group.get('detailSecondaryCtaLabel')?.value ?? fallback.detailSecondaryCtaLabel ?? '').trim(),
        detailSecondaryCtaLabelAr: String(group.get('detailSecondaryCtaLabelAr')?.value ?? fallback.detailSecondaryCtaLabelAr ?? '').trim(),
        detailSecondaryCtaLink: String(group.get('detailSecondaryCtaLink')?.value ?? fallback.detailSecondaryCtaLink ?? '').trim(),
        detailTrustText: this.stripHtmlToText(String(group.get('detailTrustText')?.value ?? fallback.detailTrustText ?? '')).trim(),
        detailTrustTextAr: this.stripHtmlToText(String(group.get('detailTrustTextAr')?.value ?? fallback.detailTrustTextAr ?? '')).trim(),
        detailMockTitle: this.stripHtmlToText(String(group.get('detailMockTitle')?.value ?? fallback.detailMockTitle ?? '')).trim(),
        detailMockTitleAr: this.stripHtmlToText(String(group.get('detailMockTitleAr')?.value ?? fallback.detailMockTitleAr ?? '')).trim(),
        detailMockSubtitle: this.stripHtmlToText(String(group.get('detailMockSubtitle')?.value ?? fallback.detailMockSubtitle ?? '')).trim(),
        detailMockSubtitleAr: this.stripHtmlToText(String(group.get('detailMockSubtitleAr')?.value ?? fallback.detailMockSubtitleAr ?? '')).trim(),
        detailMockMeta: this.stripHtmlToText(String(group.get('detailMockMeta')?.value ?? fallback.detailMockMeta ?? '')).trim(),
        detailMockMetaAr: this.stripHtmlToText(String(group.get('detailMockMetaAr')?.value ?? fallback.detailMockMetaAr ?? '')).trim(),
        detailMockProgressValue: String(group.get('detailMockProgressValue')?.value ?? fallback.detailMockProgressValue ?? '').trim(),
        detailMockProgressLabel: this.stripHtmlToText(String(group.get('detailMockProgressLabel')?.value ?? fallback.detailMockProgressLabel ?? '')).trim(),
        detailMockProgressLabelAr: this.stripHtmlToText(String(group.get('detailMockProgressLabelAr')?.value ?? fallback.detailMockProgressLabelAr ?? '')).trim(),
        detailMockStatOneLabel: this.stripHtmlToText(String(group.get('detailMockStatOneLabel')?.value ?? fallback.detailMockStatOneLabel ?? '')).trim(),
        detailMockStatOneLabelAr: this.stripHtmlToText(String(group.get('detailMockStatOneLabelAr')?.value ?? fallback.detailMockStatOneLabelAr ?? '')).trim(),
        detailMockStatOneValue: String(group.get('detailMockStatOneValue')?.value ?? fallback.detailMockStatOneValue ?? '').trim(),
        detailMockStatTwoLabel: this.stripHtmlToText(String(group.get('detailMockStatTwoLabel')?.value ?? fallback.detailMockStatTwoLabel ?? '')).trim(),
        detailMockStatTwoLabelAr: this.stripHtmlToText(String(group.get('detailMockStatTwoLabelAr')?.value ?? fallback.detailMockStatTwoLabelAr ?? '')).trim(),
        detailMockStatTwoValue: String(group.get('detailMockStatTwoValue')?.value ?? fallback.detailMockStatTwoValue ?? '').trim(),
        detailMockStatThreeLabel: this.stripHtmlToText(String(group.get('detailMockStatThreeLabel')?.value ?? fallback.detailMockStatThreeLabel ?? '')).trim(),
        detailMockStatThreeLabelAr: this.stripHtmlToText(String(group.get('detailMockStatThreeLabelAr')?.value ?? fallback.detailMockStatThreeLabelAr ?? '')).trim(),
        detailMockStatThreeValue: String(group.get('detailMockStatThreeValue')?.value ?? fallback.detailMockStatThreeValue ?? '').trim(),
        detailMockScanName: this.stripHtmlToText(String(group.get('detailMockScanName')?.value ?? fallback.detailMockScanName ?? '')).trim(),
        detailMockScanNameAr: this.stripHtmlToText(String(group.get('detailMockScanNameAr')?.value ?? fallback.detailMockScanNameAr ?? '')).trim(),
        detailMockScanStatus: this.stripHtmlToText(String(group.get('detailMockScanStatus')?.value ?? fallback.detailMockScanStatus ?? '')).trim(),
        detailMockScanStatusAr: this.stripHtmlToText(String(group.get('detailMockScanStatusAr')?.value ?? fallback.detailMockScanStatusAr ?? '')).trim(),
        detailSectionTitle: this.stripHtmlToText(String(group.get('detailSectionTitle')?.value ?? fallback.detailSectionTitle ?? '')).trim(),
        detailSectionTitleAr: this.stripHtmlToText(String(group.get('detailSectionTitleAr')?.value ?? fallback.detailSectionTitleAr ?? '')).trim(),
        detailSectionDescription: this.normalizeRichHtml(String(group.get('detailSectionDescription')?.value ?? fallback.detailSectionDescription ?? '')),
        detailSectionDescriptionAr: this.normalizeRichHtml(String(group.get('detailSectionDescriptionAr')?.value ?? fallback.detailSectionDescriptionAr ?? '')),
        detailCards: this.buildFeatureDetailCardsPayload(index, fallback.detailCards ?? []),
        detailCtaTitle: this.stripHtmlToText(String(group.get('detailCtaTitle')?.value ?? fallback.detailCtaTitle ?? '')).trim(),
        detailCtaTitleAr: this.stripHtmlToText(String(group.get('detailCtaTitleAr')?.value ?? fallback.detailCtaTitleAr ?? '')).trim(),
        detailCtaDescription: this.normalizeRichHtml(String(group.get('detailCtaDescription')?.value ?? fallback.detailCtaDescription ?? '')),
        detailCtaDescriptionAr: this.normalizeRichHtml(String(group.get('detailCtaDescriptionAr')?.value ?? fallback.detailCtaDescriptionAr ?? '')),
        detailCtaButtonLabel: String(group.get('detailCtaButtonLabel')?.value ?? fallback.detailCtaButtonLabel ?? '').trim(),
        detailCtaButtonLabelAr: String(group.get('detailCtaButtonLabelAr')?.value ?? fallback.detailCtaButtonLabelAr ?? '').trim(),
        detailCtaButtonLink: String(group.get('detailCtaButtonLink')?.value ?? fallback.detailCtaButtonLink ?? '').trim(),
        visible: Boolean(group.get('visible')?.value ?? fallback.visible ?? true),
        displayOrder: Number(group.get('displayOrder')?.value ?? fallback.displayOrder ?? index + 1),
      };
    });
    const heroRaw = raw.hero;
    const heroPayload: SaveWebsiteSettingsRequest['hero'] = {
      badgeText: this.normalizeHeroRichHtml(heroRaw?.badgeText ?? ''),
      badgeTextAr: this.normalizeHeroRichHtml(heroRaw?.badgeTextAr ?? ''),
      titleText: this.normalizeHeroRichHtml(heroRaw?.titleText ?? ''),
      titleTextAr: this.normalizeHeroRichHtml(heroRaw?.titleTextAr ?? ''),
      descriptionText: this.normalizeHeroRichHtml(heroRaw?.descriptionText ?? ''),
      descriptionTextAr: this.normalizeHeroRichHtml(heroRaw?.descriptionTextAr ?? ''),
      backgroundImageUrl: String(heroRaw?.backgroundImageUrl ?? '').trim(),
      primaryCtaLabel: this.normalizeHeroRichHtml(heroRaw?.primaryCtaLabel ?? ''),
      primaryCtaLabelAr: this.normalizeHeroRichHtml(heroRaw?.primaryCtaLabelAr ?? ''),
      primaryCtaLink: String(heroRaw?.primaryCtaLink ?? '').trim(),
      secondaryCtaLabel: this.normalizeHeroRichHtml(heroRaw?.secondaryCtaLabel ?? ''),
      secondaryCtaLabelAr: this.normalizeHeroRichHtml(heroRaw?.secondaryCtaLabelAr ?? ''),
      secondaryCtaLink: String(heroRaw?.secondaryCtaLink ?? '').trim(),
      statOneValue: String(heroRaw?.statOneValue ?? '').trim(),
      statOneValueAr: String(heroRaw?.statOneValueAr ?? '').trim(),
      statOneLabel: String(heroRaw?.statOneLabel ?? '').trim(),
      statOneLabelAr: String(heroRaw?.statOneLabelAr ?? '').trim(),
      statTwoValue: String(heroRaw?.statTwoValue ?? '').trim(),
      statTwoValueAr: String(heroRaw?.statTwoValueAr ?? '').trim(),
      statTwoLabel: String(heroRaw?.statTwoLabel ?? '').trim(),
      statTwoLabelAr: String(heroRaw?.statTwoLabelAr ?? '').trim(),
      statThreeValue: String(heroRaw?.statThreeValue ?? '').trim(),
      statThreeValueAr: String(heroRaw?.statThreeValueAr ?? '').trim(),
      statThreeLabel: String(heroRaw?.statThreeLabel ?? '').trim(),
      statThreeLabelAr: String(heroRaw?.statThreeLabelAr ?? '').trim(),
      statFourValue: String(heroRaw?.statFourValue ?? '').trim(),
      statFourValueAr: String(heroRaw?.statFourValueAr ?? '').trim(),
      statFourLabel: String(heroRaw?.statFourLabel ?? '').trim(),
      statFourLabelAr: String(heroRaw?.statFourLabelAr ?? '').trim(),
      visible: Boolean(heroRaw?.visible ?? true),
    };
    const pagePayload: SaveWebsiteSettingsRequest['pages'] = this.pages.controls.map((group, index) => ({
      pageKey: String(group.get('pageKey')?.value ?? '').trim(),
      title: String(group.get('title')?.value ?? '').trim(),
      titleAr: String(group.get('titleAr')?.value ?? '').trim(),
      routePath: String(group.get('routePath')?.value ?? '').trim(),
      visible: Boolean(group.get('visible')?.value ?? true),
      displayOrder: Number(group.get('displayOrder')?.value ?? index + 1),
    }));
    const navigationPayload: SaveWebsiteSettingsRequest['navigation'] = pagePayload.map((page) => ({
      label: page.title,
      routePath: page.routePath,
      linkType: 'internal',
      visible: page.visible,
      displayOrder: page.displayOrder,
    }));

    return {
      siteConfig: raw.siteConfig as SaveWebsiteSettingsRequest['siteConfig'],
      hero: heroPayload,
      pages: pagePayload,
      navigation: navigationPayload,
      features: normalizedFeatures,
      testimonials: (raw.testimonials ?? []) as SaveWebsiteSettingsRequest['testimonials'],
      pricingPlans: (raw.pricingPlans ?? []) as SaveWebsiteSettingsRequest['pricingPlans'],
      ctas: (raw.ctas ?? []) as SaveWebsiteSettingsRequest['ctas'],
      footerLinks: ((raw.footerLinks ?? []) as SaveWebsiteSettingsRequest['footerLinks']).map((row, index) => ({
        sectionTitle: String(row.sectionTitle ?? '').trim(),
        sectionTitleAr: this.normalizeFooterSectionAr(row.sectionTitle, row.label, (row as { sectionTitleAr?: string | null }).sectionTitleAr),
        label: String(row.label ?? '').trim(),
        labelAr: this.normalizeFooterLabelAr(row.label, (row as { labelAr?: string | null }).labelAr),
        routePath: String(row.routePath ?? '').trim(),
        visible: Boolean(row.visible ?? true),
        displayOrder: Number(row.displayOrder ?? index + 1),
      })),
      marketing: {
        promo: {
          icon: String(raw.marketing?.promo?.icon ?? '').trim(),
          text: String(raw.marketing?.promo?.text ?? '').trim(),
          textAr: String(raw.marketing?.promo?.textAr ?? '').trim(),
          highlight: '-',
          highlightAr: '-',
          suffixText: '-',
          suffixTextAr: '-',
          ctaLabel: String(raw.marketing?.promo?.ctaLabel ?? '').trim(),
          ctaLabelAr: String(raw.marketing?.promo?.ctaLabelAr ?? '').trim(),
        },
        steps: this.marketingSteps.controls.map((group) => ({
          step: String(group.get('step')?.value ?? '').trim(),
          title: String(group.get('title')?.value ?? '').trim(),
          titleAr: String(group.get('titleAr')?.value ?? '').trim(),
          description: String(group.get('description')?.value ?? '').trim(),
          descriptionAr: String(group.get('descriptionAr')?.value ?? '').trim(),
        })),
        integrations: {
          title: String(raw.marketing?.integrations?.title ?? '').trim(),
          titleAr: String(raw.marketing?.integrations?.titleAr ?? '').trim(),
          description: String(raw.marketing?.integrations?.description ?? '').trim(),
          descriptionAr: String(raw.marketing?.integrations?.descriptionAr ?? '').trim(),
          items: this.marketingIntegrationItems.controls
            .map((group) => String(group.get('value')?.value ?? '').trim())
            .filter((value) => value.length > 0),
          itemsAr: this.marketingIntegrationItemsAr.controls
            .map((group) => String(group.get('value')?.value ?? '').trim()),
          itemIcons: this.marketingIntegrationItemIcons.controls
            .map((group) => String(group.get('value')?.value ?? '').trim())
            .filter((value) => value.length > 0),
          bullets: this.marketingIntegrationBullets.controls
            .map((group) => String(group.get('value')?.value ?? '').trim())
            .filter((value) => value.length > 0),
          bulletsAr: this.marketingIntegrationBulletsAr.controls
            .map((group) => String(group.get('value')?.value ?? '').trim()),
        },
        contact: {
          title: String(raw.marketing?.contact?.title ?? '').trim(),
          titleAr: String(raw.marketing?.contact?.titleAr ?? '').trim(),
          description: String(raw.marketing?.contact?.description ?? '').trim(),
          descriptionAr: String(raw.marketing?.contact?.descriptionAr ?? '').trim(),
          hqLabel: String(raw.marketing?.contact?.hqLabel ?? '').trim(),
          hqLabelAr: String(raw.marketing?.contact?.hqLabelAr ?? '').trim(),
          hqValue: String(raw.marketing?.contact?.hqValue ?? '').trim(),
          hqValueAr: String(raw.marketing?.contact?.hqValueAr ?? '').trim(),
        },
        featuresSectionTitle: String(raw.marketing?.featuresSectionTitle ?? '').trim() || DEFAULT_FEATURES_SECTION_TITLE,
        featuresSectionTitleAr: String(raw.marketing?.featuresSectionTitleAr ?? '').trim() || DEFAULT_FEATURES_SECTION_TITLE_AR,
        featuresSectionDescription: String(raw.marketing?.featuresSectionDescription ?? '').trim() || DEFAULT_FEATURES_SECTION_DESCRIPTION,
        featuresSectionDescriptionAr: String(raw.marketing?.featuresSectionDescriptionAr ?? '').trim() || DEFAULT_FEATURES_SECTION_DESCRIPTION_AR,
        pricingSectionTitle: String(raw.marketing?.pricingSectionTitle ?? '').trim() || DEFAULT_PRICING_SECTION_TITLE,
        pricingSectionTitleAr: String(raw.marketing?.pricingSectionTitleAr ?? '').trim() || DEFAULT_PRICING_SECTION_TITLE_AR,
        pricingSectionDescription: String(raw.marketing?.pricingSectionDescription ?? '').trim() || DEFAULT_PRICING_SECTION_DESCRIPTION,
        pricingSectionDescriptionAr: String(raw.marketing?.pricingSectionDescriptionAr ?? '').trim() || DEFAULT_PRICING_SECTION_DESCRIPTION_AR,
        pricingAudienceTeacherLabel: String(raw.marketing?.pricingAudienceTeacherLabel ?? '').trim() || DEFAULT_PRICING_AUDIENCE_TEACHER_LABEL,
        pricingAudienceTeacherLabelAr: String(raw.marketing?.pricingAudienceTeacherLabelAr ?? '').trim() || DEFAULT_PRICING_AUDIENCE_TEACHER_LABEL_AR,
        pricingAudienceCenterLabel: String(raw.marketing?.pricingAudienceCenterLabel ?? '').trim() || DEFAULT_PRICING_AUDIENCE_CENTER_LABEL,
        pricingAudienceCenterLabelAr: String(raw.marketing?.pricingAudienceCenterLabelAr ?? '').trim() || DEFAULT_PRICING_AUDIENCE_CENTER_LABEL_AR,
        pricingBillingAnnualLabel: String(raw.marketing?.pricingBillingAnnualLabel ?? '').trim() || DEFAULT_PRICING_BILLING_ANNUAL_LABEL,
        pricingBillingAnnualLabelAr: String(raw.marketing?.pricingBillingAnnualLabelAr ?? '').trim() || DEFAULT_PRICING_BILLING_ANNUAL_LABEL_AR,
        pricingBillingMonthlyLabel: String(raw.marketing?.pricingBillingMonthlyLabel ?? '').trim() || DEFAULT_PRICING_BILLING_MONTHLY_LABEL,
        pricingBillingMonthlyLabelAr: String(raw.marketing?.pricingBillingMonthlyLabelAr ?? '').trim() || DEFAULT_PRICING_BILLING_MONTHLY_LABEL_AR,
        trustedHeading: String(raw.marketing?.trustedHeading ?? '').trim() || DEFAULT_TRUSTED_HEADING,
        trustedHeadingAr: String(raw.marketing?.trustedHeadingAr ?? '').trim() || DEFAULT_TRUSTED_HEADING_AR,
        trustedDescription: String(raw.marketing?.trustedDescription ?? '').trim() || DEFAULT_TRUSTED_DESCRIPTION,
        trustedDescriptionAr: String(raw.marketing?.trustedDescriptionAr ?? '').trim() || DEFAULT_TRUSTED_DESCRIPTION_AR,
        trustedStatOneValue: String(raw.marketing?.trustedStatOneValue ?? '').trim() || DEFAULT_TRUSTED_STAT_ONE_VALUE,
        trustedStatOneValueAr: String(raw.marketing?.trustedStatOneValueAr ?? '').trim() || DEFAULT_TRUSTED_STAT_ONE_VALUE_AR,
        trustedStatOneLabel: String(raw.marketing?.trustedStatOneLabel ?? '').trim() || DEFAULT_TRUSTED_STAT_ONE_LABEL,
        trustedStatOneLabelAr: String(raw.marketing?.trustedStatOneLabelAr ?? '').trim() || DEFAULT_TRUSTED_STAT_ONE_LABEL_AR,
        trustedStatTwoValue: String(raw.marketing?.trustedStatTwoValue ?? '').trim() || DEFAULT_TRUSTED_STAT_TWO_VALUE,
        trustedStatTwoValueAr: String(raw.marketing?.trustedStatTwoValueAr ?? '').trim() || DEFAULT_TRUSTED_STAT_TWO_VALUE_AR,
        trustedStatTwoLabel: String(raw.marketing?.trustedStatTwoLabel ?? '').trim() || DEFAULT_TRUSTED_STAT_TWO_LABEL,
        trustedStatTwoLabelAr: String(raw.marketing?.trustedStatTwoLabelAr ?? '').trim() || DEFAULT_TRUSTED_STAT_TWO_LABEL_AR,
        trustedStatThreeValue: String(raw.marketing?.trustedStatThreeValue ?? '').trim() || DEFAULT_TRUSTED_STAT_THREE_VALUE,
        trustedStatThreeValueAr: String(raw.marketing?.trustedStatThreeValueAr ?? '').trim() || DEFAULT_TRUSTED_STAT_THREE_VALUE_AR,
        trustedStatThreeLabel: String(raw.marketing?.trustedStatThreeLabel ?? '').trim() || DEFAULT_TRUSTED_STAT_THREE_LABEL,
        trustedStatThreeLabelAr: String(raw.marketing?.trustedStatThreeLabelAr ?? '').trim() || DEFAULT_TRUSTED_STAT_THREE_LABEL_AR,
        docsVideoUrl: String(this.marketingDocsVideos.at(0)?.get('url')?.value ?? raw.marketing?.docsVideoUrl ?? '').trim(),
        docsSectionTitle: String(raw.marketing?.docsSectionTitle ?? '').trim() || DEFAULT_DOCS_SECTION_TITLE,
        docsSectionTitleAr: String(raw.marketing?.docsSectionTitleAr ?? '').trim() || DEFAULT_DOCS_SECTION_TITLE_AR,
        docsSectionDescription: String(raw.marketing?.docsSectionDescription ?? '').trim() || DEFAULT_DOCS_SECTION_DESCRIPTION,
        docsSectionDescriptionAr: String(raw.marketing?.docsSectionDescriptionAr ?? '').trim() || DEFAULT_DOCS_SECTION_DESCRIPTION_AR,
        docsVideos: this.marketingDocsVideos.controls
          .map((group) => ({
            title: String(group.get('title')?.value ?? '').trim(),
            url: String(group.get('url')?.value ?? '').trim(),
          }))
          .filter((item) => item.url.length > 0),
        facebookPixelId: String(raw.marketing?.facebookPixelId ?? '').trim(),
        about: {
          missionBadge: String(raw.marketing?.about?.missionBadge ?? '').trim(),
          missionBadgeAr: String(raw.marketing?.about?.missionBadgeAr ?? '').trim(),
          heroTitle: String(raw.marketing?.about?.heroTitle ?? '').trim(),
          heroTitleAr: String(raw.marketing?.about?.heroTitleAr ?? '').trim(),
          heroDescription: String(raw.marketing?.about?.heroDescription ?? '').trim(),
          heroDescriptionAr: String(raw.marketing?.about?.heroDescriptionAr ?? '').trim(),
          storyTitle: String(raw.marketing?.about?.storyTitle ?? '').trim(),
          storyTitleAr: String(raw.marketing?.about?.storyTitleAr ?? '').trim(),
          storyLead: String(raw.marketing?.about?.storyLead ?? '').trim(),
          storyLeadAr: String(raw.marketing?.about?.storyLeadAr ?? '').trim(),
          storyBody: String(raw.marketing?.about?.storyBody ?? '').trim(),
          storyBodyAr: String(raw.marketing?.about?.storyBodyAr ?? '').trim(),
          imageUrl: String(raw.marketing?.about?.imageUrl ?? '').trim(),
          imageAlt: String(raw.marketing?.about?.imageAlt ?? '').trim(),
          imageAltAr: String(raw.marketing?.about?.imageAltAr ?? '').trim(),
          valuesTitle: String(raw.marketing?.about?.valuesTitle ?? '').trim(),
          valuesTitleAr: String(raw.marketing?.about?.valuesTitleAr ?? '').trim(),
          partnersTitle: String(raw.marketing?.about?.partnersTitle ?? '').trim(),
          partnersTitleAr: String(raw.marketing?.about?.partnersTitleAr ?? '').trim(),
          partnersDescription: String(raw.marketing?.about?.partnersDescription ?? '').trim(),
          partnersDescriptionAr: String(raw.marketing?.about?.partnersDescriptionAr ?? '').trim(),
          partners: this.aboutPartners.controls.map((group, index) => ({
            name: String(group.get('name')?.value ?? '').trim(),
            nameAr: String(group.get('nameAr')?.value ?? '').trim(),
            description: String(group.get('description')?.value ?? '').trim(),
            descriptionAr: String(group.get('descriptionAr')?.value ?? '').trim(),
            logoUrl: String(group.get('logoUrl')?.value ?? '').trim(),
            websiteUrl: String(group.get('websiteUrl')?.value ?? '').trim(),
            visible: Boolean(group.get('visible')?.value ?? true),
            displayOrder: Number(group.get('displayOrder')?.value ?? index + 1),
          })),
        },
        terms: {
          title: String(raw.marketing?.terms?.title ?? '').trim(),
          titleAr: String(raw.marketing?.terms?.titleAr ?? '').trim(),
          lastUpdated: String(raw.marketing?.terms?.lastUpdated ?? '').trim(),
          lastUpdatedAr: String(raw.marketing?.terms?.lastUpdatedAr ?? '').trim(),
          contactText: String(raw.marketing?.terms?.contactText ?? '').trim(),
          contactTextAr: String(raw.marketing?.terms?.contactTextAr ?? '').trim(),
          contactEmail: String(raw.marketing?.terms?.contactEmail ?? '').trim(),
          sections: this.termsSections.controls.map((group, index) => ({
            icon: String(group.get('icon')?.value ?? 'description').trim(),
            title: String(group.get('title')?.value ?? '').trim(),
            titleAr: String(group.get('titleAr')?.value ?? '').trim(),
            body: String(group.get('body')?.value ?? '').trim(),
            bodyAr: String(group.get('bodyAr')?.value ?? '').trim(),
            bullets: this.linesToArray(group.get('bullets')?.value),
            bulletsAr: this.linesToArray(group.get('bulletsAr')?.value),
            visible: Boolean(group.get('visible')?.value ?? true),
            displayOrder: Number(group.get('displayOrder')?.value ?? index + 1),
          })),
        },
      },
      onboarding: {
        stepOneTitle: raw.onboarding?.stepOneTitle ?? '',
        stepOneDescription: raw.onboarding?.stepOneDescription ?? '',
        trustBadgeText: raw.onboarding?.trustBadgeText ?? '',
        planSelectorBadge: raw.onboarding?.planSelectorBadge ?? '',
        provisioningTitle: raw.onboarding?.provisioningTitle ?? '',
        provisioningDescription: raw.onboarding?.provisioningDescription ?? '',
        successTitle: raw.onboarding?.successTitle ?? '',
        successDescription: raw.onboarding?.successDescription ?? '',
        provisioningTasks: this.onboardingTasks.controls
          .map((group) => String(group.get('value')?.value ?? '').trim())
          .filter((value) => value.length > 0),
      },
      trialDashboard: {
        headerTitle: raw.trialDashboard?.headerTitle ?? '',
        headerDescription: raw.trialDashboard?.headerDescription ?? '',
        trialRemainingText: raw.trialDashboard?.trialRemainingText ?? '',
        trialEndsText: raw.trialDashboard?.trialEndsText ?? '',
        trialFeatureBullets: this.trialFeatureBullets.controls
          .map((group) => String(group.get('value')?.value ?? '').trim())
          .filter((value) => value.length > 0),
        setupSteps: this.trialSetupSteps.controls.map((group) => ({
          label: String(group.get('label')?.value ?? '').trim(),
          description: String(group.get('description')?.value ?? '').trim(),
          status: String(group.get('status')?.value ?? 'pending').trim(),
        })),
      },
    };
  }

  private resolvePromoLine(text: string, highlight: string, suffixText: string): string {
    const parts = [text, highlight, suffixText]
      .map((value) => String(value ?? '').trim())
      .filter((value) => value.length > 0 && value !== '-');
    return parts.join(' ').trim();
  }

  private linesToArray(value: unknown): string[] {
    return String(value ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const details = error.error?.details;
      if (Array.isArray(details) && details.length > 0) {
        return details.join(', ');
      }
      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unexpected error while processing request.';
  }

  private normalizeRichHtml(value: string): string {
    const raw = String(value ?? '').trim();
    if (!raw) {
      return '';
    }
    const holder = document.createElement('div');
    holder.innerHTML = raw;
    return holder.innerHTML.trim();
  }

  private normalizeHeroRichHtml(value: string | null | undefined): string {
    const raw = String(value ?? '').trim();
    if (!raw) {
      return '';
    }
    const holder = document.createElement('div');
    holder.innerHTML = raw;
    holder.querySelectorAll<HTMLElement>('[style*="color"]').forEach((element) => {
      const color = this.normalizeCssColor(element.style.color);
      if (!color) {
        return;
      }
      element.innerHTML = `<font color="${color}">${element.innerHTML}</font>`;
      element.style.color = '';
      if (!element.getAttribute('style')?.trim()) {
        element.removeAttribute('style');
      }
    });
    return holder.innerHTML.trim();
  }

  private toQuillEditableHeroHtml(value: string | null | undefined): string {
    const raw = String(value ?? '').trim();
    if (!raw) {
      return '';
    }
    const holder = document.createElement('div');
    holder.innerHTML = raw;
    holder.querySelectorAll('font[color]').forEach((font) => {
      const color = this.normalizeCssColor(font.getAttribute('color') ?? '');
      const span = document.createElement('span');
      if (color) {
        span.style.color = color;
      }
      span.innerHTML = font.innerHTML;
      font.replaceWith(span);
    });
    return holder.innerHTML.trim();
  }

  private syncHeroRichColorsFromForm(): void {
    const colors = HERO_RICH_TEXT_CONTROLS.reduce<Record<string, string>>((acc, controlName) => {
      const value = String(this.form.get(['hero', controlName])?.value ?? '');
      acc[controlName] = this.detectHeroColor(value) ?? '#000000';
      return acc;
    }, {});
    this.heroRichColors.set(colors);
  }

  private detectHeroColor(value: string): string | null {
    const raw = String(value ?? '').trim();
    if (!raw) {
      return null;
    }
    const holder = document.createElement('div');
    holder.innerHTML = raw;
    const font = holder.querySelector('font[color]');
    const fontColor = this.normalizeCssColor(font?.getAttribute('color') ?? '');
    if (fontColor) {
      return fontColor;
    }
    const styled = Array.from(holder.querySelectorAll<HTMLElement>('[style*="color"]'))
      .map((element) => this.normalizeCssColor(element.style.color))
      .find((color): color is string => Boolean(color));
    return styled ?? null;
  }

  private normalizeCssColor(color: string): string | null {
    const trimmed = color.trim();
    if (!trimmed) {
      return null;
    }
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(trimmed)) {
      return trimmed;
    }
    const rgb = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/i);
    if (!rgb) {
      return trimmed;
    }
    return `#${rgb.slice(1, 4)
      .map((channel) => Math.max(0, Math.min(255, Number(channel))).toString(16).padStart(2, '0'))
      .join('')}`;
  }

  private detectFontSize(value: string): string | null {
    const html = String(value ?? '');
    const match = html.match(/font-size:\s*([0-9]+px)/i);
    return match ? match[1] : null;
  }

  private stripHtmlToText(value: string): string {
    const raw = String(value ?? '').trim();
    if (!raw) {
      return '';
    }
    const holder = document.createElement('div');
    holder.innerHTML = raw;
    return (holder.textContent ?? '').trim();
  }

  private normalizeFontSize(value: number | string | null | undefined): number | null {
    if (value == null) {
      return null;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return null;
    }
    return Math.min(96, Math.max(1, Math.round(numeric)));
  }

  private collectInvalidControlPaths(control: AbstractControl | null, prefix = ''): string[] {
    if (!control) {
      return [];
    }
    if (control instanceof FormControl) {
      return control.invalid ? [prefix || 'field'] : [];
    }
    if (control instanceof FormGroup) {
      return Object.entries(control.controls).flatMap(([key, child]) =>
        this.collectInvalidControlPaths(child, prefix ? `${prefix}.${key}` : key),
      );
    }
    if (control instanceof FormArray) {
      return control.controls.flatMap((child, index) =>
        this.collectInvalidControlPaths(child, `${prefix}[${index}]`),
      );
    }
    return [];
  }

  private syncFeatureTitleFontSizeFromFocusedField(size: string): void {
    const element = this.focusedFieldElement;
    if (!element || element.dataset['featureTitle'] !== 'true') {
      return;
    }
    const idxRaw = element.dataset['featureIndex'];
    const index = Number(idxRaw);
    if (!Number.isInteger(index) || index < 0 || index >= this.features.length) {
      return;
    }
    const px = Number.parseInt(size.replace('px', ''), 10);
    if (!Number.isFinite(px)) {
      return;
    }
    const control = this.features.at(index).get('titleFontSize') as FormControl<number | null>;
    control.setValue(px);
    control.markAsDirty();
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private parseWebsiteAssetUrl(url: string): { section: string; fileName: string } | null {
    const match = url.match(/\/api\/v1\/public\/website-assets\/[^/]+\/([^/]+)\/([^/?#]+)/);
    if (!match) {
      return null;
    }
    return {
      section: decodeURIComponent(match[1]),
      fileName: decodeURIComponent(match[2]),
    };
  }
}
