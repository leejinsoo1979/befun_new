import { localizedProductName, type NameLanguage } from '@/lib/catalog-expansion/names';

// The public variant endpoint returns both English and German titles.
const words: Record<string, readonly [string, string]> = {
  'Large sofa with Ottoman': ['오토만 포함 대형 소파', 'オットマン付き大型ソファ'],
  '2-seater sofa with Ottoman': ['오토만 포함 2인 소파', 'オットマン付き2人掛けソファ'],
  '2-seater sofa': ['2인 소파', '2人掛けソファ'], '3-seater sofa': ['3인 소파', '3人掛けソファ'],
  'Large sofa': ['대형 소파', '大型ソファ'], 'Corner sofa': ['코너 소파', 'コーナーソファ'],
  'Armchair': ['암체어', 'アームチェア'], 'Chaise longue': ['셰즈 롱', 'シェーズロング'], 'Ottoman': ['오토만', 'オットマン'],
  'Fine Bouclé': ['파인 부클레', 'ファインブークレ'], 'Textured Bouclé': ['텍스처 부클레', 'テクスチャーブークレ'],
  'Classic Bouclé': ['클래식 부클레', 'クラシックブークレ'], 'Melange Bouclé': ['멜란지 부클레', 'メランジブークレ'],
  'Plain Chenille': ['단색 셰닐', '無地シェニール'], 'Corduroy': ['코듀로이', 'コーデュロイ'], 'Wool': ['울', 'ウール'], 'Leather': ['가죽', 'レザー'],
  'Almond Cream': ['아몬드 크림', 'アーモンドクリーム'], 'Brass Yellow': ['브라스 옐로', 'ブラスイエロー'],
  'Lemon Cream': ['레몬 크림', 'レモンクリーム'], 'Linen Beige': ['리넨 베이지', 'リネンベージュ'],
  'Plum & Charcoal': ['플럼 & 차콜', 'プラム＆チャコール'], 'Sage & Mint': ['세이지 & 민트', 'セージ＆ミント'],
  'Salt & Pepper': ['솔트 & 페퍼', 'ソルト＆ペッパー'], 'Thyme Green': ['타임 그린', 'タイムグリーン'],
  'Walnut': ['월넛', 'ウォールナット'], 'Oyster Grey': ['오이스터 그레이', 'オイスターグレー'],
  'Rosewood': ['로즈우드', 'ローズウッド'], 'Taupe': ['토프', 'トープ'], 'Anthracite': ['앤트러사이트', 'アンスラサイト'],
  'Basalt Grey': ['바솔트 그레이', 'バサルトグレー'], 'Classic Grey': ['클래식 그레이', 'クラシックグレー'],
  'Cobalt Blue': ['코발트 블루', 'コバルトブルー'], 'Cream Beige': ['크림 베이지', 'クリームベージュ'],
  'Olive Green': ['올리브 그린', 'オリーブグリーン'], 'Pale Yellow': ['라이트 옐로', 'ライトイエロー'],
  'Pearl': ['펄', 'パール'], 'Willow Green': ['윌로 그린', 'ウィローグリーン'], 'Brown': ['브라운', 'ブラウン'],
  'Cognac': ['코냑', 'コニャック'], 'Light Grey': ['라이트 그레이', 'ライトグレー'], 'Mustard': ['머스터드', 'マスタード'],
  'Off-White': ['오프 화이트', 'オフホワイト'], 'Terracotta': ['테라코타', 'テラコッタ'],
  'Dark Brown': ['다크 브라운', 'ダークブラウン'], 'Graphite Grey': ['그래파이트 그레이', 'グラファイトグレー'],
  'Lilac Blue': ['라일락 블루', 'ライラックブルー'], 'Mélange Grey': ['멜란지 그레이', 'メランジグレー'],
  'Deep Brown': ['딥 브라운', 'ディープブラウン'], 'Moonstone Grey': ['문스톤 그레이', 'ムーンストーングレー'],
  'Grey': ['그레이', 'グレー'], 'Green': ['그린', 'グリーン'], 'Beige': ['베이지', 'ベージュ'],
};
export function sofaProductName(source: string, language: NameLanguage) {
  const [type, finish] = source.split(' in ');
  if (!words[type] || !finish) return localizedProductName(source, language);
  if (language === 'en') return source;
  const index = language === 'ko' ? 0 : 1;
  const tokens = Object.keys(words).sort((a, b) => b.length - a.length);
  const translated = finish.replace(new RegExp(tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g'), word => words[word][index]);
  return `${translated} ${words[type][index]}`;
}
