// Public category cards observed on Tylko, 2026-10-13. These are reference
// products, never Befun SKUs or purchasable configurations. Observed desk/wardrobe
// starts are editable through catalog-design.ts; editing does not add a SKU.
type Sample = [name: string, href: string, image: string];
const render = (date: string, file: string) => `${date}/unreal_render_tasks/${file}.webp`;
const categories: Record<string, Sample[]> = {
  desk: [
    ['클레이 브라운 합판 책상', 'furniture/desk/9281707,j', '/imgs/storefront/desk-1.webp'],
    ['샌드·블루 책상', 'furniture/desk/3716771,j', '/imgs/storefront/desk-2.webp'],
    ['블랙 책상', 'furniture/desk/3760531,j', '/imgs/storefront/desk-3.webp'],
  ],
  dressing_table: [
    ['클레이 브라운 합판 화장대', 'furniture/dressing_table/9272016,j', render('2026/09', 'unreal_10078370')],
    ['샌드·블루 서랍 화장대', 'furniture/dressing_table/7389388,j', render('2025/04', 'unreal_1430495_P39TqkQ')],
    ['블랙 서랍 화장대', 'furniture/dressing_table/7389011,j', render('2025/04', 'unreal_1429740_gMT3sPq')],
  ],
  shoerack: [
    ['클레이 브라운 합판 신발장', 'furniture/shoe-rack/9272074,j', render('2026/09', 'unreal_10078821')],
    ['화이트 오크 도어 신발장', 'furniture/shoe-rack/5958954,j', render('2025/06', 'unreal_1374038_PLRFrFx')],
    ['다크 브라운 도어·서랍 신발장', 'furniture/shoe-rack/9285778,j', render('2026/09', 'unreal_10104662')],
  ],
  bedside_table: [
    ['다크 브라운 침대 옆 수납장', 'furniture/bedside-table/9282694,j', render('2026/09', 'unreal_10101532')],
    ['버터 옐로 서랍 협탁', 'furniture/bedside-table/1650567,w', render('2026/04', 'unreal_6817151')],
    ['그린 서랍 협탁', 'furniture/bedside-table/1614567,w', render('2026/03', 'unreal_6464381')],
  ],
  'chest-of-drawers': [
    ['클레이 브라운 합판 서랍장', 'furniture/chest-of-drawers/9270906,j', render('2026/09', 'unreal_10077014')],
    ['그린 서랍장', 'furniture/chest-of-drawers/657286,w', render('2024/11', 'unreal_294231_TTgNlIU')],
    ['블랙 서랍장', 'furniture/chest-of-drawers/520218,w', render('2025/12', 'unreal_4463058')],
  ],
  vinyl_storage: [
    ['그레이 레코드 수납장', 'furniture/vinyl-storage/905398,j', render('2024/02', 'unreal_309')],
    ['핑크 도어 레코드 수납장', 'furniture/vinyl-storage/3850982,j', render('2024/02', 'unreal_22540')],
    ['블루 도어 레코드 수납장', 'furniture/vinyl-storage/4956297,j', render('2024/02', 'unreal_7106')],
  ],
  wardrobe: [
    ['Edge 딥 플럼 오픈·내부 서랍 옷장', 'furniture/wardrobe/1936508,w', render('2026/09', 'unreal_10112606')],
    ['Tone 베이지·핑크 내부 서랍 옷장', 'furniture/wardrobe/92332,w', render('2026/02', 'unreal_5947061')],
    ['Tone 그래파이트 외부 서랍 옷장', 'furniture/wardrobe/92275,w', render('2025/09', 'unreal_2431862')],
  ],
  wallunits: [
    ['딥 플럼 서랍 월 유닛', 'furniture/wallunit/1932352,w', render('2026/09', 'unreal_10108421')],
    ['버터 옐로 월 유닛', 'furniture/wallunit/1651970,w', render('2026/05', 'unreal_6820121_LI7q6kL')],
    ['오프화이트 월 유닛', 'furniture/wallunit/1964584,w', render('2026/10', 'unreal_10772155_XPGYgSt')],
  ],
  four_plus_seater: [
    ['카키 울 대형 소파', 'sofa/four_plus_seater/113631,s', render('2025/11', 'unreal_3889308')],
    ['다크 브라운 울 대형 소파', 'sofa/four_plus_seater/113540,s', render('2025/11', 'unreal_3889126')],
  ],
  chaise_longues: [
    ['라일락 블루 울 셰즈 롱', 'sofa/chaise_longue/273317,s', render('2026/06', 'unreal_8246989')],
    ['다크 브라운 울 셰즈 롱', 'sofa/chaise_longue/273311,s', render('2026/06', 'unreal_8246977')],
  ],
  corner_sofas: [
    ['그린 울 코너 소파', 'sofa/corner_sofa/1670,s', render('2025/05', 'unreal_1598735')],
    ['윌로 그린 가죽 코너 소파', 'sofa/corner_sofa/61622,s', render('2025/09', 'unreal_2607200_C9KJ5IF')],
  ],
  armchairs: [
    ['그린 울 암체어', 'sofa/armchair/403,s', render('2025/05', 'unreal_1596971')],
    ['코냑 가죽 암체어', 'sofa/armchair/61143,s', render('2025/09', 'unreal_2607679_hJGXUWA')],
  ],
  ottomans_and_modules: [
    ['윌로 그린 가죽 오토만 셰즈 롱', 'sofa/modules-ottomans/149705,s', render('2025/12', 'unreal_4607774')],
    ['라일락 블루 울 오토만', 'sofa/modules-ottomans/149862,s', render('2025/12', 'unreal_4607617')],
  ],
  covers: [
    ['라일락 블루 울 오토만 커버', 'sofa/cover/12160,s', '2025/07/gallery/sellable_item_abstract/2025/07/preview_nT6qqBA_thumbnail.webp'],
    ['페일 옐로 울 오토만 커버', 'sofa/cover/12311,s', '2025/07/gallery/sellable_item_abstract/2025/07/preview_feIgHyv_thumbnail.webp'],
  ],
  blankets: [
    ['Cream & Lemon 울 블랭킷', 'accessories/blanket/10', '2025/12/cream_lemon_aJOWYmG.webp'],
    ['Sky & Grass 울 블랭킷', 'accessories/blanket/7', '2025/12/sky_grass_cMmeTva.webp'],
  ],
  bookends: [
    ['Poppy Red 왼쪽 북엔드', 'accessories/bookend/229', '2026/04/poppy-red_ewT1Mfu.webp'],
    ['Morning Blue 북엔드 세트', 'accessories/bookend/236', '2026/04/morning-blue_j00OvpF.webp'],
  ],
};
export const referenceCatalog = Object.entries(categories).flatMap(([category, samples]) => samples.map(([name, href, image], index) => ({
  id: `${category}-${index + 1}`, category, name, source: `https://tylko.com/en-uk/${href}`,
  // '/'로 시작하면 로컬 사본(책상: media.tylko.com이 VPN 없는 접속을 403으로 막아 Tylko 상품 페이지 캡처에서 잘라 보관)
  image: image.startsWith('/') ? image : `https://media.tylko.com/media/catalogue/catalogue_entry/${image}`,
})));
export function categoryReferences(category: string) {
  return referenceCatalog.filter(product => category === 'accessories' ? ['blankets', 'bookends'].includes(product.category) : product.category === category);
}
