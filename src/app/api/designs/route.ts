import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, isDatabaseConfigured, DatabaseConfigurationError, databaseErrorDetails } from '@/lib/db';
import { generateShareCode } from '@/lib/sharing';

function databaseUnavailable() {
  return NextResponse.json({
    error: '디자인 저장 서비스를 사용할 수 없습니다',
    code: 'DESIGN_STORAGE_UNAVAILABLE',
  }, { status: 503 });
}

/**
 * POST /api/designs — 디자인 저장
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '유효한 JSON 설정값이 필요합니다', code: 'INVALID_DESIGN' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || !body.config || typeof body.config !== 'object' || Array.isArray(body.config)) {
      return NextResponse.json({ error: '설정값이 필요합니다', code: 'INVALID_DESIGN' }, { status: 400 });
    }
    const { config, thumbnailUrl } = body;
    if (!isDatabaseConfigured()) return databaseUnavailable();

    const shareCode = generateShareCode();

    const design = await prisma.design.create({
      data: {
        shareCode,
        config,
        thumbnailUrl: thumbnailUrl ?? null,
        userId: session?.user?.id ?? null,
      },
    });

    return NextResponse.json({
      id: design.id,
      shareCode: design.shareCode,
    });
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) return databaseUnavailable();
    console.error('Design save error:', databaseErrorDetails(error));
    return NextResponse.json({ error: '디자인 저장 실패', code: 'DESIGN_STORAGE_FAILED' }, { status: 500 });
  }
}

/**
 * GET /api/designs — 내 디자인 목록
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요', code: 'AUTH_REQUIRED' }, { status: 401 });
    }
    if (!isDatabaseConfigured()) return databaseUnavailable();

    const designs = await prisma.design.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shareCode: true,
        config: true,
        thumbnailUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json(designs);
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) return databaseUnavailable();
    console.error('Design list error:', databaseErrorDetails(error));
    return NextResponse.json({ error: '디자인 목록 조회 실패', code: 'DESIGN_STORAGE_FAILED' }, { status: 500 });
  }
}
