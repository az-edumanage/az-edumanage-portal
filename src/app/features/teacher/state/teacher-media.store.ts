import { Injectable, computed, inject, signal } from '@angular/core';
import { TeacherMediaDataService } from '../data-access/teacher-media-data.service';

@Injectable({ providedIn: 'root' })
export class TeacherMediaStore {
  private readonly data = inject(TeacherMediaDataService);

  readonly tabs = ['All', 'Exams', 'Videos', 'PDFs', 'Images'];
  readonly activeTab = signal('All');
  readonly mediaItems = this.data.mediaItems;

  readonly filteredMedia = computed(() => {
    const tab = this.activeTab();
    if (tab === 'All') return this.mediaItems();
    const type = tab.slice(0, -1);
    return this.mediaItems().filter((item) => item.type === type);
  });
}
