export interface Role {
  id: string;
  name: string;
  level: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  roleId: string;
  poles: string[];
  ateliers: string[];
  active: boolean;
}

export interface Pole {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface Atelier {
  id: string;
  poleId: string;
  name: string;
  code: string;
  order: number;
}

export interface Machine {
  id: string;
  atelierId: string;
  name: string;
  active: boolean;
}

export interface Gamme {
  id: string;
  poleId: string;
  name: string;
  steps: string[];
}

export interface Transition {
  id: string;
  gammeId: string;
  poleId: string;
  fromAtelierId: string;
  toAtelierId: string;
  order: number;
  mandatory: boolean;
}

export interface Control {
  id: string;
  atelierId: string;
  name: string;
  category: string;
  type: 'measure' | 'check';
  target: number | null;
  tolerance: number | null;
  unit: string | null;
  instrument: string | null;
  frequency: string;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  code: string;
}

export interface Product {
  id: string;
  name: string;
  clientId: string;
  poleId: string;
}

export interface ProductTechSheet {
  id: string;
  productId: string;
  atelierId: string;
  controlId: string;
  target?: number | null;
  tolerance?: number | null;
  isCheck?: boolean;
  active?: boolean;
  description?: string;
}

export interface Ink {
  id: string;
  name: string;
  target: number | string | null;
  tolerance: number | null;
  unit: string;
  m1: number | null;
  m2: number | null;
  m3: number | null;
}

export interface Lot {
  id: string;
  numLot: string;
  of: string;
  clientId: string;
  productId: string;
  poleId: string;
  gammeId: string;
  quantity: number;
  currentAtelierId: string;
  currentStepIndex: number;
  status: LotStatus;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  machine: string;
  lotMatiere: string;
  bat: string;
  observations: string;
  customTargets?: Record<string, { target?: number; tolerance?: number }>;
  inks?: Ink[];
}

export type LotStatus = 'brouillon' | 'soumis' | 'valide_chef' | 'libere' | 'reserve' | 'bloque';

export interface LotStep {
  id: string;
  lotId: string;
  atelierId: string;
  stepIndex: number;
  status: 'in_progress' | 'completed';
  enteredAt: number;
  completedAt: number | null;
  operatorId: string | null;
  chefId: string | null;
  validatedAt: number | null;
}

export interface LotResult {
  id: string;
  lotId: string;
  atelierId: string;
  controlId: string;
  isInk?: boolean;
  inkName?: string | null;
  m1: number | null;
  m2: number | null;
  m3: number | null;
  avg: number | null;
  delta: number | null;
  verdict: 'OK' | 'WARN' | 'NOK';
  usedTarget?: number;
  usedTolerance?: number;
  timestamp: number;
  userId: string;
}

export interface QCResult {
  id: string;
  lotId: string;
  atelierId: string;
  controlId: string;
  m1: number | null;
  m2: number | null;
  m3: number | null;
  avg: number;
  delta: number;
  verdict: 'OK' | 'WARN' | 'NOK';
  timestamp: number;
  userId: string;
}

export interface QCDecision {
  id: string;
  lotId: string;
  poleId: string;
  atelierId: string;
  decision: string;
  observations: string;
  actionsRequises: string;
  qcUserId: string;
  timestamp: number;
}

export interface NonConformity {
  id: string;
  numero: string;
  poleId: string;
  gammeId: string;
  atelierId: string;
  lotId: string;
  of: string;
  type: string;
  gravite: string;
  causePresumee: string;
  description: string;
  actionsRequises: string;
  createdBy: string;
  createdAt: number;
  closedAt: number | null;
  status: 'ouverte' | 'en_cours' | 'cloturee';
}

export interface Draft {
  id: string;
  poleId: string;
  gammeId: string;
  atelierId: string;
  of: string;
  clientId: string;
  productId: string;
  quantity: number;
  machine: string;
  lotMatiere: string;
  bat: string;
  observations: string;
  measures: Record<string, { m1: number | null; m2: number | null; m3: number | null }>;
  checks: Record<string, string>;
  customTargets: Record<string, { target?: number; tolerance?: number }>;
  inks: Ink[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  role: string;
  action: string;
  entity: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: number;
  poleId: string;
  atelierId: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type PageId =
  | 'dashboard'
  | 'lots_entrants'
  | 'saisie_production'
  | 'validation_chef'
  | 'qc_gate'
  | 'non_conformites'
  | 'historique'
  | 'exports'
  | 'qc_pilot_ai'
  | 'config_controls'
  | 'config_techsheets'
  | 'config_clients'
  | 'config_gammes'
  | 'config_poles'
  | 'config_users'
  | 'audit_log'
  | 'dashboard_global';

export interface Database {
  version: number;
  users: User[];
  roles: Role[];
  permissions: string[];
  poles: Pole[];
  ateliers: Atelier[];
  machines: Machine[];
  gammes: Gamme[];
  transitions: Transition[];
  controlLibrary: Control[];
  lots: Lot[];
  lotSteps: LotStep[];
  lotResults: LotResult[];
  qcDecisions: QCDecision[];
  qcResults: QCResult[];
  nonConformities: NonConformity[];
  drafts: Draft[];
  auditLog: AuditLogEntry[];
  clients: Client[];
  products: Product[];
  productTechSheets: ProductTechSheet[];
  rolePermissions: Record<string, string[]>;
}
