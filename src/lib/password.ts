import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

/** 비밀번호 해시: `scrypt$<salt hex>$<hash hex>` (Node 내장 scrypt, 추가 패키지 없음) */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** 가입 비밀번호 규칙: 8자 이상, 영문과 숫자 포함 */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
  if (password.length > 128) return '비밀번호가 너무 깁니다.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return '비밀번호에 영문과 숫자를 모두 넣어 주세요.';
  return null;
}
