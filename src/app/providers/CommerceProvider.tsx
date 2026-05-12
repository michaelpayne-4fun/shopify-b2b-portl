import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { CommerceAdapter } from '@/commerce/interfaces';
import { createCommerceAdapter } from '@/commerce/adapters/registry';

const CommerceContext = createContext<CommerceAdapter | null>(null);

export interface CommerceProviderProps {
  adapter?: CommerceAdapter;
  children: ReactNode;
}

export const CommerceProvider = ({ adapter, children }: CommerceProviderProps) => {
  const value = useMemo(() => adapter ?? createCommerceAdapter(), [adapter]);
  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
};

export const useCommerce = (): CommerceAdapter => {
  const value = useContext(CommerceContext);
  if (!value) throw new Error('useCommerce must be used inside <CommerceProvider>');
  return value;
};
