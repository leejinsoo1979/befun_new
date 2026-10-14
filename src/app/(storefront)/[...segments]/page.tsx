import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { StorefrontFrame } from '@/components/storefront/StorefrontFrame';
import { CatalogPage, ProductPage, ReferenceProductPage, SearchPage } from '@/components/storefront/CatalogPages';
import { AboutPage, CollectionsPage, CommunityPage, JournalPage, MaterialsPage, ProPage, ShowroomsPage } from '@/components/storefront/EditorialPages';
import { ContactPage, CookiePage, CorporatePage, FaqPage, GiftPage, PolicyPage, RegionPage, ShippingPage } from '@/components/storefront/SupportPages';
import { products, referenceProducts } from '@/components/storefront/catalog';
import { SharedDesignPage, SavedDesignsPage } from '@/components/storefront/SavedDesignPages';
import { referenceCatalog } from '@/components/storefront/referenceCatalog';
import { SourceProductPage } from '@/components/storefront/ReferenceCatalogPages';
import { DownloadedItemPage } from '@/components/storefront/DownloadedCatalog';
import { downloadedItem, downloadedItems } from '@/lib/catalog-expansion/server';
import { downloadedCategoryFor } from '@/lib/catalog-expansion/categories';
import { localizedProductName } from '@/lib/catalog-expansion/names';
import { ConfiguratorIntro } from '@/components/storefront/ConfiguratorIntro';
import { FurnitureConfigurator } from '@/components/furniture/FurnitureConfigurator';
import { catalogFurnitureDesign } from '@/lib/furniture/catalog-design';
import { catalogCategories, infoTitles, journalArticles } from '@/components/storefront/navigation';

type Props = {params: Promise<{segments: string[]}>; searchParams: Promise<Record<string, string | string[] | undefined>>};
const policies = ['terms','terms-gift-card','privacy_policy','digital-services-act','terms/user-account-and-promo-codes'];
function titleFor(path: string) {
  if (path === 'furniture-c') return '모든 제품';
  if (path.startsWith('furniture-c/')) return catalogCategories[path.slice(12)];
  if (path.startsWith('furniture/')) return products.find(product=>product.id===path.slice(10))?.name;
  if (path.startsWith('reference-product/')) return referenceCatalog.find(product=>product.id===path.slice(18))?.name;
  if (path.startsWith('catalog-item/')) { const [, key, seq] = path.split('/'); const item = downloadedItem(key, Number(seq)); return item ? localizedProductName(item.name, 'ko') : undefined; }
  if (path.startsWith('sofa/')) return referenceProducts.find(product=>product.id===path.slice(5))?.name;
  if (path.startsWith('journal/')) return journalArticles.find(article=>article.slug===path.slice(8))?.title;
  return infoTitles[path] ?? ({gallery:'공간 갤러리','region-settings':'지역 설정',account:'계정',myshop:'내 쇼핑', 'tylko-pro/apply':'프로젝트 문의', 'configurator-intro':'가구 선택', 'design-preview':'공유된 디자인', 'saved-designs':'저장한 디자인', 'investor-relations':'투자자 정보'} as Record<string,string>)[path];
}
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const path = (await params).segments.join('/');
  return {title: `${titleFor(path) ?? '페이지를 찾을 수 없습니다'} | Befun`};
}
export default async function StorePage({params,searchParams}: Props) {
  const path = (await params).segments.join('/');
  const raw = await searchParams;
  const query: Record<string,string> = {};
  for (const [key,value] of Object.entries(raw)) if (typeof value === 'string') query[key]=value;
  if (path === 'account' || path === 'myshop') redirect('/mypage');
  if (path === 'investor-relations') redirect('/investor-relations-login');
  if (path === 'tylko-pro/apply') redirect('/contact?topic=pro');
  const title=titleFor(path);
  if (!title) notFound();
  let content;
  let overlay=false;
  if (path === 'furniture-c' || path.startsWith('furniture-c/')) { const slug = path === 'furniture-c' ? '' : path.slice(12); const category = downloadedCategoryFor(slug, query); content=<CatalogPage slug={slug} query={query} downloaded={category ? downloadedItems(category.key) : []} />; }
  else if (path === 'design-preview') content=<SharedDesignPage serialized={query.design ?? ''} />;
  else if (path === 'saved-designs') content=<SavedDesignsPage />;
  else if (path === 'configurator-intro') content=<ConfiguratorIntro />;
  else if (path.startsWith('furniture/')) content=<ProductPage product={products.find(product=>product.id===path.slice(10))!} />;
  else if (path.startsWith('reference-product/')) {
    const id = path.slice(18);
    const initial = catalogFurnitureDesign(id);
    content = initial ? <FurnitureConfigurator key={id} initial={initial} title={title} /> : <SourceProductPage id={id} />;
  }
  else if (path.startsWith('sofa/')) content=<ReferenceProductPage id={path.slice(5)} />;
  else if (path.startsWith('catalog-item/')) { const [, key, seq] = path.split('/'); content=<DownloadedItemPage item={downloadedItem(key, Number(seq))!} />; }
  else if (['search','wishlist'].includes(path)) content=<SearchPage initialQuery={query.q} wishlist={path==='wishlist'} />;
  else if (['inspirations','creators','gallery','review-list'].includes(path)) {content=<CommunityPage key={query.influencer} mode={path} influencer={query.influencer} />;overlay=path==='inspirations';}
  else if (path==='about-tylko') {content=<AboutPage />;overlay=true;}
  else if (path==='showrooms') content=<ShowroomsPage />;
  else if (path==='tylko-pro') {content=<ProPage />;overlay=true;}
  else if (path==='material-samples') content=<MaterialsPage />;
  else if (path==='product-lines') content=<CollectionsPage />;
  else if (path==='journal' || path.startsWith('journal/') || path==='collaborations/reisinger') content=<JournalPage slug={path==='collaborations/reisinger'?'reisinger':path.startsWith('journal/')?path.slice(8):undefined} />;
  else if (path==='faq') content=<FaqPage />;
  else if (path==='contact') content=<ContactPage key={query.topic} initialTopic={query.topic} />;
  else if (path==='shipping') content=<ShippingPage />;
  else if (policies.includes(path)) content=<PolicyPage path={path} />;
  else if (path==='cookie-settings') content=<CookiePage />;
  else if (path==='region-settings') content=<RegionPage />;
  else if (path==='e-gift-card/1') {content=<GiftPage />;overlay=true;}
  else if (['press','tylko-sound','investor-relations-login'].includes(path)) content=<CorporatePage path={path} />;
  else notFound();
  return <StorefrontFrame overlay={overlay}>{content}</StorefrontFrame>;
}
