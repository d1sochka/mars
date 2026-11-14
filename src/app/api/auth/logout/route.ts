import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Сеанс завершен' });
  response.cookies.delete('mars_session');
  return response;
}
