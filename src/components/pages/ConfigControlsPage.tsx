'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useModal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { generateId } from '@/lib/helpers';

export default function ConfigControlsPage() {
  const { db, hasPermission, updateDB, addAuditLog, getAtelier } = useStore();
  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'controls'|'techsheets'>('controls');
  const [search, setSearch] = useState('');

  if (!hasPermission('menu.config_controls')) {
    return <div className="access-denied"><div className="icon">🔒</div><h3>Accès refusé</h3></div>;
  }

  const fCtrl = db.controlLibrary.filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase())
  );

  const saveControl = (id: string|null, d: any) => {
    if (id) {
      updateDB((s: any) => ({ ...s, controlLibrary: s.controlLibrary.map((c: any) => c.id === id ? { ...c, ...d } : c) }));
      addAuditLog('control.edit', id, null, d.name);
    } else {
      const nid = generateId();
      updateDB((s: any) => ({ ...s, controlLibrary: [...s.controlLibrary, { id: nid, ...d }] }));
      addAuditLog('control.create', nid, null, d.name);
    }
    closeModal(); showToast(id ? 'Contrôle modifié' : 'Contrôle créé', 'success');
  };

  const delControl = (id: string) => {
    if (!hasPermission('config.controls.delete')) { showToast('Permission refusée', 'error'); return; }
    updateDB((s: any) => ({ ...s, controlLibrary: s.controlLibrary.filter((c: any) => c.id !== id) }));
    addAuditLog('control.delete', id, null, ''); showToast('Contrôle supprimé', 'success');
  };

  const openCtrlForm = (cid?: string) => {
    if (cid && !hasPermission('config.controls.edit')) { showToast('Permission refusée', 'error'); return; }
    if (!cid && !hasPermission('config.controls.create')) { showToast('Permission refusée', 'error'); return; }
    const ex = cid ? db.controlLibrary.find((c: any) => c.id === cid) : null;
    const Form = () => {
      const [nm, setNm] = useState(ex?.name || '');
      const [ty, setTy] = useState<string>(ex?.type || 'measure');
      const [un, setUn] = useState(ex?.unit || '');
      const [tg, setTg] = useState(ex?.target ?? '');
      const [tl, setTl] = useState(ex?.tolerance ?? '');
      const [ai, setAi] = useState(ex?.atelierId || '');
      return (
        <div>
          <div className="modal-header"><h3>{ex ? 'Éditer' : 'Nouveau'} contrôle</h3><button className="modal-close" onClick={closeModal}>&times;</button></div>
          <div className="modal-body">
            <div className="form-group"><label>Nom *</label><input className="form-control" value={nm} onChange={e => setNm(e.target.value)} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="form-group"><label>Type</label>
                <select className="form-control" value={ty} onChange={e => setTy(e.target.value)}>
                  <option value="measure">Mesure</option><option value="check">Contrôle</option><option value="visual">Visuel</option>
                </select>
              </div>
              <div className="form-group"><label>Unité</label><input className="form-control" value={un} onChange={e => setUn(e.target.value)} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="form-group"><label>Cible</label><input className="form-control" type="number" value={tg} onChange={e => setTg(e.target.value)} /></div>
              <div className="form-group"><label>Tolérance</label><input className="form-control" type="number" value={tl} onChange={e => setTl(e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Atelier</label>
              <select className="form-control" value={ai} onChange={e => setAi(e.target.value)}>
                <option value="">-- Global --</option>
                {db.ateliers.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" onClick={() => saveControl(cid||null, { name:nm, type:ty, unit:un, target:tg!==''?Number(tg):null, tolerance:tl!==''?Number(tl):null, atelierId:ai })}>Enregistrer</button>
          </div>
        </div>
      );
    };
    openModal(<Form />);
  };

  // --- Tech Sheets ---
  const fTS = db.productTechSheets.filter((t: any) =>
    !search || t.controlId.toLowerCase().includes(search.toLowerCase()) || t.clientId.toLowerCase().includes(search.toLowerCase())
  );

  const saveTechSheet = (id: string|null, d: any) => {
    if (id) {
      updateDB((s: any) => ({ ...s, productTechSheets: s.productTechSheets.map((t: any) => t.id === id ? { ...t, ...d } : t) }));
      addAuditLog('techsheet.edit', id, null, '');
    } else {
      const nid = generateId();
      updateDB((s: any) => ({ ...s, productTechSheets: [...s.productTechSheets, { id: nid, ...d }] }));
      addAuditLog('techsheet.create', nid, null, '');
    }
    closeModal(); showToast(id ? 'FT modifiée' : 'FT créée', 'success');
  };

  const delTS = (id: string) => {
    if (!hasPermission('config.techsheets.edit')) { showToast('Permission refusée', 'error'); return; }
    updateDB((s: any) => ({ ...s, productTechSheets: s.productTechSheets.filter((t: any) => t.id !== id) }));
    addAuditLog('techsheet.delete', id, null, ''); showToast('FT supprimée', 'success');
  };

  const openTSForm = (tid?: string) => {
    if (!hasPermission('config.techsheets.edit')) { showToast('Permission refusée', 'error'); return; }
    const ex = tid ? db.productTechSheets.find((t: any) => t.id === tid) : null;
    const Form = () => {
      const [ci, setCi] = useState(ex?.controlId || '');
      const [cli, setCli] = useState(ex?.clientId || '');
      const [pi, setPi] = useState(ex?.productId || '');
      const [tg, setTg] = useState(ex?.target ?? '');
      const [tl, setTl] = useState(ex?.tolerance ?? '');
      return (
        <div>
          <div className="modal-header"><h3>{ex ? 'Éditer' : 'Nouvelle'} FT</h3><button className="modal-close" onClick={closeModal}>&times;</button></div>
          <div className="modal-body">
            <div className="form-group"><label>Contrôle</label>
              <select className="form-control" value={ci} onChange={e => setCi(e.target.value)}>
                <option value="">--</option>
                {db.controlLibrary.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="form-group"><label>Client</label>
                <select className="form-control" value={cli} onChange={e => setCli(e.target.value)}>
                  <option value="">--</option>
                  {db.clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Produit</label>
                <select className="form-control" value={pi} onChange={e => setPi(e.target.value)}>
                  <option value="">--</option>
                  {db.products.filter((p: any) => !cli || p.clientId === cli).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="form-group"><label>Cible</label><input className="form-control" type="number" value={tg} onChange={e => setTg(e.target.value)} /></div>
              <div className="form-group"><label>Tolérance</label><input className="form-control" type="number" value={tl} onChange={e => setTl(e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" onClick={() => saveTechSheet(tid||null, { controlId:ci, clientId:cli, productId:pi, target:tg!==''?Number(tg):null, tolerance:tl!==''?Number(tl):null })}>Enregistrer</button>
          </div>
        </div>
      );
    };
    openModal(<Form />);
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ fontSize:22, fontWeight:700 }}>⚙️ Contrôles & Fiches Techniques</h2>
        <div style={{ display:'flex', gap:8 }}>
          <input className="form-control" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ width:200 }} />
          {tab === 'controls' && hasPermission('config.controls.create') && <button className="btn btn-primary" onClick={() => openCtrlForm()}>+ Contrôle</button>}
          {tab === 'techsheets' && hasPermission('config.techsheets.edit') && <button className="btn btn-primary" onClick={() => openTSForm()}>+ Fiche Tech.</button>}
        </div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        <button className={`btn ${tab==='controls'?'btn-primary':'btn-secondary'} btn-sm`} onClick={() => setTab('controls')}>Contrôles ({db.controlLibrary.length})</button>
        <button className={`btn ${tab==='techsheets'?'btn-primary':'btn-secondary'} btn-sm`} onClick={() => setTab('techsheets')}>Fiches Techniques ({db.productTechSheets.length})</button>
      </div>

      {tab === 'controls' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Type</th><th>Unité</th><th>Cible</th><th>Tolérance</th><th>Atelier</th><th>Actions</th></tr></thead>
            <tbody>
              {fCtrl.length === 0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:20 }}>Aucun contrôle</td></tr>}
              {fCtrl.map((c: any) => {
                const at = c.atelierId ? getAtelier(c.atelierId) : null;
                return (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td><span className="badge">{c.type}</span></td>
                    <td>{c.unit || '-'}</td>
                    <td className="font-mono">{c.target ?? '-'}</td>
                    <td className="font-mono">{c.tolerance ?? '-'}</td>
                    <td>{at ? at.name : 'Global'}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        {hasPermission('config.controls.edit') && <button className="btn btn-sm btn-secondary" onClick={() => openCtrlForm(c.id)}>✏️</button>}
                        {hasPermission('config.controls.delete') && <button className="btn btn-sm btn-danger" onClick={() => delControl(c.id)}>🗑</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'techsheets' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Contrôle</th><th>Client</th><th>Produit</th><th>Cible</th><th>Tolérance</th><th>Actions</th></tr></thead>
            <tbody>
              {fTS.length === 0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:20 }}>Aucune FT</td></tr>}
              {fTS.map((t: any) => {
                const ct = db.controlLibrary.find((c: any) => c.id === t.controlId);
                const cl = db.clients.find((c: any) => c.id === t.clientId);
                const pr = db.products.find((p: any) => p.id === t.productId);
                return (
                  <tr key={t.id}>
                    <td>{ct ? ct.name : t.controlId}</td>
                    <td>{cl ? cl.name : '-'}</td>
                    <td>{pr ? pr.name : '-'}</td>
                    <td className="font-mono">{t.target ?? '-'}</td>
                    <td className="font-mono">{t.tolerance ?? '-'}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        {hasPermission('config.techsheets.edit') && <button className="btn btn-sm btn-secondary" onClick={() => openTSForm(t.id)}>✏️</button>}
                        {hasPermission('config.techsheets.edit') && <button className="btn btn-sm btn-danger" onClick={() => delTS(t.id)}>🗑</button>}
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
