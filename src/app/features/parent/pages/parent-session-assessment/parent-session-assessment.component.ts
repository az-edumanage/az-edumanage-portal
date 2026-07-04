import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-parent-session-assessment',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="page">
      <header>
        <h1>Session Assessment</h1>
        <p>Session assessment notes and grades for your linked students.</p>
      </header>

      <div class="table">
        <div class="table-toolbar">
          <label class="search-field">
            <mat-icon>search</mat-icon>
            <input type="search" placeholder="Search session assessments" disabled />
          </label>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Session</th>
              <th>Group</th>
              <th>Assessment</th>
              <th>Grade</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="6" class="empty">No session assessments yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styleUrl: '../../../student/pages/student-shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentSessionAssessmentComponent {}
