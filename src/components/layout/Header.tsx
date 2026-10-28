import React from 'react';
import { UserProfile, UserRole } from '../../types/corban';
import { 
  Search, 
  Bell, 
  Calendar, 
  RefreshCw, 
  User, 
  ShieldCheck, 
  Menu,
  CheckCircle2,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { BRAND_CONFIG } from '../../constants/brand';

interface HeaderProps {
  currentUser: UserProfile;
  organizationName: string;
  activeTab: string;
  allUsers: UserProfile[];
  onSwitchUser: (userId: string) => void;
  onRefreshData: () => void;
  isLoading: boolean;
  onToggleMobileMenu?: () => void;
  onGlobalSearch?: (query: string) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  organizationName,
  activeTab,
  allUsers,
  onSwitchUser,
  onRefreshData,
  isLoading,
  onToggleMobileMenu,
  onGlobalSearch,
  onLogout
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Executivo & Produção';
      case 'crm': return 'Clientes & Atendimento (CRM)';
      case 'simulator': return 'Simulador Financeiro (7 Linhas de Crédito)';
      case 'funnel': return 'Funil Comercial & Esteira de 17 Etapas';
      case 'documents': return 'Conferência Documental & Formalização';
      case 'commissions': return 'Comissões & Conciliação Bancária';
      case 'connectors': return 'Central de APIs & Parceiros Bancários';
      case 'audit': return 'Auditoria de Acessos & LGPD';
      case 'export_sql': return 'Esquema SQL & Migrações Supabase';
      default: return 'Visão Geral';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin_master': return 'Admin Master';
      case 'gerente': return 'Gerente Comercial';
      case 'operador': return 'Operador';
      case 'financeiro': return 'Financeiro';
      case 'auditor': return 'Auditor / Compliance';
    }
  };

  return (
    <header className="h-14 bg-gradient-to-r from-[#051026] via-[#081B3A] to-[#0A254E] text-white px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
      {/* Left: Mobile Toggle & Brand / Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden text-slate-300 hover:text-white p-1 rounded focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="bg-white rounded p-0.5 px-1.5 shadow-xs shrink-0 flex items-center justify-center">
            <img
              src={BRAND_CONFIG.logo.url}
              alt={BRAND_CONFIG.logo.alt}
              className="h-5 w-auto object-contain"
            />
          </div>
          <span className="text-xs font-bold text-white tracking-wider hidden sm:inline">
            {BRAND_CONFIG.name}
          </span>
          <span className="text-slate-500 hidden sm:inline">/</span>
          <span className="text-xs font-medium text-cyan-300 truncate max-w-[200px] sm:max-w-none">
            {getTabTitle(activeTab)}
          </span>
        </div>
      </div>

      {/* Center: Global CPF / Client Quick Search (Inspired by reference top bar) */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Buscar por CPF, Nome do Cliente ou Proposta..."
            onChange={(e) => onGlobalSearch && onGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-1.5 text-xs bg-slate-900/60 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:bg-slate-900 focus:border-cyan-400 transition-all font-mono"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onRefreshData}
          disabled={isLoading}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
          title="Sincronizar dados em tempo real"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* User Identity & Role Switcher */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
          <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
            {currentUser.fullName.charAt(0)}
          </div>
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[11px] font-bold text-white leading-tight">
              {currentUser.fullName}
            </span>
            <span className="text-[9px] text-cyan-300 font-medium">
              {getRoleLabel(currentUser.role)}
            </span>
          </div>

          <select
            value={currentUser.id}
            onChange={(e) => onSwitchUser(e.target.value)}
            className="text-[11px] bg-slate-900/80 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
            title="Alternar perfil para teste de permissões RBAC"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({getRoleLabel(u.role)})
              </option>
            ))}
          </select>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
              title="Encerrar sessão e sair do sistema"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
