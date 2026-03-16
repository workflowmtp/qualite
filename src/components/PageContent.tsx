'use client';

import { useStore } from '@/store';
import { PAGE_PERMISSION_MAP } from '@/lib/permissions';
import DashboardPage from '@/components/pages/DashboardPage';
import LotsEntrantsPage from '@/components/pages/LotsEntrantsPage';
import SaisieProductionPage from '@/components/pages/SaisieProductionPage';
import ValidationChefPage from '@/components/pages/ValidationChefPage';
import QCGatePage from '@/components/pages/QCGatePage';
import NonConformitesPage from '@/components/pages/NonConformitesPage';
import HistoriquePage from '@/components/pages/HistoriquePage';
import ExportsPage from '@/components/pages/ExportsPage';
import QCPilotAIPage from '@/components/pages/QCPilotAIPage';
import DashboardGlobalPage from '@/components/pages/DashboardGlobalPage';
import ConfigControlsPage from '@/components/pages/ConfigControlsPage';
import ConfigClientsPage from '@/components/pages/ConfigClientsPage';
import ConfigGammesPage from '@/components/pages/ConfigGammesPage';
import ConfigPolesPage from '@/components/pages/ConfigPolesPage';
import ConfigUsersPage from '@/components/pages/ConfigUsersPage';
import AuditLogPage from '@/components/pages/AuditLogPage';

function AccessDenied() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ fontSize: 64 }}>🔒</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Accès refusé</h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, textAlign: 'center' }}>
        Vous n&apos;avez pas la permission d&apos;accéder à cette page. Contactez votre administrateur pour obtenir les droits nécessaires.
      </p>
    </div>
  );
}

export default function PageContent() {
  const { currentPage, hasPermission } = useStore();

  const requiredPerm = PAGE_PERMISSION_MAP[currentPage];
  if (requiredPerm && !hasPermission(requiredPerm)) {
    return <AccessDenied />;
  }

  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage />;
    case 'lots_entrants':
      return <LotsEntrantsPage />;
    case 'saisie_production':
      return <SaisieProductionPage />;
    case 'validation_chef':
      return <ValidationChefPage />;
    case 'qc_gate':
      return <QCGatePage />;
    case 'non_conformites':
      return <NonConformitesPage />;
    case 'historique':
      return <HistoriquePage />;
    case 'exports':
      return <ExportsPage />;
    case 'qc_pilot_ai':
      return <QCPilotAIPage />;
    case 'config_controls':
    case 'config_techsheets':
      return <ConfigControlsPage />;
    case 'config_clients':
      return <ConfigClientsPage />;
    case 'config_gammes':
      return <ConfigGammesPage />;
    case 'config_poles':
      return <ConfigPolesPage />;
    case 'config_users':
      return <ConfigUsersPage />;
    case 'audit_log':
      return <AuditLogPage />;
    case 'dashboard_global':
      return <DashboardGlobalPage />;
    default:
      return <DashboardPage />;
  }
}
