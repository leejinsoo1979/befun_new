/** Wardrobe family-specific palette. Verified renderer colours and visible swatches,
 * wardrobe-integration-materials-001. These keys never reuse a similarly named shelf colour. */
export const WARDROBE_COLORS:Record<string,{label:string;base:string;edge:string}> = {
  E_LightCleaf:{label:'라이트 우드',base:'#CBC3AC',edge:'#CBC3AC'},
  E_DarkCleaf:{label:'다크 우드',base:'#72553B',edge:'#72553B'},
  W_White:{label:'화이트',base:'#F5F5F5',edge:'#F5F5F5'},
  W_Gray:{label:'그레이',base:'#B2B2B2',edge:'#B2B2B2'},
  W_Stone:{label:'스톤 그레이',base:'#B2AEA7',edge:'#B2AEA7'},
  W_Black:{label:'블랙',base:'#1F1F1E',edge:'#1F1F1E'},
  W_Sand:{label:'샌드',base:'#D5CABC',edge:'#D5CABC'},
  W_Clay:{label:'클레이 브라운',base:'#B57E5B',edge:'#B57E5B'},
  W_Butter:{label:'버터 옐로',base:'#D9CAA3',edge:'#D9CAA3'},
  W_Olive:{label:'올리브 그린',base:'#5C6C3C',edge:'#5C6C3C'},
  W_Denim:{label:'데님 블루',base:'#56697B',edge:'#56697B'},
  W_Indigo:{label:'인디고 블루',base:'#101323',edge:'#101323'},
  W_Plum:{label:'딥 플럼',base:'#67132C',edge:'#67132C'},
  T_White:{label:'화이트',base:'#E2E1DF',edge:'#E2E1DF'},
  T_Cashmere:{label:'캐시미어',base:'#B8AC9E',edge:'#B8AC9E'},
  T_Graphite:{label:'그래파이트',base:'#4C4C49',edge:'#4C4C49'},
  T_Pink:{label:'앤티크 핑크',base:'#9F7F7C',edge:'#9F7F7C'},
  T_Stone:{label:'스톤 그레이',base:'#797166',edge:'#797166'},
  T_Sage:{label:'세이지 그린',base:'#C1CCC4',edge:'#C1CCC4'},
  T_Misty:{label:'미스티 블루',base:'#7D8F9F',edge:'#7D8F9F'},
};
export const EDGE_PAINT_COLORS = ['W_White','W_Gray','W_Stone','W_Black','W_Sand','W_Clay','W_Butter','W_Olive','W_Denim','W_Indigo','W_Plum'];
export const TONE_OUTER_COLORS = ['T_White','T_Cashmere','T_Graphite'];
export const toneInnerColors=(outer:string)=>['T_Pink','T_Stone','T_Sage','T_Misty',outer];

/** VENEER_TYPE13 (shelf type 5): material 0/1, Cleaf textures rather than Original ash/oak. */
export const EDGE_WOOD_COLORS = ['E_LightCleaf','E_DarkCleaf'];
