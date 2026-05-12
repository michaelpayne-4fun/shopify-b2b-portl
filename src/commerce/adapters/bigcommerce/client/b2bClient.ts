import { createHttpClient, type HttpClient } from '@/api/clients/http';
import type { BigCommerceConfig } from '../config';

export interface B2bClient {
  http: HttpClient;
  setToken(token: string | undefined): void;
}

export const createB2bClient = (config: BigCommerceConfig): B2bClient => {
  let token: string | undefined;
  const http = createHttpClient({
    baseUrl: config.b2bApiUrl,
    defaultHeaders: {
      accept: 'application/json',
      'x-store-hash': config.storeHash,
      'x-channel-id': config.channelId,
      'x-app-client-id': config.b2bAppClientId,
    },
    getAuthToken: () => token,
  });
  return {
    http,
    setToken(t) {
      token = t;
    },
  };
};
