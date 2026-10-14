# 신규 클래식 그린

2026-10-14 · codex-storefront · 로컬 적용/이번 커밋·푸시 미수행.

사용자 요청을 기존 모스그린 확인으로 오해한 뒤 정정 수신. 기존 C_Moss Green(#6B6C56)을 유지하고 별도 C_Green을 추가했습니다. 색조 질문 후 응답 없이 독립 작업을 진행했으며, 초기에는 비펀 버튼 녹색 #339922로 적용했으나 후속 캡처 지시로 최종색을 Sand+Green 엣지 #034A22로 정정했습니다. UI 표기는 그린/Green/グリーン.

변경: ColorPicker CLASSIC_COLORS 신규행, reference-colors 공통 클래식 표면색 신규항목(사용자 요청 Befun 확장임을 주석), desk-panel 그린라벨, ui-dictionary 번역. 선반/CNC/클래식 책상은 기존 공통색표 소비로 연결, 표면과 합판 노출단면 유지. 저장구조/카메라/geometry/가격공식 수정 없음.

검증:
- 실제 Chrome3003/configurator: 클래식에서 그린·모스그린 두 항목 존재, 신규그린 선택 active 및 녹색3D/합판단면 확인.
- 실제 Chrome3003/reference-product/desk-1: 신규그린 radio 선택/표면·앞판 확인. 링크공유 클릭 후 actual URL furniture-design/desk-classic?design=…C_Green…로 변경, 새로고침 후 그린 Value1/모스그린0 유지. clipboard API는 빈값이어서 클립보드 복사 성공은 별도 인증하지 않음.
- Node 계약검증: 선반 로컬 parse·기존 URL codec C_Green 보존, CNC 대표색#339922/edgeBand null/스와치 등록, desk-1/3 신규 색상 intent 후 local/URL roundtrip와 구획ID 보존 PASS.
- 기존 catalog/Natural 회귀13/13 PASS, 변경4파일 ESLint/diffcheck PASS. 전체 lint 오류0/기존경고8. 통합src격리 스냅샷에 4파일 반영 후 webpack production build·TypeScript24페이지 PASS.

범위 한계: 신규색상의 원본 Tylko materialId/사진은 없으므로 모스그린 ID나 사진에 별칭으로 연결하지 않았습니다. 선반은 기존 미확인색상 예상견적 경로를 사용하며 실제 화면에 예상견적 표시 확인. 신규색상 가격인증/DB 저장/계정·결제·운영배포는 이번 검증 대상 아님. 신규그린 원본사진 세트 없음; 기존 명시된 디자인 예시 갤러리 유지. 옷장 제품군색목록은 이번 변경 대상 아님.

이번 좁은 소유영역 잠금 해제.

## 후속: 믹스 엣지와 같은 그린 / 단색 추가

사용자 캡처의 믹스 Sand+Green 엣지 runtime 기준 #034A22를 C_Green에 적용했습니다. 기존 edge에는 solidDisplayColor linear gain1.25/lift0.038 보정이 있으므로, C_Green의 선반·책상·CNC 표면에도 같은 보정을 사용합니다. C_Green만 roughness0.5/envMapIntensity1로 기존 믹스 엣지와 맞추며 다른 클래식색은 기존값 유지. 합판 단면 유지.

추가 지시에 따라 단색탭에 기존 S_Green 키를 별도 노출했습니다. 기존 material factory의 #034A22 및 밝기보정 경로를 그대로 사용, CNC 이미 등록된 같은 키를 사용합니다. 견본은 기존 public/imgs/solid_color/solid-green.svg (#034A22)로 연결해 empty Image 경로 없이 로드. 원본사진/가격 materialId 임의매핑 없음.

추가검증: Node mocked TextureLoader 검증으로 C_Green 표면3종의 linear RGB/roughness/envMapIntensity가 실제 mix.verticalEdge와 동일, 합판엣지map·Moss색 보존 PASS. Chrome3003 클래식그린 짙은녹색, 단색그린 전체면 짙은녹색+그린이미지 decoded/active, desk-1 그린 앞판/표면 확인. 최종 5소스 scoped lint/diffcheck PASS, 전체lint0오류8기존경고, 최종5소스 반영격리build/TypeScript24페이지PASS. 렌더색 파라미터 동일성 확인이며 서로 다른 형상/시점의 screenshot 픽셀 동일성 측정은 아님.

최종좁은잠금해제: reference-colors C_Green, Shelf/FurnitureScene/previewMaterials C_Green 표면보정, ColorPicker S_Green 항목/견본경로, 본인인계. 로컬적용·이번커밋/푸시미수행.

## 2026-10-15 게시 검증

최신 origin/main 3f5c1c9의 독립 사본에서 Natural W4/W2·클래식/단색 그린·보기 외부클릭 완료영역만 추출했습니다. 가격/소파/아바타/카메라/다른 담당 WIP 제외. 완료된 우드 가로결 회전 및 W4 linear gain3.5를 재질 의존 변경으로 포함하고, materials.ts map 회전 보존 +=2행만 반영했습니다. 전체 lint 오류0/기존경고8, webpack production build·TypeScript23페이지 PASS, 재질/상품/사진 회귀16/16 및 그린 재질/책상 복원 계약 PASS. 운영 배포 READY 확인과 구분됩니다.

게시 직전 원격 8c50bc6(조립바·옷장 Space·Natural 재질 연결/자산)이 선행되어 재기반했습니다. 동일 Natural 자산/loader/회전은 선행 커밋을 그대로 소비하며 재추가하지 않습니다. 포맷/라벨 계산만 겹친 네 파일 병합, 앞선 완료 변경 유지. 최종 본인 커밋은 그린·보기 외부클릭·재질 검사/인계가 중심입니다.
