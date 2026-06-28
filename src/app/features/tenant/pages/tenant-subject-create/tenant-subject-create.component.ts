import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantSubjectCreateFacade);

  readonly subjectForm = this.facade.subjectForm;
  readonly isSubmitting = this.facade.isSubmitting;
  readonly saveError = this.facade.saveError;
  readonly stages = this.facade.stages;
  readonly filteredGrades = this.facade.filteredGrades;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly isEditMode = this.facade.isEditMode;
  readonly stagePanelOpen = signal(false);
  readonly gradePanelOpen = signal(false);

  ngOnInit(): void {
    void this.facade.initialize(
      this.route.snapshot.paramMap.get('id'),
      this.route.snapshot.queryParamMap.get('returnUrl'),
      this.route.snapshot.queryParamMap.get('stageId'),
      this.route.snapshot.queryParamMap.get('gradeId'),
    );
  }

  onStageChange(event: Event): void {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : '';
    this.facade.onStageChange(value);
  }

  selectedStageLabel(): string {
    const selectedId = this.subjectForm.controls.stageId.value;
    if (this.loading()) {
      return 'Loading educational stages...';
    }
    if (!selectedId) {
      return this.stages().length === 0 ? 'No educational stages available' : 'Select educational stage';
    }
    return this.stages().find((stage) => stage.value === selectedId)?.label ?? 'Select educational stage';
  }

  selectedGradeLabel(): string {
    const selectedId = this.subjectForm.controls.gradeId.value;
    if (this.loading()) {
      return 'Loading grades...';
    }
    if (!this.subjectForm.controls.stageId.value) {
      return 'Select educational stage first';
    }
    if (!selectedId) {
      return this.filteredGrades().length === 0 ? 'No grades available for this stage' : 'Select grade';
    }
    return this.filteredGrades().find((grade) => grade.value === selectedId)?.label ?? 'Select grade';
  }

  toggleStagePanel(): void {
    if (this.loading() || this.stages().length === 0) {
      return;
    }
    this.gradePanelOpen.set(false);
    this.stagePanelOpen.update((open) => !open);
  }

  toggleGradePanel(): void {
    if (this.loading() || !this.subjectForm.controls.stageId.value || this.filteredGrades().length === 0) {
      return;
    }
    this.stagePanelOpen.set(false);
    this.gradePanelOpen.update((open) => !open);
  }

  selectStage(stageId: string): void {
    this.subjectForm.controls.stageId.setValue(stageId);
    this.subjectForm.controls.stageId.markAsTouched();
    this.facade.onStageChange(stageId);
    this.stagePanelOpen.set(false);
  }

  selectGrade(gradeId: string): void {
    this.subjectForm.controls.gradeId.setValue(gradeId);
    this.subjectForm.controls.gradeId.markAsTouched();
    this.gradePanelOpen.set(false);
  }

  resetForm(): void {
    this.facade.resetForm();
    this.stagePanelOpen.set(false);
    this.gradePanelOpen.set(false);
  }

  cancel(): void {
    void this.facade.cancel();
  }

  submit(): void {
    void this.facade.submit();
  }
}
