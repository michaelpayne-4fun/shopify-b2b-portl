import type { InviteUserInput, UserRoleService } from '@/commerce/interfaces';
import type { Buyer, BuyerContext, Page, PageRequest, Role } from '@/domain/models';
import { NotFoundError, ValidationError } from '@/domain/errors';
import { getStore } from '../data/store';
import { paginate } from '../data/page';

export class MockUserRoleService implements UserRoleService {
  async listUsers(_ctx: BuyerContext, pageRequest?: PageRequest): Promise<Page<Buyer>> {
    return paginate(getStore().buyers, pageRequest);
  }

  async listRoles(): Promise<Role[]> {
    return getStore().roles;
  }

  async inviteUser(_ctx: BuyerContext, input: InviteUserInput): Promise<Buyer> {
    const store = getStore();
    if (store.buyers.some((b) => b.email.toLowerCase() === input.email.toLowerCase())) {
      throw new ValidationError('A user with that email already exists');
    }
    const role = store.roles.find((r) => r.id === input.roleId);
    if (!role) throw new NotFoundError('Role', input.roleId);
    const buyer: Buyer = {
      id: `buyer-${store.buyers.length + 1}-${Date.now()}`,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role,
    };
    store.buyers.push(buyer);
    store.passwords[buyer.email] = 'password';
    return buyer;
  }

  async assignRole(_ctx: BuyerContext, userId: string, roleId: string): Promise<Buyer> {
    const store = getStore();
    const idx = store.buyers.findIndex((b) => b.id === userId);
    if (idx < 0) throw new NotFoundError('Buyer', userId);
    const role = store.roles.find((r) => r.id === roleId);
    if (!role) throw new NotFoundError('Role', roleId);
    store.buyers[idx] = { ...store.buyers[idx], role };
    return store.buyers[idx];
  }

  async removeUser(_ctx: BuyerContext, userId: string): Promise<void> {
    const store = getStore();
    const idx = store.buyers.findIndex((b) => b.id === userId);
    if (idx < 0) throw new NotFoundError('Buyer', userId);
    store.buyers.splice(idx, 1);
  }
}
