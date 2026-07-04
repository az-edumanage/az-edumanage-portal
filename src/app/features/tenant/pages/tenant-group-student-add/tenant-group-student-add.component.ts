import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantGroupStudent } from '../../models/tenant-group-student-add.models';
import { TenantGroupStudentAddFacade } from '../../state/tenant-group-student-add.facade';

@Component({
  selector: 'app-tenant-group-student-add',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-group-student-add.component.html',
  styleUrl: './tenant-group-student-add.component.css'})
export class TenantGroupStudentAddComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(TenantGroupStudentAddFacade);

  readonly groupId = this.facade.groupId;
  readonly isSubmitting = this.facade.isSubmitting;
  readonly isLoadingCandidates = this.facade.isLoadingCandidates;
  readonly candidateError = this.facade.candidateError;
  readonly selectedStudent = this.facade.selectedStudent;
  readonly selectedStudents = this.facade.selectedStudents;
  readonly hasSelectedStudents = this.facade.hasSelectedStudents;
  readonly filteredStudents = this.facade.filteredStudents;
  readonly enrollForm = this.facade.enrollForm;
  readonly studentSearchPageIndex = signal(0);
  readonly studentSearchPageSize = signal(5);
  readonly studentSearchTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredStudents().length / this.studentSearchPageSize())),
  );
  readonly studentSearchVisiblePageIndex = computed(() =>
    Math.min(this.studentSearchPageIndex(), this.studentSearchTotalPages() - 1),
  );
  readonly pagedFilteredStudents = computed(() => {
    const start = this.studentSearchVisiblePageIndex() * this.studentSearchPageSize();
    return this.filteredStudents().slice(start, start + this.studentSearchPageSize());
  });
  readonly studentSearchPageStart = computed(() =>
    this.filteredStudents().length === 0 ? 0 : this.studentSearchVisiblePageIndex() * this.studentSearchPageSize() + 1,
  );
  readonly studentSearchPageEnd = computed(() => {
    const total = this.filteredStudents().length;
    return total === 0 ? 0 : Math.min(total, this.studentSearchPageStart() + this.pagedFilteredStudents().length - 1);
  });

  ngOnInit(): void {
    this.facade.initialize(this.route.snapshot.paramMap.get('id'));
  }

  ngOnDestroy(): void {
    this.facade.onDestroy(this.router.url);
  }

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.studentSearchPageIndex.set(0);
    this.facade.onSearch(query);
  }

  selectStudent(student: TenantGroupStudent): void {
    this.facade.selectStudent(student);
  }

  isStudentSelected(studentId: string): boolean {
    return this.facade.isStudentSelected(studentId);
  }

  onEnroll(): void {
    this.facade.onEnroll();
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  previousStudentSearchPage(): void {
    this.studentSearchPageIndex.update((page) => Math.max(0, page - 1));
  }

  nextStudentSearchPage(): void {
    this.studentSearchPageIndex.update((page) => Math.min(this.studentSearchTotalPages() - 1, page + 1));
  }

  setStudentSearchPageSize(value: number | string): void {
    const size = Number(value);
    this.studentSearchPageSize.set(Number.isFinite(size) && size > 0 ? size : 5);
    this.studentSearchPageIndex.set(0);
  }
}
