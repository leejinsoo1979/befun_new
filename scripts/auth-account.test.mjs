import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { installTestLoader } from './storefront-save-validation/loader.mjs';
installTestLoader({ mockServices: false });
const { persistedAccount } = await import('../src/lib/auth-account.ts');

for (const provider of ['kakao', 'google', 'naver']) {
  test(`${provider}: Prisma account linking preserves standard tokens and rejects no extra metadata`, async () => {
    let inserted;
    const adapter = PrismaAdapter({ account: { create: async ({ data }) => {
      assert.equal('refresh_token_expires_in' in data, false);
      assert.equal('custom_token_metadata' in data, false);
      inserted = data;
      return { id: 'account-test', ...data };
    } } });
    const account = {
      userId: 'user-test', type: 'oauth', provider, providerAccountId: `${provider}-test`,
      access_token: 'fake-access', refresh_token: 'fake-refresh', expires_at: 1234567,
      token_type: 'bearer', scope: 'profile', id_token: 'fake-id', session_state: 'fake-state',
      refresh_token_expires_in: 5183999, custom_token_metadata: 'provider-specific',
    };
    const result = await adapter.linkAccount(persistedAccount(account));
    assert.equal(result.id, 'account-test');
    for (const key of ['userId','type','provider','providerAccountId','access_token','refresh_token','expires_at','token_type','scope','id_token','session_state']) {
      assert.equal(inserted[key], account[key], key);
    }
    assert.equal(account.refresh_token_expires_in, 5183999, 'provider response is not mutated');
  });
}

test('optional refresh/ID tokens remain absent when provider omits them', () => {
  const data = persistedAccount({ userId:'u', type:'oauth', provider:'kakao', providerAccountId:'p' });
  assert.equal(data.refresh_token, undefined);
  assert.equal(data.id_token, undefined);
});
