import type { AuthService, LoginInput, RegisterInput } from '@/commerce/interfaces';
import type { AuthSession } from '@/domain/models';
import { ValidationError } from '@/domain/errors';
import type { B2bClient } from '../client/b2bClient';
import type { BCAuthLoginResponse } from '../types/responses';
import { mapBcAuthSession } from '../mappers/buyerMapper';

export class BigCommerceAuthService implements AuthService {
  constructor(private readonly client: B2bClient) {}

  async login(input: LoginInput): Promise<AuthSession> {
    const resp = await this.client.http.request<BCAuthLoginResponse>({
      url: '/v3/io/auth/customers/storefront',
      method: 'POST',
      body: { email: input.email, password: input.password },
    });
    const session = mapBcAuthSession(resp.data);
    this.client.setToken(session.token);
    return session;
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    const resp = await this.client.http.request<BCAuthLoginResponse>({
      url: '/v3/io/auth/customers/register',
      method: 'POST',
      body: {
        email: input.email,
        password: input.password,
        first_name: input.firstName,
        last_name: input.lastName,
        company_name: input.companyName,
      },
    });
    const session = mapBcAuthSession(resp.data);
    this.client.setToken(session.token);
    return session;
  }

  async logout(session: AuthSession): Promise<void> {
    await this.client.http.request<void>({
      url: '/v3/io/auth/logout',
      method: 'POST',
      headers: { authorization: `Bearer ${session.token}` },
    });
    this.client.setToken(undefined);
  }

  async refresh(session: AuthSession): Promise<AuthSession> {
    if (!session.refreshToken) throw new ValidationError('No refresh token available');
    const resp = await this.client.http.request<BCAuthLoginResponse>({
      url: '/v3/io/auth/refresh',
      method: 'POST',
      body: { refresh_token: session.refreshToken },
    });
    const next = mapBcAuthSession(resp.data);
    this.client.setToken(next.token);
    return next;
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.client.http.request<void>({
      url: '/v3/io/auth/password/reset-request',
      method: 'POST',
      body: { email },
    });
  }

  async validate(session: AuthSession): Promise<AuthSession> {
    this.client.setToken(session.token);
    // The adapter assumes the persisted session is valid; the next API call
    // that requires auth will fail loudly if it isn't. A more aggressive
    // adapter could call `/v3/io/auth/whoami` here.
    return session;
  }
}
