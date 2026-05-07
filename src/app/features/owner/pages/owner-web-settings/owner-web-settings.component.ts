import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { OwnerWebSettingsFacade } from '../../state/owner-web-settings.facade';
import { environment } from '../../../../../environments/environment';
import {
  SaveWebsiteSettingsRequest,
  WebsiteSettingsView,
} from '../../data-access/owner-website-settings-data.service';

interface SaveStatus { type: 'success' | 'error'; title: string; message: string }
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
  | 'onboarding'
  | 'trial';

const INTEGRATION_ICON_OPTIONS: readonly string[] = [
  'mail', 'account_balance', 'calendar_month', 'hub', 'public', 'school', 'payments', 'settings',
  'check_circle', 'done_all', 'sync', 'autorenew', 'cloud', 'cloud_done', 'cloud_sync', 'dns',
  'storage', 'database', 'api', 'lan', 'router', 'security', 'lock', 'verified_user', 'shield',
  'bolt', 'speed', 'insights', 'analytics', 'bar_chart', 'pie_chart', 'monitoring', 'timeline',
  'group', 'groups', 'person', 'support_agent', 'business', 'apartment', 'domain', 'workspaces',
  'description', 'assignment', 'fact_check', 'event', 'notifications', 'chat', 'forum', 'phone',
  'link', 'webhook', 'integration_instructions', 'translate', 'language', 'travel_explore',
];

@Component({
  selector: 'app-owner-web-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
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
  readonly tenantId = computed(() => this.settings()?.tenantId ?? this.facade.resolveTenantId());
  readonly publicWebsiteUrl = 'http://localhost:3000/';
  private readonly backendOrigin = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
  readonly apiPreviewUrl = computed(
    () => `${environment.apiBaseUrl}/public/website-settings/${this.tenantId()}`,
  );
  readonly healthState = signal<'idle' | 'checking' | 'ok' | 'failed'>('idle');
  readonly healthMessage = signal<string>('Not checked yet.');
  readonly promoEditorHtml = signal('');
  readonly focusedFieldLabel = signal<string | null>(null);
  readonly focusedFieldRichHtml = signal('');
  readonly focusedFieldFontSize = signal('16px');
  readonly focusedFieldEditorOpen = signal(false);
  readonly docsVideoModeByIndex = signal<Record<number, 'url' | 'upload'>>({});
  readonly docsVideoUploadProgressByIndex = signal<Record<number, number>>({});
  readonly docsVideoUploadingByIndex = signal<Record<number, boolean>>({});
  readonly featureImageUploadProgressByIndex = signal<Record<number, number>>({});
  readonly featureImageUploadingByIndex = signal<Record<number, boolean>>({});
  readonly featureImageDragActiveByIndex = signal<Record<number, boolean>>({});
  readonly featureAccordionOpenByIndex = signal<Record<number, boolean>>({});
  private focusedFieldElement: HTMLInputElement | HTMLTextAreaElement | null = null;
  private promoEditorSelectionRange: Range | null = null;
  private focusedEditorSelectionRange: Range | null = null;
  readonly activeSection = signal<WebSettingsSection>('site');
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
      titleText: ['', [Validators.required]],
      descriptionText: [''],
      backgroundImageUrl: [''],
      primaryCtaLabel: [''],
      primaryCtaLink: [''],
      secondaryCtaLabel: [''],
      secondaryCtaLink: [''],
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
        highlight: ['-', [Validators.required]],
        suffixText: ['-', [Validators.required]],
        ctaLabel: ['', [Validators.required]],
      }),
      steps: this.fb.array([]),
      integrations: this.fb.group({
        title: ['', [Validators.required]],
        description: ['', [Validators.required]],
        items: this.fb.array([]),
        itemIcons: this.fb.array([]),
        bullets: this.fb.array([]),
      }),
      contact: this.fb.group({
        title: ['', [Validators.required]],
        description: ['', [Validators.required]],
        hqLabel: ['Global HQ', [Validators.required]],
        hqValue: ['', [Validators.required]],
      }),
      docsVideoUrl: [''],
      docsVideos: this.fb.array([]),
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
  get marketingIntegrationItemIcons(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'integrations', 'itemIcons']) as FormArray<FormGroup>;
  }
  marketingIntegrationItemIconControlAt(index: number): FormControl<string> {
    return this.marketingIntegrationItemIcons.at(index).get('value') as FormControl<string>;
  }
  featureIconControlAt(index: number): FormControl<string> {
    return this.features.at(index).get('iconKey') as FormControl<string>;
  }
  get marketingIntegrationBullets(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'integrations', 'bullets']) as FormArray<FormGroup>;
  }
  get marketingDocsVideos(): FormArray<FormGroup> {
    return this.form.get(['marketing', 'docsVideos']) as FormArray<FormGroup>;
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

  addFeature(): void {
    this.features.push(this.buildFeatureGroup({
      iconKey: 'star',
      titleText: '',
      titleFontSize: 32,
      descriptionText: '',
      descriptionFontSize: 18,
      ctaLabel: 'Learn More',
      ctaFontSize: 18,
      ctaLink: '/features',
      imageUrl: '',
      detailTitle: '',
      detailSummary: '',
      detailContent: '',
      detailImageUrl: '',
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
      description: ['', Validators.required],
    }));
  }
  removeMarketingStep(index: number): void {
    this.marketingSteps.removeAt(index);
  }
  addMarketingIntegrationItem(): void {
    this.marketingIntegrationItems.push(this.fb.group({ value: ['', Validators.required] }));
    this.marketingIntegrationItemIcons.push(this.fb.group({ value: ['mail', Validators.required] }));
  }
  removeMarketingIntegrationItem(index: number): void {
    this.marketingIntegrationItems.removeAt(index);
    this.marketingIntegrationItemIcons.removeAt(index);
  }
  addMarketingIntegrationBullet(): void {
    this.marketingIntegrationBullets.push(this.fb.group({ value: ['', Validators.required] }));
  }
  removeMarketingIntegrationBullet(index: number): void {
    this.marketingIntegrationBullets.removeAt(index);
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

  onPromoEditorInput(event: Event): void {
    const html = (event.target as HTMLElement).innerHTML ?? '';
    this.promoEditorHtml.set(html);
    this.promoTextControl.setValue(html);
    this.promoTextControl.markAsDirty();
    this.promoTextControl.markAsTouched();
  }

  capturePromoSelection(): void {
    this.promoEditorSelectionRange = this.captureSelectionRange('promo-rich-editor');
  }

  applyPromoCommand(command: string, value?: string): void {
    this.restoreSelectionRange(this.promoEditorSelectionRange, 'promo-rich-editor');
    document.execCommand(command, false, value);
    const editor = document.getElementById('promo-rich-editor');
    if (editor) {
      this.onPromoEditorInput({ target: editor } as unknown as Event);
    }
  }

  onPromoColorPick(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    if (color) {
      this.applyPromoCommand('foreColor', color);
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
    if (!file.type.startsWith('image/')) {
      this.saveStatus.set({
        type: 'error',
        title: 'Invalid File',
        message: 'Please choose an image file.',
      });
      return;
    }
    try {
      const uploaded = await this.facade.uploadWebsiteAsset('hero-background', file);
      const control = this.form.get(['hero', 'backgroundImageUrl']) as FormControl<string>;
      control.setValue(uploaded.url);
      control.markAsDirty();
      this.saveStatus.set({
        type: 'success',
        title: 'Image Uploaded',
        message: 'Hero background uploaded to backend storage. Save draft and publish to apply.',
      });
    } catch (error) {
      this.saveStatus.set({
        type: 'error',
        title: 'Upload Failed',
        message: this.resolveError(error),
      });
    } finally {
      if (input) {
        input.value = '';
      }
    }
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
        badgeText: data.hero.badgeText ?? '',
        titleText: data.hero.titleText ?? '',
        descriptionText: data.hero.descriptionText ?? '',
        backgroundImageUrl: data.hero.backgroundImageUrl ?? '',
        primaryCtaLabel: data.hero.primaryCtaLabel ?? '',
        primaryCtaLink: data.hero.primaryCtaLink ?? '',
        secondaryCtaLabel: data.hero.secondaryCtaLabel ?? '',
        secondaryCtaLink: data.hero.secondaryCtaLink ?? '',
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
          highlight: '-',
          suffixText: '-',
          ctaLabel: data.marketing?.promo?.ctaLabel ?? '',
        },
        integrations: {
          title: data.marketing?.integrations?.title ?? '',
          description: data.marketing?.integrations?.description ?? '',
        },
        contact: {
          title: data.marketing?.contact?.title ?? '',
          description: data.marketing?.contact?.description ?? '',
          hqLabel: data.marketing?.contact?.hqLabel ?? 'Global HQ',
          hqValue: data.marketing?.contact?.hqValue ?? '',
        },
        docsVideoUrl: data.marketing?.docsVideoUrl ?? '',
        docsVideos: [],
      },
      trialDashboard: {
        headerTitle: data.trialDashboard?.headerTitle ?? '',
        headerDescription: data.trialDashboard?.headerDescription ?? '',
        trialRemainingText: data.trialDashboard?.trialRemainingText ?? '',
        trialEndsText: data.trialDashboard?.trialEndsText ?? '',
      },
    });

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
      (data.marketing?.steps?.length ? data.marketing.steps : [
        { step: '01', title: 'Create Account', description: 'Simple, secure onboarding for your primary institutional admin.' },
      ]).map((step) =>
        this.fb.group({
          step: [step.step, Validators.required],
          title: [step.title, Validators.required],
          description: [step.description, Validators.required],
        }),
      ),
    );
    this.resetFormArray(
      this.marketingIntegrationItems,
      (data.marketing?.integrations?.items?.length ? data.marketing.integrations.items : ['Institutional Email']).map((item) => this.fb.group({ value: [item, Validators.required] })),
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
      titleFontSize: [row.titleFontSize ?? this.detectFontSize(row.titleText) ?? 32],
      descriptionText: [row.descriptionText ?? ''],
      descriptionFontSize: [row.descriptionFontSize ?? this.detectFontSize(row.descriptionText ?? '') ?? 18],
      ctaLabel: [row.ctaLabel ?? ''],
      ctaFontSize: [row.ctaFontSize ?? 18],
      ctaLink: [row.ctaLink ?? ''],
      imageUrl: [row.imageUrl ?? ''],
      detailTitle: [row.detailTitle ?? ''],
      detailSummary: [row.detailSummary ?? ''],
      detailContent: [row.detailContent ?? ''],
      detailImageUrl: [row.detailImageUrl ?? ''],
      visible: [row.visible],
      displayOrder: [row.displayOrder],
    });
  }

  private buildTestimonialGroup(row: SaveWebsiteSettingsRequest['testimonials'][number]): FormGroup {
    return this.fb.group({
      quoteText: [row.quoteText, Validators.required],
      authorName: [row.authorName, Validators.required],
      authorRole: [row.authorRole ?? ''],
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
      descriptionText: [row.descriptionText ?? ''],
      buttonLabel: [row.buttonLabel ?? ''],
      buttonLink: [row.buttonLink ?? ''],
      visible: [row.visible],
      displayOrder: [row.displayOrder],
    });
  }

  private buildFooterGroup(row: SaveWebsiteSettingsRequest['footerLinks'][number]): FormGroup {
    return this.fb.group({
      sectionTitle: [row.sectionTitle, Validators.required],
      label: [row.label, Validators.required],
      routePath: [row.routePath, Validators.required],
      visible: [row.visible],
      displayOrder: [row.displayOrder],
    });
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
        titleFontSize: this.normalizeFontSize(fontSizeControl ?? detectedNum),
        descriptionText: this.normalizeRichHtml(String(group.get('descriptionText')?.value ?? fallback.descriptionText ?? '')),
        descriptionFontSize: this.normalizeFontSize(
          (group.get('descriptionFontSize')?.value as number | string | null | undefined)
            ?? this.detectFontSize(String(group.get('descriptionText')?.value ?? fallback.descriptionText ?? ''))?.replace('px', '')
            ?? (fallback as { descriptionFontSize?: number | null }).descriptionFontSize
            ?? 18,
        ),
        ctaLabel: String(group.get('ctaLabel')?.value ?? fallback.ctaLabel ?? '').trim(),
        ctaFontSize: this.normalizeFontSize(
          (group.get('ctaFontSize')?.value as number | string | null | undefined)
            ?? (fallback as { ctaFontSize?: number | null }).ctaFontSize
            ?? 18,
        ),
        ctaLink: String(group.get('ctaLink')?.value ?? fallback.ctaLink ?? '').trim(),
        imageUrl: String(group.get('imageUrl')?.value ?? (fallback as { imageUrl?: string | null }).imageUrl ?? '').trim(),
        detailTitle: this.stripHtmlToText(String(group.get('detailTitle')?.value ?? (fallback as { detailTitle?: string | null }).detailTitle ?? '')).trim(),
        detailSummary: this.normalizeRichHtml(String(group.get('detailSummary')?.value ?? (fallback as { detailSummary?: string | null }).detailSummary ?? '')),
        detailContent: this.normalizeRichHtml(String(group.get('detailContent')?.value ?? (fallback as { detailContent?: string | null }).detailContent ?? '')),
        detailImageUrl: String(group.get('detailImageUrl')?.value ?? (fallback as { detailImageUrl?: string | null }).detailImageUrl ?? '').trim(),
        visible: Boolean(group.get('visible')?.value ?? fallback.visible ?? true),
        displayOrder: Number(group.get('displayOrder')?.value ?? fallback.displayOrder ?? index + 1),
      };
    });
    return {
      siteConfig: raw.siteConfig as SaveWebsiteSettingsRequest['siteConfig'],
      hero: raw.hero as SaveWebsiteSettingsRequest['hero'],
      pages: (raw.pages ?? []) as SaveWebsiteSettingsRequest['pages'],
      navigation: this.navigation.controls.map((group, index) => {
        const fallback = (raw.navigation?.[index] ?? {}) as Partial<SaveWebsiteSettingsRequest['navigation'][number]>;
        return {
          label: String(group.get('label')?.value ?? fallback.label ?? '').trim(),
          routePath: String(group.get('routePath')?.value ?? fallback.routePath ?? '').trim(),
          linkType: String(group.get('linkType')?.value ?? fallback.linkType ?? 'internal').trim() || 'internal',
          visible: Boolean(group.get('visible')?.value ?? fallback.visible ?? true),
          displayOrder: Number(group.get('displayOrder')?.value ?? fallback.displayOrder ?? index + 1),
        };
      }),
      features: normalizedFeatures,
      testimonials: (raw.testimonials ?? []) as SaveWebsiteSettingsRequest['testimonials'],
      pricingPlans: (raw.pricingPlans ?? []) as SaveWebsiteSettingsRequest['pricingPlans'],
      ctas: (raw.ctas ?? []) as SaveWebsiteSettingsRequest['ctas'],
      footerLinks: (raw.footerLinks ?? []) as SaveWebsiteSettingsRequest['footerLinks'],
      marketing: {
        promo: {
          icon: String(raw.marketing?.promo?.icon ?? '').trim(),
          text: String(raw.marketing?.promo?.text ?? '').trim(),
          highlight: '-',
          suffixText: '-',
          ctaLabel: String(raw.marketing?.promo?.ctaLabel ?? '').trim(),
        },
        steps: this.marketingSteps.controls.map((group) => ({
          step: String(group.get('step')?.value ?? '').trim(),
          title: String(group.get('title')?.value ?? '').trim(),
          description: String(group.get('description')?.value ?? '').trim(),
        })),
        integrations: {
          title: String(raw.marketing?.integrations?.title ?? '').trim(),
          description: String(raw.marketing?.integrations?.description ?? '').trim(),
          items: this.marketingIntegrationItems.controls
            .map((group) => String(group.get('value')?.value ?? '').trim())
            .filter((value) => value.length > 0),
          itemIcons: this.marketingIntegrationItemIcons.controls
            .map((group) => String(group.get('value')?.value ?? '').trim())
            .filter((value) => value.length > 0),
          bullets: this.marketingIntegrationBullets.controls
            .map((group) => String(group.get('value')?.value ?? '').trim())
            .filter((value) => value.length > 0),
        },
        contact: {
          title: String(raw.marketing?.contact?.title ?? '').trim(),
          description: String(raw.marketing?.contact?.description ?? '').trim(),
          hqLabel: String(raw.marketing?.contact?.hqLabel ?? '').trim(),
          hqValue: String(raw.marketing?.contact?.hqValue ?? '').trim(),
        },
        docsVideoUrl: String(this.marketingDocsVideos.at(0)?.get('url')?.value ?? raw.marketing?.docsVideoUrl ?? '').trim(),
        docsVideos: this.marketingDocsVideos.controls
          .map((group) => ({
            title: String(group.get('title')?.value ?? '').trim(),
            url: String(group.get('url')?.value ?? '').trim(),
          }))
          .filter((item) => item.url.length > 0),
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
