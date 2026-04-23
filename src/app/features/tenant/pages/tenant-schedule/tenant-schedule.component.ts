import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';
import { TenantScheduleFacade } from '../../state/tenant-schedule.facade';

@Component({
  selector: 'app-tenant-schedule',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './tenant-schedule.component.html'})
export class TenantScheduleComponent {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(TenantScheduleFacade);

  readonly days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  readonly timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  readonly filterForm = this.fb.group({
    teacher: [''],
    room: [''],
    day: [''],
  });

  readonly teachers = this.facade.teachers;
  readonly rooms = this.facade.rooms;
  readonly activeFiltersCount = this.facade.activeFiltersCount;

  constructor() {
    this.filterForm.valueChanges
      .pipe(startWith(this.filterForm.value), takeUntilDestroyed())
      .subscribe((value) => {
        this.facade.setFilters({
          teacher: value.teacher ?? '',
          room: value.room ?? '',
          day: value.day ?? '',
        });
      });
  }

  getSessionsFor(day: string, time: string) {
    return this.facade.getSessionsFor(day, time);
  }

  resetFilters(): void {
    this.filterForm.reset({
      teacher: '',
      room: '',
      day: '',
    });
    this.facade.resetFilters();
  }
}
