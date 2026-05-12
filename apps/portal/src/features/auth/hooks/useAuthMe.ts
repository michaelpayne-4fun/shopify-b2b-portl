import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getAuthMe } from '@/services/authService';
import { BffError } from '@/services/bffClient';
import { appConfig } from '@/app/config/env';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';
import { queryKeys } from '@/state/queries/queryKeys';

/**
 * Single source of truth for "am I signed in?" Calls GET /auth/me and
 * parks the result in the buyerContext store. Components consult the
 * store; routing consults this hook.
 */
export const useAuthMe = () => {
  const setContext = useBuyerContextStore((s) => s.setContext);

  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: getAuthMe,
    retry: (count, err) => {
      if (err instanceof BffError && err.status === 401) return false;
      return count < 1;
    },
  });

  useEffect(() => {
    if (query.data) {
      setContext({
        buyer: query.data.buyer,
        company: query.data.company,
        location: query.data.company.locations.find((l) => l.id === query.data.activeLocationId),
        currency: appConfig.defaultCurrency,
        locale: query.data.buyer.locale ?? appConfig.defaultLocale,
      });
    }
  }, [query.data, setContext]);

  const unauthenticated = query.error instanceof BffError && query.error.status === 401;

  return { ...query, unauthenticated };
};
