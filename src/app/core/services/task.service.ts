import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ActiveTask {
  id: string;
  type: string;
  label: string;
  route: string;
  data: unknown;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private tasks = signal<ActiveTask[]>([]);

  activeTasks = computed(() => this.tasks());

  addTask(task: Omit<ActiveTask, 'timestamp'>) {
    if (!this.isBrowser) return;
    
    this.tasks.update(current => {
      const existingIndex = current.findIndex(t => t.id === task.id);
      const newTask = { ...task, timestamp: Date.now() };
      
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = newTask;
        return updated;
      }
      
      return [...current, newTask];
    });
  }

  removeTask(id: string) {
    if (!this.isBrowser) return;
    this.tasks.update(current => current.filter(t => t.id !== id));
  }

  getTask(id: string) {
    if (!this.isBrowser) return undefined;
    return this.tasks().find(t => t.id === id);
  }

  clearAll() {
    if (!this.isBrowser) return;
    this.tasks.set([]);
  }
}
