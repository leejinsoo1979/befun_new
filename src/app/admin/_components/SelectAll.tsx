'use client';

/** 같은 form 안의 name="ids" 체크박스를 모두 선택/해제 */
export function SelectAll({ label = '전체 선택' }: { label?: string }) {
  return (
    <input type="checkbox" aria-label={label} style={{ width: 16, height: 16 }}
      onChange={(e) => e.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((c) => { c.checked = e.currentTarget.checked; })} />
  );
}
