import { bff } from './bffClient';
import type { AuthMeResponse } from '@b2b/domain';

export const getAuthMe = () => bff.get<AuthMeResponse>('/auth/me');
export const beginLogin = () => bff.post<{ authorizeUrl: string }>('/auth/login');
export const completeLogin = (code: string, state: string) =>
  bff.post<{ sessionId: string }>('/auth/callback', { code, state });
export const logout = () => bff.post<void>('/auth/logout');
