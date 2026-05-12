import type { CompanyService } from '@/commerce/interfaces';
import type { AuthSession, BuyerContext, Company } from '@/domain/models';
import { NotFoundError } from '@/domain/errors';
import type { B2bClient } from '../client/b2bClient';
import type { BCCompanyResponse } from '../types/responses';
import { mapBcCompany } from '../mappers/companyMapper';

export class BigCommerceCompanyService implements CompanyService {
  constructor(private readonly client: B2bClient) {}

  private async fetchCompany(): Promise<Company> {
    const resp = await this.client.http.request<BCCompanyResponse>({
      url: '/v3/io/companies/me',
    });
    return mapBcCompany(resp.data);
  }

  async resolveContext(
    _session: AuthSession,
  ): Promise<{ company: Company; activeLocationId?: string }> {
    const company = await this.fetchCompany();
    return { company, activeLocationId: company.defaultLocationId };
  }

  async getCompany(): Promise<Company> {
    return this.fetchCompany();
  }

  async switchLocation(context: BuyerContext, locationId: string): Promise<BuyerContext> {
    const location = context.company.locations.find((l) => l.id === locationId);
    if (!location) throw new NotFoundError('CompanyLocation', locationId);
    // BC routes some calls by channel; if the location carries a channel hint,
    // propagate it onto the buyer context.
    return { ...context, location, channelId: location.channelHint ?? context.channelId };
  }
}
