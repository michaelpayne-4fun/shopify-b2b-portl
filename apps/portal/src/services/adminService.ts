import { bff } from './bffClient';
import type { AuditEntry, CompanySettings, FeatureFlags, Page, Permission } from '@b2b/domain';

export const getFeatures = () => bff.get<FeatureFlags>('/admin/features');

export interface AdminOverview {
  draftQuotes: number;
  activeLists: number;
  usersCount: number;
  pendingApprovals: number;
}
export const getAdminOverview = () => bff.get<AdminOverview>('/admin/overview');

export const getCompanySettings = () => bff.get<CompanySettings>('/admin/company-settings');
export const updateCompanySettings = (patch: Partial<CompanySettings>) =>
  bff.patch<CompanySettings>('/admin/company-settings', patch);

export interface RoleGrantRow { userId: string; grants: Permission[] }
export const listRoleGrants = () => bff.get<RoleGrantRow[]>('/admin/role-grants');
export const setRoleGrants = (userId: string, grants: Permission[]) =>
  bff.put<RoleGrantRow>(`/admin/role-grants/${encodeURIComponent(userId)}`, { grants });

export const listAuditLog = () => bff.get<Page<AuditEntry>>('/admin/audit-log');
