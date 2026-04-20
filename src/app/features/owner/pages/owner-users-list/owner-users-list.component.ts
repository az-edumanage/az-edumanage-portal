import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { OwnerUsersListFacade } from '../../state/owner-users-list.facade';

@Component({
  selector: 'app-owner-users-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-users-list.component.html'})
export class OwnerUsersListComponent {
  private readonly facade = inject(OwnerUsersListFacade);

  readonly filter = this.facade.filter;
  readonly filteredUsers = this.facade.filteredUsers;

  setFilter(value: 'All' | 'Super Admin' | 'Support Agent' | 'Billing Manager' | 'Developer'): void {
    this.facade.setFilter(value);
  }
}
