'use client';

import { useShelfStore } from '@/stores/useShelfStore';
import { useMaterialStore } from '@/stores/useMaterialStore';
import { supportsLongLegs } from '@/lib/three/furniture-base';

export function FeetSelector() {
  const base = useShelfStore(s => s.baseType);
  const setBase = useShelfStore(s => s.setBaseType);
  const finish = useShelfStore(s => s.legFinish);
  const setFinish = useShelfStore(s => s.setLegFinish);
  const depth = useShelfStore(s => s.depth);
  const style = useShelfStore(s => s.style);
  const color = useMaterialStore(s => s.currentColor);
  const available = supportsLongLegs(depth, style);
  const classic = color.startsWith('C_');
  const shown = finish === 'panel' && !classic ? 'silver' : finish;
  return <>
    <div className="cfg-row">
      <span className="cfg-label">Feet</span>
      <div className="tylko-pill-group" role="group" aria-label="가구 다리">
        <button type="button" className={`tylko-pill-btn ${base === 'standard' ? 'active' : ''}`} aria-pressed={base === 'standard'} onClick={() => setBase('standard')}>Standard</button>
        <button type="button" className={`tylko-pill-btn ${base === 'legs' ? 'active' : ''}`} aria-pressed={base === 'legs'} disabled={!available}
          title={!available ? '다리는 깊이32cm 이상, Pixel 이외 스타일에서 선택할 수 있습니다.' : undefined}
          onClick={() => setBase('legs')}>Legs</button>
      </div>
    </div>
    {(color.startsWith('N_') || color.startsWith('C_')) && base === 'legs' && <div className="cfg-row">
      <span className="cfg-label">다리 색상</span>
      <div className="tylko-pill-group" role="group" aria-label="다리 색상">
        <button type="button" className={`tylko-pill-btn ${shown === 'silver' ? 'active' : ''}`} aria-pressed={shown === 'silver'} onClick={() => setFinish('silver')}>실버 메탈</button>
        <button type="button" className={`tylko-pill-btn ${shown === 'black' ? 'active' : ''}`} aria-pressed={shown === 'black'} onClick={() => setFinish('black')}>블랙</button>
        {classic && <button type="button" className={`tylko-pill-btn ${shown === 'panel' ? 'active' : ''}`} aria-pressed={shown === 'panel'} onClick={() => setFinish('panel')}>패널 색상</button>}
      </div>
    </div>}
  </>;
}
