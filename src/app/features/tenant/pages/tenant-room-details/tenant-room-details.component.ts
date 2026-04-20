import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantRoomDetailsFacade } from '../../state/tenant-room-details.facade';

@Component({
  selector: 'app-tenant-room-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-room-details.component.html'})
export class TenantRoomDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantRoomDetailsFacade);

  readonly room = this.facade.room;
  readonly schedule = this.facade.schedule;
  readonly totalOccupiedHours = this.facade.totalOccupiedHours;
  readonly occupiedDaysCount = this.facade.occupiedDaysCount;
  readonly totalStudents = this.facade.totalStudents;
  readonly uniqueGroupsCount = this.facade.uniqueGroupsCount;
  readonly freeDays = this.facade.freeDays;
  readonly occupancyRate = this.facade.occupancyRate;
  readonly avgGroupSize = this.facade.avgGroupSize;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.facade.loadRoom(id);
  }
}
