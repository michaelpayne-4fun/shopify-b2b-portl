import type { CompanyService } from '@/commerce/interfaces';
import type { AuthSession, BuyerContext, Company } from '@/domain/models';
import { NotFoundError } from '@/domain/errors';
import { getStore } from '../data/store';

export class MockCompanyService implements CompanyService {
  async resolveContext(
    _session: AuthSession,
  ): Promise<{ company: Company; activeLocationId?: string }> {
    const store = getStore();
    return { company: store.company, activeLocationId: store.company.defaultLocationId };
  }

  async getCompany(): Promise<Company> {
    return getStore().company;
  }

  async switchLocation(context: BuyerContext, locationId: string): Promise<BuyerContext> {
    const store = getStore();
    const location = store.company.locations.find((l) => l.id === locationId);
    if (!location) throw new NotFoundError('CompanyLocation', locationId);
    return { ...context, location };
  }
}
