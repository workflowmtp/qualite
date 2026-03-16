'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useModal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { generateId } from '@/lib/helpers';

export default function ConfigPolesPage() {
  const { db, hasPermission, updateDB, addAuditLog, getPole, getAtelier } = useStore();
  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'poles'|'ateliers'|'machines'>('poles');
  const [search, setSearch] = useState('');

  if (!hasPermission('menu.config_poles')) {
    return <div className="access-denied"><div className="icon">🔒</div><h3>Accès refusé</h3></div>;
  }

  // --- Poles ---
  const fPoles = db.poles.filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  );

  const savePole = (id: string|null, d: any) => {
    if (id) {
      updateDB((s: any) => ({ ...s, poles: s.poles.map((p: any) => p.id === id ? { ...p, ...d } : p) }));
      addAuditLog('pole.edit', id, null, d.name);
    } else {
      const nid = generateId();
      updateDB((s: any) => ({ ...s, poles: [...s.poles, { id: nid, ...d }] }));
      addAuditLog('pole.create', nid, null, d.name);
    }
    closeModal(); showToast(id ? 'Pôle modifié' : 'Pôle créé', 'success');
  };

  const delPole = (id: string) => {
    if (!hasPermission('config.poles.delete')) { showToast('Permission refusée', 'error'); return; }
    const ats = db.ateliers.filter((a: any) => a.poleId === id);
    if (ats.length > 0) { showToast(`Impossible : ${ats.length} atelier(s) lié(s)`, 'error'); return; }
    updateDB((s: any) => ({ ...s, poles: s.poles.filter((p: any) => p.id !== id) }));
    addAuditLog('pole.delete', id, null, ''); showToast('Pôle supprimé', 'success');
  };

  const openPoleForm = (pid?: string) => {
    if (pid && !hasPermission('config.poles.edit')) { showToast('Permission refusée', 'error'); return; }
    if (!pid && !hasPermission('config.poles.create')) { showToast('Permission refusée', 'error'); return; }
    const ex = pid ? db.poles.find((p: any) => p.id === pid) : null;
    const Form = () => {
      const [nm, setNm] = useState(ex?.name || '');
      const [cd, setCd] = useState(ex?.code || '');
      const [co, setCo] = useState(ex?.color || '#3b82f6');
      return (
        <div>
          <div className="modal-header"><h3>{ex ? 'Éditer' : 'Nouveau'} pôle</h3><button className="modal-close" onClick={closeModal}>&times;</button></div>
          <div className="modal-body">
            <div className="form-group"><label>Nom *</label><input className="form-control" value={nm} onChange={e => setNm(e.target.value)} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="form-group"><label>Code *</label><input className="form-control" value={cd} onChange={e => setCd(e.target.value)} /></div>
              <div className="form-group"><label>Couleur</label><input type="color" value={co} onChange={e => setCo(e.target.value)} style={{ width:50, height:36, border:'none', cursor:'pointer' }} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" disabled={!nm || !cd} onClick={() => savePole(pid||null, { name:nm, code:cd, color:co })}>Enregistrer</button>
          </div>
        </div>
      );
    };
    openModal(<Form />);
  };

  // --- Ateliers ---
  const fAteliers = db.ateliers.filter((a: any) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase())
  );

  const saveAtelier = (id: string|null, d: any) => {
    if (id) {
      updateDB((s: any) => ({ ...s, ateliers: s.ateliers.map((a: any) => a.id === id ? { ...a, ...d } : a) }));
      addAuditLog('atelier.edit', id, null, d.name);
    } else {
      const nid = generateId();
      updateDB((s: any) => ({ ...s, ateliers: [...s.ateliers, { id: nid, ...d }] }));
      addAuditLog('atelier.create', nid, null, d.name);
    }
    closeModal(); showToast(id ? 'Atelier modifié' : 'Atelier créé', 'success');
  };

  const delAtelier = (id: string) => {
    if (!hasPermission('config.ateliers.delete')) { showToast('Permission refusée', 'error'); return; }
    const mach = db.machines.filter((m: any) => m.atelierId === id);
    if (mach.length > 0) { showToast(`Impossible : ${mach.length} machine(s) liée(s)`, 'error'); return; }
    updateDB((s: any) => ({ ...s, ateliers: s.ateliers.filter((a: any) => a.id !== id) }));
    addAuditLog('atelier.delete', id, null, ''); showToast('Atelier supprimé', 'success');
  };

  const openAtelierForm = (aid?: string) => {
    if (aid && !hasPermission('config.ateliers.edit')) { showToast('Permission refusée', 'error'); return; }
    if (!aid && !hasPermission('config.ateliers.create')) { showToast('Permission refusée', 'error'); return; }
    const ex = aid ? db.ateliers.find((a: any) => a.id === aid) : null;
    const Form = () => {
      const [nm, setNm] = useState(ex?.name || '');
      const [cd, setCd] = useState(ex?.code || '');
      const [pi, setPi] = useState(ex?.poleId || '');
      const [or, setOr] = useState(ex?.order ?? 0);
      return (
        <div>
          <div className="modal-header"><h3>{ex ? 'Éditer' : 'Nouvel'} atelier</h3><button className="modal-close" onClick={closeModal}>&times;</button></div>
          <div className="modal-body">
            <div className="form-group"><label>Nom *</label><input className="form-control" value={nm} onChange={e => setNm(e.target.value)} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="form-group"><label>Code *</label><input className="form-control" value={cd} onChange={e => setCd(e.target.value)} /></div>
              <div className="form-group"><label>Ordre</label><input className="form-control" type="number" value={or} onChange={e => setOr(Number(e.target.value))} /></div>
            </div>
            <div className="form-group"><label>Pôle *</label>
              <select className="form-control" value={pi} onChange={e => setPi(e.target.value)}>
                <option value="">--</option>
                {db.poles.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" disabled={!nm || !cd || !pi} onClick={() => saveAtelier(aid||null, { name:nm, code:cd, poleId:pi, order:or })}>Enregistrer</button>
          </div>
        </div>
      );
    };
    openModal(<Form />);
  };

  // --- Machines ---
  const fMachines = db.machines.filter((m: any) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase())
  );

  const saveMachine = (id: string|null, d: any) => {
    if (id) {
      updateDB((s: any) => ({ ...s, machines: s.machines.map((m: any) => m.id === id ? { ...m, ...d } : m) }));
      addAuditLog('machine.edit', id, null, d.name);
    } else {
      const nid = generateId();
      updateDB((s: any) => ({ ...s, machines: [...s.machines, { id: nid, ...d }] }));
      addAuditLog('machine.create', nid, null, d.name);
    }
    closeModal(); showToast(id ? 'Machine modifiée' : 'Machine créée', 'success');
  };

  const delMachine = (id: string) => {
    if (!hasPermission('config.machines.delete')) { showToast('Permission refusée', 'error'); return; }
    updateDB((s: any) => ({ ...s, machines: s.machines.filter((m: any) => m.id !== id) }));
    addAuditLog('machine.delete', id, null, ''); showToast('Machine supprimée', 'success');
  };

  const openMachineForm = (mid?: string) => {
    if (mid && !hasPermission('config.machines.edit')) { showToast('Permission refusée', 'error'); return; }
    if (!mid && !hasPermission('config.machines.create')) { showToast('Permission refusée', 'error'); return; }
    const ex = mid ? db.machines.find((m: any) => m.id === mid) : null;
    const Form = () => {
      const [nm, setNm] = useState(ex?.name || '');
      const [ai, setAi] = useState(ex?.atelierId || '');
      const [ac, setAc] = useState(ex?.active ?? true);
      return (
        <div>
          <div className="modal-header"><h3>{ex ? 'Éditer' : 'Nouvelle'} machine</h3><button className="modal-close" onClick={closeModal}>&times;</button></div>
          <div className="modal-body">
            <div className="form-group"><label>Nom *</label><input className="form-control" value={nm} onChange={e => setNm(e.target.value)} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="form-group"><label>Atelier *</label>
                <select className="form-control" value={ai} onChange={e => setAi(e.target.value)}>
                  <option value="">--</option>
                  {db.ateliers.map((a: any) => {
                    const po = getPole(a.poleId);
                    return <option key={a.id} value={a.id}>{po ? po.name+' › ' : ''}{a.name}</option>;
                  })}
                </select>
              </div>
              <div className="form-group"><label>Active</label>
                <select className="form-control" value={ac?'true':'false'} onChange={e => setAc(e.target.value==='true')}>
                  <option value="true">Oui</option><option value="false">Non</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" disabled={!nm || !ai} onClick={() => saveMachine(mid||null, { name:nm, atelierId:ai, active:ac })}>Enregistrer</button>
          </div>
        </div>
      );
    };
    openModal(<Form />);
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ fontSize:22, fontWeight:700 }}>🏭 Pôles, Ateliers & Machines</h2>
        <div style={{ display:'flex', gap:8 }}>
          <input className="form-control" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ width:200 }} />
          {tab === 'poles' && hasPermission('config.poles.create') && <button className="btn btn-primary" onClick={() => openPoleForm()}>+ Pôle</button>}
          {tab === 'ateliers' && hasPermission('config.ateliers.create') && <button className="btn btn-primary" onClick={() => openAtelierForm()}>+ Atelier</button>}
          {tab === 'machines' && hasPermission('config.machines.create') && <button className="btn btn-primary" onClick={() => openMachineForm()}>+ Machine</button>}
        </div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        <button className={`btn ${tab==='poles'?'btn-primary':'btn-secondary'} btn-sm`} onClick={() => setTab('poles')}>Pôles ({db.poles.length})</button>
        <button className={`btn ${tab==='ateliers'?'btn-primary':'btn-secondary'} btn-sm`} onClick={() => setTab('ateliers')}>Ateliers ({db.ateliers.length})</button>
        <button className={`btn ${tab==='machines'?'btn-primary':'btn-secondary'} btn-sm`} onClick={() => setTab('machines')}>Machines ({db.machines.length})</button>
      </div>

      {tab === 'poles' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Code</th><th>Couleur</th><th>Ateliers</th><th>Actions</th></tr></thead>
            <tbody>
              {fPoles.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:20 }}>Aucun pôle</td></tr>}
              {fPoles.map((p: any) => {
                const nbAt = db.ateliers.filter((a: any) => a.poleId === p.id).length;
                return (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td><span className="badge">{p.code}</span></td>
                    <td><div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:16, height:16, borderRadius:4, background:p.color, display:'inline-block' }} />{p.color}</div></td>
                    <td>{nbAt}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        {hasPermission('config.poles.edit') && <button className="btn btn-sm btn-secondary" onClick={() => openPoleForm(p.id)}>✏️</button>}
                        {hasPermission('config.poles.delete') && <button className="btn btn-sm btn-danger" onClick={() => delPole(p.id)}>🗑</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ateliers' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Code</th><th>Pôle</th><th>Ordre</th><th>Machines</th><th>Actions</th></tr></thead>
            <tbody>
              {fAteliers.length === 0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:20 }}>Aucun atelier</td></tr>}
              {fAteliers.map((a: any) => {
                const po = getPole(a.poleId);
                const nbM = db.machines.filter((m: any) => m.atelierId === a.id).length;
                return (
                  <tr key={a.id}>
                    <td><strong>{a.name}</strong></td>
                    <td><span className="badge">{a.code}</span></td>
                    <td>{po ? <span className="badge" style={{ background:po.color+'22', color:po.color }}>{po.name}</span> : '-'}</td>
                    <td className="font-mono">{a.order}</td>
                    <td>{nbM}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        {hasPermission('config.ateliers.edit') && <button className="btn btn-sm btn-secondary" onClick={() => openAtelierForm(a.id)}>✏️</button>}
                        {hasPermission('config.ateliers.delete') && <button className="btn btn-sm btn-danger" onClick={() => delAtelier(a.id)}>🗑</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'machines' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Atelier</th><th>Pôle</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {fMachines.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:20 }}>Aucune machine</td></tr>}
              {fMachines.map((m: any) => {
                const at = getAtelier(m.atelierId);
                const po = at ? getPole(at.poleId) : null;
                return (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td>{at ? at.name : '-'}</td>
                    <td>{po ? <span className="badge" style={{ background:po.color+'22', color:po.color }}>{po.name}</span> : '-'}</td>
                    <td>{m.active ? <span className="badge badge-success">Oui</span> : <span className="badge badge-danger">Non</span>}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        {hasPermission('config.machines.edit') && <button className="btn btn-sm btn-secondary" onClick={() => openMachineForm(m.id)}>✏️</button>}
                        {hasPermission('config.machines.delete') && <button className="btn btn-sm btn-danger" onClick={() => delMachine(m.id)}>🗑</button>}
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
