import { Routes } from '@angular/router';
import { OwnerOverviewComponent } from './owner-overview/owner-overview.component';
import { OwnerTenantsListComponent } from './owner-tenants-list/owner-tenants-list.component';
import { OwnerTenantCreatePageComponent } from './pages/owner-tenant-create/owner-tenant-create-page.component';
import { OwnerTenantDetailsComponent } from './owner-tenant-details/owner-tenant-details.component';
import { OwnerTenantEditComponent } from './owner-tenant-edit/owner-tenant-edit.component';
import { OwnerPlansListComponent } from './owner-plans-list/owner-plans-list.component';
import { OwnerPlanCreateComponent } from './owner-plan-create/owner-plan-create.component';
import { OwnerPlanDetailsComponent } from './owner-plan-details/owner-plan-details.component';
import { OwnerSubscriptionsListComponent } from './owner-subscriptions-list/owner-subscriptions-list.component';
import { OwnerSubscriptionDetailsComponent } from './owner-subscription-details/owner-subscription-details.component';
import { OwnerSubscriptionCreateComponent } from './owner-subscription-create/owner-subscription-create.component';
import { OwnerSubscriptionTemplatesListComponent } from './owner-subscription-templates-list/owner-subscription-templates-list.component';
import { OwnerSubscriptionTemplateDetailsComponent } from './owner-subscription-template-details/owner-subscription-template-details.component';
import { OwnerSubscriptionOrdersListComponent } from './owner-subscription-orders-list/owner-subscription-orders-list.component';
import { OwnerSubscriptionOrderDetailsComponent } from './owner-subscription-order-details/owner-subscription-order-details.component';
import { OwnerBillingPageComponent } from './pages/owner-billing/owner-billing-page.component';
import { OwnerInvoiceDetailsComponent } from './owner-invoice-details/owner-invoice-details.component';
import { OwnerModulesListComponent } from './owner-modules-list/owner-modules-list.component';
import { OwnerModuleDetailsComponent } from './owner-module-details/owner-module-details.component';
import { OwnerAcademicStructureDetailsComponent } from './owner-academic-structure-details/owner-academic-structure-details.component';
import { OwnerUsageAnalyticsComponent } from './owner-usage-analytics/owner-usage-analytics.component';
import { OwnerProvisioningListComponent } from './owner-provisioning-list/owner-provisioning-list.component';
import { OwnerProvisioningDetailsComponent } from './owner-provisioning-details/owner-provisioning-details.component';
import { OwnerProvisioningSettingsComponent } from './owner-provisioning-settings/owner-provisioning-settings.component';
import { OwnerIntegrationsListComponent } from './owner-integrations-list/owner-integrations-list.component';
import { OwnerIntegrationDetailsComponent } from './owner-integration-details/owner-integration-details.component';
import { OwnerMonitoringComponent } from './owner-monitoring/owner-monitoring.component';
import { OwnerUsersListComponent } from './owner-users-list/owner-users-list.component';
import { OwnerUserFormComponent } from './owner-user-form/owner-user-form.component';
import { OwnerSecurityComponent } from './owner-security/owner-security.component';
import { OwnerAuditLogsComponent } from './owner-audit-logs/owner-audit-logs.component';
import { OwnerComplianceComponent } from './owner-compliance/owner-compliance.component';
import { OwnerNotificationsListComponent } from './owner-notifications-list/owner-notifications-list.component';
import { OwnerNotificationFormComponent } from './owner-notification-form/owner-notification-form.component';
import { OwnerNotificationDetailsComponent } from './owner-notification-details/owner-notification-details.component';
import { OwnerSettingsComponent } from './owner-settings/owner-settings.component';

export const OWNER_ROUTES: Routes = [
  { path: 'overview', component: OwnerOverviewComponent },
  { path: 'tenants', component: OwnerTenantsListComponent },
  { path: 'tenants/create', component: OwnerTenantCreatePageComponent },
  { path: 'tenants/:id', component: OwnerTenantDetailsComponent },
  { path: 'tenants/:id/edit', component: OwnerTenantEditComponent },
  { path: 'plans', component: OwnerPlansListComponent },
  { path: 'plans/create', component: OwnerPlanCreateComponent },
  { path: 'plans/:id', component: OwnerPlanDetailsComponent },
  { path: 'plans/:id/edit', component: OwnerPlanCreateComponent },
  { path: 'subscriptions', component: OwnerSubscriptionsListComponent },
  {
    path: 'subscriptions/templates',
    component: OwnerSubscriptionTemplatesListComponent,
  },
  {
    path: 'subscriptions/templates/:id',
    component: OwnerSubscriptionTemplateDetailsComponent,
  },
  {
    path: 'subscriptions/templates/:id/edit',
    component: OwnerSubscriptionCreateComponent,
  },
  {
    path: 'subscriptions/orders',
    component: OwnerSubscriptionOrdersListComponent,
  },
  {
    path: 'subscriptions/orders/:id',
    component: OwnerSubscriptionOrderDetailsComponent,
  },
  { path: 'subscriptions/create', component: OwnerSubscriptionCreateComponent },
  { path: 'subscriptions/:id', component: OwnerSubscriptionDetailsComponent },
  { path: 'billing', component: OwnerBillingPageComponent },
  { path: 'billing/invoices/:id', component: OwnerInvoiceDetailsComponent },
  { path: 'modules', component: OwnerModulesListComponent },
  { path: 'modules/mod-acad', component: OwnerAcademicStructureDetailsComponent },
  { path: 'modules/:id', component: OwnerModuleDetailsComponent },
  { path: 'analytics', component: OwnerUsageAnalyticsComponent },
  { path: 'provisioning', component: OwnerProvisioningListComponent },
  {
    path: 'provisioning/settings',
    component: OwnerProvisioningSettingsComponent,
  },
  { path: 'provisioning/:id', component: OwnerProvisioningDetailsComponent },
  { path: 'integrations', component: OwnerIntegrationsListComponent },
  { path: 'integrations/:id', component: OwnerIntegrationDetailsComponent },
  { path: 'monitoring', component: OwnerMonitoringComponent },
  { path: 'users', component: OwnerUsersListComponent },
  { path: 'users/create', component: OwnerUserFormComponent },
  { path: 'users/:id', component: OwnerUserFormComponent },
  { path: 'security', component: OwnerSecurityComponent },
  { path: 'audit', component: OwnerAuditLogsComponent },
  { path: 'compliance', component: OwnerComplianceComponent },
  { path: 'notifications', component: OwnerNotificationsListComponent },
  { path: 'notifications/create', component: OwnerNotificationFormComponent },
  { path: 'notifications/:id', component: OwnerNotificationDetailsComponent },
  { path: 'settings', component: OwnerSettingsComponent },
];
