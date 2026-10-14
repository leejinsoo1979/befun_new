import { notFound } from 'next/navigation';
import { StorefrontFrame } from '@/components/storefront/StorefrontFrame';
import { FurnitureConfigurator } from '@/components/furniture/FurnitureConfigurator';
import { createFurnitureDesign, isFurnitureFamily, parseFurnitureDesign, FAMILY_NAMES } from '@/lib/furniture/design';

type Props={params:Promise<{family:string}>;searchParams:Promise<{design?:string}>};
export async function generateMetadata({params}:Props){
  const {family}=await params;
  return {title:`${isFurnitureFamily(family)?FAMILY_NAMES[family]:'가구'} | Befun`};
}
export default async function FurnitureDesignPage({params,searchParams}:Props){
  const {family}=await params;
  if(!isFurnitureFamily(family))notFound();
  const {design:serialized}=await searchParams;
  const design=serialized?parseFurnitureDesign(serialized):createFurnitureDesign(family);
  if(!design||design.family!==family) return <StorefrontFrame><section style={{padding:64}}><h1>디자인을 불러올 수 없습니다.</h1><p>저장된 크기 또는 구성이 올바르지 않습니다.</p><a href={`/furniture-design/${family}`}>새 디자인으로 시작</a></section></StorefrontFrame>;
  return <StorefrontFrame><FurnitureConfigurator key={JSON.stringify(design)} initial={design}/></StorefrontFrame>;
}
