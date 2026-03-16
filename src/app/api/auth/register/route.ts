import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }
    // Get default role (Opérateur) or first role
    let defaultRole = await prisma.role.findFirst({ where: { name: 'Opérateur' } });
    if (!defaultRole) {
      defaultRole = await prisma.role.findFirst({ orderBy: { level: 'asc' } });
    }
    if (!defaultRole) {
      return NextResponse.json({ error: 'Aucun rôle configuré. Contactez l\'administrateur.' }, { status: 500 });
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        fullName,
        roleId: defaultRole.id,
        poles: [],
        ateliers: [],
        active: true,
      },
      include: { role: true },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, role: defaultRole.name, action: 'register', newValue: 'Inscription' },
    });

    const token = await signToken({ userId: user.id, email: user.email, roleId: user.roleId });
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roleId: user.roleId,
        poles: user.poles,
        ateliers: user.ateliers,
        active: user.active,
        role: user.role,
      },
      token,
    });
    res.cookies.set('qcpilot_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 });
  }
}
