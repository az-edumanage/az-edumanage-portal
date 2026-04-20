import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantGradeDetailsFacade } from '../state/tenant-grade-details.facade';

@Component({
  selector: 'app-tenant-grade-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-grade-details.component.html'})
export class TenantGradeDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantGradeDetailsFacade);

  readonly grade = this.facade.grade;
  readonly groups = this.facade.groups;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.facade.loadGrade(id);
  }
}
