import { Routes } from '@angular/router';
import { OwnerOverviewComponent } from './pages/owner-overview/owner-overview.component';
import { OwnerTenantsListComponent } from './pages/owner-tenants-list/owner-tenants-list.component';
import { OwnerTenantCreatePageComponent } from './pages/owner-tenant-create/owner-tenant-create-page.component';
import { OwnerTenantDetailsComponent } from './pages/owner-tenant-details/owner-tenant-details.component';
import { OwnerTenantEditComponent } from './pages/owner-tenant-edit/owner-tenant-edit.component';
import { OwnerPlansListComponent } from './pages/owner-plans-list/owner-plans-list.component';
import { OwnerPlanCreateComponent } from './pages/owner-plan-create/owner-plan-create.component';
import { OwnerPlanDetailsComponent } from './pages/owner-plan-details/owner-plan-details.component';
import { OwnerSubscriptionsListComponent } from './pages/owner-subscriptions-list/owner-subscriptions-list.component';
import { OwnerSubscriptionDetailsComponent } from './pages/owner-subscription-details/owner-subscription-details.component';
import { OwnerSubscriptionCreateComponent } from './pages/owner-subscription-create/owner-subscription-create.component';
import { OwnerSubscriptionTemplatesListComponent } from './pages/owner-subscription-templates-list/owner-subscription-templates-list.component';
import { OwnerSubscriptionTemplateDetailsComponent } from './pages/owner-subscription-template-details/owner-subscription-template-details.component';
import { OwnerSubscriptionOrdersPageComponent } from './pages/owner-subscription-orders/owner-subscription-orders-page.component';
import { OwnerSubscriptionOrderDetailsComponent } from './pages/owner-subscription-order-details/owner-subscription-order-details.component';
import { OwnerBillingPageComponent } from './pages/owner-billing/owner-billing-page.component';
import { OwnerInvoiceDetailsComponent } from './pages/owner-invoice-details/owner-invoice-details.component';
import { OwnerModulesListComponent } from './pages/owner-modules-list/owner-modules-list.component';
import { OwnerModuleCreateComponent } from './pages/owner-module-create/owner-module-create.component';
import { OwnerModuleDetailsComponent } from './pages/owner-module-details/owner-module-details.component';
import { OwnerAcademicStructureDetailsComponent } from './pages/owner-academic-structure-details/owner-academic-structure-details.component';
import { OwnerUsageAnalyticsComponent } from './pages/owner-usage-analytics/owner-usage-analytics.component';
import { OwnerProvisioningListComponent } from './pages/owner-provisioning-list/owner-provisioning-list.component';
import { OwnerProvisioningDetailsComponent } from './pages/owner-provisioning-details/owner-provisioning-details.component';
import { OwnerProvisioningSettingsComponent } from './pages/owner-provisioning-settings/owner-provisioning-settings.component';
import { OwnerIntegrationsListComponent } from './pages/owner-integrations-list/owner-integrations-list.component';
import { OwnerIntegrationDetailsComponent } from './pages/owner-integration-details/owner-integration-details.component';
import { OwnerMonitoringComponent } from './pages/owner-monitoring/owner-monitoring.component';
import { OwnerUsersListComponent } from './pages/owner-users-list/owner-users-list.component';
import { OwnerWebUsersListComponent } from './pages/owner-web-users-list/owner-web-users-list.component';
import { OwnerUserFormComponent } from './pages/owner-user-form/owner-user-form.component';
import { OwnerSecurityComponent } from './pages/owner-security/owner-security.component';
import { OwnerAuditLogsComponent } from './pages/owner-audit-logs/owner-audit-logs.component';
import { OwnerComplianceComponent } from './pages/owner-compliance/owner-compliance.component';
import { OwnerNotificationsListComponent } from './pages/owner-notifications-list/owner-notifications-list.component';
import { OwnerNotificationFormComponent } from './pages/owner-notification-form/owner-notification-form.component';
import { OwnerNotificationDetailsComponent } from './pages/owner-notification-details/owner-notification-details.component';
import { OwnerSettingsComponent } from './pages/owner-settings/owner-settings.component';
import { OwnerTestQuestionBankComponent } from './pages/owner-test-question-bank/owner-test-question-bank.component';
import { OwnerRoleCreateComponent } from './pages/owner-role-create/owner-role-create.component';
import { OwnerRolesListComponent } from './pages/owner-roles-list/owner-roles-list.component';
import { OwnerWebSettingsComponent } from './pages/owner-web-settings/owner-web-settings.component';
import { OwnerPlatformGuideComponent } from './pages/owner-platform-guide/owner-platform-guide.component';

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
    component: OwnerSubscriptionOrdersPageComponent,
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
  { path: 'modules/create', component: OwnerModuleCreateComponent },
  { path: 'modules/:id/edit', component: OwnerModuleCreateComponent },
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
  { path: 'web-users', component: OwnerWebUsersListComponent },
  { path: 'users', component: OwnerUsersListComponent },
  { path: 'users/create', component: OwnerUserFormComponent },
  { path: 'users/roles', component: OwnerRolesListComponent },
  { path: 'users/roles/create', component: OwnerRoleCreateComponent },
  { path: 'users/roles/:id/edit', component: OwnerRoleCreateComponent },
  { path: 'users/:id', component: OwnerUserFormComponent },
  { path: 'security', component: OwnerSecurityComponent },
  { path: 'audit', component: OwnerAuditLogsComponent },
  { path: 'compliance', component: OwnerComplianceComponent },
  { path: 'notifications', component: OwnerNotificationsListComponent },
  { path: 'notifications/create', component: OwnerNotificationFormComponent },
  { path: 'notifications/:id', component: OwnerNotificationDetailsComponent },
  { path: 'settings', component: OwnerSettingsComponent },
  { path: 'web-settings', component: OwnerWebSettingsComponent },
  { path: 'platform-user-guide', component: OwnerPlatformGuideComponent },
  { path: 'test', component: OwnerTestQuestionBankComponent },
];
