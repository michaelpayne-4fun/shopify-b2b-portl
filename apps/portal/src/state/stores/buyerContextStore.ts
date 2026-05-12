import { create } from 'zustand';
import type { BuyerContext } from '@b2b/domain';

interface BuyerContextState {
  context: BuyerContext | null;
  setContext: (ctx: BuyerContext | null) => void;
}

export const useBuyerContextStore = create<BuyerContextState>((set) => ({
  context: null,
  setContext: (context) => set({ context }),
}));
