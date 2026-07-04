import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/me/`, {
      method: 'GET',
      cache: 'no-store',
    });
    return NextResponse.json({ status: 'ok', backendStatus: res.status });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Backend unreachable' }, { status: 503 });
  }
}
