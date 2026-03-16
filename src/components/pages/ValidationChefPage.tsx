'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import StepTracker from '@/components/StepTracker';
import { getStatusClass, getStatusLabel } from '@/lib/helpers';

export default function ValidationChefPage() {
  const {
    currentPoleId, currentUser, db,
    getPole, getClient, getAtelier, getGamme, getUser,
    getLotsForPole, getLotResults, hasPermission,
    updateDB, addAuditLog,
  } = useStore();
  const { showToast } = useToast();
  const [comments, setComments] = useState<Record<string, string>>({});

  if (!hasPermission('lot.validate_chef')) {
    return (
      <div className="access-denied">
        <div className="icon">🔒</div><h3>Accès refusé</h3><p>Permissions insuffisantes.</p>
      </div>
    );
  }

  const pole = currentPoleId ? getPole(currentPoleId) : undefined;
  const lots = getLotsForPole(currentPoleId || '').filter((l) => l.status === 'soumis');

  const validateChef = (lid: string) => {
    const lot = db.lots.find((l) => l.id === lid);
    if (!lot) return;
    const cm = comments[lid] || '';
    updateDB((d) => ({
      ...d,
      lots: d.lots.map((l) =>
        l.id === lid
          ? {
              ...l,
              status: 'valide_chef',
              updatedAt: Date.now(),
              observations: cm ? (l.observations ? l.observations + ' | ' : '') + ' [Chef] ' + cm : l.observations,
            }
          : l
      ),
      lotSteps: d.lotSteps.map((s) =>
        s.lotId === lid && s.status === 'in_progress'
          ? { ...s, chefId: currentUser?.id || '', validatedAt: Date.now() }
          : s
      ),
    }));
    addAuditLog('lot.validate_chef', lid, 'soumis', 'valide_chef');
    showToast('Lot validé QC', 'success');
  };

  const returnToProd = (lid: string) => {
    const lot = db.lots.find((l) => l.id === lid);
    if (!lot) return;
    const cm = comments[lid] || '';
    updateDB((d) => ({
      ...d,
      lots: d.lots.map((l) =>
        l.id === lid
          ? {
              ...l,
              status: 'brouillon',
              updatedAt: Date.now(),
              observations: cm ? (l.observations ? l.observations + ' | ' : '') + ' [Retour] ' + cm : l.observations,
            }
          : l
      ),
    }));
    addAuditLog('lot.return', lid, 'soumis', 'brouillon');
    showToast('Lot renvoyé', 'info');
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>✅ Validation chef — {pole ? pole.name : ''}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{lots.length} lot(s) en attente</p>
      </div>

      {lots.length === 0 && (
        <div className="empty-state">
          <div className="icon">✅</div>
          <h3>Aucun lot en attente</h3>
        </div>
      )}

      {lots.map((lot) => {
        const cl = getClient(lot.clientId);
        const at = getAtelier(lot.currentAtelierId);
        const gam = getGamme(lot.gammeId);
        const cr = getUser(lot.createdBy);
        const res = getLotResults(lot.id, lot.currentAtelierId);
        const hasNOK = res.some((r) => r.verdict === 'NOK');

        return (
          <div key={lot.id} className="card" style={{ borderLeft: `4px solid ${hasNOK ? 'var(--red)' : 'var(--accent)'}`, marginBottom: 14 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span className="font-mono text-accent" style={{ fontSize: 16, fontWeight: 700 }}>{lot.numLot}</span>{' '}
                <span className="font-mono text-muted">{lot.of}</span>
              </div>
              <span className={`status-badge ${getStatusClass(lot.status)}`}>{getStatusLabel(lot.status)}</span>
            </div>

            {/* Step tracker */}
            {gam && <StepTracker gamme={gam} lot={lot} />}

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6, marginBottom: 10, fontSize: 12 }}>
              <div><span className="text-muted">Client:</span> {cl ? cl.name : '-'}</div>
              <div><span className="text-muted">Atelier:</span> {at ? at.name : '-'}</div>
              <div><span className="text-muted">Qté:</span> {lot.quantity.toLocaleString()}</div>
              <div><span className="text-muted">Opérateur:</span> {cr ? cr.fullName : '-'}</div>
            </div>

            {/* Results badges */}
            {res.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                {res.map((r) => {
                  const ct = db.controlLibrary.find((x) => x.id === r.controlId);
                  const bg = r.verdict === 'OK' ? 'var(--green-dim)' : r.verdict === 'WARN' ? 'var(--orange-dim)' : 'var(--red-dim)';
                  const col = r.verdict === 'OK' ? 'var(--green)' : r.verdict === 'WARN' ? 'var(--orange)' : 'var(--red)';
                  return (
                    <span key={r.id} style={{ padding: '3px 8px', background: bg, color: col, borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {ct ? ct.name : '?'}: {r.verdict} {r.avg != null ? `(${r.avg.toFixed(2)})` : ''}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Comment + actions */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <input
                className="form-control"
                style={{ flex: 1, padding: 6, fontSize: 12 }}
                placeholder="Commentaire chef (optionnel)..."
                value={comments[lot.id] || ''}
                onChange={(e) => setComments((prev) => ({ ...prev, [lot.id]: e.target.value }))}
              />
              <button className="btn btn-sm btn-primary" onClick={() => validateChef(lot.id)}>✅ Valider QC</button>
              <button className="btn btn-sm btn-orange" onClick={() => returnToProd(lot.id)}>↩ Retour prod</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
