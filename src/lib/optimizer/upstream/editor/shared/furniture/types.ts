// [Befun shim] 250709in 가구 모듈 타입. Befun에는 배치 모듈이 없어 placedModules는 항상 빈 배열이다.
// 원본 PlacedModule은 수백 개 필드라 옮기지 않고 any로 둔다(값이 항상 빈 배열이므로 런타임 영향 없음).
/* eslint-disable @typescript-eslint/no-explicit-any */
export type PlacedModule = any;
