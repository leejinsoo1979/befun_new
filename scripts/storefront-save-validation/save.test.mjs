import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { state, reset } from './fixtures.mjs';
import { installTestLoader } from './loader.mjs';

const originalUrl = process.env.DATABASE_URL;
delete process.env.DATABASE_URL;
const hooks = installTestLoader();
const db = await import('../../src/lib/db.ts');
const routes = await import('../../src/app/api/designs/route.ts');
const share = await import('../../src/app/api/designs/[code]/route.ts');
let fixtureNumber = 0;

beforeEach(() => { reset(); delete process.env.DATABASE_URL; });
after(() => {
  if (originalUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalUrl;
  hooks.deregister();
});
function configured() {
  // Test process only. The fixture client never connects to this synthetic URL.
  process.env.DATABASE_URL = `postgresql://fixture@invalid.local/case${++fixtureNumber}`;
}
const config = {
  style: 'grid', density: 50, width: 90, height: 122, depth: 32,
  hasBackPanel: true, color: 'S_Midnight Blue', colorCategory: 'solid',
  rowHeights: [28, 28, 28, 28], numRows: 4,
  doorsCreatedLayers: [], drawersCreatedLayers: [], hardwareRowStyles: {},
};
const request = (body) => new Request('http://localhost/api/designs', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
});
const fetchCode = (code) => share.GET(new Request(`http://localhost/api/designs/${code}`), {
  params: Promise.resolve({ code }),
});

test('DB/route imports and the real auth adapter are safe without DATABASE_URL', () => {
  assert.equal(db.isDatabaseConfigured(), false);
  assert.equal(state.clients, 0);
  assert.equal(typeof PrismaAdapter(db.prisma).getUser, 'function');
  assert.throws(() => db.prisma.design, { name: 'DatabaseConfigurationError' });
  assert.equal(state.clients, 0);
});

for (const env of [undefined, '', '   ']) {
  test(`missing/blank environment returns 503 without constructing a client (${String(env)})`, async () => {
    if (env !== undefined) process.env.DATABASE_URL = env;
    const post = await routes.POST(request(JSON.stringify({ config })));
    assert.equal(post.status, 503);
    assert.deepEqual(await post.json(), {
      error: '디자인 저장 서비스를 사용할 수 없습니다', code: 'DESIGN_STORAGE_UNAVAILABLE',
    });
    const get = await fetchCode('missing1');
    assert.equal(get.status, 503);
    assert.equal((await get.json()).code, 'DESIGN_STORAGE_UNAVAILABLE');
    assert.equal(state.clients, 0);
    assert.deepEqual(state.calls, []);
  });
}

for (const body of ['{', '{}', 'null', '[]', '"invalid"', '{"config":null}', '{"config":"invalid"}', '{"config":[]}', '{"config":true}', '{"config":1}']) {
  test(`bad input remains 400 even with an unconfigured database (${body})`, async () => {
    const response = await routes.POST(request(body));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'INVALID_DESIGN');
    assert.equal(state.clients, 0);
  });
}

test('anonymous list remains 401 while authenticated unconfigured list is 503', async () => {
  const anonymous = await routes.GET();
  assert.equal(anonymous.status, 401);
  assert.equal((await anonymous.json()).code, 'AUTH_REQUIRED');
  state.session = { user: { id: 'fixture-user' } };
  const response = await routes.GET();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'DESIGN_STORAGE_UNAVAILABLE');
  assert.equal(state.clients, 0);
});

test('installed adapter receives PoolConfig and existing Prisma methods stay bound/cached', async () => {
  configured();
  const url = process.env.DATABASE_URL;
  assert.deepEqual(await db.prisma.$transaction([Promise.resolve('first')]), ['first']);
  await db.prisma.$disconnect();
  assert.equal(state.clients, 1);
  assert.deepEqual(state.adapterInputs, [{ connectionString: url }]);
  assert.equal((await PrismaAdapter(db.prisma).getUser('fixture-user')).id, 'fixture-user');
  delete process.env.DATABASE_URL;
  assert.throws(() => db.prisma.design, { name: 'DatabaseConfigurationError' });
});

test('the old HMR singleton is not reused for the fixed PoolConfig adapter', async () => {
  configured();
  const prior = globalThis.prisma;
  globalThis.prisma = { $transaction() { throw new Error('obsolete adapter client'); } };
  try {
    assert.deepEqual(await db.prisma.$transaction([Promise.resolve('new client')]), ['new client']);
    assert.equal(state.clients, 1);
    assert.deepEqual(state.adapterInputs, [{ connectionString: process.env.DATABASE_URL }]);
  } finally {
    if (prior === undefined) delete globalThis.prisma;
    else globalThis.prisma = prior;
  }
});

test('anonymous create returns the same success contract and JSON survives shared fetch', async () => {
  configured();
  const payload = { ...config, extra: { fixture: true } };
  const response = await routes.POST(request(JSON.stringify({ config: payload })));
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.deepEqual(Object.keys(saved).sort(), ['id', 'shareCode']);
  assert.equal(saved.shareCode.length, 8);
  assert.equal(state.calls[0][1].userId, null);
  const fetched = await fetchCode(saved.shareCode);
  assert.equal(fetched.status, 200);
  assert.deepEqual((await fetched.json()).config, payload);
});

test('authenticated create/list preserves user ownership filtering and thumbnail', async () => {
  configured();
  state.session = { user: { id: 'fixture-user' } };
  await routes.POST(request(JSON.stringify({ config, thumbnailUrl: '/fixture.webp' })));
  assert.equal(state.calls[0][1].userId, 'fixture-user');
  assert.equal(state.calls[0][1].thumbnailUrl, '/fixture.webp');
  const response = await routes.GET();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).length, 1);
  assert.deepEqual(state.calls.at(-1), ['findMany', { userId: 'fixture-user' }]);
});

test('configured missing shared code remains 404', async () => {
  configured();
  const response = await fetchCode('missing1');
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: '디자인을 찾을 수 없습니다', code: 'DESIGN_NOT_FOUND' });
});

test('DB failures remain 500 and neither logs nor responses disclose driver messages', async (t) => {
  configured();
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args));
  const sensitiveMessage = 'postgresql://fixture:private-password@invalid.local/db';
  state.failure = Object.assign(new Error(sensitiveMessage), { code: 'P1001' });
  state.session = { user: { id: 'fixture-user' } };
  for (const response of [
    await routes.POST(request(JSON.stringify({ config }))), await routes.GET(), await fetchCode('missing1'),
  ]) {
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.code, 'DESIGN_STORAGE_FAILED');
    assert.ok(!JSON.stringify(body).includes(sensitiveMessage));
  }
  assert.equal(logs.length, 3);
  assert.ok(!JSON.stringify(logs).includes(sensitiveMessage));
  assert.ok(logs.every(([, details]) => details.name === 'Error' && details.code === 'P1001'));
});
