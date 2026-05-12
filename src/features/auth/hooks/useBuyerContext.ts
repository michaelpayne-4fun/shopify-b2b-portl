import { useBuyerContextStore } from '@/state/stores/buyerContextStore';
import type { BuyerContext } from '@/domain/models';

/**
 * Returns the active BuyerContext, or throws. Use only inside
 * <ProtectedRoute>, which guarantees the context is hydrated.
 */
export const useBuyerContext = (): BuyerContext => {
  const context = useBuyerContextStore((s) => s.context);
  if (!context) throw new Error('BuyerContext is not initialized');
  return context;
};
