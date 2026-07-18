import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { I18nService } from '../../../../core/services/i18n.service';
import { PlatformGuideCard } from '../../../platform-guide/platform-guide.models';
import { platformGuideEmbedUrl, resolvePlatformGuideMediaUrl } from '../../../platform-guide/platform-guide-media';
import { TenantPlatformGuideDataService } from '../../data-access/tenant-platform-guide-data.service';

@Component({
  selector: 'app-tenant-platform-guide',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './tenant-platform-guide.component.html',
  styleUrl: './tenant-platform-guide.component.css',
  host: { '(document:keydown.escape)': 'closeVideo()' },
})
export class TenantPlatformGuideComponent implements OnInit {
  private readonly data = inject(TenantPlatformGuideDataService);
  private readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  readonly language = this.i18n.language;
  readonly cards = signal<PlatformGuideCard[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly selectedCard = signal<PlatformGuideCard | null>(null);
  readonly embedUrl = signal<SafeResourceUrl | null>(null);
  readonly directVideoUrl = computed(() => {
    const card = this.selectedCard();
    return card && !platformGuideEmbedUrl(card.videoUrl) ? resolvePlatformGuideMediaUrl(card.videoUrl) : null;
  });

  ngOnInit(): void {
    this.data.list().pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cards) => this.cards.set(cards),
      error: (error: Error) => this.error.set(error.message || 'Unable to load the user guide.'),
    });
  }

  title(card: PlatformGuideCard): string {
    return this.language() === 'ar' && card.titleAr ? card.titleAr : card.title;
  }

  description(card: PlatformGuideCard): string {
    return this.language() === 'ar' && card.descriptionAr ? card.descriptionAr : card.description;
  }

  imageUrl(card: PlatformGuideCard): string {
    return resolvePlatformGuideMediaUrl(card.imageUrl);
  }

  openVideo(card: PlatformGuideCard): void {
    const embed = platformGuideEmbedUrl(card.videoUrl);
    this.embedUrl.set(embed ? this.sanitizer.bypassSecurityTrustResourceUrl(embed) : null);
    this.selectedCard.set(card);
  }

  closeVideo(): void {
    this.selectedCard.set(null);
    this.embedUrl.set(null);
  }
}
