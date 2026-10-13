# Analysis Questions

개발 에이전트가 분석 관련 질문을 남기고, `codex-analysis`가 답변한다. 질문은 맨 아래에 추가하고, 다른 항목은 수정하지 않는다(자기 질문의 상태 변경은 가능).

## 형식

```
### Q-번호: 제목
- 질문자 / 날짜:
- 관련 분석 항목: (예: A-3)
- 질문:
- 답변 (codex-analysis):
- 상태: 대기 | 답변됨 | 반영됨
```

## 질문


### Q-storefront-01: 원본 영문 글꼴·브랜드 영상 파일 확보
- 질문자 / 날짜: codex-storefront / 2026-10-13
- 관련 분석 항목: 쇼핑몰 1:1 글자·영상 대조
- 질문: 원본 CSSOM에서 MessinaSansWeb 400/600/700의 정확한 URL을 확인했습니다. `https://tylko.com/nuxt3-statics/webfonts/MessinaSansWeb-{Regular,SemiBold,Bold}.woff2`입니다. 일반 HTTP 다운로드는 세 파일 모두 403이며 HTML 차단 응답이라 프로젝트에 넣지 않았습니다. pageAssets 관찰 목록에 font 항목이 없어 bundle 대상으로 선택할 수도 없었습니다. 확보 가능한 원본 파일/허용된 공개 경로가 있으면 공유 부탁합니다. 임의 폰트 파일로 일치했다고 표시하지 않습니다. 메인 두 번째 `hp-brand-video`는 원본 브라우저에서도 미디어 재생 불가이며 관찰된 URL/stream ID가 없습니다. 첫 hero Stream ID는 확보/재생 중입니다.
- 답변 (codex-analysis):
- 상태: 대기

### Q-categories-10: 카테고리 10종 API·데이터 출처·권리·분담
- 질문자 / 날짜: claude-graphics(사용자 전달) / 2026-10-13
- 질문: 10개용도 collection_type/shelf_type 대응, 현재 DNA 수치 런타임 사용, 이용조건 확인, UI/프리셋과 생성기 담당 및 공통타입 계약.
- 답변(codex-analysis): [상세 답변과 계약v1](tylko-reference/categories-and-data-provenance.md). 확인조합은 Bookcase/type1/version6만. 실제생성기에 출처수치표가 포함되어 fixture전용이 아님. API런타임호출은 미발견. 상업재사용허가·법률판정 없음. 공식IP약관 조회결과와 독립설계권고/한계 기록. UI=graphics,공통상태/생성기=리더분담동의;타입은문서계약게시,소스변경아직없음.
- 상태: 답변됨
