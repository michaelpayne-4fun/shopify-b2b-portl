import type { InviteUserInput, UserRoleService } from '@/commerce/interfaces';
import type { Buyer, BuyerContext, Page, PageRequest, Role } from '@/domain/models';
import type { B2bClient } from '../client/b2bClient';
import type { BCAuthLoginResponse } from '../types/responses';
import { mapBcAuthSession } from '../mappers/buyerMapper';
import { mapBcPermissions } from '../mappers/permissionMapper';

interface BCUserListResponse {
  data: BCAuthLoginResponse['data']['user'][];
  meta: { pagination: { current_page: number; per_page: number; total: number; total_pages: number } };
}

interface BCRolesResponse {
  data: { id: string | number; name: string; permissions: string[]; is_admin?: boolean }[];
}

const wrapAuthShape = (
  user: BCAuthLoginResponse['data']['user'],
): BCAuthLoginResponse['data'] => ({ token: '', user });

export class BigCommerceUserRoleService implements UserRoleService {
  constructor(private readonly client: B2bClient) {}

  async listUsers(_ctx: BuyerContext, pageRequest?: PageRequest): Promise<Page<Buyer>> {
    const params = new URLSearchParams();
    params.set('page', String(pageRequest?.page ?? 1));
    params.set('per_page', String(pageRequest?.pageSize ?? 20));
    const resp = await this.client.http.request<BCUserListResponse>({
      url: `/v3/io/users?${params.toString()}`,
    });
    return {
      items: resp.data.map((u) => mapBcAuthSession(wrapAuthShape(u)).buyer),
      page: resp.meta.pagination.current_page,
      pageSize: resp.meta.pagination.per_page,
      totalItems: resp.meta.pagination.total,
      totalPages: resp.meta.pagination.total_pages,
    };
  }

  async listRoles(): Promise<Role[]> {
    const resp = await this.client.http.request<BCRolesResponse>({
      url: '/v3/io/roles',
    });
    return resp.data.map((r) => ({
      id: String(r.id),
      name: r.name,
      isAdmin: !!r.is_admin,
      permissions: mapBcPermissions(r.permissions ?? []),
    }));
  }

  async inviteUser(_ctx: BuyerContext, input: InviteUserInput): Promise<Buyer> {
    const resp = await this.client.http.request<{ data: BCAuthLoginResponse['data']['user'] }>({
      url: '/v3/io/users',
      method: 'POST',
      body: {
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        role_id: input.roleId,
      },
    });
    return mapBcAuthSession(wrapAuthShape(resp.data)).buyer;
  }

  async assignRole(_ctx: BuyerContext, userId: string, roleId: string): Promise<Buyer> {
    const resp = await this.client.http.request<{ data: BCAuthLoginResponse['data']['user'] }>({
      url: `/v3/io/users/${encodeURIComponent(userId)}`,
      method: 'PATCH',
      body: { role_id: roleId },
    });
    return mapBcAuthSession(wrapAuthShape(resp.data)).buyer;
  }

  async removeUser(_ctx: BuyerContext, userId: string): Promise<void> {
    await this.client.http.request<void>({
      url: `/v3/io/users/${encodeURIComponent(userId)}`,
      method: 'DELETE',
    });
  }
}
