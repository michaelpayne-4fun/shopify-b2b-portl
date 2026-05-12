import type { AuthSession, Buyer, Role } from '@/domain/models';
import type { BCAuthLoginResponse } from '../types/responses';
import { mapBcPermissions } from './permissionMapper';

const toRole = (raw: BCAuthLoginResponse['data']['user']['role']): Role => ({
  id: String(raw.id),
  name: raw.name,
  isAdmin: !!raw.is_admin,
  permissions: mapBcPermissions(raw.permissions ?? []),
});

const toBuyer = (raw: BCAuthLoginResponse['data']['user']): Buyer => ({
  id: String(raw.id),
  email: raw.email,
  firstName: raw.first_name,
  lastName: raw.last_name,
  role: toRole(raw.role),
  locale: raw.locale,
  phone: raw.phone_number,
});

export const mapBcAuthSession = (raw: BCAuthLoginResponse['data']): AuthSession => ({
  token: raw.token,
  refreshToken: raw.refresh_token,
  expiresAt: raw.expires_at,
  buyer: toBuyer(raw.user),
});
