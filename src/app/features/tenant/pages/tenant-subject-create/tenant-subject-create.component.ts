import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantSubjectCreateFacade } from '../../state/tenant-subject-create.facade';

@Component({
  selector: 'app-tenant-subject-create',
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tenant-subject-create.component.html',
  styleUrls: ['./tenant-subject-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantSubjectCreateComponent implements OnInit {
  private readonly facade = inject(TenantSubjectCreateFacade);

  readonly subjectForm = this.facade.subjectForm;
  readonly isSubmitting = this.facade.isSubmitting;
  readonly saveError = this.facade.saveError;
  readonly stages = this.facade.stages;
  readonly filteredGrades = this.facade.filteredGrades;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;

  ngOnInit(): void {
    void this.facade.initialize();
  }

  onStageChange(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    this.facade.onStageChange(value);
  }

  resetForm(): void {
    this.facade.resetForm();
  }

  cancel(): void {
    void this.facade.cancel();
  }

  submit(): void {
    void this.facade.submit();
  }
}
