import React, { useState } from 'react';
import { Proposal, ProposalDocument } from '../../types/corban';
import { formatBRL, formatDateBR } from '../../utils/formatters';
import { 
  FileCheck2, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Upload, 
  Search,
  Eye,
  ShieldCheck
} from 'lucide-react';

import { BRAND_CONFIG } from '../../constants/brand';

interface DocumentsViewProps {
  proposals: Proposal[];
  selectedProposalId?: string | null;
  onUpdateDocumentStatus: (proposalId: string, docId: string, status: 'aprovado' | 'rejeitado', reason?: string) => Promise<void>;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  proposals,
  selectedProposalId,
  onUpdateDocumentStatus
}) => {
  const [activeProposalId, setActiveProposalId] = useState<string>(
    selectedProposalId || (proposals[0]?.id || '')
  );
  const [rejectionModalDoc, setRejectionModalDoc] = useState<ProposalDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const activeProposal = proposals.find(p => p.id === activeProposalId) || proposals[0];

  const handleApprove = async (docId: string) => {
    if (!activeProposal) return;
    setIsProcessing(true);
    await onUpdateDocumentStatus(activeProposal.id, docId, 'aprovado');
    setIsProcessing(false);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProposal || !rejectionModalDoc) return;
    setIsProcessing(true);
    await onUpdateDocumentStatus(
      activeProposal.id, 
      rejectionModalDoc.id, 
      'rejeitado', 
      rejectionReason.trim() || 'Documento ilegível ou fora do prazo de validade'
    );
    setIsProcessing(false);
    setRejectionModalDoc(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>Esteira de Conferência Documental & Formalização</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Checklist obrigatório de compliance e formalização digital antes do envio ao banco
          </p>
        </div>

        {/* Proposal Selector */}
        <div className="w-full sm:w-auto">
          <select
            value={activeProposalId}
            onChange={(e) => setActiveProposalId(e.target.value)}
            className="w-full sm:w-72 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500"
          >
            {proposals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.proposalNumber} — {p.customerName} ({p.bankName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeProposal && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Proposal Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Dossiê Formal da Operação</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{activeProposal.proposalNumber}</h3>
                <span className="text-xs text-emerald-700 font-semibold">{activeProposal.bankName} · {activeProposal.productName}</span>
              </div>
              <img
                src={BRAND_CONFIG.logo.url}
                alt={BRAND_CONFIG.logo.alt}
                className="h-8 w-auto object-contain shrink-0"
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Titular:</span>
                <span className="font-semibold text-slate-800">{activeProposal.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">CPF:</span>
                <span className="font-mono font-medium text-slate-800">{activeProposal.customerCpf}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Valor Solicitado:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">{formatBRL(activeProposal.requestedAmount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Condição:</span>
                <span className="font-mono font-medium text-slate-700 tabular-nums">{activeProposal.installmentsCount}x de {formatBRL(activeProposal.installmentValue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Status da Esteira:</span>
                <span className="font-semibold text-slate-800 capitalize">{activeProposal.status.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {/* Verification Status */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                <span>Conformidade Documental</span>
                <span className="font-mono text-emerald-700 tabular-nums">
                  {activeProposal.documents.filter(d => d.status === 'aprovado').length} de {activeProposal.documents.length} Aprovados
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all"
                  style={{
                    width: `${(activeProposal.documents.filter(d => d.status === 'aprovado').length / Math.max(1, activeProposal.documents.length)) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Documents Checklist & Actions (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Checklist de Documentos Obrigatórios do Convênio
            </h3>

            <div className="space-y-3">
              {activeProposal.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{doc.label}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        {doc.fileName ? (
                          <span className="font-mono text-slate-700 font-medium">{doc.fileName}</span>
                        ) : (
                          <span className="text-amber-700 font-medium">Aguardando upload pelo operador</span>
                        )}
                        {doc.verifiedAt && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Auditado em {formatDateBR(doc.verifiedAt)}</span>
                          </>
                        )}
                      </div>

                      {doc.rejectionReason && (
                        <div className="mt-1.5 text-[11px] text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                          Motivo da Reprovação: {doc.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Status & Validation Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                        doc.status === 'aprovado'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : doc.status === 'rejeitado'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {doc.status}
                    </span>

                    <button
                      onClick={() => handleApprove(doc.id)}
                      disabled={isProcessing || doc.status === 'aprovado'}
                      className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded transition-colors flex items-center gap-1"
                      title="Aprovar documento após conferência"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Aprovar</span>
                    </button>

                    <button
                      onClick={() => setRejectionModalDoc(doc)}
                      disabled={isProcessing}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded transition-colors flex items-center gap-1 border border-slate-200"
                      title="Rejeitar documento com apontamento de motivo"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reprovar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Reprovar Documento: {rejectionModalDoc.label}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Informe a justificativa formal para notificação ao operador
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo da Recusa *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Foto cortada nos cantos, comprovante de residência emitido há mais de 90 dias ou assinatura divergente do RG."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectionModalDoc(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg"
                >
                  {isProcessing ? 'Gravando...' : 'Confirmar Reprovação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
