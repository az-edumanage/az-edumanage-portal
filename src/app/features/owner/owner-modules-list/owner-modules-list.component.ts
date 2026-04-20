import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export type ModuleCategory = 'Core Business' | 'Core System' | 'Advanced';
export type ModuleStatus = 'Enabled' | 'Disabled';

export interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  category: ModuleCategory;
  status: ModuleStatus;
  activeTenantsCount: number;
  lastUpdated: string;
  includedInPlans: string[];
  icon: string;
}

@Component({
  selector: 'app-owner-modules-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './owner-modules-list.component.html'})
export class OwnerModulesListComponent {
  filter = signal<'All' | ModuleCategory>('All');

  modules = signal<Module[]>([
    // Core Business
    {
      id: 'mod-acad',
      name: 'Academic Structure',
      code: 'CORE_ACAD',
      description: 'Manage academic years, terms, levels, and classes.',
      category: 'Core Business',
      status: 'Enabled',
      activeTenantsCount: 124,
      lastUpdated: '2 days ago',
      includedInPlans: ['All Plans'],
      icon: 'school'
    },
    {
      id: 'mod-students',
      name: 'Students Management',
      code: 'CORE_STUD',
      description: 'Comprehensive student profiles, enrollment, and history.',
      category: 'Core Business',
      status: 'Enabled',
      activeTenantsCount: 124,
      lastUpdated: '1 week ago',
      includedInPlans: ['All Plans'],
      icon: 'people'
    },
    {
      id: 'mod-sched',
      name: 'Scheduling & Timetable',
      code: 'CORE_SCHED',
      description: 'Class scheduling, teacher allocation, and conflict detection.',
      category: 'Core Business',
      status: 'Enabled',
      activeTenantsCount: 124,
      lastUpdated: '3 days ago',
      includedInPlans: ['All Plans'],
      icon: 'calendar_today'
    },
    
    // Core System
    {
      id: 'mod-users',
      name: 'Users Management',
      code: 'SYS_USERS',
      description: 'System users, roles, and access control.',
      category: 'Core System',
      status: 'Enabled',
      activeTenantsCount: 124,
      lastUpdated: '1 month ago',
      includedInPlans: ['All Plans'],
      icon: 'manage_accounts'
    },
    {
      id: 'mod-audit',
      name: 'Audit Logs',
      code: 'SYS_AUDIT',
      description: 'Track all system activities and security events.',
      category: 'Core System',
      status: 'Enabled',
      activeTenantsCount: 124,
      lastUpdated: '2 weeks ago',
      includedInPlans: ['All Plans'],
      icon: 'history'
    },

    // Advanced
    {
      id: 'mod-exams',
      name: 'Exams & Grades',
      code: 'ADV_EXAM',
      description: 'Create exams, record grades, and generate report cards.',
      category: 'Advanced',
      status: 'Enabled',
      activeTenantsCount: 85,
      lastUpdated: '5 days ago',
      includedInPlans: ['Professional', 'Enterprise'],
      icon: 'assignment'
    },
    {
      id: 'mod-finance',
      name: 'Finance',
      code: 'ADV_FIN',
      description: 'Invoicing, payments, and financial reporting.',
      category: 'Advanced',
      status: 'Enabled',
      activeTenantsCount: 42,
      lastUpdated: '1 day ago',
      includedInPlans: ['Enterprise'],
      icon: 'payments'
    },
    {
      id: 'mod-sms',
      name: 'SMS Integration',
      code: 'ADV_SMS',
      description: 'Send automated SMS notifications to parents and students.',
      category: 'Advanced',
      status: 'Disabled',
      activeTenantsCount: 0,
      lastUpdated: '1 month ago',
      includedInPlans: [],
      icon: 'sms'
    },
    {
      id: 'mod-analytics',
      name: 'Advanced Analytics',
      code: 'ADV_ANALYTICS',
      description: 'Deep insights into academic performance and operations.',
      category: 'Advanced',
      status: 'Enabled',
      activeTenantsCount: 15,
      lastUpdated: '2 days ago',
      includedInPlans: ['Enterprise'],
      icon: 'analytics'
    },
    {
      id: 'mod-parent-portal',
      name: 'Parent Portal',
      code: 'ADV_PARENT',
      description: 'Dedicated portal for parents to track student progress and communicate.',
      category: 'Advanced',
      status: 'Enabled',
      activeTenantsCount: 60,
      lastUpdated: '1 week ago',
      includedInPlans: ['Professional', 'Enterprise'],
      icon: 'family_restroom'
    },
    {
      id: 'mod-lms',
      name: 'LMS',
      code: 'ADV_LMS',
      description: 'Learning Management System for online courses and assignments.',
      category: 'Advanced',
      status: 'Enabled',
      activeTenantsCount: 35,
      lastUpdated: '3 days ago',
      includedInPlans: ['Enterprise'],
      icon: 'menu_book'
    },
    {
      id: 'mod-question-bank',
      name: 'Question Bank',
      code: 'ADV_QBANK',
      description: 'Centralized repository for exam questions and assessments.',
      category: 'Advanced',
      status: 'Enabled',
      activeTenantsCount: 20,
      lastUpdated: '4 days ago',
      includedInPlans: ['Professional', 'Enterprise'],
      icon: 'quiz'
    }
  ]);

  filteredModules = computed(() => {
    const currentFilter = this.filter();
    if (currentFilter === 'All') {
      return this.modules();
    }
    return this.modules().filter(m => m.category === currentFilter);
  });
}
