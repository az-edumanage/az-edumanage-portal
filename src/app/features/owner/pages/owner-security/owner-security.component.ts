import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OwnerSecurityFacade } from '../../state/owner-security.facade';

@Component({
  selector: 'app-owner-security',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-security.component.html'})
export class OwnerSecurityComponent implements OnInit, OnDestroy {
  private readonly facade = inject(OwnerSecurityFacade);

  readonly authForm = this.facade.authForm;
  readonly mfaForm = this.facade.mfaForm;
  readonly sessionForm = this.facade.sessionForm;
  readonly apiForm = this.facade.apiForm;
  readonly dataForm = this.facade.dataForm;

  ngOnInit(): void {
    this.facade.initialize();
  }

  ngOnDestroy(): void {
    this.facade.onDestroy();
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  saveAuthPolicies(): void {
    this.facade.saveAuthPolicies();
  }

  saveMfaPolicies(): void {
    this.facade.saveMfaPolicies();
  }

  saveSessionPolicies(): void {
    this.facade.saveSessionPolicies();
  }

  saveApiPolicies(): void {
    this.facade.saveApiPolicies();
  }

  saveDataProtection(): void {
    this.facade.saveDataProtection();
  }
}
