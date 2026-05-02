import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectTemplate } from '../../models/owner-settings.models';

@Component({
  selector: 'app-owner-settings-subject-tab',
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-settings-subject-tab.component.html',
  styleUrl: './owner-settings-subject-tab.component.css',
})
export class OwnerSettingsSubjectTabComponent {
  readonly translate = input.required<(key: string) => string>();
  readonly isRtl = input.required<boolean>();
  readonly subjectTemplates = input.required<SubjectTemplate[]>();
  readonly isFormOpen = input.required<boolean>();
  readonly editingTemplateId = input<number | null>(null);
  readonly newTemplateName = input.required<string>();
  readonly newTemplateLevels = input.required<string[]>();
  readonly newTemplateIsDefault = input.required<boolean>();
  readonly canSaveNewTemplate = input.required<boolean>();

  readonly openForm = output<void>();
  readonly closeForm = output<void>();
  readonly addTemplateLevel = output<void>();
  readonly updateTemplateLevel = output<{ index: number; value: string }>();
  readonly removeTemplateLevel = output<number>();
  readonly updateTemplateName = output<string>();
  readonly updateTemplateDefault = output<boolean>();
  readonly saveSubjectTemplate = output<void>();
  readonly editSubjectTemplate = output<number>();
  readonly deleteSubjectTemplate = output<number>();
  readonly setDefaultSubjectTemplate = output<number>();
}
