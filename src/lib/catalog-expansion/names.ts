/**
 * R6 manifest의 상품명(독일어 원문, CSV 그대로)을 화면 언어로 구성한다.
 * 원문 구조: <종류>[ <소재>] in <색상>[ und <색상>][ mit <특징> und <특징>]
 * 사전에 없는 토큰은 원문 그대로 둔다(추측 번역 금지). 원문은 데이터에 보존된다.
 */
export type NameLanguage = 'ko' | 'en' | 'ja';
type Tri = readonly [ko: string, en: string, ja: string];
const pick = (t: Tri | undefined, lang: NameLanguage, fallback: string) => (t ? t[lang === 'ko' ? 0 : lang === 'en' ? 1 : 2] : fallback);

const TYPES: Record<string, Tri> = {
  'Kommode': ['서랍장', 'Chest of drawers', 'チェスト'], 'Buchstützen-Set': ['북엔드 세트', 'Bookend set', 'ブックエンドセット'],
  'Kleiderschrank': ['옷장', 'Wardrobe', 'ワードローブ'], 'Sideboard': ['사이드보드', 'Sideboard', 'サイドボード'],
  '3-Sitzer-Sofa': ['3인 소파', '3-seater sofa', '3人掛けソファ'], '2-Sitzer-Sofa': ['2인 소파', '2-seater sofa', '2人掛けソファ'],
  'Schallplattenregal': ['레코드 수납장', 'Vinyl storage', 'レコード収納'], 'Schreibtisch': ['책상', 'Desk', 'デスク'],
  'Sitz': ['좌석 모듈', 'Seat module', 'シートモジュール'], 'Regalsystem': ['선반 시스템', 'Wall storage', 'シェルフシステム'],
  'Nachttisch': ['협탁', 'Bedside table', 'ベッドサイドテーブル'], 'Sessel': ['암체어', 'Armchair', 'アームチェア'],
  'Schuhregal': ['신발장', 'Shoe rack', 'シューズラック'], 'Schminktisch': ['화장대', 'Dressing table', 'ドレッサー'],
  'Bücherregal': ['책장', 'Bookcase', '本棚'], 'Buchständer': ['북 스탠드', 'Book stand', 'ブックスタンド'],
  'Fernsehtisch': ['TV 수납장', 'TV stand', 'テレビ台'], 'Wohnlandschaft': ['모듈형 대형 소파', 'Modular sofa', 'モジュラーソファ'],
  'Ecksofa': ['코너 소파', 'Corner sofa', 'コーナーソファ'], 'Wohnwand': ['벽면 수납장', 'Wall unit', 'ウォールユニット'],
  'Polsterhocker': ['오토만', 'Ottoman', 'オットマン'], 'Großes Sofa': ['대형 소파', 'Large sofa', '大型ソファ'],
  'Wolldecke': ['울 담요', 'Wool blanket', 'ウールブランケット'], 'Rückenkissen': ['등쿠션', 'Back cushion', '背もたれクッション'],
  'Longchair': ['셰즈 롱', 'Chaise longue', 'シェーズロング'], 'Linker Eckstiz': ['왼쪽 코너 좌석', 'Left corner seat', '左コーナーシート'],
  'Rechtsseitige Buchstütze': ['오른쪽 북엔드', 'Right bookend', '右側ブックエンド'], 'Linksseitige Buchstütze': ['왼쪽 북엔드', 'Left bookend', '左側ブックエンド'],
};
/** "Überzug für <대상>" — 커버 대상 */
const COVER_TARGETS: Record<string, Tri> = {
  'Sitz mit Polsterhocker': ['오토만 포함 좌석', 'seat with ottoman', 'オットマン付きシート'], 'rechten Eckstiz': ['오른쪽 코너 좌석', 'right corner seat', '右コーナーシート'],
  'linken Eckstiz': ['왼쪽 코너 좌석', 'left corner seat', '左コーナーシート'], 'Polsterhocker': ['오토만', 'ottoman', 'オットマン'],
  'Sitz': ['좌석', 'seat', 'シート'], 'Longchair': ['셰즈 롱', 'chaise longue', 'シェーズロング'], 'Armlehne': ['팔걸이', 'armrest', 'アームレスト'],
};
const MODIFIERS: Record<string, Tri> = {
  'mit Longchair': ['셰즈 롱 포함', 'with chaise longue', 'シェーズロング付き'], 'mit Polsterhocker': ['오토만 포함', 'with ottoman', 'オットマン付き'],
  'mit offener Seite': ['오픈 사이드', 'with open side', 'オープンサイド'], 'mit Armlehne': ['팔걸이 포함', 'with armrest', 'アームレスト付き'],
};
const MATERIALS: Record<string, Tri> = {
  'Leder': ['가죽', 'Leather', 'レザー'], 'Chenille Einfarbig': ['단색 셰닐', 'Plain chenille', '無地シェニール'],
  'Bouclé Fein': ['파인 부클레', 'Fine bouclé', 'ファインブークレ'], 'Bouclé Strukturiert': ['텍스처 부클레', 'Textured bouclé', 'テクスチャーブークレ'],
  'Bouclé Klassisch': ['클래식 부클레', 'Classic bouclé', 'クラシックブークレ'], 'Bouclé Melangiert': ['멜란지 부클레', 'Melange bouclé', 'メランジブークレ'],
  'aus Wolle': ['울', 'Wool', 'ウール'], 'aus Cord': ['코듀로이', 'Corduroy', 'コーデュロイ'],
};
const FEATURES: Record<string, Tri> = {
  'Kleiderstange': ['옷걸이 봉', 'hanging rail', 'ハンガーパイプ'], 'Aussen Schubladen': ['외부 서랍', 'external drawers', '外引き出し'],
  'Türen': ['도어', 'doors', '扉'], 'Schubladen': ['서랍', 'drawers', '引き出し'], 'Innenschubladen': ['내부 서랍', 'internal drawers', '内引き出し'],
  'Ruckwanden': ['뒷판', 'back panels', '背板'], 'Innen': ['내부', 'internal', '内'], 'Beine': ['다리', 'legs', '脚'], 'Sockel': ['받침대', 'plinth', '台座'],
  'Unteren Fächern': ['하단 수납칸', 'lower compartments', '下段収納'], 'Oberes': ['상단', 'upper', '上段'], 'Unteres Fachs': ['하단 칸', 'lower compartment', '下段'],
};
const COLOURS: Record<string, Tri> = {
  'Steingrau': ['스톤 그레이', 'Stone Grey', 'ストーングレー'], 'Morgenblau': ['모닝 블루', 'Morning Blue', 'モーニングブルー'], 'morgenblau': ['모닝 블루', 'Morning Blue', 'モーニングブルー'],
  'Weiß': ['화이트', 'White', 'ホワイト'], 'Rosa': ['핑크', 'Pink', 'ピンク'], 'Graphit': ['그래파이트', 'Graphite', 'グラファイト'], 'Braun': ['브라운', 'Brown', 'ブラウン'],
  'Sand': ['샌드', 'Sand', 'サンド'], 'Burgund': ['버건디', 'Burgundy', 'バーガンディ'], 'Dämmerungsblau': ['더스크 블루', 'Dusk Blue', 'ダスクブルー'],
  'Dunkelbraun': ['다크 브라운', 'Dark Brown', 'ダークブラウン'], 'Hellgelb': ['라이트 옐로', 'Light Yellow', 'ライトイエロー'], 'Salbei & Minze': ['세이지 & 민트', 'Sage & Mint', 'セージ＆ミント'],
  'Schwarz': ['블랙', 'Black', 'ブラック'], 'Kobaltblau': ['코발트 블루', 'Cobalt Blue', 'コバルトブルー'], 'Mandelcreme': ['아몬드 크림', 'Almond Cream', 'アーモンドクリーム'],
  'Messinggelb': ['브라스 옐로', 'Brass Yellow', 'ブラスイエロー'], 'Grau': ['그레이', 'Grey', 'グレー'], 'Grün': ['그린', 'Green', 'グリーン'],
  'Klatschmohnrot': ['포피 레드', 'Poppy Red', 'ポピーレッド'], 'Khaki': ['카키', 'Khaki', 'カーキ'], 'Olivgrün': ['올리브 그린', 'Olive Green', 'オリーブグリーン'],
  'Cremeweiß Premium-Matt': ['크림 화이트 프리미엄 매트', 'Cream White Premium Matte', 'クリームホワイト プレミアムマット'], 'Beige': ['베이지', 'Beige', 'ベージュ'],
  'Hellgrau': ['라이트 그레이', 'Light Grey', 'ライトグレー'], 'Kalkweiß': ['라임 화이트', 'Lime White', 'ライムホワイト'], 'Zitronencreme': ['레몬 크림', 'Lemon Cream', 'レモンクリーム'],
  'Perlweiß': ['펄 화이트', 'Pearl White', 'パールホワイト'], 'Lehmbrauner Multiplexplatte': ['클레이 브라운 합판', 'Clay Brown Plywood', 'クレイブラウン合板'],
  'Pistaziengrün': ['피스타치오 그린', 'Pistachio Green', 'ピスタチオグリーン'], 'Cognac': ['코냑', 'Cognac', 'コニャック'], 'Blau': ['블루', 'Blue', 'ブルー'],
  'Buttergelb': ['버터 옐로', 'Butter Yellow', 'バターイエロー'], 'Lilablau': ['라일락 블루', 'Lilac Blue', 'ライラックブルー'], 'Rosenholz': ['로즈우드', 'Rosewood', 'ローズウッド'],
  'Thymiangrün': ['타임 그린', 'Thyme Green', 'タイムグリーン'], 'Walnussbraun': ['월넛 브라운', 'Walnut Brown', 'ウォールナットブラウン'],
  'Pflaume & Kohle': ['플럼 & 차콜', 'Plum & Charcoal', 'プラム＆チャコール'], 'Terrakotta': ['테라코타', 'Terracotta', 'テラコッタ'], 'Dunkelblau': ['다크 블루', 'Dark Blue', 'ダークブルー'],
  'Austerngrau': ['오이스터 그레이', 'Oyster Grey', 'オイスターグレー'], 'Pflaumenlila': ['딥 플럼', 'Deep Plum', 'ディーププラム'], 'Leinenbeige': ['리넨 베이지', 'Linen Beige', 'リネンベージュ'],
  'Pfeffergrün': ['페퍼 그린', 'Pepper Green', 'ペッパーグリーン'], 'Walnuss': ['월넛', 'Walnut', 'ウォールナット'], 'Cremeweiß': ['크림 화이트', 'Cream White', 'クリームホワイト'],
  'Klassisches Grau': ['클래식 그레이', 'Classic Grey', 'クラシックグレー'], 'Gelb': ['옐로', 'Yellow', 'イエロー'], 'Haferbeige': ['오트 베이지', 'Oat Beige', 'オートベージュ'],
  'Anthrazit': ['앤트러사이트', 'Anthracite', 'アンスラサイト'], 'Taupe': ['토프', 'Taupe', 'トープ'], 'Puderrosa': ['파우더 핑크', 'Powder Pink', 'パウダーピンク'],
  'Mitternachtsblau': ['미드나잇 블루', 'Midnight Blue', 'ミッドナイトブルー'], 'Himmel & Gras': ['스카이 & 그라스', 'Sky & Grass', 'スカイ＆グラス'],
  'Creme & Kohle': ['크림 & 차콜', 'Cream & Charcoal', 'クリーム＆チャコール'], 'Moosgrün': ['모스 그린', 'Moss Green', 'モスグリーン'], 'Flieder': ['라일락', 'Lilac', 'ライラック'],
  'Sandbeige': ['샌드 베이지', 'Sand Beige', 'サンドベージュ'], 'Kaschmir': ['캐시미어', 'Cashmere', 'カシミア'], 'Eiche': ['오크', 'Oak', 'オーク'],
  'Tiefbraun': ['딥 브라운', 'Deep Brown', 'ディープブラウン'], 'Basaltgrau': ['바솔트 그레이', 'Basalt Grey', 'バサルトグレー'], 'Salz & Pfeffer': ['솔트 & 페퍼', 'Salt & Pepper', 'ソルト＆ペッパー'],
  'Pistaziengrün Premium-Matt': ['피스타치오 그린 프리미엄 매트', 'Pistachio Green Premium Matte', 'ピスタチオグリーン プレミアムマット'],
  'Graphitgrau': ['그래파이트 그레이', 'Graphite Grey', 'グラファイトグレー'], 'Reisinger Pink': ['라이징어 핑크', 'Reisinger Pink', 'ライジンガーピンク'],
  'Altrosa': ['앤티크 핑크', 'Antique Pink', 'アンティークピンク'], 'Piniengrün': ['파인 그린', 'Pine Green', 'パイングリーン'], 'Premium-Schwarz': ['프리미엄 블랙', 'Premium Black', 'プレミアムブラック'],
  'Eiche Hell': ['라이트 오크', 'Light Oak', 'ライトオーク'], 'Grau Melangiert': ['멜란지 그레이', 'Melange Grey', 'メランジグレー'], 'Mondsteingrau': ['문스톤 그레이', 'Moonstone Grey', 'ムーンストーングレー'],
  'Senfgelb': ['머스터드 옐로', 'Mustard Yellow', 'マスタードイエロー'], 'Aschgrau': ['애시 그레이', 'Ash Grey', 'アッシュグレー'], 'Helles Holzimitat': ['라이트 우드 패턴', 'Light Wood Effect', 'ライトウッド調'],
  'Kohleschwarz': ['차콜 블랙', 'Charcoal Black', 'チャコールブラック'], 'Aschgrau Premium-Matt': ['애시 그레이 프리미엄 매트', 'Ash Grey Premium Matte', 'アッシュグレー プレミアムマット'],
  'Kaschmirbeige Multiplexplatte': ['캐시미어 베이지 합판', 'Cashmere Beige Plywood', 'カシミアベージュ合板'], 'Creme & Mandel': ['크림 & 아몬드', 'Cream & Almond', 'クリーム＆アーモンド'],
  'Lavendel & Erde': ['라벤더 & 어스', 'Lavender & Earth', 'ラベンダー＆アース'], 'Creme & Zitrone': ['크림 & 레몬', 'Cream & Lemon', 'クリーム＆レモン'],
  'Dunkles Holzimitat': ['다크 우드 패턴', 'Dark Wood Effect', 'ダークウッド調'], 'Kaschmirbeige': ['캐시미어 베이지', 'Cashmere Beige', 'カシミアベージュ'],
};

const JOIN: Record<NameLanguage, { and: string; list: string }> = { ko: { and: '·', list: ', ' }, en: { and: ' and ', list: ' and ' }, ja: { and: '・', list: '・' } };

function parseHead(head: string) {
  let rest = head.trim(); let material: string | undefined; const modifiers: string[] = []; let cover: string | undefined;
  for (const key of Object.keys(MATERIALS).filter(k => !k.startsWith('aus ')).sort((a, b) => b.length - a.length)) {
    if (rest.endsWith(` ${key}`)) { material = key; rest = rest.slice(0, -key.length - 1); break; }
  }
  if (rest.startsWith('Überzug für ')) { cover = rest.slice('Überzug für '.length); rest = ''; }
  for (const key of Object.keys(MODIFIERS)) if (rest.endsWith(` ${key}`)) { modifiers.push(key); rest = rest.slice(0, -key.length - 1); }
  return { base: rest, material, modifiers, cover };
}

/** 원문 상품명 → 화면 언어 이름. 구조를 못 읽으면 원문 반환 */
export function localizedProductName(source: string, lang: NameLanguage): string {
  const match = source.match(/^(.*?)(?: (Bouclé \w+|aus \w+))? in (.*?)(?: mit (.*))?$/);
  if (!match) return source;
  const [, headRaw, fabric, colourRaw, featureRaw] = match;
  const head = parseHead(headRaw);
  const material = fabric ?? head.material;
  const tr = (dict: Record<string, Tri>, key: string) => pick(dict[key], lang, key);
  const type = head.cover
    ? (lang === 'ko' ? `${tr(COVER_TARGETS, head.cover)} 커버` : lang === 'en' ? `Cover for ${tr(COVER_TARGETS, head.cover)}` : `${tr(COVER_TARGETS, head.cover)}カバー`)
    : tr(TYPES, head.base);
  const modifiers = head.modifiers.map(key => tr(MODIFIERS, key));
  const colours = colourRaw.split(' und ').map(key => tr(COLOURS, key)).join(JOIN[lang].and);
  const features = featureRaw ? featureRaw.split(' und ').map(key => tr(FEATURES, key)) : [];
  const mat = material ? tr(MATERIALS, material) : '';
  if (lang === 'en') return `${type}${modifiers.length ? ` ${modifiers.join(' ')}` : ''}${mat ? ` in ${mat},` : ' in'} ${colours}${features.length ? ` with ${features.join(' and ')}` : ''}`;
  if (lang === 'ja') return `${colours}${mat ? `の${mat}` : 'の'}${type}${modifiers.length ? `（${modifiers.join('・')}）` : ''}${features.length ? ` · ${features.join('・')}` : ''}`;
  return `${colours}${mat ? ` ${mat}` : ''} ${type}${modifiers.length ? ` (${modifiers.join(', ')})` : ''}${features.length ? ` · ${features.join(', ')}` : ''}`;
}

/** 카드 상단 라벨용 종류명 (예: 사이드보드 / Sideboard). 모르면 빈 문자열 */
export function localizedProductType(source: string, lang: NameLanguage): string {
  const match = source.match(/^(.*?)(?: (Bouclé \w+|aus \w+))? in /);
  if (!match) return '';
  const head = parseHead(match[1]);
  if (head.cover) return pick(TYPES['Polsterhocker'] && (['커버', 'Cover', 'カバー'] as const), lang, '');
  return TYPES[head.base] ? pick(TYPES[head.base], lang, '') : '';
}
