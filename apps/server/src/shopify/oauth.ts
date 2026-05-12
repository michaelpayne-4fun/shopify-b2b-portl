import { createHash, randomBytes } from 'node:crypto';
import { env } from '../env';

/**
 * Shopify Customer Account API OAuth 2.0 / PKCE flow.
 *
 * Step 1: generate a state + PKCE code_verifier; persist them in the
 *         oauth_states table; return the authorize URL.
 * Step 2: user authenticates on Shopify; Shopify redirects back to our
 *         /auth/callback?code=&state=
 * Step 3: exchange the code for an access_token + refresh_token using
 *         the stored code_verifier.
 *
 * The CAA endpoints follow the OAuth 2.0 spec. The exact URLs are
 * resolved via the well-known config for the shop. For simplicity v1
 * derives them by convention:
 *   https://shopify.com/{shop_id}/account/customer/api/{ver}/...
 * In a production deployment, fetch the OIDC well-known document at
 *   https://shopify.com/{shop_id}/auth/oauth/openid-configuration
 * and cache it.
 */

const base64UrlEncode = (buf: Buffer): string =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const generatePkcePair = (): { codeVerifier: string; codeChallenge: string } => {
  const verifier = base64UrlEncode(randomBytes(32));
  const challenge = base64UrlEncode(createHash('sha256').update(verifier).digest());
  return { codeVerifier: verifier, codeChallenge: challenge };
};

export const generateState = (): string => base64UrlEncode(randomBytes(16));

const authorizeUrl = (): string =>
  `https://shopify.com/authentication/${env().SHOPIFY_SHOP_DOMAIN}/oauth/authorize`;

const tokenUrl = (): string =>
  `https://shopify.com/authentication/${env().SHOPIFY_SHOP_DOMAIN}/oauth/token`;

export interface AuthorizeUrlInput {
  state: string;
  codeChallenge: string;
  scopes?: string[];
}

export const buildAuthorizeUrl = (input: AuthorizeUrlInput): string => {
  const url = new URL(authorizeUrl());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', env().SHOPIFY_CAA_CLIENT_ID);
  url.searchParams.set('redirect_uri', env().SHOPIFY_CAA_REDIRECT_URI);
  url.searchParams.set('scope', (input.scopes ?? ['openid', 'email', 'customer-account-api:full']).join(' '));
  url.searchParams.set('state', input.state);
  url.searchParams.set('code_challenge', input.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
};

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export const exchangeCode = async (code: string, codeVerifier: string): Promise<TokenResponse> => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env().SHOPIFY_CAA_CLIENT_ID,
    redirect_uri: env().SHOPIFY_CAA_REDIRECT_URI,
    code,
    code_verifier: codeVerifier,
  });
  if (env().SHOPIFY_CAA_CLIENT_SECRET) {
    body.set('client_secret', env().SHOPIFY_CAA_CLIENT_SECRET!);
  }
  const res = await fetch(tokenUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return (await res.json()) as TokenResponse;
};

export const refreshAccessToken = async (refreshToken: string): Promise<TokenResponse> => {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: env().SHOPIFY_CAA_CLIENT_ID,
    refresh_token: refreshToken,
  });
  if (env().SHOPIFY_CAA_CLIENT_SECRET) {
    body.set('client_secret', env().SHOPIFY_CAA_CLIENT_SECRET!);
  }
  const res = await fetch(tokenUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refresh failed: ${res.status} ${text}`);
  }
  return (await res.json()) as TokenResponse;
};
