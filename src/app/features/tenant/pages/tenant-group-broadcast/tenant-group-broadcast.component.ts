import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TenantGroupBroadcastFacade } from '../../state/tenant-group-broadcast.facade';

@Component({
  selector: 'app-tenant-group-broadcast',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './tenant-group-broadcast.component.html',
  styleUrl: './tenant-group-broadcast.component.css'})
export class TenantGroupBroadcastComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TenantGroupBroadcastFacade);

  readonly groupId = this.facade.groupId;
  readonly isPublic = this.facade.isPublic;
  readonly messages = this.facade.messages;
  readonly onlineStudents = this.facade.onlineStudents;

  get newMessage(): string {
    return this.facade.newMessage();
  }

  set newMessage(value: string) {
    this.facade.setNewMessage(value);
  }

  ngOnInit() {
    this.facade.loadGroup(this.route.snapshot.paramMap.get('id'));
  }

  sendMessage() {
    this.facade.sendMessage();
  }

  goLive() {
    alert(this.facade.goLiveMessage());
  }
}
