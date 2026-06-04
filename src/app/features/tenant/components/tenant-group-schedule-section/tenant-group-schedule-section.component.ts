import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TeacherUnavailableRange } from '../../models/tenant-group-create.models';

@Component({
  selector: 'app-tenant-group-schedule-section',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-group-schedule-section.component.html',
  styleUrl: './tenant-group-schedule-section.component.css',
})
export class TenantGroupScheduleSectionComponent {
  readonly groupForm = input.required<FormGroup>();
  readonly days = input<string[]>([]);
  readonly selectedDays = input<string[]>([]);
  readonly unavailableRanges = input<TeacherUnavailableRange[]>([]);
  readonly hasAvailabilityConflict = input(false);

  readonly dayToggled = output<string>();
  readonly timeTypeChanged = output<boolean>();

  isSelected(day: string): boolean {
    return this.selectedDays().includes(day);
  }

  onDayToggle(day: string): void {
    this.dayToggled.emit(day);
  }

  onTimeTypeChange(isFixed: boolean): void {
    this.timeTypeChanged.emit(isFixed);
  }

  fixedTimeConflicts(): boolean {
    const start = this.timeToMinute(this.groupForm().get('startTime')?.value ?? '');
    const duration = Number(this.groupForm().get('duration')?.value ?? 0);
    if (start === null || !Number.isFinite(duration) || duration <= 0) {
      return false;
    }
    return this.selectedDays().some((day) => this.conflictsWithRanges(day, start, start + duration));
  }

  dayScheduleConflicts(day: string): boolean {
    const group = this.groupForm().get(['daySchedules', day]) as FormGroup | null;
    const start = this.timeToMinute(group?.get('startTime')?.value ?? '');
    const end = this.timeToMinute(group?.get('endTime')?.value ?? '');
    return start !== null && end !== null && this.conflictsWithRanges(day, start, end);
  }

  private conflictsWithRanges(day: string, start: number, end: number): boolean {
    if (end <= start) {
      return false;
    }
    const normalizedDay = day.trim().toLowerCase();
    return this.unavailableRanges().some((range) => {
      if ((range.day ?? '').trim().toLowerCase() !== normalizedDay) {
        return false;
      }
      const rangeStart = this.timeToMinute(range.startTime);
      if (rangeStart === null || !range.duration) {
        return false;
      }
      const rangeEnd = rangeStart + range.duration;
      return start < rangeEnd && end > rangeStart;
    });
  }

  private timeToMinute(value: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    return hour * 60 + minute;
  }
}
