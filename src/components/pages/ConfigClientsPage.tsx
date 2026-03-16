'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useModal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { generateId } from '@/lib/helpers';

export default function ConfigClientsPage() {
  const { db, hasPermission, updateDB, addAuditLog, getPole } = useStore();
  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'clients'|'products'>('clients');
  const [search, setSearch] = useState('');

  if (!hasPermission('menu.config_clients')) {
    return <div className="access-denied"><div className="icon">🔒</div><h3>Accès refusé</h3></div>;
  }

  // --- Clients ---
  const fClients = db.clients.filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const saveClient = (id: string|null, d: any) => {
    if (id) {
      updateDB((s: any) => ({ ...s, clients: s.clients.map((c: any) => c.id === id ? { ...c, ...d } : c) }));
      addAuditLog('client.edit', id, null, d.name);
    } else {
      const nid = generateId();
      updateDB((s: any) => ({ ...s, clients: [...s.clients, { id: nid, ...d }] }));
      addAuditLog('client.create', nid, null, d.name);
    }
    closeModal(); showToast(id ? 'Client modifié' : 'Client créé', 'success');
  };

  const delClient = (id: string) => {
    if (!hasPermission('config.clients.delete')) { showToast('Permission refusée', 'error'); return; }
    const prods = db.products.filter((p: any) => p.clientId === id);
    if (prods.length > 0) { showToast(`Impossible : ${prods.length} produit(s) lié(s)`, 'error'); return; }
    updateDB((s: any) => ({ ...s, clients: s.clients.filter((c: any) => c.id !== id) }));
    addAuditLog('client.delete', id, null, ''); showToast('Client supprimé', 'success');
  };

  const openClientForm = (cid?: string) => {
    if (cid && !hasPermission('config.clients.edit')) { showToast('Permission refusée', 'error'); return; }
    if (!cid && !hasPermission('config.clients.create')) { showToast('Permission refusée', 'error'); return; }
    const ex = cid ? db.clients.find((c: any) => c.id === cid) : null;
    const Form = () => {
      const [nm, setNm] = useState(ex?.name || '');
      const [cd, setCd] = useState(ex?.code || '');
      return (
        <div>
          <div className="modal-header"><h3>{ex ? 'Éditer' : 'Nouveau'} client</h3><button className="modal-close" onClick={closeModal}>&times;</button></div>
          <div className="modal-body">
            <div className="form-group"><label>Nom *</label><input className="form-control" value={nm} onChange={e => setNm(e.target.value)} /></div>
            <div className="form-group"><label>Code *</label><input className="form-control" value={cd} onChange={e => setCd(e.target.value)} /></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" disabled={!nm || !cd} onClick={() => saveClient(cid||null, { name:nm, code:cd })}>Enregistrer</button>
          </div>
        </div>
      );
    };
    openModal(<Form />);
  };

  // --- Products ---
  const fProducts = db.products.filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.clientId.toLowerCase().includes(search.toLowerCase())
  );

  const saveProduct = (id: string|null, d: any) => {
    if (id) {
      updateDB((s: any) => ({ ...s, products: s.products.map((p: any) => p.id === id ? { ...p, ...d } : p) }));
      addAuditLog('product.edit', id, null, d.name);
    } else {
      const nid = generateId();
      updateDB((s: any) => ({ ...s, products: [...s.products, { id: nid, ...d }] }));
      addAuditLog('product.create', nid, null, d.name);
    }
    closeModal(); showToast(id ? 'Produit modifié' : 'Produit créé', 'success');
  };

  const delProduct = (id: string) => {
    if (!hasPermission('config.products.delete')) { showToast('Permission refusée', 'error'); return; }
    const lots = db.lots.filter((l: any) => l.productId === id);
    if (lots.length > 0) { showToast(`Impossible : ${lots.length} lot(s) lié(s)`, 'error'); return; }
    updateDB((s: any) => ({ ...s, products: s.products.filter((p: any) => p.id !== id) }));
    addAuditLog('product.delete', id, null, ''); showToast('Produit supprimé', 'success');
  };

  const openProductForm = (pid?: string) => {
    if (pid && !hasPermission('config.products.edit')) { showToast('Permission refusée', 'error'); return; }
    if (!pid && !hasPermission('config.products.create')) { showToast('Permission refusée', 'error'); return; }
    const ex = pid ? db.products.find((p: any) => p.id === pid) : null;
    const Form = () => {
      const [nm, setNm] = useState(ex?.name || '');
      const [ci, setCi] = useState(ex?.clientId || '');
      const [pi, setPi] = useState(ex?.poleId || '');
      return (
        <div>
          <div className="modal-header"><h3>{ex ? 'Éditer' : 'Nouveau'} produit</h3><button className="modal-close" onClick={closeModal}>&times;</button></div>
          <div className="modal-body">
            <div className="form-group"><label>Nom *</label><input className="form-control" value={nm} onChange={e => setNm(e.target.value)} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="form-group"><label>Client *</label>
                <select className="form-control" value={ci} onChange={e => setCi(e.target.value)}>
                  <option value="">--</option>
                  {db.clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Pôle *</label>
                <select className="form-control" value={pi} onChange={e => setPi(e.target.value)}>
                  <option value="">--</option>
                  {db.poles.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" disabled={!nm || !ci || !pi} onClick={() => saveProduct(pid||null, { name:nm, clientId:ci, poleId:pi })}>Enregistrer</button>
          </div>
        </div>
      );
    };
    openModal(<Form />);
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ fontSize:22, fontWeight:700 }}>🏢 Clients & Produits</h2>
        <div style={{ display:'flex', gap:8 }}>
          <input className="form-control" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ width:200 }} />
          {tab === 'clients' && hasPermission('config.clients.create') && <button className="btn btn-primary" onClick={() => openClientForm()}>+ Client</button>}
          {tab === 'products' && hasPermission('config.products.create') && <button className="btn btn-primary" onClick={() => openProductForm()}>+ Produit</button>}
        </div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        <button className={`btn ${tab==='clients'?'btn-primary':'btn-secondary'} btn-sm`} onClick={() => setTab('clients')}>Clients ({db.clients.length})</button>
        <button className={`btn ${tab==='products'?'btn-primary':'btn-secondary'} btn-sm`} onClick={() => setTab('products')}>Produits ({db.products.length})</button>
      </div>

      {tab === 'clients' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Code</th><th>Produits</th><th>Actions</th></tr></thead>
            <tbody>
              {fClients.length === 0 && <tr><td colSpan={4} style={{ textAlign:'center', padding:20 }}>Aucun client</td></tr>}
              {fClients.map((c: any) => {
                const nbProd = db.products.filter((p: any) => p.clientId === c.id).length;
                return (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td><span className="badge">{c.code}</span></td>
                    <td>{nbProd}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        {hasPermission('config.clients.edit') && <button className="btn btn-sm btn-secondary" onClick={() => openClientForm(c.id)}>✏️</button>}
                        {hasPermission('config.clients.delete') && <button className="btn btn-sm btn-danger" onClick={() => delClient(c.id)}>🗑</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'products' && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Client</th><th>Pôle</th><th>Lots</th><th>Actions</th></tr></thead>
            <tbody>
              {fProducts.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:20 }}>Aucun produit</td></tr>}
              {fProducts.map((p: any) => {
                const cl = db.clients.find((c: any) => c.id === p.clientId);
                const po = getPole(p.poleId);
                const nbLots = db.lots.filter((l: any) => l.productId === p.id).length;
                return (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{cl ? cl.name : '-'}</td>
                    <td>{po ? <span className="badge" style={{ background: po.color+'22', color: po.color }}>{po.name}</span> : '-'}</td>
                    <td>{nbLots}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        {hasPermission('config.products.edit') && <button className="btn btn-sm btn-secondary" onClick={() => openProductForm(p.id)}>✏️</button>}
                        {hasPermission('config.products.delete') && <button className="btn btn-sm btn-danger" onClick={() => delProduct(p.id)}>🗑</button>}
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
