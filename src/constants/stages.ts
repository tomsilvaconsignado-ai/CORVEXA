import { StageDefinition, FunnelStage } from '../types/corban';

export const FUNNEL_STAGES: StageDefinition[] = [
  { id: 'lead_recebido', label: '1. Lead Recebido', category: 'captacao', order: 1, color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { id: 'aguardando_primeiro_contato', label: '2. Aguardando 1º Contato', category: 'captacao', order: 2, color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { id: 'em_atendimento', label: '3. Em Atendimento', category: 'atendimento', order: 3, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { id: 'qualificacao', label: '4. Qualificação', category: 'atendimento', order: 4, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { id: 'simulacao_solicitada', label: '5. Simulação Solicitada', category: 'atendimento', order: 5, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { id: 'simulacao_realizada', label: '6. Simulação Realizada', category: 'atendimento', order: 6, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'proposta_em_elaboracao', label: '7. Proposta em Elaboração', category: 'atendimento', order: 7, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'proposta_enviada', label: '8. Proposta Enviada ao Parceiro', category: 'analise', order: 8, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'aguardando_analise', label: '9. Aguardando Análise do Banco', category: 'analise', order: 9, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'aguardando_documentacao', label: '10. Aguardando Documentação', category: 'analise', order: 10, color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { id: 'aprovada', label: '11. Aprovada pelo Banco', category: 'formalizacao', order: 11, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  { id: 'aguardando_formalizacao', label: '12. Aguardando Formalização', category: 'formalizacao', order: 12, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  { id: 'contratada', label: '13. Contratada & Paga', category: 'conclusao', order: 13, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  { id: 'recusada', label: '14. Recusada pelo Banco', category: 'desfecho_negativo', order: 14, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { id: 'cancelada', label: '15. Cancelada pelo Cliente', category: 'desfecho_negativo', order: 15, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { id: 'perdida', label: '16. Oportunidade Perdida', category: 'desfecho_negativo', order: 16, color: 'text-slate-600 bg-slate-100 border-slate-200' },
  { id: 'pos_venda', label: '17. Pós-Venda & Relacionamento', category: 'conclusao', order: 17, color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
];

export const PRODUCTS_CONFIG = [
  { code: 'consignado_inss', name: 'Consignado INSS', category: 'consignado', defaultRate: 0.0166, maxTerm: 84, description: 'Desconto em folha para aposentados e pensionistas do INSS com margem regulada.' },
  { code: 'consignado_servidor', name: 'Servidor Público (SIAPE / Estados)', category: 'consignado', defaultRate: 0.0175, maxTerm: 96, description: 'Crédito consignado para servidores federais, estaduais e municipais conveniados.' },
  { code: 'consignado_clt', name: 'Crédito do Trabalhador CLT', category: 'consignado', defaultRate: 0.0210, maxTerm: 48, description: 'Crédito com desconto em folha para colaboradores em regime CLT de empresas credenciadas.' },
  { code: 'saque_fgts', name: 'Antecipação FGTS (Saque-Aniversário)', category: 'fgts', defaultRate: 0.0179, maxTerm: 10, description: 'Antecipação de parcelas do saque-aniversário com bloqueio de saldo garantia.' },
  { code: 'credito_pessoal', name: 'Crédito Pessoal', category: 'pessoal', defaultRate: 0.0380, maxTerm: 36, description: 'Linha de crédito direto em conta corrente para clientes com comprovação de renda.' },
  { code: 'portabilidade', name: 'Portabilidade de Crédito', category: 'portabilidade', defaultRate: 0.0162, maxTerm: 84, description: 'Transferência de dívida com redução de juros e/ou liberação de troco em conta.' },
  { code: 'refinanciamento', name: 'Refinanciamento (Refin)', category: 'refinanciamento', defaultRate: 0.0166, maxTerm: 84, description: 'Renovação do contrato ativo com alongamento de prazo e liberação do saldo líquido.' },
];
