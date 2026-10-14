# 재생 방향 화살표 교정

2026-10-14 · 왼쪽5 / codex-assembly. [기존 녹색 선](before.jpg)을 Befun 검정/흰색의 짧은 벡터로 교체했다. [삽입](insertion.jpg), [조립 슬라이드](slide.jpg), [반대 해제 방향](release.jpg), [390px 모바일](mobile.jpg).

확대율과 무관하게 일정한 화면 크기를 유지한다. 흰 윤곽으로 판재/하우징 위에서도 식별하고, 기존 3D 이동축을 카메라에 투영해 화살촉을 회전한다. 화면 아래/오른쪽으로 고정한 아이콘이 아니다. 단계 진행률에 맞춰6px 전진하며 일시정지/탐색 때 함께 정지/복원한다. 동작 줄이기 설정에서는 방향만 표시한다. 이름표 간격과 완료/주제 전환 시 숨김을 확인했다. 화살표 길이는 제조 치수나 이동거리 눈금이 아니다.

새 MotionArrow 컴포넌트를 기존 OVVO P/R·Tylko 추정3D에 소비했다. 기존 기구 pose/방향/치수/하드웨어/재질/공식 분해 절차는 그대로다. 리더의 신규 R7 원본 매뉴얼·route는 수정/게시하지 않았다. 백패널/다리 안내에 부품이 남지 않는다. SVG/DOM만 추가하며 GPU geometry/material/texture를 추가 생성하지 않는다.

최종 production build/TypeScript/17정적페이지PASS, 기존47검사PASS, 변경eslint0/0·격리전체lint 오류0/기존경고7. Chrome desktop·390×844, 정지 중 동일glyph transform, 조립/해제 각도 반전, 기존 Tylko 진입/슬라이드, 완료숨김/주제전환 DOM0, reduced-motion computed transform none, 검증콘솔 error/warn0. [상세 결과](verification.json), [41파일 소스 일치](source-fingerprint.json). 전후 캡처는 실제 브라우저 이미지다.

공유3003/.next/.git는 보존했다. 본인31789 서버만 검증에 사용했다. Git/운영READY는 [게시 인계](../PUBLISH.md)에 별도 기록한다. 실제 전체 주문 안내·정밀다리·제조승인 범위는 기존 R4 한계를 유지한다.
