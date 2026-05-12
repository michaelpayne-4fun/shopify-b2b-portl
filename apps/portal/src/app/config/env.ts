const readEnv = (key: string, fallback = ''): string => {
  const v = import.meta.env?.[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
};
const readBool = (key: string, fallback: boolean): boolean => {
  const raw = readEnv(key);
  if (raw === '') return fallback;
  return raw === 'true' || raw === '1';
};

export const appConfig = {
  bffUrl: readEnv('VITE_BFF_URL', '/api'),
  defaultLocale: readEnv('VITE_DEFAULT_LOCALE', 'en-US'),
  defaultCurrency: readEnv('VITE_DEFAULT_CURRENCY', 'USD'),
  features: {
    quotes: readBool('VITE_ENABLE_QUOTES', true),
    approvals: readBool('VITE_ENABLE_APPROVALS', false),
    shoppingLists: readBool('VITE_ENABLE_SHOPPING_LISTS', true),
    invoices: readBool('VITE_ENABLE_INVOICES', false),
  },
};
