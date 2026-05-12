import type { AddressService } from '@/commerce/interfaces';
import type { Address, AddressInput, BuyerContext, Page, PageRequest } from '@/domain/models';
import type { B2bClient } from '../client/b2bClient';
import type { BCCompanyAddress } from '../types/responses';
import { mapBcAddress } from '../mappers/addressMapper';

interface BCAddressListResponse {
  data: BCCompanyAddress[];
  meta: { pagination: { current_page: number; per_page: number; total: number; total_pages: number } };
}

const toBody = (input: AddressInput) => ({
  label: input.label,
  first_name: input.firstName,
  last_name: input.lastName,
  company: input.company,
  address_line_1: input.line1,
  address_line_2: input.line2,
  city: input.city,
  state: input.region,
  zip_code: input.postalCode,
  country_code: input.countryCode,
  phone_number: input.phone,
  is_default_billing: input.isDefaultBilling,
  is_default_shipping: input.isDefaultShipping,
});

export class BigCommerceAddressService implements AddressService {
  constructor(private readonly client: B2bClient) {}

  async list(_ctx: BuyerContext, pageRequest?: PageRequest): Promise<Page<Address>> {
    const params = new URLSearchParams();
    params.set('page', String(pageRequest?.page ?? 1));
    params.set('per_page', String(pageRequest?.pageSize ?? 20));
    const resp = await this.client.http.request<BCAddressListResponse>({
      url: `/v3/io/addresses?${params.toString()}`,
    });
    return {
      items: resp.data.map(mapBcAddress),
      page: resp.meta.pagination.current_page,
      pageSize: resp.meta.pagination.per_page,
      totalItems: resp.meta.pagination.total,
      totalPages: resp.meta.pagination.total_pages,
    };
  }

  async get(_ctx: BuyerContext, id: string): Promise<Address> {
    const resp = await this.client.http.request<{ data: BCCompanyAddress }>({
      url: `/v3/io/addresses/${encodeURIComponent(id)}`,
    });
    return mapBcAddress(resp.data);
  }

  async create(_ctx: BuyerContext, input: AddressInput): Promise<Address> {
    const resp = await this.client.http.request<{ data: BCCompanyAddress }>({
      url: '/v3/io/addresses',
      method: 'POST',
      body: toBody(input),
    });
    return mapBcAddress(resp.data);
  }

  async update(_ctx: BuyerContext, id: string, input: AddressInput): Promise<Address> {
    const resp = await this.client.http.request<{ data: BCCompanyAddress }>({
      url: `/v3/io/addresses/${encodeURIComponent(id)}`,
      method: 'PUT',
      body: toBody(input),
    });
    return mapBcAddress(resp.data);
  }

  async delete(_ctx: BuyerContext, id: string): Promise<void> {
    await this.client.http.request<void>({
      url: `/v3/io/addresses/${encodeURIComponent(id)}`,
      method: 'DELETE',
    });
  }
}
