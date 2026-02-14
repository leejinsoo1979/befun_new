import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateShareCode } from '@/lib/sharing';

/**
 * POST /api/designs — 디자인 저장
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { config, thumbnailUrl } = body;

    if (!config) {
      return NextResponse.json({ error: '설정값이 필요합니다' }, { status: 400 });
    }

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
    console.error('Design save error:', error);
    return NextResponse.json({ error: '디자인 저장 실패' }, { status: 500 });
  }
}

/**
 * GET /api/designs — 내 디자인 목록
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

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
    console.error('Design list error:', error);
    return NextResponse.json({ error: '디자인 목록 조회 실패' }, { status: 500 });
  }
}
