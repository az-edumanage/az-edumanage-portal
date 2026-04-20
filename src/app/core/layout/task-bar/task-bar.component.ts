import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TaskService, ActiveTask } from '../../services/task.service';

@Component({
  selector: 'app-task-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './task-bar.component.html',
  styleUrl: './task-bar.component.css'})
export class TaskBarComponent {
  taskService = inject(TaskService);
  private router = inject(Router);
  
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
}
