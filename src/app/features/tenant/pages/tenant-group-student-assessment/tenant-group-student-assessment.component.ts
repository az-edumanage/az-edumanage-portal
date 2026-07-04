import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { TenantGroupDetailsDataService } from '../../data-access/tenant-group-details-data.service';
import { GroupCalendarEvent, GroupDetails, GroupStudent, GroupStudentAssessment } from '../../models/tenant-group-details.models';
import { TenantSubjectsDataService } from '../../data-access/tenant-subjects-data.service';
import { BloomLevel } from '../../models/tenant-subjects.models';

interface StudentAssessmentScore {
  studentGrade: string;
  finalGrade: string;
}

@Component({
  selector: 'app-tenant-group-student-assessment',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-group-student-assessment.component.html',
})
export class TenantGroupStudentAssessmentComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(TenantGroupDetailsDataService);
  private readonly subjectsData = inject(TenantSubjectsDataService);

  readonly groupId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
  readonly studentId = this.route.snapshot.paramMap.get('studentId') ?? '';
  readonly group = signal<GroupDetails | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly bloomLevels = signal<BloomLevel[]>([]);
  readonly bloomLevelsLoading = signal(false);
  readonly bloomLevelsError = signal<string | null>(null);
  readonly assessmentLoading = signal(false);
  readonly assessmentSaving = signal(false);
  readonly assessmentError = signal<string | null>(null);
  readonly assessmentSaveMessage = signal<string | null>(null);
  readonly assessmentScores = signal<Record<string, StudentAssessmentScore>>({});
  readonly student = computed<GroupStudent | null>(() => this.group()?.students?.find((row) => row.id === this.studentId) ?? null);
  readonly session = computed<GroupCalendarEvent | null>(() => {
    const group = this.group();
    return group?.calendarEvents?.find((event) => event.id === this.sessionId) ?? null;
  });

  ngOnInit(): void {
    void this.loadGroup();
    void this.loadBloomLevels();
    void this.loadAssessment();
  }

  sessionTitle(): string {
    const session = this.session();
    if (!session) {
      return 'Student assessment';
    }

    return `${session.day || 'Session'} ${session.startTime || ''}`.trim();
  }

  sessionDateLabel(): string {
    const session = this.session();
    if (!session?.date) {
      return 'Scheduled session';
    }

    const date = new Date(`${session.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return session.date;
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  sessionTimeLabel(): string {
    const session = this.session();
    return session ? `${this.formatTime(session.startTime)} - ${this.formatTime(session.endTime)}` : 'No time set';
  }

  bloomLevelLabel(level: BloomLevel): string {
    return `${level.levelOrder}. ${level.nameEn}`;
  }

  assessmentScore(levelId: string, key: keyof StudentAssessmentScore): string {
    return this.assessmentScores()[levelId]?.[key] ?? '';
  }

  updateAssessmentScore(levelId: string, key: keyof StudentAssessmentScore, value: string): void {
    const normalized = this.normalizeGradeValue(value);
    this.assessmentSaveMessage.set(null);
    this.assessmentScores.update((scores) => ({
      ...scores,
      [levelId]: {
        studentGrade: scores[levelId]?.studentGrade ?? '',
        finalGrade: scores[levelId]?.finalGrade ?? '',
        [key]: normalized,
      },
    }));
  }

  async saveAssessment(): Promise<void> {
    if (this.assessmentSaving() || this.bloomLevelsLoading()) {
      return;
    }
    if (!this.groupId || !this.sessionId || !this.studentId) {
      this.assessmentError.set('Unable to save assessment.');
      return;
    }

    this.assessmentSaving.set(true);
    this.assessmentError.set(null);
    this.assessmentSaveMessage.set(null);
    try {
      const assessment = await firstValueFrom(
        this.data.saveStudentAssessment(this.groupId, this.sessionId, this.studentId, {
          scores: this.bloomLevels().map((level) => ({
            bloomId: level.id,
            studentGrade: this.gradeNumber(this.assessmentScore(level.id, 'studentGrade')),
            finalGrade: this.gradeNumber(this.assessmentScore(level.id, 'finalGrade')),
          })),
        }),
      );
      this.applyAssessmentScores(assessment);
      this.assessmentSaveMessage.set('Assessment saved.');
    } catch {
      this.assessmentError.set('Unable to save assessment.');
    } finally {
      this.assessmentSaving.set(false);
    }
  }

  private async loadGroup(): Promise<void> {
    if (!this.groupId) {
      this.error.set('Unable to load assessment.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    try {
      this.group.set(await firstValueFrom(this.data.loadGroupById(this.groupId)));
    } catch {
      this.error.set('Unable to load assessment.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadBloomLevels(): Promise<void> {
    this.bloomLevelsLoading.set(true);
    this.bloomLevelsError.set(null);
    try {
      const levels = await this.subjectsData.listBloomLevels();
      this.bloomLevels.set([...levels].sort((first, second) => first.levelOrder - second.levelOrder));
    } catch {
      this.bloomLevels.set([]);
      this.bloomLevelsError.set("Unable to load Bloom's Taxonomy levels.");
    } finally {
      this.bloomLevelsLoading.set(false);
    }
  }

  private async loadAssessment(): Promise<void> {
    if (!this.groupId || !this.sessionId || !this.studentId) {
      this.assessmentError.set('Unable to load saved assessment.');
      return;
    }

    this.assessmentLoading.set(true);
    this.assessmentError.set(null);
    try {
      this.applyAssessmentScores(await firstValueFrom(this.data.loadStudentAssessment(this.groupId, this.sessionId, this.studentId)));
    } catch {
      this.assessmentError.set('Unable to load saved assessment.');
    } finally {
      this.assessmentLoading.set(false);
    }
  }

  private applyAssessmentScores(assessment: GroupStudentAssessment): void {
    const scores: Record<string, StudentAssessmentScore> = {};
    for (const score of assessment.scores ?? []) {
      scores[score.bloomId] = {
        studentGrade: this.gradeText(score.studentGrade),
        finalGrade: this.gradeText(score.finalGrade),
      };
    }
    this.assessmentScores.set(scores);
  }

  private formatTime(value: string | null | undefined): string {
    if (!value) {
      return 'No time';
    }

    const [hoursValue, minutesValue = '00'] = value.split(':');
    const hours = Number(hoursValue);
    const minutes = Number(minutesValue);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return value;
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private normalizeGradeValue(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? trimmed : '';
  }

  private gradeText(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private gradeNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
}
