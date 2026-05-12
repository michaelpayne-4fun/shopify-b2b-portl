import type { Database } from '@b2b/db';
import type { Buyer, Company, CompanyLocation, BuyerContext } from '@b2b/domain';

export interface AuthContext {
  sessionId: string;
  buyer: Buyer;
  company: Company;
  location?: CompanyLocation;
  caaAccessToken: string;
  buyerContext: BuyerContext;
}

export type AppVariables = {
  db: Database;
  auth?: AuthContext;
};
