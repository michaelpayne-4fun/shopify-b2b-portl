import type { Money as MoneyValue } from '@/domain/models';

export interface MoneyProps {
  value: MoneyValue;
  locale?: string;
}

export const Money = ({ value, locale = 'en-US' }: MoneyProps) => (
  <>{new Intl.NumberFormat(locale, { style: 'currency', currency: value.currency }).format(value.amount)}</>
);
