import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { of, throwError } from 'rxjs';
import { TeacherApiService } from '../data-access/teacher-api.service';
import { TeacherAssignedGroup } from '../models/teacher.models';
import { TeacherGroupsStore } from './teacher-groups.store';

const groups: TeacherAssignedGroup[] = [
  {
    id: 'math',
    name: 'Grade 3 - A',
    subject: 'Math',
    educationCategory: 'BASIC_EDUCATION',
    stage: 'Primary',
    grade: 'Grade 3',
    studentsCount: 15,
    schedule: 'Sun 17:00',
    startAt: '17:00',
    duration: 60,
    room: 'Room 3',
    status: 'Active',
  },
  {
    id: 'science',
    name: 'Science Group',
    subject: 'Science',
    educationCategory: 'UNIVERSITY_EDUCATION',
    university: 'Cairo University',
    college: 'Science',
    studentsCount: 8,
    schedule: 'Flexible schedule',
    room: 'Lab 1',
    status: 'Inactive',
  },
];

describe('TeacherGroupsStore', () => {
  let api: { loadAssignedGroups: () => Observable<TeacherAssignedGroup[]> };
  let store: TeacherGroupsStore;

  beforeEach(() => {
    api = { loadAssignedGroups: () => of([]) };
    TestBed.configureTestingModule({
      providers: [{ provide: TeacherApiService, useValue: api }],
    });
  });

  function injectStore(): void {
    store = TestBed.inject(TeacherGroupsStore);
  }

  it('loads assigned groups and defaults to list view', () => {
    api.loadAssignedGroups = () => of(groups);
    injectStore();

    store.loadGroups();

    expect(store.groups()).toEqual(groups);
    expect(store.loaded()).toBe(true);
    expect(store.empty()).toBe(false);
    expect(store.failed()).toBe(false);
    expect(store.viewMode()).toBe('list');
  });

  it('sets empty state for teachers without assigned groups', () => {
    api.loadAssignedGroups = () => of([]);
    injectStore();

    store.loadGroups();

    expect(store.empty()).toBe(true);
    expect(store.filteredGroups()).toEqual([]);
  });

  it('sets failed state and supports retry', () => {
    let calls = 0;
    api.loadAssignedGroups = () => {
      calls += 1;
      return calls === 1 ? throwError(() => new Error('Load failed')) : of(groups);
    };
    injectStore();

    store.loadGroups();
    expect(store.failed()).toBe(true);
    expect(store.errorMessage()).toBe('Load failed');

    store.retry();
    expect(store.failed()).toBe(false);
    expect(store.groups().length).toBe(2);
  });

  it('filters assigned groups locally by subject, room, stage, grade, university and college', () => {
    api.loadAssignedGroups = () => of(groups);
    injectStore();
    store.loadGroups();

    store.setSearchQuery('room 3');
    expect(store.filteredGroups().map((group) => group.id)).toEqual(['math']);

    store.setSearchQuery('grade 3');
    expect(store.filteredGroups().map((group) => group.id)).toEqual(['math']);

    store.setSearchQuery('cairo university');
    expect(store.filteredGroups().map((group) => group.id)).toEqual(['science']);

    store.setSearchQuery('');
    store.setFilters('Science', 'University Education', 'Inactive', 'students-desc');
    expect(store.filteredGroups().map((group) => group.id)).toEqual(['science']);

    store.clearAllFilters();
    expect(store.filteredGroups().length).toBe(2);
  });
});
