import React, { useState } from 'react';
import { Proposal, FunnelStage } from '../../types/corban';
import { FUNNEL_STAGES } from '../../constants/stages';
import { formatBRL, formatDateBR } from '../../utils/formatters';
import { 
  GitPullRequest, 
  Search, 
  Filter, 
  ArrowRight, 
  FileCheck, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  LayoutGrid,
  List
} from 'lucide-react';

interface FunnelViewProps {
  proposals: Proposal[];
  onUpdateProposalStage: (proposalId: string, newStage: FunnelStage, justification: string) => Promise<void>;
  onNavigateToDocuments: (proposalId: string) => void;
}

export const FunnelView: React.FC<FunnelViewProps> = ({
  proposals,
  onUpdateProposalStage,
  onNavigateToDocuments
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [transitionModalProposal, setTransitionModalProposal] = useState<Proposal | null>(null);
  const [targetStage, setTargetStage] = useState<FunnelStage>('aprovada');
  const [justification, setJustification] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = 
      p.proposalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerCpf.includes(searchTerm) ||
      p.bankName.toLowerCase().includes(searchTerm);

    const matchesStage = selectedStageFilter === 'all' || p.status === selectedStageFilter;
    return matchesSearch && matchesStage;
  });

  const handleOpenTransition = (prop: Proposal) => {
    setTransitionModalProposal(prop);
    setTargetStage(prop.status);
    setJustification('');
  };

  const handleConfirmTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitionModalProposal) return;

    setIsUpdating(true);
    await onUpdateProposalStage(
      transitionModalProposal.id,
      targetStage,
      justification.trim() || 'Avanço de esteira padrão'
    );
    setIsUpdating(false);
    setTransitionModalProposal(null);
  };

  const getStageMeta = (stageId: FunnelStage) => {
    return FUNNEL_STAGES.find(s => s.id === stageId) || FUNNEL_STAGES[0];
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and View Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por número, cliente, CPF ou banco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todas as 17 Etapas</option>
            {FUNNEL_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista Detalhada</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Esteira Kanban</span>
          </button>
        </div>
      </div>

      {/* VIEW: DETAILED LIST */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Propostas no Funil ({filteredProposals.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Clique em "Alterar Etapa" para avançar ou justificar recusas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-4">Nº Proposta</th>
                  <th className="py-2.5 px-4">Cliente / CPF</th>
                  <th className="py-2.5 px-4">Produto & Banco</th>
                  <th className="py-2.5 px-4 text-right">Líquido</th>
                  <th className="py-2.5 px-4 text-right">Parcela</th>
                  <th className="py-2.5 px-4">Status da Etapa</th>
                  <th className="py-2.5 px-4 text-center">Docs</th>
                  <th className="py-2.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProposals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Nenhuma proposta encontrada com os critérios informados.
                    </td>
                  </tr>
                ) : (
                  filteredProposals.map((prop) => {
                    const stageMeta = getStageMeta(prop.status);
                    const docsApproved = prop.documents.filter(d => d.status === 'aprovado').length;
                    const docsTotal = prop.documents.length;

                    return (
                      <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {prop.proposalNumber}
                          <span className="block text-[10px] text-slate-400 font-sans font-normal">
                            {formatDateBR(prop.createdAt)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{prop.customerName}</span>
                          <span className="font-mono text-slate-500 text-[10px]">{prop.customerCpf}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-800 font-medium block">{prop.productName}</span>
                          <span className="text-emerald-700 text-[11px] font-semibold">{prop.bankName}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatBRL(prop.requestedAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                          {prop.installmentsCount}x {formatBRL(prop.installmentValue)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${stageMeta.color}`}>
                            {stageMeta.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onNavigateToDocuments(prop.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                              docsApproved === docsTotal && docsTotal > 0
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                            title="Conferir checklist documental desta proposta"
                          >
                            {docsApproved}/{docsTotal} Docs
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenTransition(prop)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded transition-colors inline-flex items-center gap-1"
                          >
                            <span>Mudar Etapa</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW: KANBAN GROUPED IN 5 MAIN STAGE CLUSTERS */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {[
            { key: 'captacao', title: '1. Captação & Contato', stages: ['lead_recebido', 'aguardando_primeiro_contato'] },
            { key: 'atendimento', title: '2. Em Atendimento & Simulação', stages: ['em_atendimento', 'qualificacao', 'simulacao_solicitada', 'simulacao_realizada', 'proposta_em_elaboracao'] },
            { key: 'analise', title: '3. Análise no Banco', stages: ['proposta_enviada', 'aguardando_analise', 'aguardando_documentacao'] },
            { key: 'formalizacao', title: '4. Formalização & CCB', stages: ['aprovada', 'aguardando_formalizacao'] },
            { key: 'conclusao', title: '5. Contratada / Pós-Venda', stages: ['contratada', 'pos_venda'] }
          ].map((cluster) => {
            const clusterProposals = proposals.filter(p => cluster.stages.includes(p.status));
            return (
              <div key={cluster.key} className="bg-slate-100/70 rounded-xl p-3 border border-slate-200 flex flex-col min-h-[450px]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800">{cluster.title}</h4>
                  <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                    {clusterProposals.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {clusterProposals.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-center text-slate-400 text-[11px]">
                      Nenhuma proposta
                    </div>
                  ) : (
                    clusterProposals.map((prop) => (
                      <div
                        key={prop.id}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-emerald-500 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-slate-900">{prop.proposalNumber}</span>
                          <span className="font-semibold text-emerald-700">{prop.bankName}</span>
                        </div>
                        <div className="font-bold text-xs text-slate-800 truncate">
                          {prop.customerName}
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="font-mono font-bold text-slate-900 tabular-nums">{formatBRL(prop.requestedAmount)}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{prop.installmentsCount}x</span>
                        </div>
                        <button
                          onClick={() => handleOpenTransition(prop)}
                          className="w-full mt-1 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors text-center"
                        >
                          Avançar Etapa
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: TRANSIÇÃO DE ETAPA COM AUDITORIA */}
      {transitionModalProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Transição de Etapa: {transitionModalProposal.proposalNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Cliente: {transitionModalProposal.customerName}
                </p>
              </div>
              <button onClick={() => setTransitionModalProposal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmTransition} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Etapa Atual</span>
                <span className="font-bold text-slate-800">
                  {getStageMeta(transitionModalProposal.status).label}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nova Etapa no Funil Comercial *
                </label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as FunnelStage)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500"
                >
                  {FUNNEL_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Justificativa / Observação para Auditoria *
                </label>
                <textarea
                  required
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Ex: Parecer de crédito aprovado pelo Banrisul com sucesso. Enviado link de biometria facial para o cliente."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransitionModalProposal(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {isUpdating ? 'Registrando...' : 'Confirmar Mudança'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
