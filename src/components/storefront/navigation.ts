export const categoryLinks = [
  ['소파', 'sofas'], ['블랭킷', 'blankets'], ['수납장', 'sideboard'], ['선반 시스템', 'wallstorage'], ['책장', 'bookcase'], ['TV 스탠드', 'tv-stand'], ['옷장', 'wardrobe'], ['침대 옆 수납장', 'bedside_table'], ['서랍장', 'chest-of-drawers'], ['모든 제품', ''],
] as const;
export const catalogCategories: Record<string, string> = Object.fromEntries([
  ...categoryLinks.map(([title, slug]) => [slug, title]),
  ['wallunits', '벽면 수납장'], ['desk', '책상'], ['dressing_table', '화장대'], ['shoerack', '신발장'], ['vinyl_storage', '레코드 수납장'], ['storage', '수납 가구'],
  ['two_seater', '2인용 소파'], ['three_seater', '3인용 소파'], ['four_plus_seater', '4인용 이상 소파'], ['chaise_longues', '셰즈 롱'], ['corner_sofas', '코너 소파'], ['modular_sofas', '모듈형 대형 소파'], ['armchairs', '암체어'], ['ottomans_and_modules', '오토만 · 모듈'], ['covers', '소파 커버'], ['bookends', '북엔드'], ['accessories', '액세서리'],
]);
export const catalogHref = (slug: string) => `/furniture-c${slug ? `/${slug}` : ''}`;
export const menuGroups = [
  { title: '둘러보기', links: [['모든 제품', '/furniture-c'], ['직접 디자인하기', '/configurator-intro'], ['베스트셀러', '/furniture-c?additional=topSeller'], ['신제품', '/furniture-c?additional=newArrival'], ['컬렉션', '/product-lines'], ['소재 샘플', '/material-samples'], ['기프트카드', '/e-gift-card/1'], ['리뷰', '/review-list'], ['Befun Sound', '/tylko-sound']] },
  { title: '수납 가구', links: ['sideboard', 'bookcase', 'wallstorage', 'wallunits', 'desk', 'tv-stand', 'chest-of-drawers', 'dressing_table', 'shoerack', 'bedside_table', 'vinyl_storage', 'storage'].map(slug => [catalogCategories[slug], catalogHref(slug)]).concat([['벽걸이 수납장', '/furniture-c/sideboard?features=hanging&productLines=3,6,7,8']]) },
  { title: '옷장', links: [['도어 옷장', '/furniture-c/wardrobe?types=fullyClosed'], ['오픈 옷장', '/furniture-c/wardrobe?types=fullyOpen'], ['부분 오픈 옷장', '/furniture-c/wardrobe?types=partiallyOpen'], ['서랍 옷장', '/furniture-c/wardrobe?features=internalDrawers'], ['모든 옷장', '/furniture-c/wardrobe']] },
  { title: '소파', links: ['two_seater', 'three_seater', 'four_plus_seater', 'chaise_longues', 'corner_sofas', 'modular_sofas', 'armchairs', 'ottomans_and_modules', 'covers', 'sofas'].map(slug => [catalogCategories[slug], catalogHref(slug)]) },
  { title: '액세서리', links: ['blankets', 'bookends', 'accessories'].map(slug => [catalogCategories[slug], catalogHref(slug)]) },
];
export const footerGroups = [
  { title: 'Befun', links: [['브랜드 이야기', '/about-tylko'], ['쇼룸', '/showrooms'], ['기프트카드', '/e-gift-card/1'], ['디자인 저널', '/journal'], ['프레스', '/press'], ['투자자 정보', '/investor-relations-login'], ['디지털 서비스', '/digital-services-act'], ['Befun Pro', '/tylko-pro']] },
  { title: '고객 지원', links: [['자주 묻는 질문', '/faq'], ['이용약관', '/terms'], ['기프트카드 약관', '/terms-gift-card'], ['개인정보 처리', '/privacy_policy'], ['쿠키 설정', '/cookie-settings'], ['배송 안내', '/shipping'], ['주문 취소', '/contact?topic=cancellation'], ['주문 상태', '/contact?topic=order_status']] },
  { title: '문의하기', links: [['고객 문의', '/contact'], ['주문 조회', '/mypage'], ['도움말', '/faq'], ['문제 신고', '/contact?topic=issue'], ['WhatsApp', '/contact?topic=whatsapp'], ['LiveChat', '/contact?topic=chat']] },
  { title: '함께해요', links: [['커뮤니티', '/inspirations'], ['크리에이터', '/creators'], ['즐겨찾기', '/wishlist'], ['저장한 디자인', '/saved-designs'], ['로그인', '/login']] },
];
export const infoTitles: Record<string, string> = {
  'about-tylko': '우리의 이야기', showrooms: '공간에서 만나는 디자인', 'tylko-pro': 'Befun Pro', inspirations: '당신의 공간에서 시작하는 영감', creators: '크리에이터의 공간', 'product-lines': '컬렉션', 'material-samples': '소재와 컬러', 'e-gift-card/1': '취향을 선물하세요', 'review-list': '디자인 리뷰', 'tylko-sound': '공간에 흐르는 음악', journal: 'Befun Life', 'collaborations/reisinger': '상상에서 시작하는 컬러', press: '프레스', 'investor-relations-login': '투자자 정보', 'digital-services-act': '디지털 서비스 안내', faq: '무엇을 도와드릴까요?', contact: '문의하기', shipping: '배송 안내', terms: '이용약관', 'terms-gift-card': '기프트카드 이용 안내', privacy_policy: '개인정보 처리 안내', 'terms/user-account-and-promo-codes': '계정과 프로모션 안내', 'cookie-settings': '쿠키 설정', search: '제품 검색', wishlist: '즐겨찾기',
};
export const journalArticles = [
  { slug: 'seongsu-popup', name: '성수 팝업 갤러리', title: '가구와 예술이 만나는 순간', text: '색과 형태가 공간의 분위기를 바꾸는 순간. 오브제와 가구를 함께 바라보며 공간을 구성하는 새로운 아이디어를 발견하세요.', image: 'creator-3.avif' },
  { slug: 'designer-interview', name: '디자이너 인터뷰', title: '빛, 소재, 그리고 색', text: '빛이 닿는 방향과 주변의 컬러를 함께 살펴보세요. 같은 가구도 공간의 밝기와 소재에 따라 다르게 보입니다.', image: 'creator-11.avif' },
  { slug: 'seoul-workshop', name: '서울 디자인 워크숍', title: '함께 만드는 디자인', text: '공간을 바라보는 서로 다른 시선은 새로운 조합의 시작입니다. 좋아하는 물건과 필요한 수납을 먼저 정리해 보세요.', image: 'creator-10.avif' },
  { slug: 'pink-room', name: '핑크 룸 스토리', title: '상상 속 컬러를 일상으로', text: '부드러운 핑크와 조형적인 가구가 만나는 공간. 익숙한 배치에 새로운 컬러를 더해 나만의 풍경을 만들어 보세요.', image: 'creator-9.avif' },
];
export const faqItems = [
  { group: '디자인', q: '어떻게 가구를 디자인하나요?', a: '3D 커스터마이저에서 스타일, 너비, 높이, 깊이와 컬러를 선택하세요. 각 행의 높이와 도어·서랍 구성을 조절하고 화면에서 디자인과 가격을 확인할 수 있습니다.' },
  { group: '디자인', q: '선택할 수 있는 크기는 어떻게 되나요?', a: '너비는 30–450cm, 본체 높이는 38–228cm 범위에서 조절합니다. 깊이는 24·32·40cm 중 선택할 수 있습니다. 행 높이는 18·28·38cm입니다.' },
  { group: '디자인', q: '모든 선반에 도어와 서랍을 추가할 수 있나요?', a: '도어는 높이 28cm 이상의 행에 추가할 수 있습니다. 서랍은 깊이 40cm, 총 높이 150cm 이하인 디자인에서 사용할 수 있습니다. 선택 가능한 구성은 커스터마이저에 표시됩니다.' },
  { group: '소재', q: '어떤 소재와 색상을 선택할 수 있나요?', a: 'Classic, Natural, Solid, EdgeMix 컬러 카테고리를 제공합니다. 소재와 색상은 커스터마이저의 컬러 패널에서 확인하세요. 화면의 색은 실제 소재와 차이가 있을 수 있습니다.' },
  { group: '주문', q: '가격은 어디에서 확인하나요?', a: '선택한 크기와 소재에 따라 커스터마이저에서 금액이 계산됩니다. 장바구니와 주문 화면에서 최종 수량과 금액을 확인하세요.' },
  { group: '주문', q: '디자인을 저장하고 공유할 수 있나요?', a: '커스터마이저의 저장·공유 기능으로 디자인 링크를 만들 수 있습니다. 저장된 디자인은 로그인 후 마이페이지에서 다시 확인할 수 있습니다.' },
  { group: '주문', q: '주문 상태는 어떻게 확인하나요?', a: '주문에 사용한 계정으로 로그인한 후 마이페이지의 주문 내역에서 확인하세요. 주문 상세에서 결제 상태와 배송 정보를 볼 수 있습니다.' },
  { group: '배송', q: '배송 정보를 어디에 입력하나요?', a: '장바구니에서 주문하기를 선택한 뒤 주문 화면에 수령인, 연락처, 주소와 배송 메모를 입력합니다. 결제 전에 입력한 주소를 확인하세요.' },
];
