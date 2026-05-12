import type { CustomerService, UpdateBuyerInput } from '@/commerce/interfaces';
import type { Buyer, BuyerContext } from '@/domain/models';
import type { B2bClient } from '../client/b2bClient';
import type { BCAuthLoginResponse } from '../types/responses';
import { mapBcAuthSession } from '../mappers/buyerMapper';

export class BigCommerceCustomerService implements CustomerService {
  constructor(private readonly client: B2bClient) {}

  async getProfile(_ctx: BuyerContext): Promise<Buyer> {
    const resp = await this.client.http.request<BCAuthLoginResponse>({
      url: '/v3/io/auth/whoami',
    });
    return mapBcAuthSession(resp.data).buyer;
  }

  async updateProfile(_ctx: BuyerContext, input: UpdateBuyerInput): Promise<Buyer> {
    const resp = await this.client.http.request<BCAuthLoginResponse>({
      url: '/v3/io/customers/me',
      method: 'PATCH',
      body: {
        first_name: input.firstName,
        last_name: input.lastName,
        phone_number: input.phone,
        locale: input.locale,
      },
    });
    return mapBcAuthSession(resp.data).buyer;
  }

  async changePassword(_ctx: BuyerContext, current: string, next: string): Promise<void> {
    await this.client.http.request<void>({
      url: '/v3/io/customers/me/password',
      method: 'POST',
      body: { current_password: current, new_password: next },
    });
  }
}
