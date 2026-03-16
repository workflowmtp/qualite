import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: 'Déconnecté' });
  res.cookies.set('qcpilot_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  return res;
}
