import React, { useState } from 'react';
import { BankingConnector } from '../../types/corban';
import { formatDateTimeBR } from '../../utils/formatters';
import { 
  Landmark, 
  ShieldCheck, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Settings2,
  RefreshCw
} from 'lucide-react';

interface ConnectorsViewProps {
  connectors: BankingConnector[];
  onUpdateConnector: (connectorId: string, environment: 'homologacao' | 'producao', status: string, notes?: string) => Promise<void>;
}

export const ConnectorsView: React.FC<ConnectorsViewProps> = ({
  connectors,
  onUpdateConnector
}) => {
  const [selectedConnector, setSelectedConnector] = useState<BankingConnector | null>(null);
  const [env, setEnv] = useState<'homologacao' | 'producao'>('homologacao');
  const [status, setStatus] = useState<string>('ativo');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOpenConfig = (conn: BankingConnector) => {
    setSelectedConnector(conn);
    setEnv(conn.environment);
    setStatus(conn.status);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnector) return;

    setIsUpdating(true);
    await onUpdateConnector(selectedConnector.id, env, status);
    setIsUpdating(false);
    setSelectedConnector(null);
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Diretriz de Transparência e Segurança em Integrações Bancárias:
          </p>
          <p className="leading-relaxed">
            A plataforma <strong>CORVEXA</strong> integra exclusivamente APIs oficiais e autorizadas pelas instituições financeiras e órgãos reguladores (Banrisul BPI, Dataprev, Serpro, Banco Central / Open Finance). Nenhuma aprovação de crédito fictícia é gerada. Cada conector declara explicitamente as funções suportadas e o status de homologação de credenciais.
          </p>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectors.map((conn) => {
          const isLive = conn.status === 'ativo';
          return (
            <div
              key={conn.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-mono font-bold text-xs">
                      {conn.bankCode.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {conn.bankName}
                      </h3>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {conn.partnerType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isLive
                        ? 'bg-emerald-100 text-emerald-800'
                        : conn.status === 'pendente_homologacao'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {conn.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  {conn.notes}
                </p>

                {/* Operations Tags */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                    Operações Suportadas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {conn.supportedOperations.map((op) => (
                      <span
                        key={op}
                        className="text-[11px] px-2 py-0.5 bg-slate-50 text-slate-700 rounded border border-slate-200"
                      >
                        {op}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Technical Meta */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Ambiente</span>
                    <span className="font-mono font-bold text-slate-800 capitalize">{conn.environment}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Autenticação</span>
                    <span className="truncate block font-medium text-slate-700">{conn.authType}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                <a
                  href={conn.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 font-medium transition-colors"
                >
                  <span>Docs Oficiais</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleOpenConfig(conn)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold transition-colors flex items-center gap-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Configurar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CONFIGURATION MODAL */}
      {selectedConnector && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Configurar Conector: {selectedConnector.bankName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ajuste de ambiente de execução e status do credenciamento
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ambiente de Operação</label>
                <select
                  value={env}
                  onChange={(e) => setEnv(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="homologacao">Homologação (Sandbox / Testes)</option>
                  <option value="producao">Produção (Live mTLS)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status da Conexão</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="ativo">Ativo</option>
                  <option value="pendente_homologacao">Pendente de Homologação</option>
                  <option value="em_manutencao">Em Manutenção</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 space-y-1">
                <span className="font-bold block">URL Base Oficial:</span>
                <code className="font-mono text-emerald-800 break-all">{selectedConnector.baseUrl}</code>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedConnector(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                >
                  {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
