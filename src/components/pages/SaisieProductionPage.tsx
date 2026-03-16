'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import { generateId, formatDate, computeMeasureVerdict } from '@/lib/helpers';
import { Ink } from '@/types';

interface FormData {
  of: string;
  clientId: string;
  productId: string;
  quantity: number | '';
  machine: string;
  lotMatiere: string;
  bat: string;
  observations: string;
  gammeId: string;
  measures: Record<string, { m1: number | null; m2: number | null; m3: number | null }>;
  checks: Record<string, string>;
  customTargets: Record<string, { target?: number; tolerance?: number }>;
  inks: Ink[];
}

export default function SaisieProductionPage() {
  const {
    currentPoleId, currentAtelierId, currentGammeId, currentUser, db,
    getPole, getAtelier, getGamme, getClient,
    getAteliersForPole, getGammesForPole, getMachinesForAtelier,
    getControlsForAtelier, getLotsForPole, getProductsForClient,
    hasPermission, updateDB, addAuditLog, setCurrentPage,
    editingLotId, editingDraftId, setEditingLotId, setEditingDraftId,
    getTechSheetForControl,
  } = useStore();
  const { showToast } = useToast();

  const [fd, setFd] = useState<FormData>({
    of: '', clientId: '', productId: '', quantity: '', machine: '',
    lotMatiere: '', bat: '', observations: '', gammeId: currentGammeId || '',
    measures: {}, checks: {}, customTargets: {}, inks: [],
  });
  const [inks, setInks] = useState<Ink[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const periodicTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isEditing = !!editingLotId;
  const isFormOpen = editingDraftId !== null || editingLotId !== null;

  // Load form data from draft or lot
  useEffect(() => {
    if (editingDraftId && editingDraftId !== 'new') {
      const dr = db.drafts.find((d) => d.id === editingDraftId);
      if (dr) {
        setFd({
          of: dr.of || '', clientId: dr.clientId || '', productId: dr.productId || '',
          quantity: dr.quantity || '', machine: dr.machine || '', lotMatiere: dr.lotMatiere || '',
          bat: dr.bat || '', observations: dr.observations || '', gammeId: dr.gammeId || '',
          measures: dr.measures || {}, checks: dr.checks || {},
          customTargets: dr.customTargets || {}, inks: dr.inks || [],
        });
        setInks(dr.inks ? dr.inks.slice() : []);
      }
    } else if (editingLotId) {
      const lot = db.lots.find((l) => l.id === editingLotId);
      if (lot) {
        const lotResults = db.lotResults.filter((r) => r.lotId === lot.id && r.atelierId === lot.currentAtelierId && !r.isInk);
        const ms: FormData['measures'] = {};
        const ct2: FormData['customTargets'] = lot.customTargets || {};
        lotResults.forEach((r) => {
          ms[r.controlId] = { m1: r.m1, m2: r.m2, m3: r.m3 };
          if (r.usedTarget != null || r.usedTolerance != null) {
            if (!ct2[r.controlId]) ct2[r.controlId] = {};
            if (r.usedTarget != null) ct2[r.controlId].target = r.usedTarget;
            if (r.usedTolerance != null) ct2[r.controlId].tolerance = r.usedTolerance;
          }
        });
        setFd({
          of: lot.of, clientId: lot.clientId, productId: lot.productId,
          quantity: lot.quantity, machine: lot.machine, lotMatiere: lot.lotMatiere,
          bat: lot.bat, observations: lot.observations, gammeId: lot.gammeId,
          measures: ms, checks: {}, customTargets: ct2, inks: lot.inks || [],
        });
        setInks(lot.inks ? lot.inks.slice() : []);
      }
    } else if (editingDraftId === 'new') {
      setFd({
        of: '', clientId: '', productId: '', quantity: '', machine: '',
        lotMatiere: '', bat: '', observations: '', gammeId: currentGammeId || '',
        measures: {}, checks: {}, customTargets: {}, inks: [],
      });
      setInks([]);
    }
  }, [editingDraftId, editingLotId]);

  // Periodic auto-save
  useEffect(() => {
    if (isFormOpen) {
      periodicTimer.current = setInterval(() => { performAutoSave(); }, 30000);
    }
    return () => { if (periodicTimer.current) clearInterval(periodicTimer.current); };
  }, [isFormOpen]);

  const triggerAutoSave = useCallback(() => {
    setAutoSaveStatus('saving');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { performAutoSave(); }, 1500);
  }, []);

  const performAutoSave = () => {
    const data = { ...fd, inks };
    if (editingLotId) {
      updateDB((d) => ({
        ...d,
        lots: d.lots.map((l) =>
          l.id === editingLotId
            ? { ...l, of: data.of, clientId: data.clientId, productId: data.productId, quantity: Number(data.quantity) || 0, machine: data.machine, lotMatiere: data.lotMatiere, bat: data.bat, observations: data.observations, gammeId: data.gammeId, customTargets: data.customTargets, inks: data.inks, updatedAt: Date.now() }
            : l
        ),
      }));
      saveMeasureResults(editingLotId, currentAtelierId || '', data.measures, data.customTargets, data.inks);
    } else {
      const did = editingDraftId === 'new' ? null : editingDraftId;
      updateDB((d) => {
        let drafts = [...d.drafts];
        let existingIdx = did ? drafts.findIndex((dr) => dr.id === did) : -1;
        if (existingIdx >= 0) {
          drafts[existingIdx] = { ...drafts[existingIdx], ...data, quantity: Number(data.quantity) || 0, updatedAt: Date.now() };
        } else {
          const newDraft = {
            id: generateId(), poleId: currentPoleId || '', atelierId: currentAtelierId || '',
            createdBy: currentUser?.id || '', createdAt: Date.now(), updatedAt: Date.now(),
            ...data, quantity: Number(data.quantity) || 0,
          };
          drafts.push(newDraft);
          setTimeout(() => setEditingDraftId(newDraft.id), 0);
        }
        return { ...d, drafts };
      });
    }
    setAutoSaveStatus('saved');
  };

  const saveMeasureResults = (lid: string, aid: string, measures: FormData['measures'], customTargets: FormData['customTargets'], inkArr: Ink[]) => {
    updateDB((d) => {
      let results = d.lotResults.filter((r) => !(r.lotId === lid && r.atelierId === aid));
      const ctrls = d.controlLibrary.filter((c) => c.atelierId === aid && c.active);
      Object.keys(measures).forEach((cid) => {
        const m = measures[cid];
        const ct = ctrls.find((c) => c.id === cid);
        if (!ct) return;
        const vs: number[] = [];
        if (m.m1 != null && !isNaN(m.m1)) vs.push(m.m1);
        if (m.m2 != null && !isNaN(m.m2)) vs.push(m.m2);
        if (m.m3 != null && !isNaN(m.m3)) vs.push(m.m3);
        if (!vs.length) return;
        const cust = customTargets[cid] || {};
        const usedTarget = cust.target != null ? cust.target : (ct.target != null ? ct.target : 0);
        const usedTol = cust.tolerance != null ? cust.tolerance : (ct.tolerance != null ? ct.tolerance : 0);
        const result = computeMeasureVerdict(vs, usedTarget, usedTol);
        results.push({
          id: generateId(), lotId: lid, atelierId: aid, controlId: cid, isInk: false, inkName: null,
          m1: m.m1, m2: m.m2, m3: m.m3, avg: result.avg, delta: result.delta, verdict: result.verdict,
          usedTarget, usedTolerance: usedTol, timestamp: Date.now(), userId: currentUser?.id || '',
        });
      });
      inkArr.forEach((ink) => {
        if (!ink.name) return;
        const vs: number[] = [];
        if (ink.m1 != null && !isNaN(ink.m1)) vs.push(ink.m1);
        if (ink.m2 != null && !isNaN(ink.m2)) vs.push(ink.m2);
        if (ink.m3 != null && !isNaN(ink.m3)) vs.push(ink.m3);
        if (!vs.length) return;
        const tgt = ink.target != null ? Number(ink.target) : 0;
        const tol = ink.tolerance != null ? Number(ink.tolerance) : 0;
        const result = computeMeasureVerdict(vs, tgt, tol);
        results.push({
          id: generateId(), lotId: lid, atelierId: aid, controlId: 'ink_' + ink.id, isInk: true, inkName: ink.name,
          m1: ink.m1, m2: ink.m2, m3: ink.m3, avg: result.avg, delta: result.delta, verdict: result.verdict,
          usedTarget: tgt, usedTolerance: tol, timestamp: Date.now(), userId: currentUser?.id || '',
        });
      });
      return { ...d, lotResults: results };
    });
  };

  const cancelEdit = () => {
    setEditingDraftId(null);
    setEditingLotId(null);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (periodicTimer.current) clearInterval(periodicTimer.current);
  };

  const saveDraft = () => {
    performAutoSave();
    showToast('Brouillon sauvegardé', 'success');
  };

  const submitLot = () => {
    if (!fd.of) { showToast('OF obligatoire', 'error'); return; }
    if (!fd.clientId) { showToast('Client obligatoire', 'error'); return; }
    if (!fd.quantity || Number(fd.quantity) <= 0) { showToast('Quantité obligatoire', 'error'); return; }

    const data = { ...fd, inks };

    if (editingLotId) {
      updateDB((d) => ({
        ...d,
        lots: d.lots.map((l) =>
          l.id === editingLotId
            ? { ...l, of: data.of, clientId: data.clientId, productId: data.productId, quantity: Number(data.quantity) || 0, machine: data.machine, lotMatiere: data.lotMatiere, bat: data.bat, observations: data.observations, gammeId: data.gammeId, customTargets: data.customTargets, inks: data.inks, status: 'soumis', updatedAt: Date.now() }
            : l
        ),
      }));
      saveMeasureResults(editingLotId, currentAtelierId || '', data.measures, data.customTargets, data.inks);
      const lot = db.lots.find((l) => l.id === editingLotId);
      addAuditLog('lot.submit', editingLotId, 'brouillon', 'soumis');
      showToast('Lot ' + (lot?.numLot || '') + ' soumis', 'success');
    } else {
      const pole = currentPoleId ? getPole(currentPoleId) : undefined;
      const pc = pole ? pole.code : 'XX';
      const nl = 'LOT-' + pc + '-2026-' + String(db.lots.length + 1).padStart(3, '0');
      const gam = data.gammeId ? getGamme(data.gammeId) : undefined;
      const fa = currentAtelierId || (gam ? gam.steps[0] : '');
      const si = gam ? gam.steps.indexOf(fa) : 0;
      const newLotId = generateId();

      updateDB((d) => {
        const newLot = {
          id: newLotId, numLot: nl, of: data.of, clientId: data.clientId, productId: data.productId,
          poleId: currentPoleId || '', gammeId: data.gammeId, quantity: Number(data.quantity) || 0,
          currentAtelierId: fa, currentStepIndex: si, status: 'soumis',
          createdBy: currentUser?.id || '', createdAt: Date.now(), updatedAt: Date.now(),
          machine: data.machine, lotMatiere: data.lotMatiere, bat: data.bat,
          observations: data.observations, customTargets: data.customTargets, inks: data.inks,
        };
        const newStep = {
          id: generateId(), lotId: newLotId, atelierId: fa, stepIndex: si,
          status: 'in_progress', enteredAt: Date.now(), completedAt: null,
          operatorId: currentUser?.id || '', chefId: null, validatedAt: null,
        };
        let drafts = d.drafts;
        if (editingDraftId && editingDraftId !== 'new') {
          drafts = drafts.filter((dr) => dr.id !== editingDraftId);
        }
        return { ...d, lots: [...d.lots, newLot], lotSteps: [...d.lotSteps, newStep], drafts };
      });
      saveMeasureResults(newLotId, fa, data.measures, data.customTargets, data.inks);
      addAuditLog('lot.create', newLotId, null, nl);
      addAuditLog('lot.submit', newLotId, null, 'soumis');
      showToast('Lot ' + nl + ' créé et soumis', 'success');
    }

    setEditingDraftId(null);
    setEditingLotId(null);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (periodicTimer.current) clearInterval(periodicTimer.current);
    setCurrentPage('dashboard');
  };

  const updateField = (key: keyof FormData, value: any) => {
    setFd((prev) => ({ ...prev, [key]: value }));
    triggerAutoSave();
  };

  const updateMeasure = (cid: string, field: 'm1' | 'm2' | 'm3', val: string) => {
    setFd((prev) => ({
      ...prev,
      measures: {
        ...prev.measures,
        [cid]: { ...prev.measures[cid], [field]: val !== '' ? parseFloat(val) : null },
      },
    }));
    triggerAutoSave();
  };

  const updateCustomTarget = (cid: string, field: 'target' | 'tolerance', val: string) => {
    setFd((prev) => ({
      ...prev,
      customTargets: {
        ...prev.customTargets,
        [cid]: { ...prev.customTargets[cid], [field]: val !== '' ? parseFloat(val) : undefined },
      },
    }));
    triggerAutoSave();
  };

  const updateCheck = (cid: string, val: string) => {
    setFd((prev) => ({ ...prev, checks: { ...prev.checks, [cid]: val } }));
    triggerAutoSave();
  };

  // Ink management
  const addInk = () => {
    setInks((prev) => [...prev, { id: generateId(), name: '', target: '', tolerance: 0.10, unit: 'D', m1: null, m2: null, m3: null }]);
    triggerAutoSave();
  };

  const removeInk = (idx: number) => {
    setInks((prev) => prev.filter((_, i) => i !== idx));
    triggerAutoSave();
  };

  const updateInk = (idx: number, field: keyof Ink, val: any) => {
    setInks((prev) => prev.map((ink, i) => i === idx ? { ...ink, [field]: val } : ink));
    triggerAutoSave();
  };

  // Compute verdict for a measure
  const getVerdict = (cid: string) => {
    const m = fd.measures[cid];
    if (!m) return { avg: null, delta: null, verdict: '--', cls: 'verdict-na', rowCls: '' };
    const ct = db.controlLibrary.find((c) => c.id === cid);
    if (!ct) return { avg: null, delta: null, verdict: '--', cls: 'verdict-na', rowCls: '' };
    const cust = fd.customTargets[cid] || {};
    const ts = fd.productId ? getTechSheetForControl(fd.productId, currentAtelierId || '', cid) : null;
    const target = cust.target != null ? cust.target : (ts?.target != null ? ts.target : (ct.target != null ? ct.target : 0));
    const tol = cust.tolerance != null ? cust.tolerance : (ts?.tolerance != null ? ts.tolerance : (ct.tolerance != null ? ct.tolerance : 0));
    const vs: number[] = [];
    if (m.m1 != null && !isNaN(m.m1)) vs.push(m.m1);
    if (m.m2 != null && !isNaN(m.m2)) vs.push(m.m2);
    if (m.m3 != null && !isNaN(m.m3)) vs.push(m.m3);
    if (!vs.length) return { avg: null, delta: null, verdict: '--', cls: 'verdict-na', rowCls: '' };
    const r = computeMeasureVerdict(vs, target, tol);
    const cls = r.verdict === 'OK' ? 'verdict-ok' : r.verdict === 'WARN' ? 'verdict-warn' : 'verdict-nok';
    const rowCls = r.verdict === 'OK' ? 'measure-row-ok' : r.verdict === 'WARN' ? 'measure-row-warn' : 'measure-row-nok';
    return { avg: r.avg, delta: r.delta, verdict: r.verdict, cls, rowCls };
  };

  const getInkVerdict = (ink: Ink) => {
    const vs: number[] = [];
    if (ink.m1 != null && !isNaN(ink.m1)) vs.push(ink.m1);
    if (ink.m2 != null && !isNaN(ink.m2)) vs.push(ink.m2);
    if (ink.m3 != null && !isNaN(ink.m3)) vs.push(ink.m3);
    if (!vs.length || ink.target === '' || ink.target == null) return { avg: null, delta: null, verdict: '--', cls: 'verdict-na', rowCls: '' };
    const tgt = Number(ink.target) || 0;
    const tol = Number(ink.tolerance) || 0;
    const r = computeMeasureVerdict(vs, tgt, tol);
    const cls = r.verdict === 'OK' ? 'verdict-ok' : r.verdict === 'WARN' ? 'verdict-warn' : 'verdict-nok';
    const rowCls = r.verdict === 'OK' ? 'measure-row-ok' : r.verdict === 'WARN' ? 'measure-row-warn' : 'measure-row-nok';
    return { avg: r.avg, delta: r.delta, verdict: r.verdict, cls, rowCls };
  };

  // Permission check
  if (!hasPermission('lot.create')) {
    return (
      <div className="access-denied">
        <div className="icon">🔒</div><h3>Accès refusé</h3><p>Permissions insuffisantes.</p>
      </div>
    );
  }

  // Not editing: show drafts list
  if (!isFormOpen) {
    const drafts = db.drafts.filter((d) => d.createdBy === currentUser?.id && d.poleId === currentPoleId);
    const bLots = getLotsForPole(currentPoleId || '').filter((l) => l.status === 'brouillon' && l.createdBy === currentUser?.id);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>📝 Saisie production</h2>
          <button className="btn btn-primary" onClick={() => setEditingDraftId('new')}>+ Nouveau lot</button>
        </div>

        {(drafts.length > 0 || bLots.length > 0) && (
          <div className="card">
            <div className="card-title">📂 Brouillons</div>
            {drafts.map((d) => {
              const cl = getClient(d.clientId);
              return (
                <div key={d.id} className="draft-card">
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600 }}>{d.of || 'Sans OF'}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cl ? cl.name : '?'} • Qté: {d.quantity || 0} • {formatDate(d.updatedAt)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-primary" onClick={() => setEditingDraftId(d.id)}>Reprendre</button>
                    <button className="btn btn-sm btn-danger" onClick={() => {
                      updateDB((db2) => ({ ...db2, drafts: db2.drafts.filter((x) => x.id !== d.id) }));
                      showToast('Supprimé', 'info');
                    }}>Suppr.</button>
                  </div>
                </div>
              );
            })}
            {bLots.map((l) => (
              <div key={l.id} className="draft-card" style={{ borderLeft: '3px solid var(--orange)' }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600 }}>{l.numLot} — {l.of}</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Renvoyé en production</p>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setEditingLotId(l.id)}>Reprendre</button>
              </div>
            ))}
          </div>
        )}

        <div className="empty-state" style={{ padding: 40 }}>
          <div className="icon">📝</div>
          <h3>Cliquez sur &quot;+ Nouveau lot&quot;</h3>
        </div>
      </div>
    );
  }

  // === FORM ===
  const pole = currentPoleId ? getPole(currentPoleId) : undefined;
  const at = currentAtelierId ? getAtelier(currentAtelierId) : undefined;
  const gams = currentPoleId ? getGammesForPole(currentPoleId) : [];
  const machs = currentAtelierId ? getMachinesForAtelier(currentAtelierId) : [];
  const ctrls = currentAtelierId ? getControlsForAtelier(currentAtelierId) : [];
  const measureCtrls = ctrls.filter((c) => c.type === 'measure');
  const checkCtrls = ctrls.filter((c) => c.type === 'check');
  const clients = db.clients;
  const products = fd.clientId ? getProductsForClient(fd.clientId, currentPoleId || '') : [];
  const editingLot = editingLotId ? db.lots.find((l) => l.id === editingLotId) : null;

  return (
    <div>
      {/* Auto-save bar */}
      <div className="autosave-bar">
        <div className={`pulse ${autoSaveStatus === 'saving' ? 'saving' : 'saved'}`} />
        <span>{autoSaveStatus === 'saving' ? 'Sauvegarde...' : 'Auto-save actif'}</span>
        <button className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={cancelEdit}>Annuler</button>
      </div>

      {/* Main form card */}
      <div className="card">
        <div className="card-title">📋 {isEditing ? 'Modifier ' + (editingLot?.numLot || '') : 'Nouveau lot'}</div>

        {/* Row 1: Pole, Gamme, Atelier */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="form-group">
            <label>Pôle</label>
            <input className="form-control" value={pole ? pole.name : ''} disabled />
          </div>
          <div className="form-group">
            <label>Gamme <span className="req">*</span></label>
            <select className="form-control" value={fd.gammeId} onChange={(e) => updateField('gammeId', e.target.value)}>
              {gams.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Atelier</label>
            <input className="form-control" value={at ? at.name : ''} disabled />
          </div>
        </div>

        {/* Row 2: OF, Date, Heure */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="form-group">
            <label>OF <span className="req">*</span></label>
            <input className="form-control" value={fd.of} onChange={(e) => updateField('of', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input className="form-control" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="form-group">
            <label>Heure</label>
            <input className="form-control" type="time" defaultValue={new Date().toTimeString().substring(0, 5)} />
          </div>
        </div>

        {/* Row 3: Client, Produit, Quantité */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="form-group">
            <label>Client <span className="req">*</span></label>
            <select className="form-control" value={fd.clientId} onChange={(e) => { updateField('clientId', e.target.value); updateField('productId', ''); }}>
              <option value="">--</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Produit</label>
            <select className="form-control" value={fd.productId} onChange={(e) => updateField('productId', e.target.value)}>
              <option value="">← Choisir client</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Quantité <span className="req">*</span></label>
            <input className="form-control" type="number" value={fd.quantity} onChange={(e) => updateField('quantity', e.target.value ? parseInt(e.target.value) : '')} />
          </div>
        </div>

        {/* Row 4: Machine, Lot matière, BAT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="form-group">
            <label>Machine</label>
            <select className="form-control" value={fd.machine} onChange={(e) => updateField('machine', e.target.value)}>
              <option value="">--</option>
              {machs.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Lot matière</label>
            <input className="form-control" value={fd.lotMatiere} onChange={(e) => updateField('lotMatiere', e.target.value)} />
          </div>
          <div className="form-group">
            <label>BAT</label>
            <input className="form-control" value={fd.bat} onChange={(e) => updateField('bat', e.target.value)} />
          </div>
        </div>

        {/* Observations */}
        <div className="form-group">
          <label>Observations</label>
          <textarea className="form-control" value={fd.observations} onChange={(e) => updateField('observations', e.target.value)} />
        </div>
      </div>

      {/* Inks section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="card-title">🎨 Encres du dossier</div>
          <button className="btn btn-sm btn-primary" onClick={addInk}>+ Ajouter encre</button>
        </div>
        <div style={{ padding: '6px 12px', background: 'var(--blue-dim)', border: '1px solid var(--blue)', borderRadius: 'var(--radius-sm)', marginBottom: 12, fontSize: 12, color: 'var(--blue)' }}>
          Ajoutez les encres utilisées sur ce dossier : CMJN, Pantones, vernis... Le nombre de lignes est libre.
        </div>
        {inks.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
            Aucune encre. Cliquez sur &quot;+ Ajouter encre&quot; pour définir les encres de ce dossier.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Encre</th><th>Cible</th><th>Tol.</th><th>M1</th><th>M2</th><th>M3</th><th>Moy.</th><th>Δ</th><th>Verdict</th><th></th></tr>
            </thead>
            <tbody>
              {inks.map((ink, idx) => {
                const v = getInkVerdict(ink);
                return (
                  <tr key={ink.id} className={v.rowCls}>
                    <td><input className="form-control" style={{ width: 130, padding: 5 }} placeholder="Cyan, Pantone 485C..." value={ink.name || ''} onChange={(e) => updateInk(idx, 'name', e.target.value)} /></td>
                    <td><input className="form-control" style={{ width: 70, padding: 5, textAlign: 'center' }} type="number" step="0.01" value={ink.target !== null && ink.target !== '' ? ink.target : ''} onChange={(e) => updateInk(idx, 'target', e.target.value !== '' ? parseFloat(e.target.value) : null)} /></td>
                    <td><input className="form-control" style={{ width: 65, padding: 5, textAlign: 'center' }} type="number" step="0.01" value={ink.tolerance != null ? ink.tolerance : ''} onChange={(e) => updateInk(idx, 'tolerance', e.target.value !== '' ? parseFloat(e.target.value) : null)} /></td>
                    <td><input className="form-control" style={{ width: 68, padding: 5, textAlign: 'center' }} type="number" step="0.01" value={ink.m1 != null ? ink.m1 : ''} onChange={(e) => updateInk(idx, 'm1', e.target.value !== '' ? parseFloat(e.target.value) : null)} /></td>
                    <td><input className="form-control" style={{ width: 68, padding: 5, textAlign: 'center' }} type="number" step="0.01" value={ink.m2 != null ? ink.m2 : ''} onChange={(e) => updateInk(idx, 'm2', e.target.value !== '' ? parseFloat(e.target.value) : null)} /></td>
                    <td><input className="form-control" style={{ width: 68, padding: 5, textAlign: 'center' }} type="number" step="0.01" value={ink.m3 != null ? ink.m3 : ''} onChange={(e) => updateInk(idx, 'm3', e.target.value !== '' ? parseFloat(e.target.value) : null)} /></td>
                    <td className="font-mono">{v.avg != null ? v.avg.toFixed(2) : '--'}</td>
                    <td className="font-mono">{v.delta != null ? (v.delta >= 0 ? '+' : '') + v.delta.toFixed(2) : '--'}</td>
                    <td className={`font-mono ${v.cls}`}>{v.verdict}</td>
                    <td><button className="btn btn-sm btn-danger" style={{ padding: '3px 8px' }} onClick={() => removeInk(idx)}>×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Controls section */}
      {ctrls.length > 0 && (
        <div className="card">
          <div className="card-title">🔬 Contrôles atelier — {at ? at.name : ''}</div>

          {measureCtrls.length > 0 && (
            <div className="data-table-wrap" style={{ marginBottom: 14 }}>
              <table className="data-table">
                <thead>
                  <tr><th>Mesure</th><th>Cible</th><th>Tol.</th><th>Unité</th><th>M1</th><th>M2</th><th>M3</th><th>Moy.</th><th>Δ</th><th>Verdict</th></tr>
                </thead>
                <tbody>
                  {measureCtrls.map((ct) => {
                    const m = fd.measures[ct.id] || {};
                    const cust = fd.customTargets[ct.id] || {};
                    const ts = fd.productId ? getTechSheetForControl(fd.productId, at?.id || '', ct.id) : null;
                    const tgtVal = cust.target != null ? cust.target : (ts?.target != null ? ts.target : (ct.target != null ? ct.target : ''));
                    const tolVal = cust.tolerance != null ? cust.tolerance : (ts?.tolerance != null ? ts.tolerance : (ct.tolerance != null ? ct.tolerance : ''));
                    const v = getVerdict(ct.id);
                    return (
                      <tr key={ct.id} className={v.rowCls}>
                        <td>
                          <strong>{ct.name}</strong>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            Biblio: {ct.target != null ? ct.target : '-'} ± {ct.tolerance != null ? ct.tolerance : '-'} {ct.unit || ''}
                          </div>
                        </td>
                        <td><input className="form-control" style={{ width: 75, padding: 5, textAlign: 'center' }} type="number" step="0.01" value={tgtVal} onChange={(e) => updateCustomTarget(ct.id, 'target', e.target.value)} /></td>
                        <td><input className="form-control" style={{ width: 75, padding: 5, textAlign: 'center' }} type="number" step="0.01" value={tolVal} onChange={(e) => updateCustomTarget(ct.id, 'tolerance', e.target.value)} /></td>
                        <td className="font-mono" style={{ fontSize: 11 }}>{ct.unit || ''}</td>
                        <td><input className="form-control" style={{ width: 68, padding: 5, textAlign: 'center' }} type="number" step="0.01" value={m.m1 != null ? m.m1 : ''} onChange={(e) => updateMeasure(ct.id, 'm1', e.target.value)} /></td>
                        <td><input className="form-control" style={{ width: 68, padding: 5, textAlign: 'center' }} type="number" step="0.01" value={m.m2 != null ? m.m2 : ''} onChange={(e) => updateMeasure(ct.id, 'm2', e.target.value)} /></td>
                        <td><input className="form-control" style={{ width: 68, padding: 5, textAlign: 'center' }} type="number" step="0.01" value={m.m3 != null ? m.m3 : ''} onChange={(e) => updateMeasure(ct.id, 'm3', e.target.value)} /></td>
                        <td className="font-mono">{v.avg != null ? v.avg.toFixed(2) : '—'}</td>
                        <td className="font-mono">{v.delta != null ? (v.delta >= 0 ? '+' : '') + v.delta.toFixed(2) : '—'}</td>
                        <td className={`font-mono ${v.cls}`}>{v.verdict}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {checkCtrls.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
              {checkCtrls.map((ct) => (
                <div key={ct.id} style={{ padding: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13 }}>{ct.name}</span>
                  <select className="form-control" style={{ width: 140, padding: 5 }} value={fd.checks[ct.id] || ''} onChange={(e) => updateCheck(ct.id, e.target.value)}>
                    <option value="">--</option>
                    <option value="conforme">OK Conf.</option>
                    <option value="acceptable">Accept.</option>
                    <option value="non_conforme">NC</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={saveDraft}>💾 Brouillon</button>
        <button className="btn btn-primary" onClick={submitLot}>📤 Soumettre</button>
      </div>
    </div>
  );
}
