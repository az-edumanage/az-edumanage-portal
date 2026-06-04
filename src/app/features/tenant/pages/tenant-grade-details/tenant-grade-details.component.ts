import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TenantGradeDetailsFacade } from '../../state/tenant-grade-details.facade';

@Component({
  selector: 'app-tenant-grade-details',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-grade-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantGradeDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TenantGradeDetailsFacade);

  readonly grade = this.facade.grade;
  readonly loading = this.facade.loading;
  readonly loadError = this.facade.loadError;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        void this.facade.loadGrade(params.get('id'));
      });
  }
}
