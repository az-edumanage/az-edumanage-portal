import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TenantExamsComponent } from './tenant-exams.component';

describe('TenantExamsComponent', () => {
  let fixture: ComponentFixture<TenantExamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantExamsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantExamsComponent);
    fixture.detectChanges();
  });

  it('renders the two education exam track cards', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Exams');
    expect(text).toContain('Basic Education');
    expect(text).toContain('University Education');
    expect(text).toContain('Education stages');
    expect(text).toContain('Universities');
  });

  it('links basic education to the existing education stages route under exams', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/tenant/exams/basic-education');
  });

  it('links university education to the existing universities route under exams', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')).map((anchor) => (anchor as HTMLAnchorElement).pathname);

    expect(links).toContain('/tenant/exams/university-education');
  });
});
