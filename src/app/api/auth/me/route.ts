import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth/password';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('mars_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }

    const session = verifySessionToken(sessionCookie);
    if (!session || !session.userId) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ user: user || null });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
