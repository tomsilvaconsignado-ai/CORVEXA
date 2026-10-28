import React, { useState, useEffect } from 'react';
import { Customer, ProductCode, SimulationResult, PartnerCondition } from '../../types/corban';
import { PRODUCTS_CONFIG } from '../../constants/stages';
import { formatBRL, formatPercent } from '../../utils/formatters';
import { 
  Calculator, 
  ArrowRight, 
  CheckCircle2, 
  Landmark, 
  Percent, 
  ShieldCheck, 
  HelpCircle,
  FileCheck2
} from 'lucide-react';

interface SimulatorViewProps {
  customers: Customer[];
  selectedCustomerForSim?: Customer | null;
  onCreateProposalFromSim: (simData: {
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
  }) => Promise<void>;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  customers,
  selectedCustomerForSim,
  onCreateProposalFromSim
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    selectedCustomerForSim?.id || (customers[0]?.id || '')
  );
  const [productCode, setProductCode] = useState<ProductCode>('consignado_inss');
  const [requestedAmount, setRequestedAmount] = useState<number>(15000);
  const [installmentsCount, setInstallmentsCount] = useState<number>(84);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [selectedBank, setSelectedBank] = useState<PartnerCondition | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // Update selected customer if passed from parent
  useEffect(() => {
    if (selectedCustomerForSim) {
      setSelectedCustomerId(selectedCustomerForSim.id);
      if (selectedCustomerForSim.customerType === 'inss') setProductCode('consignado_inss');
      if (selectedCustomerForSim.customerType === 'servidor_publico') setProductCode('consignado_servidor');
      if (selectedCustomerForSim.customerType === 'clt') setProductCode('consignado_clt');
    }
  }, [selectedCustomerForSim]);

  // Run calculation
  const runCalculation = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/simulations/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCode,
          requestedAmount,
          installmentsCount
        })
      });

      if (res.ok) {
        const data: SimulationResult = await res.json();
        setSimulation(data);
        if (data.conditions && data.conditions.length > 0) {
          const rec = data.conditions.find(c => c.isRecommended) || data.conditions[0];
          setSelectedBank(rec);
        }
      }
    } catch {
      // fallback
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    runCalculation();
  }, [productCode, requestedAmount, installmentsCount]);

  const activeCustomer = customers.find(c => c.id === selectedCustomerId);
  const currentProduct = PRODUCTS_CONFIG.find(p => p.code === productCode);

  const handleConvertProposal = async () => {
    if (!activeCustomer || !simulation || !selectedBank) return;

    setIsSubmittingProposal(true);
    await onCreateProposalFromSim({
      customerId: activeCustomer.id,
      productCode,
      productName: simulation.productName,
      bankName: selectedBank.bankName,
      bankCode: selectedBank.bankCode,
      requestedAmount: simulation.requestedAmount,
      netAmount: simulation.netAmount,
      installmentValue: selectedBank.installmentValue,
      installmentsCount: simulation.installmentsCount,
      monthlyInterestRate: selectedBank.monthlyRate,
      cetAnnual: simulation.cetAnnual
    });
    setIsSubmittingProposal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Motor de Cálculo Financeiro Homologado:</strong> Simulação baseada na Tabela Price com alíquotas reais de IOF e Custo Efetivo Total (CET). As condições indicativas respeitam o teto regulado de juros de cada convênio e distinguem claramente propostas indicativas de aprovações formais de crédito.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Simulation Parameters (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Parâmetros da Operação</span>
          </h2>

          {/* Customer Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cliente do CRM
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-emerald-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.cpf})
                </option>
              ))}
            </select>
          </div>

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Linha de Crédito (7 Produtos)
            </label>
            <div className="space-y-1.5">
              {PRODUCTS_CONFIG.map((prod) => (
                <button
                  key={prod.code}
                  type="button"
                  onClick={() => {
                    setProductCode(prod.code as ProductCode);
                    if (prod.code === 'saque_fgts') setInstallmentsCount(5);
                    else if (prod.code === 'credito_pessoal') setInstallmentsCount(24);
                    else setInstallmentsCount(84);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                    productCode === prod.code
                      ? 'border-emerald-600 bg-emerald-50/50 font-bold text-emerald-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{prod.name}</span>
                    <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                      {formatPercent(prod.defaultRate)} a.m.
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Slider & Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Valor Solicitado (R$)</label>
              <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                {formatBRL(requestedAmount)}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={150000}
              step={500}
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>R$ 1.000</span>
              <span>R$ 50.000</span>
              <span>R$ 150.000</span>
            </div>
          </div>

          {/* Term / Installments */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Prazo em Parcelas</label>
              <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                {installmentsCount} parcelas
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[12, 24, 36, 48, 60, 72, 84, 96]
                .filter(term => term <= (currentProduct?.maxTerm || 96))
                .map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setInstallmentsCount(term)}
                    className={`py-1.5 text-xs font-mono rounded border transition-all ${
                      installmentsCount === term
                        ? 'border-emerald-600 bg-emerald-600 text-white font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {term}x
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column: Comparison & Results (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {simulation && (
            <>
              {/* Financial Metrics Strip */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Resultado para {activeCustomer?.fullName || 'Cliente'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {simulation.productName} · {simulation.installmentsCount}x de {formatBRL(selectedBank?.installmentValue || simulation.installmentValue)}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Custo Efetivo Total (CET)</span>
                    <span className="text-sm font-mono font-bold text-slate-800 tabular-nums">
                      {formatPercent(simulation.cetAnnual)} a.a.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Líquido a Liberar</span>
                    <span className="text-base font-bold font-mono text-emerald-700 tabular-nums">
                      {formatBRL(simulation.netAmount)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Financiado</span>
                    <span className="text-base font-bold font-mono text-slate-800 tabular-nums">
                      {formatBRL(simulation.totalRepayable)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Juros Acumulados</span>
                    <span className="text-base font-bold font-mono text-slate-800 tabular-nums">
                      {formatBRL(simulation.totalInterest)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">IOF Retido</span>
                    <span className="text-base font-bold font-mono text-slate-800 tabular-nums">
                      {formatBRL(simulation.iofAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Comparison Cards */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Comparativo de Ofertas por Instituição Financeira
                    </h3>
                    <p className="text-xs text-slate-500">
                      Selecione a melhor condição para enviar a proposta diretamente ao funil
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    Banrisul: Taxa Especial Habilitada
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {simulation.conditions.map((bank) => {
                    const isSelected = selectedBank?.bankCode === bank.bankCode;
                    return (
                      <div
                        key={bank.bankCode}
                        onClick={() => setSelectedBank(bank)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {bank.bankName}
                            </span>
                            {bank.isRecommended && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                                Mais Vantajoso
                              </span>
                            )}
                          </div>
                          <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                            {formatBRL(bank.installmentValue)}
                            <span className="text-[10px] font-normal text-slate-500"> /mês</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-1 tabular-nums">
                            Taxa: {formatPercent(bank.monthlyRate)} a.m.
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Total: {formatBRL(bank.totalAmount)}</span>
                          <span className={`font-semibold ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {isSelected ? '✓ Selecionado' : 'Selecionar'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Conversion Trigger */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-600">
                    Banco Selecionado: <strong>{selectedBank?.bankName || 'Banrisul'}</strong> · Parcela de <strong>{formatBRL(selectedBank?.installmentValue || 0)}</strong> em <strong>{installmentsCount}x</strong>
                  </div>
                  <button
                    onClick={handleConvertProposal}
                    disabled={isSubmittingProposal}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>{isSubmittingProposal ? 'Criando Proposta...' : 'Gerar Proposta no Funil Comercial'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
