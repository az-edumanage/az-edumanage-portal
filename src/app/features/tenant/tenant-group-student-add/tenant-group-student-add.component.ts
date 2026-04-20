import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TenantGroupStudent } from '../models/tenant-group-student-add.models';
import { TenantGroupStudentAddFacade } from '../state/tenant-group-student-add.facade';

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
  readonly selectedStudent = this.facade.selectedStudent;
  readonly filteredStudents = this.facade.filteredStudents;
  readonly enrollForm = this.facade.enrollForm;

  ngOnInit(): void {
    this.facade.initialize(this.route.snapshot.paramMap.get('id'));
  }

  ngOnDestroy(): void {
    this.facade.onDestroy(this.router.url);
  }

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.facade.onSearch(query);
  }

  selectStudent(student: TenantGroupStudent): void {
    this.facade.selectStudent(student);
  }

  onEnroll(): void {
    this.facade.onEnroll();
  }

  onCancel(): void {
    this.facade.onCancel();
  }
}
