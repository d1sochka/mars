import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSessionToken } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, email, phone, password, name } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    let cleanEmail: string | null = null;
    let cleanPhone: string | null = null;

    if (type === 'email') {
      if (!email || !email.includes('@')) {
        return NextResponse.json(
          { error: 'Укажите корректный адрес электронной почты' },
          { status: 400 }
        );
      }
      cleanEmail = email.trim().toLowerCase();

      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Пользователь с такой почтой уже зарегистрирован' },
          { status: 400 }
        );
      }
    } else if (type === 'phone') {
      // Normalize phone number (keep + and digits)
      cleanPhone = (phone || '').replace(/[^\d+]/g, '');
      if (cleanPhone.length < 10) {
        return NextResponse.json(
          { error: 'Укажите корректный номер телефона (минимум 10 цифр)' },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { phone: cleanPhone },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Пользователь с таким номером телефона уже зарегистрирован' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Неверный тип регистрации (ожидается email или phone)' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        phone: cleanPhone,
        name: name?.trim() || (cleanEmail ? cleanEmail.split('@')[0] : cleanPhone),
        passwordHash,
        settings: {
          create: {
            theme: 'dark',
            audioQuality: 'high',
            preferExplicit: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Create session token and set cookie
    const token = createSessionToken(newUser.id);
    const response = NextResponse.json({
      success: true,
      user: newUser,
      message: 'Регистрация успешно завершена',
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Ошибка при регистрации' },
      { status: 500 }
    );
  }
}
