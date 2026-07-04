import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantRoomDetailsFacade } from '../../state/tenant-room-details.facade';

@Component({
  selector: 'app-tenant-room-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './tenant-room-details.component.html'})
export class TenantRoomDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantRoomDetailsFacade);
  private roomId: string | null = null;

  readonly room = this.facade.room;
  readonly schedule = this.facade.schedule;
  readonly loading = this.facade.loading;
  readonly error = this.facade.error;
  readonly issueSaving = this.facade.issueSaving;
  readonly issueError = this.facade.issueError;
  readonly issueSaved = this.facade.issueSaved;
  readonly issueEditorOpen = signal(false);
  readonly issueNote = signal('');
  readonly totalOccupiedHours = this.facade.totalOccupiedHours;
  readonly occupiedDaysCount = this.facade.occupiedDaysCount;
  readonly totalStudents = this.facade.totalStudents;
  readonly uniqueGroupsCount = this.facade.uniqueGroupsCount;
  readonly freeDays = this.facade.freeDays;
  readonly occupancyRate = this.facade.occupancyRate;
  readonly avgGroupSize = this.facade.avgGroupSize;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.roomId = id;
    void this.facade.loadRoom(id);
  }

  openIssueEditor(): void {
    this.issueNote.set('');
    this.facade.openIssueEditor();
    this.issueEditorOpen.set(true);
  }

  closeIssueEditor(): void {
    if (this.issueSaving()) {
      return;
    }
    this.facade.closeIssueEditor();
    this.issueEditorOpen.set(false);
  }

  updateIssueNote(value: string): void {
    this.issueNote.set(value);
  }

  async saveIssueNote(): Promise<void> {
    const saved = await this.facade.saveIssueNote(this.roomId, this.issueNote());
    if (saved) {
      this.issueNote.set('');
      window.setTimeout(() => this.closeIssueEditor(), 500);
    }
  }
}
