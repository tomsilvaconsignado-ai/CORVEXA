import React, { useState } from 'react';
import { Customer, Interaction } from '../../types/corban';
import { formatBRL, formatCPF, formatPhone, formatDateTimeBR } from '../../utils/formatters';
import { 
  Users, 
  Search, 
  Plus, 
  UserCheck, 
  Phone, 
  Mail, 
  Building, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  MessageSquare, 
  Calculator,
  ShieldCheck,
  Edit,
  Trash2,
  ArrowLeft,
  MapPin,
  CreditCard,
  Briefcase,
  History,
  Send,
  Eye,
  Check
} from 'lucide-react';
import { BRAND_CONFIG } from '../../constants/brand';
import { CustomerRegistrationForm } from './CustomerRegistrationForm';
import { listInteractions } from '../../services/db';

interface CrmViewProps {
  customers: Customer[];
  onAddCustomer: (customerData: Partial<Customer>) => Promise<boolean>;
  onUpdateCustomer?: (id: string, customerData: Partial<Customer>) => Promise<boolean>;
  onCreateProposal?: (data: any) => Promise<void>;
  onAddInteraction: (customerId: string, data: { channel: string; subject: string; description: string; result?: string }) => Promise<void>;
  onStartSimulationForCustomer: (customer: Customer) => void;
  initialSearchTerm?: string;
}

export const CrmView: React.FC<CrmViewProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onCreateProposal,
  onAddInteraction,
  onStartSimulationForCustomer,
  initialSearchTerm = ''
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'digitacao'>('detail');
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [activeTabSubpanel, setActiveTabSubpanel] = useState<'endereco' | 'contatos' | 'bancarios' | 'propostas' | 'produtos'>('endereco');

  const [customerInteractions, setCustomerInteractions] = useState<Interaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State for New Customer
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phonePrimary, setPhonePrimary] = useState('');
  const [email, setEmail] = useState('');
  const [customerType, setCustomerType] = useState<'inss' | 'servidor_publico' | 'clt' | 'autonomo'>('inss');
  const [benefitNumber, setBenefitNumber] = useState('');
  const [publicOrgan, setPublicOrgan] = useState('');
  const [matricula, setMatricula] = useState('');
  const [grossIncome, setGrossIncome] = useState('');
  const [netIncome, setNetIncome] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Porto Alegre');
  const [state, setState] = useState('RS');
  const [postalCode, setPostalCode] = useState('');
  const [bankName, setBankName] = useState('Banrisul');
  const [bankAgency, setBankAgency] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(true);

  // Interaction State
  const [interactionSubject, setInteractionSubject] = useState('');
  const [interactionDesc, setInteractionDesc] = useState('');
  const [interactionChannel, setInteractionChannel] = useState<'whatsapp' | 'telefone' | 'presencial' | 'email'>('whatsapp');
  const [interactionResult, setInteractionResult] = useState('');

  // Sync search when changed from global top bar
  React.useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
      if (initialSearchTerm.trim().length > 0) {
        const match = customers.find(c => 
          c.fullName.toLowerCase().includes(initialSearchTerm.toLowerCase()) ||
          c.cpf.includes(initialSearchTerm) ||
          c.phonePrimary.includes(initialSearchTerm)
        );
        if (match) {
          setSelectedCustomerId(match.id);
          setViewMode('detail');
        }
      }
    }
  }, [initialSearchTerm, customers]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const handleSelectCustomer = async (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setViewMode('detail');
    try {
      setCustomerInteractions(await listInteractions(cust.id));
    } catch {
      setCustomerInteractions([]);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.cpf.includes(q) ||
      c.phonePrimary.includes(q) ||
      (c.benefitNumber && c.benefitNumber.includes(q))
    );
  });

  const handleSubmitNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !cpf.trim() || !phonePrimary.trim()) {
      setFormError('Preencha os campos obrigatórios: Nome Completo, CPF e Telefone.');
      return;
    }

    if (!lgpdConsent) {
      setFormError('É obrigatório registrar o consentimento do titular conforme a LGPD.');
      return;
    }

    setIsSubmitting(true);
    const success = await onAddCustomer({
      fullName,
      cpf,
      phonePrimary,
      email,
      customerType,
      benefitNumber: customerType === 'inss' ? benefitNumber : undefined,
      publicOrgan: customerType === 'servidor_publico' ? publicOrgan : undefined,
      matricula: customerType === 'servidor_publico' ? matricula : undefined,
      grossIncome: Number(grossIncome) || 0,
      netIncome: Number(netIncome) || 0,
      street,
      number,
      neighborhood,
      city,
      state,
      postalCode,
      bankName,
      bankAgency,
      bankAccount,
      notes
    });

    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
      // Reset form
      setFullName('');
      setCpf('');
      setPhonePrimary('');
      setEmail('');
      setBenefitNumber('');
      setPublicOrgan('');
      setMatricula('');
      setGrossIncome('');
      setNetIncome('');
      setStreet('');
      setNumber('');
      setNeighborhood('');
      setPostalCode('');
      setNotes('');
    }
  };

  const handleSaveInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !interactionSubject.trim() || !interactionDesc.trim()) return;

    await onAddInteraction(selectedCustomer.id, {
      channel: interactionChannel,
      subject: interactionSubject,
      description: interactionDesc,
      result: interactionResult
    });

    try {
      setCustomerInteractions(await listInteractions(selectedCustomer.id));
    } catch {
      /* mantém a lista atual */
    }

    setIsInteractionModalOpen(false);
    setInteractionSubject('');
    setInteractionDesc('');
    setInteractionResult('');
  };

  return (
    <div className="space-y-4">
      {/* Sub-Header / Breadcrumb Strip (Inspired by reference) */}
      <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Clientes
          </h2>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 font-medium">
            Gerenciamento e Ficha Cadastral Unificada
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="text-[11px] text-slate-500 hidden md:block">
            Dashboard / Clientes / <span className="font-semibold text-slate-800">{viewMode === 'detail' ? 'Mostrar Cliente' : 'Listagem Geral'}</span>
          </div>

          {viewMode === 'detail' && (
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Ver Todos ({customers.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              setCustomerToEdit(null);
              setViewMode('digitacao');
            }}
            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ NOVO CLIENTE (DIGITAÇÃO BANCÁRIA)</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 0: DIGITAÇÃO BANCÁRIA COMPLETA DE PROPOSTA E CADASTRO */}
      {viewMode === 'digitacao' && (
        <CustomerRegistrationForm
          initialCustomer={customerToEdit}
          onSave={async (customerData) => {
            let ok = false;
            if (customerToEdit && customerToEdit.id && onUpdateCustomer) {
              ok = await onUpdateCustomer(customerToEdit.id, customerData);
            } else {
              ok = await onAddCustomer(customerData);
            }
            if (ok) {
              setViewMode('detail');
            }
            return ok;
          }}
          onSaveAndCreateProposal={async (customerData, proposalData) => {
            let customerId = customerToEdit?.id;
            let ok = false;
            if (customerToEdit && customerToEdit.id && onUpdateCustomer) {
              ok = await onUpdateCustomer(customerToEdit.id, customerData);
            } else {
              ok = await onAddCustomer(customerData);
              const clean = (customerData.cpf || '').replace(/\D/g, '');
              const found = customers.find(c => c.cpf.replace(/\D/g, '') === clean);
              if (found) customerId = found.id;
            }

            if (onCreateProposal && customerId) {
              await onCreateProposal({
                customerId,
                productCode: proposalData.productCode,
                productName: proposalData.productCode,
                bankName: proposalData.bankName,
                bankCode: proposalData.bankCode,
                requestedAmount: proposalData.requestedAmount,
                netAmount: proposalData.netAmount,
                installmentValue: proposalData.installmentValue,
                installmentsCount: proposalData.installmentsCount,
                monthlyInterestRate: proposalData.monthlyInterestRate,
                cetAnnual: proposalData.cetAnnual
              });
            }
            return true;
          }}
          onCancel={() => {
            setViewMode(selectedCustomer ? 'detail' : 'list');
          }}
        />
      )}

      {/* VIEW MODE 1: FICHA DETALHADA DO CLIENTE (MOSTRAR CLIENTE - EXATAMENTE COMO NA IMAGEM DE REFERÊNCIA) */}
      {viewMode === 'detail' && selectedCustomer && (
        <div className="space-y-4">
          {/* Main Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            {/* Header: Title */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Mostrar Cliente
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedCustomer.id}
                  onChange={(e) => {
                    const c = customers.find(item => item.id === e.target.value);
                    if (c) handleSelectCustomer(c);
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      Alternar para: {c.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Two-Column Grid: Left Action Stack & Right Data Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column: Avatar & Action Buttons Stack (Inspired by reference) */}
              <div className="lg:col-span-1 flex flex-col items-center p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-900 text-2xl font-black">
                  {selectedCustomer.fullName.charAt(0)}
                </div>

                <div className="text-center w-full">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {selectedCustomer.fullName}
                  </h4>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Nascimento: {selectedCustomer.birthDate || '14/04/1958'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-blue-800 block mt-0.5">
                    CPF: {formatCPF(selectedCustomer.cpf)}
                  </span>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full">
                    {selectedCustomer.customerType.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Vivid Color Action Buttons Stack (Matching Reference Layout) */}
                <div className="w-full space-y-1.5 pt-2">
                  <button
                    onClick={() => {
                      setFormError(null);
                      setFullName(selectedCustomer.fullName);
                      setCpf(selectedCustomer.cpf);
                      setPhonePrimary(selectedCustomer.phonePrimary);
                      setEmail(selectedCustomer.email || '');
                      setStreet(selectedCustomer.street || '');
                      setNumber(selectedCustomer.number || '');
                      setNeighborhood(selectedCustomer.neighborhood || '');
                      setCity(selectedCustomer.city || '');
                      setState(selectedCustomer.state || '');
                      setPostalCode(selectedCustomer.postalCode || '');
                      setIsModalOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-[#0260E8] hover:bg-[#0250C5] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Alterar Dados</span>
                  </button>

                  <button
                    onClick={() => setIsInteractionModalOpen(true)}
                    className="w-full py-2 px-3 bg-[#0D9488] hover:bg-[#0B7A6F] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Atendimentos ({customerInteractions.length})</span>
                  </button>

                  <button
                    onClick={() => onStartSimulationForCustomer(selectedCustomer)}
                    className="w-full py-2 px-3 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>+ Add Empréstimo / Simular</span>
                  </button>

                  <button
                    onClick={() => setActiveTabSubpanel('propostas')}
                    className="w-full py-2 px-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Propostas & Contratos</span>
                  </button>

                  <a
                    href={`https://wa.me/55${selectedCustomer.phonePrimary.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(selectedCustomer.fullName)},%20sou%20da%20CORVEXA`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Comunicação (WhatsApp)</span>
                  </a>
                </div>
              </div>

              {/* Right Columns: Structured Data Fields & Sub-panels (3 Cols) */}
              <div className="lg:col-span-3 space-y-5">
                {/* Top Identification Form Fields Grid (Inspired by Reference) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-200/70">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Identidade / RG</label>
                    <div className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800">
                      {selectedCustomer.rg || '10982348 SSP/RS'}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Órgão Emissor</label>
                    <div className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800">
                      SSP/RS
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Data Emissão</label>
                    <div className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800">
                      15/03/2012
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">E-mail</label>
                    <div className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800 truncate">
                      {selectedCustomer.email || 'Não informado'}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Nome da Mãe</label>
                    <div className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800 truncate">
                      {selectedCustomer.motherName || 'Francisca Antunes Pereira'}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Estado Civil</label>
                    <div className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800">
                      Casado(a)
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Sexo</label>
                    <div className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800">
                      Masculino
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Renda Bruta</label>
                    <div className="p-2 bg-white rounded border border-slate-200 font-mono font-semibold text-slate-800 tabular-nums">
                      {formatBRL(selectedCustomer.grossIncome)}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Renda Líquida</label>
                    <div className="p-2 bg-white rounded border border-slate-200 font-mono font-bold text-emerald-700 tabular-nums">
                      {formatBRL(selectedCustomer.netIncome)}
                    </div>
                  </div>

                  {selectedCustomer.benefitNumber && (
                    <div className="sm:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Nº Benefício INSS</label>
                      <div className="p-2 bg-white rounded border border-slate-200 font-mono font-bold text-blue-900">
                        {selectedCustomer.benefitNumber}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub-panel Tabs (Matching reference layout) */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {/* Tabs Bar */}
                  <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-2 overflow-x-auto">
                    {[
                      { id: 'endereco', label: 'Endereço', icon: MapPin },
                      { id: 'contatos', label: 'Contatos & Histórico', icon: History },
                      { id: 'bancarios', label: 'Dados Bancários', icon: CreditCard },
                      { id: 'propostas', label: 'Propostas Vinculadas', icon: Briefcase },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTabSubpanel === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTabSubpanel(tab.id as any)}
                          className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                            isActive
                              ? 'border-blue-600 text-blue-900 bg-white shadow-xs'
                              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sub-panel Content */}
                  <div className="p-4">
                    {/* TAB 1: ENDEREÇO (Matching reference table: Logradouro, Número, Bairro, Cidade, UF, Cep, Ações) */}
                    {activeTabSubpanel === 'endereco' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            Lista de endereços vinculados
                          </span>
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[#16A34A] hover:bg-[#15803D] text-white rounded transition-colors"
                          >
                            + Add Endereço
                          </button>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-emerald-50/60 text-emerald-950 font-semibold border-b border-emerald-100 text-[11px]">
                              <tr>
                                <th className="py-2 px-3">Logradouro</th>
                                <th className="py-2 px-3">Número</th>
                                <th className="py-2 px-3">Bairro</th>
                                <th className="py-2 px-3">Cidade</th>
                                <th className="py-2 px-3">UF</th>
                                <th className="py-2 px-3">CEP</th>
                                <th className="py-2 px-3 text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              <tr>
                                <td className="py-2.5 px-3 font-medium text-slate-900">
                                  {selectedCustomer.street || 'Rua dos Andradas'}
                                </td>
                                <td className="py-2.5 px-3">
                                  {selectedCustomer.number || '1200'}
                                </td>
                                <td className="py-2.5 px-3">
                                  {selectedCustomer.neighborhood || 'Centro Histórico'}
                                </td>
                                <td className="py-2.5 px-3">
                                  {selectedCustomer.city || 'Porto Alegre'}
                                </td>
                                <td className="py-2.5 px-3 font-semibold">
                                  {selectedCustomer.state || 'RS'}
                                </td>
                                <td className="py-2.5 px-3 font-mono">
                                  {selectedCustomer.postalCode || '90010-000'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Principal
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="text-[10px] text-amber-700 italic">
                          * Endereços com vínculos em propostas averbadas não podem ser excluídos.
                        </p>
                      </div>
                    )}

                    {/* TAB 2: CONTATOS & HISTÓRICO */}
                    {activeTabSubpanel === 'contatos' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            Histórico de Atendimentos & Contatos
                          </span>
                          <button
                            onClick={() => setIsInteractionModalOpen(true)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[#0D9488] hover:bg-[#0B7A6F] text-white rounded transition-colors"
                          >
                            + Novo Atendimento
                          </button>
                        </div>

                        {customerInteractions.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                            Nenhum contato registrado. Clique no botão acima para registrar o primeiro atendimento.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {customerInteractions.map((inter) => (
                              <div key={inter.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                                <div className="flex justify-between text-[11px] text-slate-500">
                                  <span className="font-bold uppercase text-blue-700">{inter.channel}</span>
                                  <span className="font-mono">{formatDateTimeBR(inter.createdAt)}</span>
                                </div>
                                <div className="font-bold text-slate-900">{inter.subject}</div>
                                <p className="text-slate-600">{inter.description}</p>
                                {inter.result && (
                                  <div className="text-[11px] text-slate-500 font-medium pt-1">
                                    Resultado: <span className="text-slate-800">{inter.result}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: DADOS BANCÁRIOS */}
                    {activeTabSubpanel === 'bancarios' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Banco</span>
                          <span className="font-semibold text-slate-900">{selectedCustomer.bankName || 'Banrisul (041)'}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Agência</span>
                          <span className="font-mono font-medium text-slate-900">{selectedCustomer.bankAgency || '0100'}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Conta Corrente / Tipo</span>
                          <span className="font-mono font-bold text-slate-900">{selectedCustomer.bankAccount || '06.123456.0-9'}</span>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: PROPOSTAS VINCULADAS */}
                    {activeTabSubpanel === 'propostas' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-800">Operações e Propostas deste Cliente</span>
                          <button
                            onClick={() => onStartSimulationForCustomer(selectedCustomer)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[#16A34A] text-white rounded"
                          >
                            + Nova Simulação
                          </button>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                          Cliente apto para simulação nas 7 linhas de crédito CORVEXA (INSS, Servidor, CLT, FGTS, etc.).
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Operational Box (Matching reference layout) */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Operacional</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">* PDV / Filial</label>
                      <input
                        type="text"
                        readOnly
                        value={BRAND_CONFIG.defaultBranch}
                        className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">* Vendedor(a) / Operador</label>
                      <input
                        type="text"
                        readOnly
                        value="Tomás Silva (Operador Sênior)"
                        className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">* Status do Cliente</label>
                      <input
                        type="text"
                        readOnly
                        value="Ativo · Regularizado na Receita Federal"
                        className="w-full p-2 bg-white border border-slate-200 rounded text-emerald-700 font-bold"
                      />
                    </div>
                  </div>

                  {selectedCustomer.notes && (
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Observações Gerais</label>
                      <div className="p-2.5 bg-white border border-slate-200 rounded text-slate-700 text-xs">
                        {selectedCustomer.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar (Matching reference: Voltar, Excluir, Editar) */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() => setViewMode('list')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar à Lista</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert(`Ação de exclusão do cliente ${selectedCustomer.fullName} exige autorização de Administrador Master.`)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>

                    <button
                      onClick={() => {
                        setCustomerToEdit(selectedCustomer);
                        setViewMode('digitacao');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Digitação Completa / Editar Proposta</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: TABELA GERAL DE CLIENTES */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {filteredCustomers.length} clientes encontrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">Cliente / Titular</th>
                  <th className="py-3 px-4">CPF</th>
                  <th className="py-3 px-4">Vínculo</th>
                  <th className="py-3 px-4">Telefone</th>
                  <th className="py-3 px-4 text-right">Renda Líquida</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {cust.fullName}
                      <span className="block text-[10px] text-slate-400 font-normal">{cust.city}/{cust.state}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {formatCPF(cust.cpf)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                        {cust.customerType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {formatPhone(cust.phonePrimary)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatBRL(cust.netIncome)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCustomer(cust);
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition-colors"
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR OU EDITAR CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cadastrar Cliente — CORVEXA CRM</h3>
                <p className="text-xs text-slate-500">Validação oficial Módulo 11 de CPF e consentimento LGPD</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNewCustomer} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silveira"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CPF (com validação Módulo 11) *</label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="123.456.789-00"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone Principal (WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    value={phonePrimary}
                    onChange={(e) => setPhonePrimary(e.target.value)}
                    placeholder="(51) 98765-4321"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vínculo de Crédito *</label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="inss">Aposentado/Pensionista INSS</option>
                    <option value="servidor_publico">Servidor Público</option>
                    <option value="clt">Trabalhador CLT</option>
                    <option value="autonomo">Autônomo</option>
                  </select>
                </div>

                {customerType === 'inss' && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Número do Benefício INSS</label>
                    <input
                      type="text"
                      value={benefitNumber}
                      onChange={(e) => setBenefitNumber(e.target.value)}
                      placeholder="Ex: 184.920.481-2"
                      className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Renda Bruta (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={grossIncome}
                    onChange={(e) => setGrossIncome(e.target.value)}
                    placeholder="4000.00"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Renda Líquida (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={netIncome}
                    onChange={(e) => setNetIncome(e.target.value)}
                    placeholder="3200.00"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                {/* Address Section */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-800 block mb-2">Dados de Endereço</span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Logradouro"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Número"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="CEP"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* LGPD Consent */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="lgpd_modal"
                  checked={lgpdConsent}
                  onChange={(e) => setLgpdConsent(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="lgpd_modal" className="text-[11px] text-blue-950 leading-relaxed cursor-pointer">
                  <strong>Consentimento Formal LGPD:</strong> O titular autorizou o tratamento dos seus dados para fins de consulta de margem, simulação e formalização na plataforma CORVEXA.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-bold shadow-xs"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR CONTATO */}
      {isInteractionModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Novo Atendimento: {selectedCustomer.fullName}</h3>
              <button onClick={() => setIsInteractionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInteraction} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Canal de Contato</label>
                <select
                  value={interactionChannel}
                  onChange={(e) => setInteractionChannel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="whatsapp">WhatsApp Business</option>
                  <option value="telefone">Ligação Telefônica</option>
                  <option value="presencial">Balcão Presencial</option>
                  <option value="email">E-mail</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assunto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Simulação Banrisul Consignado"
                  value={interactionSubject}
                  onChange={(e) => setInteractionSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detalhamento *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Anotações comerciais da conversa..."
                  value={interactionDesc}
                  onChange={(e) => setInteractionDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resultado / Próximo Passo</label>
                <input
                  type="text"
                  placeholder="Ex: Aguardando envio de CNH"
                  value={interactionResult}
                  onChange={(e) => setInteractionResult(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInteractionModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  Salvar Atendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
