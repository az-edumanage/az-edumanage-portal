import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-owner-tenant-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-tenant-create.component.html',
  styleUrl: './owner-tenant-create.component.css'})
export class OwnerTenantCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private taskService = inject(TaskService);

  isSubmitting = signal(false);
  showPassword = signal(false);
  showTenantTypeDropdown = signal(false);
  tenantTypeSearchQuery = signal('');
  showIndustryDropdown = signal(false);
  industrySearchQuery = signal('');
  showPlanDropdown = signal(false);
  planSearchQuery = signal('');
  showDomainDropdown = signal(false);
  showCityDropdown = signal(false);
  citySearchQuery = signal('');
  showCountryDropdown = signal(false);
  countrySearchQuery = signal('');
  showCustomizationMenu = signal(false);
  
  private isSuccess = false;
  private taskId = 'create-tenant-task';

  existingTenants = [
    { name: 'Cairo Excellence Academy', subdomain: 'cairo-excellence', email: 'contact@cairo-excellence.com', phone: '+201000000001' },
    { name: 'Alexandria Language School', subdomain: 'alex-lang', email: 'info@alex-lang.com', phone: '+201000000002' }
  ];

  checkExisting(field: 'name' | 'subdomain' | 'email' | 'phone'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const exists = this.existingTenants.find(item => item[field].toLowerCase() === control.value.toLowerCase());
      if (exists) {
        return { alreadyExists: { source: exists.name } };
      }
      return null;
    };
  }

  plans = [
    { id: 'starter', name: 'Starter', price: '$49/mo', popular: false },
    { id: 'pro', name: 'Professional', price: '$149/mo', popular: true },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', popular: false }
  ];

  tenantTypes = [
    'School',
    'Educational Center',
    'Individual Tutor',
    'Corporate Training',
    'University',
    'Bootcamp',
    'Online Academy'
  ];

  industries = [
    'K-12 School',
    'Language Center',
    'Higher Education',
    'Vocational Training',
    'Other'
  ];

  domains = [
    '.remix.com',
    '.academy.com',
    '.edu.com',
    '.school.com'
  ];

  cities = [
    'Cairo',
    'Alexandria',
    'Giza',
    'Dubai',
    'Abu Dhabi',
    'Riyadh',
    'Jeddah',
    'Amman',
    'Beirut'
  ];

  countries = [
    'Egypt',
    'United Arab Emirates',
    'Saudi Arabia',
    'Jordan',
    'Lebanon',
    'Kuwait',
    'Qatar'
  ];

  filteredTenantTypes = computed(() => {
    const query = this.tenantTypeSearchQuery().toLowerCase();
    return this.tenantTypes.filter(type => type.toLowerCase().includes(query));
  });

  filteredIndustries = computed(() => {
    const query = this.industrySearchQuery().toLowerCase();
    return this.industries.filter(industry => industry.toLowerCase().includes(query));
  });

  filteredPlans = computed(() => {
    const query = this.planSearchQuery().toLowerCase();
    return this.plans.filter(plan => plan.name.toLowerCase().includes(query));
  });

  filteredCities = computed(() => {
    const query = this.citySearchQuery().toLowerCase();
    return this.cities.filter(city => city.toLowerCase().includes(query));
  });

  filteredCountries = computed(() => {
    const query = this.countrySearchQuery().toLowerCase();
    return this.countries.filter(country => country.toLowerCase().includes(query));
  });

  getSelectedPlanName(): string {
    const planId = this.tenantForm.get('planId')?.value;
    const plan = this.plans.find(p => p.id === planId);
    return plan ? plan.name : '';
  }

  selectTenantType(type: string) {
    this.tenantForm.patchValue({ tenantType: type });
    this.showTenantTypeDropdown.set(false);
    this.tenantTypeSearchQuery.set('');
  }

  openCustomizationMenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showCustomizationMenu.set(true);
  }

  closeCustomizationMenu() {
    this.showCustomizationMenu.set(false);
  }

  selectIndustry(industry: string) {
    this.tenantForm.patchValue({ industry: industry });
    this.showIndustryDropdown.set(false);
    this.industrySearchQuery.set('');
  }

  selectPlan(planId: string) {
    this.tenantForm.patchValue({ planId: planId });
    this.showPlanDropdown.set(false);
    this.planSearchQuery.set('');
  }

  selectDomain(domain: string) {
    this.tenantForm.patchValue({ domain: domain });
    this.showDomainDropdown.set(false);
  }

  selectCity(city: string) {
    this.tenantForm.patchValue({ city: city });
    this.showCityDropdown.set(false);
    this.citySearchQuery.set('');
  }

  selectCountry(country: string) {
    this.tenantForm.patchValue({ country: country });
    this.showCountryDropdown.set(false);
    this.countrySearchQuery.set('');
  }

  tenantForm = this.fb.group({
    centerName: ['', [Validators.required, Validators.minLength(3), this.checkExisting('name')]],
    tenantType: ['', Validators.required],
    subdomain: ['', [Validators.required, Validators.pattern('^[a-z0-9-]+$'), this.checkExisting('subdomain')]],
    domain: ['.remix.com', Validators.required],
    industry: ['', Validators.required],
    contactName: [''],
    contactEmail: ['', [Validators.email, this.checkExisting('email')]],
    contactPhone: ['', [this.checkExisting('phone')]],
    address: [''],
    city: [''],
    country: [''],
    planId: ['', Validators.required],
    isTrial: [true],
    trialDays: [14, [Validators.required, Validators.min(1), Validators.pattern('^[0-9]*$')]],
    region: ['me-south-1'],
    autoProvision: [true],
    sendInvite: [true],
    onboardingLink: [false],
    sendOnboardingWhatsapp: [false],
    sendOnboardingEmail: [false]
  });

  ngOnInit() {
    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      this.tenantForm.patchValue(savedTask.data);
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    const value = this.tenantForm.value;
    const hasData = value.centerName !== '' || value.subdomain !== '';
    
    if (hasData && !this.isSuccess && !this.isSubmitting()) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Provisioning: ${value.centerName || 'New Tenant'}`,
        route: '/owner/tenants/create',
        data: value
      });
    }
  }

  onCancel() {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/owner/tenants']);
  }

  onReset() {
    this.tenantForm.reset({
      domain: '.remix.com',
      isTrial: true,
      trialDays: 14,
      region: 'me-south-1',
      autoProvision: true,
      sendInvite: true,
      onboardingLink: false,
      sendOnboardingWhatsapp: false,
      sendOnboardingEmail: false
    });
  }

  onSubmit() {
    if (this.tenantForm.valid) {
      this.isSubmitting.set(true);
      
      // Simulate API call
      setTimeout(() => {
        console.log('Tenant Created:', this.tenantForm.value);
        this.isSuccess = true;
        this.taskService.removeTask(this.taskId);
        this.isSubmitting.set(false);
        this.router.navigate(['/owner/tenants']);
      }, 2000);
    }
  }
}
