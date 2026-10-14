'use client';
import { useMoney } from '@/lib/commerce/useMoney';
import { FX_SNAPSHOT } from '@/lib/commerce/quote';
export function PriceNotice() {
  const {market,language}=useMoney();
  if(market==='KR')return null;
  return <small role="note" style={{display:'block',fontSize:11,lineHeight:1.5,color:'#666',marginTop:6}}>
    {language==='ja'
      ?`参考価格 · ${FX_SNAPSHOT.date} ECB参考レート。送料・現地税別。海外注文はお見積もりをご依頼ください。`
      :`Estimated price · ECB reference rate ${FX_SNAPSHOT.date}. Local taxes and shipping excluded. Request a quote for international orders.`}
  </small>;
}
