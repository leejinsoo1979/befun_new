import type { FurnitureDesign } from '@/lib/furniture/design';

export interface FurniturePhotoSet {
  id: string;
  family: FurnitureDesign['family'];
  label: string;
  color: string;
  innerColor: string;
  swatch: string;
  source: string;
  images: readonly string[];
}

// Observed product galleries, copied locally. These are collection examples,
// not renders of the customer's edited dimensions. See source-photos.json.
export const furniturePhotoSets: readonly FurniturePhotoSet[] = [
  {
    "id": "desk-1",
    "family": "desk-classic",
    "label": "클레이 브라운 합판",
    "color": "C_Clay Brown",
    "innerColor": "S_White",
    "swatch": "#b67d59",
    "source": "https://tylko.com/en-uk/furniture/desk/9281707,j",
    "images": [
      "/imgs/furniture-details/desk-1/1.avif",
      "/imgs/furniture-details/desk-1/2.avif",
      "/imgs/furniture-details/desk-1/3.avif",
      "/imgs/furniture-details/desk-1/4.avif",
      "/imgs/furniture-details/desk-1/5.avif",
      "/imgs/furniture-details/desk-1/6.avif",
      "/imgs/furniture-details/desk-1/7.avif",
      "/imgs/furniture-details/desk-1/8.avif"
    ]
  },
  {
    "id": "desk-2",
    "family": "desk-modern",
    "label": "샌드·미드나이트 블루",
    "color": "Sand+Midnight Blue",
    "innerColor": "S_White",
    "swatch": "#ddd0b8",
    "source": "https://tylko.com/en-uk/furniture/desk/3716771,j",
    "images": [
      "/imgs/furniture-details/desk-2/1.avif",
      "/imgs/furniture-details/desk-2/2.avif",
      "/imgs/furniture-details/desk-2/3.avif",
      "/imgs/furniture-details/desk-2/4.avif",
      "/imgs/furniture-details/desk-2/5.avif",
      "/imgs/furniture-details/desk-2/6.avif",
      "/imgs/furniture-details/desk-2/7.avif",
      "/imgs/furniture-details/desk-2/8.avif"
    ]
  },
  {
    "id": "desk-3",
    "family": "desk-classic",
    "label": "블랙 합판",
    "color": "C_Black",
    "innerColor": "S_White",
    "swatch": "#202020",
    "source": "https://tylko.com/en-uk/furniture/desk/3760531,j",
    "images": [
      "/imgs/furniture-details/desk-3/1.avif",
      "/imgs/furniture-details/desk-3/2.avif",
      "/imgs/furniture-details/desk-3/3.avif",
      "/imgs/furniture-details/desk-3/4.avif",
      "/imgs/furniture-details/desk-3/5.avif",
      "/imgs/furniture-details/desk-3/6.avif",
      "/imgs/furniture-details/desk-3/7.avif",
      "/imgs/furniture-details/desk-3/8.avif"
    ]
  },
  {
    "id": "wardrobe-1",
    "family": "wardrobe-edge",
    "label": "딥 플럼",
    "color": "W_Plum",
    "innerColor": "W_Plum",
    "swatch": "#67132c",
    "source": "https://tylko.com/en-uk/furniture/wardrobe/1936508,w",
    "images": [
      "/imgs/furniture-details/wardrobe-1/1.avif",
      "/imgs/furniture-details/wardrobe-1/2.avif",
      "/imgs/furniture-details/wardrobe-1/3.avif",
      "/imgs/furniture-details/wardrobe-1/5.avif",
      "/imgs/furniture-details/wardrobe-1/6.avif",
      "/imgs/furniture-details/wardrobe-1/7.avif",
      "/imgs/furniture-details/wardrobe-1/8.avif"
    ]
  },
  {
    "id": "wardrobe-2",
    "family": "wardrobe-tone",
    "label": "캐시미어·앤티크 핑크",
    "color": "T_Cashmere",
    "innerColor": "T_Pink",
    "swatch": "#b8ac9e",
    "source": "https://tylko.com/en-uk/furniture/wardrobe/92332,w",
    "images": [
      "/imgs/furniture-details/wardrobe-2/1.avif",
      "/imgs/furniture-details/wardrobe-2/2.avif",
      "/imgs/furniture-details/wardrobe-2/3.avif",
      "/imgs/furniture-details/wardrobe-2/4.avif",
      "/imgs/furniture-details/wardrobe-2/5.avif",
      "/imgs/furniture-details/wardrobe-2/6.avif",
      "/imgs/furniture-details/wardrobe-2/7.avif",
      "/imgs/furniture-details/wardrobe-2/8.avif"
    ]
  },
  {
    "id": "wardrobe-3",
    "family": "wardrobe-tone",
    "label": "그래파이트",
    "color": "T_Graphite",
    "innerColor": "T_Graphite",
    "swatch": "#4c4c49",
    "source": "https://tylko.com/en-uk/furniture/wardrobe/92275,w",
    "images": [
      "/imgs/furniture-details/wardrobe-3/1.avif",
      "/imgs/furniture-details/wardrobe-3/2.avif",
      "/imgs/furniture-details/wardrobe-3/3.avif",
      "/imgs/furniture-details/wardrobe-3/4.avif",
      "/imgs/furniture-details/wardrobe-3/5.avif",
      "/imgs/furniture-details/wardrobe-3/6.avif",
      "/imgs/furniture-details/wardrobe-3/7.avif",
      "/imgs/furniture-details/wardrobe-3/8.avif"
    ]
  }
];

export function furniturePhotosFor(design: FurnitureDesign, catalogId?: string): FurniturePhotoSet {
  const choices = furniturePhotoSets.filter(item => item.family === design.family);
  return choices.find(item => item.color === design.color && (design.kind === 'desk' || item.innerColor === design.innerColor))
    ?? choices.find(item => item.id === catalogId)
    ?? choices[0];
}
