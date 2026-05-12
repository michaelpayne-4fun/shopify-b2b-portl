import type { AuthService, LoginInput, RegisterInput } from '@/commerce/interfaces';
import type { AuthSession, Buyer } from '@/domain/models';
import { ValidationError } from '@/domain/errors';
import { getStore } from '../data/store';

const issueToken = (buyer: Buyer): string =>
  // Deterministic, opaque-looking token. The mock backend doesn't validate it.
  `mock.${buyer.id}.${Math.random().toString(36).slice(2, 10)}`;

export class MockAuthService implements AuthService {
  async login(input: LoginInput): Promise<AuthSession> {
    const store = getStore();
    const buyer = store.buyers.find((b) => b.email.toLowerCase() === input.email.toLowerCase());
    if (!buyer || store.passwords[buyer.email] !== input.password) {
      throw new ValidationError('Invalid email or password');
    }
    return { token: issueToken(buyer), buyer };
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    const store = getStore();
    if (store.buyers.some((b) => b.email.toLowerCase() === input.email.toLowerCase())) {
      throw new ValidationError('An account with that email already exists');
    }
    const buyer: Buyer = {
      id: `buyer-${store.buyers.length + 1}`,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: store.roles.find((r) => r.id === 'role-buyer')!,
    };
    store.buyers.push(buyer);
    store.passwords[buyer.email] = input.password;
    return { token: issueToken(buyer), buyer };
  }

  async logout(): Promise<void> {
    // No-op for the mock adapter.
  }

  async refresh(session: AuthSession): Promise<AuthSession> {
    return { ...session, token: issueToken(session.buyer) };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const store = getStore();
    if (!store.buyers.some((b) => b.email.toLowerCase() === email.toLowerCase())) {
      // Don't leak account existence.
      return;
    }
  }

  async validate(session: AuthSession): Promise<AuthSession> {
    const store = getStore();
    const buyer = store.buyers.find((b) => b.id === session.buyer.id);
    if (!buyer) throw new ValidationError('Session is invalid');
    return { ...session, buyer };
  }
}
