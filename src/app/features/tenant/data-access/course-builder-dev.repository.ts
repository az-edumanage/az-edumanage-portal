import { Injectable } from '@angular/core';

export interface CourseBuilderDevSnapshot {
  courseKey: string;
  savedAt: string;
  curriculum: unknown[];
  selectedNodeId: string | null;
}

@Injectable({ providedIn: 'root' })
export class CourseBuilderDevRepository {
  private readonly storagePrefix = 'tenant-lms-course-builder-dev:';

  async load(courseKey: string): Promise<CourseBuilderDevSnapshot | null> {
    if (!this.hasStorage()) return null;
    const raw = localStorage.getItem(this.storagePrefix + courseKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CourseBuilderDevSnapshot;
    } catch {
      return null;
    }
  }

  async save(snapshot: CourseBuilderDevSnapshot): Promise<CourseBuilderDevSnapshot> {
    if (this.hasStorage()) {
      localStorage.setItem(this.storagePrefix + snapshot.courseKey, JSON.stringify(snapshot));
    }
    return snapshot;
  }

  private hasStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
