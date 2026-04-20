import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface Plan {
  id: string;
  name: string;
  status: 'Active' | 'Archived';
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxStudents: number;
  maxStorage: number;
  trialDays: number;
  visibility: 'Public' | 'Private';
}

@Component({
  selector: 'app-owner-plans-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-plans-list.component.html'})
export class OwnerPlansListComponent {
  plans = signal<Plan[]>([
    {
      id: 'pln_starter',
      name: 'Starter',
      status: 'Active',
      monthlyPrice: 49,
      yearlyPrice: 490,
      currency: '$',
      maxStudents: 200,
      maxStorage: 5,
      trialDays: 14,
      visibility: 'Public'
    },
    {
      id: 'pln_pro',
      name: 'Professional',
      status: 'Active',
      monthlyPrice: 149,
      yearlyPrice: 1490,
      currency: '$',
      maxStudents: 1000,
      maxStorage: 50,
      trialDays: 14,
      visibility: 'Public'
    },
    {
      id: 'pln_enterprise',
      name: 'Enterprise',
      status: 'Active',
      monthlyPrice: 499,
      yearlyPrice: 4990,
      currency: '$',
      maxStudents: 10000,
      maxStorage: 500,
      trialDays: 30,
      visibility: 'Private'
    }
  ]);

  calculateSavings(plan: Plan): number {
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.yearlyPrice;
    return Math.round((savings / monthlyCost) * 100);
  }

  togglePlanStatus(plan: Plan) {
    this.plans.update(currentPlans => 
      currentPlans.map(p => 
        p.id === plan.id 
          ? { ...p, status: p.status === 'Active' ? 'Archived' : 'Active' } 
          : p
      )
    );
  }
}
