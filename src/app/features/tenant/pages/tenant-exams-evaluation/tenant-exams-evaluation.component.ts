import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import { StudentDashboardDataService } from '../../../student/data-access/student-dashboard-data.service';
import { StudentExamEvaluation } from '../../../student/models/student-dashboard.models';
import { TenantGroupsDataService } from '../../data-access/tenant-groups-data.service';
import { Group } from '../../models/tenant-groups.models';

interface EvaluationGroupSummary {
  id: string;
  name: string;
  subject?: string | null;
  teacher?: string | null;
  schedule?: string | null;
}

interface GroupEvaluationRow {
  group: EvaluationGroupSummary;
  evaluationsCount: number;
  studentsCount: number;
  examsCount: number;
  averageScore: number | null;
  latestCompletedAt: string | null;
  latestTitle: string | null;
}

@Component({
  selector: 'app-tenant-exams-evaluation',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './tenant-exams-evaluation.component.html',
  styleUrl: './tenant-exams-evaluation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantExamsEvaluationComponent implements OnInit {
  private readonly groupsData = inject(TenantGroupsDataService);
  private readonly evaluationsData = inject(StudentDashboardDataService);
  private readonly router = inject(Router);

  readonly groups = signal<EvaluationGroupSummary[]>([]);
  readonly evaluations = signal<StudentExamEvaluation[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(10);

  readonly rows = computed(() => {
    const evaluationsByGroup = new Map<string, StudentExamEvaluation[]>();
    for (const evaluation of this.evaluations()) {
      const items = evaluationsByGroup.get(evaluation.groupId) ?? [];
      items.push(evaluation);
      evaluationsByGroup.set(evaluation.groupId, items);
    }

    const groups = new Map<string, EvaluationGroupSummary>();
    for (const group of this.groups()) {
      groups.set(group.id, group);
    }
    for (const evaluation of this.evaluations()) {
      if (!groups.has(evaluation.groupId)) {
        groups.set(evaluation.groupId, {
          id: evaluation.groupId,
          name: evaluation.groupName,
          subject: evaluation.subjectName,
          teacher: null,
          schedule: null,
        });
      }
    }

    return [...groups.values()]
      .map((group) => this.toRow(group, evaluationsByGroup.get(group.id) ?? []))
      .filter((row) => row.evaluationsCount > 0)
      .sort((first, second) => {
        if (first.evaluationsCount !== second.evaluationsCount) {
          return second.evaluationsCount - first.evaluationsCount;
        }
        return first.group.name.localeCompare(second.group.name);
      });
  });

  readonly filteredRows = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.rows();
    }
    return this.rows().filter((row) => this.searchableText(row).includes(query));
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize())));
  readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });
  readonly rangeStart = computed(() => this.filteredRows().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  readonly rangeEnd = computed(() => Math.min(this.filteredRows().length, this.page() * this.pageSize()));

  readonly summary = computed(() => {
    const rows = this.rows();
    const groupsWithReports = rows.length;
    const completedReports = rows.reduce((total, row) => total + row.evaluationsCount, 0);
    const studentsReviewed = new Set(
      this.evaluations()
        .map((evaluation) => evaluation.studentId)
        .filter((value): value is string => !!value),
    ).size;

    return { groupsWithReports, completedReports, studentsReviewed };
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await firstValueFrom(forkJoin({
        groups: this.groupsData.loadGroups().pipe(catchError(() => of([]))),
        evaluations: this.evaluationsData.tenantExamEvaluations(),
      }));
      this.groups.set(result.groups.map((group) => this.toGroupSummary(group)));
      this.evaluations.set(result.evaluations);
      this.page.set(1);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load exams evaluation');
    } finally {
      this.loading.set(false);
    }
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  setPageSize(value: string): void {
    const size = Number(value);
    this.pageSize.set(Number.isFinite(size) && size > 0 ? size : 10);
    this.page.set(1);
  }

  previousPage(): void {
    this.page.update((page) => Math.max(1, page - 1));
  }

  nextPage(): void {
    this.page.update((page) => Math.min(this.totalPages(), page + 1));
  }

  openGroup(row: GroupEvaluationRow): void {
    void this.router.navigate(['/tenant/exam-evaluation/groups', row.group.id]);
  }

  groupRoute(row: GroupEvaluationRow): unknown[] {
    return ['/tenant/exam-evaluation/groups', row.group.id];
  }

  latestCompleted(value: string | null): string {
    if (!value) {
      return 'No completed reports';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }

  percent(value: number | null): string {
    return value === null ? '-' : `${value}%`;
  }

  private toRow(group: EvaluationGroupSummary, evaluations: StudentExamEvaluation[]): GroupEvaluationRow {
    const students = new Set<string>();
    const exams = new Set<string>();
    let scoreTotal = 0;
    let scoreCount = 0;
    let latest: StudentExamEvaluation | null = null;

    for (const evaluation of evaluations) {
      if (evaluation.studentId) {
        students.add(evaluation.studentId);
      }
      if (evaluation.assignmentId) {
        exams.add(evaluation.assignmentId);
      }
      const maxScore = evaluation.maxScore ?? 0;
      if (maxScore > 0) {
        scoreTotal += ((evaluation.score ?? 0) / maxScore) * 100;
        scoreCount += 1;
      }
      if (!latest || new Date(evaluation.completedAt).getTime() > new Date(latest.completedAt).getTime()) {
        latest = evaluation;
      }
    }

    return {
      group,
      evaluationsCount: evaluations.length,
      studentsCount: students.size,
      examsCount: exams.size,
      averageScore: scoreCount > 0 ? Math.round(scoreTotal / scoreCount) : null,
      latestCompletedAt: latest?.completedAt ?? null,
      latestTitle: latest?.title ?? null,
    };
  }

  private toGroupSummary(group: Group): EvaluationGroupSummary {
    return {
      id: group.id,
      name: group.name,
      subject: group.subject,
      teacher: group.teacher,
      schedule: group.schedule,
    };
  }

  private searchableText(row: GroupEvaluationRow): string {
    return [
      row.group.name,
      row.group.subject,
      row.group.teacher,
      row.latestTitle,
      this.latestCompleted(row.latestCompletedAt),
      this.percent(row.averageScore),
    ].filter(Boolean).join(' ').toLowerCase();
  }
}
