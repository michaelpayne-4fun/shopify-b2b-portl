import type { CommerceAdapter } from '@/commerce/interfaces';
import { MockAddressService } from './services/MockAddressService';
import { MockAuthService } from './services/MockAuthService';
import { MockCartService } from './services/MockCartService';
import { MockCatalogService } from './services/MockCatalogService';
import { MockCheckoutService } from './services/MockCheckoutService';
import { MockCompanyService } from './services/MockCompanyService';
import { MockCustomerService } from './services/MockCustomerService';
import { MockInventoryService } from './services/MockInventoryService';
import { MockOrderService } from './services/MockOrderService';
import { MockPricingService } from './services/MockPricingService';
import { MockQuoteService } from './services/MockQuoteService';
import { MockUserRoleService } from './services/MockUserRoleService';

export class MockCommerceAdapter implements CommerceAdapter {
  readonly name = 'mock';
  readonly auth = new MockAuthService();
  readonly customer = new MockCustomerService();
  readonly company = new MockCompanyService();
  readonly catalog = new MockCatalogService();
  readonly cart = new MockCartService();
  readonly checkout = new MockCheckoutService();
  readonly order = new MockOrderService();
  readonly quote = new MockQuoteService();
  readonly address = new MockAddressService();
  readonly role = new MockUserRoleService();
  readonly pricing = new MockPricingService();
  readonly inventory = new MockInventoryService();
}

export const createMockAdapter = (): CommerceAdapter => new MockCommerceAdapter();
