export interface PermissionDef {
  key: string;
  label: string;
  description: string;
  category: string;
}

export const PERMISSION_CATEGORIES = [
  { key: 'menu', label: 'Accès aux menus', icon: '📋' },
  { key: 'lot', label: 'Gestion des lots', icon: '📦' },
  { key: 'nc', label: 'Non-conformités', icon: '⚠️' },
  { key: 'config', label: 'Configuration', icon: '⚙️' },
  { key: 'dashboard', label: 'Tableaux de bord', icon: '📊' },
  { key: 'report', label: 'Rapports & Exports', icon: '📄' },
  { key: 'ai', label: 'Intelligence artificielle', icon: '🤖' },
];

export const ALL_PERMISSIONS: PermissionDef[] = [
  // === MENU ACCESS ===
  { key: 'menu.dashboard', label: 'Tableau de bord', description: 'Accès au tableau de bord du pôle', category: 'menu' },
  { key: 'menu.lots_entrants', label: 'Lots entrants', description: 'Accès à la page des lots entrants', category: 'menu' },
  { key: 'menu.saisie_production', label: 'Saisie production', description: 'Accès à la saisie de production', category: 'menu' },
  { key: 'menu.validation_chef', label: 'Validation chef', description: 'Accès à la validation chef', category: 'menu' },
  { key: 'menu.qc_gate', label: 'QC Gate', description: 'Accès au portail de contrôle qualité', category: 'menu' },
  { key: 'menu.non_conformites', label: 'Non-conformités', description: 'Accès à la page des non-conformités', category: 'menu' },
  { key: 'menu.historique', label: 'Historique', description: 'Accès à l\'historique des lots', category: 'menu' },
  { key: 'menu.exports', label: 'Exports', description: 'Accès à la page d\'exports', category: 'menu' },
  { key: 'menu.qc_pilot_ai', label: 'QC Pilot IA', description: 'Accès à l\'assistant IA', category: 'menu' },
  { key: 'menu.dashboard_global', label: 'Dashboard global', description: 'Accès au dashboard multi-pôles', category: 'menu' },
  { key: 'menu.config_controls', label: 'Config. Contrôles', description: 'Accès à la configuration des contrôles et fiches techniques', category: 'menu' },
  { key: 'menu.config_clients', label: 'Config. Clients', description: 'Accès à la configuration des clients et produits', category: 'menu' },
  { key: 'menu.config_gammes', label: 'Config. Gammes', description: 'Accès à la configuration des gammes', category: 'menu' },
  { key: 'menu.config_poles', label: 'Config. Pôles', description: 'Accès à la configuration des pôles et ateliers', category: 'menu' },
  { key: 'menu.config_users', label: 'Config. Utilisateurs', description: 'Accès à la gestion des utilisateurs et rôles', category: 'menu' },
  { key: 'menu.audit_log', label: 'Journal d\'audit', description: 'Accès au journal d\'audit', category: 'menu' },

  // === LOT MANAGEMENT ===
  { key: 'lot.create', label: 'Créer un lot', description: 'Peut créer un nouveau lot / brouillon', category: 'lot' },
  { key: 'lot.edit_own_draft', label: 'Modifier ses brouillons', description: 'Peut éditer ses propres brouillons', category: 'lot' },
  { key: 'lot.edit_any_draft', label: 'Modifier tout brouillon', description: 'Peut éditer n\'importe quel brouillon', category: 'lot' },
  { key: 'lot.submit', label: 'Soumettre un lot', description: 'Peut soumettre un lot pour validation', category: 'lot' },
  { key: 'lot.view_own_atelier', label: 'Voir lots de son atelier', description: 'Peut voir les lots de son atelier', category: 'lot' },
  { key: 'lot.view_pole', label: 'Voir lots du pôle', description: 'Peut voir tous les lots de son pôle', category: 'lot' },
  { key: 'lot.view_global', label: 'Voir tous les lots', description: 'Peut voir les lots de tous les pôles', category: 'lot' },
  { key: 'lot.validate_chef', label: 'Valider (chef)', description: 'Peut effectuer la validation chef d\'un lot', category: 'lot' },
  { key: 'lot.perform_qc', label: 'Effectuer le QC', description: 'Peut effectuer le contrôle qualité', category: 'lot' },
  { key: 'lot.release', label: 'Libérer un lot', description: 'Peut libérer un lot après QC', category: 'lot' },
  { key: 'lot.reserve', label: 'Mettre en réserve', description: 'Peut mettre un lot en réserve', category: 'lot' },
  { key: 'lot.block', label: 'Bloquer un lot', description: 'Peut bloquer un lot', category: 'lot' },
  { key: 'lot.delete', label: 'Supprimer un lot', description: 'Peut supprimer un lot', category: 'lot' },

  // === NON-CONFORMITIES ===
  { key: 'nc.create', label: 'Créer une NC', description: 'Peut créer une non-conformité', category: 'nc' },
  { key: 'nc.edit', label: 'Modifier une NC', description: 'Peut modifier une non-conformité', category: 'nc' },
  { key: 'nc.close', label: 'Clôturer une NC', description: 'Peut clôturer une non-conformité', category: 'nc' },
  { key: 'nc.delete', label: 'Supprimer une NC', description: 'Peut supprimer une non-conformité', category: 'nc' },

  // === CONFIGURATION ===
  { key: 'config.controls.create', label: 'Créer un contrôle', description: 'Peut ajouter un nouveau contrôle', category: 'config' },
  { key: 'config.controls.edit', label: 'Modifier un contrôle', description: 'Peut modifier un contrôle existant', category: 'config' },
  { key: 'config.controls.delete', label: 'Supprimer un contrôle', description: 'Peut supprimer un contrôle', category: 'config' },
  { key: 'config.clients.create', label: 'Créer un client', description: 'Peut ajouter un nouveau client', category: 'config' },
  { key: 'config.clients.edit', label: 'Modifier un client', description: 'Peut modifier un client existant', category: 'config' },
  { key: 'config.clients.delete', label: 'Supprimer un client', description: 'Peut supprimer un client', category: 'config' },
  { key: 'config.products.create', label: 'Créer un produit', description: 'Peut ajouter un nouveau produit', category: 'config' },
  { key: 'config.products.edit', label: 'Modifier un produit', description: 'Peut modifier un produit existant', category: 'config' },
  { key: 'config.products.delete', label: 'Supprimer un produit', description: 'Peut supprimer un produit', category: 'config' },
  { key: 'config.gammes.create', label: 'Créer une gamme', description: 'Peut ajouter une nouvelle gamme', category: 'config' },
  { key: 'config.gammes.edit', label: 'Modifier une gamme', description: 'Peut modifier une gamme existante', category: 'config' },
  { key: 'config.gammes.delete', label: 'Supprimer une gamme', description: 'Peut supprimer une gamme', category: 'config' },
  { key: 'config.poles.create', label: 'Créer un pôle', description: 'Peut ajouter un nouveau pôle', category: 'config' },
  { key: 'config.poles.edit', label: 'Modifier un pôle', description: 'Peut modifier un pôle existant', category: 'config' },
  { key: 'config.poles.delete', label: 'Supprimer un pôle', description: 'Peut supprimer un pôle', category: 'config' },
  { key: 'config.ateliers.create', label: 'Créer un atelier', description: 'Peut ajouter un nouvel atelier', category: 'config' },
  { key: 'config.ateliers.edit', label: 'Modifier un atelier', description: 'Peut modifier un atelier existant', category: 'config' },
  { key: 'config.ateliers.delete', label: 'Supprimer un atelier', description: 'Peut supprimer un atelier', category: 'config' },
  { key: 'config.machines.create', label: 'Créer une machine', description: 'Peut ajouter une nouvelle machine', category: 'config' },
  { key: 'config.machines.edit', label: 'Modifier une machine', description: 'Peut modifier une machine existante', category: 'config' },
  { key: 'config.machines.delete', label: 'Supprimer une machine', description: 'Peut supprimer une machine', category: 'config' },
  { key: 'config.users.create', label: 'Créer un utilisateur', description: 'Peut ajouter un nouvel utilisateur', category: 'config' },
  { key: 'config.users.edit', label: 'Modifier un utilisateur', description: 'Peut modifier un utilisateur existant', category: 'config' },
  { key: 'config.users.delete', label: 'Supprimer un utilisateur', description: 'Peut supprimer un utilisateur', category: 'config' },
  { key: 'config.roles.create', label: 'Créer un rôle', description: 'Peut ajouter un nouveau rôle', category: 'config' },
  { key: 'config.roles.edit', label: 'Modifier un rôle', description: 'Peut modifier un rôle et ses permissions', category: 'config' },
  { key: 'config.roles.delete', label: 'Supprimer un rôle', description: 'Peut supprimer un rôle', category: 'config' },
  { key: 'config.techsheets.edit', label: 'Modifier les fiches techniques', description: 'Peut modifier les fiches techniques produit', category: 'config' },

  // === DASHBOARDS ===
  { key: 'dashboard.view_pole', label: 'Dashboard pôle', description: 'Peut voir le tableau de bord de son pôle', category: 'dashboard' },
  { key: 'dashboard.view_global', label: 'Dashboard global', description: 'Peut voir le dashboard multi-pôles', category: 'dashboard' },

  // === REPORTS ===
  { key: 'report.export', label: 'Exporter les données', description: 'Peut exporter les données en CSV/PDF', category: 'report' },

  // === AI ===
  { key: 'ai.use', label: 'Utiliser l\'IA', description: 'Peut utiliser l\'assistant QC Pilot IA', category: 'ai' },
];

// Map page IDs to required menu permissions
export const PAGE_PERMISSION_MAP: Record<string, string> = {
  dashboard: 'menu.dashboard',
  lots_entrants: 'menu.lots_entrants',
  saisie_production: 'menu.saisie_production',
  validation_chef: 'menu.validation_chef',
  qc_gate: 'menu.qc_gate',
  non_conformites: 'menu.non_conformites',
  historique: 'menu.historique',
  exports: 'menu.exports',
  qc_pilot_ai: 'menu.qc_pilot_ai',
  dashboard_global: 'menu.dashboard_global',
  config_controls: 'menu.config_controls',
  config_techsheets: 'menu.config_controls',
  config_clients: 'menu.config_clients',
  config_gammes: 'menu.config_gammes',
  config_poles: 'menu.config_poles',
  config_users: 'menu.config_users',
  audit_log: 'menu.audit_log',
};
