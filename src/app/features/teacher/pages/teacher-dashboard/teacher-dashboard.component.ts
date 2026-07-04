import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { TenantGroupDetailsDataService } from '../../../tenant/data-access/tenant-group-details-data.service';
import { GroupCalendarEvent, GroupDetails } from '../../../tenant/models/tenant-group-details.models';
import { TeacherApiService } from '../../data-access/teacher-api.service';
import { TeacherAssignedGroup } from '../../models/teacher.models';

interface TeacherOverviewSession {
  id: string;
  groupId: string;
  groupName: string;
  subject: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  studentsCount: number;
}

interface TeacherOverviewKpi {
  label: string;
  value: string;
  meta: string;
  icon: string;
  tone: 'indigo' | 'blue' | 'amber' | 'emerald' | 'rose';
}

interface TeacherAttentionItem {
  icon: string;
  title: string;
  meta: string;
  route: string;
  severity: 'high' | 'medium' | 'info';
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: [
    './teacher-dashboard.component.css',
    './teacher-dashboard.attention.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {
  private readonly teacherApi = inject(TeacherApiService);
  private readonly groupDetailsApi = inject(TenantGroupDetailsDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly clockIntervalMs = 30_000;
  private clockHandle: ReturnType<typeof setInterval> | null = null;

  readonly groups = signal<TeacherAssignedGroup[]>([]);
  readonly sessions = signal<TeacherOverviewSession[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly now = signal(new Date());

  readonly todayKey = computed(() => this.formatDateKey(this.now()));
  readonly todayLabel = computed(() => new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(this.now()));

  readonly todaySessions = computed(() => this.sessions()
    .filter((session) => session.date === this.todayKey())
    .sort((left, right) => this.sessionStart(left).getTime() - this.sessionStart(right).getTime()));

  readonly upcomingSessions = computed(() => this.todaySessions()
    .filter((session) => this.sessionEnd(session).getTime() >= this.now().getTime()));

  readonly nextSession = computed(() => this.upcomingSessions()[0] ?? null);

  readonly weeklySessionsCount = computed(() => this.groups().reduce((total, group) => {
    const dayCount = Object.values(group.daySchedules ?? {}).filter((schedule) => schedule?.startTime).length;
    return total + (dayCount > 0 ? dayCount : this.scheduleDays(group.schedule).length);
  }, 0));

  readonly pendingAttendanceCount = computed(() => this.todaySessions()
    .filter((session) => this.sessionStatus(session) !== 'Upcoming')
    .length);

  readonly kpiCards = computed<TeacherOverviewKpi[]>(() => [
    {
      label: "Today's Sessions",
      value: String(this.todaySessions().length),
      meta: this.upcomingSessions().length > 0 ? `${this.upcomingSessions().length} remaining` : 'none remaining',
      icon: 'today',
      tone: 'indigo',
    },
    {
      label: 'Weekly Sessions',
      value: String(this.weeklySessionsCount()),
      meta: 'assigned this week',
      icon: 'calendar_view_week',
      tone: 'blue',
    },
    {
      label: 'My Groups',
      value: String(this.groups().length),
      meta: `${this.activeGroupsCount()} active`,
      icon: 'groups',
      tone: 'amber',
    },
    {
      label: 'Pending Attendance',
      value: String(this.pendingAttendanceCount()),
      meta: 'sessions ready to review',
      icon: 'fact_check',
      tone: 'emerald',
    },
  ]);

  readonly attentionItems = computed<TeacherAttentionItem[]>(() => {
    const items: TeacherAttentionItem[] = [];
    const running = this.todaySessions().find((session) => this.sessionStatus(session) === 'Running');
    if (running) {
      items.push({
        icon: 'play_circle',
        title: 'Session is running',
        meta: `${running.groupName} ends at ${this.formatTime(running.endTime)}`,
        route: this.sessionRoute(running),
        severity: 'high',
      });
    }

    const completed = this.todaySessions().filter((session) => this.sessionStatus(session) === 'Completed');
    if (completed.length > 0) {
      items.push({
        icon: 'fact_check',
        title: 'Attendance can be reviewed',
        meta: `${completed.length} completed ${completed.length === 1 ? 'session' : 'sessions'} today`,
        route: '/teacher/attendance',
        severity: 'medium',
      });
    }

    if (this.groups().length > 0) {
      items.push({
        icon: 'assignment',
        title: 'Homework evaluation',
        meta: 'Open submitted homework and assessments',
        route: '/teacher/evaluation/home-work',
        severity: 'info',
      });
    }

    return items;
  });

  readonly visibleGroups = computed(() => this.groups().slice(0, 5));

  ngOnInit(): void {
    this.loadOverview();
    this.clockHandle = setInterval(() => this.now.set(new Date()), this.clockIntervalMs);
  }

  ngOnDestroy(): void {
    if (this.clockHandle) {
      clearInterval(this.clockHandle);
    }
  }

  loadOverview(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.teacherApi.loadAssignedGroups().pipe(
      map((groups) => groups ?? []),
      map((groups) => groups.filter((group) => group.status?.toLowerCase() !== 'inactive')),
      map((groups) => groups.sort((left, right) => left.name.localeCompare(right.name))),
      switchMap((groups) => {
        const requests = groups.map((group) => this.loadGroupDetails(group));
        const details$ = requests.length > 0 ? forkJoin(requests) : of([] as Array<GroupDetails | null>);
        return details$.pipe(map((details) => ({ groups, details })));
      }),
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ groups, details }) => {
        this.groups.set(groups);
        this.sessions.set(this.buildSessions(groups, details));
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message || 'Unable to load teacher overview');
      },
    });
  }

  sessionRoute(session: TeacherOverviewSession): string {
    return `/teacher/groups/${session.groupId}/sessions/${session.id}`;
  }

  attendanceRoute(session: TeacherOverviewSession): string {
    return `/teacher/attendance/groups/${session.groupId}/sessions/${session.id}`;
  }

  groupRoute(group: TeacherAssignedGroup): string {
    return `/teacher/groups/${group.id}`;
  }

  sessionStatus(session: TeacherOverviewSession): 'Completed' | 'Running' | 'Upcoming' {
    const now = this.now().getTime();
    if (this.sessionEnd(session).getTime() < now) {
      return 'Completed';
    }
    if (this.sessionStart(session).getTime() <= now) {
      return 'Running';
    }
    return 'Upcoming';
  }

  statusClass(session: TeacherOverviewSession): string {
    const status = this.sessionStatus(session);
    if (status === 'Completed') {
      return 'teacher-dashboard-status--completed';
    }
    if (status === 'Running') {
      return 'teacher-dashboard-status--running';
    }
    return 'teacher-dashboard-status--upcoming';
  }

  statusDotClass(session: TeacherOverviewSession): string {
    const status = this.sessionStatus(session);
    if (status === 'Completed') {
      return 'teacher-dashboard-status-dot--completed';
    }
    if (status === 'Running') {
      return 'teacher-dashboard-status-dot--running';
    }
    return 'teacher-dashboard-status-dot--upcoming';
  }

  formatTime(value: string | null | undefined): string {
    if (!value?.trim()) {
      return 'Not set';
    }
    const minutes = this.toMinutes(value);
    return minutes === null ? value : this.formatMinutes(minutes);
  }

  formatTimeRange(session: TeacherOverviewSession): string {
    return `${this.formatTime(session.startTime)} - ${this.formatTime(session.endTime)}`;
  }

  formatNextSessionCountdown(session: TeacherOverviewSession | null): string {
    if (!session) {
      return 'No upcoming session today';
    }
    const now = this.now().getTime();
    const startsAt = this.sessionStart(session).getTime();
    const endsAt = this.sessionEnd(session).getTime();
    if (startsAt > now) {
      return `Starts in ${this.formatDuration(Math.ceil((startsAt - now) / 60000))}`;
    }
    if (endsAt >= now) {
      return `Ends in ${this.formatDuration(Math.ceil((endsAt - now) / 60000))}`;
    }
    return 'Completed';
  }

  formatGroupSchedule(group: TeacherAssignedGroup): string {
    const days = Object.entries(group.daySchedules ?? {})
      .filter(([, schedule]) => schedule?.startTime)
      .map(([day, schedule]) => `${day.slice(0, 3)} ${this.formatTime(schedule.startTime)}`);
    return days.length > 0 ? days.join(', ') : group.schedule || 'Schedule not set';
  }

  private loadGroupDetails(group: TeacherAssignedGroup) {
    return this.groupDetailsApi.loadGroupById(group.id, { scope: 'teacher' }).pipe(
      catchError(() => of(null)),
    );
  }

  private buildSessions(groups: TeacherAssignedGroup[], details: Array<GroupDetails | null>): TeacherOverviewSession[] {
    return groups.flatMap((group, index) => {
      const groupDetails = details[index];
      const calendarEvents = groupDetails?.calendarEvents ?? [];
      if (calendarEvents.length > 0) {
        return calendarEvents.map((event) => this.sessionFromCalendarEvent(group, event));
      }
      return this.sessionsFromWeeklySchedule(group);
    }).sort((left, right) => this.sessionStart(left).getTime() - this.sessionStart(right).getTime());
  }

  private sessionFromCalendarEvent(group: TeacherAssignedGroup, event: GroupCalendarEvent): TeacherOverviewSession {
    return {
      id: `${group.id}:${event.date}:${event.startTime}`,
      groupId: group.id,
      groupName: group.name,
      subject: group.subject || 'Subject not set',
      date: event.date,
      day: event.day,
      startTime: event.startTime,
      endTime: event.endTime,
      room: event.room || group.room || 'Not set',
      studentsCount: group.studentsCount,
    };
  }

  private sessionsFromWeeklySchedule(group: TeacherAssignedGroup): TeacherOverviewSession[] {
    const today = this.now();
    const todayDay = this.weekDays[today.getDay()];
    const todayKey = this.formatDateKey(today);
    const dayScheduleSessions = Object.entries(group.daySchedules ?? {})
      .filter(([day, schedule]) => day === todayDay && !!schedule?.startTime)
      .map(([day, schedule]) => {
        const startTime = schedule.startTime ?? '';
        const endTime = schedule.endTime ?? this.addMinutes(startTime, group.duration ?? 90);
        return {
          id: `${group.id}:${todayKey}:${startTime}`,
          groupId: group.id,
          groupName: group.name,
          subject: group.subject || 'Subject not set',
          date: todayKey,
          day,
          startTime,
          endTime,
          room: schedule.room || group.room || 'Not set',
          studentsCount: group.studentsCount,
        };
      });
    if (dayScheduleSessions.length > 0 || !group.startAt || !this.scheduleDays(group.schedule).includes(todayDay)) {
      return dayScheduleSessions;
    }
    return [{
      id: `${group.id}:${todayKey}:${group.startAt}`,
      groupId: group.id,
      groupName: group.name,
      subject: group.subject || 'Subject not set',
      date: todayKey,
      day: todayDay,
      startTime: group.startAt,
      endTime: this.addMinutes(group.startAt, group.duration ?? 90),
      room: group.room || 'Not set',
      studentsCount: group.studentsCount,
    }];
  }

  private activeGroupsCount(): number {
    return this.groups().filter((group) => group.status?.toLowerCase() !== 'inactive').length;
  }

  private scheduleDays(schedule: string | null | undefined): string[] {
    const value = schedule ?? '';
    const days = this.weekDays.filter((day) => new RegExp(`\\b${day}\\b|\\b${day.slice(0, 3)}\\b`, 'i').test(value));
    return days.length > 0 ? days : [];
  }

  private sessionStart(session: TeacherOverviewSession): Date {
    return this.sessionDateTime(session.date, session.startTime);
  }

  private sessionEnd(session: TeacherOverviewSession): Date {
    return this.sessionDateTime(session.date, session.endTime);
  }

  private sessionDateTime(date: string, time: string): Date {
    const safeTime = time?.trim() || '00:00';
    const normalizedTime = safeTime.length === 5 ? `${safeTime}:00` : safeTime;
    const parsed = new Date(`${date}T${normalizedTime}`);
    return Number.isNaN(parsed.getTime()) ? new Date(`${date}T00:00:00`) : parsed;
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDuration(totalMinutes: number): string {
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  private addMinutes(time: string, minutesToAdd: number): string {
    const minutes = this.toMinutes(time);
    if (minutes === null) {
      return time;
    }
    const total = (minutes + minutesToAdd) % 1440;
    const hour = Math.floor(total / 60);
    const minute = total % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  private toMinutes(time: string | null | undefined): number | null {
    if (!time) {
      return null;
    }
    const [hourPart, minutePart = '0'] = time.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);
    return Number.isNaN(hour) || Number.isNaN(minute) ? null : hour * 60 + minute;
  }

  private formatMinutes(totalMinutes: number): string {
    const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const hour = Math.floor(normalizedMinutes / 60);
    const minute = normalizedMinutes % 60;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
  }

  private readonly weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
}
