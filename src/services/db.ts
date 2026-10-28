/**
 * CORVEXA — Camada de dados (Supabase)
 *
 * Substitui a antiga API Express (/api/*). As regras sensíveis — organização,
 * operador responsável, número da proposta, comissão prevista e trilha de
 * auditoria — são aplicadas no banco por triggers e Row Level Security
 * (supabase/migrations). O navegador não consegue forjá-las.
 */
import { supabase } from '../lib/supabase';
import {
  AuditLog,
  BankingConnector,
  Commission,
  Customer,
  FunnelStage,
  Interaction,
  Proposal,
  ProposalDocument,
  ProductCode,
  UserProfile
} from '../types/corban';

export class DbError extends Error {}

function fail(error: { code?: string; message: string } | null, fallback: string): never {
  if (error?.code === '23505') throw new DbError('Já existe um cliente cadastrado com este CPF nesta organização.');
  if (error?.code === '42501' || /row-level security/i.test(error?.message || '')) {
    throw new DbError('Seu perfil não tem permissão para esta operação.');
  }
  throw new DbError(error?.message ? `${fallback}: ${error.message}` : fallback);
}

const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');

/** Remove do objeto os campos que vivem em colunas próprias. */
function stripKeys<T extends object>(obj: T, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  keys.forEach((k) => delete out[k]);
  return out;
}

// -----------------------------------------------------------------------------
// Sessão / perfil
// -----------------------------------------------------------------------------

export interface SessionProfile {
  user: UserProfile;
  active: boolean;
  organizationName: string | null;
}

export async function getSessionProfile(): Promise<SessionProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, organization_id, role, active, full_name, email, cpf, phone, organizations(name)')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (error) fail(error, 'Erro ao carregar o perfil');
  if (!data) return null;

  const org = (data as any).organizations;
  return {
    active: Boolean(data.active && data.organization_id),
    organizationName: (Array.isArray(org) ? org[0]?.name : org?.name) ?? null,
    user: {
      id: data.id,
      organizationId: data.organization_id ?? '',
      role: data.role,
      email: data.email || auth.user.email || '',
      fullName: data.full_name || auth.user.email || 'Usuário',
      cpf: data.cpf || '',
      phone: data.phone || undefined
    }
  };
}

export async function logAuthEvent(action: 'auth.login_success' | 'auth.logout' | 'auth.password_reset_completed') {
  try {
    await supabase.rpc('log_auth_event', { p_action: action });
  } catch {
    /* auditoria de sessão é best-effort */
  }
}

// -----------------------------------------------------------------------------
// Clientes
// -----------------------------------------------------------------------------

const CUSTOMER_COLUMN_KEYS = ['id', 'organizationId', 'operatorId', 'createdAt', 'updatedAt'];

function rowToCustomer(row: any): Customer {
  return {
    ...(row.data || {}),
    id: row.id,
    organizationId: row.organization_id,
    operatorId: row.operator_id,
    fullName: row.full_name,
    cpf: row.data?.cpf || row.cpf_digits,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  } as Customer;
}

export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (error) fail(error, 'Erro ao carregar clientes');
  return (data || []).map(rowToCustomer);
}

export async function findCustomerByCpf(cpf: string): Promise<Customer | null> {
  const { data, error } = await supabase.from('customers').select('*').eq('cpf_digits', onlyDigits(cpf)).maybeSingle();
  if (error) fail(error, 'Erro ao consultar CPF');
  return data ? rowToCustomer(data) : null;
}

export async function createCustomer(input: Partial<Customer>): Promise<Customer> {
  if (!input.fullName?.trim() || !input.cpf || !input.phonePrimary?.trim()) {
    throw new DbError('Nome, CPF e Telefone são campos obrigatórios.');
  }
  const payload = {
    whatsapp: input.whatsapp || input.phonePrimary,
    customerType: input.customerType || 'inss',
    grossIncome: Number(input.grossIncome) || 0,
    netIncome: Number(input.netIncome) || 0,
    ...stripKeys(input, CUSTOMER_COLUMN_KEYS),
    fullName: input.fullName.trim(),
    cpf: input.cpf.trim(),
    phonePrimary: input.phonePrimary.trim()
  };
  const { data, error } = await supabase
    .from('customers')
    .insert({
      full_name: payload.fullName,
      cpf_digits: onlyDigits(payload.cpf),
      status: input.status || 'ativo',
      data: payload
    })
    .select('*')
    .single();
  if (error) fail(error, 'Erro ao cadastrar cliente');
  return rowToCustomer(data);
}

export async function updateCustomer(id: string, changes: Partial<Customer>): Promise<Customer> {
  const { data: current, error: readError } = await supabase.from('customers').select('*').eq('id', id).single();
  if (readError) fail(readError, 'Cliente não encontrado');

  const merged = { ...(current.data || {}), ...stripKeys(changes, CUSTOMER_COLUMN_KEYS), cpf: current.data?.cpf };
  const { data, error } = await supabase
    .from('customers')
    .update({
      full_name: (changes.fullName || current.full_name).trim(),
      status: changes.status || current.status,
      data: merged
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) fail(error, 'Erro ao atualizar cliente');
  return rowToCustomer(data);
}

// -----------------------------------------------------------------------------
// Atendimentos
// -----------------------------------------------------------------------------

export async function listInteractions(customerId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) fail(error, 'Erro ao carregar atendimentos');
  return (data || []).map((r: any) => ({
    id: r.id,
    customerId: r.customer_id,
    operatorId: r.operator_id,
    operatorName: r.operator_name,
    channel: r.channel,
    subject: r.subject,
    description: r.description,
    result: r.result || undefined,
    createdAt: r.created_at
  }));
}

export async function addInteraction(
  customerId: string,
  input: { channel: string; subject: string; description: string; result?: string }
): Promise<void> {
  if (!input.subject?.trim() || !input.description?.trim()) {
    throw new DbError('Assunto e descrição são obrigatórios.');
  }
  const { error } = await supabase.from('interactions').insert({
    customer_id: customerId,
    channel: input.channel || 'whatsapp',
    subject: input.subject.trim(),
    description: input.description.trim(),
    result: input.result || null
  });
  if (error) fail(error, 'Erro ao registrar atendimento');
}

// -----------------------------------------------------------------------------
// Propostas
// -----------------------------------------------------------------------------

function rowToProposal(row: any): Proposal {
  return {
    ...(row.data || {}),
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    operatorId: row.operator_id,
    proposalNumber: row.proposal_number,
    status: row.status,
    documents: row.data?.documents || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  } as Proposal;
}

export async function listProposals(): Promise<Proposal[]> {
  const { data, error } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
  if (error) fail(error, 'Erro ao carregar propostas');
  return (data || []).map(rowToProposal);
}

export interface NewProposalInput {
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
}

function defaultDocuments(customerType?: Customer['customerType']): ProposalDocument[] {
  const incomeDoc: ProposalDocument =
    customerType === 'inss'
      ? { id: crypto.randomUUID(), documentType: 'extrato_inss', label: 'Extrato de Benefício INSS', status: 'pendente' }
      : { id: crypto.randomUUID(), documentType: 'holerite', label: 'Comprovante de Renda / Holerite', status: 'pendente' };
  return [
    { id: crypto.randomUUID(), documentType: 'rg_cnh', label: 'Documento de Identidade (RG/CNH)', status: 'pendente' },
    { id: crypto.randomUUID(), documentType: 'comprovante_residencia', label: 'Comprovante de Residência Atualizado', status: 'pendente' },
    incomeDoc,
    { id: crypto.randomUUID(), documentType: 'termo_adesao', label: 'Termo de Adesão & CCB', status: 'pendente' }
  ];
}

export async function createProposal(input: NewProposalInput, customerType?: Customer['customerType']): Promise<Proposal> {
  const { customerId, ...rest } = input;
  const { data, error } = await supabase
    .from('proposals')
    .insert({
      customer_id: customerId,
      proposal_number: 'GERADO-PELO-BANCO', // substituído pelo trigger
      status: 'proposta_em_elaboracao',
      data: { ...rest, documents: defaultDocuments(customerType) }
    })
    .select('*')
    .single();
  if (error) fail(error, 'Erro ao gerar proposta');
  return rowToProposal(data);
}

async function readProposalRow(id: string) {
  const { data, error } = await supabase.from('proposals').select('*').eq('id', id).single();
  if (error) fail(error, 'Proposta não encontrada');
  return data;
}

export async function updateProposalStage(id: string, newStage: FunnelStage, justification: string): Promise<void> {
  const row = await readProposalRow(id);
  const nextData = { ...(row.data || {}), lastJustification: justification || '' };
  if (justification) nextData.lossReason = justification;
  const { data, error } = await supabase
    .from('proposals')
    .update({ status: newStage, data: nextData })
    .eq('id', id)
    .select('id');
  if (error) fail(error, 'Erro ao atualizar etapa');
  if (!data?.length) throw new DbError('Seu perfil não tem permissão para alterar esta proposta.');
}

export async function updateProposalDocument(
  id: string,
  docId: string,
  status: ProposalDocument['status'],
  rejectionReason?: string
): Promise<void> {
  const row = await readProposalRow(id);
  const documents: ProposalDocument[] = (row.data?.documents || []).map((d: ProposalDocument) =>
    d.id !== docId
      ? d
      : {
          ...d,
          status,
          rejectionReason: status === 'rejeitado' ? rejectionReason || d.rejectionReason : undefined,
          verifiedAt: status === 'aprovado' ? new Date().toISOString() : d.verifiedAt
        }
  );
  const { data, error } = await supabase
    .from('proposals')
    .update({ data: { ...(row.data || {}), documents } })
    .eq('id', id)
    .select('id');
  if (error) fail(error, 'Erro ao atualizar documento');
  if (!data?.length) throw new DbError('Seu perfil não tem permissão para alterar esta proposta.');
}

// -----------------------------------------------------------------------------
// Comissões
// -----------------------------------------------------------------------------

function rowToCommission(row: any): Commission {
  return {
    grossCommissionReceived: 0,
    operatorCommissionPaid: 0,
    ...(row.data || {}),
    id: row.id,
    proposalId: row.proposal_id,
    operatorId: row.operator_id,
    status: row.status,
    createdAt: row.created_at
  } as Commission;
}

export async function listCommissions(): Promise<Commission[]> {
  const { data, error } = await supabase.from('commissions').select('*').order('created_at', { ascending: false });
  if (error) fail(error, 'Erro ao carregar comissões');
  return (data || []).map(rowToCommission);
}

export async function updateCommissionStatus(
  id: string,
  status: Commission['status'],
  receivedAmount?: number,
  notes?: string
): Promise<void> {
  const { data: row, error: readError } = await supabase.from('commissions').select('*').eq('id', id).single();
  if (readError) fail(readError, 'Comissão não encontrada');

  const next = { ...(row.data || {}) } as Record<string, any>;
  if (notes) next.notes = notes;
  const now = new Date().toISOString();
  if (status === 'recebida') {
    next.grossCommissionReceived = Number(receivedAmount) || Number(next.grossCommissionExpected) || 0;
    next.receivedAt = now;
  } else if (status === 'paga_operador') {
    next.operatorCommissionPaid = Number(next.operatorCommissionExpected) || 0;
    next.paidAt = now;
  }

  const { data, error } = await supabase.from('commissions').update({ status, data: next }).eq('id', id).select('id');
  if (error) fail(error, 'Erro ao atualizar comissão');
  if (!data?.length) throw new DbError('Seu perfil não tem permissão para alterar comissões.');
}

// -----------------------------------------------------------------------------
// Conectores bancários
// -----------------------------------------------------------------------------

export async function listConnectors(): Promise<BankingConnector[]> {
  const { data, error } = await supabase.from('connectors').select('*');
  if (error) fail(error, 'Erro ao carregar conectores');
  return (data || [])
    .map((r: any) => ({ ...(r.data || {}), id: r.id, status: r.status, environment: r.environment }) as BankingConnector)
    .sort((a, b) => a.bankName.localeCompare(b.bankName));
}

export async function updateConnector(
  id: string,
  environment: BankingConnector['environment'],
  status: BankingConnector['status'],
  notes?: string
): Promise<void> {
  const { data: row, error: readError } = await supabase.from('connectors').select('*').eq('id', id).single();
  if (readError) fail(readError, 'Conector não encontrado');
  const next = { ...(row.data || {}) };
  if (notes) next.notes = notes;
  const { data, error } = await supabase.from('connectors').update({ environment, status, data: next }).eq('id', id).select('id');
  if (error) fail(error, 'Erro ao atualizar conector');
  if (!data?.length) throw new DbError('Seu perfil não tem permissão para alterar conectores.');
}

// -----------------------------------------------------------------------------
// Auditoria
// -----------------------------------------------------------------------------

export async function listAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) fail(error, 'Erro ao carregar auditoria');
  return (data || []).map((r: any) => ({
    id: String(r.id),
    action: r.action,
    targetEntity: r.target_entity,
    targetId: r.target_id || undefined,
    operatorName: r.operator_name,
    details: r.details,
    createdAt: r.created_at
  }));
}
