import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-student-home-work-evaluation',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="page">
      <header>
        <h1>Home Work Evaluation</h1>
        <p>Completed home work reports from your assigned groups.</p>
      </header>

      <div class="table">
        <div class="table-toolbar">
          <label class="search-field">
            <mat-icon>search</mat-icon>
            <input type="search" placeholder="Search home work reports" disabled />
          </label>
        </div>
        <table>
          <thead>
            <tr>
              <th>Home Work</th>
              <th>Group</th>
              <th>Subject</th>
              <th>Score</th>
              <th>Status</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="6" class="empty">No home work evaluation reports yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styleUrl: '../student-shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentHomeWorkEvaluationComponent {}
