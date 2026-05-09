import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('rtl');
    document.documentElement.lang = '';
    document.documentElement.dir = '';

    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  it('should apply english defaults on init', () => {
    service.initLanguage();

    expect(document.documentElement.classList.contains('rtl')).toBe(false);
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('should persist arabic and apply rtl metadata', () => {
    service.initLanguage();
    service.setLanguage('ar');

    expect(localStorage.getItem('language')).toBe('ar');
    expect(document.documentElement.classList.contains('rtl')).toBe(true);
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('should translate known keys and fallback unknown values', () => {
    expect(service.t('owner.tenants.title')).toBe('Tenants Management');

    service.setLanguage('ar');
    expect(service.t('owner.tenants.title')).toBe('إدارة العملاء');
    expect(service.t('unknown.translation.key')).toBe('unknown.translation.key');
  });
});
