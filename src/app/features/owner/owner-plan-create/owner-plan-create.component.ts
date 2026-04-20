import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-owner-plan-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule, ReactiveFormsModule],
  templateUrl: './owner-plan-create.component.html'})
export class OwnerPlanCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);

  private isSuccess = false;
  private taskId = 'create-plan-task';
  
  isEditMode = signal(false);
  planId = signal<string | null>(null);

  // Dropdown states
  showStatusDropdown = signal(false);
  statusSearchQuery = signal('');
  statuses = ['Active', 'Archived', 'Draft'];
  filteredStatuses = computed(() => {
    const query = this.statusSearchQuery().toLowerCase();
    return this.statuses.filter(s => s.toLowerCase().includes(query));
  });

  showVisibilityDropdown = signal(false);
  visibilitySearchQuery = signal('');
  visibilities = [
    { value: 'Public', label: 'Public (Visible on Pricing Page)' },
    { value: 'Private', label: 'Private (Sales Only)' }
  ];
  filteredVisibilities = computed(() => {
    const query = this.visibilitySearchQuery().toLowerCase();
    return this.visibilities.filter(v => v.label.toLowerCase().includes(query));
  });

  showCurrencyDropdown = signal(false);
  currencySearchQuery = signal('');
  currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'EGP', label: 'EGP (LE)' }
  ];
  filteredCurrencies = computed(() => {
    const query = this.currencySearchQuery().toLowerCase();
    return this.currencies.filter(c => c.label.toLowerCase().includes(query));
  });

  existingPlans = [
    { name: 'Starter' },
    { name: 'Professional' },
    { name: 'Enterprise' }
  ];

  checkExistingPlanName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      // In edit mode, allow the current plan name
      if (this.isEditMode()) {
        const currentPlan = this.loadPlanDataSync(this.planId()!);
        if (currentPlan && currentPlan.name.toLowerCase() === control.value.toLowerCase()) {
          return null;
        }
      }

      const exists = this.existingPlans.find(item => item.name.toLowerCase() === control.value.toLowerCase());
      if (exists) {
        return { alreadyExists: { source: exists.name } };
      }
      return null;
    };
  }

  loadPlanDataSync(id: string) {
    const plans = [
      { id: 'pln_starter', name: 'Starter' },
      { id: 'pln_pro', name: 'Professional' },
      { id: 'pln_enterprise', name: 'Enterprise' }
    ];
    return plans.find(p => p.id === id);
  }

  planForm = this.fb.group({
    name: ['', [Validators.required, this.checkExistingPlanName()]],
    description: [''],
    status: ['Active', Validators.required],
    visibility: ['Public', Validators.required],
    currency: ['USD', Validators.required],
    monthlyPrice: [0, [Validators.required, Validators.min(0)]],
    yearlyPrice: [0, [Validators.required, Validators.min(0)]],
    hasTrial: [true],
    trialDays: [14, [Validators.required, Validators.min(0)]],
    maxStudents: [100, [Validators.required]],
    maxTeachers: [10, [Validators.required]],
    maxStorage: [5, [Validators.required]],
    maxBranches: [1, [Validators.required]],
    modules: this.fb.group({
      academicStructure: [true],
      studentsManagement: [true],
      scheduling: [true],
      usersManagement: [true],
      auditLogs: [true],
      examsAndGrades: [false],
      finance: [false],
      smsIntegration: [false],
      advancedAnalytics: [false],
      parentPortal: [false],
      lms: [false],
      questionBank: [false]
    }),
    autoRenew: [true],
    allowDowngrade: [false]
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.planId.set(params['id']);
        this.loadPlanData(params['id']);
      }
    });

    // Restore task data if exists
    const savedTask = this.taskService.getTask(this.taskId);
    if (savedTask && savedTask.data) {
      this.planForm.patchValue(savedTask.data);
      // Remove task from service after restoring
      this.taskService.removeTask(this.taskId);
    }
  }

  loadPlanData(id: string) {
    // Simulate fetching plan data
    const plans = [
      {
        id: 'pln_starter',
        name: 'Starter',
        status: 'Active',
        monthlyPrice: 49,
        yearlyPrice: 490,
        currency: 'USD',
        maxStudents: 200,
        maxTeachers: 10,
        maxStorage: 5,
        maxBranches: 1,
        visibility: 'Public',
        description: 'Perfect for small schools starting their digital journey.'
      },
      {
        id: 'pln_pro',
        name: 'Professional',
        status: 'Active',
        monthlyPrice: 149,
        yearlyPrice: 1490,
        currency: 'USD',
        maxStudents: 1000,
        maxTeachers: 50,
        maxStorage: 50,
        maxBranches: 5,
        visibility: 'Public',
        description: 'Advanced features for growing institutions.'
      },
      {
        id: 'pln_enterprise',
        name: 'Enterprise',
        status: 'Active',
        monthlyPrice: 499,
        yearlyPrice: 4990,
        currency: 'USD',
        maxStudents: 10000,
        maxTeachers: 500,
        maxStorage: 500,
        maxBranches: 20,
        visibility: 'Private',
        description: 'Full power for large educational networks.'
      }
    ];

    const plan = plans.find(p => p.id === id);
    if (plan) {
      this.planForm.patchValue({
        ...plan,
        hasTrial: true,
        trialDays: 14,
        autoRenew: true,
        allowDowngrade: false
      });
    }
  }

  ngOnDestroy() {
    // Save task if form has data and was not successfully submitted
    const value = this.planForm.value;
    const hasData = value.name !== '' || value.description !== '';
    
    if (hasData && !this.isSuccess) {
      this.taskService.addTask({
        id: this.taskId,
        type: 'form',
        label: `Creating Plan: ${value.name || 'New Plan'}`,
        route: '/owner/plans/create',
        data: value
      });
    }
  }

  onCancel() {
    this.isSuccess = true;
    this.taskService.removeTask(this.taskId);
    this.router.navigate(['/owner/plans']);
  }

  selectStatus(status: string) {
    this.planForm.patchValue({ status });
    this.showStatusDropdown.set(false);
    this.statusSearchQuery.set('');
  }

  selectVisibility(visibility: string) {
    this.planForm.patchValue({ visibility });
    this.showVisibilityDropdown.set(false);
    this.visibilitySearchQuery.set('');
  }

  selectCurrency(currency: string) {
    this.planForm.patchValue({ currency });
    this.showCurrencyDropdown.set(false);
    this.currencySearchQuery.set('');
  }

  onSubmit() {
    if (this.planForm.valid) {
      console.log(this.isEditMode() ? 'Updating Plan:' : 'Creating Plan:', this.planForm.value);
      this.isSuccess = true;
      this.taskService.removeTask(this.taskId);
      // Here you would call a service to save the plan
      this.router.navigate(['/owner/plans']);
    }
  }
}
