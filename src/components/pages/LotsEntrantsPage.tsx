'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useModal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import LotDetailModal from '@/components/LotDetailModal';
import { formatDate, getStatusClass, getStatusLabel, generateId } from '@/lib/helpers';

export default function LotsEntrantsPage() {
  const {
    currentPoleId, currentAtelierId, currentUser, db,
    getPole, getClient, getAtelier, getGamme, getLotsForPole,
    getNextAtelierInGamme, hasPermission, addAuditLog, updateDB,
  } = useStore();
  const { openModal } = useModal();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'e' | 'p'>('e');

  const pole = currentPoleId ? getPole(currentPoleId) : undefined;
  const pL = currentPoleId ? getLotsForPole(currentPoleId) : [];

  const incoming = pL.filter((l) => {
    const ok = l.status === 'libere' || l.status === 'reserve';
    if (currentAtelierId) return l.currentAtelierId === currentAtelierId && ok;
    return ok;
  });

  const inProg = pL.filter((l) => {
    const ok = l.status === 'brouillon' || l.status === 'soumis';
    if (currentAtelierId) return l.currentAtelierId === currentAtelierId && ok;
    return ok;
  });

  const recallLot = (lid: string) => {
    const lot = db.lots.find((l) => l.id === lid);
    if (!lot) return;
    if (lot.status !== 'soumis') {
      showToast('Ce lot a déjà été traité par le chef', 'error');
      return;
    }
    if (lot.createdBy !== currentUser?.id) {
      showToast('Vous ne pouvez rappeler que vos propres lots', 'error');
      return;
    }
    updateDB((d) => ({
      ...d,
      lots: d.lots.map((l) =>
        l.id === lid ? { ...l, status: 'brouillon', updatedAt: Date.now() } : l
      ),
    }));
    addAuditLog('lot.recall', lid, 'soumis', 'brouillon');
    showToast('Lot ' + lot.numLot + ' rappelé en brouillon', 'success');
  };

  const repriseLot = (lid: string) => {
    const lot = db.lots.find((l) => l.id === lid);
    if (!lot) return;
    const gam = db.gammes.find((g) => g.id === lot.gammeId);
    if (!gam) return;
    const nxt = getNextAtelierInGamme(lot.gammeId, lot.currentAtelierId);
    if (!nxt) {
      showToast('Dernier atelier', 'warning');
      return;
    }
    const nI = gam.steps.indexOf(nxt);
    updateDB((d) => {
      const newSteps = d.lotSteps.map((s) =>
        s.lotId === lid && s.status === 'in_progress'
          ? { ...s, status: 'completed' as const, completedAt: Date.now() }
          : s
      );
      newSteps.push({
        id: generateId(),
        lotId: lid,
        atelierId: nxt,
        stepIndex: nI,
        status: 'in_progress' as const,
        enteredAt: Date.now(),
        completedAt: null,
        operatorId: currentUser?.id || '',
        chefId: null,
        validatedAt: null,
      });
      return {
        ...d,
        lots: d.lots.map((l) =>
          l.id === lid
            ? { ...l, currentAtelierId: nxt, currentStepIndex: nI, status: 'brouillon' as const, updatedAt: Date.now() }
            : l
        ),
        lotSteps: newSteps,
      };
    });
    addAuditLog('lot.reprise', lid, null, nxt);
    const atName = db.ateliers.find((a) => a.id === nxt)?.name || '';
    showToast('Lot repris vers ' + atName, 'success');
  };

  const renderTable = (lots: typeof pL, showReprise: boolean) => (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Lot</th><th>OF</th><th>Client</th><th>Gamme</th><th>Atelier</th><th>Qté</th><th>Statut</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {lots.length === 0 && (
            <tr>
              <td colSpan={8}>
                <div className="empty-state"><div className="icon">📭</div><h3>Aucun lot</h3></div>
              </td>
            </tr>
          )}
          {lots.map((l) => {
            const cl = getClient(l.clientId);
            const at = getAtelier(l.currentAtelierId);
            const gam = getGamme(l.gammeId);
            return (
              <tr key={l.id}>
                <td><span className="font-mono text-accent">{l.numLot}</span></td>
                <td className="font-mono">{l.of}</td>
                <td>{cl ? cl.name : '-'}</td>
                <td style={{ fontSize: 11 }}>{gam ? gam.name : '-'}</td>
                <td>{at ? at.name : '-'}</td>
                <td className="font-mono">{l.quantity.toLocaleString()}</td>
                <td><span className={`status-badge ${getStatusClass(l.status)}`}>{getStatusLabel(l.status)}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => openModal(<LotDetailModal lotId={l.id} />)}>
                      Détail
                    </button>
                    {showReprise && hasPermission('lot.create') && getNextAtelierInGamme(l.gammeId, l.currentAtelierId) && (
                      <button className="btn btn-sm btn-primary" onClick={() => repriseLot(l.id)}>
                        Reprendre →
                      </button>
                    )}
                    {l.status === 'soumis' && l.createdBy === currentUser?.id && hasPermission('lot.create') && (
                      <button className="btn btn-sm btn-orange" onClick={() => recallLot(l.id)}>
                        ↩ Rappeler
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📥 Lots entrants — {pole ? pole.name : ''}</h2>
      </div>

      <div className="tabs">
        <div className={`tab${tab === 'e' ? ' active' : ''}`} onClick={() => setTab('e')}>
          Entrants ({incoming.length})
        </div>
        <div className={`tab${tab === 'p' ? ' active' : ''}`} onClick={() => setTab('p')}>
          En cours ({inProg.length})
        </div>
      </div>

      {tab === 'e' && renderTable(incoming, true)}
      {tab === 'p' && renderTable(inProg, false)}
    </div>
  );
}
