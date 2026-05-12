import type { Role } from './role';

export interface Buyer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  locale?: string;
  phone?: string;
}
