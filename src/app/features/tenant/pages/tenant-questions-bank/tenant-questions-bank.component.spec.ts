import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TenantQuestionsBankComponent } from './tenant-questions-bank.component';

describe('TenantQuestionsBankComponent', () => {
  let fixture: ComponentFixture<TenantQuestionsBankComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantQuestionsBankComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantQuestionsBankComponent);
    fixture.detectChanges();
  });

  it('renders the two education question bank track cards', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Questions Bank');
    expect(text).toContain('Basic Education');
    expect(text).toContain('University Education');
    expect(text).toContain('Subject questions');
  });

  it('links basic education to the subject question bank route', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/tenant/questions-bank/basic-education');
  });

  it('links university education to the subject question bank route', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/tenant/questions-bank/university-education');
  });
});
