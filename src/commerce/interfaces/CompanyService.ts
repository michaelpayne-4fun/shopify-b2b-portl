import type { Company, BuyerContext, AuthSession } from '@/domain/models';

export interface CompanyService {
  /**
   * Called after login to resolve the buyer's company, locations, and the
   * active role/permissions. Returns the company plus the initial active
   * location id (if any).
   */
  resolveContext(session: AuthSession): Promise<{ company: Company; activeLocationId?: string }>;
  getCompany(context: BuyerContext): Promise<Company>;
  switchLocation(context: BuyerContext, locationId: string): Promise<BuyerContext>;
}
