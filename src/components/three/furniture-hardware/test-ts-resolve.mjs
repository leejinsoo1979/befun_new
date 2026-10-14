// 테스트 전용: 확장자 없는 상대 import를 .ts로 해석 (제품 코드 import 형식 유지)
// 사용: node --import ./src/components/three/furniture-hardware/test-ts-resolve.mjs <test>
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  if ((spec.startsWith('./') || spec.startsWith('../')) && !/\\.[cm]?[jt]sx?$/.test(spec)) {
    try { return await next(spec + '.ts', ctx); } catch {}
  }
  return next(spec, ctx);
}`));
