import type { Buyer, BuyerContext, Page, PageRequest, Role } from '@/domain/models';

export interface InviteUserInput {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

export interface UserRoleService {
  listUsers(context: BuyerContext, pageRequest?: PageRequest): Promise<Page<Buyer>>;
  listRoles(context: BuyerContext): Promise<Role[]>;
  inviteUser(context: BuyerContext, input: InviteUserInput): Promise<Buyer>;
  assignRole(context: BuyerContext, userId: string, roleId: string): Promise<Buyer>;
  removeUser(context: BuyerContext, userId: string): Promise<void>;
}
