import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  Customer, 
  Proposal, 
  Commission, 
  BankingConnector, 
  AuditLog,
  FunnelStage,
  ProductCode
} from './types/corban';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { CrmView } from './components/crm/CrmView';
import { SimulatorView } from './components/simulator/SimulatorView';
import { FunnelView } from './components/funnel/FunnelView';
import { DocumentsView } from './components/documents/DocumentsView';
import { CommissionsView } from './components/commissions/CommissionsView';
import { ConnectorsView } from './components/connectors/ConnectorsView';
import { AuditView } from './components/audit/AuditView';
import { SqlExportView } from './components/export/SqlExportView';
import { LoginPage } from './components/auth/LoginPage';
import { BRAND_CONFIG } from './constants/brand';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [organizationName, setOrganizationName] = useState<string>(BRAND_CONFIG.legalName);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  
  // Real authentication session state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(
      localStorage.getItem('corvexa_session_token') || 
      sessionStorage.getItem('corvexa_session_token')
    );
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [connectors, setConnectors] = useState<BankingConnector[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [selectedCustomerForSim, setSelectedCustomerForSim] = useState<Customer | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load all initial data from full-stack backend
  const refreshData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('corvexa_session_token') || sessionStorage.getItem('corvexa_session_token');
    const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [sessionRes, custRes, propRes, commRes, connRes, auditRes] = await Promise.all([
        fetch('/api/auth/me', { headers: authHeaders }),
        fetch('/api/customers'),
        fetch('/api/proposals'),
        fetch('/api/commissions'),
        fetch('/api/connectors'),
        fetch('/api/audit-logs')
      ]);

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated && sessionData.user) {
          setCurrentUser(sessionData.user);
          setIsAuthenticated(true);
          if (sessionData.organization?.name) {
            setOrganizationName(sessionData.organization.name);
          }
        } else if (!token) {
          // If no token stored and auth/me didn't validate, prompt login
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else if (sessionRes.status === 401) {
        localStorage.removeItem('corvexa_session_token');
        sessionStorage.removeItem('corvexa_session_token');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }

      // Also get allUsers for the RBAC profile switcher
      try {
        const allUsersRes = await fetch('/api/session');
        if (allUsersRes.ok) {
          const allData = await allUsersRes.json();
          setAllUsers(allData.allUsers || []);
        }
      } catch {
        // non-blocking
      }

      if (custRes.ok) setCustomers(await custRes.json());
      if (propRes.ok) setProposals(await propRes.json());
      if (commRes.ok) setCommissions(await commRes.json());
      if (connRes.ok) setConnectors(await connRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (err) {
      console.error('Failed to load data:', err);
      showToast('Erro ao sincronizar dados com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLoginSuccess = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    showToast(`Autenticado com sucesso. Bem-vindo(a), ${user.fullName}!`);
    refreshData();
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('corvexa_session_token') || sessionStorage.getItem('corvexa_session_token');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ token })
      });
    } catch {
      // offline logout fallback
    }
    localStorage.removeItem('corvexa_session_token');
    sessionStorage.removeItem('corvexa_session_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast('Sessão encerrada com sucesso.');
  };

  // Handlers
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/session/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        showToast(`Perfil alternado para ${data.user.fullName} (${data.user.role})`);
        refreshData();
      }
    } catch {
      showToast('Erro ao alternar perfil', 'error');
    }
  };

  const handleAddCustomer = async (customerData: Partial<Customer>): Promise<boolean> => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao cadastrar cliente', 'error');
        return false;
      }
      showToast(`Cliente ${data.fullName} cadastrado com sucesso!`);
      await refreshData();
      return true;
    } catch {
      showToast('Erro de comunicação com o servidor', 'error');
      return false;
    }
  };

  const handleUpdateCustomer = async (id: string, customerData: Partial<Customer>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao atualizar dados do cliente', 'error');
        return false;
      }
      showToast(`Dados de ${data.fullName} atualizados com sucesso!`);
      await refreshData();
      return true;
    } catch {
      showToast('Erro de comunicação com o servidor', 'error');
      return false;
    }
  };

  const handleAddInteraction = async (customerId: string, data: { channel: string; subject: string; description: string; result?: string }) => {
    try {
      const res = await fetch(`/api/customers/${customerId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showToast('Atendimento registrado no histórico!');
        await refreshData();
      }
    } catch {
      showToast('Erro ao salvar atendimento', 'error');
    }
  };

  const handleStartSimulationForCustomer = (customer: Customer) => {
    setSelectedCustomerForSim(customer);
    setActiveTab('simulator');
  };

  const handleCreateProposalFromSim = async (simData: {
    customerId: string;
    productCode: ProductCode;
    productName: string;
    bankName: string;
    bankCode: string;
    requestedAmount: number;
    netAmount: number;
    installmentValue: number;
    installmentsCount: number;
    monthlyInterestRate: number;
    cetAnnual: number;
  }) => {
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simData)
      });
      if (res.ok) {
        const newProp = await res.json();
        showToast(`Proposta ${newProp.proposalNumber} criada com sucesso no funil!`);
        await refreshData();
        setActiveTab('funnel');
      } else {
        const err = await res.json();
        showToast(err.error || 'Erro ao gerar proposta', 'error');
      }
    } catch {
      showToast('Erro de comunicação ao criar proposta', 'error');
    }
  };

  const handleUpdateProposalStage = async (proposalId: string, newStage: FunnelStage, justification: string) => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStage, justification })
      });
      if (res.ok) {
        showToast(`Etapa da proposta alterada para [${newStage}]!`);
        await refreshData();
      }
    } catch {
      showToast('Erro ao atualizar etapa', 'error');
    }
  };

  const handleUpdateDocumentStatus = async (proposalId: string, docId: string, status: 'aprovado' | 'rejeitado', reason?: string) => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      if (res.ok) {
        showToast(`Documento marcado como ${status}!`);
        await refreshData();
      }
    } catch {
      showToast('Erro ao atualizar documento', 'error');
    }
  };

  const handleUpdateCommissionStatus = async (commissionId: string, status: string, receivedAmount?: number, notes?: string) => {
    try {
      const res = await fetch(`/api/commissions/${commissionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, receivedAmount, notes })
      });
      if (res.ok) {
        showToast(`Comissão atualizada para [${status}]!`);
        await refreshData();
      }
    } catch {
      showToast('Erro ao atualizar comissão', 'error');
    }
  };

  const handleUpdateConnector = async (connectorId: string, environment: 'homologacao' | 'producao', status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/connectors/${connectorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment, status, notes })
      });
      if (res.ok) {
        showToast('Configuração do conector bancário salva!');
        await refreshData();
      }
    } catch {
      showToast('Erro ao atualizar conector', 'error');
    }
  };

  const handleNavigateToDocuments = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setActiveTab('documents');
  };

  if (isLoading && isAuthenticated && !currentUser) {
    return (
      <div className="min-h-screen bg-[#051026] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-xs w-full">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center justify-center space-y-3">
            <img
              src={BRAND_CONFIG.logo.url}
              alt={BRAND_CONFIG.logo.alt}
              className="h-14 w-auto object-contain"
            />
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mt-2" />
            <p className="text-xs font-semibold text-slate-700">Verificando credenciais...</p>
          </div>
          <p className="text-xs text-slate-400 italic">
            "{BRAND_CONFIG.slogan}"
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated: Render official CORVEXA LoginPage
  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold text-white animate-fade-in bg-slate-900 border border-slate-800">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setSelectedCustomerForSim(null);
          setActiveTab(tab);
        }}
        userRole={currentUser.role}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentUser={currentUser}
          organizationName={organizationName}
          activeTab={activeTab}
          allUsers={allUsers}
          onSwitchUser={handleSwitchUser}
          onRefreshData={refreshData}
          isLoading={isLoading}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsCollapsed(!isCollapsed)}
          onGlobalSearch={(query) => {
            setGlobalSearchTerm(query);
            if (query.trim().length > 0 && activeTab !== 'crm') {
              setActiveTab('crm');
            }
          }}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              customers={customers}
              proposals={proposals}
              commissions={commissions}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'crm' && (
            <CrmView
              customers={customers}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onCreateProposal={handleCreateProposalFromSim}
              onAddInteraction={handleAddInteraction}
              onStartSimulationForCustomer={handleStartSimulationForCustomer}
              initialSearchTerm={globalSearchTerm}
            />
          )}

          {activeTab === 'simulator' && (
            <SimulatorView
              customers={customers}
              selectedCustomerForSim={selectedCustomerForSim}
              onCreateProposalFromSim={handleCreateProposalFromSim}
            />
          )}

          {activeTab === 'funnel' && (
            <FunnelView
              proposals={proposals}
              onUpdateProposalStage={handleUpdateProposalStage}
              onNavigateToDocuments={handleNavigateToDocuments}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              proposals={proposals}
              selectedProposalId={selectedProposalId}
              onUpdateDocumentStatus={handleUpdateDocumentStatus}
            />
          )}

          {activeTab === 'commissions' && (
            <CommissionsView
              commissions={commissions}
              onUpdateCommissionStatus={handleUpdateCommissionStatus}
            />
          )}

          {activeTab === 'connectors' && (
            <ConnectorsView
              connectors={connectors}
              onUpdateConnector={handleUpdateConnector}
            />
          )}

          {activeTab === 'audit' && (
            <AuditView logs={auditLogs} />
          )}

          {activeTab === 'export_sql' && (
            <SqlExportView />
          )}
        </main>
      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold text-white animate-fade-in bg-slate-900 border border-slate-800">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
