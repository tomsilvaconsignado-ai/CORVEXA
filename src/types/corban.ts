/**
 * CORBAN 360 — TypeScript Type Definitions
 */

export type UserRole = 'admin_master' | 'gerente' | 'operador' | 'financeiro' | 'auditor';

export interface UserProfile {
  id: string;
  organizationId: string;
  branchId?: string;
  role: UserRole;
  email: string;
  fullName: string;
  cpf: string;
  phone?: string;
  avatarUrl?: string;
}

export type ProductCode = 
  | 'consignado_inss'
  | 'consignado_servidor'
  | 'consignado_clt'
  | 'saque_fgts'
  | 'credito_pessoal'
  | 'portabilidade'
  | 'refinanciamento';

export interface ProductInfo {
  code: ProductCode;
  name: string;
  category: 'consignado' | 'fgts' | 'pessoal' | 'portabilidade' | 'refinanciamento';
  description: string;
  minInstallments: number;
  maxInstallments: number;
  defaultMonthlyRate: number; // e.g. 0.0166 (1.66% a.m.)
  minAmount: number;
  maxAmount: number;
}

export type FunnelStage = 
  | 'lead_recebido'
  | 'aguardando_primeiro_contato'
  | 'em_atendimento'
  | 'qualificacao'
  | 'simulacao_solicitada'
  | 'simulacao_realizada'
  | 'proposta_em_elaboracao'
  | 'proposta_enviada'
  | 'aguardando_analise'
  | 'aguardando_documentacao'
  | 'aprovada'
  | 'aguardando_formalizacao'
  | 'contratada'
  | 'recusada'
  | 'cancelada'
  | 'perdida'
  | 'pos_venda';

export interface StageDefinition {
  id: FunnelStage;
  label: string;
  category: 'captacao' | 'atendimento' | 'analise' | 'formalizacao' | 'conclusao' | 'desfecho_negativo';
  order: number;
  color: string;
}

export interface PersonalReference {
  id?: string;
  name: string;
  relationship: string; // 'Parente' | 'Cônjuge' | 'Amigo' | 'Trabalho' | 'Recado' | 'Outro'
  ddd: string;
  phone: string;
  notes?: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  operatorId: string;
  fullName: string;
  cpf: string;
  rg?: string;
  rgType?: string; // 'RG' | 'CNH' | 'Carteira Funcional' | 'RNE'
  rgEmitter?: string; // SSP, DETRAN, etc.
  rgEmitterUf?: string;
  rgIssueDate?: string;
  birthDate?: string;
  motherName?: string;
  fatherName?: string;
  nationality?: string;
  naturalidade?: string;
  birthUf?: string;
  gender?: 'M' | 'F' | 'Outro' | 'Não informado';
  maritalStatus?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável' | 'Separado(a)';
  email?: string;
  phonePrimary: string;
  phoneSecondary?: string;
  whatsapp?: string;
  profession?: string;
  customerType: 'inss' | 'servidor_publico' | 'clt' | 'autonomo';
  benefitNumber?: string;
  publicOrgan?: string;
  matricula?: string;
  employerCnpj?: string;
  grossIncome: number;
  netIncome: number;
  otherIncomes?: number;
  functionalStatus?: string;
  admissionDate?: string;
  jobTitle?: string;
  pepIndicator?: boolean; // Pessoa Politicamente Exposta
  legalRepresentative?: boolean;
  legalRepresentativeName?: string;
  legalRepresentativeCpf?: string;
  
  // Margem e Averbação
  marginAvailable?: number;
  marginUsed?: number;
  marginTotal?: number;
  marginConsultDate?: string;
  marginAverbaId?: string;
  paystubDate?: string;
  averbaContract?: string;
  averbaNumber?: string;
  averbaStatus?: string;
  averbaProtocol?: string;

  // Endereço
  postalCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  residenceType?: string;
  residenceYears?: number;
  residenceMonths?: number;
  prevResidenceYears?: number;
  prevResidenceMonths?: number;

  // Dados Bancários
  bankCode?: string;
  bankName?: string;
  bankAgency?: string;
  bankAgencyDigit?: string;
  bankAgencyDesc?: string;
  bankAgencyCity?: string;
  bankAgencyUf?: string;
  bankAccount?: string;
  bankAccountDigit?: string;
  bankAccountType?: string;
  bankPixType?: 'cpf' | 'telefone' | 'email' | 'aleatoria';
  bankPixKey?: string;
  bankAccountHolder?: string;
  bankAccountHolderCpf?: string;
  bankIsVerified?: boolean;

  // Operação e Digitação
  promoterCode?: string;
  promoterName?: string;
  operationType?: string;
  formalizationType?: 'digital' | 'fisica';
  formalizationSubtype?: string;
  branchOffice?: string;
  regionalOffice?: string;
  formalizationStatus?: string;
  signatureStatus?: string;
  disbursementStatus?: string;
  disbursementDate?: string;
  leadSource?: string;
  typingAgentCpf?: string;
  typingAgentName?: string;
  typingOperator?: string;

  // Referências
  references?: PersonalReference[];

  status: 'ativo' | 'inativo' | 'em_analise';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerConsent {
  id: string;
  customerId: string;
  consentType: 'dados_cadastrais' | 'consulta_margem' | 'contato_comercial' | 'compartilhamento_bancario';
  granted: boolean;
  legalBasis: string;
  grantedAt: string;
  ipAddress?: string;
}

export interface Interaction {
  id: string;
  customerId: string;
  operatorId: string;
  operatorName: string;
  channel: 'whatsapp' | 'telefone' | 'presencial' | 'email';
  subject: string;
  description: string;
  result?: string;
  createdAt: string;
}

export interface SimulationResult {
  id: string;
  customerId?: string;
  customerName?: string;
  productCode: ProductCode;
  productName: string;
  requestedAmount: number;
  netAmount: number;
  installmentsCount: number;
  monthlyInterestRate: number;
  annualInterestRate: number;
  installmentValue: number;
  totalRepayable: number;
  totalInterest: number;
  iofAmount: number;
  cetMonthly: number;
  cetAnnual: number;
  conditions: PartnerCondition[];
  simulationType: 'indicativa' | 'oficial_parceiro';
  createdAt: string;
}

export interface PartnerCondition {
  bankCode: string;
  bankName: string;
  installmentValue: number;
  monthlyRate: number;
  totalAmount: number;
  isRecommended?: boolean;
}

export interface ProposalDocument {
  id: string;
  documentType: 'rg_cnh' | 'comprovante_residencia' | 'extrato_inss' | 'holerite' | 'termo_adesao' | 'selfie';
  label: string;
  fileName?: string;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';
  rejectionReason?: string;
  uploadedAt?: string;
  verifiedAt?: string;
}

export interface Proposal {
  id: string;
  proposalNumber: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  customerCpf: string;
  operatorId: string;
  operatorName: string;
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
  status: FunnelStage;
  stageUpdatedAt: string;
  externalProposalId?: string;
  formalizationLink?: string;
  lossReason?: string;
  documents: ProposalDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface ProposalStatusLog {
  id: string;
  proposalId: string;
  previousStatus: FunnelStage;
  newStatus: FunnelStage;
  changedBy: string;
  changedByName: string;
  notes?: string;
  createdAt: string;
}

export interface Commission {
  id: string;
  proposalId: string;
  proposalNumber: string;
  contractNumber?: string;
  customerName: string;
  operatorId: string;
  operatorName: string;
  bankName: string;
  productName: string;
  baseProductionAmount: number;
  grossCommissionExpected: number;
  operatorCommissionExpected: number;
  grossCommissionReceived: number;
  operatorCommissionPaid: number;
  status: 'prevista' | 'confirmada_parceiro' | 'recebida' | 'paga_operador' | 'estornada';
  expectedPaymentDate: string;
  receivedAt?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export interface BankingConnector {
  id: string;
  bankCode: string;
  bankName: string;
  partnerType: 'banco_direto' | 'promotora' | 'orgao_oficial';
  environment: 'homologacao' | 'producao';
  baseUrl: string;
  authType: string;
  status: 'ativo' | 'pendente_homologacao' | 'em_manutencao';
  supportedOperations: string[];
  docUrl: string;
  lastCommunicationAt?: string;
  notes: string;
}

export interface AuditLog {
  id: string;
  action: string;
  targetEntity: string;
  targetId?: string;
  operatorName: string;
  details: string;
  createdAt: string;
}
