const readEnv = (key: string, fallback = ''): string => {
  const value = import.meta.env?.[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
};

const readBool = (key: string, fallback: boolean): boolean => {
  const raw = readEnv(key);
  if (raw === '') return fallback;
  return raw === 'true' || raw === '1';
};

export type CommercePlatform = 'mock' | 'bigcommerce' | string;

export interface AppConfig {
  commercePlatform: CommercePlatform;
  apiBaseUrl: string;
  authProvider: string;
  defaultLocale: string;
  defaultCurrency: string;
  features: {
    quotes: boolean;
    approvals: boolean;
    companyManagement: boolean;
    shoppingLists: boolean;
    invoices: boolean;
  };
}

export const appConfig: AppConfig = {
  commercePlatform: readEnv('VITE_COMMERCE_PLATFORM', 'mock'),
  apiBaseUrl: readEnv('VITE_API_BASE_URL'),
  authProvider: readEnv('VITE_AUTH_PROVIDER', 'commerce'),
  defaultLocale: readEnv('VITE_DEFAULT_LOCALE', 'en-US'),
  defaultCurrency: readEnv('VITE_DEFAULT_CURRENCY', 'USD'),
  features: {
    quotes: readBool('VITE_ENABLE_QUOTES', true),
    approvals: readBool('VITE_ENABLE_APPROVALS', false),
    companyManagement: readBool('VITE_ENABLE_COMPANY_MANAGEMENT', true),
    shoppingLists: readBool('VITE_ENABLE_SHOPPING_LISTS', true),
    invoices: readBool('VITE_ENABLE_INVOICES', false),
  },
};
