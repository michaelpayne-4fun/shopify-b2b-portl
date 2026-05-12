export type CurrencyCode = string;

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export const zeroMoney = (currency: CurrencyCode): Money => ({ amount: 0, currency });

export const addMoney = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add money in different currencies: ${a.currency} + ${b.currency}`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
};

export const multiplyMoney = (m: Money, n: number): Money => ({
  amount: m.amount * n,
  currency: m.currency,
});
