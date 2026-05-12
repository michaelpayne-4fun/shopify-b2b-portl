import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCommerce } from '@/app/providers/CommerceProvider';
import { useBuyerContext } from '@/features/auth/hooks/useBuyerContext';
import type { QuoteListFilter } from '@/commerce/interfaces';
import type { QuoteDraftInput } from '@/domain/models';
import { queryKeys } from '@/state/queries/queryKeys';

export const useQuotes = (filter?: QuoteListFilter) => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  return useQuery({
    queryKey: queryKeys.quotesList(filter),
    queryFn: () => commerce.quote.list(context, filter),
  });
};

export const useQuote = (quoteId: string | undefined) => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  return useQuery({
    queryKey: queryKeys.quote(quoteId ?? ''),
    enabled: !!quoteId,
    queryFn: () => commerce.quote.get(context, quoteId!),
  });
};

export const useCreateQuoteDraft = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: QuoteDraftInput) => commerce.quote.createDraft(context, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  });
};

export const useSubmitQuote = () => {
  const commerce = useCommerce();
  const context = useBuyerContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: string) => commerce.quote.submit(context, quoteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  });
};
