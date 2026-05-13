import { env } from '../env.js';

interface TokenState {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let cached: TokenState | null = null;

export async function getAdminToken(): Promise<string> {
  const now = Date.now();
  if (cached !== null && cached.expiresAt - now > 60_000) {
    return cached.accessToken;
  }

  const url = `https://${env.SHOPIFY_SHOP_DOMAIN}/admin/oauth/access_token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.SHOPIFY_CLIENT_ID,
    client_secret: env.SHOPIFY_CLIENT_SECRET,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(
      `Shopify admin token request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };

  cached = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cached.accessToken;
}

/** Exposed for tests only — resets the in-memory cache. */
export function _resetTokenCache(): void {
  cached = null;
}
