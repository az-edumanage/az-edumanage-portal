import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantUniversitySubject } from '../../models/tenant-university-subjects.models';
import { TenantUniversitySubjectsFacade } from '../../state/tenant-university-subjects.facade';

@Component({
  selector: 'app-tenant-university-subject-details',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-university-subject-details.component.html',
  styleUrl: './tenant-university-subject-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantUniversitySubjectDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantUniversitySubjectsFacade);

  readonly subject = signal<TenantUniversitySubject | null>(null);
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly deleteError = this.facade.deleteError;
  readonly deletingId = this.facade.deletingId;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.subject.set(id ? await this.facade.getSubject(id) : null);
  }

  async deleteSubject(): Promise<void> {
    const subject = this.subject();
    if (!subject) {
      return;
    }
    if (await this.facade.deleteSubject(subject.id)) {
      await this.facade.goToList();
    }
  }
}
