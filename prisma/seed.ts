import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL + '&connect_timeout=30&pool_timeout=30';
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  console.log('Seeding database...');

  // Create roles with comprehensive permissions
  const roleOp = await prisma.role.upsert({
    where: { id: 'role_op' },
    update: { permissions: [
      'menu.dashboard', 'menu.lots_entrants', 'menu.saisie_production', 'menu.historique',
      'lot.create', 'lot.edit_own_draft', 'lot.submit', 'lot.view_own_atelier',
      'ai.use', 'menu.qc_pilot_ai',
    ]},
    create: {
      id: 'role_op', name: 'Opérateur', level: 1,
      permissions: [
        'menu.dashboard', 'menu.lots_entrants', 'menu.saisie_production', 'menu.historique',
        'lot.create', 'lot.edit_own_draft', 'lot.submit', 'lot.view_own_atelier',
        'ai.use', 'menu.qc_pilot_ai',
      ],
    },
  });
  const roleChef = await prisma.role.upsert({
    where: { id: 'role_chef' },
    update: { permissions: [
      'menu.dashboard', 'menu.lots_entrants', 'menu.saisie_production', 'menu.validation_chef',
      'menu.non_conformites', 'menu.historique', 'menu.exports', 'menu.qc_pilot_ai',
      'lot.create', 'lot.edit_own_draft', 'lot.submit', 'lot.view_own_atelier', 'lot.view_pole', 'lot.validate_chef',
      'nc.create', 'dashboard.view_pole', 'report.export', 'ai.use',
    ]},
    create: {
      id: 'role_chef', name: "Chef d'atelier", level: 2,
      permissions: [
        'menu.dashboard', 'menu.lots_entrants', 'menu.saisie_production', 'menu.validation_chef',
        'menu.non_conformites', 'menu.historique', 'menu.exports', 'menu.qc_pilot_ai',
        'lot.create', 'lot.edit_own_draft', 'lot.submit', 'lot.view_own_atelier', 'lot.view_pole', 'lot.validate_chef',
        'nc.create', 'dashboard.view_pole', 'report.export', 'ai.use',
      ],
    },
  });
  const roleQc = await prisma.role.upsert({
    where: { id: 'role_qc' },
    update: { permissions: [
      'menu.dashboard', 'menu.lots_entrants', 'menu.qc_gate', 'menu.non_conformites',
      'menu.historique', 'menu.exports', 'menu.qc_pilot_ai',
      'lot.view_pole', 'lot.perform_qc', 'lot.release', 'lot.reserve', 'lot.block',
      'nc.create', 'nc.edit', 'nc.close', 'dashboard.view_pole', 'report.export', 'ai.use',
    ]},
    create: {
      id: 'role_qc', name: 'Contrôleur QC', level: 3,
      permissions: [
        'menu.dashboard', 'menu.lots_entrants', 'menu.qc_gate', 'menu.non_conformites',
        'menu.historique', 'menu.exports', 'menu.qc_pilot_ai',
        'lot.view_pole', 'lot.perform_qc', 'lot.release', 'lot.reserve', 'lot.block',
        'nc.create', 'nc.edit', 'nc.close', 'dashboard.view_pole', 'report.export', 'ai.use',
      ],
    },
  });
  const roleRq = await prisma.role.upsert({
    where: { id: 'role_rq' },
    update: { permissions: [
      'menu.dashboard', 'menu.lots_entrants', 'menu.qc_gate', 'menu.non_conformites',
      'menu.historique', 'menu.exports', 'menu.qc_pilot_ai', 'menu.dashboard_global',
      'menu.config_controls', 'menu.config_clients', 'menu.config_gammes',
      'lot.view_global', 'lot.perform_qc', 'lot.release', 'lot.reserve', 'lot.block',
      'nc.create', 'nc.edit', 'nc.close',
      'config.controls.create', 'config.controls.edit', 'config.controls.delete',
      'config.gammes.create', 'config.gammes.edit', 'config.gammes.delete',
      'config.techsheets.edit',
      'dashboard.view_global', 'report.export', 'ai.use',
    ]},
    create: {
      id: 'role_rq', name: 'Responsable Qualité', level: 4,
      permissions: [
        'menu.dashboard', 'menu.lots_entrants', 'menu.qc_gate', 'menu.non_conformites',
        'menu.historique', 'menu.exports', 'menu.qc_pilot_ai', 'menu.dashboard_global',
        'menu.config_controls', 'menu.config_clients', 'menu.config_gammes',
        'lot.view_global', 'lot.perform_qc', 'lot.release', 'lot.reserve', 'lot.block',
        'nc.create', 'nc.edit', 'nc.close',
        'config.controls.create', 'config.controls.edit', 'config.controls.delete',
        'config.gammes.create', 'config.gammes.edit', 'config.gammes.delete',
        'config.techsheets.edit',
        'dashboard.view_global', 'report.export', 'ai.use',
      ],
    },
  });
  // Admin gets ALL permissions
  const allPerms = [
    'menu.dashboard', 'menu.lots_entrants', 'menu.saisie_production', 'menu.validation_chef',
    'menu.qc_gate', 'menu.non_conformites', 'menu.historique', 'menu.exports', 'menu.qc_pilot_ai',
    'menu.dashboard_global', 'menu.config_controls', 'menu.config_clients', 'menu.config_gammes',
    'menu.config_poles', 'menu.config_users', 'menu.audit_log',
    'lot.create', 'lot.edit_own_draft', 'lot.edit_any_draft', 'lot.submit',
    'lot.view_own_atelier', 'lot.view_pole', 'lot.view_global',
    'lot.validate_chef', 'lot.perform_qc', 'lot.release', 'lot.reserve', 'lot.block', 'lot.delete',
    'nc.create', 'nc.edit', 'nc.close', 'nc.delete',
    'config.controls.create', 'config.controls.edit', 'config.controls.delete',
    'config.clients.create', 'config.clients.edit', 'config.clients.delete',
    'config.products.create', 'config.products.edit', 'config.products.delete',
    'config.gammes.create', 'config.gammes.edit', 'config.gammes.delete',
    'config.poles.create', 'config.poles.edit', 'config.poles.delete',
    'config.ateliers.create', 'config.ateliers.edit', 'config.ateliers.delete',
    'config.machines.create', 'config.machines.edit', 'config.machines.delete',
    'config.users.create', 'config.users.edit', 'config.users.delete',
    'config.roles.create', 'config.roles.edit', 'config.roles.delete',
    'config.techsheets.edit',
    'dashboard.view_pole', 'dashboard.view_global',
    'report.export', 'ai.use',
  ];
  const roleAdmin = await prisma.role.upsert({
    where: { id: 'role_admin' },
    update: { permissions: allPerms },
    create: { id: 'role_admin', name: 'Admin', level: 5, permissions: allPerms },
  });
  const roleDg = await prisma.role.upsert({
    where: { id: 'role_dg' },
    update: { permissions: [
      'menu.dashboard', 'menu.historique', 'menu.exports', 'menu.dashboard_global', 'menu.qc_pilot_ai',
      'lot.view_global', 'dashboard.view_global', 'report.export', 'ai.use',
    ]},
    create: {
      id: 'role_dg', name: 'Direction / DG', level: 6,
      permissions: [
        'menu.dashboard', 'menu.historique', 'menu.exports', 'menu.dashboard_global', 'menu.qc_pilot_ai',
        'lot.view_global', 'dashboard.view_global', 'report.export', 'ai.use',
      ],
    },
  });

  // Create admin user
  const hashedPw = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@qcpilot.com' },
    update: {},
    create: {
      email: 'admin@qcpilot.com',
      password: hashedPw,
      fullName: 'Administrateur',
      roleId: roleAdmin.id,
      poles: [],
      ateliers: [],
      active: true,
    },
  });

  console.log('Seed completed!');
  console.log('Admin account: admin@qcpilot.com / admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
