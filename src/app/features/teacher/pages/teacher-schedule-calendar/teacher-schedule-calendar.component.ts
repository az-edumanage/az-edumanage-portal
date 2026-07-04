import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherScheduleSession } from '../../models/teacher.models';

@Component({
  selector: 'app-teacher-schedule-calendar',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <section class="student-calendar-page">
      <header class="student-calendar-header">
        <div>
          <h1>Schedule Calendar</h1>
          <p>Your assigned sessions displayed as a weekly timetable.</p>
        </div>
        <a class="student-calendar-button" routerLink="/teacher/schedule">
          <mat-icon>table_rows</mat-icon>
          Table
        </a>
      </header>

      @if (loading()) {
        <div class="student-calendar-state">Loading schedule...</div>
      } @else if (error()) {
        <div class="student-calendar-state student-calendar-state--error">{{ error() }}</div>
      } @else {
        <div class="student-calendar-grid-shell">
          <div class="student-calendar-grid-scroll">
            <div class="student-calendar-grid-min">
              <div class="student-calendar-grid-head">
                <div class="student-calendar-grid-head-time"></div>
                @for (day of days; track day) {
                  <div class="student-calendar-grid-head-day">{{ day }}</div>
                }
              </div>

              @for (timeSlot of timeSlots(); track timeSlot) {
                <div class="student-calendar-grid-row">
                  <div class="student-calendar-grid-time">{{ formatScheduleTime(timeSlot) }}</div>
                  @for (day of days; track day) {
                    <button
                      type="button"
                      class="student-calendar-grid-cell"
                      [attr.aria-label]="'Open schedule for ' + day + ' at ' + formatScheduleTime(timeSlot)"
                      (click)="openScheduleCell(day, timeSlot)"
                    >
                      @let cellSessions = sessionsFor(day, timeSlot);
                      @if (cellSessions.length > 0) {
                        <div class="student-calendar-session-cluster" [attr.aria-label]="cellSessions.length + ' sessions'">
                          @for (session of cellSessions.slice(0, 3); track session.id; let chipIndex = $index) {
                            <span class="student-calendar-session-chip" [class]="colorClass(session)">
                              {{ chipLabel(session.groupName, chipIndex) }}
                            </span>
                          }
                          @if (cellSessions.length > 3) {
                            <span class="student-calendar-session-chip student-calendar-session-chip--more">+{{ cellSessions.length - 3 }}</span>
                          }
                        </div>
                      }
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        @if (selectedCellDay() && selectedCellTime()) {
          <div class="student-calendar-dialog-backdrop" (click)="closeScheduleCell()">
            <section class="student-calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="teacher-calendar-dialog-title" (click)="$event.stopPropagation()">
              <div class="student-calendar-dialog-head">
                <div>
                  <h2 id="teacher-calendar-dialog-title">Schedule</h2>
                  <p>{{ selectedCellSessions().length }} sessions scheduled</p>
                </div>
                <button type="button" class="student-calendar-dialog-close" (click)="closeScheduleCell()" aria-label="Close schedule">
                  <mat-icon>close</mat-icon>
                </button>
              </div>

              <div class="student-calendar-dialog-meta">
                <div>
                  <span>Day</span>
                  <strong>{{ selectedCellDay() }}</strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>{{ formatScheduleTime(selectedCellTime()) }}</strong>
                </div>
              </div>

              <div class="student-calendar-dialog-list">
                @for (session of selectedCellSessions(); track session.id) {
                  <article class="student-calendar-detail-card" [class]="colorClass(session)">
                    <div class="student-calendar-detail-time">{{ formatSessionTimeRange(session) }}</div>
                    <h3>{{ session.groupName }}</h3>
                    <p>{{ session.subjectName || 'Subject not set' }}</p>
                    <dl>
                      <dt>Students</dt>
                      <dd>{{ session.studentsCount ?? '-' }}</dd>
                      <dt>Room</dt>
                      <dd>{{ session.roomName || '-' }}</dd>
                      <dt>Duration</dt>
                      <dd>{{ formatSessionDuration(session) }}</dd>
                    </dl>
                  </article>
                } @empty {
                  <div class="student-calendar-empty">No session in this time slot.</div>
                }
              </div>
            </section>
          </div>
        }
      }
    </section>
  `,
  styleUrl: '../../../student/pages/student-schedule-calendar/student-schedule-calendar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherScheduleCalendarComponent implements OnInit {
  private readonly data = inject(TeacherApiService);

  readonly days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  readonly baseTimeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00',
  ];
  readonly sessions = signal<TeacherScheduleSession[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedCellDay = signal<string | null>(null);
  readonly selectedCellTime = signal<string | null>(null);
  readonly timeSlots = computed(() => {
    const slots = new Set(this.baseTimeSlots);
    for (const session of this.sessions()) {
      const normalized = this.normalizeTime(session.startTime);
      if (normalized) {
        slots.add(normalized);
      }
    }
    return [...slots].sort((a, b) => (this.toMinutes(a) ?? 0) - (this.toMinutes(b) ?? 0));
  });
  readonly selectedCellSessions = computed(() => {
    const day = this.selectedCellDay();
    const time = this.selectedCellTime();
    return day && time ? this.sessionsFor(day, time) : [];
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.sessions.set(await firstValueFrom(this.data.schedule()));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load schedule');
    } finally {
      this.loading.set(false);
    }
  }

  sessionsFor(day: string, time: string): TeacherScheduleSession[] {
    const normalizedTime = this.normalizeTime(time);
    return this.sessions().filter((session) =>
      session.day === day && this.normalizeTime(session.startTime) === normalizedTime);
  }

  openScheduleCell(day: string, time: string): void {
    this.selectedCellDay.set(day);
    this.selectedCellTime.set(time);
  }

  closeScheduleCell(): void {
    this.selectedCellDay.set(null);
    this.selectedCellTime.set(null);
  }

  formatScheduleTime(time: string | null): string {
    if (!time) {
      return '';
    }
    const minutes = this.toMinutes(time);
    return minutes === null ? time : this.formatMinutes(minutes);
  }

  formatSessionTimeRange(session: TeacherScheduleSession): string {
    const start = this.toMinutes(session.startTime);
    if (start === null || !session.duration) {
      return this.formatScheduleTime(session.startTime);
    }
    return `${this.formatMinutes(start)} - ${this.formatMinutes(start + session.duration)}`;
  }

  formatSessionDuration(session: TeacherScheduleSession): string {
    const duration = session.duration;
    if (!duration) {
      return 'Duration not set';
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0 && minutes > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return hours > 0 ? `${hours} hr` : `${minutes} min`;
  }

  chipLabel(groupName: string, index: number): string {
    const match = groupName.match(/\b([A-Za-z])[\w-]*\s*(\d+)?/);
    return match ? `${match[1].toUpperCase()}${match[2] ?? index + 1}` : `G${index + 1}`;
  }

  colorClass(session: TeacherScheduleSession): string {
    const colors = ['tone-indigo', 'tone-emerald', 'tone-cyan', 'tone-amber', 'tone-rose'];
    return colors[Math.abs(this.hash(session.groupId || session.groupName)) % colors.length];
  }

  private normalizeTime(time: string | null | undefined): string | null {
    if (!time) {
      return null;
    }
    const [hourPart, minutePart = '00'] = time.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return time;
    }
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  private toMinutes(time: string | null | undefined): number | null {
    const normalized = this.normalizeTime(time);
    if (!normalized) {
      return null;
    }
    const [hourPart, minutePart = '0'] = normalized.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    return Number.isNaN(hour) || Number.isNaN(minute) ? null : hour * 60 + minute;
  }

  private formatMinutes(totalMinutes: number): string {
    const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const hour = Math.floor(normalizedMinutes / 60);
    const minute = normalizedMinutes % 60;
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  private hash(value: string): number {
    return [...value].reduce((total, char) => total + char.charCodeAt(0), 0);
  }
}
