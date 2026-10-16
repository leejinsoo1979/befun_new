import { catalogPreset, type CatalogPresetId } from '@/lib/three/catalog-presets';
import { shelfQuote } from '@/lib/commerce/shelf-quote';
import type { ColorCategory } from '@/types/shelf';

export const asset = (file: string) => `/imgs/storefront/${file}`;
export const palette = [
  { name: '화이트', hex: '#fafaf5', color: 'S_Ivory' },
  { name: '샌드 베이지', hex: '#dfd3bd', color: 'S_Sand Beige' },
  { name: '그레이', hex: '#b5b6b2', color: 'S_Gray' },
  { name: '스카이 블루', hex: '#91b2ce', color: 'S_Sky Blue' },
  { name: '테라코타', hex: '#b85b38', color: 'S_Teracotta Orange' },
  { name: '미드나잇 블루', hex: '#283a57', color: 'S_Midnight Blue' },
  { name: '버건디', hex: '#692b32', color: 'S_Burgundy' },
  { name: '블랙', hex: '#232424', color: 'S_Black' },
  { name: '핑크', hex: '#e4bdce', color: 'S_Pink' },
  { name: '그린', hex: '#a9bb9b', color: 'S_Green' },
  { name: '올리브 그린', hex: '#7f8951', color: 'S_Olive Green' },
  { name: '옐로', hex: '#eee2ad', color: 'S_Yellow' },
];

export interface CatalogProduct {
  catalogPreset?: CatalogPresetId;
  id: string; name: string; collection: string; category: string;
  image: string; alternate: string; width: number; rows: number[];
  depth: number; color: string; colorCategory: ColorCategory; doors: number[];
}

const productCards: CatalogProduct[] = [
  { id: 'wall-green', name: '그린 월 수납장', collection: 'Befun Solid', category: '월 수납장', image: 'unreal_10772325_Joddr1h.webp', alternate: 'unreal_10773359_jV1o7ei.webp', width: 206, rows: [28, 28, 28, 28, 28, 28], depth: 32, color: 'S_Green', colorCategory: 'solid', doors: [0, 1] },
  { id: 'bookcase-brown', name: '월넛 도어 책장', collection: 'Befun Natural', category: '책장', image: 'unreal_10075703.webp', alternate: 'unreal_10088234.webp', width: 120, rows: [28, 28, 28, 28, 28, 28], depth: 32, color: 'N_Walnut', colorCategory: 'natural', doors: [0, 1] },
  { id: 'sideboard-brown', name: '다크 브라운 수납장', collection: 'Befun Natural', category: '수납장', image: 'unreal_10102873.webp', alternate: 'unreal_10106378.webp', width: 190, rows: [28, 38], depth: 40, color: 'N_Walnut', colorCategory: 'natural', doors: [0, 1] },
  { id: 'sideboard-terra', name: '테라코타 사이드보드', collection: 'Befun Solid', category: '수납장', image: 'unreal_1258234.webp', alternate: 'unreal_1277488.webp', width: 110, rows: [28, 28], depth: 32, color: 'S_Teracotta Orange', colorCategory: 'solid', doors: [0] },
  { id: 'bookcase-plum', name: '버건디 오픈 책장', collection: 'Befun Solid', category: '책장', image: 'unreal_10108489.webp', alternate: 'unreal_10114764_3IfegMM.webp', width: 150, rows: [28, 28, 28, 28, 28, 38, 28], depth: 32, color: 'S_Burgundy', colorCategory: 'solid', doors: [] },
  { id: 'tv-brown', name: '월넛 TV 스탠드', collection: 'Befun Natural', category: 'TV 스탠드', image: 'unreal_10104713.webp', alternate: 'unreal_10108207.webp', width: 300, rows: [18, 28], depth: 40, color: 'N_Walnut', colorCategory: 'natural', doors: [1] },
];

export const products: CatalogProduct[] = productCards.map(product => {
  const preset = catalogPreset(product.id)!;
  return { ...product, catalogPreset: product.id as CatalogPresetId, width:preset.width, rows:[...preset.rows],
    depth:preset.depth,color:preset.color,colorCategory:preset.colorCategory,
    ...(product.id==='bookcase-brown'?{name:'클레이 브라운 도어 책장',collection:'Befun Classic'}:{}),
    ...(product.id==='sideboard-brown'||product.id==='tv-brown'?{collection:'Befun Solid'}:{}),
    ...(product.id==='tv-brown'?{name:'다크 브라운 TV 스탠드'}:{}),
    ...(product.id==='wall-green'?{collection:'Befun Tone'}:{}),
    ...(product.id==='bookcase-plum'?{name:'딥 플럼 수납 책장',collection:'Befun Edge'}:{}),
  };
});
export function productHeight(product: CatalogProduct) {
  const preset=product.catalogPreset?catalogPreset(product.catalogPreset):null;
  return preset ? preset.height-(preset.baseType==='legs'?11:1) : 2+product.rows.reduce((total,row)=>total+row+2,0);
}
export function productDisplayHeight(product: CatalogProduct) {
  return (product.catalogPreset?catalogPreset(product.catalogPreset)?.height:null) ?? productHeight(product)+1;
}
export function productPrice(product: CatalogProduct) {
  const preset=product.catalogPreset?catalogPreset(product.catalogPreset):null;
  return shelfQuote(preset?.style??'grid', {
    catalogPreset:product.catalogPreset,width:product.width,height:productHeight(product),depth:product.depth,
    thickness:2,density:preset?.density??50,rowHeights:product.rows,numRows:product.rows.length,
    hasBackPanel:preset?.hasBackPanel??false,color:product.color,baseType:preset?.baseType??'standard',
  },product.colorCategory);
}

export const stories = [
  { name: '김도윤', image: 'befun/story-1.avif', title: '컬러로 완성하는 나만의 공간', text: '핑크 선반과 조형적인 오브제가 만드는 자유로운 공간. 좋아하는 것들로 채운 집을 만나보세요.' },
  { name: '이태오', image: 'befun/story-2.avif', title: '편안한 색, 균형 잡힌 일상', text: '차분한 컬러와 세심하게 고른 디테일. 일상의 물건들이 자연스럽게 어우러지는 공간입니다.' },
  { name: '박서윤', image: 'befun/story-3.avif', title: '취향과 이야기가 머무는 집', text: '오래 좋아한 물건과 새로운 발견이 함께하는 집. 수납장은 그 이야기를 담는 배경이 됩니다.' },
  { name: '최유나', image: 'befun/story-4.avif', title: '틀에 얽매이지 않는 즐거움', text: '대담한 색과 즐거운 조합으로 완성한 공간에서 다음 디자인의 아이디어를 찾아보세요.' },
  { name: '정민혁', image: 'befun/story-5.avif', title: '색과 리듬으로 채운 공간', text: '움직임이 느껴지는 소품과 선명한 색으로 공간의 분위기를 만들어 갑니다.' },
  { name: '한소율', image: 'befun/story-6.avif', title: '시간이 흐를수록 좋아지는 집', text: '빈티지와 자연스러운 색감, 오래 곁에 두고 싶은 가구가 만났습니다.' },
];

export const referenceProducts = [
  { id: 'smooth-khaki', name: 'Smooth · Khaki', category: 'two_seater', image: 'unreal_3888910.webp', alternate: 'unreal_3888911.webp', source: 'https://tylko.com/en-uk/furniture-c/two_seater', description: '2인용 소파 · 모듈 구성과 패브릭의 색감을 살펴보세요.' },
  { id: 'smooth-pink', name: 'Smooth · Powder Pink', category: 'three_seater', image: 'unreal_1596216.webp', alternate: 'unreal_3024622.webp', source: 'https://tylko.com/en-uk/furniture-c/three_seater', description: '3인용 소파 · 부드러운 핑크와 넓은 좌석의 조합입니다.' },
];
