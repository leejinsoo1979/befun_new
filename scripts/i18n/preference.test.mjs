import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';

installTestLoader({ mockServices: false });
registerHooks({
  resolve(specifier, context, next) {
    return specifier === 'next/headers' ? { url: 'befun-test:headers', shortCircuit: true } : next(specifier, context);
  },
  load(url, context, next) {
    if (url === 'befun-test:headers') return {
      format: 'module', shortCircuit: true,
      source: `export async function cookies() { return { get: () => ({ value: globalThis.testRegionCookie }) }; }
        export async function headers() { throw new Error('Browser language must not select the region'); }`,
    };
    return next(url, context);
  },
});

const { currentRegion } = await import('../../src/lib/i18n/server.ts');
const { REGION_STORAGE_KEY, resolveRegionPreference, regionCookieValue, readRegionPreference,
  persistRegionPreference, selectRegion, subscribeRegionPreference } = await import('../../src/lib/i18n/preference.ts');

const browser = new EventTarget();
let saved = new Map();
let cookie = '';
let blocked = false;
const storage = {
  getItem: key => { if (blocked) throw new Error('Blocked'); return saved.get(key) ?? null; },
  setItem: (key, value) => { if (blocked) throw new Error('Blocked'); saved.set(key, value); },
};
Object.assign(browser, { localStorage: storage });
globalThis.window = browser;
globalThis.document = { documentElement: { lang: '' }, get cookie() { return cookie; }, set cookie(value) { cookie = value; } };
const storageEvent = (key, newValue) => browser.dispatchEvent(Object.assign(new Event('storage'), { key, newValue }));
const unsubscribe = subscribeRegionPreference(() => {});
beforeEach(() => {
  saved = new Map(); cookie = ''; blocked = false; globalThis.testRegionCookie = undefined;
  storageEvent(null, null);
});
test.after(() => { unsubscribe(); delete globalThis.window; delete globalThis.document; delete globalThis.testRegionCookie; });

test('A fresh visit starts in Korean without consulting browser/VPN language', async () => {
  assert.equal((await currentRegion()).id, 'kr');
  assert.equal(readRegionPreference(), 'kr');
});

test('Every explicit region survives SSR and wins over automatic hints', async () => {
  for (const id of ['kr', 'us', 'jp', 'eu']) {
    globalThis.testRegionCookie = id;
    assert.equal((await currentRegion()).id, id);
    assert.equal(resolveRegionPreference(id, 'jp'), id);
  }
  globalThis.testRegionCookie = '__proto__';
  assert.equal((await currentRegion()).id, 'kr');
  assert.equal(resolveRegionPreference('invalid', 'us'), 'us');
});

test('An origin preference restores Korean when another localhost port wrote a Japanese cookie', () => {
  saved.set(REGION_STORAGE_KEY, 'kr');
  cookie = 'unrelated=1; befun_region=jp';
  const region = readRegionPreference();
  assert.equal(region, 'kr');
  persistRegionPreference(region);
  assert.equal(regionCookieValue(cookie), 'kr');
  assert.equal(document.documentElement.lang, 'ko');
});

test('A selection stores both SSR and browser preferences and notifies the active page', () => {
  let changes = 0;
  const stop = subscribeRegionPreference(() => { changes++; });
  selectRegion('jp');
  assert.equal(changes, 1);
  assert.equal(saved.get(REGION_STORAGE_KEY), 'jp');
  assert.equal(regionCookieValue(cookie), 'jp');
  assert.equal(document.documentElement.lang, 'ja');
  assert.equal(readRegionPreference(), 'jp');
  selectRegion('invalid');
  assert.equal(changes, 1);
  assert.equal(readRegionPreference(), 'jp');
  stop();
});

test('Selection from another tab is applied; unrelated storage events cannot switch language', () => {
  selectRegion('kr');
  saved.set(REGION_STORAGE_KEY, 'us');
  storageEvent(REGION_STORAGE_KEY, 'us');
  assert.equal(readRegionPreference(), 'us');
  storageEvent('some-other-setting', 'jp');
  assert.equal(readRegionPreference(), 'us');
});

test('Blocked browser storage does not discard a new selection or throw', () => {
  saved.set(REGION_STORAGE_KEY, 'kr');
  blocked = true;
  assert.doesNotThrow(() => selectRegion('eu'));
  assert.equal(readRegionPreference(), 'eu');
  assert.equal(regionCookieValue(cookie), 'eu');
});

test('Existing valid cookies migrate into browser storage without interpreting other cookies', () => {
  cookie = 'other_befun_region=jp; befun_region=us; session=untouched';
  assert.equal(readRegionPreference(), 'us');
  persistRegionPreference(readRegionPreference());
  assert.equal(saved.get(REGION_STORAGE_KEY), 'us');
  assert.equal(regionCookieValue('befun_region=invalid'), 'invalid');
  assert.equal(resolveRegionPreference(null, 'invalid'), 'kr');
});
