import React from 'react';
import { Proposal, Commission, Customer } from '../../types/corban';
import { formatBRL, formatDateBR } from '../../utils/formatters';
import { 
  Users, 
  CheckCircle2, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

import { BRAND_CONFIG } from '../../constants/brand';

interface DashboardViewProps {
  customers: Customer[];
  proposals: Proposal[];
  commissions: Commission[];
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  proposals,
  commissions,
  onNavigateTab
}) => {
  // Real calculations
  const totalContractedVolume = proposals
    .filter(p => p.status === 'contratada')
    .reduce((acc, p) => acc + p.requestedAmount, 0);

  const pipelineVolume = proposals
    .filter(p => !['contratada', 'recusada', 'cancelada', 'perdida'].includes(p.status))
    .reduce((acc, p) => acc + p.requestedAmount, 0);

  const contractedCount = proposals.filter(p => p.status === 'contratada').length;
  const inAnalysisCount = proposals.filter(p => ['aguardando_analise', 'proposta_enviada', 'aguardando_documentacao'].includes(p.status)).length;
  const inFormalizationCount = proposals.filter(p => p.status === 'aguardando_formalizacao').length;

  const expectedCommissions = commissions
    .filter(c => ['prevista', 'confirmada_parceiro'].includes(c.status))
    .reduce((acc, c) => acc + c.grossCommissionExpected, 0);

  const receivedCommissions = commissions
    .filter(c => ['recebida', 'paga_operador'].includes(c.status))
    .reduce((acc, c) => acc + c.grossCommissionReceived, 0);

  // Group proposals by product
  const productDistribution = proposals.reduce((acc, p) => {
    acc[p.productName] = (acc[p.productName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Brand Identity Banner */}
      <div className="bg-gradient-to-r from-[#051026] via-[#0B1E3F] to-[#0A2E5C] text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-xl shadow-md shrink-0">
            <img
              src={BRAND_CONFIG.logo.url}
              alt={BRAND_CONFIG.logo.alt}
              className="h-12 sm:h-14 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-white">
                {BRAND_CONFIG.name}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded-full">
                Painel Geral
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 italic">
              "{BRAND_CONFIG.slogan}"
            </p>
            <p className="text-[11px] text-cyan-400/90 font-medium mt-0.5">
              {BRAND_CONFIG.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => onNavigateTab('simulator')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Nova Simulação</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('funnel')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg transition-all border border-white/15"
          >
            Ver Funil
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Volume Contratado</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatBRL(totalContractedVolume)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-emerald-600 tabular-nums">{contractedCount}</span>
              <span>contratos formalizados</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Volume em Esteira</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatBRL(pipelineVolume)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-blue-600 tabular-nums">{inAnalysisCount + inFormalizationCount}</span>
              <span>em análise / formalização</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Comissões Previstas</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatBRL(expectedCommissions)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Recebidas no mês:</span>
              <span className="font-semibold text-emerald-600 tabular-nums">{formatBRL(receivedCommissions)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Base de Clientes (CRM)</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {customers.length}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% com validação de CPF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline Summary & Product Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Proposals Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Operações Recentes na Esteira
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhamento em tempo real das propostas em andamento
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('funnel')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <span>Ver Funil Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Proposta</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">Banco</th>
                  <th className="py-2.5 px-3 text-right">Valor Líquido</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {proposals.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-900">
                      {prop.proposalNumber}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      <div>{prop.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{prop.customerCpf}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {prop.productName}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {prop.bankName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatBRL(prop.requestedAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {prop.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Product Distribution & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">
              Produção por Linha de Crédito
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Participação no total de contratos operados
            </p>

            <div className="space-y-3">
              {Object.entries(productDistribution).map(([name, count]) => {
                const pct = Math.round((count / proposals.length) * 100);
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700 truncate">{name}</span>
                      <span className="font-mono text-slate-500 tabular-nums">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Module Triggers */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Ações Rápidas do Operador
            </h3>
            <button
              onClick={() => onNavigateTab('simulator')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-xs font-semibold text-slate-800 transition-all text-left"
            >
              <span>Nova Simulação de Crédito</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </button>
            <button
              onClick={() => onNavigateTab('crm')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-xs font-semibold text-slate-800 transition-all text-left"
            >
              <span>Cadastrar Novo Cliente</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </button>
            <button
              onClick={() => onNavigateTab('connectors')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-xs font-semibold text-slate-800 transition-all text-left"
            >
              <span>Verificar Status Banrisul / APIs</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
