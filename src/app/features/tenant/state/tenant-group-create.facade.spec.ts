import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { TenantGroupCreateFacade } from './tenant-group-create.facade';

describe('TenantGroupCreateFacade', () => {
  let facade: TenantGroupCreateFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: { navigate: () => Promise.resolve(true), url: '/tenant/groups/create' },
        },
        {
          provide: TaskService,
          useValue: {
            getTask: () => undefined,
            removeTask: () => undefined,
            addTask: () => undefined,
          },
        },
      ],
    });

    facade = TestBed.inject(TenantGroupCreateFacade);
  });

  it('should toggle teacher dropdown and close others', () => {
    facade.toggleGradeDropdown();
    facade.toggleTeacherDropdown();

    expect(facade.showTeacherDropdown()).toBe(true);
    expect(facade.showGradeDropdown()).toBe(false);
  });

  it('should add and remove selected day', () => {
    facade.onDayToggle('Monday');
    expect(facade.selectedDays()).toContain('Monday');

    facade.onDayToggle('Monday');
    expect(facade.selectedDays()).not.toContain('Monday');
  });
});
