'use client';

import { useStore } from '@/store';

export default function Topbar() {
  const {
    currentUser, currentPoleId, currentAtelierId, currentGammeId,
    getPole, getAtelier, getGamme, getUserRole, logout, toggleTheme, theme,
    addAuditLog,
  } = useStore();

  if (!currentUser) return null;

  const role = getUserRole(currentUser);
  const pole = currentPoleId ? getPole(currentPoleId) : undefined;
  const atelier = currentAtelierId ? getAtelier(currentAtelierId) : undefined;
  const gamme = currentGammeId ? getGamme(currentGammeId) : undefined;

  const initials = currentUser.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2);

  const handleLogout = () => {
    addAuditLog('logout', null, null, 'Déconnexion');
    logout();
  };

  return (
    <div
      className="topbar"
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
          QC PILOT <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>MULTIPRINT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pole && <span className="ctx-badge ctx-pole">{pole.code}</span>}
          {atelier && <span className="ctx-badge ctx-atelier">{atelier.code}</span>}
          {gamme && <span className="ctx-badge ctx-gamme">{gamme.name.substring(0, 22)}</span>}
          {role && <span className="ctx-badge ctx-role">{role.name}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-dim)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 12,
              fontWeight: 700, color: 'var(--accent)',
            }}
          >
            {initials}
          </div>
          <span>{currentUser.fullName}</span>
        </div>
        <button
          onClick={toggleTheme}
          title="Changer de thème"
          style={{
            padding: '6px 12px', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)', fontSize: 14,
            cursor: 'pointer', lineHeight: 1,
          }}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}
