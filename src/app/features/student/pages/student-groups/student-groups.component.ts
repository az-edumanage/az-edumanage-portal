import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { StudentDashboardDataService } from '../../data-access/student-dashboard-data.service';
import {
  StudentGroup,
  StudentPublishedSession,
  StudentPublishedSessionDetails,
  StudentPublishedSessionFile,
} from '../../models/student-dashboard.models';

type PresentationPreviewer = {
  preview(file: ArrayBuffer): Promise<unknown>;
  destroy(): void;
};

@Component({
  selector: 'app-student-groups',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="kicker">Student portal</p>
          <h1>{{ pageTitle() }}</h1>
          <p>{{ pageDescription() }}</p>
        </div>
        @if (groupId()) {
          <a routerLink="/student/my-groups" class="button">
            <mat-icon>arrow_back</mat-icon>
            All groups
          </a>
        }
      </header>

      <ng-template #fileItem let-file="file">
        <button type="button" class="file-item" (click)="openFile(file)" [class.disabled]="!file.url && file.contentType !== 'NOTE'">
          <mat-icon>{{ fileIcon(file) }}</mat-icon>
          <span>
            <strong>{{ file.title || 'Untitled file' }}</strong>
            <small>{{ file.folderName || file.contentType }}{{ file.sizeBytes ? ' · ' + fileSize(file.sizeBytes) : '' }}</small>
          </span>
        </button>
      </ng-template>

      @if (loading()) {
        <div class="state">Loading...</div>
      } @else if (error()) {
        <div class="state error">{{ error() }}</div>
      } @else if (sessionId()) {
        @if (sessionDetails(); as session) {
          <div class="session-layout">
            <article class="detail-panel">
              <div class="detail-head">
                <div>
                  <h2>{{ session.title }}</h2>
                  <p>{{ session.subjectName || 'Subject not set' }} · {{ dateLabel(session.sessionDate) }} · {{ time(session.startTime) }}</p>
                </div>
                <span class="pill">{{ session.lessons.length }} lessons</span>
              </div>

              <section class="lesson-list">
                @for (lesson of session.lessons; track lesson.id) {
                  <article class="lesson-row">
                    <div>
                      <h3>{{ lesson.title }}</h3>
                      <p>{{ lesson.path || 'Curriculum' }}</p>
                    </div>
                    <span class="file-count">{{ lesson.files.length }} files</span>
                    @if (lesson.files.length) {
                      <div class="file-grid">
                        @for (file of lesson.files; track file.source + file.contentId) {
                          <ng-container *ngTemplateOutlet="fileItem; context: { file: file }" />
                        }
                      </div>
                    }
                  </article>
                } @empty {
                  <div class="state">No lessons were linked to this session.</div>
                }
              </section>
            </article>

            <aside class="detail-panel">
              <div class="detail-head">
                <div>
                  <h2>Session files</h2>
                  <p>Files published directly for this session.</p>
                </div>
                <span class="pill">{{ session.files.length }}</span>
              </div>
              <div class="file-grid single">
                @for (file of session.files; track file.source + file.contentId) {
                  <ng-container *ngTemplateOutlet="fileItem; context: { file: file }" />
                } @empty {
                  <div class="state">No direct session files.</div>
                }
              </div>
            </aside>
          </div>

          @if (selectedFile(); as file) {
            <section class="file-preview-panel" aria-labelledby="student-file-preview-title">
              <div class="preview-head">
                <div>
                  <p class="kicker">File preview</p>
                  <h2 id="student-file-preview-title">{{ file.title || 'Untitled file' }}</h2>
                  <p>{{ file.folderName || file.lessonTitle || file.contentType }}{{ file.sizeBytes ? ' · ' + fileSize(file.sizeBytes) : '' }}</p>
                </div>
                <div class="preview-actions">
                  @if (fileUrl(file); as url) {
                    <a class="button" [href]="url" target="_blank" rel="noopener">
                      <mat-icon>open_in_new</mat-icon>
                      Open
                    </a>
                  }
                  <button type="button" class="button" (click)="closeFilePreview()">
                    <mat-icon>close</mat-icon>
                    Close
                  </button>
                </div>
              </div>

              <div class="preview-body">
                @if (previewLoading()) {
                  <div class="preview-empty" aria-live="polite">
                    <mat-icon>sync</mat-icon>
                    <strong>Loading preview...</strong>
                    <span>The file is being prepared for display.</span>
                  </div>
                } @else if (previewError()) {
                  <div class="preview-empty error-preview">
                    <mat-icon>error</mat-icon>
                    <strong>Preview unavailable</strong>
                    <span>{{ previewError() }}</span>
                  </div>
                } @else if (file.contentType === 'NOTE') {
                  <article class="note-preview">
                    @for (line of notePreviewLines(file); track $index) {
                      <p>{{ line }}</p>
                    }
                  </article>
                } @else if (!fileUrl(file)) {
                  <div class="preview-empty">
                    <mat-icon>block</mat-icon>
                    <strong>Preview unavailable</strong>
                    <span>This file has no linked URL.</span>
                  </div>
                } @else if (isImageFile(file) && previewObjectUrl()) {
                  <img class="preview-media" [src]="previewObjectUrl()" [alt]="file.title || 'File preview'" />
                } @else if (isVideoFile(file) && previewObjectUrl()) {
                  <video class="preview-media" [src]="previewObjectUrl()" controls playsinline preload="metadata"></video>
                } @else if ((isPdfFile(file) || file.contentType === 'LINK') && safeFileUrl()) {
                  <iframe class="preview-frame" [src]="safeFileUrl()" [title]="file.title || 'File preview'"></iframe>
                } @else if (isPresentationFile(file)) {
                  <div class="presentation-preview">
                    @if (previewPresentationLoading()) {
                      <div class="preview-empty presentation-loading" aria-live="polite">
                        <mat-icon>sync</mat-icon>
                        <strong>Loading preview...</strong>
                        <span>The presentation is being prepared for display.</span>
                      </div>
                    }
                    @if (previewPresentationError()) {
                      <div class="preview-empty error-preview">
                        <mat-icon>slideshow</mat-icon>
                        <strong>Preview unavailable</strong>
                        <span>{{ previewPresentationError() }}</span>
                      </div>
                    } @else {
                      <div #presentationPreviewHost class="presentation-preview-host" [class.is-loading]="previewPresentationLoading()"></div>
                    }
                  </div>
                } @else {
                  <div class="preview-empty">
                    <mat-icon>open_in_new</mat-icon>
                    <strong>Open this file</strong>
                    <span>This file type cannot be displayed inside the page. Use Open to view it.</span>
                  </div>
                }
              </div>
            </section>
          }
        }
      } @else if (groupId()) {
        <div class="table">
          <div class="table-toolbar split">
            <a routerLink="/student/my-groups" class="button">
              <mat-icon>arrow_back</mat-icon>
              Groups
            </a>
            <span class="toolbar-note">{{ sessions().length }} published sessions</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Date</th>
                <th>Lessons</th>
                <th>Files</th>
                <th>Published</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (session of sessions(); track session.id) {
                <tr>
                  <td>
                    {{ session.title }}
                    <span>{{ session.subjectName || 'Subject not set' }}</span>
                  </td>
                  <td>{{ dateLabel(session.sessionDate) }}<span>{{ time(session.startTime) }}</span></td>
                  <td>{{ session.lessonsCount }}</td>
                  <td>{{ session.filesCount }}</td>
                  <td>{{ dateTime(session.publishedAt) }}</td>
                  <td>
                    <a class="row-link" [routerLink]="['/student/my-groups', groupId(), 'sessions', session.id]">Open</a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">No sessions have been published for this group.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="table">
          <div class="table-toolbar">
            <label class="search-field">
              <mat-icon>search</mat-icon>
              <input
                type="search"
                placeholder="Search group, subject, teacher, room"
                [value]="searchTerm()"
                (input)="onSearch($any($event.target).value)"
              />
            </label>
          </div>

          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Schedule</th>
                <th>Room</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (group of pagedGroups(); track group.id) {
                <tr>
                  <td>{{ group.name }}</td>
                  <td>{{ group.subject || '-' }}</td>
                  <td>{{ group.teacher || '-' }}</td>
                  <td>{{ group.schedule || 'Flexible schedule' }}</td>
                  <td>{{ group.room || '-' }}</td>
                  <td><span class="pill" [class.warn]="group.status !== 'Active'">{{ group.status || 'Active' }}</span></td>
                  <td>
                    <a class="row-link" [routerLink]="['/student/my-groups', group.id, 'sessions']">Sessions</a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty">
                    {{ searchTerm() ? 'No groups match your search.' : 'No groups found.' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <div class="pagination">
            <span>Page <strong>{{ pageIndex() + 1 }}</strong> of <strong>{{ totalPages() }}</strong></span>
            <label>
              Rows
              <select [value]="pageSize()" (change)="setPageSize($any($event.target).value)">
                <option [value]="5">5</option>
                <option [value]="10">10</option>
                <option [value]="20">20</option>
              </select>
            </label>
            <button type="button" (click)="previousPage()" [disabled]="pageIndex() === 0" aria-label="Previous page">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <button type="button" (click)="nextPage()" [disabled]="pageIndex() + 1 >= totalPages()" aria-label="Next page">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
      }
    </section>
  `,
  styleUrl: '../student-shared.css',
  styles: [`
    .kicker {
      margin: 0 0 8px;
      color: #52627a;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .04em;
    }

    .split {
      align-items: center;
      justify-content: space-between;
    }

    .toolbar-note {
      color: #52627a;
      font-size: 13px;
      font-weight: 800;
    }

    .row-link {
      color: #4f46e5;
      font-size: 13px;
      font-weight: 900;
      text-decoration: none;
    }

    .row-link:hover {
      color: #3730a3;
      text-decoration: underline;
    }

    .session-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
      gap: 16px;
      align-items: start;
    }

    .detail-panel {
      display: grid;
      gap: 16px;
      padding: 18px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #fff;
    }

    .detail-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .detail-head h2,
    .lesson-row h3 {
      margin: 0;
      color: #020617;
      font-size: 18px;
      font-weight: 900;
    }

    .detail-head p,
    .lesson-row p {
      margin: 4px 0 0;
      color: #52627a;
      font-size: 13px;
      font-weight: 700;
    }

    .lesson-list,
    .file-grid {
      display: grid;
      gap: 12px;
    }

    .lesson-row {
      display: grid;
      gap: 12px;
      padding: 14px;
      border: 1px solid #e8eef6;
      border-radius: 10px;
      background: #fbfdff;
    }

    .file-count {
      width: max-content;
      color: #52627a;
      font-size: 12px;
      font-weight: 900;
    }

    .file-grid {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .file-grid.single {
      grid-template-columns: 1fr;
    }

    .file-item {
      width: 100%;
      min-height: 58px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: 1px solid #dbe4f0;
      border-radius: 10px;
      background: #fff;
      color: #0f172a;
      font: inherit;
      text-align: left;
      text-decoration: none;
      transition: border-color .2s ease, background-color .2s ease;
    }

    .file-item:hover:not(.disabled) {
      border-color: #c7d2fe;
      background: #eef2ff;
    }

    .file-item.disabled {
      cursor: default;
    }

    .file-item:focus-visible,
    .preview-actions .button:focus-visible {
      outline: 3px solid rgb(79 70 229 / .2);
      outline-offset: 2px;
    }

    .file-item mat-icon {
      color: #4f46e5;
    }

    .file-item span {
      min-width: 0;
      display: grid;
      gap: 2px;
    }

    .file-item strong,
    .file-item small {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-item strong {
      font-size: 13px;
      font-weight: 900;
    }

    .file-item small {
      color: #52627a;
      font-size: 12px;
      font-weight: 700;
    }

    .file-preview-panel {
      display: grid;
      gap: 14px;
      margin-top: 16px;
      padding: 18px;
      border: 1px solid #dbe4f0;
      border-radius: 12px;
      background: #fff;
    }

    .preview-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
    }

    .preview-head h2 {
      margin: 0;
      color: #020617;
      font-size: 18px;
      font-weight: 900;
    }

    .preview-head p:not(.kicker) {
      margin: 4px 0 0;
      color: #52627a;
      font-size: 13px;
      font-weight: 700;
    }

    .preview-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }

    .preview-actions .button {
      border: 1px solid #dbe4f0;
      cursor: pointer;
    }

    .preview-body {
      min-height: 420px;
      overflow: hidden;
      display: grid;
      place-items: center;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
    }

    .preview-frame,
    .preview-media {
      width: 100%;
      height: min(72vh, 720px);
      border: 0;
      background: #fff;
    }

    .preview-media {
      object-fit: contain;
    }

    .presentation-preview {
      position: relative;
      width: 100%;
      height: min(72vh, 720px);
      align-self: stretch;
      overflow: auto;
      background: #f1f5f9;
    }

    .presentation-preview-host {
      min-height: 100%;
      padding: 16px;
    }

    .presentation-preview-host.is-loading {
      opacity: 0;
    }

    .presentation-loading {
      position: absolute;
      z-index: 1;
      inset: 0;
      background: #f8fafc;
    }

    .presentation-preview-host ::ng-deep .pptx-preview-wrapper {
      max-width: 100%;
      height: auto !important;
      margin-inline: auto;
      overflow: visible !important;
    }

    .presentation-preview-host ::ng-deep .pptx-wrapper {
      max-width: 100%;
      margin-inline: auto;
    }

    .presentation-preview-host ::ng-deep .pptx-preview-slide-wrapper,
    .presentation-preview-host ::ng-deep section,
    .presentation-preview-host ::ng-deep .slide {
      max-width: 100%;
      box-shadow: 0 12px 30px rgb(15 23 42 / 0.14);
    }

    .preview-empty {
      display: grid;
      justify-items: center;
      gap: 8px;
      padding: 24px;
      color: #52627a;
      text-align: center;
      font-size: 13px;
      font-weight: 700;
    }

    .preview-empty mat-icon {
      color: #4f46e5;
    }

    .preview-empty mat-icon[fonticon="sync"],
    .preview-empty mat-icon:first-child {
      width: 24px;
      height: 24px;
      font-size: 24px;
    }

    .error-preview {
      color: #be123c;
    }

    .error-preview mat-icon {
      color: #be123c;
    }

    .preview-empty strong {
      color: #0f172a;
      font-size: 15px;
      font-weight: 900;
    }

    .note-preview {
      width: 100%;
      min-height: 420px;
      align-self: stretch;
      display: grid;
      align-content: start;
      gap: 12px;
      padding: 24px;
      background: #fff;
      color: #0f172a;
    }

    .note-preview p {
      max-width: 76ch;
      margin: 0;
      color: #0f172a;
      font-size: 15px;
      font-weight: 700;
      line-height: 1.7;
      white-space: pre-wrap;
    }

    :host-context(.dark) .kicker,
    :host-context(.dark) .toolbar-note,
    :host-context(.dark) .detail-head p,
    :host-context(.dark) .lesson-row p,
    :host-context(.dark) .file-count,
    :host-context(.dark) .file-item small,
    :host-context(.dark) .preview-head p:not(.kicker),
    :host-context(.dark) .preview-empty {
      color: #94a3b8;
    }

    :host-context(.dark) .detail-panel,
    :host-context(.dark) .file-preview-panel {
      border-color: #334155;
      background: #0f172a;
    }

    :host-context(.dark) .lesson-row,
    :host-context(.dark) .preview-body {
      border-color: #1e293b;
      background: #111827;
    }

    :host-context(.dark) .file-item {
      border-color: #334155;
      background: #020617;
      color: #e2e8f0;
    }

    :host-context(.dark) .file-item:hover:not(.disabled) {
      border-color: #4f46e5;
      background: #1e1b4b;
    }

    :host-context(.dark) .detail-head h2,
    :host-context(.dark) .lesson-row h3,
    :host-context(.dark) .preview-head h2,
    :host-context(.dark) .preview-empty strong,
    :host-context(.dark) .note-preview,
    :host-context(.dark) .note-preview p {
      color: #f8fafc;
    }

    :host-context(.dark) .preview-frame,
    :host-context(.dark) .preview-media,
    :host-context(.dark) .note-preview,
    :host-context(.dark) .presentation-preview {
      background: #020617;
    }

    :host-context(.dark) .presentation-loading {
      background: #111827;
    }

    :host-context(.dark) .error-preview,
    :host-context(.dark) .error-preview mat-icon {
      color: #fecdd3;
    }

    @media (max-width: 980px) {
      .session-layout {
        grid-template-columns: 1fr;
      }

      .preview-head {
        flex-direction: column;
      }

      .preview-actions {
        justify-content: flex-start;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentGroupsComponent implements OnInit {
  private readonly data = inject(StudentDashboardDataService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private previewObjectUrlValue: string | null = null;
  private presentationPreviewer: PresentationPreviewer | null = null;

  @ViewChild('presentationPreviewHost')
  private presentationPreviewHost?: ElementRef<HTMLElement>;

  readonly groups = signal<StudentGroup[]>([]);
  readonly sessions = signal<StudentPublishedSession[]>([]);
  readonly sessionDetails = signal<StudentPublishedSessionDetails | null>(null);
  readonly groupId = signal<string | null>(null);
  readonly sessionId = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(5);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedFile = signal<StudentPublishedSessionFile | null>(null);
  readonly safeFileUrl = signal<SafeResourceUrl | null>(null);
  readonly previewObjectUrl = signal<string | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal<string | null>(null);
  readonly previewPresentationLoading = signal(false);
  readonly previewPresentationError = signal<string | null>(null);

  readonly filteredGroups = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return this.groups();
    return this.groups().filter((group) => this.groupSearchText(group).includes(query));
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredGroups().length / this.pageSize())));
  readonly pagedGroups = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredGroups().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.revokePreviewObjectUrl();
      this.destroyPresentationPreviewer();
    });
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.groupId.set(params.get('groupId'));
      this.sessionId.set(params.get('sessionId'));
      this.pageIndex.set(0);
      this.closeFilePreview();
      void this.load();
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.sessionId() && this.groupId()) {
        this.sessionDetails.set(await firstValueFrom(this.data.groupSessionDetails(this.groupId()!, this.sessionId()!)));
        return;
      }
      if (this.groupId()) {
        this.sessions.set(await firstValueFrom(this.data.groupSessions(this.groupId()!)));
        return;
      }
      this.groups.set(await firstValueFrom(this.data.groups()));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load groups');
    } finally {
      this.loading.set(false);
    }
  }

  pageTitle(): string {
    if (this.sessionId()) return this.sessionDetails()?.title || 'Session content';
    if (this.groupId()) return 'Published sessions';
    return 'My Groups';
  }

  pageDescription(): string {
    if (this.sessionId()) return 'Lessons and linked files published for this session.';
    if (this.groupId()) return 'Sessions published by your teacher or center admin.';
    return 'Groups and classes you are enrolled in.';
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.pageIndex.set(0);
  }

  setPageSize(value: string): void {
    const parsed = Number(value);
    this.pageSize.set(Number.isFinite(parsed) && parsed > 0 ? parsed : 5);
    this.pageIndex.set(0);
  }

  previousPage(): void {
    this.pageIndex.update((page) => Math.max(0, page - 1));
  }

  nextPage(): void {
    this.pageIndex.update((page) => Math.min(this.totalPages() - 1, page + 1));
  }

  dateLabel(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  dateTime(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  time(value?: string | null): string {
    if (!value) return '-';
    const [hourRaw, minuteRaw = '00'] = value.split(':');
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${suffix}`;
  }

  fileIcon(file: StudentPublishedSessionFile): string {
    if (file.contentType === 'LINK') return 'link';
    if (file.contentType === 'NOTE') return 'article';
    if (this.isImageFile(file)) return 'image';
    if (this.isVideoFile(file)) return 'movie';
    if (this.isPresentationFile(file)) return 'slideshow';
    return 'description';
  }

  async openFile(file: StudentPublishedSessionFile): Promise<void> {
    const url = this.fileUrl(file);
    this.revokePreviewObjectUrl();
    this.destroyPresentationPreviewer();
    this.selectedFile.set(file);
    this.previewError.set(null);
    this.previewLoading.set(false);
    this.previewPresentationError.set(null);
    this.previewPresentationLoading.set(false);
    this.safeFileUrl.set(url && file.contentType === 'LINK' ? this.sanitizer.bypassSecurityTrustResourceUrl(this.previewLinkUrl(url)) : null);
    if (!url || file.contentType === 'NOTE' || file.contentType === 'LINK') {
      return;
    }
    if (this.isPresentationFile(file)) {
      void this.preparePresentationPreview(file, url);
      return;
    }
    if (!this.isImageFile(file) && !this.isVideoFile(file) && !this.isPdfFile(file)) {
      return;
    }
    this.previewLoading.set(true);
    try {
      const blob = await firstValueFrom(this.http.get(url, { responseType: 'blob' }));
      const objectUrl = URL.createObjectURL(blob);
      this.previewObjectUrlValue = objectUrl;
      this.previewObjectUrl.set(objectUrl);
      this.safeFileUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
    } catch (error) {
      this.previewError.set(error instanceof Error ? error.message : 'Unable to load file preview. Use Open to view this file.');
    } finally {
      this.previewLoading.set(false);
    }
  }

  closeFilePreview(): void {
    this.revokePreviewObjectUrl();
    this.selectedFile.set(null);
    this.safeFileUrl.set(null);
    this.previewLoading.set(false);
    this.previewError.set(null);
    this.previewPresentationLoading.set(false);
    this.previewPresentationError.set(null);
    this.destroyPresentationPreviewer();
  }

  isImageFile(file: StudentPublishedSessionFile): boolean {
    return this.fileMime(file).startsWith('image/');
  }

  isVideoFile(file: StudentPublishedSessionFile): boolean {
    return this.fileMime(file).startsWith('video/');
  }

  isPdfFile(file: StudentPublishedSessionFile): boolean {
    return this.fileMime(file) === 'application/pdf' || (file.title || '').toLowerCase().endsWith('.pdf');
  }

  isPresentationFile(file: StudentPublishedSessionFile): boolean {
    const mime = this.fileMime(file);
    const title = (file.title || '').toLowerCase();
    return mime.includes('presentation') || mime.includes('powerpoint') || title.endsWith('.pptx') || title.endsWith('.ppt');
  }

  fileUrl(file: StudentPublishedSessionFile): string | null {
    return this.mediaUrlToAbsolute(file.url);
  }

  notePreviewLines(file: StudentPublishedSessionFile): string[] {
    const lines = this.extractNoteLines(file.contentJson)
      .map((line) => this.stripHtml(line).trim())
      .filter(Boolean);
    if (lines.length) {
      return lines;
    }
    return ['No text in this note yet.'];
  }

  fileSize(value: number): string {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  private groupSearchText(group: StudentGroup): string {
    return [
      group.name,
      group.subject,
      group.teacher,
      group.room,
      group.schedule,
      group.status,
    ].filter(Boolean).join(' ').toLowerCase();
  }

  private fileMime(file: StudentPublishedSessionFile): string {
    return (file.fileContentType || '').toLowerCase();
  }

  private mediaUrlToAbsolute(url: string | null | undefined): string | null {
    if (!url) {
      return null;
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const apiOrigin = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
  }

  private previewLinkUrl(url: string): string {
    return this.youtubeEmbedUrl(url) ?? this.normalizedExternalUrl(url);
  }

  private normalizedExternalUrl(url: string): string {
    const value = url.trim();
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  private youtubeEmbedUrl(url: string): string | null {
    try {
      const parsed = new URL(this.normalizedExternalUrl(url));
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
      let videoId: string | null = null;
      if (host === 'youtu.be') {
        videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
      } else if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (parsed.pathname.startsWith('/watch')) {
          videoId = parsed.searchParams.get('v');
        } else if (parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/shorts/')) {
          videoId = parsed.pathname.split('/').filter(Boolean)[1] ?? null;
        }
      }
      return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : null;
    } catch {
      return null;
    }
  }

  private extractNoteLines(contentJson: string | null | undefined): string[] {
    if (!contentJson) {
      return [];
    }
    try {
      const parsed = JSON.parse(contentJson) as { blocks?: Array<{ data?: Record<string, unknown> }> };
      const blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
      return blocks.flatMap((block) => {
        const data = block.data ?? {};
        const text = typeof data['text'] === 'string' ? data['text'] : '';
        const caption = typeof data['caption'] === 'string' ? data['caption'] : '';
        const items = Array.isArray(data['items']) ? data['items'].filter((item): item is string => typeof item === 'string') : [];
        return [text, caption, ...items].filter(Boolean);
      });
    } catch {
      return [contentJson];
    }
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]+>/g, '');
  }

  private revokePreviewObjectUrl(): void {
    if (this.previewObjectUrlValue) {
      URL.revokeObjectURL(this.previewObjectUrlValue);
      this.previewObjectUrlValue = null;
    }
    this.previewObjectUrl.set(null);
  }

  private async preparePresentationPreview(file: StudentPublishedSessionFile, url: string): Promise<void> {
    this.previewPresentationLoading.set(true);
    this.previewPresentationError.set(null);
    try {
      await new Promise((resolve) => setTimeout(resolve));
      const host = this.presentationPreviewHost?.nativeElement;
      if (!host || this.selectedFile()?.contentId !== file.contentId) {
        return;
      }

      host.replaceChildren();
      const [module, arrayBuffer] = await Promise.all([
        import('pptx-preview'),
        firstValueFrom(this.http.get(url, { responseType: 'arraybuffer' })),
      ]);
      if (this.selectedFile()?.contentId !== file.contentId) {
        return;
      }

      this.destroyPresentationPreviewer();
      this.presentationPreviewer = module.init(host, { width: 960, height: 540, mode: 'list' });
      await this.presentationPreviewer.preview(arrayBuffer);
    } catch {
      this.previewPresentationError.set('Unable to preview this presentation inline.');
    } finally {
      if (this.selectedFile()?.contentId === file.contentId) {
        this.previewPresentationLoading.set(false);
      }
    }
  }

  private destroyPresentationPreviewer(): void {
    if (this.presentationPreviewer) {
      this.presentationPreviewer.destroy();
      this.presentationPreviewer = null;
    }
    this.presentationPreviewHost?.nativeElement.replaceChildren();
  }
}
