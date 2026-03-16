import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

export async function signToken(payload: { userId: string; email: string; roleId: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; email: string; roleId: string };
  } catch {
    return null;
  }
}

export function getTokenFromCookies(cookieStore: ReturnType<typeof cookies>): string | null {
  const c = cookieStore.get('qcpilot_token');
  return c?.value || null;
}
