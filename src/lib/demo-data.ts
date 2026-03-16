import { Database } from '@/types';

export function initDemoData(): Database {
  const D: Database = {
    version: 73,
    users: [],
    roles: [],
    permissions: [],
    poles: [],
    ateliers: [],
    machines: [],
    gammes: [],
    transitions: [],
    controlLibrary: [],
    lots: [],
    lotSteps: [],
    lotResults: [],
    qcDecisions: [],
    qcResults: [],
    nonConformities: [],
    drafts: [],
    auditLog: [],
    clients: [],
    products: [],
    productTechSheets: [],
    rolePermissions: {},
  };

  D.roles = [
    { id: 'role_op', name: 'Opérateur', level: 1 },
    { id: 'role_chef', name: "Chef d'atelier", level: 2 },
    { id: 'role_qc', name: 'Contrôleur QC', level: 3 },
    { id: 'role_rq', name: 'Responsable Qualité', level: 4 },
    { id: 'role_admin', name: 'Admin', level: 5 },
    { id: 'role_dg', name: 'Direction / DG', level: 6 },
  ];

  D.permissions = [
    'lot.create', 'lot.edit_own_draft', 'lot.submit', 'lot.view_own_atelier',
    'lot.view_pole', 'lot.view_global', 'lot.validate_chef', 'lot.perform_qc',
    'lot.release', 'lot.reserve', 'lot.block', 'nc.create', 'nc.edit', 'nc.close',
    'config.manage_controls', 'config.manage_ranges', 'config.manage_transitions',
    'config.manage_poles', 'config.manage_users', 'dashboard.view_pole',
    'dashboard.view_global', 'report.export', 'ai.use',
  ];

  D.rolePermissions = {
    role_op: ['lot.create', 'lot.edit_own_draft', 'lot.submit', 'lot.view_own_atelier', 'ai.use'],
    role_chef: ['lot.create', 'lot.edit_own_draft', 'lot.submit', 'lot.view_own_atelier', 'lot.view_pole', 'lot.validate_chef', 'nc.create', 'dashboard.view_pole', 'report.export', 'ai.use'],
    role_qc: ['lot.view_pole', 'lot.perform_qc', 'lot.release', 'lot.reserve', 'lot.block', 'nc.create', 'nc.edit', 'nc.close', 'dashboard.view_pole', 'report.export', 'ai.use'],
    role_rq: ['lot.view_global', 'lot.perform_qc', 'lot.release', 'lot.reserve', 'lot.block', 'nc.create', 'nc.edit', 'nc.close', 'config.manage_controls', 'config.manage_ranges', 'config.manage_transitions', 'dashboard.view_global', 'report.export', 'ai.use'],
    role_admin: [...D.permissions],
    role_dg: ['lot.view_global', 'dashboard.view_global', 'report.export', 'ai.use'],
  };

  D.poles = [
    { id: 'pole_oe', name: 'Offset Étiquette', code: 'OE', color: '#00d4aa' },
    { id: 'pole_oc', name: 'Offset Carton', code: 'OC', color: '#3b82f6' },
    { id: 'pole_cap', name: 'Capsule', code: 'CAP', color: '#f59e0b' },
    { id: 'pole_hf', name: 'Héliogravure Flexible', code: 'HF', color: '#a855f7' },
  ];

  D.ateliers = [
    { id: 'at_oe_imp', poleId: 'pole_oe', name: 'Impression', code: 'OE-IMP', order: 1 },
    { id: 'at_oe_dec', poleId: 'pole_oe', name: 'Coupe / Découpe', code: 'OE-DEC', order: 2 },
    { id: 'at_oe_fac', poleId: 'pole_oe', name: 'Façonnage', code: 'OE-FAC', order: 3 },
    { id: 'at_oc_imp', poleId: 'pole_oc', name: 'Impression', code: 'OC-IMP', order: 1 },
    { id: 'at_oc_dec', poleId: 'pole_oc', name: 'Coupe / Découpe', code: 'OC-DEC', order: 2 },
    { id: 'at_oc_fac', poleId: 'pole_oc', name: 'Façonnage', code: 'OC-FAC', order: 3 },
    { id: 'at_cap_imp', poleId: 'pole_cap', name: 'Impression Offset Tôle', code: 'CAP-IMP', order: 1 },
    { id: 'at_cap_laq', poleId: 'pole_cap', name: 'Laquage des Tôles', code: 'CAP-LAQ', order: 2 },
    { id: 'at_cap_emb', poleId: 'pole_cap', name: 'Emboutissage / Pose Joint', code: 'CAP-EMB', order: 3 },
    { id: 'at_hf_imp', poleId: 'pole_hf', name: 'Impression Hélio', code: 'HF-IMP', order: 1 },
    { id: 'at_hf_cpx', poleId: 'pole_hf', name: 'Complexage', code: 'HF-CPX', order: 2 },
    { id: 'at_hf_ext', poleId: 'pole_hf', name: 'Extrusion Film PE', code: 'HF-EXT', order: 3 },
    { id: 'at_hf_ref', poleId: 'pole_hf', name: 'Refente / Façonnage', code: 'HF-REF', order: 4 },
  ];

  const machDefs = [
    { a: 'at_oe_imp', m: ['Heidelberg SM74-OE', 'Heidelberg SM52-OE', 'Komori LS40-OE'] },
    { a: 'at_oe_dec', m: ['Bobst SP102-OE', 'Polar 115-OE'] },
    { a: 'at_oe_fac', m: ['Ligne Façonnage 1-OE', 'Ligne Façonnage 2-OE'] },
    { a: 'at_oc_imp', m: ['Heidelberg CD102-OC', 'KBA Rapida 106-OC'] },
    { a: 'at_oc_dec', m: ['Bobst Expertcut-OC', 'Bobst SP130-OC'] },
    { a: 'at_oc_fac', m: ['Brausse BF750-OC', 'Ligne Collage-OC'] },
    { a: 'at_cap_imp', m: ['Crabtree Marquess-CAP', 'Mailänder 222-CAP'] },
    { a: 'at_cap_laq', m: ['Ligne Laquage 1-CAP', 'Ligne Laquage 2-CAP'] },
    { a: 'at_cap_emb', m: ['Presse Emboutissage 1-CAP', 'Presse Emboutissage 2-CAP'] },
    { a: 'at_hf_imp', m: ['Rotomec RS4002-HF', 'Bobst CL850-HF'] },
    { a: 'at_hf_cpx', m: ['Nordmeccanica Simplex-HF', 'Ligne Complexage 2-HF'] },
    { a: 'at_hf_ext', m: ['Extrudeuse Bandera-HF', 'Extrudeuse Ghioldi-HF'] },
    { a: 'at_hf_ref', m: ['Refendeuse Titan SR9-HF', 'Refendeuse Atlas-HF'] },
  ];
  machDefs.forEach((x) => {
    x.m.forEach((n, i) => {
      D.machines.push({ id: 'mach_' + x.a + '_' + i, atelierId: x.a, name: n, active: true });
    });
  });

  D.gammes = [
    { id: 'gam_oe_std', poleId: 'pole_oe', name: 'Gamme Standard Étiquette', steps: ['at_oe_imp', 'at_oe_dec', 'at_oe_fac'] },
    { id: 'gam_oe_short', poleId: 'pole_oe', name: 'Gamme Étiquette Sans Façonnage', steps: ['at_oe_imp', 'at_oe_dec'] },
    { id: 'gam_oc_std', poleId: 'pole_oc', name: 'Gamme Standard Carton', steps: ['at_oc_imp', 'at_oc_dec', 'at_oc_fac'] },
    { id: 'gam_oc_imp', poleId: 'pole_oc', name: 'Gamme Carton Impression Seule', steps: ['at_oc_imp'] },
    { id: 'gam_cap_std', poleId: 'pole_cap', name: 'Gamme Standard Capsule', steps: ['at_cap_imp', 'at_cap_laq', 'at_cap_emb'] },
    { id: 'gam_cap_laq', poleId: 'pole_cap', name: 'Gamme Capsule Sans Impression', steps: ['at_cap_laq', 'at_cap_emb'] },
    { id: 'gam_hf_std', poleId: 'pole_hf', name: 'Gamme Standard Hélio Flexible', steps: ['at_hf_imp', 'at_hf_cpx', 'at_hf_ext', 'at_hf_ref'] },
    { id: 'gam_hf_short', poleId: 'pole_hf', name: 'Gamme Hélio Sans Extrusion', steps: ['at_hf_imp', 'at_hf_cpx', 'at_hf_ref'] },
  ];

  D.gammes.forEach((g) => {
    for (let i = 0; i < g.steps.length - 1; i++) {
      D.transitions.push({
        id: 'tr_' + g.id + '_' + i,
        gammeId: g.id,
        poleId: g.poleId,
        fromAtelierId: g.steps[i],
        toAtelierId: g.steps[i + 1],
        order: i + 1,
        mandatory: true,
      });
    }
  });

  const controlDefs = [
    { a: 'at_oe_imp', c: [
      { n: 'Densité Cyan', cat: 'Densitométrie', t: 'measure' as const, tgt: 1.45, tol: 0.10, u: 'D', ins: 'Densitomètre' },
      { n: 'Densité Magenta', cat: 'Densitométrie', t: 'measure' as const, tgt: 1.40, tol: 0.10, u: 'D', ins: 'Densitomètre' },
      { n: 'Densité Jaune', cat: 'Densitométrie', t: 'measure' as const, tgt: 1.05, tol: 0.10, u: 'D', ins: 'Densitomètre' },
      { n: 'Densité Noir', cat: 'Densitométrie', t: 'measure' as const, tgt: 1.70, tol: 0.10, u: 'D', ins: 'Densitomètre' },
      { n: 'ΔE moyen', cat: 'Colorimétrie', t: 'measure' as const, tgt: 0, tol: 3.0, u: 'ΔE', ins: 'Spectrophotomètre' },
      { n: 'Repérage', cat: 'Impression', t: 'measure' as const, tgt: 0, tol: 0.15, u: 'mm', ins: 'Compte-fils' },
      { n: 'Conformité BAT', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
      { n: 'Aspect visuel', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_oe_dec', c: [
      { n: 'Précision découpe', cat: 'Dimensionnel', t: 'measure' as const, tgt: 0, tol: 0.3, u: 'mm', ins: 'Réglet' },
      { n: 'Comptage conforme', cat: 'Comptage', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
      { n: 'Absence bavures', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_oe_fac', c: [
      { n: 'Conformité façonnage', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
      { n: 'Conditionnement conforme', cat: 'Emballage', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_oc_imp', c: [
      { n: 'Densité Cyan', cat: 'Densitométrie', t: 'measure' as const, tgt: 1.50, tol: 0.12, u: 'D', ins: 'Densitomètre' },
      { n: 'Densité Magenta', cat: 'Densitométrie', t: 'measure' as const, tgt: 1.45, tol: 0.12, u: 'D', ins: 'Densitomètre' },
      { n: 'Densité Jaune', cat: 'Densitométrie', t: 'measure' as const, tgt: 1.10, tol: 0.12, u: 'D', ins: 'Densitomètre' },
      { n: 'Densité Noir', cat: 'Densitométrie', t: 'measure' as const, tgt: 1.75, tol: 0.12, u: 'D', ins: 'Densitomètre' },
      { n: 'Repérage', cat: 'Impression', t: 'measure' as const, tgt: 0, tol: 0.2, u: 'mm', ins: 'Compte-fils' },
      { n: 'Conformité BAT', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_oc_dec', c: [
      { n: 'Dimensions feuille', cat: 'Dimensionnel', t: 'measure' as const, tgt: 0, tol: 0.5, u: 'mm', ins: 'Réglet' },
      { n: 'Qualité rainage', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
      { n: 'Casse fibres', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_oc_fac', c: [
      { n: 'Pliage conforme', cat: 'Dimensionnel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
      { n: 'Collage conforme', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
      { n: 'Aspect final', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_cap_imp', c: [
      { n: 'Densité impression tôle', cat: 'Densitométrie', t: 'measure' as const, tgt: 1.35, tol: 0.10, u: 'D', ins: 'Densitomètre' },
      { n: 'ΔE tôle', cat: 'Colorimétrie', t: 'measure' as const, tgt: 0, tol: 0.5, u: 'ΔE', ins: 'Spectrophotomètre' },
      { n: 'Conformité BAT tôle', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_cap_laq', c: [
      { n: 'Épaisseur laque', cat: 'Épaisseur', t: 'measure' as const, tgt: 5.0, tol: 1.0, u: 'µm', ins: 'Micromètre' },
      { n: 'Adhérence laque', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_cap_emb', c: [
      { n: 'Diamètre capsule', cat: 'Dimensionnel', t: 'measure' as const, tgt: 26.0, tol: 0.3, u: 'mm', ins: 'Pied à coulisse' },
      { n: 'Hauteur jupe', cat: 'Dimensionnel', t: 'measure' as const, tgt: 17.0, tol: 0.2, u: 'mm', ins: 'Pied à coulisse' },
      { n: 'Joint conforme', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_hf_imp', c: [
      { n: 'Densité hélio', cat: 'Densitométrie', t: 'measure' as const, tgt: 1.55, tol: 0.15, u: 'D', ins: 'Densitomètre' },
      { n: 'ΔE hélio', cat: 'Colorimétrie', t: 'measure' as const, tgt: 0, tol: 3.0, u: 'ΔE', ins: 'Spectrophotomètre' },
      { n: 'Repérage hélio', cat: 'Impression', t: 'measure' as const, tgt: 0, tol: 0.2, u: 'mm', ins: 'Compte-fils' },
      { n: 'Force scellage', cat: 'Mécanique', t: 'measure' as const, tgt: 3.0, tol: 0.5, u: 'N/15mm', ins: 'Dynamomètre' },
      { n: 'Conformité BAT hélio', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_hf_cpx', c: [
      { n: 'Force pelage', cat: 'Mécanique', t: 'measure' as const, tgt: 2.5, tol: 0.5, u: 'N/15mm', ins: 'Dynamomètre' },
      { n: 'Aspect complexe', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_hf_ext', c: [
      { n: 'Épaisseur film PE', cat: 'Épaisseur', t: 'measure' as const, tgt: 50, tol: 5, u: 'µm', ins: 'Micromètre' },
      { n: 'Transparence conforme', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
    { a: 'at_hf_ref', c: [
      { n: 'Largeur laize', cat: 'Dimensionnel', t: 'measure' as const, tgt: 0, tol: 1.0, u: 'mm', ins: 'Réglet' },
      { n: 'Tension bobine', cat: 'Visuel', t: 'check' as const, tgt: undefined, tol: undefined, u: undefined, ins: undefined },
    ]},
  ];

  controlDefs.forEach((x) => {
    x.c.forEach((c, i) => {
      D.controlLibrary.push({
        id: 'ctrl_' + x.a + '_' + i,
        atelierId: x.a,
        name: c.n,
        category: c.cat,
        type: c.t,
        target: c.tgt != null ? c.tgt : null,
        tolerance: c.tol != null ? c.tol : null,
        unit: c.u || null,
        instrument: c.ins || null,
        frequency: 'Chaque lot',
        active: true,
      });
    });
  });

  D.clients = [
    { id: 'cli_1', name: 'SABC', code: 'SABC' },
    { id: 'cli_2', name: 'UCB', code: 'UCB' },
    { id: 'cli_3', name: 'Nestlé Cameroun', code: 'NEST' },
    { id: 'cli_4', name: 'Guinness Cameroun', code: 'GUIN' },
    { id: 'cli_5', name: 'CIMENCAM', code: 'CIM' },
    { id: 'cli_6', name: 'Brasseries du Cameroun', code: 'BRASS' },
  ];

  D.products = [
    { id: 'prod_1', name: 'Étiquette 33cl Export', clientId: 'cli_1', poleId: 'pole_oe' },
    { id: 'prod_2', name: 'Étiquette Beaufort 65cl', clientId: 'cli_1', poleId: 'pole_oe' },
    { id: 'prod_3', name: 'Carton 12x33cl', clientId: 'cli_6', poleId: 'pole_oc' },
    { id: 'prod_4', name: 'Boîte Pliante Nescafé', clientId: 'cli_3', poleId: 'pole_oc' },
    { id: 'prod_5', name: 'Capsule Crown 26mm', clientId: 'cli_4', poleId: 'pole_cap' },
    { id: 'prod_6', name: 'Capsule SABC 26mm', clientId: 'cli_1', poleId: 'pole_cap' },
    { id: 'prod_7', name: 'Sachet Maggi 100g', clientId: 'cli_3', poleId: 'pole_hf' },
    { id: 'prod_8', name: 'Film Lait Concentré', clientId: 'cli_3', poleId: 'pole_hf' },
  ];

  D.productTechSheets = [
    { id: 'pts_001', productId: 'prod_1', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_0', target: 1.48, tolerance: 0.08 },
    { id: 'pts_002', productId: 'prod_1', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_1', target: 1.42, tolerance: 0.08 },
    { id: 'pts_003', productId: 'prod_1', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_2', target: 1.08, tolerance: 0.08 },
    { id: 'pts_004', productId: 'prod_1', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_3', target: 1.72, tolerance: 0.08 },
    { id: 'pts_005', productId: 'prod_1', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_4', target: 0, tolerance: 2.5 },
    { id: 'pts_006', productId: 'prod_1', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_5', target: 0, tolerance: 0.12 },
    { id: 'pts_007', productId: 'prod_1', atelierId: 'at_oe_dec', controlId: 'ctrl_at_oe_dec_0', target: 0, tolerance: 0.25 },
    { id: 'pts_010', productId: 'prod_2', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_0', target: 1.50, tolerance: 0.10 },
    { id: 'pts_011', productId: 'prod_2', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_1', target: 1.38, tolerance: 0.10 },
    { id: 'pts_012', productId: 'prod_2', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_2', target: 1.02, tolerance: 0.10 },
    { id: 'pts_013', productId: 'prod_2', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_3', target: 1.68, tolerance: 0.10 },
    { id: 'pts_014', productId: 'prod_2', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_4', target: 0, tolerance: 2.8 },
    { id: 'pts_015', productId: 'prod_2', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_5', target: 0, tolerance: 0.12 },
    { id: 'pts_016', productId: 'prod_2', atelierId: 'at_oe_dec', controlId: 'ctrl_at_oe_dec_0', target: 0, tolerance: 0.30 },
    { id: 'pts_100', productId: 'prod_3', atelierId: 'at_oc_imp', controlId: 'ctrl_at_oc_imp_0', target: 1.52, tolerance: 0.10 },
    { id: 'pts_101', productId: 'prod_3', atelierId: 'at_oc_imp', controlId: 'ctrl_at_oc_imp_1', target: 1.44, tolerance: 0.10 },
    { id: 'pts_102', productId: 'prod_3', atelierId: 'at_oc_imp', controlId: 'ctrl_at_oc_imp_2', target: 1.12, tolerance: 0.10 },
    { id: 'pts_103', productId: 'prod_3', atelierId: 'at_oc_imp', controlId: 'ctrl_at_oc_imp_3', target: 1.78, tolerance: 0.10 },
    { id: 'pts_104', productId: 'prod_3', atelierId: 'at_oc_imp', controlId: 'ctrl_at_oc_imp_4', target: 0, tolerance: 0.18 },
    { id: 'pts_105', productId: 'prod_3', atelierId: 'at_oc_dec', controlId: 'ctrl_at_oc_dec_0', target: 0, tolerance: 0.40 },
    { id: 'pts_110', productId: 'prod_4', atelierId: 'at_oc_imp', controlId: 'ctrl_at_oc_imp_0', target: 1.48, tolerance: 0.10 },
    { id: 'pts_111', productId: 'prod_4', atelierId: 'at_oc_imp', controlId: 'ctrl_at_oc_imp_1', target: 1.46, tolerance: 0.10 },
    { id: 'pts_112', productId: 'prod_4', atelierId: 'at_oc_imp', controlId: 'ctrl_at_oc_imp_2', target: 1.08, tolerance: 0.10 },
    { id: 'pts_113', productId: 'prod_4', atelierId: 'at_oc_imp', controlId: 'ctrl_at_oc_imp_3', target: 1.72, tolerance: 0.10 },
    { id: 'pts_114', productId: 'prod_4', atelierId: 'at_oc_imp', controlId: 'ctrl_at_oc_imp_4', target: 0, tolerance: 0.15 },
    { id: 'pts_115', productId: 'prod_4', atelierId: 'at_oc_dec', controlId: 'ctrl_at_oc_dec_0', target: 0, tolerance: 0.35 },
    { id: 'pts_020', productId: 'prod_5', atelierId: 'at_cap_imp', controlId: 'ctrl_at_cap_imp_0', target: 1.35, tolerance: 0.08 },
    { id: 'pts_021', productId: 'prod_5', atelierId: 'at_cap_imp', controlId: 'ctrl_at_cap_imp_1', target: 0, tolerance: 0.4 },
    { id: 'pts_022', productId: 'prod_5', atelierId: 'at_cap_laq', controlId: 'ctrl_at_cap_laq_0', target: 5.2, tolerance: 0.8 },
    { id: 'pts_030', productId: 'prod_5', atelierId: 'at_cap_emb', controlId: 'ctrl_at_cap_emb_0', target: 26.1, tolerance: 0.25 },
    { id: 'pts_031', productId: 'prod_5', atelierId: 'at_cap_emb', controlId: 'ctrl_at_cap_emb_1', target: 16.8, tolerance: 0.15 },
    { id: 'pts_200', productId: 'prod_6', atelierId: 'at_cap_imp', controlId: 'ctrl_at_cap_imp_0', target: 1.32, tolerance: 0.08 },
    { id: 'pts_201', productId: 'prod_6', atelierId: 'at_cap_imp', controlId: 'ctrl_at_cap_imp_1', target: 0, tolerance: 0.35 },
    { id: 'pts_202', productId: 'prod_6', atelierId: 'at_cap_laq', controlId: 'ctrl_at_cap_laq_0', target: 4.8, tolerance: 0.8 },
    { id: 'pts_203', productId: 'prod_6', atelierId: 'at_cap_emb', controlId: 'ctrl_at_cap_emb_0', target: 26.0, tolerance: 0.20 },
    { id: 'pts_204', productId: 'prod_6', atelierId: 'at_cap_emb', controlId: 'ctrl_at_cap_emb_1', target: 16.5, tolerance: 0.15 },
    { id: 'pts_040', productId: 'prod_7', atelierId: 'at_hf_imp', controlId: 'ctrl_at_hf_imp_0', target: 1.55, tolerance: 0.12 },
    { id: 'pts_041', productId: 'prod_7', atelierId: 'at_hf_imp', controlId: 'ctrl_at_hf_imp_1', target: 0, tolerance: 2.5 },
    { id: 'pts_042', productId: 'prod_7', atelierId: 'at_hf_imp', controlId: 'ctrl_at_hf_imp_2', target: 0, tolerance: 0.18 },
    { id: 'pts_043', productId: 'prod_7', atelierId: 'at_hf_imp', controlId: 'ctrl_at_hf_imp_3', target: 3.2, tolerance: 0.4 },
    { id: 'pts_044', productId: 'prod_7', atelierId: 'at_hf_cpx', controlId: 'ctrl_at_hf_cpx_0', target: 2.8, tolerance: 0.4 },
    { id: 'pts_045', productId: 'prod_7', atelierId: 'at_hf_ext', controlId: 'ctrl_at_hf_ext_0', target: 48, tolerance: 4 },
    { id: 'pts_046', productId: 'prod_7', atelierId: 'at_hf_ref', controlId: 'ctrl_at_hf_ref_0', target: 0, tolerance: 0.8 },
    { id: 'pts_300', productId: 'prod_8', atelierId: 'at_hf_imp', controlId: 'ctrl_at_hf_imp_0', target: 1.58, tolerance: 0.10 },
    { id: 'pts_301', productId: 'prod_8', atelierId: 'at_hf_imp', controlId: 'ctrl_at_hf_imp_1', target: 0, tolerance: 2.0 },
    { id: 'pts_302', productId: 'prod_8', atelierId: 'at_hf_imp', controlId: 'ctrl_at_hf_imp_2', target: 0, tolerance: 0.15 },
    { id: 'pts_303', productId: 'prod_8', atelierId: 'at_hf_imp', controlId: 'ctrl_at_hf_imp_3', target: 3.5, tolerance: 0.4 },
    { id: 'pts_304', productId: 'prod_8', atelierId: 'at_hf_cpx', controlId: 'ctrl_at_hf_cpx_0', target: 2.6, tolerance: 0.5 },
    { id: 'pts_305', productId: 'prod_8', atelierId: 'at_hf_ext', controlId: 'ctrl_at_hf_ext_0', target: 55, tolerance: 5 },
    { id: 'pts_306', productId: 'prod_8', atelierId: 'at_hf_ref', controlId: 'ctrl_at_hf_ref_0', target: 0, tolerance: 1.0 },
  ];

  D.users = [
    { id: 'u_op1', username: 'operateur1', password: 'demo', fullName: 'Jean Mbarga', roleId: 'role_op', poles: ['pole_oe'], ateliers: ['at_oe_imp'], active: true },
    { id: 'u_op2', username: 'operateur2', password: 'demo', fullName: 'Paul Nkono', roleId: 'role_op', poles: ['pole_cap'], ateliers: ['at_cap_imp', 'at_cap_laq', 'at_cap_emb'], active: true },
    { id: 'u_op3', username: 'operateur3', password: 'demo', fullName: 'Emile Fotso', roleId: 'role_op', poles: ['pole_hf'], ateliers: ['at_hf_imp', 'at_hf_cpx'], active: true },
    { id: 'u_ch1', username: 'chef1', password: 'demo', fullName: 'André Tchinda', roleId: 'role_chef', poles: ['pole_oe'], ateliers: ['at_oe_imp', 'at_oe_dec', 'at_oe_fac'], active: true },
    { id: 'u_ch2', username: 'chef2', password: 'demo', fullName: 'Samuel Ngono', roleId: 'role_chef', poles: ['pole_oc', 'pole_cap'], ateliers: ['at_oc_imp', 'at_oc_dec', 'at_oc_fac', 'at_cap_imp', 'at_cap_laq', 'at_cap_emb'], active: true },
    { id: 'u_qc1', username: 'qc1', password: 'demo', fullName: 'Marie Atangana', roleId: 'role_qc', poles: ['pole_oe', 'pole_oc'], ateliers: [], active: true },
    { id: 'u_qc2', username: 'qc2', password: 'demo', fullName: 'Sophie Bella', roleId: 'role_qc', poles: ['pole_cap', 'pole_hf'], ateliers: [], active: true },
    { id: 'u_rq', username: 'qualite', password: 'demo', fullName: 'Patrick Essomba', roleId: 'role_rq', poles: ['pole_oe', 'pole_oc', 'pole_cap', 'pole_hf'], ateliers: [], active: true },
    { id: 'u_admin', username: 'admin', password: 'demo', fullName: 'Xavier Admin', roleId: 'role_admin', poles: ['pole_oe', 'pole_oc', 'pole_cap', 'pole_hf'], ateliers: [], active: true },
    { id: 'u_dg', username: 'direction', password: 'demo', fullName: 'Dir. Générale', roleId: 'role_dg', poles: ['pole_oe', 'pole_oc', 'pole_cap', 'pole_hf'], ateliers: [], active: true },
  ];

  const now = Date.now();
  const day = 86400000;

  D.lots = [
    { id: 'lot_001', numLot: 'LOT-OE-2026-001', of: 'OF-50201', clientId: 'cli_1', productId: 'prod_1', poleId: 'pole_oe', gammeId: 'gam_oe_std', quantity: 50000, currentAtelierId: 'at_oe_dec', currentStepIndex: 1, status: 'valide_chef', createdBy: 'u_op1', createdAt: now - 2 * day, updatedAt: now - 2 * day, machine: 'Heidelberg SM74-OE', lotMatiere: 'MAT-2026-0045', bat: 'BAT-50201', observations: 'RAS' },
    { id: 'lot_002', numLot: 'LOT-OE-2026-002', of: 'OF-50202', clientId: 'cli_1', productId: 'prod_2', poleId: 'pole_oe', gammeId: 'gam_oe_std', quantity: 30000, currentAtelierId: 'at_oe_imp', currentStepIndex: 0, status: 'soumis', createdBy: 'u_op1', createdAt: now - 1 * day, updatedAt: now - 1 * day, machine: 'Heidelberg SM52-OE', lotMatiere: 'MAT-2026-0046', bat: 'BAT-50202', observations: '' },
    { id: 'lot_003', numLot: 'LOT-OE-2026-003', of: 'OF-50203', clientId: 'cli_6', productId: 'prod_2', poleId: 'pole_oe', gammeId: 'gam_oe_short', quantity: 20000, currentAtelierId: 'at_oe_dec', currentStepIndex: 1, status: 'libere', createdBy: 'u_op1', createdAt: now - 5 * day, updatedAt: now - 4 * day, machine: 'Komori LS40-OE', lotMatiere: 'MAT-2026-0040', bat: 'BAT-50203', observations: 'Lot validé et libéré' },
    { id: 'lot_004', numLot: 'LOT-OE-2026-004', of: 'OF-50204', clientId: 'cli_1', productId: 'prod_1', poleId: 'pole_oe', gammeId: 'gam_oe_std', quantity: 45000, currentAtelierId: 'at_oe_imp', currentStepIndex: 0, status: 'bloque', createdBy: 'u_op1', createdAt: now - 3 * day, updatedAt: now - 3 * day, machine: 'Heidelberg SM74-OE', lotMatiere: 'MAT-2026-0041', bat: 'BAT-50204', observations: 'Densité Cyan hors tolérance' },
    { id: 'lot_005', numLot: 'LOT-OE-2026-005', of: 'OF-50205', clientId: 'cli_6', productId: 'prod_1', poleId: 'pole_oe', gammeId: 'gam_oe_std', quantity: 60000, currentAtelierId: 'at_oe_fac', currentStepIndex: 2, status: 'libere', createdBy: 'u_op1', createdAt: now - 8 * day, updatedAt: now - 6 * day, machine: 'Heidelberg SM74-OE', lotMatiere: 'MAT-2026-0035', bat: 'BAT-50205', observations: 'RAS' },
    { id: 'lot_010', numLot: 'LOT-OC-2026-001', of: 'OF-60101', clientId: 'cli_6', productId: 'prod_3', poleId: 'pole_oc', gammeId: 'gam_oc_std', quantity: 15000, currentAtelierId: 'at_oc_imp', currentStepIndex: 0, status: 'soumis', createdBy: 'u_ch2', createdAt: now - 1 * day, updatedAt: now - 1 * day, machine: 'Heidelberg CD102-OC', lotMatiere: 'MAT-2026-0060', bat: 'BAT-60101', observations: '' },
    { id: 'lot_011', numLot: 'LOT-OC-2026-002', of: 'OF-60102', clientId: 'cli_3', productId: 'prod_4', poleId: 'pole_oc', gammeId: 'gam_oc_std', quantity: 10000, currentAtelierId: 'at_oc_dec', currentStepIndex: 1, status: 'valide_chef', createdBy: 'u_ch2', createdAt: now - 3 * day, updatedAt: now - 2 * day, machine: 'KBA Rapida 106-OC', lotMatiere: 'MAT-2026-0061', bat: 'BAT-60102', observations: '' },
    { id: 'lot_012', numLot: 'LOT-OC-2026-003', of: 'OF-60103', clientId: 'cli_6', productId: 'prod_3', poleId: 'pole_oc', gammeId: 'gam_oc_std', quantity: 8000, currentAtelierId: 'at_oc_fac', currentStepIndex: 2, status: 'libere', createdBy: 'u_ch2', createdAt: now - 6 * day, updatedAt: now - 4 * day, machine: 'Heidelberg CD102-OC', lotMatiere: 'MAT-2026-0055', bat: 'BAT-60103', observations: 'RAS' },
    { id: 'lot_020', numLot: 'LOT-CAP-2026-001', of: 'OF-70301', clientId: 'cli_4', productId: 'prod_5', poleId: 'pole_cap', gammeId: 'gam_cap_std', quantity: 100000, currentAtelierId: 'at_cap_laq', currentStepIndex: 1, status: 'valide_chef', createdBy: 'u_op2', createdAt: now - 2 * day, updatedAt: now - 1 * day, machine: 'Crabtree Marquess-CAP', lotMatiere: 'MAT-2026-0070', bat: 'BAT-70301', observations: '' },
    { id: 'lot_021', numLot: 'LOT-CAP-2026-002', of: 'OF-70302', clientId: 'cli_1', productId: 'prod_6', poleId: 'pole_cap', gammeId: 'gam_cap_std', quantity: 80000, currentAtelierId: 'at_cap_emb', currentStepIndex: 2, status: 'libere', createdBy: 'u_op2', createdAt: now - 5 * day, updatedAt: now - 3 * day, machine: 'Mailänder 222-CAP', lotMatiere: 'MAT-2026-0071', bat: 'BAT-70302', observations: '' },
    { id: 'lot_030', numLot: 'LOT-HF-2026-001', of: 'OF-80401', clientId: 'cli_3', productId: 'prod_7', poleId: 'pole_hf', gammeId: 'gam_hf_std', quantity: 25000, currentAtelierId: 'at_hf_cpx', currentStepIndex: 1, status: 'soumis', createdBy: 'u_op3', createdAt: now - 2 * day, updatedAt: now - 2 * day, machine: 'Rotomec RS4002-HF', lotMatiere: 'MAT-2026-0080', bat: 'BAT-80401', observations: '' },
    { id: 'lot_031', numLot: 'LOT-HF-2026-002', of: 'OF-80402', clientId: 'cli_3', productId: 'prod_8', poleId: 'pole_hf', gammeId: 'gam_hf_std', quantity: 20000, currentAtelierId: 'at_hf_ext', currentStepIndex: 2, status: 'libere', createdBy: 'u_op3', createdAt: now - 7 * day, updatedAt: now - 5 * day, machine: 'Bobst CL850-HF', lotMatiere: 'MAT-2026-0081', bat: 'BAT-80402', observations: 'RAS' },
    { id: 'lot_032', numLot: 'LOT-HF-2026-003', of: 'OF-80403', clientId: 'cli_3', productId: 'prod_7', poleId: 'pole_hf', gammeId: 'gam_hf_short', quantity: 15000, currentAtelierId: 'at_hf_imp', currentStepIndex: 0, status: 'bloque', createdBy: 'u_op3', createdAt: now - 4 * day, updatedAt: now - 3 * day, machine: 'Rotomec RS4002-HF', lotMatiere: 'MAT-2026-0082', bat: 'BAT-80403', observations: 'ΔE hors tolérance' },
  ];

  D.lotResults = [
    { id: 'lr_001', lotId: 'lot_004', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_0', m1: 1.22, m2: 1.20, m3: 1.24, avg: 1.22, delta: -0.23, verdict: 'NOK', timestamp: now - 3 * day, userId: 'u_op1' },
    { id: 'lr_002', lotId: 'lot_004', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_1', m1: 1.38, m2: 1.40, m3: 1.39, avg: 1.39, delta: -0.01, verdict: 'OK', timestamp: now - 3 * day, userId: 'u_op1' },
    { id: 'lr_003', lotId: 'lot_004', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_2', m1: 1.06, m2: 1.04, m3: 1.05, avg: 1.05, delta: 0.00, verdict: 'OK', timestamp: now - 3 * day, userId: 'u_op1' },
    { id: 'lr_004', lotId: 'lot_004', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_3', m1: 1.68, m2: 1.72, m3: 1.70, avg: 1.70, delta: 0.00, verdict: 'OK', timestamp: now - 3 * day, userId: 'u_op1' },
    { id: 'lr_010', lotId: 'lot_032', atelierId: 'at_hf_imp', controlId: 'ctrl_at_hf_imp_1', m1: 5.2, m2: 4.8, m3: 5.1, avg: 5.03, delta: 5.03, verdict: 'NOK', timestamp: now - 3 * day, userId: 'u_op3' },
    { id: 'lr_011', lotId: 'lot_001', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_0', m1: 1.44, m2: 1.46, m3: 1.45, avg: 1.45, delta: 0.00, verdict: 'OK', timestamp: now - 2 * day, userId: 'u_op1' },
    { id: 'lr_012', lotId: 'lot_001', atelierId: 'at_oe_imp', controlId: 'ctrl_at_oe_imp_1', m1: 1.41, m2: 1.39, m3: 1.40, avg: 1.40, delta: 0.00, verdict: 'OK', timestamp: now - 2 * day, userId: 'u_op1' },
  ];

  D.lotSteps = [
    { id: 'ls_001', lotId: 'lot_001', atelierId: 'at_oe_imp', stepIndex: 0, status: 'completed', enteredAt: now - 2 * day, completedAt: now - 2 * day + 3600000, operatorId: 'u_op1', chefId: 'u_ch1', validatedAt: now - 2 * day + 3600000 },
    { id: 'ls_002', lotId: 'lot_001', atelierId: 'at_oe_dec', stepIndex: 1, status: 'in_progress', enteredAt: now - 2 * day + 7200000, completedAt: null, operatorId: null, chefId: null, validatedAt: null },
  ];

  D.drafts = [
    { id: 'draft_001', poleId: 'pole_oe', gammeId: 'gam_oe_std', atelierId: 'at_oe_imp', of: 'OF-50210', clientId: 'cli_6', productId: 'prod_2', quantity: 35000, machine: 'Heidelberg SM74-OE', lotMatiere: 'MAT-2026-0050', bat: 'BAT-50210', observations: 'En attente BAT', measures: {}, checks: {}, customTargets: {}, inks: [], createdBy: 'u_op1', createdAt: now - 0.5 * day, updatedAt: now - 0.5 * day },
  ];

  D.nonConformities = [
    { id: 'nc_001', numero: 'NC-2026-001', poleId: 'pole_oe', gammeId: 'gam_oe_std', atelierId: 'at_oe_imp', lotId: 'lot_004', of: 'OF-50204', type: 'Produit', gravite: 'Majeure', causePresumee: 'Encrage insuffisant Cyan', description: 'Densité Cyan mesurée à 1.22 D, cible 1.45 ± 0.10.', actionsRequises: 'Réglage encrier Cyan', createdBy: 'u_qc1', createdAt: now - 3 * day, closedAt: null, status: 'ouverte' },
    { id: 'nc_002', numero: 'NC-2026-002', poleId: 'pole_hf', gammeId: 'gam_hf_short', atelierId: 'at_hf_imp', lotId: 'lot_032', of: 'OF-80403', type: 'Produit', gravite: 'Majeure', causePresumee: 'Cylindre hélio usé couleur 2', description: 'ΔE mesuré à 5.2, tolérance max 3.0.', actionsRequises: 'Changement cylindre', createdBy: 'u_qc2', createdAt: now - 3 * day, closedAt: null, status: 'en_cours' },
    { id: 'nc_003', numero: 'NC-2026-003', poleId: 'pole_cap', gammeId: 'gam_cap_std', atelierId: 'at_cap_laq', lotId: 'lot_021', of: 'OF-70302', type: 'Process', gravite: 'Mineure', causePresumee: 'Température four instable', description: 'Épaisseur laque irrégulière sur bords.', actionsRequises: 'Vérification four', createdBy: 'u_qc2', createdAt: now - 6 * day, closedAt: now - 2 * day, status: 'cloturee' },
    { id: 'nc_004', numero: 'NC-2026-004', poleId: 'pole_oc', gammeId: 'gam_oc_std', atelierId: 'at_oc_imp', lotId: 'lot_012', of: 'OF-60103', type: 'Produit', gravite: 'Mineure', causePresumee: 'Réglage repérage instable', description: 'Repérage en limite haute de tolérance.', actionsRequises: 'Contrôle repérage renforcé', createdBy: 'u_qc1', createdAt: now - 5 * day, closedAt: null, status: 'ouverte' },
  ];

  D.qcResults = [];
  D.qcDecisions = [];

  D.auditLog = [
    { id: 'log_001', userId: 'u_op1', role: 'Opérateur', action: 'lot.create', entity: 'lot_001', oldValue: null, newValue: 'LOT-OE-2026-001', timestamp: now - 2 * day, poleId: 'pole_oe', atelierId: 'at_oe_imp' },
    { id: 'log_002', userId: 'u_ch1', role: "Chef d'atelier", action: 'lot.validate_chef', entity: 'lot_001', oldValue: 'soumis', newValue: 'valide_chef', timestamp: now - 2 * day + 3600000, poleId: 'pole_oe', atelierId: 'at_oe_imp' },
    { id: 'log_003', userId: 'u_qc1', role: 'Contrôleur QC', action: 'lot.block', entity: 'lot_004', oldValue: 'valide_chef', newValue: 'bloque', timestamp: now - 3 * day, poleId: 'pole_oe', atelierId: 'at_oe_imp' },
  ];

  return D;
}
