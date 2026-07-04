import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TenantOverviewDataService } from './tenant-overview-data.service';
import { TenantOverviewView } from '../models/tenant-overview.models';

describe('TenantOverviewDataService', () => {
  let service: TenantOverviewDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TenantOverviewDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads tenant overview data with the selected range', async () => {
    const promise = firstValueFrom(service.loadOverview('week', 'week'));

    const request = http.expectOne(`${environment.apiBaseUrl}/tenant/overview?range=week&revenueRange=week`);
    expect(request.request.method).toBe('GET');
    request.flush(overviewResponse());

    await expect(promise).resolves.toMatchObject({
      range: 'today',
      pendingPaymentCount: 2,
      kpis: [
        { key: 'totalStudents', value: '12', numericValue: 12 },
        { key: 'activeGroups', value: '4', numericValue: 4 },
        { key: 'todaySessions', value: '1', numericValue: 1 },
        { key: 'totalTeachers', value: '3', numericValue: 3 },
        { key: 'overduePayments', value: '$750.00', numericValue: 750 },
      ],
      rooms: { occupiedRooms: 1, freeRooms: 2, freeHours: '35h' },
    });
  });

  it('maps API errors to user-facing errors', async () => {
    const promise = firstValueFrom(service.loadOverview());

    const request = http.expectOne(`${environment.apiBaseUrl}/tenant/overview?range=today&revenueRange=month`);
    request.flush({ message: 'Tenant overview access required' }, { status: 403, statusText: 'Forbidden' });

    await expect(promise).rejects.toThrow('Tenant overview access required');
  });
});

function overviewResponse(): TenantOverviewView {
  return {
    generatedAt: '2026-06-27T00:00:00Z',
    range: 'today',
    kpis: [
      {
        key: 'totalStudents',
        label: 'Total Students',
        value: '12',
        numericValue: 12,
        trend: null,
        subtext: '3 teachers',
        icon: 'school',
        bgClass: 'bg-indigo-600/10',
        iconClass: 'text-indigo-600',
      },
      {
        key: 'activeGroups',
        label: 'Active Groups',
        value: '4',
        numericValue: 4,
        trend: null,
        subtext: 'Active classes',
        icon: 'groups',
        bgClass: 'bg-violet-50',
        iconClass: 'text-violet-600',
      },
      {
        key: 'todaySessions',
        label: 'Today Sessions',
        value: '1',
        numericValue: 1,
        trend: null,
        subtext: 'Scheduled groups',
        icon: 'event',
        bgClass: 'bg-amber-50',
        iconClass: 'text-amber-600',
      },
      {
        key: 'totalTeachers',
        label: 'Total Teachers',
        value: '3',
        numericValue: 3,
        trend: null,
        subtext: 'Teaching staff',
        icon: 'person',
        bgClass: 'bg-emerald-50',
        iconClass: 'text-emerald-600',
      },
      {
        key: 'overduePayments',
        label: 'Overdue Payments',
        value: '$750.00',
        numericValue: 750,
        trend: null,
        subtext: '2 unpaid invoices',
        icon: 'money_off',
        bgClass: 'bg-rose-50',
        iconClass: 'text-rose-600',
      },
    ],
    attendanceTrend: { labels: [], datasets: [] },
    revenueTrend: { labels: [], datasets: [] },
    todaySessions: [],
    runningGroups: [],
    rooms: {
      occupiedRooms: 1,
      freeRooms: 2,
      freeHours: '35h',
      freeHoursValue: 35,
      operatingWindow: '08:00 AM - 08:00 PM',
    },
    pendingPayments: [],
    pendingPaymentCount: 2,
    sectionErrors: [],
  };
}
