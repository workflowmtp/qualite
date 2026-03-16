'use client';

import { useStore } from '@/store';
import { useModal } from '@/components/Modal';
import StepTracker from '@/components/StepTracker';
import { formatDate, getStatusClass, getStatusLabel } from '@/lib/helpers';

interface LotDetailModalProps {
  lotId: string;
}

export default function LotDetailModal({ lotId }: LotDetailModalProps) {
  const { db, getClient, getProduct, getPole, getGamme, getAtelier, getUser, getLotResults } = useStore();
  const { closeModal } = useModal();

  const lot = db.lots.find((l) => l.id === lotId);
  if (!lot) return null;

  const cl = getClient(lot.clientId);
  const pr = getProduct(lot.productId);
  const pole = getPole(lot.poleId);
  const gam = getGamme(lot.gammeId);
  const at = getAtelier(lot.currentAtelierId);
  const cr = getUser(lot.createdBy);

  const allResults = getLotResults(lotId);
  const prodResults = allResults.filter((r) => !r.isInk);
  const inkResults = allResults.filter((r) => r.isInk);

  const qcResults = db.qcResults.filter((r) => r.lotId === lotId);
  const qcDecisions = db.qcDecisions.filter((d) => d.lotId === lotId);

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(42,53,72,0.3)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );

  return (
    <>
      <div className="modal-header">
        <h3>{lot.numLot}</h3>
        <button className="modal-close" onClick={closeModal}>&times;</button>
      </div>
      <div className="modal-body">
        <StepTracker gamme={gam} lot={lot} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <DetailRow label="Lot" value={lot.numLot} />
          <DetailRow label="OF" value={lot.of} />
          <DetailRow label="Client" value={cl ? cl.name : '-'} />
          <DetailRow label="Produit" value={pr ? pr.name : '-'} />
          <DetailRow label="Pôle" value={pole ? pole.name : '-'} />
          <DetailRow label="Gamme" value={gam ? gam.name : '-'} />
          <DetailRow label="Atelier" value={at ? at.name : '-'} />
          <DetailRow label="Qté" value={lot.quantity.toLocaleString()} />
          <DetailRow label="Machine" value={lot.machine || '-'} />
          <DetailRow label="Lot mat." value={lot.lotMatiere || '-'} />
          <DetailRow label="BAT" value={lot.bat || '-'} />
          <DetailRow
            label="Statut"
            value={<span className={`status-badge ${getStatusClass(lot.status)}`}>{getStatusLabel(lot.status)}</span>}
          />
          <DetailRow label="Créé par" value={cr ? cr.fullName : '-'} />
          <DetailRow label="Date" value={formatDate(lot.createdAt)} />
        </div>

        {lot.observations && (
          <div style={{ padding: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 12, fontSize: 13 }}>
            {lot.observations}
          </div>
        )}

        {prodResults.length > 0 && (
          <>
            <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>RÉSULTATS PRODUCTION</strong>
            <table className="data-table" style={{ margin: '8px 0' }}>
              <thead>
                <tr>
                  <th>Contrôle</th><th>M1</th><th>M2</th><th>M3</th><th>Moy.</th><th>Δ</th><th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {prodResults.map((r) => {
                  const ct = db.controlLibrary.find((x) => x.id === r.controlId);
                  const vc = r.verdict === 'OK' ? 'verdict-ok' : r.verdict === 'WARN' ? 'verdict-warn' : 'verdict-nok';
                  return (
                    <tr key={r.id}>
                      <td>{ct ? ct.name : r.controlId}</td>
                      <td className="font-mono">{r.m1 != null ? r.m1.toFixed(2) : '-'}</td>
                      <td className="font-mono">{r.m2 != null ? r.m2.toFixed(2) : '-'}</td>
                      <td className="font-mono">{r.m3 != null ? r.m3.toFixed(2) : '-'}</td>
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

        {inkResults.length > 0 && (
          <>
            <strong style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, display: 'block' }}>MESURES ENCRES</strong>
            <table className="data-table" style={{ margin: '8px 0' }}>
              <thead>
                <tr>
                  <th>Encre</th><th>M1</th><th>M2</th><th>M3</th><th>Moy.</th><th>Δ</th><th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {inkResults.map((r) => {
                  const vc = r.verdict === 'OK' ? 'verdict-ok' : r.verdict === 'WARN' ? 'verdict-warn' : 'verdict-nok';
                  return (
                    <tr key={r.id}>
                      <td>{r.inkName || '-'}</td>
                      <td className="font-mono">{r.m1 != null ? r.m1.toFixed(2) : '-'}</td>
                      <td className="font-mono">{r.m2 != null ? r.m2.toFixed(2) : '-'}</td>
                      <td className="font-mono">{r.m3 != null ? r.m3.toFixed(2) : '-'}</td>
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

        {qcResults.length > 0 && (
          <>
            <strong style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, display: 'block' }}>RÉSULTATS QC RÉCEPTION</strong>
            <table className="data-table" style={{ margin: '8px 0' }}>
              <thead>
                <tr>
                  <th>Contrôle</th><th>M1</th><th>M2</th><th>M3</th><th>Moy.</th><th>Δ</th><th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {qcResults.map((r) => {
                  const ct = db.controlLibrary.find((x) => x.id === r.controlId);
                  const vc = r.verdict === 'OK' ? 'verdict-ok' : r.verdict === 'WARN' ? 'verdict-warn' : 'verdict-nok';
                  return (
                    <tr key={r.id}>
                      <td>{ct ? ct.name : r.controlId}</td>
                      <td className="font-mono">{r.m1 != null ? r.m1.toFixed(2) : '-'}</td>
                      <td className="font-mono">{r.m2 != null ? r.m2.toFixed(2) : '-'}</td>
                      <td className="font-mono">{r.m3 != null ? r.m3.toFixed(2) : '-'}</td>
                      <td className="font-mono">{r.avg.toFixed(2)}</td>
                      <td className="font-mono">{(r.delta >= 0 ? '+' : '') + r.delta.toFixed(2)}</td>
                      <td><span className={vc}>{r.verdict}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {qcDecisions.length > 0 && (
          <>
            <strong style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, display: 'block' }}>DÉCISIONS QC</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {qcDecisions.map((d) => {
                const u = getUser(d.qcUserId);
                return (
                  <div key={d.id} style={{ padding: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong>{d.decision.toUpperCase()}</strong>
                      <span className="text-muted">{formatDate(d.timestamp)} — {u ? u.fullName : '-'}</span>
                    </div>
                    {d.observations && <div style={{ color: 'var(--text-secondary)' }}>Obs: {d.observations}</div>}
                    {d.actionsRequises && <div style={{ color: 'var(--orange)' }}>Actions: {d.actionsRequises}</div>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Lot steps history */}
        {(() => {
          const steps = db.lotSteps.filter((s) => s.lotId === lotId).sort((a, b) => a.stepIndex - b.stepIndex);
          if (steps.length === 0) return null;
          return (
            <>
              <strong style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14, display: 'block' }}>HISTORIQUE ÉTAPES</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {steps.map((s) => {
                  const sa = getAtelier(s.atelierId);
                  const op = s.operatorId ? getUser(s.operatorId) : null;
                  const ch = s.chefId ? getUser(s.chefId) : null;
                  return (
                    <div key={s.id} style={{ padding: 8, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 12 }}>
                      <strong>{sa ? sa.name : s.atelierId}</strong>
                      <span className="text-muted" style={{ marginLeft: 8 }}>
                        Étape {s.stepIndex + 1} — {s.status === 'completed' ? '✓ Terminé' : '⏳ En cours'}
                      </span>
                      {op && <span className="text-muted" style={{ marginLeft: 8 }}>Op: {op.fullName}</span>}
                      {ch && <span className="text-muted" style={{ marginLeft: 8 }}>Chef: {ch.fullName}</span>}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={closeModal}>Fermer</button>
      </div>
    </>
  );
}
