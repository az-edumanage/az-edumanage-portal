import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { DashboardActionsRegistry } from './dashboard-actions.registry';
import { DashboardActionPickerComponent } from './dashboard-action-picker.component';

describe('DashboardActionPickerComponent', () => {
  let fixture: ComponentFixture<DashboardActionPickerComponent>;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardActionPickerComponent],
      providers: [
        provideRouter([]),
        {
          provide: DashboardActionsRegistry,
          useValue: {
            availableActions: vi.fn(() => [
              {
                id: 'students.create',
                labelKey: 'Add Student',
                descriptionKey: 'Create a new student',
                keywords: ['student'],
                categoryKey: 'Academic',
                icon: 'person_add',
                route: '/tenant/students/create',
              },
            ]),
          },
        },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(DashboardActionPickerComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('renders available actions and navigates on selection', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[class*="flex w-full"]');
    button.click();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tenant/students/create');
  });

  it('emits close and clears query', () => {
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance.query.set('student');

    fixture.componentInstance.close();

    expect(closed).toHaveBeenCalled();
    expect(fixture.componentInstance.query()).toBe('');
  });
});
