import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OwnerProvisioningListComponent } from './owner-provisioning-list.component';
import { OwnerProvisioningListFacade } from '../../state/owner-provisioning-list.facade';

describe('OwnerProvisioningListComponent', () => {
  it('renders tenant migration status', () => {
    TestBed.configureTestingModule({
      imports: [OwnerProvisioningListComponent],
      providers: [
        provideRouter([]),
        {
          provide: OwnerProvisioningListFacade,
          useValue: {
            filter: signal('All'),
            filteredJobs: signal([]),
            statusOptions: signal([]),
            migrationStatuses: signal([
              {
                tenantId: 'tenant-1',
                schemaName: 'tenant_test',
                targetVersion: '3',
                currentVersion: '3',
                status: 'SUCCEEDED',
                startedAt: null,
                completedAt: null,
                errorMessage: null,
              },
            ]),
            setFilter: vi.fn(),
            refresh: vi.fn(),
            runTenantMigrations: vi.fn(),
            getStatusColor: vi.fn(() => '#64748b'),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(OwnerProvisioningListComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('tenant_test');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('SUCCEEDED');
  });
});
