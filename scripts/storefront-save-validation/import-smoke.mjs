import assert from 'node:assert/strict';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { installTestLoader } from './loader.mjs';

// Separate process, actual generated client/installed adapter, no env files and no network.
delete process.env.DATABASE_URL;
const hooks = installTestLoader({ mockServices: false });
const db = await import('../../src/lib/db.ts');
assert.equal(db.isDatabaseConfigured(), false);
assert.equal(typeof PrismaAdapter(db.prisma).getUser, 'function');
assert.throws(() => db.prisma.design, { name: 'DatabaseConfigurationError' });
hooks.deregister();
console.log('PASS SAVE-01: actual DB module/generated client/auth adapter import, unconfigured access guarded');
