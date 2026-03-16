import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Database, User, PageId, AIMessage, Pole, Atelier, Gamme, Control,
  Client, Product, Lot, LotResult, LotStep, NonConformity, ProductTechSheet, Machine, Role,
} from '@/types';
import { generateId } from '@/lib/helpers';

function emptyDB(): Database {
  return {
    version: 73, users: [], roles: [], permissions: [], poles: [], ateliers: [],
    machines: [], gammes: [], transitions: [], controlLibrary: [], lots: [],
    lotSteps: [], lotResults: [], qcDecisions: [], qcResults: [],
    nonConformities: [], drafts: [], auditLog: [], clients: [], products: [],
    productTechSheets: [], rolePermissions: {},
  };
}

interface AppState {
  db: Database;
  currentUser: User | null;
  currentPoleId: string | null;
  currentAtelierId: string | null;
  currentGammeId: string | null;
  currentPage: PageId;
  editingLotId: string | null;
  editingDraftId: string | null;
  qcExpandedLot: string | null;
  aiMessages: AIMessage[];
  theme: 'dark' | 'light';

  // Actions
  initDB: () => void;
  loadDataFromAPI: () => Promise<void>;
  syncToAPI: (table: string, action: string, data: any, id?: string) => Promise<any>;
  login: (user: User) => void;
  logout: () => void;
  setCurrentPage: (page: PageId) => void;
  setCurrentPoleId: (id: string) => void;
  setCurrentAtelierId: (id: string | null) => void;
  setCurrentGammeId: (id: string | null) => void;
  setEditingLotId: (id: string | null) => void;
  setEditingDraftId: (id: string | null) => void;
  setQcExpandedLot: (id: string | null) => void;
  setAiMessages: (msgs: AIMessage[]) => void;
  toggleTheme: () => void;
  saveDB: () => void;
  updateDB: (updater: (db: Database) => Database) => void;

  // Helpers
  getPole: (id: string) => Pole | undefined;
  getAtelier: (id: string) => Atelier | undefined;
  getGamme: (id: string) => Gamme | undefined;
  getClient: (id: string) => Client | undefined;
  getProduct: (id: string) => Product | undefined;
  getUser: (id: string) => User | undefined;
  getUserRole: (user: User) => Role | undefined;
  getUserPermissions: (user: User) => string[];
  hasPermission: (perm: string) => boolean;
  canAccessPole: (poleId: string) => boolean;
  getAteliersForPole: (poleId: string) => Atelier[];
  getGammesForPole: (poleId: string) => Gamme[];
  getMachinesForAtelier: (atelierId: string) => Machine[];
  getControlsForAtelier: (atelierId: string) => Control[];
  getLotsForPole: (poleId: string) => Lot[];
  getNCsForPole: (poleId: string) => NonConformity[];
  getLotResults: (lotId: string, atelierId?: string) => LotResult[];
  getLotSteps: (lotId: string) => LotStep[];
  getProductsForClient: (clientId: string, poleId: string) => Product[];
  getTechSheets: (productId: string, atelierId: string) => ProductTechSheet[];
  getTechSheetForControl: (productId: string, atelierId: string, controlId: string) => ProductTechSheet | null;
  getDraftsForUser: (userId: string, poleId: string) => Database['drafts'];
  getNextAtelierInGamme: (gammeId: string, atelierId: string) => string | null;
  isLastStepInGamme: (gammeId: string, atelierId: string) => boolean;
  addAuditLog: (action: string, entity: string | null, oldValue: string | null, newValue: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      db: emptyDB(),
      currentUser: null,
      currentPoleId: null,
      currentAtelierId: null,
      currentGammeId: null,
      currentPage: 'dashboard',
      editingLotId: null,
      editingDraftId: null,
      qcExpandedLot: null,
      aiMessages: [],
      theme: 'dark',

      initDB: () => {
        // DB is now loaded from PostgreSQL via loadDataFromAPI
      },

      loadDataFromAPI: async () => {
        try {
          const res = await fetch('/api/data');
          if (res.ok) {
            const data = await res.json();
            set({ db: data });
          }
        } catch (e) {
          console.error('Failed to load data from API:', e);
        }
      },

      syncToAPI: async (table: string, action: string, data: any, id?: string) => {
        try {
          const res = await fetch('/api/data/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table, action, data, id }),
          });
          return await res.json();
        } catch (e) {
          console.error('Sync error:', e);
          return null;
        }
      },

      login: (user: User) => {
        const db = get().db;
        const poleId = user.poles[0] || db.poles[0]?.id || null;
        const ateliers = db.ateliers.filter((a) => a.poleId === poleId).sort((a, b) => a.order - b.order);
        let atelierId: string | null = null;
        if (user.ateliers && user.ateliers.length > 0) {
          const found = user.ateliers.find((a) => ateliers.some((x) => x.id === a));
          atelierId = found || ateliers[0]?.id || null;
        } else {
          atelierId = ateliers[0]?.id || null;
        }
        const gammes = db.gammes.filter((g) => g.poleId === poleId);
        set({
          currentUser: user,
          currentPoleId: poleId,
          currentAtelierId: atelierId,
          currentGammeId: gammes[0]?.id || null,
          currentPage: 'dashboard',
        });
      },

      logout: () => {
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        set({
          currentUser: null,
          currentPage: 'dashboard',
          editingLotId: null,
          editingDraftId: null,
          db: emptyDB(),
        });
      },

      setCurrentPage: (page) => set({ currentPage: page, editingLotId: null, editingDraftId: null, qcExpandedLot: null }),
      setCurrentPoleId: (id) => {
        const db = get().db;
        const ats = db.ateliers.filter((a) => a.poleId === id).sort((a, b) => a.order - b.order);
        const gams = db.gammes.filter((g) => g.poleId === id);
        set({
          currentPoleId: id,
          currentAtelierId: ats[0]?.id || null,
          currentGammeId: gams[0]?.id || null,
        });
      },
      setCurrentAtelierId: (id) => set({ currentAtelierId: id }),
      setCurrentGammeId: (id) => {
        if (id) {
          const g = get().db.gammes.find((x) => x.id === id);
          if (g && g.steps.length > 0) {
            set({ currentGammeId: id, currentAtelierId: g.steps[0] });
            return;
          }
        }
        const db = get().db;
        const poleId = get().currentPoleId;
        const ats = db.ateliers.filter((a) => a.poleId === poleId).sort((a, b) => a.order - b.order);
        set({ currentGammeId: id, currentAtelierId: ats[0]?.id || null });
      },
      setEditingLotId: (id) => set({ editingLotId: id }),
      setEditingDraftId: (id) => set({ editingDraftId: id }),
      setQcExpandedLot: (id) => set({ qcExpandedLot: id }),
      setAiMessages: (msgs) => set({ aiMessages: msgs }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      saveDB: () => {
        // persist middleware handles this automatically
      },

      updateDB: (updater) => {
        set((s) => ({ db: updater(s.db) }));
      },

      // Helpers
      getPole: (id) => get().db.poles.find((x) => x.id === id),
      getAtelier: (id) => get().db.ateliers.find((x) => x.id === id),
      getGamme: (id) => get().db.gammes.find((x) => x.id === id),
      getClient: (id) => get().db.clients.find((x) => x.id === id),
      getProduct: (id) => get().db.products.find((x) => x.id === id),
      getUser: (id) => get().db.users.find((x) => x.id === id),
      getUserRole: (user) => get().db.roles.find((r) => r.id === user.roleId),
      getUserPermissions: (user) => get().db.rolePermissions[user.roleId] || [],
      hasPermission: (perm) => {
        const user = get().currentUser;
        if (!user) return false;
        const perms = get().db.rolePermissions[user.roleId] || [];
        return perms.includes(perm);
      },
      canAccessPole: (poleId) => {
        const user = get().currentUser;
        if (!user) return false;
        const perms = get().db.rolePermissions[user.roleId] || [];
        if (perms.includes('lot.view_global') || perms.includes('dashboard.view_global')) return true;
        return user.poles.includes(poleId);
      },
      getAteliersForPole: (poleId) => get().db.ateliers.filter((a) => a.poleId === poleId).sort((a, b) => a.order - b.order),
      getGammesForPole: (poleId) => get().db.gammes.filter((g) => g.poleId === poleId),
      getMachinesForAtelier: (atelierId) => get().db.machines.filter((m) => m.atelierId === atelierId && m.active),
      getControlsForAtelier: (atelierId) => get().db.controlLibrary.filter((c) => c.atelierId === atelierId && c.active),
      getLotsForPole: (poleId) => get().db.lots.filter((l) => l.poleId === poleId),
      getNCsForPole: (poleId) => get().db.nonConformities.filter((nc) => nc.poleId === poleId),
      getLotResults: (lotId, atelierId) => get().db.lotResults.filter((r) => r.lotId === lotId && (!atelierId || r.atelierId === atelierId)),
      getLotSteps: (lotId) => get().db.lotSteps.filter((s) => s.lotId === lotId).sort((a, b) => a.stepIndex - b.stepIndex),
      getProductsForClient: (clientId, poleId) => get().db.products.filter((p) => p.clientId === clientId && p.poleId === poleId),
      getTechSheets: (productId, atelierId) => get().db.productTechSheets.filter((ts) => ts.productId === productId && ts.atelierId === atelierId && !ts.isCheck),
      getTechSheetForControl: (productId, atelierId, controlId) => get().db.productTechSheets.find((ts) => ts.productId === productId && ts.atelierId === atelierId && ts.controlId === controlId && !ts.isCheck) || null,
      getDraftsForUser: (userId, poleId) => get().db.drafts.filter((d) => d.createdBy === userId && d.poleId === poleId),
      getNextAtelierInGamme: (gammeId, atelierId) => {
        const g = get().db.gammes.find((x) => x.id === gammeId);
        if (!g) return null;
        const i = g.steps.indexOf(atelierId);
        return (i === -1 || i >= g.steps.length - 1) ? null : g.steps[i + 1];
      },
      isLastStepInGamme: (gammeId, atelierId) => {
        const g = get().db.gammes.find((x) => x.id === gammeId);
        if (!g) return true;
        return g.steps.indexOf(atelierId) === g.steps.length - 1;
      },
      addAuditLog: (action, entity, oldValue, newValue) => {
        const s = get();
        const newLog = {
          id: generateId(),
          userId: s.currentUser?.id || null,
          role: s.currentUser ? (s.db.roles.find((r) => r.id === s.currentUser!.roleId)?.name || '') : '',
          action,
          entity,
          oldValue,
          newValue,
          timestamp: Date.now(),
          poleId: s.currentPoleId || '',
          atelierId: s.currentAtelierId || '',
        };
        set((state) => ({
          db: { ...state.db, auditLog: [...state.db.auditLog, newLog] },
        }));
      },
    }),
    {
      name: 'qcpilot_v7_nextjs',
      partialize: (state) => ({
        db: state.db,
        theme: state.theme,
      }),
    }
  )
);
