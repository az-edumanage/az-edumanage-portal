import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

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
}
