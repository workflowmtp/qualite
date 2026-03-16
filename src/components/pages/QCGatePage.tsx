'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import StepTracker from '@/components/StepTracker';
import { generateId, computeMeasureVerdict } from '@/lib/helpers';

interface QCMeasures {
  [lotCtrl: string]: { m1: number | null; m2: number | null; m3: number | null };
}

export default function QCGatePage() {
  const {
    currentPoleId, currentUser, db,
    getPole, getClient, getAtelier, getGamme,
    getLotsForPole, getLotResults, getControlsForAtelier,
    getTechSheetForControl, hasPermission,
    qcExpandedLot, setQcExpandedLot,
    updateDB, addAuditLog,
  } = useStore();
  const { showToast } = useToast();

  const [qcMeasures, setQcMeasures] = useState<QCMeasures>({});
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [actions, setActions] = useState<Record<string, string>>({});

  if (!hasPermission('lot.perform_qc')) {
    return (
      <div className="access-denied">
        <div className="icon">🔒</div><h3>Accès refusé</h3><p>Permissions insuffisantes.</p>
      </div>
    );
  }

  const pole = currentPoleId ? getPole(currentPoleId) : undefined;
  const lots = getLotsForPole(currentPoleId || '').filter((l) => l.status === 'valide_chef');

  const updateQCMeasure = (lotId: string, ctrlId: string, field: 'm1' | 'm2' | 'm3', val: string) => {
    const key = lotId + '_' + ctrlId;
    setQcMeasures((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: val !== '' ? parseFloat(val) : null },
    }));
  };

  const getQCVerdict = (lotId: string, ctrlId: string) => {
    const key = lotId + '_' + ctrlId;
    const m = qcMeasures[key];
    if (!m) {
      const existing = db.qcResults.find((r) => r.lotId === lotId && r.controlId === ctrlId);
      if (existing) return { avg: existing.avg, delta: existing.delta, verdict: existing.verdict, cls: 'verdict-' + (existing.verdict === 'OK' ? 'ok' : existing.verdict === 'WARN' ? 'warn' : 'nok') };
      return { avg: null, delta: null, verdict: '—', cls: 'verdict-na' };
    }
    const lot = db.lots.find((l) => l.id === lotId);
    const ct = db.controlLibrary.find((c) => c.id === ctrlId);
    if (!ct || !lot) return { avg: null, delta: null, verdict: '—', cls: 'verdict-na' };

    const cust = lot.customTargets?.[ctrlId] || {};
    const ts = lot.productId ? getTechSheetForControl(lot.productId, lot.currentAtelierId, ctrlId) : null;
    const target = cust.target != null ? cust.target : (ts?.target != null ? ts.target : (ct.target != null ? ct.target : 0));
    const tol = cust.tolerance != null ? cust.tolerance : (ts?.tolerance != null ? ts.tolerance : (ct.tolerance != null ? ct.tolerance : 0));

    const vs: number[] = [];
    if (m.m1 != null && !isNaN(m.m1)) vs.push(m.m1);
    if (m.m2 != null && !isNaN(m.m2)) vs.push(m.m2);
    if (m.m3 != null && !isNaN(m.m3)) vs.push(m.m3);
    if (!vs.length) return { avg: null, delta: null, verdict: '—', cls: 'verdict-na' };

    const r = computeMeasureVerdict(vs, target, tol);
    const cls = r.verdict === 'OK' ? 'verdict-ok' : r.verdict === 'WARN' ? 'verdict-warn' : 'verdict-nok';
    return { avg: r.avg, delta: r.delta, verdict: r.verdict, cls };
  };

  const saveQCResults = (lotId: string) => {
    const lot = db.lots.find((l) => l.id === lotId);
    if (!lot) return;
    const ctrls = getControlsForAtelier(lot.currentAtelierId).filter((c) => c.type === 'measure');
    let saved = 0;

    updateDB((d) => {
      let qcResults = d.qcResults.filter((r) => r.lotId !== lotId);
      ctrls.forEach((ct) => {
        const key = lotId + '_' + ct.id;
        const m = qcMeasures[key];
        const existing = d.qcResults.find((r) => r.lotId === lotId && r.controlId === ct.id);
        const mData = m || (existing ? { m1: existing.m1, m2: existing.m2, m3: existing.m3 } : null);
        if (!mData) return;

        const vs: number[] = [];
        if (mData.m1 != null && !isNaN(mData.m1)) vs.push(mData.m1);
        if (mData.m2 != null && !isNaN(mData.m2)) vs.push(mData.m2);
        if (mData.m3 != null && !isNaN(mData.m3)) vs.push(mData.m3);
        if (!vs.length) return;

        const cust = lot.customTargets?.[ct.id] || {};
        const ts = lot.productId ? getTechSheetForControl(lot.productId, lot.currentAtelierId, ct.id) : null;
        const target = cust.target != null ? cust.target : (ts?.target != null ? ts.target : (ct.target != null ? ct.target : 0));
        const tol = cust.tolerance != null ? cust.tolerance : (ts?.tolerance != null ? ts.tolerance : (ct.tolerance != null ? ct.tolerance : 0));
        const result = computeMeasureVerdict(vs, target, tol);

        qcResults.push({
          id: generateId(), lotId, atelierId: lot.currentAtelierId, controlId: ct.id,
          m1: mData.m1, m2: mData.m2, m3: mData.m3,
          avg: result.avg, delta: result.delta, verdict: result.verdict,
          timestamp: Date.now(), userId: currentUser?.id || '',
        });
        saved++;
      });
      return { ...d, qcResults };
    });
    showToast(saved + ' mesure(s) QC sauvegardée(s)', 'success');
  };

  const qcDecision = (lotId: string, dec: 'libere' | 'reserve' | 'bloque') => {
    const lot = db.lots.find((l) => l.id === lotId);
    if (!lot) return;

    if (dec === 'libere' || dec === 'reserve') {
      const qcR = db.qcResults.filter((r) => r.lotId === lotId);
      const hasNOKqc = qcR.some((r) => r.verdict === 'NOK');
      if (hasNOKqc && dec === 'libere') {
        if (!window.confirm('Attention: des mesures QC sont NOK. Confirmer la libération malgré tout ?')) return;
      }
    }

    const obs = observations[lotId] || '';
    const acts = actions[lotId] || '';

    updateDB((d) => {
      const updatedLots = d.lots.map((l) =>
        l.id === lotId
          ? {
              ...l,
              status: dec,
              updatedAt: Date.now(),
              observations: obs ? (l.observations ? l.observations + ' | ' : '') + ' [QC] ' + obs : l.observations,
            }
          : l
      );

      const updatedSteps = d.lotSteps.map((s) =>
        s.lotId === lotId && s.status === 'in_progress' && dec === 'libere'
          ? { ...s, status: 'completed' as const, completedAt: Date.now() }
          : s
      );

      const newDecision = {
        id: generateId(), lotId, poleId: lot.poleId, atelierId: lot.currentAtelierId,
        decision: dec, observations: obs, actionsRequises: acts,
        qcUserId: currentUser?.id || '', timestamp: Date.now(),
      };

      let newNCs = [...d.nonConformities];
      if (dec === 'bloque') {
        const ncN = 'NC-2026-' + String(d.nonConformities.length + 1).padStart(3, '0');
        newNCs.push({
          id: generateId(), numero: ncN, poleId: lot.poleId, gammeId: lot.gammeId,
          atelierId: lot.currentAtelierId, lotId: lot.id, of: lot.of,
          type: 'Produit', gravite: 'Majeure', causePresumee: '',
          description: 'NC auto - Blocage ' + lot.numLot + (obs ? ' - ' + obs : ''),
          actionsRequises: acts || 'À définir',
          createdBy: currentUser?.id || '', createdAt: Date.now(), closedAt: null, status: 'ouverte' as const,
        });
      }

      return {
        ...d,
        lots: updatedLots,
        lotSteps: updatedSteps,
        qcDecisions: [...d.qcDecisions, newDecision],
        nonConformities: newNCs,
      };
    });

    addAuditLog('lot.' + dec, lotId, 'valide_chef', dec);
    const lbl: Record<string, string> = { libere: 'libéré', reserve: 'en réserve', bloque: 'bloqué' };
    showToast('Lot ' + lot.numLot + ' ' + lbl[dec], dec === 'libere' ? 'success' : 'error');
    setQcExpandedLot(null);
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🔬 QC Gate — {pole ? pole.name : ''}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{lots.length} lot(s) en attente</p>
      </div>

      {lots.length === 0 && (
        <div className="empty-state">
          <div className="icon">🔬</div>
          <h3>Aucun lot en attente QC</h3>
        </div>
      )}

      {lots.map((lot) => {
        const cl = getClient(lot.clientId);
        const at = getAtelier(lot.currentAtelierId);
        const gam = getGamme(lot.gammeId);
        const res = getLotResults(lot.id, lot.currentAtelierId);
        const hasNOK = res.some((r) => r.verdict === 'NOK');
        const isExp = qcExpandedLot === lot.id;
        const ctrls = getControlsForAtelier(lot.currentAtelierId);
        const qcMs = ctrls.filter((c) => c.type === 'measure');

        return (
          <div key={lot.id} className="card" style={{ borderLeft: `4px solid ${hasNOK ? 'var(--red)' : 'var(--cyan)'}`, marginBottom: 14 }}>
            {/* Clickable header */}
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, cursor: 'pointer' }}
              onClick={() => setQcExpandedLot(isExp ? null : lot.id)}
            >
              <div>
                <span className="font-mono text-accent" style={{ fontSize: 16, fontWeight: 700 }}>{lot.numLot}</span>{' '}
                <span className="font-mono text-muted">{lot.of}</span>
                {' — '}{cl ? cl.name : '-'}{' — '}{at ? at.name : '-'}
              </div>
              <span style={{ fontSize: 18 }}>{isExp ? '▼' : '▶'}</span>
            </div>

            {isExp && (
              <>
                {/* Step tracker */}
                {gam && <StepTracker gamme={gam} lot={lot} />}

                {/* Production results */}
                {res.length > 0 && (
                  <>
                    <strong style={{ fontSize: 11, color: 'var(--text-muted)' }}>RÉSULTATS PRODUCTION</strong>
                    <table className="data-table" style={{ margin: '6px 0 14px' }}>
                      <thead>
                        <tr><th>Mesure</th><th>Moy.</th><th>Δ</th><th>Verdict</th></tr>
                      </thead>
                      <tbody>
                        {res.map((r) => {
                          const ct = db.controlLibrary.find((x) => x.id === r.controlId);
                          const vc = r.verdict === 'OK' ? 'verdict-ok' : r.verdict === 'WARN' ? 'verdict-warn' : 'verdict-nok';
                          return (
                            <tr key={r.id}>
                              <td>{ct ? ct.name : '?'}</td>
                              <td className="font-mono">{r.avg != null ? r.avg.toFixed(2) : '-'}</td>
                              <td className="font-mono">{r.delta != null ? (r.delta >= 0 ? '+' : '') + r.delta.toFixed(2) : '-'}</td>
                              <td><span className={vc}>{r.verdict}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}

                {/* QC Reception Controls */}
                {qcMs.length > 0 && (
                  <>
                    <strong style={{ fontSize: 11, color: 'var(--cyan)' }}>CONTRÔLES RÉCEPTION QC</strong>
                    <table className="data-table" style={{ margin: '6px 0 14px' }}>
                      <thead>
                        <tr><th>Mesure</th><th>Cible</th><th>Tol.</th><th>QC-M1</th><th>QC-M2</th><th>QC-M3</th><th>Moy.</th><th>Verdict</th></tr>
                      </thead>
                      <tbody>
                        {qcMs.map((ct) => {
                          const key = lot.id + '_' + ct.id;
                          const m = qcMeasures[key] || {};
                          const existing = db.qcResults.find((r) => r.lotId === lot.id && r.controlId === ct.id);
                          const cust = lot.customTargets?.[ct.id] || {};
                          const ts = lot.productId ? getTechSheetForControl(lot.productId, lot.currentAtelierId, ct.id) : null;
                          const tgtD = cust.target != null ? cust.target : (ts?.target != null ? ts.target : (ct.target != null ? ct.target : '-'));
                          const tolD = cust.tolerance != null ? cust.tolerance : (ts?.tolerance != null ? ts.tolerance : (ct.tolerance != null ? ct.tolerance : '-'));
                          const v = getQCVerdict(lot.id, ct.id);

                          return (
                            <tr key={ct.id}>
                              <td>{ct.name}</td>
                              <td className="font-mono">{tgtD}</td>
                              <td className="font-mono">± {tolD}</td>
                              <td>
                                <input className="form-control" style={{ width: 65, padding: 4, textAlign: 'center' }} type="number" step="0.01"
                                  value={m.m1 != null ? m.m1 : (existing?.m1 != null ? existing.m1 : '')}
                                  onChange={(e) => updateQCMeasure(lot.id, ct.id, 'm1', e.target.value)} />
                              </td>
                              <td>
                                <input className="form-control" style={{ width: 65, padding: 4, textAlign: 'center' }} type="number" step="0.01"
                                  value={m.m2 != null ? m.m2 : (existing?.m2 != null ? existing.m2 : '')}
                                  onChange={(e) => updateQCMeasure(lot.id, ct.id, 'm2', e.target.value)} />
                              </td>
                              <td>
                                <input className="form-control" style={{ width: 65, padding: 4, textAlign: 'center' }} type="number" step="0.01"
                                  value={m.m3 != null ? m.m3 : (existing?.m3 != null ? existing.m3 : '')}
                                  onChange={(e) => updateQCMeasure(lot.id, ct.id, 'm3', e.target.value)} />
                              </td>
                              <td className="font-mono">{v.avg != null ? v.avg.toFixed(2) : '—'}</td>
                              <td className={`font-mono ${v.cls}`}>{v.verdict}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <button className="btn btn-sm btn-secondary" style={{ marginBottom: 14 }} onClick={() => saveQCResults(lot.id)}>
                      💾 Sauver mesures QC
                    </button>
                  </>
                )}

                {/* Observations & Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Observations QC</label>
                    <textarea className="form-control" style={{ fontSize: 12 }}
                      value={observations[lot.id] || ''}
                      onChange={(e) => setObservations((prev) => ({ ...prev, [lot.id]: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 11 }}>Actions requises</label>
                    <textarea className="form-control" style={{ fontSize: 12 }}
                      value={actions[lot.id] || ''}
                      onChange={(e) => setActions((prev) => ({ ...prev, [lot.id]: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Decision buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => qcDecision(lot.id, 'libere')}>✅ Libérer</button>
                  <button className="btn btn-orange" onClick={() => qcDecision(lot.id, 'reserve')}>⚠️ Réserve</button>
                  <button className="btn btn-danger" onClick={() => qcDecision(lot.id, 'bloque')}>🚫 Bloquer</button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
