// [Befun shim] 'firebase/firestore' 대체. Befun에서는 호출되지 않는다.
export function doc(..._args: unknown[]): never {
  throw new Error('Firestore는 Befun에서 사용하지 않습니다.');
}

export async function getDoc(..._args: unknown[]): Promise<never> {
  throw new Error('Firestore는 Befun에서 사용하지 않습니다.');
}
