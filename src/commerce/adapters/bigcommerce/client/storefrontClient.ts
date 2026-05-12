import { createHttpClient, type HttpClient } from '@/api/clients/http';
import type { BigCommerceConfig } from '../config';

export interface StorefrontClient {
  http: HttpClient;
}

export const createStorefrontClient = (config: BigCommerceConfig): StorefrontClient => ({
  http: createHttpClient({
    baseUrl: config.storefrontUrl,
    defaultHeaders: {
      accept: 'application/json',
    },
  }),
});
