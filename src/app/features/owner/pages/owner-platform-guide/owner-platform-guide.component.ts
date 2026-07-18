import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { OwnerPlatformGuideDataService } from '../../data-access/owner-platform-guide-data.service';
import { PlatformGuideCard, PlatformGuideCardPayload } from '../../../platform-guide/platform-guide.models';
import { resolvePlatformGuideMediaUrl } from '../../../platform-guide/platform-guide-media';

@Component({
  selector: 'app-owner-platform-guide',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './owner-platform-guide.component.html',
  styleUrl: './owner-platform-guide.component.css',
  host: { '(document:keydown.escape)': 'closeEditor()' },
})
export class OwnerPlatformGuideComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly data = inject(OwnerPlatformGuideDataService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cards = signal<PlatformGuideCard[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly editorOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly imageUploading = signal(false);
  readonly videoUploading = signal(false);
  readonly deletingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(180)]],
    titleAr: ['', Validators.maxLength(180)],
    description: ['', [Validators.required, Validators.maxLength(4000)]],
    descriptionAr: ['', Validators.maxLength(4000)],
    imageUrl: ['', Validators.required],
    videoUrl: ['', Validators.required],
    visible: [true],
    displayOrder: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.load();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '', titleAr: '', description: '', descriptionAr: '',
      imageUrl: '', videoUrl: '', visible: true, displayOrder: this.cards().length,
    });
    this.error.set(null);
    this.editorOpen.set(true);
  }

  openEdit(card: PlatformGuideCard): void {
    this.editingId.set(card.id);
    this.form.reset({
      title: card.title,
      titleAr: card.titleAr ?? '',
      description: card.description,
      descriptionAr: card.descriptionAr ?? '',
      imageUrl: card.imageUrl,
      videoUrl: card.videoUrl,
      visible: card.visible,
      displayOrder: card.displayOrder,
    });
    this.error.set(null);
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    if (!this.saving()) {
      this.editorOpen.set(false);
    }
  }

  save(): void {
    if (this.form.invalid || this.saving() || this.imageUploading() || this.videoUploading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    const payload: PlatformGuideCardPayload = {
      ...value,
      titleAr: value.titleAr.trim() || null,
      descriptionAr: value.descriptionAr.trim() || null,
      displayOrder: Number(value.displayOrder),
    };
    const request = this.editingId() === null
      ? this.data.create(payload)
      : this.data.update(this.editingId()!, payload);
    request.pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.editorOpen.set(false);
        this.load();
      },
      error: (error: Error) => this.error.set(error.message || 'Unable to save guide card.'),
    });
  }

  deleteCard(card: PlatformGuideCard): void {
    if (this.deletingId() !== null || !confirm(`Delete "${card.title}"?`)) {
      return;
    }
    this.deletingId.set(card.id);
    this.data.delete(card.id)
      .pipe(finalize(() => this.deletingId.set(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.cards.update((cards) => cards.filter((item) => item.id !== card.id)),
        error: (error: Error) => this.error.set(error.message || 'Unable to delete guide card.'),
      });
  }

  uploadImage(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.upload(file, 'platform-guide-image');
    (event.target as HTMLInputElement).value = '';
  }

  uploadVideo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.upload(file, 'platform-guide-video');
    (event.target as HTMLInputElement).value = '';
  }

  imagePreview(url: string): string {
    return resolvePlatformGuideMediaUrl(url);
  }

  private upload(file: File, section: 'platform-guide-image' | 'platform-guide-video'): void {
    const state = section === 'platform-guide-image' ? this.imageUploading : this.videoUploading;
    const control = section === 'platform-guide-image' ? this.form.controls.imageUrl : this.form.controls.videoUrl;
    state.set(true);
    this.error.set(null);
    this.data.upload(file, section)
      .pipe(finalize(() => state.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => control.setValue(result.url),
        error: (error: Error) => this.error.set(error.message || 'Unable to upload file.'),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.data.list().pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cards) => this.cards.set(cards),
      error: (error: Error) => this.error.set(error.message || 'Unable to load guide cards.'),
    });
  }
}
