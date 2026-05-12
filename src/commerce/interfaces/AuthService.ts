import type { AuthSession } from '@/domain/models';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
}

export interface AuthService {
  login(input: LoginInput): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  logout(session: AuthSession): Promise<void>;
  refresh(session: AuthSession): Promise<AuthSession>;
  requestPasswordReset(email: string): Promise<void>;
  /**
   * Hook for adapters that need to verify a persisted session (e.g. token
   * still valid). Should return the validated session or throw.
   */
  validate(session: AuthSession): Promise<AuthSession>;
}
