'use client';

import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import { formatDate, formatDateShort, getStatusLabel, downloadCSV } from '@/lib/helpers';

export default function ExportsPage() {
  const {
    currentPoleId, db,
    getPole, getClient, getProduct, getAtelier, getGamme, getUser,
    getLotsForPole, getNCsForPole, getLotResults, hasPermission,
    setCurrentPage,
  } = useStore();
  const { showToast } = useToast();

  if (!hasPermission('report.export')) {
    return (
      <div className="access-denied">
        <div className="icon">🔒</div><h3>Accès refusé</h3><p>Permissions insuffisantes.</p>
      </div>
    );
  }

  const pole = currentPoleId ? getPole(currentPoleId) : undefined;

  const exportLotsCSV = () => {
    const lots = getLotsForPole(currentPoleId || '');
    const rows = ['N° Lot;OF;Client;Produit;Pôle;Gamme;Atelier;Quantité;Machine;Statut;Date création'];
    lots.forEach((l) => {
      const cl = getClient(l.clientId);
      const pr = getProduct(l.productId);
      const po = getPole(l.poleId);
      const gam = getGamme(l.gammeId);
      const at = getAtelier(l.currentAtelierId);
      rows.push([
        l.numLot, l.of, cl ? cl.name : '', pr ? pr.name : '', po ? po.name : '',
        gam ? gam.name : '', at ? at.name : '', l.quantity, l.machine || '',
        getStatusLabel(l.status), formatDate(l.createdAt),
      ].join(';'));
    });
    downloadCSV('lots_' + (pole?.code || 'XX') + '_' + formatDateShort(Date.now()).replace(/\//g, '-') + '.csv', rows.join('\n'));
    showToast('lots CSV téléchargé', 'success');
  };

  const exportNCsCSV = () => {
    const ncs = getNCsForPole(currentPoleId || '');
    const rows = ['N° NC;OF;Atelier;Type;Gravité;Cause;Description;Actions;Statut;Date'];
    ncs.forEach((nc) => {
      const at = getAtelier(nc.atelierId);
      rows.push([
        nc.numero, nc.of, at ? at.name : '', nc.type, nc.gravite,
        '"' + (nc.causePresumee || '').replace(/"/g, '""') + '"',
        '"' + (nc.description || '').replace(/"/g, '""') + '"',
        '"' + (nc.actionsRequises || '').replace(/"/g, '""') + '"',
        nc.status, formatDate(nc.createdAt),
      ].join(';'));
    });
    downloadCSV('nc_' + (pole?.code || 'XX') + '_' + formatDateShort(Date.now()).replace(/\//g, '-') + '.csv', rows.join('\n'));
    showToast('NC CSV téléchargé', 'success');
  };

  const exportResultsCSV = () => {
    const poleId = currentPoleId || '';
    const res = db.lotResults.filter((r) => {
      const lot = db.lots.find((l) => l.id === r.lotId);
      return lot && lot.poleId === poleId;
    });
    const qcR = db.qcResults.filter((r) => {
      const lot = db.lots.find((l) => l.id === r.lotId);
      return lot && lot.poleId === poleId;
    });
    const rows = ['Source;Lot;Atelier;Contrôle;M1;M2;M3;Moyenne;Delta;Verdict;Date'];
    res.forEach((r) => {
      const lot = db.lots.find((l) => l.id === r.lotId);
      const ct = db.controlLibrary.find((c) => c.id === r.controlId);
      const at = getAtelier(r.atelierId);
      rows.push([
        'PROD', lot ? lot.numLot : '', at ? at.name : '', ct ? ct.name : '',
        r.m1 != null ? r.m1 : '', r.m2 != null ? r.m2 : '', r.m3 != null ? r.m3 : '',
        r.avg != null ? r.avg.toFixed(2) : '', r.delta != null ? r.delta.toFixed(2) : '',
        r.verdict, formatDate(r.timestamp),
      ].join(';'));
    });
    qcR.forEach((r) => {
      const lot = db.lots.find((l) => l.id === r.lotId);
      const ct = db.controlLibrary.find((c) => c.id === r.controlId);
      const at = getAtelier(r.atelierId);
      rows.push([
        'QC', lot ? lot.numLot : '', at ? at.name : '', ct ? ct.name : '',
        r.m1 != null ? r.m1 : '', r.m2 != null ? r.m2 : '', r.m3 != null ? r.m3 : '',
        r.avg != null ? r.avg.toFixed(2) : '', r.delta != null ? r.delta.toFixed(2) : '',
        r.verdict, formatDate(r.timestamp),
      ].join(';'));
    });
    downloadCSV('resultats_' + (pole?.code || 'XX') + '.csv', rows.join('\n'));
    showToast('Résultats CSV téléchargé', 'success');
  };

  const exportDashboardCSV = () => {
    const pL = getLotsForPole(currentPoleId || '');
    const pN = getNCsForPole(currentPoleId || '');
    const lib = pL.filter((l) => l.status === 'libere').length;
    const blk = pL.filter((l) => l.status === 'bloque').length;
    const res = pL.filter((l) => l.status === 'reserve').length;
    const tot = pL.length;
    const rows = [
      'Indicateur;Valeur',
      'Total lots;' + tot, 'Libérés;' + lib, 'Réserve;' + res, 'Bloqués;' + blk,
      'FPY;' + (tot > 0 ? Math.round(lib / tot * 100) : 0) + '%',
      'NC ouvertes;' + pN.filter((n) => n.status === 'ouverte').length,
      'NC en cours;' + pN.filter((n) => n.status === 'en_cours').length,
      'NC clôturées;' + pN.filter((n) => n.status === 'cloturee').length,
    ];
    downloadCSV('dashboard_' + (pole?.code || 'XX') + '.csv', rows.join('\n'));
    showToast('Dashboard CSV téléchargé', 'success');
  };

  const exportAuditCSV = () => {
    const logs = [...db.auditLog].sort((a, b) => b.timestamp - a.timestamp);
    const rows = ['Date;Utilisateur;Rôle;Action;Entité;Ancien;Nouveau;Pôle'];
    logs.forEach((l) => {
      const u = getUser(l.userId || '');
      const p = getPole(l.poleId);
      rows.push([
        formatDate(l.timestamp), u ? u.fullName : '', l.role || '', l.action,
        l.entity || '', l.oldValue || '', l.newValue || '', p ? p.code : '',
      ].join(';'));
    });
    downloadCSV('audit_log.csv', rows.join('\n'));
    showToast('Audit CSV téléchargé', 'success');
  };

  const cards = [
    { title: '📊 CSV — Lots', desc: 'Export de tous les lots du pôle actif', action: exportLotsCSV, label: 'Télécharger CSV', primary: true },
    { title: '⚠️ CSV — Non-conformités', desc: 'Registre NC complet', action: exportNCsCSV, label: 'Télécharger CSV', primary: true },
    { title: '🔬 CSV — Résultats contrôles', desc: 'Toutes les mesures production et QC', action: exportResultsCSV, label: 'Télécharger CSV', primary: true },
    { title: '📊 CSV — Dashboard', desc: 'Synthèse KPI du pôle', action: exportDashboardCSV, label: 'Télécharger CSV', primary: true },
    { title: '🖨️ Imprimer Dashboard', desc: 'Impression du tableau de bord', action: () => { setCurrentPage('dashboard'); setTimeout(() => window.print(), 500); }, label: 'Imprimer', primary: false },
    { title: '📜 CSV — Journal d\'audit', desc: 'Traçabilité actions', action: exportAuditCSV, label: 'Télécharger CSV', primary: true },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📄 Exports & Documents — {pole ? pole.name : ''}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Générer des rapports et exporter des données</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {cards.map((c, i) => (
          <div key={i} className="card">
            <div className="card-title">{c.title}</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{c.desc}</p>
            <button className={`btn ${c.primary ? 'btn-primary' : 'btn-secondary'}`} onClick={c.action}>{c.label}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
