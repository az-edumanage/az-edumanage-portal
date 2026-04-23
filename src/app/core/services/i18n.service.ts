import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { AR_TRANSLATIONS } from '../i18n/ar';
import { EN_TRANSLATIONS, I18nKey } from '../i18n/en';

export type AppLanguage = 'en' | 'ar';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly language = signal<AppLanguage>(this.getInitialLanguage());
  readonly isRtl = computed(() => this.language() === 'ar');

  private getInitialLanguage(): AppLanguage {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('language');
      if (saved === 'en' || saved === 'ar') return saved;
      return navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
    }
    return 'en';
  }

  initLanguage(): void {
    this.applyToDocument();
  }

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
    this.applyToDocument();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('language', language);
    }
  }

  t(key: I18nKey): string;
  t(raw: string): string;
  t(value: string): string {
    const isArabic = this.language() === 'ar';
    if (isArabic) {
      return AR_TRANSLATIONS[value as I18nKey] ?? EN_TRANSLATIONS[value as I18nKey] ?? value;
    }
    return EN_TRANSLATIONS[value as I18nKey] ?? value;
  }

  private applyToDocument(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = this.document.documentElement;
    const rtl = this.isRtl();
    root.classList.toggle('rtl', rtl);
    root.lang = this.language();
    root.dir = rtl ? 'rtl' : 'ltr';
  }
}
