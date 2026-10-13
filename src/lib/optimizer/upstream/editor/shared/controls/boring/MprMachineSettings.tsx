import { useState } from 'react';
import { validateMprMachineProfile, type MprMachineProfile } from '@/lib/optimizer/upstream/domain/boring/mprProduction';
import { useMprMachineProfileStore } from './mprMachineProfileStore';
import styles from './MprMachineSettings.module.css';

const numericFields = [
  ['maxLength', '최대 길이 mm'], ['maxWidth', '최대 폭 mm'], ['maxThickness', '최대 두께 mm'], ['maxDrillDepth', '최대 보링 깊이 mm'],
  ['router.number', '따내기 공구 번호'], ['router.diameter', '따내기 공구 지름 mm'], ['router.cuttingLength', '공구 날길이 mm'],
  ['router.maxPassDepth', '1회 절삭 깊이 mm'], ['router.throughOvercut', '관통 여유 mm'], ['router.feedRate', '따내기 이송 m/min'], ['router.spindleSpeed', '따내기 회전수 rpm'],
  ['grooveTool.number', '홈파기 톱 공구 번호'], ['grooveTool.kerf', '홈파기 톱날 두께 mm'], ['grooveTool.maxDepth', '홈 최대 절삭 깊이 mm'], ['grooveTool.feedRate', '홈파기 이송 m/min'],
] as const;

export default function MprMachineSettings() {
  const { profile, setProfile } = useMprMachineProfileStore();
  const [message, setMessage] = useState('');
  return <details className={styles.settings} open={!profile}>
    <summary>공장 가공 설정{profile ? ` · ${profile.machineName}` : ' · 미등록'}</summary>
    <p>제조 파트너 단말에 한 번 등록하면 이후 MPR 출력에 자동 적용됩니다. 디자인 치수와 가공 위치는 공통으로 유지됩니다.</p>
    <p>가공 좌표 기준: 가공면 위 · 좌하단 원점 · 판재 바닥 Z=0. 실제 적재와 공구 운용은 공장 CAM 설정을 사용합니다.</p>
    <form onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const next: any = { id: data.get('id'), machineName: data.get('machineName'), woodwopVersion: data.get('woodwopVersion'),
        postprocessor: data.get('postprocessor'),
        origin: 'lower-left-inner-face-up', zOrigin: 'workpiece-bottom', router: {}, grooveTool: {},
        drillDiameters: String(data.get('drillDiameters')).split(',').map(v => Number(v.trim())), horizontalDrilling: data.get('horizontalDrilling') === 'on' };
      numericFields.forEach(([key]) => {
        const [section, field] = key.split('.');
        if (field) next[section][field] = Number(data.get(key)); else next[section] = Number(data.get(key));
      });
      const errors = validateMprMachineProfile(next as MprMachineProfile);
      if (errors.length) { setMessage(errors.join('\n')); return; }
      setProfile(next); setMessage('공장 가공 설정을 저장했습니다. 이후 출력에 자동 적용됩니다.');
    }}>
      <div className={styles.grid}>
        <label>공장 CAM 프로그램<select name="postprocessor" defaultValue={profile ? profile.postprocessor ?? 'woodwop' : 'swj-cam'}><option value="swj-cam">SWJ CAM (제공된 공장 프로그램)</option><option value="woodwop">HOMAG woodWOP</option></select></label>
        {([['id','장비 식별자'],['machineName','장비 이름·기종'],['woodwopVersion','CAM 프로그램 버전']] as const).map(([key,label]) =>
          <label key={key}>{label}<input name={key} required defaultValue={profile?.[key] ?? ''} /></label>)}
        <label>등록 드릴 지름 mm (쉼표 구분)<input name="drillDiameters" required defaultValue={profile?.drillDiameters.join(', ') ?? ''} /></label>
        {numericFields.map(([key,label]) => {
          const [section, field] = key.split('.');
          const value = field ? (profile as any)?.[section]?.[field] : (profile as any)?.[section];
          return <label key={key}>{label}<input name={key} type="number" step={key.endsWith('number') ? '1' : 'any'} min={key.endsWith('number') ? '1' : key.endsWith('throughOvercut') ? '0' : '0.0001'} required defaultValue={value ?? ''} /></label>;
        })}
      </div>
      <label className={styles.check}><input name="horizontalDrilling" type="checkbox" defaultChecked={profile?.horizontalDrilling ?? false} />수평 보링 지원</label>
      <button type="submit">공장 설정 저장</button>
      {message && <p role="status" className={styles.message}>{message}</p>}
    </form>
  </details>;
}
