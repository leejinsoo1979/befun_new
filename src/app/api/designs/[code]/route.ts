import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured, DatabaseConfigurationError, databaseErrorDetails } from '@/lib/db';

function databaseUnavailable() {
  return NextResponse.json({
    error: '디자인 조회 서비스를 사용할 수 없습니다',
    code: 'DESIGN_STORAGE_UNAVAILABLE',
  }, { status: 503 });
}

/**
 * GET /api/designs/[code] — shareCode로 디자인 조회
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    if (!isDatabaseConfigured()) return databaseUnavailable();

    const design = await prisma.design.findUnique({
      where: { shareCode: code },
      select: {
        id: true,
        shareCode: true,
        config: true,
        thumbnailUrl: true,
        createdAt: true,
      },
    });

    if (!design) {
      return NextResponse.json({ error: '디자인을 찾을 수 없습니다', code: 'DESIGN_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(design);
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) return databaseUnavailable();
    console.error('Design fetch error:', databaseErrorDetails(error));
    return NextResponse.json({ error: '디자인 조회 실패', code: 'DESIGN_STORAGE_FAILED' }, { status: 500 });
  }
}
