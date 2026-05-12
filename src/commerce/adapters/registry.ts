import type { CommerceAdapter } from '@/commerce/interfaces';
import { appConfig, type CommercePlatform } from '@/app/config';
import { createMockAdapter } from './mock';
import { createBigCommerceAdapter } from './bigcommerce';

export const createCommerceAdapter = (
  platform: CommercePlatform = appConfig.commercePlatform,
): CommerceAdapter => {
  switch (platform) {
    case 'mock':
      return createMockAdapter();
    case 'bigcommerce':
      return createBigCommerceAdapter();
    default:
      throw new Error(
        `Unknown commerce platform: "${platform}". Set VITE_COMMERCE_PLATFORM to a registered adapter (mock | bigcommerce).`,
      );
  }
};
