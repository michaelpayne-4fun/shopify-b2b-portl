/**
 * BigCommerce adapter configuration. Read ONLY from this module; no other
 * part of the app should reference VITE_BC_* environment variables.
 */
const readEnv = (key: string, fallback = ''): string => {
  const value = import.meta.env?.[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
};

export interface BigCommerceConfig {
  b2bApiUrl: string;
  b2bAppClientId: string;
  storeHash: string;
  channelId: string;
  storefrontUrl: string;
}

export const bigCommerceConfig: BigCommerceConfig = {
  b2bApiUrl: readEnv('VITE_BC_B2B_API_URL'),
  b2bAppClientId: readEnv('VITE_BC_B2B_APP_CLIENT_ID'),
  storeHash: readEnv('VITE_BC_STORE_HASH'),
  channelId: readEnv('VITE_BC_CHANNEL_ID'),
  storefrontUrl: readEnv('VITE_BC_STOREFRONT_URL'),
};
