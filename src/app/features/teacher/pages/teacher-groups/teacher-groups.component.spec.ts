import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherAssignedGroup } from '../../models/teacher.models';
import { TEACHER_ROUTES } from '../../routes';
import { TeacherGroupsComponent } from './teacher-groups.component';

describe('TeacherGroupsComponent', () => {
  let api: { loadAssignedGroups: () => Observable<TeacherAssignedGroup[]> };
  let fixture: ComponentFixture<TeacherGroupsComponent>;

  beforeEach(async () => {
    api = { loadAssignedGroups: () => of([
      {
        id: 'group-1',
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
    ]) };

    await TestBed.configureTestingModule({
      imports: [TeacherGroupsComponent],
      providers: [{ provide: TeacherApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherGroupsComponent);
    fixture.detectChanges();
  });

  it('routes /teacher/groups to the dedicated page component', () => {
    const route = TEACHER_ROUTES.find((candidate) => candidate.path === 'groups');
    expect(route?.component).toBe(TeacherGroupsComponent);
  });

  it('renders My Groups content without generic dashboard or tenant management actions', () => {
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('My Groups');
    expect(text).toContain('Grade 3 - A');
    expect(text).toContain('Advanced Filters');
    expect(text).not.toContain('Center Dashboard');
    expect(text).not.toContain('Create Group');
    expect(text).not.toContain('Delete');
  });

  it('supports search and no-results state', () => {
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'missing';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No matching groups');
  });
});
