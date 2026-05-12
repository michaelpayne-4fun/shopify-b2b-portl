import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env';

export interface SessionClaims {
  sid: string; // sessions.id
  iat: number;
  exp: number;
}

const SESSION_COOKIE = 'b2b_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

const secret = (): Uint8Array => new TextEncoder().encode(env().SESSION_SIGNING_KEY);

export const issueSessionCookie = async (sessionId: string): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(secret());
  const expires = new Date((now + SESSION_TTL_SECONDS) * 1000).toUTCString();
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`;
};

export const clearSessionCookie = (): string =>
  `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export const readSessionCookie = (cookieHeader: string | null | undefined): string | undefined => {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return undefined;
  return match.slice(SESSION_COOKIE.length + 1);
};

export const verifySessionToken = async (token: string): Promise<SessionClaims | null> => {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sid !== 'string') return null;
    return payload as unknown as SessionClaims;
  } catch {
    return null;
  }
};

export const SESSION_TTL = SESSION_TTL_SECONDS;
