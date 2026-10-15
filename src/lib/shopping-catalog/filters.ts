import type { ShoppingItem } from './types';

export const shoppingColors = [
  ['white', '화이트', '#f8f7f3', /weiß|weiss|white|perl|pearl|creme|cream|salz|salt/i],
  ['black', '블랙', '#202222', /schwarz|black|graphit|charcoal|basalt|anthracite/i],
  ['grey', '그레이', '#b6b7b5', /grau|grey|gray|auster|oyster|taupe/i],
  ['blue', '블루', '#8aabc5', /blau|blue/i],
  ['pink', '핑크', '#d0adac', /rosa|pink|rose/i],
  ['purple', '퍼플', '#bba9bf', /lila|purple|pflaum|plum/i],
  ['yellow', '옐로', '#d9ba73', /gelb|yellow|lemon|zitron|mustard/i],
  ['green', '그린', '#849273', /grün|green|salbei|sage|minz|mint|pistaz/i],
  ['beige', '베이지', '#ccbcaa', /beige|sand|kaschmir|cashmere|mandel|almond/i],
  ['brown', '브라운', '#86684f', /braun|brown|cognac|walnut|walnuss/i],
  ['wooden', '우드', '#bf9e75', /eiche|oak|walnuss|walnut|esche|ash|furnier|veneer/i],
  ['red', '레드', '#a74c35', /rot|red|terrakotta|terracotta|burgund|burgundy/i],
] as const;
export const lineCodes: Record<string, string> = { 'Original Classic': '3', 'Original Modern': '6', Edge: '7', Tone: '8', Smooth: '9', Uff: '10' };
export function filterShopping(items: ShoppingItem[], filters: Record<string, string>) {
  let result = items.filter(item => {
    const d = item.details;
    if (filters.colors && !filters.colors.split(',').some(color => shoppingColors.find(c => c[0] === color)?.[3].test(item.name))) return false;
    if (filters.productLines && (!d || !filters.productLines.split(',').includes(lineCodes[d.line]))) return false;
    if (filters.styles && (!d || !filters.styles.split(',').includes(d.style.toLowerCase()))) return false;
    if (filters.additional === 'newArrival' && !d?.badges.includes('new')) return false;
    if (filters.additional === 'topSeller' && !d?.badges.some(b => /bestseller|top_seller/i.test(b))) return false;
    for (const dimension of ['width', 'height', 'depth'] as const) {
      const max = Number(filters[`${dimension}Max`]);
      if (max > 0 && (!d?.[dimension] || d[dimension] > max * 10)) return false;
    }
    return true;
  });
  if (filters.sort === 'price-asc' || filters.sort === 'price-desc') result = [...result].sort((a, b) => {
    if (!a.details) return b.details ? 1 : 0;
    if (!b.details) return -1;
    return (a.details.eur - b.details.eur) * (filters.sort === 'price-desc' ? -1 : 1);
  });
  return result;
}
