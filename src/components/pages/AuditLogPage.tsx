'use client';
import { useState } from 'react';
import { useStore } from '@/store';
import { formatDate } from '@/lib/helpers';

export default function AuditLogPage() {
  const { db, hasPermission, getUser, getPole, getAtelier } = useStore();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterPole, setFilterPole] = useState('');
  if (!hasPermission('menu.audit_log')) return <div className="access-denied"><div className="icon">🔒</div><h3>Accès refusé</h3></div>;

  const actions = [...new Set(db.auditLog.map((e:any)=>e.action))].sort();
  const logs = [...db.auditLog].reverse().filter((e:any)=>{
    if(filterAction&&e.action!==filterAction) return false;
    if(filterPole&&e.poleId!==filterPole) return false;
    if(search){const s=search.toLowerCase();const u=e.userId?getUser(e.userId):null;if(!(e.action.toLowerCase().includes(s)||(u&&u.fullName.toLowerCase().includes(s))||(e.entity&&e.entity.toLowerCase().includes(s))||(e.newValue&&e.newValue.toLowerCase().includes(s)))) return false;}
    return true;
  });

  return (<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
      <h2 style={{fontSize:22,fontWeight:700}}>📜 Journal d&apos;audit</h2>
      <div style={{display:'flex',gap:8}}>
        <input className="form-control" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:180}}/>
        <select className="form-control" value={filterAction} onChange={e=>setFilterAction(e.target.value)} style={{width:160}}>
          <option value="">Toutes actions</option>
          {actions.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
        <select className="form-control" value={filterPole} onChange={e=>setFilterPole(e.target.value)} style={{width:140}}>
          <option value="">Tous pôles</option>
          {db.poles.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
    </div>
    <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:10}}>{logs.length} entrée(s) sur {db.auditLog.length}</div>
    <div className="data-table-wrap">
      <table className="data-table">
        <thead><tr><th>Date</th><th>Utilisateur</th><th>Rôle</th><th>Action</th><th>Entité</th><th>Ancienne valeur</th><th>Nouvelle valeur</th><th>Pôle</th><th>Atelier</th></tr></thead>
        <tbody>
          {logs.length===0&&<tr><td colSpan={9} style={{textAlign:'center',padding:20}}>Aucune entrée</td></tr>}
          {logs.slice(0,200).map((e:any)=>{
            const u=e.userId?getUser(e.userId):null;
            const po=e.poleId?getPole(e.poleId):null;
            const at=e.atelierId?getAtelier(e.atelierId):null;
            return(<tr key={e.id}>
              <td style={{whiteSpace:'nowrap',fontSize:12}}>{formatDate(e.timestamp)}</td>
              <td>{u?u.fullName:<span style={{color:'var(--text-muted)'}}>Système</span>}</td>
              <td><span className="badge badge-sm">{e.role||'-'}</span></td>
              <td><code style={{fontSize:11,background:'var(--bg-secondary)',padding:'2px 6px',borderRadius:4}}>{e.action}</code></td>
              <td style={{fontSize:12,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis'}}>{e.entity||'-'}</td>
              <td style={{fontSize:12,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',color:'var(--text-muted)'}}>{e.oldValue||'-'}</td>
              <td style={{fontSize:12,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis'}}>{e.newValue||'-'}</td>
              <td>{po?<span className="badge badge-sm" style={{background:po.color+'22',color:po.color}}>{po.code}</span>:'-'}</td>
              <td>{at?at.name:'-'}</td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>
    {logs.length>200&&<div style={{textAlign:'center',padding:12,color:'var(--text-muted)',fontSize:13}}>Affichage limité à 200 entrées. Utilisez les filtres pour affiner.</div>}
  </div>);
}
