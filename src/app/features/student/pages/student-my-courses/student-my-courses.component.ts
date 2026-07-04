import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-student-my-courses',
  standalone: true,
  imports: [RouterModule, MatIconModule],
  template: `
    <section class="page">
      <header><h1>My Courses</h1><p>This LMS area is ready for course content, lessons, files, and progress tracking.</p></header>
      <div class="state">
        <mat-icon>school</mat-icon>
        Course content will appear here when LMS publishing is connected.
        <a routerLink="/student/my-groups">View my groups</a>
      </div>
    </section>
  `,
  styleUrl: '../student-shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentMyCoursesComponent {}
