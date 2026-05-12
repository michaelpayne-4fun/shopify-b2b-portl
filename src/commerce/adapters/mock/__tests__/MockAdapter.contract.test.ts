import { beforeEach, describe, it } from 'vitest';
import { runAdapterContract } from '@/commerce/__tests__/adapterContract';
import { createMockAdapter, resetStore } from '../index';

describe('Mock adapter — contract', () => {
  beforeEach(() => resetStore());

  it('honors the full commerce contract', async () => {
    await runAdapterContract({
      name: 'mock',
      createAdapter: createMockAdapter,
      credentials: { email: 'admin@acme.test', password: 'password' },
      knownSku: 'BOLT-001',
    });
  });
});
