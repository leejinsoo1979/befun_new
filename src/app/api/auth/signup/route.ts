import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { hashPassword, passwordProblem } from '@/lib/password';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 이메일 회원가입. 성공하면 클라이언트가 credentials로 바로 로그인한다. */
export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: '회원 저장소가 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '입력값을 확인해 주세요.' }, { status: 400 }); }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 40) : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!name) return NextResponse.json({ error: '이름을 입력해 주세요.', field: 'name' }, { status: 400 });
  if (!EMAIL.test(email) || email.length > 254) return NextResponse.json({ error: '올바른 이메일 주소를 입력해 주세요.', field: 'email' }, { status: 400 });
  const problem = passwordProblem(password);
  if (problem) return NextResponse.json({ error: problem, field: 'password' }, { status: 400 });
  if (body.agreeTerms !== true || body.agreePrivacy !== true) {
    return NextResponse.json({ error: '필수 약관에 동의해 주세요.', field: 'terms' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { passwordHash: true } });
  if (existing) {
    return NextResponse.json({
      error: existing.passwordHash ? '이미 가입된 이메일입니다. 로그인해 주세요.' : '구글·네이버 등 소셜 계정으로 가입된 이메일입니다. 해당 버튼으로 로그인해 주세요.',
      field: 'email',
    }, { status: 409 });
  }

  await prisma.user.create({
    data: {
      name, email,
      passwordHash: await hashPassword(password),
      termsAgreedAt: new Date(),
      marketingAgreed: body.marketing === true,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
