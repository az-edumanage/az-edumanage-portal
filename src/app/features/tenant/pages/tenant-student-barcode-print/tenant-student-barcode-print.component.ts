import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TenantStudentsDataService } from '../../data-access/tenant-students-data.service';
import { StudentDetails } from '../../models/tenant-students.models';
import { renderStudentBarcodeSvg } from '../tenant-student-details/student-barcode-renderer';

@Component({
  selector: 'app-tenant-student-barcode-print',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './tenant-student-barcode-print.component.html',
  styles: [`
    @page {
      margin: 0;
      size: 85.6mm 53.98mm;
    }

    @media print {
      :host {
        display: block;
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        width: 100% !important;
        min-height: 100% !important;
        overflow: hidden !important;
        background: #ffffff;
      }

      .print-toolbar,
      .print-hidden,
      .print-page > :not(.barcode-card) {
        display: none !important;
      }

      .print-page {
        min-height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        background: #ffffff !important;
      }

      .barcode-card {
        display: flex !important;
        width: 85.6mm !important;
        height: 53.98mm !important;
        box-shadow: none !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantStudentBarcodePrintComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(TenantStudentsDataService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly student = signal<StudentDetails | null>(null);
  readonly barcodeSvg = signal<SafeHtml | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly unavailableMessage = signal<string | null>(null);
  readonly canPrint = computed(() => Boolean(this.student() && this.barcodeSvg()));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Student not found');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.unavailableMessage.set(null);
    this.data.getStudent(id).subscribe({
      next: (student) => {
        this.student.set(student);
        this.renderBarcode(student.barcodeNumber);
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.student.set(null);
        this.barcodeSvg.set(null);
        this.unavailableMessage.set(null);
        this.isLoading.set(false);
      },
    });
  }

  printBarcode(): void {
    if (!this.canPrint()) {
      return;
    }
    window.print();
  }

  private renderBarcode(barcodeNumber: string): void {
    const result = renderStudentBarcodeSvg(barcodeNumber);
    if (!result) {
      this.barcodeSvg.set(null);
      this.unavailableMessage.set('Barcode is not available for printing');
      return;
    }

    this.unavailableMessage.set(null);
    this.barcodeSvg.set(this.sanitizer.bypassSecurityTrustHtml(result.svg));
  }
}
