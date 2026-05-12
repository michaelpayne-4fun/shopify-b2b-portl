import { create } from 'zustand';
import type { BuyerContext, CompanyLocation } from '@/domain/models';

interface BuyerContextState {
  context: BuyerContext | null;
  setContext: (context: BuyerContext | null) => void;
  setLocation: (location: CompanyLocation | undefined) => void;
}

export const useBuyerContextStore = create<BuyerContextState>()((set) => ({
  context: null,
  setContext: (context) => set({ context }),
  setLocation: (location) =>
    set((state) => (state.context ? { context: { ...state.context, location } } : state)),
}));
