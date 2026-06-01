import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TenantSubjectDetailsFacade } from '../../state/tenant-subject-details.facade';

@Component({
  selector: 'app-tenant-subject-details',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-subject-details.component.html',
  styleUrls: ['./tenant-subject-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantSubjectDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantSubjectDetailsFacade);

  readonly subject = this.facade.subject;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        void this.facade.loadSubject(params.get('id'));
      });
  }
}
