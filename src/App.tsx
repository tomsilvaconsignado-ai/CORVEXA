import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  Customer, 
  Proposal, 
  Commission, 
  BankingConnector, 
  AuditLog,
  FunnelStage,
  UserRole
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
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import * as db from './services/db';
import { DbError } from './services/db';
import { BRAND_CONFIG } from './constants/brand';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [organizationName, setOrganizationName] = useState<string>(BRAND_CONFIG.legalName);

  // Sessão real (Supabase Auth). 'checking' enquanto a sessão salva é validada.
  const [authState, setAuthState] = useState<'checking' | 'signed_out' | 'pending_activation' | 'signed_in'>('checking');
  const [isRecoveryFlow, setIsRecoveryFlow] = useState<boolean>(false);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [connectors, setConnectors] = useState<BankingConnector[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [selectedCustomerForSim, setSelectedCustomerForSim] = useState<Customer | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const errorText = (err: unknown, fallback: string) =>
    err instanceof DbError ? err.message : fallback;

  const clearData = () => {
    setCustomers([]);
    setProposals([]);
    setCommissions([]);
    setConnectors([]);
    setAuditLogs([]);
  };

  // Carrega os dados permitidos ao perfil (o RLS do banco filtra o resto)
  const refreshData = async (role: UserRole | undefined = currentUser?.role) => {
    if (!role) return;
    setIsLoading(true);
    const canSeeAudit = role === 'admin_master' || role === 'auditor';
    try {
      const [cust, props, comms, conns, audit] = await Promise.all([
        db.listCustomers(),
        db.listProposals(),
        db.listCommissions(),
        db.listConnectors(),
        canSeeAudit ? db.listAuditLogs() : Promise.resolve([] as AuditLog[])
      ]);
      setCustomers(cust);
      setProposals(props);
      setCommissions(comms);
      setConnectors(conns);
      setAuditLogs(audit);
    } catch (err) {
      console.error('Failed to load data:', err);
      showToast(errorText(err, 'Erro ao sincronizar dados com o servidor'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async () => {
    try {
      const session = await db.getSessionProfile();
      if (!session) {
        setCurrentUser(null);
        clearData();
        setAuthState('signed_out');
        return;
      }
      setCurrentUser(session.user);
      if (!session.active) {
        clearData();
        setAuthState('pending_activation');
        return;
      }
      if (session.organizationName) setOrganizationName(session.organizationName);
      setAuthState('signed_in');
      await refreshData(session.user.role);
    } catch (err) {
      console.error('Session error:', err);
      setAuthState('signed_out');
      setLoginNotice(errorText(err, 'Não foi possível validar sua sessão. Entre novamente.'));
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState('signed_out');
      return;
    }
    loadSession();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryFlow(true);
        setAuthState('signed_out');
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        clearData();
        setAuthState('signed_out');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = async () => {
    setLoginNotice(null);
    await loadSession();
    const { data } = await supabase.auth.getUser();
    if (data.user) showToast('Autenticado com sucesso. Bem-vindo(a)!');
  };

  const handleLogout = async () => {
    await db.logAuthEvent('auth.logout');
    await supabase.auth.signOut();
    setCurrentUser(null);
    clearData();
    setAuthState('signed_out');
    setActiveTab('dashboard');
    showToast('Sessão encerrada com sucesso.');
  };

  // Handlers
  const handleAddCustomer = async (customerData: Partial<Customer>): Promise<boolean> => {
    try {
      const created = await db.createCustomer(customerData);
      showToast(`Cliente ${created.fullName} cadastrado com sucesso!`);
      await refreshData();
      return true;
    } catch (err) {
      showToast(errorText(err, 'Erro ao cadastrar cliente'), 'error');
      return false;
    }
  };

  const handleUpdateCustomer = async (id: string, customerData: Partial<Customer>): Promise<boolean> => {
    try {
      const updated = await db.updateCustomer(id, customerData);
      showToast(`Dados de ${updated.fullName} atualizados com sucesso!`);
      await refreshData();
      return true;
    } catch (err) {
      showToast(errorText(err, 'Erro ao atualizar dados do cliente'), 'error');
      return false;
    }
  };

  const handleAddInteraction = async (customerId: string, data: { channel: string; subject: string; description: string; result?: string }) => {
    try {
      await db.addInteraction(customerId, data);
      showToast('Atendimento registrado no histórico!');
      await refreshData();
    } catch (err) {
      showToast(errorText(err, 'Erro ao salvar atendimento'), 'error');
    }
  };

  const handleStartSimulationForCustomer = (customer: Customer) => {
    setSelectedCustomerForSim(customer);
    setActiveTab('simulator');
  };

  const handleCreateProposalFromSim = async (simData: db.NewProposalInput) => {
    try {
      const customer = customers.find(c => c.id === simData.customerId);
      const newProp = await db.createProposal(simData, customer?.customerType);
      showToast(`Proposta ${newProp.proposalNumber} criada com sucesso no funil!`);
      await refreshData();
      setActiveTab('funnel');
    } catch (err) {
      showToast(errorText(err, 'Erro ao gerar proposta'), 'error');
    }
  };

  const handleUpdateProposalStage = async (proposalId: string, newStage: FunnelStage, justification: string) => {
    try {
      await db.updateProposalStage(proposalId, newStage, justification);
      showToast(`Etapa da proposta alterada para [${newStage}]!`);
      await refreshData();
    } catch (err) {
      showToast(errorText(err, 'Erro ao atualizar etapa'), 'error');
    }
  };

  const handleUpdateDocumentStatus = async (proposalId: string, docId: string, status: 'aprovado' | 'rejeitado', reason?: string) => {
    try {
      await db.updateProposalDocument(proposalId, docId, status, reason);
      showToast(`Documento marcado como ${status}!`);
      await refreshData();
    } catch (err) {
      showToast(errorText(err, 'Erro ao atualizar documento'), 'error');
    }
  };

  const handleUpdateCommissionStatus = async (commissionId: string, status: string, receivedAmount?: number, notes?: string) => {
    try {
      await db.updateCommissionStatus(commissionId, status as Commission['status'], receivedAmount, notes);
      showToast(`Comissão atualizada para [${status}]!`);
      await refreshData();
    } catch (err) {
      showToast(errorText(err, 'Erro ao atualizar comissão'), 'error');
    }
  };

  const handleUpdateConnector = async (connectorId: string, environment: 'homologacao' | 'producao', status: string, notes?: string) => {
    try {
      await db.updateConnector(connectorId, environment, status as BankingConnector['status'], notes);
      showToast('Configuração do conector bancário salva!');
      await refreshData();
    } catch (err) {
      showToast(errorText(err, 'Erro ao atualizar conector'), 'error');
    }
  };

  const handleNavigateToDocuments = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setActiveTab('documents');
  };

  const toast = toastMessage && (
    <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[60] flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold text-white animate-fade-in bg-slate-900 border border-slate-800">
      {toastMessage.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
      )}
      <span>{toastMessage.text}</span>
      <button
        onClick={() => setToastMessage(null)}
        className="ml-auto sm:ml-2 text-slate-400 hover:text-white"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  if (authState === 'checking') {
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

  if (authState === 'pending_activation') {
    return (
      <div className="min-h-screen bg-[#051026] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-3">
          <img src={BRAND_CONFIG.logo.url} alt={BRAND_CONFIG.logo.alt} className="h-12 w-auto object-contain mx-auto" />
          <h1 className="text-sm font-bold text-slate-900">Acesso aguardando liberação</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sua conta ({currentUser?.email}) foi criada, mas ainda não foi ativada por um administrador da sua organização.
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
          >
            Sair
          </button>
        </div>
        {toast}
      </div>
    );
  }

  // Sem sessão: tela oficial de login do CORVEXA
  if (authState === 'signed_out' || !currentUser) {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          initialErrorMessage={
            !isSupabaseConfigured
              ? 'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja o README).'
              : loginNotice
          }
        />
        <ForgotPasswordModal
          isOpen={isRecoveryFlow}
          recoveryMode
          onClose={() => setIsRecoveryFlow(false)}
          onSuccessReset={(msg) => {
            setIsRecoveryFlow(false);
            showToast(msg);
          }}
        />
        {toast}
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
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentUser={currentUser}
          organizationName={organizationName}
          activeTab={activeTab}
          onRefreshData={() => refreshData()}
          isLoading={isLoading}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onGlobalSearch={(query) => {
            setGlobalSearchTerm(query);
            if (query.trim().length > 0 && activeTab !== 'crm') {
              setActiveTab('crm');
            }
          }}
        />

        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto min-w-0">
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
      {toast}
    </div>
  );
}
