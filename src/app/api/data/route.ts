import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('qcpilot_token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const [
      roles, users, poles, ateliers, machines, gammes, transitions,
      controlLibrary, clients, products, productTechSheets,
      lots, lotSteps, lotResults, qcDecisions, qcResults,
      nonConformities, drafts, auditLog,
    ] = await Promise.all([
      prisma.role.findMany(),
      prisma.user.findMany({ select: { id: true, email: true, fullName: true, roleId: true, poles: true, ateliers: true, active: true } }),
      prisma.pole.findMany(),
      prisma.atelier.findMany({ orderBy: { order: 'asc' } }),
      prisma.machine.findMany(),
      prisma.gamme.findMany(),
      prisma.transition.findMany({ orderBy: { order: 'asc' } }),
      prisma.control.findMany(),
      prisma.client.findMany(),
      prisma.product.findMany(),
      prisma.productTechSheet.findMany(),
      prisma.lot.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.lotStep.findMany({ orderBy: { stepIndex: 'asc' } }),
      prisma.lotResult.findMany({ orderBy: { timestamp: 'desc' } }),
      prisma.qcDecision.findMany({ orderBy: { timestamp: 'desc' } }),
      prisma.qcResult.findMany({ orderBy: { timestamp: 'desc' } }),
      prisma.nonConformity.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.draft.findMany({ orderBy: { updatedAt: 'desc' } }),
      prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 500 }),
    ]);

    // Build rolePermissions map
    const rolePermissions: Record<string, string[]> = {};
    roles.forEach((r) => { rolePermissions[r.id] = r.permissions; });

    // Build permissions list from all roles
    const allPerms = new Set<string>();
    roles.forEach((r) => r.permissions.forEach((p) => allPerms.add(p)));

    // Map users to expected format (email as username for backward compat)
    const mappedUsers = users.map((u) => ({
      id: u.id,
      username: u.email,
      password: '',
      fullName: u.fullName,
      roleId: u.roleId,
      poles: u.poles,
      ateliers: u.ateliers,
      active: u.active,
    }));

    // Map lots: convert Date to timestamp
    const mappedLots = lots.map((l) => ({
      ...l, createdAt: l.createdAt.getTime(), updatedAt: l.updatedAt.getTime(),
      customTargets: l.customTargets || {}, inks: l.inks || [],
    }));
    const mappedLotSteps = lotSteps.map((s) => ({
      ...s, enteredAt: s.enteredAt.getTime(), completedAt: s.completedAt?.getTime() || null, validatedAt: s.validatedAt?.getTime() || null,
    }));
    const mappedLotResults = lotResults.map((r) => ({ ...r, timestamp: r.timestamp.getTime() }));
    const mappedQcResults = qcResults.map((r) => ({ ...r, timestamp: r.timestamp.getTime() }));
    const mappedQcDecisions = qcDecisions.map((d) => ({ ...d, timestamp: d.timestamp.getTime() }));
    const mappedNCs = nonConformities.map((nc) => ({
      ...nc, createdAt: nc.createdAt.getTime(), closedAt: nc.closedAt?.getTime() || null,
    }));
    const mappedDrafts = drafts.map((d) => ({
      ...d, createdAt: d.createdAt.getTime(), updatedAt: d.updatedAt.getTime(),
      measures: d.measures || {}, checks: d.checks || {}, customTargets: d.customTargets || {}, inks: d.inks || [],
    }));
    const mappedAuditLog = auditLog.map((a) => ({ ...a, timestamp: a.timestamp.getTime() }));

    const db = {
      version: 73,
      users: mappedUsers,
      roles,
      permissions: [...allPerms],
      poles,
      ateliers,
      machines,
      gammes,
      transitions,
      controlLibrary,
      lots: mappedLots,
      lotSteps: mappedLotSteps,
      lotResults: mappedLotResults,
      qcDecisions: mappedQcDecisions,
      qcResults: mappedQcResults,
      nonConformities: mappedNCs,
      drafts: mappedDrafts,
      auditLog: mappedAuditLog,
      clients,
      products,
      productTechSheets,
      rolePermissions,
    };

    return NextResponse.json(db);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 });
  }
}
