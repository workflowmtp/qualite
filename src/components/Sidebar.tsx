'use client';

import { useStore } from '@/store';
import { PageId } from '@/types';

interface NavItem {
  id: PageId;
  icon: string;
  label: string;
  permission: string | null;
  badgeCount?: number;
}

export default function Sidebar() {
  const {
    currentUser, currentPoleId, currentAtelierId, currentGammeId, currentPage, db,
    setCurrentPage, setCurrentPoleId, setCurrentAtelierId, setCurrentGammeId,
    canAccessPole, hasPermission, getAteliersForPole, getGammesForPole,
    getLotsForPole, getNCsForPole, getDraftsForUser,
  } = useStore();

  if (!currentUser) return null;

  const pL = currentPoleId ? getLotsForPole(currentPoleId) : [];
  const lotsChef = pL.filter((l) => l.status === 'soumis').length;
  const lotsQC = pL.filter((l) => l.status === 'valide_chef').length;
  const ncOpen = currentPoleId ? getNCsForPole(currentPoleId).filter((n) => n.status !== 'cloturee').length : 0;
  const draftCount = currentPoleId ? getDraftsForUser(currentUser.id, currentPoleId).length : 0;

  const ateliers = currentPoleId ? getAteliersForPole(currentPoleId) : [];
  const gammes = currentPoleId ? getGammesForPole(currentPoleId) : [];

  const filteredAteliers = currentGammeId
    ? (() => {
        const g = db.gammes.find((x) => x.id === currentGammeId);
        return g ? ateliers.filter((a) => g.steps.includes(a.id)) : ateliers;
      })()
    : ateliers;

  const navItems: NavItem[] = [
    { id: 'dashboard', icon: '📊', label: 'Tableau de bord', permission: 'menu.dashboard' },
    { id: 'lots_entrants', icon: '📥', label: 'Lots entrants', permission: 'menu.lots_entrants' },
    { id: 'saisie_production', icon: '📝', label: 'Saisie production', permission: 'menu.saisie_production', badgeCount: draftCount },
    { id: 'validation_chef', icon: '✅', label: 'Validation chef', permission: 'menu.validation_chef', badgeCount: lotsChef },
    { id: 'qc_gate', icon: '🔬', label: 'QC Gate', permission: 'menu.qc_gate', badgeCount: lotsQC },
    { id: 'non_conformites', icon: '⚠️', label: 'Non-conformités', permission: 'menu.non_conformites', badgeCount: ncOpen },
    { id: 'historique', icon: '📋', label: 'Historique', permission: 'menu.historique' },
    { id: 'exports', icon: '📄', label: 'Exports', permission: 'menu.exports' },
    { id: 'qc_pilot_ai', icon: '🤖', label: 'QC Pilot IA', permission: 'menu.qc_pilot_ai' },
  ];

  const configItems: NavItem[] = [
    { id: 'config_controls', icon: '⚙️', label: 'Contrôles & FT', permission: 'menu.config_controls' },
    { id: 'config_clients', icon: '🏢', label: 'Clients & Produits', permission: 'menu.config_clients' },
    { id: 'config_gammes', icon: '🔗', label: 'Gammes', permission: 'menu.config_gammes' },
    { id: 'config_poles', icon: '🏭', label: 'Pôles & Ateliers', permission: 'menu.config_poles' },
    { id: 'config_users', icon: '👥', label: 'Utilisateurs', permission: 'menu.config_users' },
    { id: 'audit_log', icon: '📜', label: 'Journal audit', permission: 'menu.audit_log' },
  ];

  const globalItems: NavItem[] = [
    { id: 'dashboard_global', icon: '🌐', label: 'Dashboard Global', permission: 'menu.dashboard_global' },
  ];

  const renderNav = (items: NavItem[]) =>
    items
      .filter((item) => !item.permission || hasPermission(item.permission))
      .map((item) => (
        <div
          key={item.id}
          className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
          onClick={() => setCurrentPage(item.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', transition: 'all 0.15s',
            color: currentPage === item.id ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: 500, position: 'relative',
            background: currentPage === item.id ? 'var(--accent-dim)' : 'transparent',
          }}
        >
          <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
          <span>{item.label}</span>
          {item.badgeCount != null && item.badgeCount > 0 && (
            <span
              style={{
                position: 'absolute', right: 12,
                background: 'var(--red)', color: '#fff',
                fontSize: 10, padding: '2px 7px', borderRadius: 10,
                fontWeight: 700, fontFamily: 'var(--font-mono)',
              }}
            >
              {item.badgeCount}
            </span>
          )}
        </div>
      ));

  return (
    <div
      className="sidebar-container"
      style={{
        width: 'var(--sidebar-width)',
        height: 'calc(100vh - var(--topbar-height))',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        position: 'fixed',
        top: 'var(--topbar-height)',
        left: 0,
        overflowY: 'auto',
        padding: '16px 0',
      }}
    >
      {/* Context selectors */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, padding: '0 12px' }}>
          Contexte
        </div>
        <div style={{ padding: '0 12px' }}>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Pôle</span>
            <select
              className="form-control"
              style={{ padding: '8px 10px', fontSize: 12 }}
              value={currentPoleId || ''}
              onChange={(e) => e.target.value && setCurrentPoleId(e.target.value)}
            >
              {!currentPoleId && <option value="">— Sélectionner —</option>}
              {db.poles.filter((p) => canAccessPole(p.id)).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Atelier</span>
            <select
              className="form-control"
              style={{ padding: '8px 10px', fontSize: 12 }}
              value={currentAtelierId || ''}
              onChange={(e) => setCurrentAtelierId(e.target.value || null)}
            >
              <option value="">— Tous —</option>
              {filteredAteliers.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Gamme</span>
            <select
              className="form-control"
              style={{ padding: '8px 10px', fontSize: 12 }}
              value={currentGammeId || ''}
              onChange={(e) => setCurrentGammeId(e.target.value || null)}
            >
              <option value="">— Toutes —</option>
              {gammes.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, padding: '0 12px' }}>
          Navigation
        </div>
        {renderNav(navItems)}
      </div>

      {/* Global */}
      {globalItems.some((item) => !item.permission || hasPermission(item.permission)) && (
        <div style={{ padding: '0 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, padding: '0 12px' }}>
            Global
          </div>
          {renderNav(globalItems)}
        </div>
      )}

      {/* Configuration */}
      {configItems.some((item) => !item.permission || hasPermission(item.permission)) && (
        <div style={{ padding: '0 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, padding: '0 12px' }}>
            Configuration
          </div>
          {renderNav(configItems)}
        </div>
      )}
    </div>
  );
}
