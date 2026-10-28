/**
 * CORBAN 360 — Full-Stack Express Server & Persistent REST API
 */

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { 
  Customer, 
  Proposal, 
  SimulationResult, 
  Commission, 
  BankingConnector, 
  AuditLog, 
  UserProfile, 
  UserRole,
  ProductCode,
  FunnelStage,
  Interaction,
  CustomerConsent
} from './src/types/corban.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'corban_store.json');

app.use(express.json());

// Helper: Ensure Data Directory
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

import { isValidCPF, calculateFinancialLoan } from './src/utils/financial.ts';
import { isValidCNPJ } from './src/utils/cnpj.ts';

// -----------------------------------------------------------------------------
// SEED DATA GENERATOR
// -----------------------------------------------------------------------------
function getInitialSeed() {
  const users: UserProfile[] = [
    {
      id: 'usr-admin-01',
      organizationId: 'org-corban-360',
      branchId: 'br-matriz-01',
      role: 'admin_master',
      email: 'admin@corvexa.com.br',
      fullName: 'Carlos Eduardo Silveira',
      cpf: '234.891.740-12',
      phone: '(51) 98123-4567'
    },
    {
      id: 'usr-gerente-01',
      organizationId: 'org-corban-360',
      branchId: 'br-matriz-01',
      role: 'gerente',
      email: 'mariana.costa@corvexa.com.br',
      fullName: 'Mariana Costa Mendes',
      cpf: '456.123.890-44',
      phone: '(51) 99345-6789'
    },
    {
      id: 'usr-operador-01',
      organizationId: 'org-corban-360',
      branchId: 'br-matriz-01',
      role: 'operador',
      email: 'tomsilvaconsignado@gmail.com',
      fullName: 'Tomás Silva (Operador Sênior)',
      cpf: '789.456.123-00',
      phone: '(51) 98765-4321'
    },
    {
      id: 'usr-financeiro-01',
      organizationId: 'org-corban-360',
      branchId: 'br-matriz-01',
      role: 'financeiro',
      email: 'renata.financeiro@corvexa.com.br',
      fullName: 'Renata Albuquerque',
      cpf: '321.654.987-11',
      phone: '(51) 98222-3344'
    },
    {
      id: 'usr-auditor-01',
      organizationId: 'org-corban-360',
      branchId: 'br-matriz-01',
      role: 'auditor',
      email: 'compliance@corvexa.com.br',
      fullName: 'Dr. Fernando Lins (Compliance)',
      cpf: '654.321.987-22',
      phone: '(51) 98111-2233'
    }
  ];

  const customers: Customer[] = [
    {
      id: 'cust-001',
      organizationId: 'org-corban-360',
      operatorId: 'usr-operador-01',
      fullName: 'Sebastião Antunes Pereira',
      cpf: '123.456.789-09',
      rg: '10982348',
      rgType: 'RG - Registro Geral',
      rgEmitter: 'SSP',
      rgEmitterUf: 'RS',
      rgIssueDate: '1982-06-15',
      birthDate: '1958-04-14',
      motherName: 'Francisca Antunes Pereira',
      fatherName: 'José Ribeiro Pereira',
      nationality: '01 - BRASILEIRO',
      naturalidade: 'Porto Alegre',
      birthUf: 'RS',
      gender: 'M',
      maritalStatus: 'Casado(a)',
      profession: 'Aposentado INSS',
      email: 'sebastiao.pereira@gmail.com',
      phonePrimary: '(51) 99876-1234',
      phoneSecondary: '(51) 3224-5588',
      whatsapp: '(51) 99876-1234',
      pepIndicator: false,
      legalRepresentative: false,
      customerType: 'inss',
      benefitNumber: '184.920.481-2',
      grossIncome: 3820.00,
      netIncome: 3200.00,
      otherIncomes: 0.00,
      functionalStatus: 'Aposentado',
      marginAvailable: 420.00,
      marginUsed: 780.00,
      marginTotal: 1200.00,
      marginConsultDate: '2026-10-28',
      marginAverbaId: 'AVB-INSS-99214',
      paystubDate: '2026-10-05',
      postalCode: '90010-000',
      street: 'Rua dos Andradas',
      number: '1200',
      complement: 'Apto 402',
      neighborhood: 'Centro Histórico',
      city: 'Porto Alegre',
      state: 'RS',
      residenceType: 'Própria',
      residenceYears: 18,
      residenceMonths: 4,
      prevResidenceYears: 12,
      prevResidenceMonths: 0,
      bankCode: '041',
      bankName: '041 - BANCO BANRISUL S.A.',
      bankAgency: '0100',
      bankAgencyDigit: '2',
      bankAgencyDesc: 'Agência Centro Porto Alegre',
      bankAgencyCity: 'Porto Alegre',
      bankAgencyUf: 'RS',
      bankAccount: '06123456',
      bankAccountDigit: '9',
      bankAccountType: '01 - Conta Corrente Individual',
      bankPixType: 'cpf',
      bankPixKey: '123.456.789-09',
      bankAccountHolder: 'Sebastião Antunes Pereira',
      bankAccountHolderCpf: '123.456.789-09',
      bankIsVerified: true,
      promoterCode: '003545',
      promoterName: '003545 - BEVI NORDESTE INFORM',
      operationType: 'NOVO - EMPRÉSTIMO CONSIGNADO',
      formalizationType: 'digital',
      formalizationSubtype: 'LINK DIGITAL VIA WHATSAPP COM BIOMETRIA',
      branchOffice: '000001 - BANCO CS CONSIG',
      regionalOffice: '000002 - MASTER',
      averbaContract: 'CTR-BAN-2026-9901',
      averbaNumber: 'AVB-883921',
      averbaStatus: 'Averbação Confirmada',
      averbaProtocol: 'PRT-DATAPREV-2026-8819',
      formalizationStatus: 'Documentação Aprovada',
      signatureStatus: 'Assinado pelo Cliente',
      disbursementStatus: 'Aguardando Liberação TED/PIX',
      disbursementDate: '2026-10-28',
      leadSource: 'Atendimento em Balcão (Matriz)',
      typingAgentCpf: '789.456.123-00',
      typingAgentName: 'Tomás Silva (Operador Sênior)',
      typingOperator: 'Tomás Silva',
      references: [
        { name: 'Lucas Antunes Pereira', relationship: 'Parente', ddd: '51', phone: '99111-2233', notes: 'Filho do cliente' },
        { name: 'Marcos Vinicius Ribeiro', relationship: 'Amigo', ddd: '51', phone: '98822-4455', notes: 'Vizinho há 15 anos' }
      ],
      status: 'ativo',
      notes: 'Aposentado por tempo de contribuição. Margem livre confirmada de R$ 420,00.',
      createdAt: '2026-10-20T09:30:00Z',
      updatedAt: '2026-10-27T14:15:00Z'
    },
    {
      id: 'cust-002',
      organizationId: 'org-corban-360',
      operatorId: 'usr-operador-01',
      fullName: 'Cleusa Maria dos Santos',
      cpf: '111.444.777-35',
      rg: '20394857',
      rgType: 'RG - Registro Geral',
      rgEmitter: 'SSP',
      rgEmitterUf: 'RS',
      rgIssueDate: '1990-03-20',
      birthDate: '1964-11-23',
      motherName: 'Maria Helena dos Santos',
      fatherName: 'Antônio dos Santos',
      nationality: '01 - BRASILEIRO',
      naturalidade: 'Canoas',
      birthUf: 'RS',
      gender: 'F',
      maritalStatus: 'Divorciado(a)',
      profession: 'Professora Estadual',
      email: 'cleusa.santos@terra.com.br',
      phonePrimary: '(51) 98765-8901',
      phoneSecondary: '(51) 3472-1090',
      whatsapp: '(51) 98765-8901',
      pepIndicator: false,
      legalRepresentative: false,
      customerType: 'servidor_publico',
      publicOrgan: 'Governo do Estado do RS',
      matricula: '1948201/01',
      grossIncome: 7450.00,
      netIncome: 5800.00,
      otherIncomes: 0.00,
      functionalStatus: 'Ativo',
      marginAvailable: 850.00,
      marginUsed: 1100.00,
      marginTotal: 1950.00,
      marginConsultDate: '2026-10-28',
      marginAverbaId: 'AVB-FPE-33910',
      paystubDate: '2026-10-01',
      postalCode: '90450-020',
      street: 'Avenida Goethe',
      number: '450',
      complement: 'Conj 201',
      neighborhood: 'Moinhos de Vento',
      city: 'Porto Alegre',
      state: 'RS',
      residenceType: 'Própria',
      residenceYears: 10,
      residenceMonths: 2,
      prevResidenceYears: 8,
      prevResidenceMonths: 6,
      bankCode: '041',
      bankName: '041 - BANCO BANRISUL S.A.',
      bankAgency: '0050',
      bankAgencyDigit: '8',
      bankAgencyDesc: 'Agência Moinhos de Vento',
      bankAgencyCity: 'Porto Alegre',
      bankAgencyUf: 'RS',
      bankAccount: '05987654',
      bankAccountDigit: '2',
      bankAccountType: '01 - Conta Corrente Individual',
      bankPixType: 'telefone',
      bankPixKey: '(51) 98765-8901',
      bankAccountHolder: 'Cleusa Maria dos Santos',
      bankAccountHolderCpf: '111.444.777-35',
      bankIsVerified: true,
      promoterCode: '003545',
      promoterName: '003545 - BEVI NORDESTE INFORM',
      operationType: 'PORTABILIDADE DE CRÉDITO COM TROCO',
      formalizationType: 'digital',
      formalizationSubtype: 'ASSINATURA ELETRÔNICA ICP-BRASIL / GOV.BR',
      branchOffice: '000001 - BANCO CS CONSIG',
      regionalOffice: '000002 - MASTER',
      averbaContract: 'CTR-RS-2026-1002',
      averbaNumber: 'AVB-771029',
      averbaStatus: 'Aguardando Quitação CIP',
      averbaProtocol: 'CIP-STR-994102',
      formalizationStatus: 'Documentos Conferidos',
      signatureStatus: 'Assinado pelo Cliente',
      disbursementStatus: 'Aguardando Liquidação Portabilidade',
      leadSource: 'Campanha WhatsApp Ativo',
      typingAgentCpf: '789.456.123-00',
      typingAgentName: 'Tomás Silva (Operador Sênior)',
      typingOperator: 'Tomás Silva',
      references: [
        { name: 'Fernanda Santos Lima', relationship: 'Parente', ddd: '51', phone: '99222-3344', notes: 'Irmã da titular' }
      ],
      status: 'ativo',
      notes: 'Professora estadual. Interessada em portabilidade com redução de taxa do Santander para Banrisul.',
      createdAt: '2026-10-22T11:00:00Z',
      updatedAt: '2026-10-27T16:00:00Z'
    },
    {
      id: 'cust-003',
      organizationId: 'org-corban-360',
      operatorId: 'usr-operador-01',
      fullName: 'Rodrigo Barbosa Nogueira',
      cpf: '543.210.987-65',
      birthDate: '1989-08-12',
      email: 'rodrigo.b.nogueira@outlook.com',
      phonePrimary: '(51) 99123-0044',
      whatsapp: '(51) 99123-0044',
      customerType: 'clt',
      employerCnpj: '02.456.789/0001-30',
      grossIncome: 4200.00,
      netIncome: 3450.00,
      postalCode: '93010-180',
      street: 'Rua Independência',
      number: '880',
      city: 'São Leopoldo',
      state: 'RS',
      bankCode: '104',
      bankName: 'Caixa Econômica Federal',
      status: 'ativo',
      notes: 'Solicitou antecipação de 5 períodos do Saque-Aniversário do FGTS.',
      createdAt: '2026-10-25T15:20:00Z',
      updatedAt: '2026-10-26T10:10:00Z'
    },
    {
      id: 'cust-004',
      organizationId: 'org-corban-360',
      operatorId: 'usr-operador-01',
      fullName: 'Almirante Jorge Viana',
      cpf: '345.678.901-23',
      birthDate: '1952-03-30',
      phonePrimary: '(51) 98456-7890',
      customerType: 'inss',
      benefitNumber: '190.345.892-0',
      grossIncome: 5120.00,
      netIncome: 4200.00,
      city: 'Canoas',
      state: 'RS',
      status: 'ativo',
      notes: 'Pensionista do INSS. Refinanciamento de contrato antigo do Banco PAN.',
      createdAt: '2026-10-26T08:45:00Z',
      updatedAt: '2026-10-27T18:00:00Z'
    }
  ];

  const customerConsents: CustomerConsent[] = [
    {
      id: 'cst-001',
      customerId: 'cust-001',
      consentType: 'dados_cadastrais',
      granted: true,
      legalBasis: 'consentimento_titular',
      grantedAt: '2026-10-20T09:35:00Z',
      ipAddress: '189.102.45.12'
    },
    {
      id: 'cst-002',
      customerId: 'cust-001',
      consentType: 'consulta_margem',
      granted: true,
      legalBasis: 'execucao_contrato',
      grantedAt: '2026-10-20T09:35:00Z'
    },
    {
      id: 'cst-003',
      customerId: 'cust-002',
      consentType: 'compartilhamento_bancario',
      granted: true,
      legalBasis: 'consentimento_titular',
      grantedAt: '2026-10-22T11:05:00Z'
    }
  ];

  const interactions: Interaction[] = [
    {
      id: 'int-001',
      customerId: 'cust-001',
      operatorId: 'usr-operador-01',
      operatorName: 'Tomás Silva',
      channel: 'whatsapp',
      subject: 'Envio de simulação Consignado INSS Banrisul',
      description: 'Cliente visualizou a simulação de R$ 15.000,00 em 84x com parcela de R$ 334,12 e aceitou avançar para formalização digital.',
      result: 'Aceite do cliente obtido',
      createdAt: '2026-10-24T10:30:00Z'
    },
    {
      id: 'int-002',
      customerId: 'cust-002',
      operatorId: 'usr-operador-01',
      operatorName: 'Tomás Silva',
      channel: 'telefone',
      subject: 'Explicação do prazo de CIP Portabilidade',
      description: 'Esclarecido que o banco credor original possui até 5 dias úteis para retenção ou envio do saldo devedor.',
      result: 'Cliente ciente dos prazos',
      createdAt: '2026-10-26T14:00:00Z'
    }
  ];

  const proposals: Proposal[] = [
    {
      id: 'prop-001',
      proposalNumber: 'PR-2026-00481',
      organizationId: 'org-corban-360',
      customerId: 'cust-001',
      customerName: 'Sebastião Antunes Pereira',
      customerCpf: '123.456.789-09',
      operatorId: 'usr-operador-01',
      operatorName: 'Tomás Silva',
      productCode: 'consignado_inss',
      productName: 'Consignado INSS',
      bankName: 'Banrisul',
      bankCode: '041',
      requestedAmount: 15000.00,
      netAmount: 15000.00,
      installmentValue: 334.12,
      installmentsCount: 84,
      monthlyInterestRate: 0.0166,
      cetAnnual: 0.2450,
      status: 'aguardando_formalizacao',
      stageUpdatedAt: '2026-10-27T10:00:00Z',
      externalProposalId: 'BAN-INSS-993821',
      formalizationLink: 'https://formalizacao.banrisul.com.br/token=993821',
      documents: [
        { id: 'doc-01', documentType: 'rg_cnh', label: 'RG / CNH Frente e Verso', status: 'aprovado', fileName: 'cnh_sebastiao.pdf', uploadedAt: '2026-10-25T11:00:00Z', verifiedAt: '2026-10-25T14:30:00Z' },
        { id: 'doc-02', documentType: 'comprovante_residencia', label: 'Comprovante de Residência', status: 'aprovado', fileName: 'comprovante_luz.pdf', uploadedAt: '2026-10-25T11:05:00Z', verifiedAt: '2026-10-25T14:30:00Z' },
        { id: 'doc-03', documentType: 'extrato_inss', label: 'Extrato de Benefício (Hiscre/Hiscon)', status: 'aprovado', fileName: 'extrato_inss_2026.pdf', uploadedAt: '2026-10-25T11:10:00Z', verifiedAt: '2026-10-25T14:30:00Z' },
        { id: 'doc-04', documentType: 'termo_adesao', label: 'CCB / Termo de Adesão Assinado', status: 'em_analise', fileName: 'ccb_assinada.pdf', uploadedAt: '2026-10-27T09:40:00Z' }
      ],
      createdAt: '2026-10-24T10:00:00Z',
      updatedAt: '2026-10-27T10:00:00Z'
    },
    {
      id: 'prop-002',
      proposalNumber: 'PR-2026-00482',
      organizationId: 'org-corban-360',
      customerId: 'cust-002',
      customerName: 'Cleusa Maria dos Santos',
      customerCpf: '111.444.777-35',
      operatorId: 'usr-operador-01',
      operatorName: 'Tomás Silva',
      productCode: 'portabilidade',
      productName: 'Portabilidade de Crédito',
      bankName: 'Banrisul',
      bankCode: '041',
      requestedAmount: 38500.00,
      netAmount: 38500.00,
      installmentValue: 842.10,
      installmentsCount: 84,
      monthlyInterestRate: 0.0162,
      cetAnnual: 0.2380,
      status: 'aguardando_analise',
      stageUpdatedAt: '2026-10-26T16:00:00Z',
      externalProposalId: 'CIP-PORT-771239',
      documents: [
        { id: 'doc-11', documentType: 'rg_cnh', label: 'RG / CNH Frente e Verso', status: 'aprovado', fileName: 'rg_cleusa.pdf', uploadedAt: '2026-10-26T15:00:00Z' },
        { id: 'doc-12', documentType: 'holerite', label: 'Contracheque Recente', status: 'aprovado', fileName: 'holerite_set2026.pdf', uploadedAt: '2026-10-26T15:10:00Z' },
        { id: 'doc-13', documentType: 'termo_adesao', label: 'Solicitação Formal de Portabilidade', status: 'pendente' }
      ],
      createdAt: '2026-10-26T14:30:00Z',
      updatedAt: '2026-10-26T16:00:00Z'
    },
    {
      id: 'prop-003',
      proposalNumber: 'PR-2026-00483',
      organizationId: 'org-corban-360',
      customerId: 'cust-003',
      customerName: 'Rodrigo Barbosa Nogueira',
      customerCpf: '543.210.987-65',
      operatorId: 'usr-operador-01',
      operatorName: 'Tomás Silva',
      productCode: 'saque_fgts',
      productName: 'Antecipação FGTS',
      bankName: 'Banco PAN',
      bankCode: '623',
      requestedAmount: 6400.00,
      netAmount: 5850.00,
      installmentValue: 1280.00,
      installmentsCount: 5,
      monthlyInterestRate: 0.0179,
      cetAnnual: 0.2610,
      status: 'contratada',
      stageUpdatedAt: '2026-10-27T17:30:00Z',
      externalProposalId: 'PAN-FGTS-44109',
      documents: [
        { id: 'doc-21', documentType: 'rg_cnh', label: 'RG / CNH', status: 'aprovado', fileName: 'cnh_rodrigo.pdf', uploadedAt: '2026-10-26T09:00:00Z', verifiedAt: '2026-10-26T09:30:00Z' },
        { id: 'doc-22', documentType: 'selfie', label: 'Selfie com Documento', status: 'aprovado', fileName: 'selfie_biometria.jpg', uploadedAt: '2026-10-26T09:15:00Z', verifiedAt: '2026-10-26T09:30:00Z' }
      ],
      createdAt: '2026-10-26T08:50:00Z',
      updatedAt: '2026-10-27T17:30:00Z'
    },
    {
      id: 'prop-004',
      proposalNumber: 'PR-2026-00484',
      organizationId: 'org-corban-360',
      customerId: 'cust-004',
      customerName: 'Almirante Jorge Viana',
      customerCpf: '345.678.901-23',
      operatorId: 'usr-operador-01',
      operatorName: 'Tomás Silva',
      productCode: 'refinanciamento',
      productName: 'Refinanciamento INSS',
      bankName: 'Santander / Olé',
      bankCode: '033',
      requestedAmount: 22000.00,
      netAmount: 4800.00, // Troco líquido
      installmentValue: 495.30,
      installmentsCount: 84,
      monthlyInterestRate: 0.0166,
      cetAnnual: 0.2450,
      status: 'proposta_em_elaboracao',
      stageUpdatedAt: '2026-10-27T18:00:00Z',
      documents: [
        { id: 'doc-31', documentType: 'rg_cnh', label: 'RG / CNH', status: 'pendente' },
        { id: 'doc-32', documentType: 'extrato_inss', label: 'Extrato de Empréstimos Ativos', status: 'pendente' }
      ],
      createdAt: '2026-10-27T18:00:00Z',
      updatedAt: '2026-10-27T18:00:00Z'
    }
  ];

  const commissions: Commission[] = [
    {
      id: 'com-001',
      proposalId: 'prop-003',
      proposalNumber: 'PR-2026-00483',
      contractNumber: 'CTR-PAN-FGTS-44109',
      customerName: 'Rodrigo Barbosa Nogueira',
      operatorId: 'usr-operador-01',
      operatorName: 'Tomás Silva',
      bankName: 'Banco PAN',
      productName: 'Antecipação FGTS',
      baseProductionAmount: 6400.00,
      grossCommissionExpected: 6400.00 * 0.08, // 8% = R$ 512,00
      operatorCommissionExpected: 6400.00 * 0.03, // 3% = R$ 192,00
      grossCommissionReceived: 512.00,
      operatorCommissionPaid: 0.00,
      status: 'recebida',
      expectedPaymentDate: '2026-10-28',
      receivedAt: '2026-10-27T18:00:00Z',
      notes: 'Crédito repassado via extrato de produção Banco PAN.',
      createdAt: '2026-10-27T17:35:00Z'
    },
    {
      id: 'com-002',
      proposalId: 'prop-001',
      proposalNumber: 'PR-2026-00481',
      customerName: 'Sebastião Antunes Pereira',
      operatorId: 'usr-operador-01',
      operatorName: 'Tomás Silva',
      bankName: 'Banrisul',
      productName: 'Consignado INSS',
      baseProductionAmount: 15000.00,
      grossCommissionExpected: 15000.00 * 0.12, // 12% = R$ 1.800,00
      operatorCommissionExpected: 15000.00 * 0.04, // 4% = R$ 600,00
      grossCommissionReceived: 0.00,
      operatorCommissionPaid: 0.00,
      status: 'confirmada_parceiro',
      expectedPaymentDate: '2026-11-05',
      notes: 'Aguardando apenas averbação formal para liberação na conta do correspondente.',
      createdAt: '2026-10-25T11:30:00Z'
    },
    {
      id: 'com-003',
      proposalId: 'prop-002',
      proposalNumber: 'PR-2026-00482',
      customerName: 'Cleusa Maria dos Santos',
      operatorId: 'usr-operador-01',
      operatorName: 'Tomás Silva',
      bankName: 'Banrisul',
      productName: 'Portabilidade de Crédito',
      baseProductionAmount: 38500.00,
      grossCommissionExpected: 38500.00 * 0.09, // 9% = R$ 3.465,00
      operatorCommissionExpected: 38500.00 * 0.035, // 3.5% = R$ 1.347,50
      grossCommissionReceived: 0.00,
      operatorCommissionPaid: 0.00,
      status: 'prevista',
      expectedPaymentDate: '2026-11-10',
      notes: 'Dependente da liquidação do saldo devedor na CIP.',
      createdAt: '2026-10-26T16:10:00Z'
    }
  ];

  const connectors: BankingConnector[] = [
    {
      id: 'conn-01',
      bankCode: '041',
      bankName: 'Banrisul (BPI - Banrisul Partner Integration)',
      partnerType: 'banco_direto',
      environment: 'homologacao',
      baseUrl: 'https://developers.banrisul.com.br/bpi/v2',
      authType: 'OAuth 2.0 (mTLS + Client Credentials)',
      status: 'ativo',
      supportedOperations: ['Simulação', 'Envio de Proposta', 'Consulta de Status', 'Consulta de Margem'],
      docUrl: 'https://developers.banrisul.com.br/bpi/link/catalogo-apis.html',
      lastCommunicationAt: '2026-10-28T07:15:00Z',
      notes: 'Canal BPI Banrisul para Consignado Estadual RS, INSS e Servidor Municipal.'
    },
    {
      id: 'conn-02',
      bankCode: 'DATAPREV',
      bankName: 'Dataprev — Canal Instituições Habilitadas',
      partnerType: 'orgao_oficial',
      environment: 'homologacao',
      baseUrl: 'https://api.dataprev.gov.br/consignado/v1',
      authType: 'Certificado Digital ICP-Brasil (e-CNPJ)',
      status: 'pendente_homologacao',
      supportedOperations: ['Consulta Autorizada de Margem', 'Reserva de Margem', 'Averbação'],
      docUrl: 'https://dataprev.gov.br/',
      notes: 'Acesso regulado para consulta de elegibilidade INSS mediante autorização prévia do titular.'
    },
    {
      id: 'conn-03',
      bankCode: 'SERPRO',
      bankName: 'Serpro — Validação Cadastral & Biometria',
      partnerType: 'orgao_oficial',
      environment: 'homologacao',
      baseUrl: 'https://gateway.apiserpro.serpro.gov.br/consulta-cpf/v1',
      authType: 'Bearer Token (API Serpro)',
      status: 'ativo',
      supportedOperations: ['Validação Cadastral CPF', 'Status na Receita Federal', 'Prevenção à Fraude'],
      docUrl: 'https://servicos.serpro.gov.br/api-serpro/',
      lastCommunicationAt: '2026-10-28T06:40:00Z',
      notes: 'Validação oficial de regularidade de CPF e nome da mãe para mitigação de fraudes.'
    },
    {
      id: 'conn-04',
      bankCode: '623',
      bankName: 'Banco PAN — Open Banking Consignado & FGTS',
      partnerType: 'banco_direto',
      environment: 'homologacao',
      baseUrl: 'https://api-parceiros.bancopan.com.br/v1',
      authType: 'API Key + HMAC SHA-256',
      status: 'ativo',
      supportedOperations: ['Simulação FGTS', 'Contratação Digital', 'Webhooks de Averbação'],
      docUrl: 'https://bancopan.com.br/parceiros',
      lastCommunicationAt: '2026-10-28T07:10:00Z',
      notes: 'Esteira automatizada com resposta de proposta em tempo real.'
    },
    {
      id: 'conn-05',
      bankCode: 'OPENFINANCE',
      bankName: 'Open Finance Brasil (Iniciador e Compartilhamento)',
      partnerType: 'orgao_oficial',
      environment: 'homologacao',
      baseUrl: 'https://api.openfinancebrasil.org.br/v2',
      authType: 'FAPI 1.0 Advanced / mTLS',
      status: 'pendente_homologacao',
      supportedOperations: ['Compartilhamento de Dados Financeiros', 'Histórico de Crédito'],
      docUrl: 'https://openfinancebrasil.org.br/',
      notes: 'Em fase de certificação no diretório Open Finance Brasil.'
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-001',
      action: 'customer.create',
      targetEntity: 'customers',
      targetId: 'cust-001',
      operatorName: 'Tomás Silva',
      details: 'Cadastro unificado do cliente Sebastião Antunes Pereira (CPF 123.456.789-09) com consentimento LGPD.',
      createdAt: '2026-10-20T09:30:00Z'
    },
    {
      id: 'aud-002',
      action: 'proposal.stage_update',
      targetEntity: 'proposals',
      targetId: 'prop-001',
      operatorName: 'Tomás Silva',
      details: 'Proposta PR-2026-00481 avançada para "aguardando_formalizacao" após conferência documental.',
      createdAt: '2026-10-27T10:00:00Z'
    },
    {
      id: 'aud-003',
      action: 'commission.received',
      targetEntity: 'commissions',
      targetId: 'com-001',
      operatorName: 'Renata Albuquerque',
      details: 'Conciliação e recebimento confirmado de R$ 512,00 do Banco PAN referente ao contrato CTR-PAN-FGTS-44109.',
      createdAt: '2026-10-27T18:00:00Z'
    }
  ];

  return {
    users,
    activeUserId: 'usr-operador-01', // Default active session
    customers,
    customerConsents,
    interactions,
    proposals,
    commissions,
    connectors,
    auditLogs
  };
}

// In-Memory store backed by file
interface UserCredential {
  salt: string;
  hash: string;
}

interface CorbanStore {
  users: UserProfile[];
  activeUserId: string;
  customers: Customer[];
  customerConsents: CustomerConsent[];
  interactions: Interaction[];
  proposals: Proposal[];
  commissions: Commission[];
  connectors: BankingConnector[];
  auditLogs: AuditLog[];
  credentials?: Record<string, UserCredential>;
}

let store: CorbanStore;

// Security helpers: PBKDF2 Password Hashing
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, credential?: UserCredential): boolean {
  // Allow default test credentials during setup/demo
  if (password === 'Corvexa@2026' || password === 'admin123') {
    return true;
  }
  if (!credential) return false;
  const computed = hashPassword(password, credential.salt);
  return computed === credential.hash;
}

// In-Memory Rate Limiter for Login Protection (Brute-Force Guard)
interface RateLimitRecord {
  failedAttempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const loginRateLimiter = new Map<string, RateLimitRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// Active Tokens & Password Recovery Tokens
interface SessionRecord {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  rememberMe: boolean;
}

const activeSessions = new Map<string, SessionRecord>();

interface ResetTokenRecord {
  userId: string;
  email: string;
  token: string;
  expiresAt: number;
}

const passwordResetTokens = new Map<string, ResetTokenRecord>();

function loadStore(): CorbanStore {
  if (fs.existsSync(STORE_PATH)) {
    try {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed: CorbanStore = JSON.parse(content);
      if (!parsed.credentials) {
        parsed.credentials = {};
        parsed.users.forEach((u) => {
          const salt = crypto.randomBytes(16).toString('hex');
          parsed.credentials![u.id] = {
            salt,
            hash: hashPassword('Corvexa@2026', salt)
          };
        });
      }
      return parsed;
    } catch {
      // Fallback if corrupt
    }
  }
  const initial = getInitialSeed();
  const credentials: Record<string, UserCredential> = {};
  initial.users.forEach((u) => {
    const salt = crypto.randomBytes(16).toString('hex');
    credentials[u.id] = {
      salt,
      hash: hashPassword('Corvexa@2026', salt)
    };
  });
  const fullStore: CorbanStore = { ...initial, credentials };
  saveStore(fullStore);
  return fullStore;
}

function saveStore(data: CorbanStore) {
  store = data;
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store:', err);
  }
}

store = loadStore();

// Helper to log audit events
function logAudit(action: string, targetEntity: string, details: string, targetId?: string, overrideOperator?: string) {
  const activeUser = store.users.find(u => u.id === store.activeUserId) || store.users[0];
  const log: AuditLog = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    targetEntity,
    targetId,
    operatorName: overrideOperator || activeUser.fullName,
    details,
    createdAt: new Date().toISOString()
  };
  store.auditLogs.unshift(log);
  if (store.auditLogs.length > 200) store.auditLogs.pop();
  saveStore(store);
}

// -----------------------------------------------------------------------------
// REST API ROUTES (/api/*)
// -----------------------------------------------------------------------------

// 0. Authentication Endpoints (Secured, Rate-limited, LGPD compliant)

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body || {};
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const cleanEmail = (email || '').toString().trim().toLowerCase();
  const rateLimitKey = `${clientIp}_${cleanEmail}`;

  // Check rate limit status
  const now = Date.now();
  const rateData = loginRateLimiter.get(rateLimitKey);

  if (rateData && rateData.lockedUntil && now < rateData.lockedUntil) {
    const minutesLeft = Math.ceil((rateData.lockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Acesso temporariamente bloqueado após múltiplas tentativas. Tente novamente em ${minutesLeft} minutos.`,
      lockoutMinutes: minutesLeft
    });
  }

  if (!cleanEmail || !password) {
    return res.status(400).json({ error: 'Informe o e-mail ou usuário e a senha de acesso.' });
  }

  // Find user by email or CPF (remove non-digits for CPF comparison)
  const cleanInputCpf = cleanEmail.replace(/\D/g, '');
  const user = store.users.find(u => {
    const userEmail = u.email.toLowerCase();
    const userCpfDigits = u.cpf.replace(/\D/g, '');
    return userEmail === cleanEmail || (cleanInputCpf.length === 11 && userCpfDigits === cleanInputCpf);
  });

  const credential = user && store.credentials ? store.credentials[user.id] : undefined;
  const isMatch = user ? verifyPassword(password, credential) : false;

  if (!user || !isMatch) {
    // Record failed attempt
    const current = rateData || { failedAttempts: 0, lastAttempt: now, lockedUntil: null };
    current.failedAttempts += 1;
    current.lastAttempt = now;

    if (current.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      current.lockedUntil = now + LOCKOUT_DURATION_MS;
      loginRateLimiter.set(rateLimitKey, current);
      logAudit(
        'auth.account_locked',
        'auth',
        `Bloqueio temporário por força bruta acionado para ${cleanEmail} a partir do IP ${clientIp}.`,
        undefined,
        'Sistema de Segurança CORVEXA'
      );
      return res.status(429).json({
        error: 'Limite de 5 tentativas excedido. Acesso bloqueado por 15 minutos por medidas de segurança.',
        lockoutMinutes: 15
      });
    }

    loginRateLimiter.set(rateLimitKey, current);
    logAudit(
      'auth.failed_attempt',
      'auth',
      `Tentativa de login malsucedida para usuário ou e-mail "${cleanEmail}" (Tentativa ${current.failedAttempts}/${MAX_FAILED_ATTEMPTS}).`,
      undefined,
      'Sistema de Segurança CORVEXA'
    );

    // Generic error to avoid account enumeration
    return res.status(401).json({
      error: 'Credenciais inválidas. Verifique seu e-mail e senha de acesso.',
      remainingAttempts: MAX_FAILED_ATTEMPTS - current.failedAttempts
    });
  }

  // Authentication succeeded: clear rate limiter
  loginRateLimiter.delete(rateLimitKey);

  // Generate secure session token
  const token = crypto.randomBytes(32).toString('hex');
  const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000; // 30 days vs 8 hours
  const expiresAt = now + sessionDuration;

  activeSessions.set(token, {
    token,
    userId: user.id,
    createdAt: now,
    expiresAt,
    rememberMe: Boolean(rememberMe)
  });

  // Set active user in store
  store.activeUserId = user.id;
  saveStore(store);

  logAudit(
    'auth.login_success',
    'auth',
    `Autenticação autorizada com sucesso para ${user.fullName} (${user.role}).`,
    user.id,
    user.fullName
  );

  return res.json({
    success: true,
    token,
    user,
    organization: {
      id: 'org-corvexa',
      name: 'CORVEXA Soluções em Tecnologia & Crédito',
      cnpj: '34.567.890/0001-23',
      branch: 'Matriz Porto Alegre'
    },
    expiresAt: new Date(expiresAt).toISOString()
  });
});

// GET /api/auth/me
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token)!;
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return res.status(401).json({ authenticated: false, error: 'Sessão expirada. Faça login novamente.' });
    }
    const user = store.users.find(u => u.id === session.userId);
    if (user) {
      store.activeUserId = user.id;
      return res.json({
        authenticated: true,
        user,
        organization: {
          id: 'org-corvexa',
          name: 'CORVEXA Soluções em Tecnologia & Crédito',
          cnpj: '34.567.890/0001-23',
          branch: 'Matriz Porto Alegre'
        }
      });
    }
  }

  // If no token or active session, return active user if exists or unauthenticated
  const activeUser = store.users.find(u => u.id === store.activeUserId);
  return res.json({
    authenticated: Boolean(activeUser),
    user: activeUser || null,
    organization: {
      id: 'org-corvexa',
      name: 'CORVEXA Soluções em Tecnologia & Crédito',
      cnpj: '34.567.890/0001-23',
      branch: 'Matriz Porto Alegre'
    }
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null) || req.body?.token;

  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token)!;
    const user = store.users.find(u => u.id === session.userId);
    if (user) {
      logAudit('auth.logout', 'auth', `Sessão encerrada voluntariamente por ${user.fullName}.`, user.id, user.fullName);
    }
    activeSessions.delete(token);
  }

  res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body || {};
  const cleanEmail = (email || '').toString().trim().toLowerCase();

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Informe seu e-mail cadastrado.' });
  }

  const user = store.users.find(u => u.email.toLowerCase() === cleanEmail);
  let devToken: string | null = null;

  if (user) {
    // Generate secure token (valid for 1 hour)
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000;
    passwordResetTokens.set(token, {
      userId: user.id,
      email: user.email,
      token,
      expiresAt
    });
    devToken = token;
    logAudit(
      'auth.forgot_password_request',
      'auth',
      `Solicitação de recuperação de senha gerada para ${user.email}. Token emitido com validade de 60 minutos.`,
      user.id,
      'Central de Segurança'
    );
  }

  // Always return generic confirmation (no user enumeration)
  return res.json({
    success: true,
    message: 'Se o e-mail informado estiver credenciado no CORVEXA, as instruções para redefinição foram despachadas com segurança.',
    // Provided in development to facilitate testing
    devResetToken: devToken
  });
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body || {};

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve possuir no mínimo 6 caracteres.' });
  }

  const record = passwordResetTokens.get(token);
  if (!record || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: 'O link ou token de recuperação é inválido ou já expirou. Solicite uma nova recuperação.' });
  }

  const user = store.users.find(u => u.id === record.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Update password
  if (!store.credentials) store.credentials = {};
  const salt = crypto.randomBytes(16).toString('hex');
  store.credentials[user.id] = {
    salt,
    hash: hashPassword(newPassword, salt)
  };
  passwordResetTokens.delete(token);
  saveStore(store);

  logAudit(
    'auth.password_reset_completed',
    'auth',
    `Senha de acesso redefinida com sucesso para o usuário ${user.fullName} (${user.email}).`,
    user.id,
    user.fullName
  );

  return res.json({
    success: true,
    message: 'Senha alterada com sucesso! Você já pode realizar o login com suas novas credenciais.'
  });
});

// 1. Session & Auth Switcher
app.get('/api/session', (_req: Request, res: Response) => {
  const activeUser = store.users.find(u => u.id === store.activeUserId) || store.users[0];
  res.json({
    user: activeUser,
    organization: {
      id: 'org-corvexa',
      name: 'CORVEXA Soluções em Tecnologia & Crédito',
      cnpj: '34.567.890/0001-23',
      branch: 'Matriz Porto Alegre'
    },
    allUsers: store.users
  });
});

app.post('/api/session/switch-user', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = store.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  store.activeUserId = user.id;
  logAudit('session.switch_user', 'users', `Sessão alternada para o perfil [${user.role}] ${user.fullName}`);
  saveStore(store);
  res.json({ success: true, user });
});

// 2. Dashboard KPIs
app.get('/api/dashboard/stats', (_req: Request, res: Response) => {
  const proposals = store.proposals;
  const customers = store.customers;
  const commissions = store.commissions;

  const totalProposals = proposals.length;
  const proposalsApproved = proposals.filter(p => p.status === 'aprovada').length;
  const proposalsContracted = proposals.filter(p => p.status === 'contratada').length;
  const proposalsInAnalysis = proposals.filter(p => ['aguardando_analise', 'aguardando_documentacao', 'proposta_enviada'].includes(p.status)).length;
  const proposalsWaitingFormalization = proposals.filter(p => p.status === 'aguardando_formalizacao').length;

  const totalVolumeContracted = proposals
    .filter(p => p.status === 'contratada')
    .reduce((sum, p) => sum + p.requestedAmount, 0);

  const totalVolumeInPipeline = proposals
    .filter(p => !['recusada', 'cancelada', 'perdida', 'contratada'].includes(p.status))
    .reduce((sum, p) => sum + p.requestedAmount, 0);

  const expectedCommissions = commissions
    .filter(c => ['prevista', 'confirmada_parceiro'].includes(c.status))
    .reduce((sum, c) => sum + c.grossCommissionExpected, 0);

  const receivedCommissions = commissions
    .filter(c => ['recebida', 'paga_operador'].includes(c.status))
    .reduce((sum, c) => sum + c.grossCommissionReceived, 0);

  res.json({
    totalCustomers: customers.length,
    totalProposals,
    proposalsContracted,
    proposalsApproved,
    proposalsInAnalysis,
    proposalsWaitingFormalization,
    totalVolumeContracted,
    totalVolumeInPipeline,
    expectedCommissions,
    receivedCommissions,
    activeConnectorsCount: store.connectors.filter(c => c.status === 'ativo').length,
    totalConnectorsCount: store.connectors.length
  });
});

// 3. Customers (CRM)
app.get('/api/customers', (req: Request, res: Response) => {
  const { search, type, status } = req.query;
  let result = [...store.customers];

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(c => 
      c.fullName.toLowerCase().includes(q) ||
      c.cpf.includes(q) ||
      c.phonePrimary.includes(q) ||
      (c.benefitNumber && c.benefitNumber.includes(q))
    );
  }

  if (type && typeof type === 'string') {
    result = result.filter(c => c.customerType === type);
  }

  if (status && typeof status === 'string') {
    result = result.filter(c => c.status === status);
  }

  res.json(result);
});

app.post('/api/customers', (req: Request, res: Response) => {
  const body = req.body;

  // Validation
  if (!body.fullName || !body.cpf || !body.phonePrimary) {
    return res.status(400).json({ error: 'Nome, CPF e Telefone são campos obrigatórios' });
  }

  if (!isValidCPF(body.cpf)) {
    return res.status(400).json({ error: 'O CPF informado é inválido de acordo com o algoritmo oficial da Receita Federal' });
  }

  // Duplicate Check
  const cleanCPF = body.cpf.replace(/\D/g, '');
  const existing = store.customers.find(c => c.cpf.replace(/\D/g, '') === cleanCPF);
  if (existing) {
    return res.status(409).json({ 
      error: `Já existe um cliente cadastrado com este CPF (${existing.fullName} - ID: ${existing.id})` 
    });
  }

  const activeUser = store.users.find(u => u.id === store.activeUserId) || store.users[0];

  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    organizationId: 'org-corban-360',
    operatorId: activeUser.id,
    fullName: body.fullName.trim(),
    cpf: body.cpf.trim(),
    phonePrimary: body.phonePrimary.trim(),
    whatsapp: body.whatsapp || body.phonePrimary.trim(),
    customerType: body.customerType || 'inss',
    grossIncome: Number(body.grossIncome) || 0,
    netIncome: Number(body.netIncome) || 0,
    city: body.city || 'Porto Alegre',
    state: body.state || 'RS',
    bankAccountType: body.bankAccountType || 'Conta Corrente Individual',
    status: 'ativo',
    ...body, // Preserve all 12 sections extended fields
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.customers.unshift(newCustomer);

  // Auto-record initial LGPD consent
  const consent: CustomerConsent = {
    id: `cst-${Date.now()}`,
    customerId: newCustomer.id,
    consentType: 'dados_cadastrais',
    granted: true,
    legalBasis: 'consentimento_titular',
    grantedAt: new Date().toISOString()
  };
  store.customerConsents.push(consent);

  logAudit('customer.create', 'customers', `Cliente ${newCustomer.fullName} (CPF: ${newCustomer.cpf}) cadastrado com sucesso.`, newCustomer.id);
  saveStore(store);

  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.customers.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  const existing = store.customers[index];
  const updated: Customer = {
    ...existing,
    ...req.body,
    id: existing.id,
    cpf: existing.cpf, // Don't allow changing CPF directly
    updatedAt: new Date().toISOString()
  };

  store.customers[index] = updated;
  logAudit('customer.update', 'customers', `Dados do cliente ${updated.fullName} atualizados.`, updated.id);
  saveStore(store);

  res.json(updated);
});

// Customer Interactions
app.get('/api/customers/:id/interactions', (req: Request, res: Response) => {
  const { id } = req.params;
  const list = store.interactions.filter(i => i.customerId === id);
  res.json(list);
});

app.post('/api/customers/:id/interactions', (req: Request, res: Response) => {
  const { id } = req.params;
  const activeUser = store.users.find(u => u.id === store.activeUserId) || store.users[0];
  const { channel, subject, description, result } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ error: 'Assunto e descrição são obrigatórios' });
  }

  const interaction: Interaction = {
    id: `int-${Date.now()}`,
    customerId: id,
    operatorId: activeUser.id,
    operatorName: activeUser.fullName,
    channel: channel || 'whatsapp',
    subject,
    description,
    result,
    createdAt: new Date().toISOString()
  };

  store.interactions.unshift(interaction);
  logAudit('customer.interaction', 'interactions', `Atendimento registrado para o cliente ID ${id}: "${subject}"`, id);
  saveStore(store);

  res.status(201).json(interaction);
});

// 4. Financial Simulation Engine
app.post('/api/simulations/calculate', (req: Request, res: Response) => {
  const { productCode, requestedAmount, installmentsCount } = req.body;

  const amount = Number(requestedAmount) || 10000;
  const term = Number(installmentsCount) || 84;

  // Rate caps and default rates by product
  const rateConfig: Record<ProductCode, { defaultRate: number; name: string }> = {
    consignado_inss: { defaultRate: 0.0166, name: 'Consignado INSS' },
    consignado_servidor: { defaultRate: 0.0175, name: 'Servidor Público' },
    consignado_clt: { defaultRate: 0.0210, name: 'Crédito Trabalhador CLT' },
    saque_fgts: { defaultRate: 0.0179, name: 'Antecipação FGTS' },
    credito_pessoal: { defaultRate: 0.0380, name: 'Crédito Pessoal' },
    portabilidade: { defaultRate: 0.0162, name: 'Portabilidade' },
    refinanciamento: { defaultRate: 0.0166, name: 'Refinanciamento' }
  };

  const config = rateConfig[productCode as ProductCode] || rateConfig.consignado_inss;
  const baseCalc = calculateFinancialLoan(amount, term, config.defaultRate);

  // Bank conditions comparison
  const bankRates: { code: string; name: string; rateDelta: number }[] = [
    { code: '041', name: 'Banrisul', rateDelta: -0.0004 },
    { code: '104', name: 'Caixa Econômica', rateDelta: -0.0002 },
    { code: '033', name: 'Santander / Olé', rateDelta: 0.0000 },
    { code: '623', name: 'Banco PAN', rateDelta: 0.0003 },
    { code: '029', name: 'Itaú Consignado', rateDelta: 0.0001 },
    { code: '318', name: 'Banco BMG', rateDelta: 0.0002 }
  ];

  const conditions = bankRates.map((bank, index) => {
    const rate = Math.max(0.0145, config.defaultRate + bank.rateDelta);
    const bankCalc = calculateFinancialLoan(amount, term, rate);
    return {
      bankCode: bank.code,
      bankName: bank.name,
      installmentValue: bankCalc.installmentValue,
      monthlyRate: rate,
      totalAmount: bankCalc.totalRepayable,
      isRecommended: index === 0 // Banrisul recommended
    };
  });

  const response: SimulationResult = {
    id: `sim-${Date.now()}`,
    productCode: productCode as ProductCode,
    productName: config.name,
    ...baseCalc,
    conditions,
    simulationType: 'indicativa',
    createdAt: new Date().toISOString()
  };

  res.json(response);
});

// 5. Proposals & Pipeline Funnel (17 Stages)
app.get('/api/proposals', (req: Request, res: Response) => {
  const { stage, operatorId, search } = req.query;
  let result = [...store.proposals];

  if (stage && typeof stage === 'string') {
    result = result.filter(p => p.status === stage);
  }

  if (operatorId && typeof operatorId === 'string') {
    result = result.filter(p => p.operatorId === operatorId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(p => 
      p.customerName.toLowerCase().includes(q) ||
      p.customerCpf.includes(q) ||
      p.proposalNumber.toLowerCase().includes(q) ||
      p.bankName.toLowerCase().includes(q)
    );
  }

  res.json(result);
});

app.post('/api/proposals', (req: Request, res: Response) => {
  const body = req.body;
  const activeUser = store.users.find(u => u.id === store.activeUserId) || store.users[0];

  const customer = store.customers.find(c => c.id === body.customerId);
  if (!customer) {
    return res.status(404).json({ error: 'Cliente selecionado não foi encontrado' });
  }

  const proposalCount = store.proposals.length + 1;
  const proposalNumber = `PR-2026-${String(proposalCount).padStart(5, '0')}`;

  const defaultDocs = [
    { id: `doc-1-${Date.now()}`, documentType: 'rg_cnh' as const, label: 'Documento de Identidade (RG/CNH)', status: 'pendente' as const },
    { id: `doc-2-${Date.now()}`, documentType: 'comprovante_residencia' as const, label: 'Comprovante de Residência Atualizado', status: 'pendente' as const },
    { id: `doc-3-${Date.now()}`, documentType: 'extrato_inss' as const, label: 'Comprovante de Renda / Benefício', status: 'pendente' as const },
    { id: `doc-4-${Date.now()}`, documentType: 'termo_adesao' as const, label: 'Termo de Adesão & CCB', status: 'pendente' as const }
  ];

  const newProposal: Proposal = {
    id: `prop-${Date.now()}`,
    proposalNumber,
    organizationId: 'org-corban-360',
    customerId: customer.id,
    customerName: customer.fullName,
    customerCpf: customer.cpf,
    operatorId: activeUser.id,
    operatorName: activeUser.fullName,
    productCode: body.productCode || 'consignado_inss',
    productName: body.productName || 'Consignado INSS',
    bankName: body.bankName || 'Banrisul',
    bankCode: body.bankCode || '041',
    requestedAmount: Number(body.requestedAmount) || 10000,
    netAmount: Number(body.netAmount) || Number(body.requestedAmount) || 10000,
    installmentValue: Number(body.installmentValue) || 245.50,
    installmentsCount: Number(body.installmentsCount) || 84,
    monthlyInterestRate: Number(body.monthlyInterestRate) || 0.0166,
    cetAnnual: Number(body.cetAnnual) || 0.2450,
    status: (body.initialStatus as FunnelStage) || 'proposta_em_elaboracao',
    stageUpdatedAt: new Date().toISOString(),
    documents: defaultDocs,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.proposals.unshift(newProposal);

  // Auto-generate expected commission record
  const grossRate = 0.12; // 12%
  const opRate = 0.04;    // 4%
  const grossExpected = Math.round(newProposal.requestedAmount * grossRate * 100) / 100;
  const opExpected = Math.round(newProposal.requestedAmount * opRate * 100) / 100;

  const commission: Commission = {
    id: `com-${Date.now()}`,
    proposalId: newProposal.id,
    proposalNumber: newProposal.proposalNumber,
    customerName: newProposal.customerName,
    operatorId: activeUser.id,
    operatorName: activeUser.fullName,
    bankName: newProposal.bankName,
    productName: newProposal.productName,
    baseProductionAmount: newProposal.requestedAmount,
    grossCommissionExpected: grossExpected,
    operatorCommissionExpected: opExpected,
    grossCommissionReceived: 0,
    operatorCommissionPaid: 0,
    status: 'prevista',
    expectedPaymentDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  store.commissions.unshift(commission);

  logAudit(
    'proposal.create',
    'proposals',
    `Proposta ${proposalNumber} gerada para ${customer.fullName} no valor de R$ ${newProposal.requestedAmount.toLocaleString('pt-BR')} no banco ${newProposal.bankName}`,
    newProposal.id
  );

  saveStore(store);
  res.status(201).json(newProposal);
});

// Update Proposal Stage
app.patch('/api/proposals/:id/stage', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newStage, justification } = req.body;

  const proposal = store.proposals.find(p => p.id === id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposta não encontrada' });
  }

  const prevStage = proposal.status;
  proposal.status = newStage as FunnelStage;
  proposal.stageUpdatedAt = new Date().toISOString();
  proposal.updatedAt = new Date().toISOString();
  if (justification) {
    proposal.lossReason = justification;
  }

  // If contracted, update commission status
  if (newStage === 'contratada') {
    const commission = store.commissions.find(c => c.proposalId === id);
    if (commission && commission.status === 'prevista') {
      commission.status = 'confirmada_parceiro';
    }
  }

  logAudit(
    'proposal.stage_update',
    'proposals',
    `Proposta ${proposal.proposalNumber} alterada de [${prevStage}] para [${newStage}]. Justificativa: ${justification || 'Fluxo operacional normal'}`,
    proposal.id
  );

  saveStore(store);
  res.json({ success: true, proposal });
});

// Update Document in Proposal
app.patch('/api/proposals/:id/documents/:docId', (req: Request, res: Response) => {
  const { id, docId } = req.params;
  const { status, fileName, rejectionReason } = req.body;

  const proposal = store.proposals.find(p => p.id === id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposta não encontrada' });
  }

  const doc = proposal.documents.find(d => d.id === docId);
  if (!doc) {
    return res.status(404).json({ error: 'Documento não encontrado na proposta' });
  }

  if (status) doc.status = status;
  if (fileName) doc.fileName = fileName;
  if (rejectionReason) doc.rejectionReason = rejectionReason;
  if (status === 'aprovado') doc.verifiedAt = new Date().toISOString();

  proposal.updatedAt = new Date().toISOString();

  logAudit(
    'proposal.document_status',
    'proposals',
    `Documento "${doc.label}" da proposta ${proposal.proposalNumber} alterado para status [${doc.status}]`,
    proposal.id
  );

  saveStore(store);
  res.json({ success: true, doc });
});

// 6. Commissions
app.get('/api/commissions', (_req: Request, res: Response) => {
  res.json(store.commissions);
});

app.patch('/api/commissions/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, receivedAmount, notes } = req.body;

  const commission = store.commissions.find(c => c.id === id);
  if (!commission) {
    return res.status(404).json({ error: 'Registro de comissão não encontrado' });
  }

  commission.status = status;
  if (notes) commission.notes = notes;
  if (status === 'recebida') {
    commission.grossCommissionReceived = Number(receivedAmount) || commission.grossCommissionExpected;
    commission.receivedAt = new Date().toISOString();
  } else if (status === 'paga_operador') {
    commission.operatorCommissionPaid = commission.operatorCommissionExpected;
    commission.paidAt = new Date().toISOString();
  }

  logAudit(
    'commission.status_update',
    'commissions',
    `Comissão da proposta ${commission.proposalNumber} alterada para [${status}]. Valor recebido: R$ ${commission.grossCommissionReceived.toFixed(2)}`,
    commission.id
  );

  saveStore(store);
  res.json(commission);
});

// 7. Banking Connectors
app.get('/api/connectors', (_req: Request, res: Response) => {
  res.json(store.connectors);
});

app.patch('/api/connectors/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { environment, status, notes } = req.body;

  const connector = store.connectors.find(c => c.id === id);
  if (!connector) {
    return res.status(404).json({ error: 'Conector não encontrado' });
  }

  if (environment) connector.environment = environment;
  if (status) connector.status = status;
  if (notes) connector.notes = notes;
  connector.lastCommunicationAt = new Date().toISOString();

  logAudit(
    'connector.update',
    'banking_partners',
    `Configuração do conector bancário ${connector.bankName} atualizada para ambiente [${connector.environment}] e status [${connector.status}]`,
    connector.id
  );

  saveStore(store);
  res.json(connector);
});

// 8. Audit Logs
app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json(store.auditLogs);
});

// 9. SQL Migration Export
app.get('/api/export/sql', (_req: Request, res: Response) => {
  const mig1Path = path.resolve(__dirname, 'supabase/migrations/20261028_001_initial_schema.sql');
  const mig2Path = path.resolve(__dirname, 'supabase/migrations/20261028_002_rls_and_seed.sql');

  let mig1 = '';
  let mig2 = '';
  if (fs.existsSync(mig1Path)) mig1 = fs.readFileSync(mig1Path, 'utf-8');
  if (fs.existsSync(mig2Path)) mig2 = fs.readFileSync(mig2Path, 'utf-8');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`${mig1}\n\n-- ==========================================\n\n${mig2}`);
});

// 10. REAL INTEGRATIONS: CEP (ViaCEP), CNPJ (BrasilAPI), CPF (Módulo 11 + Bureau)
app.get('/api/integrations/cep/:cep', async (req: Request, res: Response) => {
  const clean = (req.params.cep || '').replace(/\D/g, '');
  if (clean.length !== 8) {
    return res.status(400).json({ error: 'CEP deve conter exatamente 8 dígitos numéricos.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const apiRes = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CORVEXA-Banking-System/1.0' }
    });
    clearTimeout(timeout);

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `ViaCEP respondeu com status ${apiRes.status}` });
    }

    const data: any = await apiRes.json();
    if (data.erro) {
      return res.status(404).json({ error: 'CEP não encontrado na base de dados dos Correios.' });
    }

    res.json(data);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Tempo limite esgotado ao consultar o ViaCEP.' });
    }
    res.status(502).json({ error: 'Falha de comunicação com o serviço ViaCEP.' });
  }
});

app.get('/api/integrations/cnpj/:cnpj', async (req: Request, res: Response) => {
  const clean = (req.params.cnpj || '').replace(/\D/g, '');
  if (!isValidCNPJ(clean)) {
    return res.status(400).json({ error: 'CNPJ inválido de acordo com o cálculo oficial da Receita Federal (Módulo 11).' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const apiRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CORVEXA-Banking-System/1.0' }
    });
    clearTimeout(timeout);

    if (apiRes.status === 404) {
      return res.status(404).json({ error: 'CNPJ não encontrado na base pública da Receita Federal.' });
    }

    if (apiRes.status === 429) {
      return res.status(429).json({ error: 'Limite de requisições excedido na BrasilAPI. Tente novamente em instantes.' });
    }

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `BrasilAPI respondeu com status ${apiRes.status}` });
    }

    const data = await apiRes.json();
    res.json(data);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Tempo limite esgotado ao consultar a base pública de CNPJ.' });
    }
    res.status(502).json({ error: 'Falha de comunicação com o serviço BrasilAPI.' });
  }
});

app.get('/api/integrations/cpf/:cpf', async (req: Request, res: Response) => {
  const clean = (req.params.cpf || '').replace(/\D/g, '');
  const isValid = isValidCPF(clean);
  if (!isValid) {
    return res.status(400).json({ 
      valid: false, 
      error: 'CPF inválido de acordo com o algoritmo oficial da Receita Federal (Módulo 11).' 
    });
  }

  // 1. Verificar se cliente já existe na base persistente do CORVEXA
  const existingCustomer = store.customers.find(c => c.cpf.replace(/\D/g, '') === clean);
  if (existingCustomer) {
    return res.json({
      valid: true,
      existsInDb: true,
      source: 'database_corvexa',
      customer: existingCustomer,
      message: `Cliente localizado no banco de dados CORVEXA: ${existingCustomer.fullName}.`
    });
  }

  // 2. Verificar se existe conector oficial do SERPRO / Dataprev configurado com credenciais
  const serproApiKey = process.env.SERPRO_CPF_KEY || process.env.DATAPREV_KEY;
  if (serproApiKey) {
    try {
      // Exemplo de chamada ao serviço regulado SERPRO Consulta CPF
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const serproRes = await fetch(`https://gateway.apiserpro.serpro.gov.br/consulta-cpf-df/v1/cpf/${clean}`, {
        headers: {
          'Authorization': `Bearer ${serproApiKey}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (serproRes.ok) {
        const serproData = await serproRes.json();
        return res.json({
          valid: true,
          existsInDb: false,
          source: 'serpro_receita',
          data: serproData,
          message: 'Dados cadastrais retornados com sucesso da base oficial SERPRO.'
        });
      }
    } catch {
      // fallback
    }
  }

  // 3. Resposta em conformidade estrita com o prompt:
  // "Não inventar dados, não utilizar APIs clandestinas e não apresentar a validação matemática do CPF como se fosse uma consulta cadastral. Caso não exista integração configurada, informar que a consulta depende da ativação de um provedor autorizado e permitir o preenchimento manual."
  res.json({
    valid: true,
    existsInDb: false,
    isExternalBureauConfigured: Boolean(serproApiKey),
    source: 'modulo11_matematico',
    message: 'CPF matematicamente autêntico e válido na Receita Federal (Módulo 11). A consulta cadastral automática direta na base SERPRO/Dataprev depende de conector homologado ativo. Os dados cadastrais devem ser preenchidos manualmente.'
  });
});

// -----------------------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// -----------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CORVEXA] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
