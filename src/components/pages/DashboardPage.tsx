'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { useModal } from '@/components/Modal';
import KpiCard from '@/components/KpiCard';
import BarChart from '@/components/BarChart';
import LotDetailModal from '@/components/LotDetailModal';
import { formatDate, formatDateShort, getStatusClass, getStatusLabel, downloadCSV } from '@/lib/helpers';

export default function DashboardPage() {
  const {
    currentPoleId, db, getPole, getClient, getProduct, getAtelier, getGamme, getUser,
    getAteliersForPole, getGammesForPole, getLotsForPole, getNCsForPole, getLotResults,
    hasPermission, canAccessPole, setCurrentPoleId,
  } = useStore();
  const { openModal } = useModal();

  const [dlPage, setDlPage] = useState(1);
  const [dlSearch, setDlSearch] = useState('');
  const [dlStatus, setDlStatus] = useState('');
  const [dlExpanded, setDlExpanded] = useState<Record<string, boolean>>({});

  const dlPerPage = 8;

  const pole = currentPoleId ? getPole(currentPoleId) : undefined;
  const pL = currentPoleId ? getLotsForPole(currentPoleId) : [];
  const pN = currentPoleId ? getNCsForPole(currentPoleId) : [];
  const ats = currentPoleId ? getAteliersForPole(currentPoleId) : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tMs = today.getTime();

  const lt = pL.filter((l) => l.createdAt >= tMs).length;
  const ac = pL.filter((l) => l.status === 'soumis').length;
  const aq = pL.filter((l) => l.status === 'valide_chef').length;
  const lib = pL.filter((l) => l.status === 'libere').length;
  const res = pL.filter((l) => l.status === 'reserve').length;
  const blk = pL.filter((l) => l.status === 'bloque').length;
  const tot = pL.length;
  const fpy = tot > 0 ? Math.round((lib / tot) * 100) : 0;
  const tnc = tot > 0 ? Math.round(((blk + res) / tot) * 100) : 0;

  const nco = pN.filter((n) => n.status === 'ouverte').length;
  const nce = pN.filter((n) => n.status === 'en_cours').length;
  const ncc = pN.filter((n) => n.status === 'cloturee').length;

  // Charts data
  const lotsParAtelier = ats.map((a) => ({
    label: a.name.substring(0, 10),
    value: pL.filter((l) => l.currentAtelierId === a.id).length,
    color: 'var(--accent)',
  }));

  const statusData = [
    { label: 'Brouillon', value: pL.filter((l) => l.status === 'brouillon').length, color: 'var(--blue)' },
    { label: 'Soumis', value: ac, color: 'var(--orange)' },
    { label: 'Val. Chef', value: aq, color: 'var(--cyan)' },
    { label: 'Libéré', value: lib, color: 'var(--green)' },
    { label: 'Réserve', value: res, color: 'var(--orange)' },
    { label: 'Bloqué', value: blk, color: 'var(--red)' },
  ];

  const ncParAtelier = ats.map((a) => {
    const cnt = pN.filter((n) => n.atelierId === a.id).length;
    const ouv = pN.filter((n) => n.atelierId === a.id && n.status === 'ouverte').length;
    return {
      label: a.name.substring(0, 10),
      value: cnt,
      color: ouv > 0 ? 'var(--red)' : 'var(--green)',
      extra: ouv > 0 ? `(${ouv} ouv.)` : '',
    };
  });

  // Filtered + paginated lots
  const filtered = useMemo(() => {
    let f = pL.slice();
    if (dlStatus) f = f.filter((l) => l.status === dlStatus);
    if (dlSearch) {
      const q = dlSearch.toLowerCase();
      f = f.filter((l) => {
        const cl = getClient(l.clientId);
        return (
          l.numLot.toLowerCase().includes(q) ||
          l.of.toLowerCase().includes(q) ||
          (cl && cl.name.toLowerCase().includes(q))
        );
      });
    }
    f.sort((a, b) => b.createdAt - a.createdAt);
    return f;
  }, [pL, dlStatus, dlSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / dlPerPage));
  const safePage = Math.min(dlPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * dlPerPage, safePage * dlPerPage);

  const toggleRow = (id: string) => {
    setDlExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const exportDashboardCSV = () => {
    const rows = ['Indicateur;Valeur'];
    rows.push('Total lots;' + tot);
    rows.push("Aujourd'hui;" + lt);
    rows.push('Att. Chef;' + ac);
    rows.push('Att. QC;' + aq);
    rows.push('Libérés;' + lib);
    rows.push('Réserve;' + res);
    rows.push('Bloqués;' + blk);
    rows.push('FPY;' + fpy + '%');
    rows.push('Taux NC;' + tnc + '%');
    rows.push('NC ouvertes;' + nco);
    rows.push('NC en cours;' + nce);
    rows.push('NC clôturées;' + ncc);
    downloadCSV('dashboard_' + formatDateShort(Date.now()).replace(/\//g, '-') + '.csv', rows.join('\n'));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Tableau de bord — {pole ? pole.name : 'Global'}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Vue d&apos;ensemble qualité • {formatDateShort(Date.now())}
          </p>
        </div>
        {hasPermission('report.export') && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>🖨️ Imprimer</button>
            <button className="btn btn-secondary btn-sm" onClick={exportDashboardCSV}>📄 CSV</button>
          </div>
        )}
      </div>

      {/* Pole cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        {db.poles.filter((p) => canAccessPole(p.id)).map((p) => {
          const pl = getLotsForPole(p.id);
          const plib = pl.filter((l) => l.status === 'libere').length;
          const pblk = pl.filter((l) => l.status === 'bloque').length;
          return (
            <div
              key={p.id}
              className={`pole-card${p.id === currentPoleId ? ' active' : ''}`}
              onClick={() => setCurrentPoleId(p.id)}
              style={{ borderLeft: `4px solid ${p.color}` }}
            >
              <h4 style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</h4>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {getAteliersForPole(p.id).length} ateliers • {getGammesForPole(p.id).length} gammes
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12 }}>
                <span>{pl.length} lots</span>
                <span style={{ color: 'var(--green)' }}>{plib} lib.</span>
                <span style={{ color: 'var(--red)' }}>{pblk} bloq.</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total" value={tot} sub={`Pôle ${pole ? pole.code : ''}`} color="accent" />
        <KpiCard label="Aujourd'hui" value={lt} sub="Créés" color="blue" />
        <KpiCard label="Att. Chef" value={ac} sub="À valider" color="orange" />
        <KpiCard label="Att. QC" value={aq} sub="À contrôler" color="purple" />
        <KpiCard label="Libérés" value={lib} sub="Conformes" color="green" />
        <KpiCard label="Réserve" value={res} sub="Sous réserve" color="orange" />
        <KpiCard label="Bloqués" value={blk} sub="NC" color="red" />
        <KpiCard label="FPY" value={fpy + '%'} sub="First Pass Yield" color={fpy >= 80 ? 'green' : fpy >= 60 ? 'orange' : 'red'} />
        <KpiCard label="Taux NC" value={tnc + '%'} sub="Rés.+Bloq." color={tnc <= 10 ? 'green' : tnc <= 25 ? 'orange' : 'red'} />
        <KpiCard label="NC ouv." value={nco} sub="En attente" color={nco > 0 ? 'red' : 'green'} />
        <KpiCard label="NC cours" value={nce} sub="Traitement" color="cyan" />
        <KpiCard label="NC clôt." value={ncc} sub="Résolues" color="green" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <BarChart title="Lots par atelier" items={lotsParAtelier} />
        <BarChart title="Distribution statuts" items={statusData} />
      </div>
      <BarChart title="NC par atelier" items={ncParAtelier} />

      {/* Recent lots table */}
      <div className="data-table-wrap">
        <div className="data-table-header">
          <h3>Lots récents ({filtered.length} / {pL.length})</h3>
        </div>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="form-control"
            style={{ width: 220, padding: '7px 10px' }}
            placeholder="🔍 Lot, OF, client..."
            value={dlSearch}
            onChange={(e) => { setDlSearch(e.target.value); setDlPage(1); }}
          />
          <select
            className="form-control"
            style={{ width: 140, padding: 7 }}
            value={dlStatus}
            onChange={(e) => { setDlStatus(e.target.value); setDlPage(1); }}
          >
            <option value="">Tous statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="soumis">Soumis</option>
            <option value="valide_chef">Validé Chef</option>
            <option value="libere">Libéré</option>
            <option value="reserve">Réserve</option>
            <option value="bloque">Bloqué</option>
          </select>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Page {safePage}/{totalPages}
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 30 }} />
              <th>Lot</th><th>OF</th><th>Client</th><th>Atelier</th><th>Qté</th><th>Statut</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  Aucun lot trouvé
                </td>
              </tr>
            )}
            {paginated.map((l) => {
              const cl = getClient(l.clientId);
              const at = getAtelier(l.currentAtelierId);
              const pr = getProduct(l.productId);
              const gam = getGamme(l.gammeId);
              const isExp = dlExpanded[l.id] === true;
              const results = isExp ? getLotResults(l.id, l.currentAtelierId) : [];
              const hasNOK = results.some((r) => r.verdict === 'NOK');

              return (
                <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => toggleRow(l.id)}>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, transition: 'transform 0.2s', transform: isExp ? 'rotate(90deg)' : 'none' }}>
                    ▶
                  </td>
                  <td><span className="font-mono text-accent">{l.numLot}</span></td>
                  <td className="font-mono">{l.of}</td>
                  <td>{cl ? cl.name : '-'}</td>
                  <td>{at ? at.name : '-'}</td>
                  <td className="font-mono">{l.quantity.toLocaleString()}</td>
                  <td><span className={`status-badge ${getStatusClass(l.status)}`}>{getStatusLabel(l.status)}</span></td>
                  <td className="text-muted">{formatDate(l.createdAt)}</td>
                  {isExp && (
                    <td colSpan={8} style={{ padding: 0, border: 'none' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ padding: '14px 20px', background: 'var(--bg-input)', borderLeft: `4px solid ${hasNOK ? 'var(--red)' : 'var(--accent)'}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6, marginBottom: 10, fontSize: 12 }}>
                          <div><span className="text-muted">Produit:</span> {pr ? pr.name : '-'}</div>
                          <div><span className="text-muted">Gamme:</span> {gam ? gam.name : '-'}</div>
                          <div><span className="text-muted">Machine:</span> {l.machine || '-'}</div>
                          <div><span className="text-muted">BAT:</span> {l.bat || '-'}</div>
                          <div><span className="text-muted">Lot mat.:</span> {l.lotMatiere || '-'}</div>
                          <div><span className="text-muted">Créé par:</span> {(() => { const u = getUser(l.createdBy); return u ? u.fullName : '-'; })()}</div>
                        </div>
                        {l.observations && (
                          <div style={{ padding: '6px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', marginBottom: 8, fontSize: 12, border: '1px solid var(--border)' }}>
                            {l.observations}
                          </div>
                        )}
                        {results.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                            {results.map((r) => {
                              const ct = db.controlLibrary.find((x) => x.id === r.controlId);
                              const bg = r.verdict === 'OK' ? 'var(--green-dim)' : r.verdict === 'WARN' ? 'var(--orange-dim)' : 'var(--red-dim)';
                              const col = r.verdict === 'OK' ? 'var(--green)' : r.verdict === 'WARN' ? 'var(--orange)' : 'var(--red)';
                              return (
                                <span key={r.id} style={{ padding: '3px 8px', background: bg, color: col, borderRadius: 10, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                                  {ct ? ct.name.substring(0, 14) : ''}: {r.verdict}{r.avg != null ? ` (${r.avg.toFixed(2)})` : ''}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={(e) => { e.stopPropagation(); openModal(<LotDetailModal lotId={l.id} />); }}
                        >
                          Voir détail complet
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 }}>
            <button
              className="btn btn-sm btn-secondary"
              disabled={safePage <= 1}
              style={safePage <= 1 ? { opacity: 0.4, pointerEvents: 'none' } : {}}
              onClick={() => setDlPage(safePage - 1)}
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, safePage - 2);
              const pg = start + i;
              if (pg > totalPages) return null;
              return (
                <button
                  key={pg}
                  className={`btn btn-sm ${pg === safePage ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDlPage(pg)}
                >
                  {pg}
                </button>
              );
            })}
            <button
              className="btn btn-sm btn-secondary"
              disabled={safePage >= totalPages}
              style={safePage >= totalPages ? { opacity: 0.4, pointerEvents: 'none' } : {}}
              onClick={() => setDlPage(safePage + 1)}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
