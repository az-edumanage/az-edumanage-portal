import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../../../core/services/i18n.service';

type QuestionStatus = 'Draft' | 'Published' | 'Review';
type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

interface QuestionTemplateRow {
  id: string;
  title: string;
  subject: string;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  updatedAt: string;
}

@Component({
  selector: 'app-owner-test-question-bank',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './owner-test-question-bank.component.html',
  styleUrl: './owner-test-question-bank.component.css',
})
export class OwnerTestQuestionBankComponent {
  private readonly i18nService = inject(I18nService);

  readonly search = signal('');
  readonly subjectFilter = signal('All');
  readonly difficultyFilter = signal('All');
  readonly statusFilter = signal('All');

  readonly isRtl = this.i18nService.isRtl;

  readonly subjectOptions = ['All', 'Mathematics', 'Science', 'English', 'Computer'];
  readonly difficultyOptions = ['All', 'Easy', 'Medium', 'Hard'];
  readonly statusOptions = ['All', 'Draft', 'Review', 'Published'];

  private readonly rows = signal<QuestionTemplateRow[]>([
    {
      id: 'QB-001',
      title: 'Linear Equations: Solve for x',
      subject: 'Mathematics',
      difficulty: 'Medium',
      status: 'Draft',
      updatedAt: 'Apr 24, 2026',
    },
    {
      id: 'QB-002',
      title: 'Cells and Organelles - MCQ',
      subject: 'Science',
      difficulty: 'Easy',
      status: 'Published',
      updatedAt: 'Apr 22, 2026',
    },
    {
      id: 'QB-003',
      title: 'Past Perfect vs Past Simple',
      subject: 'English',
      difficulty: 'Hard',
      status: 'Review',
      updatedAt: 'Apr 20, 2026',
    },
  ]);

  readonly filteredRows = computed(() => {
    const query = this.search().trim().toLowerCase();
    const subject = this.subjectFilter();
    const difficulty = this.difficultyFilter();
    const status = this.statusFilter();

    return this.rows().filter((row) => {
      const matchesQuery =
        !query ||
        row.title.toLowerCase().includes(query) ||
        row.id.toLowerCase().includes(query);
      const matchesSubject = subject === 'All' || row.subject === subject;
      const matchesDifficulty = difficulty === 'All' || row.difficulty === difficulty;
      const matchesStatus = status === 'All' || row.status === status;
      return matchesQuery && matchesSubject && matchesDifficulty && matchesStatus;
    });
  });

  t(key: string): string {
    return this.i18nService.t(key);
  }
}
