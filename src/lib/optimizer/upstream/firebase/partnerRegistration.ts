// [Befun shim] 250709in 파트너 등록 요청(Firebase Functions)은 Befun에서 지원하지 않는다.
export interface PartnerRegistrationInput {
  message: string;
}

export interface PartnerRegistrationResult {
  ok: boolean;
  requestId: string;
}

export async function sendPartnerRegistrationRequest(_input: PartnerRegistrationInput): Promise<PartnerRegistrationResult> {
  throw new Error('Befun에서는 지원하지 않는 기능입니다.');
}
