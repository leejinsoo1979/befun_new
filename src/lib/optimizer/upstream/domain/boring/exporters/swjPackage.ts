import type { MprMachineProfile } from '../mprProduction';

/** 패널 파일과 분리하여 assembly.json의 패널 순서를 보존한다. */
export function getMprCompanionFiles(profile?: MprMachineProfile): Array<{ filename: string; content: string }> {
  if (profile?.postprocessor !== 'swj-cam') return [];
  return [
    { filename: 'SWJ/KnifeMap.txt', content: `${profile.router.number} ${profile.router.diameter}\r\n` },
    {
      filename: 'SWJ/README.txt',
      content: [
        'SWJ CAM 공장 설정',
        `프로필: ${profile.id} / ${profile.machineName}`,
        'KnifeMap.txt는 이 주문의 밀링 공구 번호와 직경(mm) 대응표입니다.',
        '공장 프로그램의 Setting/KnifeMap.txt에 해당 행을 병합하세요. 기존 다른 공구의 행을 덮어쓰지 마세요.',
        '같은 번호의 직경이 다르면 실제 장착 공구와 주문 프로필을 먼저 일치시키세요.',
        'MPR 109 홈의 공구 선택 및 최종 이송·회전·적재·고정 설정은 공장 CAM에서 적용합니다.',
        '이 파일은 장비 설정을 자동으로 변경하지 않습니다.',
      ].join('\r\n') + '\r\n',
    },
  ];
}
