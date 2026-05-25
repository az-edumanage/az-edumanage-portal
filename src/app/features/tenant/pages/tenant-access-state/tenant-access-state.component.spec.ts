import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { TenantAccessStateComponent } from './tenant-access-state.component';
import { TenantAccessContextService } from '../../data-access/tenant-access-context.service';

describe('TenantAccessStateComponent', () => {
  async function createComponent(
      status: 'pending' | 'suspended' | 'disabled' | 'blocked',
      reason: string | null = null,
  ): Promise<ComponentFixture<TenantAccessStateComponent>> {
    const accessContextService = {
      context: signal({
        tenantId: 'tenant-1',
        subscriptionState: status === 'pending' ? 'pending_payment' : 'production',
        tenantOperationalStatus: status,
        ownerDisplayStatus: status,
        accessMessage: null,
        operationalStatusReason: reason,
      }),
    };

    await TestBed.configureTestingModule({
      imports: [TenantAccessStateComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { status } } },
        },
        { provide: TenantAccessContextService, useValue: accessContextService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TenantAccessStateComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the pending payment message', async () => {
    const fixture = await createComponent('pending', 'Waiting for first settlement');

    expect(fixture.nativeElement.textContent).toContain('waiting for activation');
    expect(fixture.nativeElement.textContent).toContain('Waiting for first settlement');
  });

  it('renders the suspended billing message', async () => {
    const fixture = await createComponent('suspended');

    expect(fixture.nativeElement.textContent).toContain('workspace is suspended');
    expect(fixture.nativeElement.textContent).toContain('Billing is overdue');
  });

  it('renders the disabled message', async () => {
    const fixture = await createComponent('disabled');

    expect(fixture.nativeElement.textContent).toContain('has been disabled');
    expect(fixture.nativeElement.textContent).toContain('administrator');
  });

  it('renders the blocked message', async () => {
    const fixture = await createComponent('blocked');

    expect(fixture.nativeElement.textContent).toContain('workspace is blocked');
    expect(fixture.nativeElement.textContent).toContain('security or policy');
  });
});
