import type { Permission } from './permission';

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  isAdmin: boolean;
}
