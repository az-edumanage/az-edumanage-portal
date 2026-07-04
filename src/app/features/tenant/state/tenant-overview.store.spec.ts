import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TenantOverviewDataService } from '../data-access/tenant-overview-data.service';
import { TenantOverviewView } from '../models/tenant-overview.models';
import { TenantOverviewStore } from './tenant-overview.store';

describe('TenantOverviewStore', () => {
  let store: TenantOverviewStore;
  let dataService: { loadOverview: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dataService = { loadOverview: vi.fn(() => of(overviewResponse())) };
    TestBed.configureTestingModule({
      providers: [{ provide: TenantOverviewDataService, useValue: dataService }],
    });
    store = TestBed.inject(TenantOverviewStore);
  });

  it('loads real overview data into computed state', () => {
    store.load('week', 'week');

    expect(dataService.loadOverview).toHaveBeenCalledWith('week', 'week');
    expect(store.status()).toBe('loaded');
    expect(store.revenueTrendRange()).toBe('week');
    expect(store.kpis().map((kpi) => kpi.key)).toEqual(['totalStudents', 'activeGroups', 'todaySessions', 'totalTeachers', 'overduePayments']);
    expect(store.kpis().map((kpi) => kpi.numericValue)).toEqual([12, 4, 1, 3, 750]);
    expect(store.kpis()[0].label).toBe('Total Students');
    expect(store.todaySessions()[0].group).toBe('Physics');
    expect(store.runningGroups()[0].group).toBe('Physics');
    expect(store.rooms().freeRooms).toBe(2);
    expect(store.pendingPaymentCount()).toBe(1);
  });

  it('keeps safe section defaults and marks unavailable when loading fails', () => {
    dataService.loadOverview.mockReturnValueOnce(throwError(() => new Error('Backend unavailable')));

    store.load('today');

    expect(store.status()).toBe('unavailable');
    expect(store.error()).toBe('Backend unavailable');
    expect(store.kpis()).toEqual([]);
    expect(store.attendanceTrend()).toEqual({ labels: [], datasets: [] });
    expect(store.revenueTrend()).toEqual({ labels: [], datasets: [] });
    expect(store.todaySessions()).toEqual([]);
    expect(store.runningGroups()).toEqual([]);
    expect(store.rooms()).toEqual({
      occupiedRooms: 0,
      freeRooms: 0,
      freeHours: '0h',
      freeHoursValue: 0,
      operatingWindow: '08:00 AM - 08:00 PM',
    });
    expect(store.pendingPayments()).toEqual([]);
    expect(store.pendingPaymentCount()).toBe(0);
  });
});

function overviewResponse(): TenantOverviewView {
  return {
    generatedAt: '2026-06-27T00:00:00Z',
    range: 'week',
    kpis: [
      {
        key: 'totalStudents',
        label: 'Total Students',
        value: '12',
        numericValue: 12,
        trend: null,
        subtext: '3 teachers',
        icon: 'school',
        bgClass: '',
        iconClass: '',
      },
      {
        key: 'activeGroups',
        label: 'Active Groups',
        value: '4',
        numericValue: 4,
        trend: null,
        subtext: 'Active classes',
        icon: 'groups',
        bgClass: '',
        iconClass: '',
      },
      {
        key: 'todaySessions',
        label: 'Today Sessions',
        value: '1',
        numericValue: 1,
        trend: null,
        subtext: 'Scheduled groups',
        icon: 'event',
        bgClass: '',
        iconClass: '',
      },
      {
        key: 'totalTeachers',
        label: 'Total Teachers',
        value: '3',
        numericValue: 3,
        trend: null,
        subtext: 'Teaching staff',
        icon: 'person',
        bgClass: '',
        iconClass: '',
      },
      {
        key: 'overduePayments',
        label: 'Overdue Payments',
        value: '$750.00',
        numericValue: 750,
        trend: null,
        subtext: '2 unpaid invoices',
        icon: 'money_off',
        bgClass: '',
        iconClass: '',
      },
    ],
    attendanceTrend: { labels: ['Mon'], datasets: [{ label: 'Attendance %', data: [90] }] },
    revenueTrend: { labels: ['Week 1'], datasets: [{ label: 'Revenue', data: [500] }] },
    todaySessions: [
      { id: 'session-1', time: '09:00 AM', group: 'Physics', subject: 'Mechanics', teacher: 'Dr Ahmed', room: 'Lab 1', status: 'Scheduled' },
    ],
    runningGroups: [
      { id: 'session-1', group: 'Physics', subject: 'Mechanics', teacher: 'Dr Ahmed', room: 'Lab 1', time: '09:00 AM', endsAt: '10:00 AM' },
    ],
    rooms: {
      occupiedRooms: 1,
      freeRooms: 2,
      freeHours: '35h',
      freeHoursValue: 35,
      operatingWindow: '08:00 AM - 08:00 PM',
    },
    pendingPayments: [
      { invoiceId: 'invoice-1', student: 'Mona Ali', amount: '$500.00', amountValue: 500, currency: 'EGP', dueDate: 'Today' },
    ],
    pendingPaymentCount: 1,
    sectionErrors: [],
  };
}
