import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantCollege } from '../../models/tenant-colleges.models';
import { TenantCollegesFacade } from '../../state/tenant-colleges.facade';

@Component({
  selector: 'app-tenant-college-details',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-college-details.component.html',
  styleUrl: './tenant-college-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantCollegeDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantCollegesFacade);

  readonly college = signal<TenantCollege | null>(null);
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;
  readonly deleteError = this.facade.deleteError;
  readonly deletingId = this.facade.deletingId;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.college.set(id ? await this.facade.getCollege(id) : null);
  }

  async deleteCollege(): Promise<void> {
    const college = this.college();
    if (!college) {
      return;
    }
    if (await this.facade.deleteCollege(college.id)) {
      await this.facade.goToList();
    }
  }
}
