'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/lib/commerce/useLocale';
import styles from './pro.module.css';

const creators = [
  ['korean-designer-1.webp', '서윤', 'Interior designer', '샘플이 많아서 늘 정리가 고민이에요. 소재별로 나눠 두고, 미팅할 때 바로 꺼내 볼 수 있는 수납장을 만들고 싶어요.', 'I have so many samples to organise. I’d like a cabinet where I can sort them by material and reach for them during a meeting.', 'サンプルが多くて、整理がいつも悩みです。素材ごとに分けて、打ち合わせですぐ取り出せる収納にしたいですね。'],
  ['korean-designer-2.webp', '지훈', 'Furniture designer', '작업실이 좁아서 가구 하나도 신중하게 고르게 돼요. 벽에 딱 맞추되, 자주 쓰는 도구는 손이 닿는 곳에 두고 싶어요.', 'Space is tight in my workshop, so every piece matters. I’d like storage that fits the wall and keeps my everyday tools within reach.', '狭い作業場なので、家具選びは慎重になります。壁にぴったり合わせて、よく使う道具は手の届く場所に置きたいです。'],
  ['korean-designer-3.webp', '수진', 'Café owner', '컵이랑 접시를 편하게 꺼낼 수 있으면 좋겠어요. 손님 눈에도 보이는 자리라, 카페 분위기에 어울리는 색으로 고르고 싶고요.', 'I want cups and plates to be easy to reach. Customers can see this corner too, so I’d choose a colour that feels right for the café.', 'カップやお皿を取り出しやすくしたいです。お客様からも見える場所なので、お店に合う色を選びたいですね。'],
  ['korean-designer-4.webp', '도현', 'Architect', '큰 수납장은 공간을 답답하게 만들기도 하죠. 책은 충분히 꽂고, 중간중간 비워 둘 여유도 있는 구성을 생각하고 있어요.', 'A large cabinet can overwhelm a room. I’m thinking of a layout with plenty of room for books and a few open spaces to let it breathe.', '大きな収納は圧迫感が出ることもあります。本をしっかり収めながら、ところどころ余白を残せる構成を考えています。'],
];
const showrooms = [
  ['01-gallery.webp', 'BEFUN Gallery', '따뜻한 빛과 목재가 어우러진 공간', 'Warm light and natural wood', '温かな光と木が調和する空間'],
  ['02-studio.webp', 'BEFUN Studio', '색과 소재를 자유롭게 살펴보는 스튜디오', 'A studio for exploring colour and materials', '色と素材を自由に楽しむスタジオ'],
  ['03-courtyard.webp', 'BEFUN Courtyard', '고요한 마당을 마주한 공간', 'A quiet space overlooking a courtyard', '静かな庭に面した空間'],
  ['04-lounge.webp', 'BEFUN Lounge', '편안하게 앉아 소재를 느껴보는 라운지', 'A lounge for discovering fabrics in comfort', 'くつろぎながら素材に触れるラウンジ'],
  ['05-material-library.webp', 'BEFUN Material Library', '색과 질감을 직접 비교하는 소재 라이브러리', 'A library of colours and textures', '色や質感を比べる素材ライブラリー'],
  ['06-garden.webp', 'BEFUN Garden', '초록 풍경이 일상으로 이어지는 공간', 'A space that brings the garden indoors', '緑の景色と日常がつながる空間'],
  ['07-open-house.webp', 'BEFUN Open House', '큰 창으로 빛이 들어오는 열린 공간', 'An open space filled with daylight', '大きな窓から光が差し込む空間'],
  ['08-retreat.webp', 'BEFUN Retreat', '담백한 소재와 여유가 있는 공간', 'A calm retreat with understated materials', '素朴な素材に囲まれた穏やかな空間'],
];
export function ProReferenceSections() {
  const { language } = useLocale();
  const lang = String(language).startsWith('ja') ? 2 : String(language).startsWith('en') ? 1 : 0;
  const copy = (ko: string, en: string, ja: string) => [ko, en, ja][lang];
  return <>
    <section className={`${styles.section} ${styles.creators}`}>
      <p className={styles.eyebrow}>{copy('공간을 만드는 사람들의 이야기', 'PEOPLE BEHIND THE SPACES', '空間をつくる人たち')}</p>
      <h2>{copy('다양한 아이디어가 만나,\n새로운 공간이 됩니다.', 'Creative ideas.\nSpaces with character.', 'さまざまなアイデアから、\n新しい空間へ。')}</h2>
      <div className={styles.creatorTrack} tabIndex={0} aria-label={copy('디자이너 사례 가로 목록', 'Designer references', 'デザイナーの事例')}>
        {creators.map(([file, name, studio, ko, en, ja]) => <article key={file}>
          <Image src={`/imgs/pro/${file}`} alt={name} width={130} height={130} />
          <p className={styles.creatorStory}>{copy(ko, en, ja)}</p>
          <div><h3>{name}</h3><p>{copy(...({ "Interior designer": ["인테리어 디자이너", "Interior designer", "インテリアデザイナー"], "Furniture designer": ["가구 디자이너", "Furniture designer", "家具デザイナー"], "Café owner": ["카페 운영자", "Café owner", "カフェオーナー"], "Architect": ["건축가", "Architect", "建築家"] }[studio] as [string, string, string]))}</p></div>
        </article>)}
      </div>
      <p className={styles.referenceNote}>{copy('AI로 생성한 가상 인물과 공간 활용 예시입니다.', 'AI-generated fictional people and illustrative space concepts.', 'AIで生成した架空の人物と空間活用の例です。')}</p>
    </section>
    <section className={`${styles.section} ${styles.showrooms}`}>
      <p className={styles.eyebrow}>{copy('공간에서 만나는 디자인', 'SPACES BY BEFUN', '空間で出会うデザイン')}</p>
      <h2>{copy('쇼룸에서 만나는 영감', 'Showroom inspiration', 'ショールームのインスピレーション')}</h2>
      <p className={styles.referenceNote}>{copy('한국의 공간에서 영감을 받아 AI로 연출한 쇼룸 콘셉트입니다.', 'AI-created showroom concepts inspired by spaces in Korea.', '韓国の空間から着想を得て、AIで制作したショールームのコンセプトです。')}</p>
      <div className={styles.showroomGrid}>{showrooms.map(([file, name, ko, en, ja]) => <article key={file}>
        <div className={styles.showroomPhoto}><Image src={`/imgs/pro/korean-showrooms/${file}`} alt={`${name} · ${copy(ko, en, ja)}`} fill sizes="(max-width:700px) 100vw, (max-width:1000px) 50vw, 25vw" /><span>Showroom</span></div>
        <div className={styles.showroomBody}><h3>{name}</h3><p>{copy(ko, en, ja)}</p><Link href="/contact">{copy('공간 상담하기', 'Discuss your space', '空間づくりを相談する')} ↗</Link></div>
      </article>)}</div>
    </section>
  </>;
}
