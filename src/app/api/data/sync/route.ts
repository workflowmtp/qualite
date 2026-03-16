import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('qcpilot_token')?.value;
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

    const { table, action, data, id } = await req.json();

    const modelMap: Record<string, any> = {
      poles: prisma.pole,
      ateliers: prisma.atelier,
      machines: prisma.machine,
      gammes: prisma.gamme,
      transitions: prisma.transition,
      controlLibrary: prisma.control,
      clients: prisma.client,
      products: prisma.product,
      productTechSheets: prisma.productTechSheet,
      lots: prisma.lot,
      lotSteps: prisma.lotStep,
      lotResults: prisma.lotResult,
      qcDecisions: prisma.qcDecision,
      qcResults: prisma.qcResult,
      nonConformities: prisma.nonConformity,
      drafts: prisma.draft,
      auditLog: prisma.auditLog,
      users: prisma.user,
      roles: prisma.role,
    };

    const model = modelMap[table];
    if (!model) return NextResponse.json({ error: `Table inconnue: ${table}` }, { status: 400 });

    let result;
    if (action === 'create') {
      // Convert timestamp fields to Date for relevant tables
      const cleaned = convertTimestamps(table, data);
      result = await model.create({ data: cleaned });
    } else if (action === 'update') {
      if (!id) return NextResponse.json({ error: 'ID requis pour update' }, { status: 400 });
      const cleaned = convertTimestamps(table, data);
      result = await model.update({ where: { id }, data: cleaned });
    } else if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'ID requis pour delete' }, { status: 400 });
      result = await model.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 });
  }
}

function convertTimestamps(table: string, data: any) {
  const d = { ...data };
  // Remove id for create (Prisma generates it)
  // Convert number timestamps to Date objects
  const dateFields: Record<string, string[]> = {
    lots: ['createdAt', 'updatedAt'],
    lotSteps: ['enteredAt', 'completedAt', 'validatedAt'],
    lotResults: ['timestamp'],
    qcResults: ['timestamp'],
    qcDecisions: ['timestamp'],
    nonConformities: ['createdAt', 'closedAt'],
    drafts: ['createdAt', 'updatedAt'],
    auditLog: ['timestamp'],
  };

  const fields = dateFields[table] || [];
  for (const f of fields) {
    if (d[f] !== undefined && d[f] !== null && typeof d[f] === 'number') {
      d[f] = new Date(d[f]);
    }
  }
  return d;
}
