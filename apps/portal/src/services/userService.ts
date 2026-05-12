import { bff } from './bffClient';
import type { Buyer, InviteUserInput, Page, Role } from '@b2b/domain';

export const listUsers = () => bff.get<Page<Buyer>>('/users');
export const listRoles = () => bff.get<Role[]>('/roles');
export const inviteUser = (input: InviteUserInput) => bff.post<Buyer>('/users', input);
export const assignRole = (userId: string, roleId: string) =>
  bff.patch<void>(`/users/${encodeURIComponent(userId)}`, { roleId });
export const removeUser = (userId: string) =>
  bff.delete<void>(`/users/${encodeURIComponent(userId)}`);
