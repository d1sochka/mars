import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Введите логин (почту или номер телефона) и пароль' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();
    const cleanPhone = cleanIdentifier.replace(/[^\d+]/g, '');

    // Search user by email OR phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier.toLowerCase() },
          { phone: cleanIdentifier },
          ...(cleanPhone.length >= 10 ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Неверная почта/телефон или пароль' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверная почта/телефон или пароль' },
        { status: 401 }
      );
    }

    const token = createSessionToken(user.id);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set('mars_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ошибка при входе в систему' },
      { status: 500 }
    );
  }
}
