import { TestBed } from '@angular/core/testing';
import { TeacherMediaStore } from './teacher-media.store';

describe('TeacherMediaStore', () => {
  let store: TeacherMediaStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TeacherMediaStore);
  });

  it('returns all media items when All tab is selected', () => {
    expect(store.activeTab()).toBe('All');
    expect(store.filteredMedia().length).toBe(6);
  });

  it('filters media items by selected tab', () => {
    store.activeTab.set('Videos');
    const filtered = store.filteredMedia();

    expect(filtered.length).toBe(2);
    expect(filtered.every((item) => item.type === 'Video')).toBe(true);
  });
});
