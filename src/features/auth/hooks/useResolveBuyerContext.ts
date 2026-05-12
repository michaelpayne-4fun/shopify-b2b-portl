import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { useAuthStore } from '@/state/stores/authStore';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';
import { appConfig } from '@/app/config';

/**
 * Hydrates the BuyerContext from the persisted auth session. Runs once per
 * session change; downstream code can rely on `useBuyerContextStore`.
 */
export const useResolveBuyerContext = () => {
  const commerce = useCommerce();
  const session = useAuthStore((s) => s.session);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clear);
  const context = useBuyerContextStore((s) => s.context);
  const setContext = useBuyerContextStore((s) => s.setContext);

  const query = useQuery({
    queryKey: ['buyer-context', session?.token],
    enabled: !!session && !context,
    queryFn: async () => {
      if (!session) throw new Error('No session');
      const validated = await commerce.auth.validate(session);
      const { company, activeLocationId } = await commerce.company.resolveContext(validated);
      return {
        session: validated,
        company,
        location: company.locations.find((l) => l.id === activeLocationId),
      };
    },
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setSession(query.data.session);
      setContext({
        buyer: query.data.session.buyer,
        company: query.data.company,
        location: query.data.location,
        currency: appConfig.defaultCurrency,
        locale: query.data.session.buyer.locale ?? appConfig.defaultLocale,
      });
    }
  }, [query.data, setContext, setSession]);

  useEffect(() => {
    if (query.error) {
      clearSession();
    }
  }, [query.error, clearSession]);

  return query;
};
