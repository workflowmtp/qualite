'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useModal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import KpiCard from '@/components/KpiCard';
import { generateId, formatDateShort, formatDate, escHtml, downloadCSV } from '@/lib/helpers';
import { NonConformity } from '@/types';

export default function NonConformitesPage() {
  const {
    currentPoleId, currentGammeId, currentUser, db,
    getPole, getAtelier, getUser, getAteliersForPole,
    getNCsForPole, hasPermission, updateDB, addAuditLog,
  } = useStore();
  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const pole = currentPoleId ? getPole(currentPoleId) : undefined;
  const ncs = getNCsForPole(currentPoleId || '');
  const op = ncs.filter((n) => n.status === 'ouverte').length;
  const ip = ncs.filter((n) => n.status === 'en_cours').length;
  const cl = ncs.filter((n) => n.status === 'cloturee').length;

  let filtered = [...ncs];
  if (filterStatus) filtered = filtered.filter((n) => n.status === filterStatus);
  if (filterType) filtered = filtered.filter((n) => n.type === filterType);
  filtered.sort((a, b) => b.createdAt - a.createdAt);

  const changeNCStatus = (nid: string, ns: string) => {
    updateDB((d) => ({
      ...d,
      nonConformities: d.nonConformities.map((n) =>
        n.id === nid
          ? { ...n, status: ns, closedAt: ns === 'cloturee' ? Date.now() : n.closedAt }
          : n
      ),
    }));
    addAuditLog('nc.' + ns, nid, null, ns);
    closeModal();
    showToast('NC mise à jour', 'success');
  };

  const viewNCDetail = (nid: string) => {
    const nc = db.nonConformities.find((n) => n.id === nid);
    if (!nc) return;
    const at = getAtelier(nc.atelierId);
    const poleName = currentPoleId ? getPole(currentPoleId)?.name : '-';
    const cr = getUser(nc.createdBy);

    openModal(
      <div>
        <div className="modal-header">
          <h3>{nc.numero}</h3>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              ['NC', nc.numero], ['Pôle', poleName || '-'], ['Atelier', at ? at.name : '-'], ['OF', nc.of],
              ['Type', nc.type], ['Gravité', nc.gravite], ['Créé par', cr ? cr.fullName : '-'], ['Date', formatDate(nc.createdAt)],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: '6px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                <span className="text-muted">{label}:</span> <strong>{val}</strong>
              </div>
            ))}
          </div>

          <div style={{ padding: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 10 }}>
            <strong style={{ fontSize: 11, color: 'var(--text-muted)' }}>DESCRIPTION</strong>
            <p style={{ marginTop: 4, fontSize: 13 }}>{nc.description}</p>
          </div>

          {nc.causePresumee && (
            <div style={{ padding: 10, background: 'var(--orange-dim)', border: '1px solid var(--orange)', borderRadius: 'var(--radius-sm)', marginBottom: 10 }}>
              <strong style={{ fontSize: 11, color: 'var(--orange)' }}>CAUSE</strong>
              <p style={{ marginTop: 4, fontSize: 13 }}>{nc.causePresumee}</p>
            </div>
          )}

          <div style={{ padding: 10, background: 'var(--blue-dim)', border: '1px solid var(--blue)', borderRadius: 'var(--radius-sm)', marginBottom: 10 }}>
            <strong style={{ fontSize: 11, color: 'var(--blue)' }}>ACTIONS</strong>
            <p style={{ marginTop: 4, fontSize: 13 }}>{nc.actionsRequises}</p>
          </div>

          {nc.closedAt && (
            <p style={{ fontSize: 12, color: 'var(--green)' }}>Clôturée le {formatDate(nc.closedAt)}</p>
          )}

          {hasPermission('nc.edit') && nc.status !== 'cloturee' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {nc.status === 'ouverte' && (
                <button className="btn btn-secondary" onClick={() => changeNCStatus(nc.id, 'en_cours')}>Passer en cours</button>
              )}
              {nc.status === 'en_cours' && (
                <button className="btn btn-primary" onClick={() => changeNCStatus(nc.id, 'cloturee')}>Clôturer</button>
              )}
              <button className="btn btn-sm btn-secondary" onClick={() => { closeModal(); editNCModal(nc.id); }}>✏️ Éditer</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const editNCModal = (nid: string) => {
    const nc = db.nonConformities.find((n) => n.id === nid);
    if (!nc) return;

    const EditForm = () => {
      const [ty, setTy] = useState(nc.type);
      const [gr, setGr] = useState(nc.gravite);
      const [ds, setDs] = useState(nc.description);
      const [ca, setCa] = useState(nc.causePresumee);
      const [ac, setAc] = useState(nc.actionsRequises);

      const save = () => {
        updateDB((d) => ({
          ...d,
          nonConformities: d.nonConformities.map((n) =>
            n.id === nid ? { ...n, type: ty, gravite: gr, description: ds, causePresumee: ca, actionsRequises: ac } : n
          ),
        }));
        addAuditLog('nc.edit', nid, null, 'Modifié');
        closeModal();
        showToast('NC modifiée', 'success');
      };

      return (
        <div>
          <div className="modal-header">
            <h3>Éditer {nc.numero}</h3>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Type</label>
              <select className="form-control" value={ty} onChange={(e) => setTy(e.target.value)}>
                <option>Produit</option><option>Process</option><option>Matière</option><option>Équipement</option>
              </select>
            </div>
            <div className="form-group">
              <label>Gravité</label>
              <select className="form-control" value={gr} onChange={(e) => setGr(e.target.value)}>
                <option>Mineure</option><option>Majeure</option><option>Critique</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" value={ds} onChange={(e) => setDs(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Cause présumée</label>
              <input className="form-control" value={ca} onChange={(e) => setCa(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Actions requises</label>
              <textarea className="form-control" value={ac} onChange={(e) => setAc(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" onClick={save}>Enregistrer</button>
          </div>
        </div>
      );
    };

    openModal(<EditForm />);
  };

  const openCreateNC = () => {
    const ats = getAteliersForPole(currentPoleId || '');

    const CreateForm = () => {
      const [atId, setAtId] = useState(ats[0]?.id || '');
      const [of2, setOf2] = useState('');
      const [ty, setTy] = useState('Produit');
      const [gr, setGr] = useState('Mineure');
      const [ds, setDs] = useState('');
      const [ca, setCa] = useState('');
      const [ac, setAc] = useState('');

      const save = () => {
        if (!ds.trim()) { showToast('Description obligatoire', 'error'); return; }
        const nn = 'NC-2026-' + String(db.nonConformities.length + 1).padStart(3, '0');
        updateDB((d) => ({
          ...d,
          nonConformities: [...d.nonConformities, {
            id: generateId(), numero: nn, poleId: currentPoleId || '', gammeId: currentGammeId || '',
            atelierId: atId, lotId: '', of: of2, type: ty, gravite: gr, causePresumee: ca,
            description: ds, actionsRequises: ac, createdBy: currentUser?.id || '',
            createdAt: Date.now(), closedAt: null, status: 'ouverte',
          }],
        }));
        addAuditLog('nc.create', nn, null, nn);
        closeModal();
        showToast('NC ' + nn + ' créée', 'success');
      };

      return (
        <div>
          <div className="modal-header">
            <h3>Nouvelle NC</h3>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div className="form-group">
                <label>Pôle</label>
                <input className="form-control" value={pole ? pole.name : ''} disabled />
              </div>
              <div className="form-group">
                <label>Atelier</label>
                <select className="form-control" value={atId} onChange={(e) => setAtId(e.target.value)}>
                  {ats.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div className="form-group">
                <label>OF</label>
                <input className="form-control" value={of2} onChange={(e) => setOf2(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select className="form-control" value={ty} onChange={(e) => setTy(e.target.value)}>
                  <option>Produit</option><option>Process</option><option>Matière</option><option>Équipement</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Gravité</label>
              <select className="form-control" value={gr} onChange={(e) => setGr(e.target.value)}>
                <option>Mineure</option><option>Majeure</option><option>Critique</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description <span className="req">*</span></label>
              <textarea className="form-control" value={ds} onChange={(e) => setDs(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Cause</label>
              <input className="form-control" value={ca} onChange={(e) => setCa(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Actions</label>
              <textarea className="form-control" value={ac} onChange={(e) => setAc(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" onClick={save}>Créer</button>
          </div>
        </div>
      );
    };

    openModal(<CreateForm />);
  };

  const exportNCsCSV = () => {
    const rows = ['N° NC;OF;Atelier;Type;Gravité;Cause;Description;Actions;Statut;Date'];
    ncs.forEach((nc) => {
      const at = getAtelier(nc.atelierId);
      rows.push([
        nc.numero, nc.of, at ? at.name : '', nc.type, nc.gravite,
        '"' + (nc.causePresumee || '').replace(/"/g, '""') + '"',
        '"' + (nc.description || '').replace(/"/g, '""') + '"',
        '"' + (nc.actionsRequises || '').replace(/"/g, '""') + '"',
        nc.status, formatDate(nc.createdAt),
      ].join(';'));
    });
    downloadCSV('nc_' + (pole?.code || 'XX') + '_' + formatDateShort(Date.now()).replace(/\//g, '-') + '.csv', rows.join('\n'));
    showToast('Export CSV téléchargé', 'success');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>⚠️ Non-conformités — {pole ? pole.name : ''}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasPermission('nc.create') && <button className="btn btn-primary" onClick={openCreateNC}>+ Nouvelle NC</button>}
          {hasPermission('report.export') && <button className="btn btn-secondary btn-sm" onClick={exportNCsCSV}>📄 Export CSV</button>}
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
        <KpiCard label="Ouvertes" value={op} sub="" color="red" />
        <KpiCard label="En cours" value={ip} sub="" color="orange" />
        <KpiCard label="Clôturées" value={cl} sub="" color="green" />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <select className="form-control" style={{ width: 150 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="ouverte">Ouverte</option>
          <option value="en_cours">En cours</option>
          <option value="cloturee">Clôturée</option>
        </select>
        <select className="form-control" style={{ width: 150 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tous types</option>
          <option value="Produit">Produit</option>
          <option value="Process">Process</option>
          <option value="Matière">Matière</option>
          <option value="Équipement">Équipement</option>
        </select>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>N°</th><th>OF</th><th>Atelier</th><th>Type</th><th>Gravité</th><th>Statut</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8}><div className="empty-state"><div className="icon">✅</div><h3>Aucune NC</h3></div></td></tr>
            )}
            {filtered.map((nc) => {
              const at = getAtelier(nc.atelierId);
              const stC = nc.status === 'ouverte' ? 'st-bloque' : nc.status === 'en_cours' ? 'st-soumis' : 'st-libere';
              const stL = nc.status === 'ouverte' ? 'Ouverte' : nc.status === 'en_cours' ? 'En cours' : 'Clôturée';
              return (
                <tr key={nc.id}>
                  <td><span className="font-mono text-red">{nc.numero}</span></td>
                  <td className="font-mono">{nc.of}</td>
                  <td>{at ? at.name : '-'}</td>
                  <td>{nc.type}</td>
                  <td>{nc.gravite}</td>
                  <td><span className={`status-badge ${stC}`}>{stL}</span></td>
                  <td className="text-muted">{formatDateShort(nc.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => viewNCDetail(nc.id)}>Voir</button>
                      {hasPermission('nc.edit') && nc.status !== 'cloturee' && (
                        <button className="btn btn-sm btn-secondary" onClick={() => editNCModal(nc.id)}>✏️</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
