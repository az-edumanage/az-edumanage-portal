import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { TaskBarComponent } from '../task-bar/task-bar.component';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';
import { I18nService } from '../../services/i18n.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardActionPickerComponent } from '../dashboard-action-picker/dashboard-action-picker.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, TaskBarComponent, MatIconModule, DashboardActionPickerComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'})
export class MainLayoutComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly i18nService = inject(I18nService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  
  collapsed = this.dashboardService.sidebarCollapsed;
  language = this.i18nService.language;
  readonly actionPickerOpen = signal(false);

  constructor() {
    this.dashboardService.syncRoleFromUrl(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.dashboardService.syncRoleFromUrl(event.urlAfterRedirects);
        this.actionPickerOpen.set(false);
      });
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.actionPickerOpen()) {
      event.preventDefault();
      this.actionPickerOpen.set(false);
      return;
    }
    if (event.key !== '/' || this.actionPickerOpen() || !this.router.url.startsWith('/tenant')) {
      return;
    }
    if (this.isTextEntryTarget(event.target)) {
      return;
    }
    event.preventDefault();
    this.actionPickerOpen.set(true);
  }

  closeActionPicker(): void {
    this.actionPickerOpen.set(false);
  }

  private isTextEntryTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    if (target.isContentEditable) {
      return true;
    }
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'textarea' || tagName === 'select') {
      return true;
    }
    if (tagName === 'input') {
      const input = target as HTMLInputElement;
      return !['button', 'checkbox', 'radio', 'submit', 'reset'].includes(input.type);
    }
    return Boolean(target.closest('[contenteditable="true"], math-field, .ql-editor, .ProseMirror'));
  }
}
