import { useMutation } from '@tanstack/react-query';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { useAuthStore } from '@/state/stores/authStore';
import { useBuyerContextStore } from '@/state/stores/buyerContextStore';
import type { LoginInput } from '@/commerce/interfaces';
import { appConfig } from '@/app/config';

export const useLogin = () => {
  const commerce = useCommerce();
  const setSession = useAuthStore((s) => s.setSession);
  const setContext = useBuyerContextStore((s) => s.setContext);

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const session = await commerce.auth.login(input);
      const { company, activeLocationId } = await commerce.company.resolveContext(session);
      setSession(session);
      setContext({
        buyer: session.buyer,
        company,
        location: company.locations.find((l) => l.id === activeLocationId),
        currency: appConfig.defaultCurrency,
        locale: session.buyer.locale ?? appConfig.defaultLocale,
      });
      return session;
    },
  });
};
