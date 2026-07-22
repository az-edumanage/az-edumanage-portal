import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { I18nService } from '../../services/i18n.service';
import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent action shortcut', () => {
  let routerEvents: Subject<NavigationEnd>;
  let routerStub: { url: string; events: Subject<NavigationEnd> };
  let sidebarCollapsed: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    routerEvents = new Subject<NavigationEnd>();
    routerStub = { url: '/tenant/overview', events: routerEvents };
    sidebarCollapsed = signal(false);
    TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            sidebarCollapsed,
            syncRoleFromUrl: vi.fn(),
          },
        },
        { provide: I18nService, useValue: { language: signal<'en' | 'ar'>('en') } },
        { provide: Router, useValue: routerStub },
      ],
    }).overrideComponent(MainLayoutComponent, {
      set: {
        imports: [],
        template: '',
      },
    });
  });

  it('opens the action picker when slash is pressed on tenant pages', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    vi.spyOn(event, 'preventDefault');

    fixture.componentInstance.onDocumentKeydown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(fixture.componentInstance.actionPickerOpen()).toBe(true);
  });

  it('does not open the action picker from text inputs', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true });
    Object.defineProperty(event, 'target', { value: input });

    fixture.componentInstance.onDocumentKeydown(event);

    expect(fixture.componentInstance.actionPickerOpen()).toBe(false);
  });

  it('closes the action picker on route changes', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.componentInstance.actionPickerOpen.set(true);

    routerEvents.next(new NavigationEnd(1, '/tenant/overview', '/tenant/students'));

    expect(fixture.componentInstance.actionPickerOpen()).toBe(false);
  });

  it('collapses the main sidebar when the LMS workspace opens', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);

    routerEvents.next(new NavigationEnd(1, '/tenant/lms-settings', '/tenant/lms-settings/publishing'));

    expect(fixture.componentInstance.isLmsWorkspace()).toBe(true);
    expect(sidebarCollapsed()).toBe(true);
  });

  it('restores the previous sidebar state after leaving the LMS workspace', () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);

    routerEvents.next(new NavigationEnd(1, '/tenant/lms-settings', '/tenant/lms-settings/content'));
    routerEvents.next(new NavigationEnd(2, '/tenant/overview', '/tenant/overview'));

    expect(fixture.componentInstance.isLmsWorkspace()).toBe(false);
    expect(sidebarCollapsed()).toBe(false);
  });
});
