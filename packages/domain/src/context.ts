import type { Buyer } from './buyer';
import type { Company, CompanyLocation } from './company';

export interface BuyerContext {
  buyer: Buyer;
  company: Company;
  location?: CompanyLocation;
  currency: string;
  locale: string;
}
