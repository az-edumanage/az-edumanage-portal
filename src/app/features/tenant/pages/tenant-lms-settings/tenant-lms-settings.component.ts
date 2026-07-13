import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthIdentityService } from '../../../../core/auth/auth-identity.service';
import {
  SaveTenantLmsSettingsRequest,
  TenantLmsSettingsDataService,
  TenantLmsSettingsView,
} from '../../data-access/tenant-lms-settings-data.service';

@Component({
  selector: 'app-tenant-lms-settings',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <header class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-slate-500">LMS Settings</p>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">LMS website</h1>
          <p class="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Choose the public LMS website template and publish it on the tenant LMS subdomain.
          </p>
        </div>
        @if (settings()) {
          <a
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
            [href]="previewUrl()"
            target="_blank"
            rel="noreferrer"
          >
            <mat-icon class="text-base">open_in_new</mat-icon>
            Open website
          </a>
        }
      </header>

      @if (loading()) {
        <section class="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          Loading LMS settings...
        </section>
      } @else if (loadError()) {
        <section class="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {{ loadError() }}
        </section>
      } @else if (settings()) {
        <section
          class="rounded-xl border p-5 shadow-sm"
          [class.border-emerald-200]="settings()?.lmsEnabled"
          [class.bg-emerald-50]="settings()?.lmsEnabled"
          [class.dark:border-emerald-900]="settings()?.lmsEnabled"
          [class.dark:bg-emerald-950/20]="settings()?.lmsEnabled"
          [class.border-amber-200]="!settings()?.lmsEnabled"
          [class.bg-amber-50]="!settings()?.lmsEnabled"
          [class.dark:border-amber-900]="!settings()?.lmsEnabled"
          [class.dark:bg-amber-950/20]="!settings()?.lmsEnabled"
        >
          <div class="flex items-start gap-3">
            <mat-icon class="mt-0.5" [class.text-emerald-600]="settings()?.lmsEnabled" [class.text-amber-600]="!settings()?.lmsEnabled">
              {{ settings()?.lmsEnabled ? 'verified' : 'lock' }}
            </mat-icon>
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">
                {{ settings()?.lmsEnabled ? 'LMS module is active' : 'LMS module is not included in this tenant plan' }}
              </h2>
              <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {{ settings()?.lmsEnabled ? 'The tenant can publish an LMS website and use the selected template.' : 'Add the LMS module to the owner plan before this tenant can publish an LMS website.' }}
              </p>
            </div>
          </div>
        </section>

        <form class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]" [formGroup]="form" (ngSubmit)="save()">
          <div class="space-y-6">
            <section
              class="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900"
              [class.border-emerald-200]="form.controls.websiteEnabled.value"
              [class.dark:border-emerald-900]="form.controls.websiteEnabled.value"
              [class.border-slate-200]="!form.controls.websiteEnabled.value"
              [class.dark:border-slate-800]="!form.controls.websiteEnabled.value"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white">Website domain</h2>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Create and publish the tenant LMS website on this public web subdomain.
                  </p>
                </div>
                <span
                  class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold"
                  [class.border-emerald-200]="form.controls.websiteEnabled.value"
                  [class.bg-emerald-50]="form.controls.websiteEnabled.value"
                  [class.text-emerald-700]="form.controls.websiteEnabled.value"
                  [class.dark:border-emerald-900]="form.controls.websiteEnabled.value"
                  [class.dark:bg-emerald-950/30]="form.controls.websiteEnabled.value"
                  [class.dark:text-emerald-300]="form.controls.websiteEnabled.value"
                  [class.border-slate-200]="!form.controls.websiteEnabled.value"
                  [class.text-slate-600]="!form.controls.websiteEnabled.value"
                  [class.dark:border-slate-800]="!form.controls.websiteEnabled.value"
                  [class.dark:text-slate-300]="!form.controls.websiteEnabled.value"
                >
                  <mat-icon class="text-base">public</mat-icon>
                  {{ form.controls.websiteEnabled.value ? 'Published' : 'Not created' }}
                </span>
              </div>

              <div class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div class="grid gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-950/40">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Public URL</span>
                  <a
                    class="break-all text-sm font-bold text-indigo-700 hover:underline dark:text-indigo-300"
                    [href]="previewUrl()"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ displayWebsiteUrl() }}
                  </a>
                </div>

                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  [disabled]="saving() || !settings()?.lmsEnabled || form.invalid"
                  (click)="createWebsiteDomain()"
                >
                  <mat-icon class="text-base">{{ saving() ? 'sync' : 'add_link' }}</mat-icon>
                  {{ form.controls.websiteEnabled.value ? 'Update domain' : 'Create domain' }}
                </button>
              </div>
            </section>

            <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white">Website templates</h2>
                  <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Select one of the LMS website templates.</p>
                </div>
                <label class="hidden items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <input type="checkbox" formControlName="websiteEnabled" class="h-4 w-4 accent-indigo-600">
                  Website enabled
                </label>
              </div>

              <div class="mt-5 grid gap-4 md:grid-cols-3">
                @for (template of settings()?.templates ?? []; track template.key) {
                  <button
                    type="button"
                    class="rounded-xl border p-4 text-left transition-colors"
                    [class.border-indigo-500]="form.controls.selectedTemplateKey.value === template.key"
                    [class.bg-indigo-50]="form.controls.selectedTemplateKey.value === template.key"
                    [class.dark:bg-indigo-950/30]="form.controls.selectedTemplateKey.value === template.key"
                    [class.border-slate-200]="form.controls.selectedTemplateKey.value !== template.key"
                    [class.dark:border-slate-800]="form.controls.selectedTemplateKey.value !== template.key"
                    (click)="selectTemplate(template.key)"
                  >
                    <div class="flex h-32 items-center justify-center rounded-lg bg-slate-950 text-center text-sm font-bold text-amber-300">
                      {{ template.name }}
                    </div>
                    <h3 class="mt-3 text-sm font-bold text-slate-900 dark:text-white">{{ template.name }}</h3>
                    <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{{ template.description }}</p>
                  </button>
                }
              </div>
            </section>

            <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">Website content</h2>
              <div class="mt-5 grid gap-4 md:grid-cols-2">
                <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Teacher name
                  <input class="tenant-lms-input" formControlName="teacherName">
                </label>
                <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Subject
                  <input class="tenant-lms-input" formControlName="subject">
                </label>
                <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Audience
                  <input class="tenant-lms-input" formControlName="audience">
                </label>
                <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Portrait URL
                  <input class="tenant-lms-input" formControlName="portraitImageUrl">
                </label>
                <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 md:col-span-2">
                  Headline
                  <input class="tenant-lms-input" formControlName="headline">
                </label>
                <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 md:col-span-2">
                  Subheadline
                  <textarea class="tenant-lms-input min-h-24" formControlName="subheadline"></textarea>
                </label>
                <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 md:col-span-2">
                  Announcement
                  <input class="tenant-lms-input" formControlName="announcement">
                </label>
                <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Primary CTA
                  <input class="tenant-lms-input" formControlName="primaryCtaLabel">
                </label>
                <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Secondary CTA
                  <input class="tenant-lms-input" formControlName="secondaryCtaLabel">
                </label>
              </div>
            </section>
          </div>

          <aside class="space-y-4">
            <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 class="text-base font-bold text-slate-900 dark:text-white">Selected template</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ selectedTemplateName() }}</p>
              @if (saveMessage()) {
                <p class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{{ saveMessage() }}</p>
              }
              @if (saveError()) {
                <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">{{ saveError() }}</p>
              }
              <button
                type="submit"
                class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                [disabled]="saving() || !settings()?.lmsEnabled || form.invalid"
              >
                <mat-icon class="text-base">{{ saving() ? 'sync' : 'save' }}</mat-icon>
                {{ saving() ? 'Saving...' : 'Save LMS website' }}
              </button>
            </section>
          </aside>
        </form>
      }
    </section>
  `,
  styles: [`
    .tenant-lms-input {
      width: 100%;
      border-radius: 0.75rem;
      border: 1px solid rgb(203 213 225);
      background: rgb(248 250 252);
      padding: 0.75rem 0.875rem;
      color: rgb(15 23 42);
      outline: none;
      transition: border-color 0.16s ease, box-shadow 0.16s ease;
    }

    .tenant-lms-input:focus {
      border-color: rgb(99 102 241);
      box-shadow: 0 0 0 3px rgb(99 102 241 / 0.16);
    }

    :host-context(.dark) .tenant-lms-input {
      border-color: rgb(30 41 59);
      background: rgb(15 23 42);
      color: white;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantLmsSettingsComponent implements OnInit {
  private readonly data = inject(TenantLmsSettingsDataService);
  private readonly fb = inject(FormBuilder);
  private readonly identity = inject(AuthIdentityService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saveMessage = signal<string | null>(null);
  readonly settings = signal<TenantLmsSettingsView | null>(null);

  readonly hasLmsFromIdentity = computed(() => this.identity.identity()?.tenantPlan?.moduleCodes?.includes('lms') ?? false);

  readonly form = this.fb.nonNullable.group({
    websiteEnabled: [true],
    selectedTemplateKey: ['classic-math', Validators.required],
    teacherName: [''],
    subject: [''],
    audience: [''],
    headline: [''],
    subheadline: [''],
    announcement: [''],
    primaryCtaLabel: [''],
    secondaryCtaLabel: [''],
    portraitImageUrl: [''],
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const settings = await this.data.getSettings();
      this.applySettings(settings);
    } catch {
      this.loadError.set('Unable to load LMS settings right now.');
    } finally {
      this.loading.set(false);
    }
  }

  selectTemplate(templateKey: string): void {
    this.form.controls.selectedTemplateKey.setValue(templateKey);
    this.saveMessage.set(null);
  }

  async save(successMessage = 'LMS website settings saved.'): Promise<void> {
    if (this.form.invalid || this.saving() || !this.settings()?.lmsEnabled) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    this.saveMessage.set(null);
    try {
      const value = this.form.getRawValue();
      const payload: SaveTenantLmsSettingsRequest = {
        ...value,
        portraitImageUrl: value.portraitImageUrl || null,
      };
      const settings = await this.data.saveSettings(payload);
      this.applySettings(settings);
      this.saveMessage.set(successMessage);
    } catch {
      this.saveError.set('Unable to save LMS settings.');
    } finally {
      this.saving.set(false);
    }
  }

  selectedTemplateName(): string {
    const selected = this.form.controls.selectedTemplateKey.value;
    return this.settings()?.templates.find((template) => template.key === selected)?.name ?? selected;
  }

  async createWebsiteDomain(): Promise<void> {
    if (!this.settings()?.lmsEnabled || this.saving()) {
      return;
    }
    this.form.controls.websiteEnabled.setValue(true);
    await this.save('LMS website domain is active.');
  }

  previewUrl(): string {
    const settings = this.settings();
    if (!settings) {
      return '#';
    }
    if (this.isLocalHost()) {
      return `http://web.${settings.tenantSlug}.local.az-edumanage.test:3000/?tenant=${encodeURIComponent(settings.tenantSlug)}`;
    }
    return this.productionWebsiteUrl(settings);
  }

  displayWebsiteUrl(): string {
    const settings = this.settings();
    if (!settings) {
      return '';
    }
    if (this.isLocalHost()) {
      return this.previewUrl();
    }
    return this.productionWebsiteUrl(settings);
  }

  private isLocalHost(): boolean {
    const hostname = globalThis.location?.hostname ?? '';
    return hostname === 'localhost' || hostname.endsWith('.local.az-edumanage.test');
  }

  private productionWebsiteUrl(settings: TenantLmsSettingsView): string {
    if (settings.websiteUrl?.trim()) {
      return settings.websiteUrl.trim();
    }
    const host = settings.websiteHost?.trim() || this.derivedWebsiteHost(settings.tenantSlug);
    return `https://${host}`;
  }

  private derivedWebsiteHost(slug: string): string {
    const hostname = globalThis.location?.hostname ?? '';
    if (hostname.endsWith('.local.az-edumanage.test')) {
      return `web.${slug}.local.az-edumanage.test`;
    }
    const parts = hostname.split('.');
    const root = parts.length > 2 ? parts.slice(1).join('.') : 'az-edumanage.com';
    return `web.${slug}.${root}`;
  }

  private applySettings(settings: TenantLmsSettingsView): void {
    this.settings.set({
      ...settings,
      lmsEnabled: settings.lmsEnabled || this.hasLmsFromIdentity(),
    });
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
      secondaryCtaLabel: settings.brand.secondaryCtaLabel,
      portraitImageUrl: settings.brand.portraitImageUrl ?? '',
    });
    if (!settings.lmsEnabled && !this.hasLmsFromIdentity()) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  }
}
