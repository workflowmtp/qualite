'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import { useModal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { generateId } from '@/lib/helpers';
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES } from '@/lib/permissions';

export default function ConfigUsersPage() {
  const { db, hasPermission, updateDB, addAuditLog, getPole, getUserRole } = useStore();
  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'users' | 'roles'>('users');
  const [search, setSearch] = useState('');

  if (!hasPermission('menu.config_users')) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <div style={{ fontSize: 64 }}>🔒</div>
        <h3 style={{ fontSize: 20, fontWeight: 700 }}>Accès refusé</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Permission requise pour accéder à cette page.</p>
      </div>
    );
  }

  /* ── Users ── */
  const fU = db.users.filter(
    (u: any) =>
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const saveUser = (id: string | null, d: any) => {
    if (id) {
      updateDB((s: any) => ({ ...s, users: s.users.map((u: any) => (u.id === id ? { ...u, ...d } : u)) }));
      addAuditLog('user.edit', id, null, d.fullName);
    } else {
      const n = generateId();
      updateDB((s: any) => ({ ...s, users: [...s.users, { id: n, ...d }] }));
      addAuditLog('user.create', n, null, d.fullName);
    }
    closeModal();
    showToast(id ? 'Utilisateur modifié' : 'Utilisateur créé', 'success');
  };

  const delUser = (id: string) => {
    if (!hasPermission('config.users.delete')) {
      showToast('Permission refusée', 'error');
      return;
    }
    updateDB((s: any) => ({ ...s, users: s.users.filter((u: any) => u.id !== id) }));
    addAuditLog('user.delete', id, null, '');
    showToast('Utilisateur supprimé', 'success');
  };

  const openUserForm = (uid?: string) => {
    if (uid && !hasPermission('config.users.edit')) {
      showToast('Permission refusée', 'error');
      return;
    }
    if (!uid && !hasPermission('config.users.create')) {
      showToast('Permission refusée', 'error');
      return;
    }
    const ex = uid ? db.users.find((u: any) => u.id === uid) : null;

    const F = () => {
      const [fn, sFn] = useState(ex?.fullName || '');
      const [un, sUn] = useState(ex?.username || '');
      const [pw, sPw] = useState('');
      const [ri, sRi] = useState(ex?.roleId || '');
      const [ac, sAc] = useState(ex?.active ?? true);
      const [po, sPo] = useState<string[]>(ex?.poles || []);
      const [at, sAt] = useState<string[]>(ex?.ateliers || []);
      const tP = (p: string) => sPo((v) => (v.includes(p) ? v.filter((x) => x !== p) : [...v, p]));
      const tA = (a: string) => sAt((v) => (v.includes(a) ? v.filter((x) => x !== a) : [...v, a]));

      return (
        <div>
          <div className="modal-header">
            <h3>{ex ? 'Éditer' : 'Nouvel'} utilisateur</h3>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Nom complet *</label>
              <input className="form-control" value={fn} onChange={(e) => sFn(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label>Email / Identifiant *</label>
                <input className="form-control" value={un} onChange={(e) => sUn(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{ex ? 'Nouveau mot de passe' : 'Mot de passe *'}</label>
                <input
                  className="form-control"
                  type="password"
                  value={pw}
                  onChange={(e) => sPw(e.target.value)}
                  placeholder={ex ? 'Laisser vide si inchangé' : ''}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label>Rôle *</label>
                <select className="form-control" value={ri} onChange={(e) => sRi(e.target.value)}>
                  <option value="">-- Sélectionner --</option>
                  {db.roles.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Actif</label>
                <select className="form-control" value={ac ? 'true' : 'false'} onChange={(e) => sAc(e.target.value === 'true')}>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Pôles</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {db.poles.map((p: any) => (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer',
                      padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                      background: po.includes(p.id) ? p.color + '22' : 'transparent',
                    }}
                  >
                    <input type="checkbox" checked={po.includes(p.id)} onChange={() => tP(p.id)} />
                    <span style={{ color: po.includes(p.id) ? p.color : 'var(--text-secondary)' }}>{p.name}</span>
                  </label>
                ))}
                {db.poles.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun pôle configuré</span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Ateliers</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {db.ateliers
                  .filter((a: any) => po.includes(a.poleId))
                  .map((a: any) => (
                    <label
                      key={a.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer',
                        padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)',
                        background: at.includes(a.id) ? 'var(--accent-dim)' : 'transparent',
                      }}
                    >
                      <input type="checkbox" checked={at.includes(a.id)} onChange={() => tA(a.id)} />
                      {a.name}
                    </label>
                  ))}
                {db.ateliers.filter((a: any) => po.includes(a.poleId)).length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Sélectionnez d&apos;abord un pôle
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button
              className="btn btn-primary"
              disabled={!fn || !un || !ri || (!ex && !pw)}
              onClick={() => {
                const data: any = { fullName: fn, username: un, roleId: ri, active: ac, poles: po, ateliers: at };
                if (pw) data.password = pw;
                saveUser(uid || null, data);
              }}
            >
              Enregistrer
            </button>
          </div>
        </div>
      );
    };
    openModal(<F />);
  };

  /* ── Roles ── */
  const fR = db.roles.filter(
    (r: any) => !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  const saveRole = (id: string | null, d: any, perms: string[]) => {
    if (id) {
      updateDB((s: any) => ({
        ...s,
        roles: s.roles.map((r: any) => (r.id === id ? { ...r, ...d } : r)),
        rolePermissions: { ...s.rolePermissions, [id]: perms },
      }));
      addAuditLog('role.edit', id, null, d.name);
    } else {
      const n = generateId();
      updateDB((s: any) => ({
        ...s,
        roles: [...s.roles, { id: n, ...d }],
        rolePermissions: { ...s.rolePermissions, [n]: perms },
      }));
      addAuditLog('role.create', n, null, d.name);
    }
    closeModal();
    showToast(id ? 'Rôle modifié' : 'Rôle créé', 'success');
  };

  const delRole = (id: string) => {
    if (!hasPermission('config.roles.delete')) {
      showToast('Permission refusée', 'error');
      return;
    }
    const usersWithRole = db.users.filter((u: any) => u.roleId === id).length;
    if (usersWithRole > 0) {
      showToast(`Impossible : ${usersWithRole} utilisateur(s) utilisent ce rôle`, 'error');
      return;
    }
    updateDB((s: any) => {
      const rp = { ...s.rolePermissions };
      delete rp[id];
      return { ...s, roles: s.roles.filter((r: any) => r.id !== id), rolePermissions: rp };
    });
    addAuditLog('role.delete', id, null, '');
    showToast('Rôle supprimé', 'success');
  };

  const openRoleForm = (rid?: string) => {
    if (rid && !hasPermission('config.roles.edit')) {
      showToast('Permission refusée', 'error');
      return;
    }
    if (!rid && !hasPermission('config.roles.create')) {
      showToast('Permission refusée', 'error');
      return;
    }
    const ex = rid ? db.roles.find((r: any) => r.id === rid) : null;
    const cp = rid ? (db.rolePermissions[rid] || []) : [];

    const F = () => {
      const [nm, sNm] = useState(ex?.name || '');
      const [lv, sLv] = useState(ex?.level ?? 0);
      const [pm, sPm] = useState<string[]>([...cp]);
      const [expandedCat, setExpandedCat] = useState<string | null>(null);

      const toggle = (p: string) => sPm((v) => (v.includes(p) ? v.filter((x) => x !== p) : [...v, p]));

      const toggleCategory = (catKey: string) => {
        const catPerms = ALL_PERMISSIONS.filter((p) => p.category === catKey).map((p) => p.key);
        const allChecked = catPerms.every((p) => pm.includes(p));
        if (allChecked) {
          sPm((v) => v.filter((p) => !catPerms.includes(p)));
        } else {
          sPm((v) => [...new Set([...v, ...catPerms])]);
        }
      };

      const selectAll = () => sPm(ALL_PERMISSIONS.map((p) => p.key));
      const deselectAll = () => sPm([]);

      return (
        <div>
          <div className="modal-header">
            <h3>{ex ? 'Éditer' : 'Nouveau'} rôle</h3>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div className="form-group">
                <label>Nom du rôle *</label>
                <input className="form-control" value={nm} onChange={(e) => sNm(e.target.value)} placeholder="Ex: Opérateur, Chef..." />
              </div>
              <div className="form-group">
                <label>Niveau hiérarchique</label>
                <input className="form-control" type="number" value={lv} onChange={(e) => sLv(Number(e.target.value))} />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ margin: 0, fontWeight: 700 }}>
                  Permissions ({pm.length}/{ALL_PERMISSIONS.length})
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={selectAll} style={{ fontSize: 11 }}>
                    Tout cocher
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={deselectAll} style={{ fontSize: 11 }}>
                    Tout décocher
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                {PERMISSION_CATEGORIES.map((cat) => {
                  const catPerms = ALL_PERMISSIONS.filter((p) => p.category === cat.key);
                  const checkedCount = catPerms.filter((p) => pm.includes(p.key)).length;
                  const allChecked = checkedCount === catPerms.length;
                  const isExpanded = expandedCat === cat.key;

                  return (
                    <div key={cat.key} style={{ borderBottom: '1px solid var(--border)' }}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                          cursor: 'pointer', background: isExpanded ? 'var(--accent-dim)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onClick={() => setExpandedCat(isExpanded ? null : cat.key)}
                      >
                        <span style={{ fontSize: 16 }}>{cat.icon}</span>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{cat.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {checkedCount}/{catPerms.length}
                        </span>
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleCategory(cat.key);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer' }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s',
                          }}
                        >
                          ▼
                        </span>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '4px 14px 10px 42px' }}>
                          {catPerms.map((perm) => (
                            <label
                              key={perm.key}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0',
                                cursor: 'pointer', fontSize: 13,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={pm.includes(perm.key)}
                                onChange={() => toggle(perm.key)}
                                style={{ marginTop: 2, cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ fontWeight: 500 }}>{perm.label}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{perm.description}</div>
                                <code style={{ fontSize: 10, color: 'var(--accent)', opacity: 0.7 }}>{perm.key}</code>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button
              className="btn btn-primary"
              disabled={!nm}
              onClick={() => saveRole(rid || null, { name: nm, level: lv }, pm)}
            >
              Enregistrer
            </button>
          </div>
        </div>
      );
    };
    openModal(<F />, 'large');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>👥 Utilisateurs & Rôles</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-control"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
          {tab === 'users' && hasPermission('config.users.create') && (
            <button className="btn btn-primary" onClick={() => openUserForm()}>+ Utilisateur</button>
          )}
          {tab === 'roles' && hasPermission('config.roles.create') && (
            <button className="btn btn-primary" onClick={() => openRoleForm()}>+ Rôle</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button
          className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setTab('users')}
        >
          Utilisateurs ({db.users.length})
        </button>
        <button
          className={`btn ${tab === 'roles' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setTab('roles')}
        >
          Rôles ({db.roles.length})
        </button>
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Pôles</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fU.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Aucun utilisateur</td>
                </tr>
              )}
              {fU.map((u: any) => {
                const role = getUserRole(u);
                return (
                  <tr key={u.id}>
                    <td><strong>{u.fullName}</strong></td>
                    <td><code style={{ fontSize: 12 }}>{u.username}</code></td>
                    <td>{role ? <span className="badge">{role.name}</span> : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {u.poles.map((pid: string) => {
                          const po = getPole(pid);
                          return po ? (
                            <span key={pid} className="badge badge-sm" style={{ background: po.color + '22', color: po.color }}>
                              {po.code}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td>
                      {u.active ? (
                        <span className="badge badge-success">Oui</span>
                      ) : (
                        <span className="badge badge-danger">Non</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {hasPermission('config.users.edit') && (
                          <button className="btn btn-sm btn-secondary" onClick={() => openUserForm(u.id)}>✏️</button>
                        )}
                        {hasPermission('config.users.delete') && (
                          <button className="btn btn-sm btn-danger" onClick={() => delUser(u.id)}>🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ROLES TAB ── */}
      {tab === 'roles' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Niveau</th>
                <th>Permissions</th>
                <th>Utilisateurs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fR.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>Aucun rôle</td>
                </tr>
              )}
              {fR.map((r: any) => {
                const perms = db.rolePermissions[r.id] || [];
                const nb = db.users.filter((u: any) => u.roleId === r.id).length;
                return (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong></td>
                    <td className="font-mono">{r.level}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {perms.length === 0 && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune</span>
                        )}
                        {perms.length <= 5
                          ? perms.map((p: string) => (
                              <span key={p} className="badge badge-sm">{p}</span>
                            ))
                          : (
                            <>
                              {perms.slice(0, 4).map((p: string) => (
                                <span key={p} className="badge badge-sm">{p}</span>
                              ))}
                              <span className="badge badge-sm" style={{ opacity: 0.6 }}>
                                +{perms.length - 4} autres
                              </span>
                            </>
                          )}
                      </div>
                    </td>
                    <td>{nb}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {hasPermission('config.roles.edit') && (
                          <button className="btn btn-sm btn-secondary" onClick={() => openRoleForm(r.id)}>✏️</button>
                        )}
                        {hasPermission('config.roles.delete') && (
                          <button className="btn btn-sm btn-danger" onClick={() => delRole(r.id)}>🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
