import React, { useState } from 'react';
import { Commission } from '../../types/corban';
import { formatBRL, formatDateBR } from '../../utils/formatters';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter,
  Check,
  FileSpreadsheet
} from 'lucide-react';

interface CommissionsViewProps {
  commissions: Commission[];
  onUpdateCommissionStatus: (commissionId: string, status: string, receivedAmount?: number, notes?: string) => Promise<void>;
}

export const CommissionsView: React.FC<CommissionsViewProps> = ({
  commissions,
  onUpdateCommissionStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conciliateModalComm, setConciliateModalComm] = useState<Commission | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Totals
  const totalExpected = commissions
    .filter(c => ['prevista', 'confirmada_parceiro'].includes(c.status))
    .reduce((acc, c) => acc + c.grossCommissionExpected, 0);

  const totalReceived = commissions
    .filter(c => ['recebida', 'paga_operador'].includes(c.status))
    .reduce((acc, c) => acc + c.grossCommissionReceived, 0);

  const totalOperatorPending = commissions
    .filter(c => c.status === 'recebida' && c.operatorCommissionPaid === 0)
    .reduce((acc, c) => acc + c.operatorCommissionExpected, 0);

  const filteredCommissions = commissions.filter(c => {
    const matchesSearch = 
      c.proposalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.bankName.toLowerCase().includes(searchTerm) ||
      c.operatorName.toLowerCase().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenConciliation = (comm: Commission) => {
    setConciliateModalComm(comm);
    setReceivedAmount(comm.grossCommissionExpected.toString());
    setNotes('');
  };

  const handleConfirmConciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conciliateModalComm) return;

    setIsSubmitting(true);
    await onUpdateCommissionStatus(
      conciliateModalComm.id,
      'recebida',
      Number(receivedAmount) || conciliateModalComm.grossCommissionExpected,
      notes.trim() || 'Conciliação via extrato bancário confirmada'
    );
    setIsSubmitting(false);
    setConciliateModalComm(null);
  };

  const handlePayOperator = async (comm: Commission) => {
    await onUpdateCommissionStatus(comm.id, 'paga_operador', undefined, 'Repasse de comissão efetuado via folha/PIX');
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Comissões Previstas
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {formatBRL(totalExpected)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            Calculadas sobre produção digitada
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Comissões Recebidas no Mês
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2 tabular-nums">
            {formatBRL(totalReceived)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1">
            Efetivamente creditadas em conta
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Repasses a Operadores Pendentes
          </span>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-2 tabular-nums">
            {formatBRL(totalOperatorPending)}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1">
            Aguardando pagamento interno
          </span>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por proposta, cliente ou parceiro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Todos os Status</option>
              <option value="prevista">Prevista</option>
              <option value="confirmada_parceiro">Confirmada pelo Parceiro</option>
              <option value="recebida">Recebida na Conta</option>
              <option value="paga_operador">Paga ao Operador</option>
              <option value="estornada">Estornada</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            {filteredCommissions.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-4">Proposta</th>
                <th className="py-2.5 px-4">Cliente & Operador</th>
                <th className="py-2.5 px-4">Banco Parceiro</th>
                <th className="py-2.5 px-4 text-right">Produção Base</th>
                <th className="py-2.5 px-4 text-right">Comissão Loja</th>
                <th className="py-2.5 px-4 text-right">Repasse Operador</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhum registro de comissão encontrado.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {comm.proposalNumber}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">
                        Prev: {formatDateBR(comm.expectedPaymentDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{comm.customerName}</span>
                      <span className="text-[11px] text-slate-500">Op: {comm.operatorName}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {comm.bankName}
                      <span className="block text-[10px] text-slate-500">{comm.productName}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 tabular-nums">
                      {formatBRL(comm.baseProductionAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {comm.status === 'recebida' || comm.status === 'paga_operador' ? (
                        <span className="text-emerald-700">{formatBRL(comm.grossCommissionReceived)}</span>
                      ) : (
                        formatBRL(comm.grossCommissionExpected)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {formatBRL(comm.operatorCommissionExpected)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          comm.status === 'recebida'
                            ? 'bg-emerald-100 text-emerald-800'
                            : comm.status === 'paga_operador'
                            ? 'bg-blue-100 text-blue-800'
                            : comm.status === 'confirmada_parceiro'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {comm.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {comm.status === 'prevista' || comm.status === 'confirmada_parceiro' ? (
                        <button
                          onClick={() => handleOpenConciliation(comm)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors inline-flex items-center gap-1 shadow-xs"
                          title="Confirmar recebimento bancário"
                        >
                          <Check className="w-3 h-3" />
                          <span>Conciliar</span>
                        </button>
                      ) : comm.status === 'recebida' ? (
                        <button
                          onClick={() => handlePayOperator(comm)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors inline-flex items-center gap-1 shadow-xs"
                          title="Marcar repasse como pago ao operador"
                        >
                          <span>Pagar Operador</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Concluído</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CONCILIAÇÃO BANCÁRIA */}
      {conciliateModalComm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Conciliar Comissão: {conciliateModalComm.proposalNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Parceiro: {conciliateModalComm.bankName} · Cliente: {conciliateModalComm.customerName}
            </p>

            <form onSubmit={handleConfirmConciliation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Valor Efetivamente Creditado em Conta (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full px-3 py-2 font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas / Protocolo de Conciliação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Extrato de repasse Banrisul lote 28/10"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConciliateModalComm(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Gravando...' : 'Confirmar Recebimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
