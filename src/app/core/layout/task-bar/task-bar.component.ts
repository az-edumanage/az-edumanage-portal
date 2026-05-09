import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TaskService, ActiveTask } from '../../services/task.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-task-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './task-bar.component.html',
  styleUrl: './task-bar.component.css'})
export class TaskBarComponent {
  readonly taskService = inject(TaskService);
  private readonly i18nService = inject(I18nService);
  private readonly router = inject(Router);
  
  isDropdownOpen = signal(false);

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
  }

  navigateToTask(task: ActiveTask) {
    const route = task.route;
    
    // Close dropdown
    this.isDropdownOpen.set(false);
    
    // Navigate
    this.router.navigate([route]);
  }

  clearAll() {
    this.isDropdownOpen.set(false);
    this.taskService.clearAll();
  }

  t(text: string) {
    return this.i18nService.t(text);
  }
}
