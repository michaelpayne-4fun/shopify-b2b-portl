import type { Money as MoneyValue } from '@b2b/domain';

export const Money = ({ value, locale = 'en-US' }: { value: MoneyValue; locale?: string }) => (
  <>{new Intl.NumberFormat(locale, { style: 'currency', currency: value.currency }).format(value.amount)}</>
);
