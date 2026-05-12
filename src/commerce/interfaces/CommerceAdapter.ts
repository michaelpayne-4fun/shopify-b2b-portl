import type { AddressService } from './AddressService';
import type { AuthService } from './AuthService';
import type { CartService } from './CartService';
import type { CatalogService } from './CatalogService';
import type { CheckoutService } from './CheckoutService';
import type { CompanyService } from './CompanyService';
import type { CustomerService } from './CustomerService';
import type { InventoryService } from './InventoryService';
import type { OrderService } from './OrderService';
import type { PricingService } from './PricingService';
import type { QuoteService } from './QuoteService';
import type { UserRoleService } from './UserRoleService';

export interface CommerceAdapter {
  /** Stable identifier for the adapter, e.g. "mock" | "bigcommerce". */
  readonly name: string;

  readonly auth: AuthService;
  readonly customer: CustomerService;
  readonly company: CompanyService;
  readonly catalog: CatalogService;
  readonly cart: CartService;
  readonly checkout: CheckoutService;
  readonly order: OrderService;
  readonly quote: QuoteService;
  readonly address: AddressService;
  readonly role: UserRoleService;
  readonly pricing: PricingService;
  readonly inventory: InventoryService;
}
