import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { OwnerApiService } from '../data-access/owner-api.service';

@Component({
  selector: 'app-owner-tenant-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-tenant-edit.component.html',
  styleUrl: './owner-tenant-edit.component.css'})
export class OwnerTenantEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ownerApi = inject(OwnerApiService);

  tenantId = '';
  isSubmitting = signal(false);
  showTenantTypeDropdown = signal(false);
  showIndustryDropdown = signal(false);
  showPlanDropdown = signal(false);
  showCityDropdown = signal(false);
  showCountryDropdown = signal(false);
  showPassword = signal(false);

  tenantName = signal('Loading...');

  tenantTypes = ['School', 'Educational Center', 'Individual Tutor', 'Corporate Training', 'University', 'Bootcamp', 'Online Academy'];
  industries = ['K-12 School', 'Language Center', 'Higher Education', 'Vocational Training', 'Other'];
  cities = ['Cairo', 'Alexandria', 'Giza', 'Dubai', 'Abu Dhabi', 'Riyadh', 'Jeddah', 'Amman', 'Beirut'];
  countries = ['Egypt', 'United Arab Emirates', 'Saudi Arabia', 'Jordan', 'Lebanon', 'Kuwait', 'Qatar'];
  plans = [
    { id: 'starter', name: 'Starter', price: '$49/mo' },
    { id: 'pro', name: 'Professional', price: '$149/mo' },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom' }
  ];

  tenantForm = this.fb.group({
    centerName: ['', [Validators.required, Validators.minLength(3)]],
    tenantType: ['', Validators.required],
    subdomain: [{ value: '', disabled: true }],
    domain: ['.remix.com'],
    industry: ['', Validators.required],
    contactName: [''],
    contactEmail: ['', [Validators.email]],
    contactPhone: [''],
    address: [''],
    city: [''],
    country: [''],
    planId: ['', Validators.required],
    isTrial: [false],
    trialDays: [14],
    newPassword: ['', [Validators.minLength(8)]],
    confirmPassword: ['']
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: AbstractControl) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { 'passwordMismatch': true };
  }

  ngOnInit() {
    this.tenantId = this.route.snapshot.params['id'];

    this.ownerApi.fetchTenantForEdit(this.tenantId).subscribe((mockData) => {
      this.tenantForm.patchValue(mockData);
      this.tenantName.set(mockData.centerName);
    });
  }

  onCancel() {
    this.router.navigate(['/owner/tenants', this.tenantId]);
  }

  onSubmit() {
    if (this.tenantForm.valid) {
      this.isSubmitting.set(true);

      this.ownerApi
        .updateTenant(this.tenantId, this.tenantForm.getRawValue())
        .subscribe(({ payload }) => {
        console.log('Tenant Updated:', payload);
        this.isSubmitting.set(false);
        this.router.navigate(['/owner/tenants', this.tenantId]);
      });
    }
  }

  selectTenantType(type: string) {
    this.tenantForm.patchValue({ tenantType: type });
    this.showTenantTypeDropdown.set(false);
  }

  selectIndustry(industry: string) {
    this.tenantForm.patchValue({ industry: industry });
    this.showIndustryDropdown.set(false);
  }

  selectPlan(planId: string) {
    this.tenantForm.patchValue({ planId: planId });
    this.showPlanDropdown.set(false);
  }

  selectCity(city: string) {
    this.tenantForm.patchValue({ city: city });
    this.showCityDropdown.set(false);
  }

  selectCountry(country: string) {
    this.tenantForm.patchValue({ country: country });
    this.showCountryDropdown.set(false);
  }

  getSelectedPlanName(): string {
    const planId = this.tenantForm.get('planId')?.value;
    const plan = this.plans.find(p => p.id === planId);
    return plan ? plan.name : '';
  }
}
