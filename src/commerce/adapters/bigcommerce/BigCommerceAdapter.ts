import type { CommerceAdapter } from '@/commerce/interfaces';
import { bigCommerceConfig, type BigCommerceConfig } from './config';
import { createB2bClient } from './client/b2bClient';
import { createStorefrontClient } from './client/storefrontClient';
import { BigCommerceAddressService } from './services/BigCommerceAddressService';
import { BigCommerceAuthService } from './services/BigCommerceAuthService';
import { BigCommerceCartService } from './services/BigCommerceCartService';
import { BigCommerceCatalogService } from './services/BigCommerceCatalogService';
import { BigCommerceCheckoutService } from './services/BigCommerceCheckoutService';
import { BigCommerceCompanyService } from './services/BigCommerceCompanyService';
import { BigCommerceCustomerService } from './services/BigCommerceCustomerService';
import { BigCommerceInventoryService } from './services/BigCommerceInventoryService';
import { BigCommerceOrderService } from './services/BigCommerceOrderService';
import { BigCommercePricingService } from './services/BigCommercePricingService';
import { BigCommerceQuoteService } from './services/BigCommerceQuoteService';
import { BigCommerceUserRoleService } from './services/BigCommerceUserRoleService';

export const createBigCommerceAdapter = (
  configOverride?: Partial<BigCommerceConfig>,
): CommerceAdapter => {
  const config: BigCommerceConfig = { ...bigCommerceConfig, ...configOverride };
  const b2b = createB2bClient(config);
  const storefront = createStorefrontClient(config);

  return {
    name: 'bigcommerce',
    auth: new BigCommerceAuthService(b2b),
    customer: new BigCommerceCustomerService(b2b),
    company: new BigCommerceCompanyService(b2b),
    catalog: new BigCommerceCatalogService(storefront),
    cart: new BigCommerceCartService(storefront),
    checkout: new BigCommerceCheckoutService(config),
    order: new BigCommerceOrderService(b2b),
    quote: new BigCommerceQuoteService(b2b),
    address: new BigCommerceAddressService(b2b),
    role: new BigCommerceUserRoleService(b2b),
    pricing: new BigCommercePricingService(b2b),
    inventory: new BigCommerceInventoryService(storefront),
  };
};
