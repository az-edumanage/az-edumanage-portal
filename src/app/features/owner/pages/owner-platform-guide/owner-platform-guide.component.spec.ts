import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OwnerPlatformGuideDataService } from '../../data-access/owner-platform-guide-data.service';
import { PlatformGuideCardPayload } from '../../../platform-guide/platform-guide.models';
import { OwnerPlatformGuideComponent } from './owner-platform-guide.component';

describe('OwnerPlatformGuideComponent', () => {
  let fixture: ComponentFixture<OwnerPlatformGuideComponent>;
  const data = {
    list: vi.fn(() => of([])),
    create: vi.fn((payload: PlatformGuideCardPayload) => of({ id: 1, ...payload })),
    update: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [OwnerPlatformGuideComponent],
      providers: [{ provide: OwnerPlatformGuideDataService, useValue: data }],
    }).compileComponents();
    fixture = TestBed.createComponent(OwnerPlatformGuideComponent);
    fixture.detectChanges();
  });

  it('opens the editor and creates a bilingual guide card', () => {
    fixture.componentInstance.openCreate();
    fixture.componentInstance.form.setValue({
      title: 'Add a teacher',
      titleAr: 'إضافة معلم',
      description: 'Create a teacher account.',
      descriptionAr: 'أنشئ حساب معلم.',
      imageUrl: '/api/v1/public/website-assets/platform-guide/platform-guide-image/image.webp',
      videoUrl: 'https://youtu.be/example1',
      visible: true,
      displayOrder: 2,
    });

    fixture.componentInstance.save();

    expect(data.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Add a teacher',
      titleAr: 'إضافة معلم',
      visible: true,
      displayOrder: 2,
    }));
    expect(fixture.componentInstance.editorOpen()).toBe(false);
  });
});
