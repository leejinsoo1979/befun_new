// [Befun shim] 250709in 설계 파일(Firebase) 불러오기는 Befun에서 지원하지 않는다.
export async function getDesignFileById(_id: string): Promise<{ designFile: { name?: string } | null; error: string | null }> {
  return { designFile: null, error: 'Befun에서는 지원하지 않는 기능입니다.' };
}
