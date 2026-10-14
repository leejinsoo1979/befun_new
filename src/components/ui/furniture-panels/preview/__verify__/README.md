# furniture-panels 검사 재실행 방법

프로젝트 package.json을 바꾸지 않으려고 검사 도구는 별도 작업 폴더에 둔다. `.txt` 파일은 그 폴더에 복사할 원본이다.

```bash
mkdir -p /tmp/fp-test/uitest && cd /tmp/fp-test
npm init -y >/dev/null
npm i -D vitest@3 jsdom @testing-library/react @testing-library/jest-dom
# React는 프로젝트 것을 써야 한다(중복 React 방지). npm i 후에는 다시 연결한다.
B=<befun 저장소 경로>
for p in react react-dom scheduler; do rm -rf node_modules/$p; ln -s $B/node_modules/$p node_modules/$p; done
V=$B/src/components/ui/furniture-panels/preview/__verify__
cp $V/vitest.ui.config.ts.txt vitest.ui.config.ts      # 안의 B 경로를 저장소 경로로 바꾼다
cp $V/setup.ts.txt uitest/setup.ts
cp $V/next-image.tsx.txt uitest/next-image.tsx
for f in panels family review connector legacy-r3 r4; do cp $V/$f.test.tsx.txt uitest/$f.test.tsx; done
npx vitest run -c vitest.ui.config.ts
```

2026-10-14 기준 결과: R4 기준 6개 파일 100 tests pass(r4는 리더 실제 desk-panel/wardrobe-panel adapter 사용). `legacy-r3.test.tsx`(R2.1 실제 연결 검사를 운영 표현으로 옮긴 것 + R3 사례)는 실제 `useShelfStore`·`useHardwareStore`·`useMaterialStore`를 사용한다.
