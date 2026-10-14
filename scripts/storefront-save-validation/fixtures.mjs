import assert from 'node:assert/strict';
import { PrismaPg as InstalledPrismaPg } from '@prisma/adapter-pg';

// Isolated route tests: no connection, SQL, or real authentication is performed.
export const state = {
  rows: new Map(), session: null, failure: null, clients: 0, adapterInputs: [], calls: [],
};
export function reset() {
  state.rows.clear();
  state.session = null;
  state.failure = null;
  state.clients = 0;
  state.adapterInputs.length = 0;
  state.calls.length = 0;
}

export class PrismaPg extends InstalledPrismaPg {
  constructor(options) {
    super(options);
    state.adapterInputs.push(options);
  }
}

export class PrismaClient {
  constructor({ adapter }) {
    assert.equal(adapter.provider, 'postgres');
    state.clients++;
    this.design = {
      create: async ({ data }) => {
        if (state.failure) throw state.failure;
        state.calls.push(['create', data]);
        const row = { ...data, id: 'fixture-design', createdAt: new Date('2026-10-14') };
        state.rows.set(row.shareCode, row);
        return row;
      },
      findUnique: async ({ where }) => {
        if (state.failure) throw state.failure;
        state.calls.push(['findUnique', where]);
        return state.rows.get(where.shareCode) ?? null;
      },
      findMany: async ({ where }) => {
        if (state.failure) throw state.failure;
        state.calls.push(['findMany', where]);
        return [...state.rows.values()].filter(row => row.userId === where.userId);
      },
    };
    this.user = { findUnique: async () => ({ id: 'fixture-user' }) };
  }
  $transaction(operations) {
    assert.ok(this instanceof PrismaClient, 'Prisma methods must keep their client receiver');
    return Promise.all(operations);
  }
  $disconnect() {
    assert.ok(this instanceof PrismaClient, 'Prisma methods must keep their client receiver');
    return Promise.resolve();
  }
}

export const authOptions = {};
export async function getServerSession() { return state.session; }
