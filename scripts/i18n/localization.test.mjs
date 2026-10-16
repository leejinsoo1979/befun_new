import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import ts from 'typescript';
import { installTestLoader } from '../storefront-save-validation/loader.mjs';

installTestLoader({ mockServices: false });
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/') && specifier.endsWith('.json')) return { url: new URL(`../../src/${specifier.slice(2)}`, import.meta.url).href, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.json')) return { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')}`, shortCircuit: true };
    if (/\.(jpg|png|avif|webp)$/.test(url)) return { format: 'module', source: `export default ${JSON.stringify({ src: url })}`, shortCircuit: true };
    return next(url, context);
  },
});
const { translate, MESSAGES } = await import('../../src/lib/i18n/messages.ts');
const { supplementalPhrases } = await import('../../src/lib/i18n/supplemental.ts');
const { localizedProductName } = await import('../../src/lib/catalog-expansion/names.ts');
const { faqItems, catalogCategories, menuGroups, footerGroups } = await import('../../src/components/storefront/navigation.ts');
const { products, stories } = await import('../../src/components/storefront/catalog.ts');
const { introVariants } = await import('../../src/components/storefront/introVariants.ts');
const { referenceCatalog } = await import('../../src/components/storefront/referenceCatalog.ts');
const { termsGroups } = await import('../../src/components/storefront/legal/terms.ts');
const { localizedTermsGroups, translatedArticles } = await import('../../src/components/storefront/legal/terms-translations.ts');

const hangul = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/;
const translated = (source) => {
  for (const locale of ['en', 'ja']) {
    assert.ok(!hangul.test(translate(locale, source)), `${locale}: ${source}`);
  }
};

test('The common translation API can use configurator copy and compound finish labels', () => {
  assert.equal(translate('en', '너비'), 'Width');
  assert.equal(translate('ja', '너비'), '幅');
  assert.equal(translate('en', '캐시미어 베이지 · 프리미엄 매트'), 'Cashmere beige · Premium matte');
  assert.equal(translate('ja', '캐시미어 베이지 · 프리미엄 매트'), 'カシミアベージュ · プレミアムマット');
  assert.equal(translate('en', 'C_화이트'), 'White');
  assert.equal(translate('en', '외 2건'), '+2 more');
  assert.equal(translate('ja', '외 2건'), 'ほか2件');
  assert.equal(translate('en', '120,000원 결제하기'), 'Pay ₩120,000');
  assert.equal(translate('ja', '120,000원 결제하기'), '₩120,000を支払う');
});

test('Korean editorial copy and unknown source text are preserved', () => {
  for (const [source, expected] of Object.entries(MESSAGES.ko)) assert.equal(translate('ko', source), expected);
  for (const [source] of supplementalPhrases) assert.equal(translate('ko', source), MESSAGES.ko[source] ?? source);
  for (const locale of ['ko', 'en', 'ja']) {
    for (const source of ['custom-design-9281730', '__proto__', 'constructor']) assert.equal(translate(locale, source), source);
  }
});

test('Supplemental translations have unique keys and no Korean in foreign-language values', () => {
  const keys = new Set();
  for (const [source, en, ja] of supplementalPhrases) {
    assert.ok(!keys.has(source), `Duplicate: ${source}`);
    keys.add(source);
    assert.ok(en.trim() && ja.trim(), source);
    assert.ok(!hangul.test(en) && !hangul.test(ja), source);
  }
});

test('Navigation, home products, creator names and FAQ content have both translations', () => {
  const sources = [
    ...Object.values(catalogCategories),
    ...[...menuGroups, ...footerGroups].flatMap(group => [group.title, ...group.links.map(([title]) => title)]),
    ...products.map(product => product.name),
    ...referenceCatalog.map(product => product.name),
    ...stories.flatMap(story => [story.name, story.title, story.text]),
    ...faqItems.flatMap(item => [item.group, item.q, item.a]),
    ...Object.values(introVariants).flatMap(variants => variants.map(variant => variant.name)),
  ];
  for (const source of sources) translated(source);
  assert.equal(localizedProductName('오프화이트 미니멀 협탁', 'en'), 'Off-white minimalist bedside table');
  assert.equal(localizedProductName('오프화이트 미니멀 협탁', 'ja'), 'オフホワイトのミニマルなベッドサイドテーブル');
  assert.equal(localizedProductName('오프화이트 미니멀 협탁', 'ko'), '오프화이트 미니멀 협탁');
});

test('All 24 draft terms articles retain their clauses and numeric conditions in English and Japanese', () => {
  assert.equal(localizedTermsGroups('ko'), termsGroups);
  assert.equal(Object.keys(translatedArticles).length, 24);
  for (const locale of ['en', 'ja']) {
    const groups = localizedTermsGroups(locale);
    assert.equal(groups.length, termsGroups.length);
    for (const [groupIndex, group] of groups.entries()) {
      const original = termsGroups[groupIndex];
      assert.ok(!hangul.test(group.title + group.description));
      assert.equal(group.id, original.id);
      for (const [articleIndex, article] of group.articles.entries()) {
        const source = original.articles[articleIndex];
        assert.equal(article.id, source.id);
        assert.equal(article.clauses.length, source.clauses.length, article.id);
        assert.ok(!hangul.test(article.title), article.id);
        for (const [clauseIndex, clause] of article.clauses.entries()) {
          assert.ok(!hangul.test(clause), article.id);
          const originalNumbers = source.clauses[clauseIndex].replaceAll('제3자', 'third party').match(/\d+/g) ?? [];
          assert.deepEqual((clause.match(/\d+/g) ?? []).sort(), originalNumbers.sort(), `${locale}: ${article.id} clause ${clauseIndex + 1}`);
        }
      }
    }
  }
});

test('Updated customer screens contain no bare Korean JSX or untranslated literal t calls', () => {
  const files = [
    'storefront/Storefront', 'storefront/StorefrontFrame', 'storefront/StorefrontUI',
    'storefront/ShoppingCatalog', 'storefront/CatalogPages', 'storefront/CatalogFilters',
    'storefront/ReferenceCatalogPages', 'three/display/AssemblyTransport',
    'storefront/ConfiguratorIntro', 'storefront/ConfiguratorShell', 'storefront/EditorialPages',
    'storefront/SupportPages', 'storefront/SavedDesignPages', 'storefront/ProductConfigurator',
    'storefront/ProductDetails', 'storefront/ProductMaterialGallery', 'storefront/ProductDiscovery',
    'storefront/FurnitureProductDetails', 'storefront/pro/ProPage',
    'storefront/legal/TermsPage',
    'source-configurator/SourceConfigurator', 'bookcase/BookcaseConfigurator',
    'bookcase/BookcaseScene', 'furniture/FurnitureScene', 'storefront/ProductCardImage',
    'account/AuthShell', 'account/SocialLogin', 'ui/ConfiguratorLoading', 'ui/ShareModal',
    'ui/ARModal', 'ui/AROverlay', 'ui/ARDimensionSheet', 'ui/QuickLookSheet',
  ].map(file => `src/components/${file}.tsx`).concat([
    'src/app/login/page.tsx', 'src/app/signup/page.tsx', 'src/app/mypage/page.tsx',
    'src/app/order/page.tsx', 'src/app/order/[id]/page.tsx', 'src/app/order/[id]/pay/PayWidget.tsx',
    'src/app/order/fail/page.tsx', 'src/app/order/success/page.tsx', 'src/app/share/[code]/page.tsx',
  ]);
  let checked = 0;
  for (const file of files) {
    const source = fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    assert.equal(ast.parseDiagnostics.length, 0, `${file}: valid TSX syntax`);
    const visit = node => {
      if (ts.isJsxText(node)) assert.ok(!hangul.test(node.text), `${file}: bare JSX ${node.text.trim()}`);
      if (ts.isCallExpression(node) && node.expression.getText(ast) === 't' && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        translated(node.arguments[0].text);
        checked++;
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  assert.ok(checked > 300);
});
