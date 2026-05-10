import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiPagerButtonComponent } from './pager-button.component';

describe('UiPagerButtonComponent', () => {
  it('renders with default props', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [UiPagerButtonComponent],
    }).createComponent(UiPagerButtonComponent);

    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.type).toBe('button');
    expect(btn.disabled).toBe(false);
    expect(btn.className).toBe('ds-pager-button');
  });

  it('renders with disabled=true', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [UiPagerButtonComponent],
    }).createComponent(UiPagerButtonComponent);

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(true);
  });

  it('renders with custom type and className', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [UiPagerButtonComponent],
    }).createComponent(UiPagerButtonComponent);

    fixture.componentRef.setInput('type', 'submit');
    fixture.componentRef.setInput('className', 'custom-class');
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.type).toBe('submit');
    expect(btn.className).toContain('ds-pager-button');
    expect(btn.className).toContain('custom-class');
  });

  it('projects ng-content', () => {
    @Component({
      template: `<app-pager-button><span class="projected">Click me</span></app-pager-button>`,
      imports: [UiPagerButtonComponent],
      standalone: true,
    })
    class TestHostComponent {}

    const fixture = TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).createComponent(TestHostComponent);

    fixture.detectChanges();

    const projected = fixture.nativeElement.querySelector('.projected');
    expect(projected).toBeTruthy();
    expect(projected.textContent).toBe('Click me');
  });
});
