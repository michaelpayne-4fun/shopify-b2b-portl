import type { Buyer } from './buyer';
import type { Company, CompanyLocation } from './company';

export interface AuthSession {
  token: string;
  refreshToken?: string;
  expiresAt?: number;
  buyer: Buyer;
}

export interface BuyerContext {
  buyer: Buyer;
  company: Company;
  location?: CompanyLocation;
  channelId?: string;
  currency: string;
  locale: string;
}
