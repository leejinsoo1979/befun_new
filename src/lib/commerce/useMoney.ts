'use client';
import { useLocale } from './useLocale';
import { formatMoney } from './markets';
import { convertedUnitPrice } from './quote';
export function useMoney() {
  const {market,...locale}=useLocale();
  return {...locale,market,estimated:market!=='KR',
    formatPrice:(baseKrw:number)=>formatMoney(convertedUnitPrice(baseKrw,market),market),
    formatLocalPrice:(amount:number)=>formatMoney(amount,market),
  };
}
