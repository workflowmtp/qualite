'use client';

import { useStore } from '@/store';
import KpiCard from '@/components/KpiCard';
import BarChart from '@/components/BarChart';
import { getStatusLabel } from '@/lib/helpers';

export default function DashboardGlobalPage() {
  const {
    db, hasPermission, getPole, getAtelier,
  } = useStore();

  if (!hasPermission('dashboard.view_global')) {
    return (
      <div className="access-denied">
        <div className="icon">🔒</div><h3>Accès refusé</h3><p>Permissions insuffisantes.</p>
      </div>
    );
  }

  const totalLots = db.lots.length;
  const liberes = db.lots.filter((l) => l.status === 'libere').length;
  const bloques = db.lots.filter((l) => l.status === 'bloque').length;
  const reserves = db.lots.filter((l) => l.status === 'reserve').length;
  const soumis = db.lots.filter((l) => l.status === 'soumis').length;
  const attQC = db.lots.filter((l) => l.status === 'valide_chef').length;
  const fpy = totalLots > 0 ? Math.round(liberes / totalLots * 100) : 0;
  const totalNCs = db.nonConformities.length;
  const ncOuv = db.nonConformities.filter((n) => n.status === 'ouverte').length;
  const ncEC = db.nonConformities.filter((n) => n.status === 'en_cours').length;
  const ncCl = db.nonConformities.filter((n) => n.status === 'cloturee').length;

  // Per-pole stats
  const poleStats = db.poles.map((p) => {
    const pLots = db.lots.filter((l) => l.poleId === p.id);
    const pLib = pLots.filter((l) => l.status === 'libere').length;
    const pBlk = pLots.filter((l) => l.status === 'bloque').length;
    const pNCs = db.nonConformities.filter((n) => n.poleId === p.id && n.status !== 'cloturee').length;
    const pFpy = pLots.length > 0 ? Math.round(pLib / pLots.length * 100) : 0;
    return { pole: p, total: pLots.length, lib: pLib, blk: pBlk, ncs: pNCs, fpy: pFpy };
  });

  // Lots per pole bar chart
  const lotsPerPole = poleStats.map((ps) => ({
    label: ps.pole.code, value: ps.total, color: 'var(--accent)', extra: `FPY: ${ps.fpy}%`,
  }));

  // Status distribution
  const statusDist = [
    { label: 'Libéré', value: liberes, color: 'var(--green)', extra: '' },
    { label: 'Réserve', value: reserves, color: 'var(--orange)', extra: '' },
    { label: 'Bloqué', value: bloques, color: 'var(--red)', extra: '' },
    { label: 'Soumis', value: soumis, color: 'var(--blue)', extra: '' },
    { label: 'Att. QC', value: attQC, color: 'var(--cyan)', extra: '' },
  ];

  // NC per pole
  const ncPerPole = db.poles.map((p) => ({
    label: p.code,
    value: db.nonConformities.filter((n) => n.poleId === p.id && n.status !== 'cloturee').length,
    color: 'var(--red)',
    extra: '',
  }));

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🌐 Dashboard Global — Tous les pôles</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {db.poles.length} pôles • {totalLots} lots • {totalNCs} NC
        </p>
      </div>

      {/* Global KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', marginBottom: 20 }}>
        <KpiCard label="Total lots" value={totalLots} sub="Tous pôles" color="accent" />
        <KpiCard label="Libérés" value={liberes} sub={`${fpy}% FPY`} color="green" />
        <KpiCard label="Bloqués" value={bloques} sub="" color="red" />
        <KpiCard label="Réserve" value={reserves} sub="" color="orange" />
        <KpiCard label="FPY Global" value={`${fpy}%`} sub={`${liberes}/${totalLots}`} color={fpy >= 90 ? 'green' : fpy >= 70 ? 'orange' : 'red'} />
        <KpiCard label="NC ouvertes" value={ncOuv} sub={`${ncEC} en cours`} color="red" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginBottom: 20 }}>
        <BarChart title="Lots par pôle" items={lotsPerPole} />
        <BarChart title="Distribution statuts" items={statusDist} />
        <BarChart title="NC actives par pôle" items={ncPerPole} />
      </div>

      {/* Pole detail table */}
      <div className="data-table-wrap">
        <div className="data-table-header"><h3>Détail par pôle</h3></div>
        <table className="data-table">
          <thead>
            <tr><th>Pôle</th><th>Lots</th><th>Libérés</th><th>Bloqués</th><th>FPY</th><th>NC actives</th></tr>
          </thead>
          <tbody>
            {poleStats.map((ps) => (
              <tr key={ps.pole.id}>
                <td><strong>{ps.pole.name}</strong> <span className="text-muted">({ps.pole.code})</span></td>
                <td className="font-mono">{ps.total}</td>
                <td className="font-mono" style={{ color: 'var(--green)' }}>{ps.lib}</td>
                <td className="font-mono" style={{ color: ps.blk > 0 ? 'var(--red)' : 'inherit' }}>{ps.blk}</td>
                <td>
                  <span className="font-mono" style={{ color: ps.fpy >= 90 ? 'var(--green)' : ps.fpy >= 70 ? 'var(--orange)' : 'var(--red)' }}>
                    {ps.fpy}%
                  </span>
                </td>
                <td className="font-mono" style={{ color: ps.ncs > 0 ? 'var(--red)' : 'inherit' }}>{ps.ncs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent lots across all poles */}
      <div className="data-table-wrap" style={{ marginTop: 20 }}>
        <div className="data-table-header"><h3>Derniers lots (toutes pôles)</h3></div>
        <table className="data-table">
          <thead>
            <tr><th>Lot</th><th>OF</th><th>Pôle</th><th>Atelier</th><th>Statut</th></tr>
          </thead>
          <tbody>
            {[...db.lots].sort((a, b) => b.createdAt - a.createdAt).slice(0, 15).map((l) => {
              const po = getPole(l.poleId);
              const at = getAtelier(l.currentAtelierId);
              return (
                <tr key={l.id}>
                  <td><span className="font-mono text-accent">{l.numLot}</span></td>
                  <td className="font-mono">{l.of}</td>
                  <td>{po ? po.code : '-'}</td>
                  <td>{at ? at.name : '-'}</td>
                  <td><span className={`status-badge st-${l.status.replace(/_/g, '-')}`}>{getStatusLabel(l.status)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
