'use client';
import { useMoney } from '@/lib/commerce/useMoney';
import { FX_SNAPSHOT } from '@/lib/commerce/quote';
export function PriceNotice({ estimated = false }: { estimated?: boolean }) {
  const {market,language}=useMoney();
  if(market==='KR' && !estimated)return null;
  return <small role="note" style={{display:'block',fontSize:11,lineHeight:1.5,color:'#666',marginTop:6}}>
    {estimated && <>{language==='ko'?'예상 견적 · 동일 구성의 기준 가격 확인이 필요합니다.':language==='ja'?'概算見積もり · 同一構成の基準価格は未確認です。':'Estimate · identical configuration price is not yet verified.'}<br /></>}
    {market!=='KR' && (language==='ja'
      ?`参考価格 · ${FX_SNAPSHOT.date} ECB参考レート。送料・現地税別。海外注文はお見積もりをご依頼ください。`
      :`Estimated price · ECB reference rate ${FX_SNAPSHOT.date}. Local taxes and shipping excluded. Request a quote for international orders.`)}
  </small>;
}
