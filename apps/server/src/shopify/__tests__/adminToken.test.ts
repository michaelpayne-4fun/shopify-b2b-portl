import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock env before importing adminToken so the module-level env.parse() never runs.
vi.mock('../../env.js', () => ({
  env: {
    SHOPIFY_SHOP_DOMAIN: 'test-shop.myshopify.com',
    SHOPIFY_CLIENT_ID: 'test-client-id',
    SHOPIFY_CLIENT_SECRET: 'test-client-secret',
  },
}));

const { getAdminToken, _resetTokenCache } = await import('../adminToken.js');

const TOKEN_ENDPOINT = 'https://test-shop.myshopify.com/admin/oauth/access_token';

function mockFetch(token: string, expiresIn = 86400): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: token, expires_in: expiresIn }),
    }),
  );
}

beforeEach(() => {
  _resetTokenCache();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('getAdminToken', () => {
  it('fetches a token on first call and returns it', async () => {
    mockFetch('tok-abc');
    const token = await getAdminToken();
    expect(token).toBe('tok-abc');
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(TOKEN_ENDPOINT, expect.objectContaining({ method: 'POST' }));
  });

  it('returns the cached token without a second network call', async () => {
    mockFetch('tok-abc');
    await getAdminToken();
    const second = await getAdminToken();
    expect(second).toBe('tok-abc');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('refreshes the token when fewer than 60 s remain before expiry', async () => {
    mockFetch('tok-first', 3600);
    await getAdminToken();

    // Advance time so only 59 s remain (3600 - 59 = 3541 s elapsed).
    vi.advanceTimersByTime((3600 - 59) * 1000);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'tok-refreshed', expires_in: 3600 }),
      }),
    );

    const refreshed = await getAdminToken();
    expect(refreshed).toBe('tok-refreshed');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('throws when Shopify returns a non-ok HTTP status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' }),
    );
    await expect(getAdminToken()).rejects.toThrow('401');
  });
});
