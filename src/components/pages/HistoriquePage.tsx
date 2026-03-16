'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { useModal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import LotDetailModal from '@/components/LotDetailModal';
import { formatDate, formatDateShort, getStatusClass, getStatusLabel, downloadCSV } from '@/lib/helpers';

export default function HistoriquePage() {
  const {
    currentPoleId, db,
    getPole, getClient, getAtelier, getGamme,
    getAteliersForPole, getLotsForPole, hasPermission,
  } = useStore();
  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();

  const [filterStatus, setFilterStatus] = useState('');
  const [filterAtelier, setFilterAtelier] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const pole = currentPoleId ? getPole(currentPoleId) : undefined;
  const ateliers = getAteliersForPole(currentPoleId || '');
  const allLots = getLotsForPole(currentPoleId || '');

  const filtered = useMemo(() => {
    let f = [...allLots];
    if (filterStatus) f = f.filter((l) => l.status === filterStatus);
    if (filterAtelier) f = f.filter((l) => l.currentAtelierId === filterAtelier);
    if (dateFrom) f = f.filter((l) => l.createdAt >= new Date(dateFrom).getTime());
    if (dateTo) f = f.filter((l) => l.createdAt <= new Date(dateTo).getTime() + 86400000);
    if (search) {
      const q = search.toLowerCase();
      f = f.filter((l) => {
        const cl = getClient(l.clientId);
        return l.numLot.toLowerCase().includes(q) || l.of.toLowerCase().includes(q) || (cl && cl.name.toLowerCase().includes(q));
      });
    }
    f.sort((a, b) => b.createdAt - a.createdAt);
    return f;
  }, [allLots, filterStatus, filterAtelier, dateFrom, dateTo, search, getClient]);

  const viewLotDetail = (lotId: string) => {
    openModal(<LotDetailModal lotId={lotId} />);
  };

  const exportHistCSV = () => {
    const rows = ['N° Lot;OF;Client;Produit;Pôle;Gamme;Atelier;Quantité;Machine;Statut;Date création'];
    allLots.forEach((l) => {
      const cl = getClient(l.clientId);
      const pr = db.products.find((p) => p.id === l.productId);
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
    showToast('Export CSV téléchargé', 'success');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📋 Historique — {pole ? pole.name : ''}</h2>
        {hasPermission('report.export') && (
          <button className="btn btn-secondary btn-sm" onClick={exportHistCSV}>📄 Export CSV</button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11 }}>Statut</label>
            <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Tous</option>
              <option value="brouillon">Brouillon</option>
              <option value="soumis">Soumis</option>
              <option value="valide_chef">Validé Chef</option>
              <option value="libere">Libéré</option>
              <option value="reserve">Réserve</option>
              <option value="bloque">Bloqué</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11 }}>Atelier</label>
            <select className="form-control" value={filterAtelier} onChange={(e) => setFilterAtelier(e.target.value)}>
              <option value="">Tous</option>
              {ateliers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11 }}>Du</label>
            <input className="form-control" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11 }}>Au</label>
            <input className="form-control" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11 }}>Recherche</label>
            <input className="form-control" placeholder="Lot, OF, client..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="data-table-wrap">
        <div className="data-table-header">
          <h3>Résultats ({filtered.length})</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Lot</th><th>OF</th><th>Client</th><th>Gamme</th><th>Atelier</th><th>Qté</th><th>Statut</th><th>Date</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Aucun résultat</td></tr>
            )}
            {filtered.map((l) => {
              const cl = getClient(l.clientId);
              const at = getAtelier(l.currentAtelierId);
              const gam = getGamme(l.gammeId);
              return (
                <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => viewLotDetail(l.id)}>
                  <td><span className="font-mono text-accent">{l.numLot}</span></td>
                  <td className="font-mono">{l.of}</td>
                  <td>{cl ? cl.name : '-'}</td>
                  <td style={{ fontSize: 11 }}>{gam ? gam.name : '-'}</td>
                  <td>{at ? at.name : '-'}</td>
                  <td className="font-mono">{l.quantity.toLocaleString()}</td>
                  <td><span className={`status-badge ${getStatusClass(l.status)}`}>{getStatusLabel(l.status)}</span></td>
                  <td className="text-muted">{formatDate(l.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
