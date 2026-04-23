import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { GroupStudent } from '../../models/tenant-group-details.models';
import { TenantGroupDetailsFacade } from '../../state/tenant-group-details.facade';

@Component({
  selector: 'app-tenant-group-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-group-details.component.html',
  styleUrl: './tenant-group-details.component.css'})
export class TenantGroupDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantGroupDetailsFacade);

  readonly group = this.facade.group;
  readonly selectedStudent = this.facade.selectedStudent;
  readonly students = this.facade.students;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.facade.loadGroup(id);
  }

  selectStudent(student: GroupStudent): void {
    this.facade.selectStudent(student);
  }

  clearSelectedStudent(): void {
    this.facade.clearSelectedStudent();
  }
}
