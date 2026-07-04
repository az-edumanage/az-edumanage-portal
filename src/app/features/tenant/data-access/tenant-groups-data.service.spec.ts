import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TenantGroupsDataService } from './tenant-groups-data.service';

describe('TenantGroupsDataService', () => {
  let service: TenantGroupsDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TenantGroupsDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads tenant groups from the backend', () => {
    service.loadGroups().subscribe((groups) => {
      expect(groups[0]).toEqual(expect.objectContaining({
        id: 'group-1',
        name: 'Physics G12-A',
        pricePerStudent: 500,
        ownedBy: 'Center',
        educationCategory: 'BASIC_EDUCATION',
        startAt: '10:00',
        duration: 90,
      }));
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups'));
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'group-1',
        name: 'Physics G12-A',
        teacher: 'Dr. Ahmed Zewail',
        subject: 'Physics',
        studentsCount: 0,
        schedule: 'Monday 10:00',
        startAt: '10:00',
        duration: 90,
        room: 'Lab 101',
        pricePerStudent: 500,
        ownedBy: 'Center',
        educationCategory: 'BASIC_EDUCATION',
      },
    ]);
  });

  it('deletes a tenant group through the backend', () => {
    service.deleteGroup('group-1').subscribe((response) => {
      expect(response).toBeNull();
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/group-1'));
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('loads tenant group schedule summary from the backend', () => {
    service.loadScheduleSummary().subscribe((summary) => {
      expect(summary.todayGroups).toBe(2);
      expect(summary.todayGroupIds).toEqual(['group-1', 'group-2']);
      expect(summary.currentRunningGroupIds).toEqual(['group-1']);
      expect(summary.postponedGroupIds).toEqual(['group-3']);
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/schedule-summary'));
    expect(request.request.method).toBe('GET');
    request.flush({
      totalGroups: 4,
      todayGroups: 2,
      currentRunningGroups: 1,
      postponedGroups: 1,
      todayGroupIds: ['group-1', 'group-2'],
      currentRunningGroupIds: ['group-1'],
      postponedGroupIds: ['group-3'],
      today: '2026-06-29',
      asOf: '2026-06-29T11:30:00+03:00',
      unavailableReason: null,
    });
  });

  it('maps schedule summary errors to a usable message', () => {
    service.loadScheduleSummary().subscribe({
      next: () => {
        throw new Error('Expected schedule summary request to fail');
      },
      error: (error: Error) => {
        expect(error.message).toBe('Summary unavailable');
      },
    });

    const request = httpTesting.expectOne((req) => req.url.endsWith('/tenant/groups/schedule-summary'));
    request.flush({ message: 'Summary unavailable' }, { status: 500, statusText: 'Server Error' });
  });
});
