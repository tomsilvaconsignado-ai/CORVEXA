import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calculator, 
  GitPullRequest, 
  FileCheck, 
  DollarSign, 
  Landmark, 
  ShieldCheck, 
  Database,
  Building,
  ChevronDown,
  ChevronRight,
  Headphones,
  Briefcase,
  FileSpreadsheet,
  Layers,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import { UserRole } from '../../types/corban';
import { BRAND_CONFIG } from '../../constants/brand';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout?: () => void;
  /** Gaveta aberta no celular (< md) */
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavCategory {
  title: string;
  icon: React.ElementType;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    roles: UserRole[];
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onSelectTab, 
  userRole,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  isMobileOpen = false,
  onCloseMobile
}) => {
  // No celular a gaveta sempre abre expandida
  const collapsed = isCollapsed && !isMobileOpen;
  const selectTab = (tab: string) => {
    onSelectTab(tab);
    onCloseMobile?.();
  };
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'operacional': true,
    'produtos': true,
    'esteira': true,
    'financeiro': true,
    'conexoes': false,
    'governanca': false,
  });

  const toggleCategory = (catKey: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [catKey]: !prev[catKey]
    }));
  };

  const categories: { key: string; label: string; icon: React.ElementType; items: { id: string; label: string; icon: React.ElementType; roles: UserRole[]; badge?: string }[] }[] = [
    {
      key: 'operacional',
      label: 'Operacional',
      icon: Briefcase,
      items: [
        { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard, roles: ['admin_master', 'gerente', 'operador', 'financeiro', 'auditor'] },
        { id: 'crm', label: 'Clientes (CRM)', icon: Users, roles: ['admin_master', 'gerente', 'operador', 'auditor'] },
      ]
    },
    {
      key: 'produtos',
      label: 'Produtos de Crédito',
      icon: Calculator,
      items: [
        { id: 'simulator', label: 'Simulador (7 Linhas)', icon: Calculator, roles: ['admin_master', 'gerente', 'operador'], badge: '7 Produtos' },
      ]
    },
    {
      key: 'esteira',
      label: 'Esteira & Formalização',
      icon: Layers,
      items: [
        { id: 'funnel', label: 'Funil Comercial', icon: GitPullRequest, roles: ['admin_master', 'gerente', 'operador', 'auditor'], badge: '17 Etapas' },
        { id: 'documents', label: 'Esteira Documental', icon: FileCheck, roles: ['admin_master', 'gerente', 'operador', 'auditor'] },
      ]
    },
    {
      key: 'financeiro',
      label: 'Financeiro & Comissões',
      icon: DollarSign,
      items: [
        { id: 'commissions', label: 'Comissões & Conciliação', icon: DollarSign, roles: ['admin_master', 'financeiro', 'gerente'] },
      ]
    },
    {
      key: 'conexoes',
      label: 'Integrações & Bancos',
      icon: Landmark,
      items: [
        { id: 'connectors', label: 'Conectores Bancários', icon: Landmark, roles: ['admin_master', 'gerente', 'auditor'], badge: 'APIs' },
      ]
    },
    {
      key: 'governanca',
      label: 'Governança & Supabase',
      icon: ShieldCheck,
      items: [
        { id: 'audit', label: 'Auditoria & LGPD', icon: ShieldCheck, roles: ['admin_master', 'auditor'] },
        { id: 'export_sql', label: 'Esquema SQL Supabase', icon: Database, roles: ['admin_master', 'gerente', 'operador', 'financeiro', 'auditor'] },
      ]
    }
  ];

  return (
    <>
    {/* Fundo escurecido da gaveta no celular */}
    {isMobileOpen && (
      <div
        className="fixed inset-0 z-40 bg-slate-950/60 md:hidden"
        onClick={onCloseMobile}
        aria-hidden="true"
      />
    )}
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto transform ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } md:static md:z-auto md:translate-x-0 md:overflow-visible ${
        collapsed ? 'md:w-16' : 'md:w-64'
      } bg-[#051026] text-slate-300 flex flex-col shrink-0 min-h-screen select-none border-r border-slate-800 transition-all duration-200`}
    >
      {/* Top Brand Box with Official Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-[#030917]">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-white rounded-lg p-1 px-1.5 shadow-sm shrink-0 flex items-center justify-center">
              <img
                src={BRAND_CONFIG.logo.url}
                alt={BRAND_CONFIG.logo.alt}
                className="h-7 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold text-white tracking-wider leading-none">
                {BRAND_CONFIG.name}
              </span>
              <span className="text-[10px] text-cyan-400 font-medium tracking-tight truncate mt-1">
                {BRAND_CONFIG.tagline}
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto bg-white rounded-lg p-1 shadow-sm">
            <img
              src={BRAND_CONFIG.logo.url}
              alt={BRAND_CONFIG.logo.alt}
              className="h-6 w-auto object-contain"
            />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors hidden md:block"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Promotora Card (Inspired by the Reference screenshot) */}
      {!collapsed && (
        <div className="p-3 bg-gradient-to-r from-slate-900 to-[#0A1A36] border-b border-slate-800/60 m-3 rounded-xl border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-cyan-400 shrink-0 border border-white/10">
            <Building className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-cyan-300 block">
              Correspondente Homologado
            </span>
            <div className="text-xs font-bold text-white truncate">
              {BRAND_CONFIG.defaultBranch}
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              CNPJ: 34.567.890/0001-23
            </span>
          </div>
        </div>
      )}

      {/* Accordion Categorized Navigation */}
      <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
        {categories.map((cat) => {
          const isOpen = openCategories[cat.key] ?? true;
          const CatIcon = cat.icon;

          return (
            <div key={cat.key} className="mb-1">
              {!collapsed ? (
                <>
                  <button
                    onClick={() => toggleCategory(cat.key)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CatIcon className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{cat.label}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="space-y-0.5 mt-0.5 pl-1">
                      {cat.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = activeTab === item.id;
                        const isAllowed = item.roles.includes(userRole);

                        return (
                          <button
                            key={item.id}
                            onClick={() => selectTab(item.id)}
                            disabled={!isAllowed}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-xs'
                                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                            } ${!isAllowed ? 'opacity-35 cursor-not-allowed' : ''}`}
                            title={!isAllowed ? `Acesso restrito ao perfil (${userRole})` : item.label}
                          >
                            <ItemIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;
                    const isAllowed = item.roles.includes(userRole);

                    return (
                      <button
                        key={item.id}
                        onClick={() => selectTab(item.id)}
                        disabled={!isAllowed}
                        className={`w-full flex justify-center p-2 rounded-lg text-xs transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        } ${!isAllowed ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title={item.label}
                      >
                        <ItemIcon className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Support / Help Action & Logout */}
      {!collapsed ? (
        <div className="p-3 border-t border-slate-800/80 bg-[#030917] space-y-2">
          <a
            href="https://wa.me/5551987654321?text=Suporte%20CORVEXA"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all text-center"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Falar com o Suporte</span>
          </a>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-900 text-slate-400 hover:text-red-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Encerrar Sessão</span>
            </button>
          )}

          <p className="text-[10px] text-center text-slate-500 font-mono">
            {BRAND_CONFIG.name} v{BRAND_CONFIG.version}
          </p>
        </div>
      ) : (
        <div className="p-2 border-t border-slate-800 text-center space-y-2">
          <Headphones className="w-4 h-4 text-orange-400 mx-auto" />
          {onLogout && (
            <button
              onClick={onLogout}
              title="Encerrar Sessão"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded mx-auto block cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </aside>
    </>
  );
};
