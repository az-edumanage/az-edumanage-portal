import { Injectable, inject } from '@angular/core';
import { OwnerUsersDataService } from '../../features/owner/data-access/owner-users-data.service';
import { OwnerTenantsDataService } from '../../features/owner/data-access/owner-tenants-data.service';
import { OwnerProvisioningDataService } from '../../features/owner/data-access/owner-provisioning-data.service';

export type RegistrationFlowType = 'standard' | 'trial';

export interface RegistrationPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
}

export interface RegistrationResult {
  userId: string;
  tenantId: string | null;
  flowType: RegistrationFlowType;
}

@Injectable({ providedIn: 'root' })
export class WebsiteRegistrationService {
  private readonly usersData = inject(OwnerUsersDataService);
  private readonly tenantsData = inject(OwnerTenantsDataService);
  private readonly provisioningData = inject(OwnerProvisioningDataService);

  async register(payload: RegistrationPayload, flowType: RegistrationFlowType): Promise<RegistrationResult> {
    this.validateUniqueness(payload);

    if (flowType === 'standard') {
      const user = this.usersData.addWebUser({
        fullName: payload.fullName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        username: payload.username,
        status: 'Active',
      });

      return {
        userId: user.id,
        tenantId: null,
        flowType,
      };
    }

    const tenantName = this.buildTrialTenantName(payload.fullName);
    const tenant = this.tenantsData.addTrialTenant({
      name: tenantName,
      fullName: payload.fullName,
      phoneNumber: payload.phoneNumber,
      ownerEmail: payload.email,
      plan: 'Trial Plan',
    });

    this.provisioningData.addProvisioningJob({
      tenantName: tenant.name,
      plan: tenant.plan,
      triggeredBy: 'System',
      status: 'Completed',
    });

    const user = this.usersData.addWebUser({
      fullName: payload.fullName,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      username: payload.username,
      tenantId: tenant.id,
      status: 'Active',
    });

    return {
      userId: user.id,
      tenantId: tenant.id,
      flowType,
    };
  }

  private validateUniqueness(payload: RegistrationPayload): void {
    if (this.usersData.emailExists(payload.email)) {
      throw new Error('Email already registered');
    }
    if (this.usersData.usernameExists(payload.username)) {
      throw new Error('Username already registered');
    }
    if (this.usersData.phoneExists(payload.phoneNumber)) {
      throw new Error('Phone number already registered');
    }
  }

  private buildTrialTenantName(fullName: string): string {
    const first = fullName.trim().split(/\s+/)[0] || 'New';
    return `${first} Trial Center`;
  }
}
