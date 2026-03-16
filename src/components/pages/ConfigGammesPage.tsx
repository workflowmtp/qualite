'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useModal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { generateId } from '@/lib/helpers';

export default function ConfigGammesPage() {
  const { db, hasPermission, updateDB, addAuditLog, getPole, getAtelier } = useStore();
  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'gammes'|'transitions'>('gammes');
  const [search, setSearch] = useState('');

  if (!hasPermission('menu.config_gammes')) {
    return <div className="access-denied"><div className="icon">🔒</div><h3>Accès refusé</h3></div>;
  }

  // --- Gammes ---
  const fGammes = db.gammes.filter((g: any) =>
    !search || g.name.toLowerCase().includes(search.toLowerCase())
  );

  const saveGamme = (id: string|null, d: any) => {
    if (id) {
      updateDB((s: any) => ({ ...s, gammes: s.gammes.map((g: any) => g.id === id ? { ...g, ...d } : g) }));
      addAuditLog('gamme.edit', id, null, d.name);
    } else {
      const nid = generateId();
      updateDB((s: any) => ({ ...s, gammes: [...s.gammes, { id: nid, ...d }] }));
      addAuditLog('gamme.create', nid, null, d.name);
    }
    closeModal(); showToast(id ? 'Gamme modifiée' : 'Gamme créée', 'success');
  };

  const delGamme = (id: string) => {
    if (!hasPermission('config.gammes.delete')) { showToast('Permission refusée', 'error'); return; }
    const lots = db.lots.filter((l: any) => l.gammeId === id);
    if (lots.length > 0) { showToast(`Impossible : ${lots.length} lot(s) lié(s)`, 'error'); return; }
    updateDB((s: any) => ({
      ...s,
      gammes: s.gammes.filter((g: any) => g.id !== id),
      transitions: s.transitions.filter((t: any) => t.gammeId !== id),
    }));
    addAuditLog('gamme.delete', id, null, ''); showToast('Gamme supprimée', 'success');
  };

  const openGammeForm = (gid?: string) => {
    if (gid && !hasPermission('config.gammes.edit')) { showToast('Permission refusée', 'error'); return; }
    if (!gid && !hasPermission('config.gammes.create')) { showToast('Permission refusée', 'error'); return; }
    const ex = gid ? db.gammes.find((g: any) => g.id === gid) : null;
    const Form = () => {
      const [nm, setNm] = useState(ex?.name || '');
      const [pi, setPi] = useState(ex?.poleId || '');
      const [steps, setSteps] = useState<string[]>(ex?.steps || []);

      const poleAteliers = db.ateliers.filter((a: any) => a.poleId === pi).sort((a: any, b: any) => a.order - b.order);

      const addStep = (aid: string) => { if (!steps.includes(aid)) setSteps([...steps, aid]); };
      const removeStep = (idx: number) => setSteps(steps.filter((_: any, i: number) => i !== idx));
      const moveStep = (idx: number, dir: number) => {
        const arr = [...steps];
        const ni = idx + dir;
        if (ni < 0 || ni >= arr.length) return;
        [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
        setSteps(arr);
      };

      return (
        <div>
          <div className="modal-header"><h3>{ex ? 'Éditer' : 'Nouvelle'} gamme</h3><button className="modal-close" onClick={closeModal}>&times;</button></div>
          <div className="modal-body">
            <div className="form-group"><label>Nom *</label><input className="form-control" value={nm} onChange={e => setNm(e.target.value)} /></div>
            <div className="form-group"><label>Pôle *</label>
              <select className="form-control" value={pi} onChange={e => { setPi(e.target.value); setSteps([]); }}>
                <option value="">--</option>
                {db.poles.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {pi && (
              <div className="form-group">
                <label>Étapes (ordre de passage)</label>
                <div style={{ border:'1px solid var(--border)', borderRadius:6, padding:8, minHeight:40 }}>
                  {steps.length === 0 && <span style={{ color:'var(--text-muted)', fontSize:12 }}>Aucune étape</span>}
                  {steps.map((sid: string, idx: number) => {
                    const at = getAtelier(sid);
                    return (
                      <div key={idx} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, padding:'4px 8px', background:'var(--bg-secondary)', borderRadius:4 }}>
                        <span style={{ fontWeight:600, minWidth:20 }}>{idx+1}.</span>
                        <span style={{ flex:1 }}>{at ? at.name : sid}</span>
                        <button className="btn btn-sm btn-secondary" onClick={() => moveStep(idx, -1)} disabled={idx===0}>↑</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => moveStep(idx, 1)} disabled={idx===steps.length-1}>↓</button>
                        <button className="btn btn-sm btn-danger" onClick={() => removeStep(idx)}>✕</button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:6 }}>
                  <select className="form-control" value="" onChange={e => { if(e.target.value) addStep(e.target.value); }}>
                    <option value="">+ Ajouter un atelier...</option>
                    {poleAteliers.filter((a: any) => !steps.includes(a.id)).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" disabled={!nm || !pi} onClick={() => saveGamme(gid||null, { name:nm, poleId:pi, steps })}>Enregistrer</button>
          </div>
        </div>
      );
    };
    openModal(<Form />);
  };

  // --- Transitions ---
  const fTrans = db.transitions.filter((t: any) =>
    !search || t.gammeId.toLowerCase().includes(search.toLowerCase())
  );

  const saveTransition = (id: string|null, d: any) => {
    if (id) {
      updateDB((s: any) => ({ ...s, transitions: s.transitions.map((t: any) => t.id === id ? { ...t, ...d } : t) }));
      addAuditLog('transition.edit', id, null, '');
    } else {
      const nid = generateId();
      updateDB((s: any) => ({ ...s, transitions: [...s.transitions, { id: nid, ...d }] }));
      addAuditLog('transition.create', nid, null, '');
    }
    closeModal(); showToast(id ? 'Transition modifiée' : 'Transition créée', 'success');
  };

  const delTransition = (id: string) => {
    if (!hasPermission('config.gammes.delete')) { showToast('Permission refusée', 'error'); return; }
    updateDB((s: any) => ({ ...s, transitions: s.transitions.filter((t: any) => t.id !== id) }));
    addAuditLog('transition.delete', id, null, ''); showToast('Transition supprimée', 'success');
  };

  const openTransForm = (tid?: string) => {
    if (tid && !hasPermission('config.gammes.edit')) { showToast('Permission refusée', 'error'); return; }
    if (!tid && !hasPermission('config.gammes.create')) { showToast('Permission refusée', 'error'); return; }
    const ex = tid ? db.transitions.find((t: any) => t.id === tid) : null;
    const Form = () => {
      const [gi, setGi] = useState(ex?.gammeId || '');
      const [pi, setPi] = useState(ex?.poleId || '');
      const [fi, setFi] = useState(ex?.fromAtelierId || '');
      const [ti, setTi] = useState(ex?.toAtelierId || '');
      const [or, setOr] = useState(ex?.order ?? 0);
      const [ma, setMa] = useState(ex?.mandatory ?? true);

      const gamme = db.gammes.find((g: any) => g.id === gi);
      const poleAteliers = gamme ? db.ateliers.filter((a: any) => a.poleId === gamme.poleId) : [];

      return (
        <div>
          <div className="modal-header"><h3>{ex ? 'Éditer' : 'Nouvelle'} transition</h3><button className="modal-close" onClick={closeModal}>&times;</button></div>
          <div className="modal-body">
            <div className="form-group"><label>Gamme *</label>
              <select className="form-control" value={gi} onChange={e => { setGi(e.target.value); const g = db.gammes.find((x: any)=>x.id===e.target.value); setPi(g?.poleId||''); }}>
                <option value="">--</option>
                {db.gammes.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="form-group"><label>De (atelier)</label>
                <select className="form-control" value={fi} onChange={e => setFi(e.target.value)}>
                  <option value="">--</option>
                  {poleAteliers.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Vers (atelier)</label>
                <select className="form-control" value={ti} onChange={e => setTi(e.target.value)}>
                  <option value="">--</option>
                  {poleAteliers.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="form-group"><label>Ordre</label><input className="form-control" type="number" value={or} onChange={e => setOr(Number(e.target.value))} /></div>
              <div className="form-group"><label>Obligatoire</label>
                <select className="form-control" value={ma?'true':'false'} onChange={e => setMa(e.target.value==='true')}>
                  <option value="true">Oui</option><option value="false">Non</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" disabled={!gi || !fi || !ti} onClick={() => saveTransition(tid||null, { gammeId:gi, poleId:pi, fromAtelierId:fi, toAtelierId:ti, order:or, mandatory:ma })}>Enregistrer</button>
          </div>
        </div>
      );
    };
    openModal(<Form />);
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ fontSize:22, fontWeight:700 }}>🔗 Gammes & Transitions</h2>
        <div style={{ display:'flex', gap:8 }}>
          <input className="form-control" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ width:200 }} />
          {tab === 'gammes' && hasPermission('config.gammes.create') && <button className="btn btn-primary" onClick={() => openGammeForm()}>+ Gamme</button>}
          {tab === 'transitions' && hasPermission('config.gammes.create') && <button className="btn btn-primary" onClick={() => openTransForm()}>+ Transition</button>}
        </div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        <button className={`btn ${tab==='gammes'?'btn-primary':'btn-secondary'} btn-sm`} onClick={() => setTab('gammes')}>Gammes ({db.gammes.length})</button>
        <button className={`btn ${tab==='transitions'?'btn-primary':'btn-secondary'} btn-sm`} onClick={() => setTab('transitions')}>Transitions ({db.transitions.length})</button>
      </div>

      {tab === 'gammes' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Pôle</th><th>Étapes</th><th>Lots</th><th>Actions</th></tr></thead>
            <tbody>
              {fGammes.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:20 }}>Aucune gamme</td></tr>}
              {fGammes.map((g: any) => {
                const po = getPole(g.poleId);
                const nbLots = db.lots.filter((l: any) => l.gammeId === g.id).length;
                return (
                  <tr key={g.id}>
                    <td><strong>{g.name}</strong></td>
                    <td>{po ? <span className="badge" style={{ background:po.color+'22', color:po.color }}>{po.name}</span> : '-'}</td>
                    <td>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {g.steps.map((sid: string, i: number) => {
                          const at = getAtelier(sid);
                          return <span key={i} className="badge badge-sm">{at ? at.name : sid}</span>;
                        })}
                        {g.steps.length === 0 && <span style={{ color:'var(--text-muted)', fontSize:12 }}>-</span>}
                      </div>
                    </td>
                    <td>{nbLots}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        {hasPermission('config.gammes.edit') && <button className="btn btn-sm btn-secondary" onClick={() => openGammeForm(g.id)}>✏️</button>}
                        {hasPermission('config.gammes.delete') && <button className="btn btn-sm btn-danger" onClick={() => delGamme(g.id)}>🗑</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'transitions' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Gamme</th><th>De</th><th>Vers</th><th>Ordre</th><th>Obligatoire</th><th>Actions</th></tr></thead>
            <tbody>
              {fTrans.length === 0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:20 }}>Aucune transition</td></tr>}
              {fTrans.map((t: any) => {
                const gm = db.gammes.find((g: any) => g.id === t.gammeId);
                const fr = getAtelier(t.fromAtelierId);
                const to = getAtelier(t.toAtelierId);
                return (
                  <tr key={t.id}>
                    <td>{gm ? gm.name : t.gammeId}</td>
                    <td>{fr ? fr.name : t.fromAtelierId}</td>
                    <td>{to ? to.name : t.toAtelierId}</td>
                    <td className="font-mono">{t.order}</td>
                    <td>{t.mandatory ? <span className="badge badge-success">Oui</span> : <span className="badge badge-warning">Non</span>}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        {hasPermission('config.gammes.edit') && <button className="btn btn-sm btn-secondary" onClick={() => openTransForm(t.id)}>✏️</button>}
                        {hasPermission('config.gammes.delete') && <button className="btn btn-sm btn-danger" onClick={() => delTransition(t.id)}>🗑</button>}
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
