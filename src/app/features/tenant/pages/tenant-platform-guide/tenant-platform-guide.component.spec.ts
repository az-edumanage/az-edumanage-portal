import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { I18nService } from '../../../../core/services/i18n.service';
import { PlatformGuideCard } from '../../../platform-guide/platform-guide.models';
import { TenantPlatformGuideDataService } from '../../data-access/tenant-platform-guide-data.service';
import { TenantPlatformGuideComponent } from './tenant-platform-guide.component';

describe('TenantPlatformGuideComponent', () => {
  let fixture: ComponentFixture<TenantPlatformGuideComponent>;
  const card = guideCard();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantPlatformGuideComponent],
      providers: [{ provide: TenantPlatformGuideDataService, useValue: { list: () => of([card]) } }],
    }).compileComponents();
    fixture = TestBed.createComponent(TenantPlatformGuideComponent);
    fixture.detectChanges();
  });

  it('renders guide cards and opens a direct video in a modal', () => {
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.tenant-guide-card');
    expect(button?.textContent).toContain('Create a group');

    button?.click();
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Create a group');
    expect(dialog?.querySelector('video')).not.toBeNull();
  });

  it('uses Arabic card content when the application language is Arabic', () => {
    TestBed.inject(I18nService).setLanguage('ar');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('إنشاء مجموعة');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('دليل الاستخدام');
  });
});

function guideCard(): PlatformGuideCard {
  return {
    id: 1,
    title: 'Create a group',
    titleAr: 'إنشاء مجموعة',
    description: 'Learn how to create and schedule a group.',
    descriptionAr: 'تعرف على كيفية إنشاء مجموعة وجدولتها.',
    imageUrl: 'https://example.com/group.webp',
    videoUrl: 'https://example.com/group.mp4',
    visible: true,
    displayOrder: 0,
    createdAt: '2026-07-18T12:00:00Z',
    updatedAt: '2026-07-18T12:00:00Z',
  };
}
