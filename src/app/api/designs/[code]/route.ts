import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/designs/[code] — shareCode로 디자인 조회
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;

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
      return NextResponse.json({ error: '디자인을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json(design);
  } catch (error) {
    console.error('Design fetch error:', error);
    return NextResponse.json({ error: '디자인 조회 실패' }, { status: 500 });
  }
}
