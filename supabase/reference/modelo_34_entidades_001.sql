-- ==============================================================================
-- CORVEXA — MIGRATION 001: INITIAL SCHEMA (34 ENTITIES)
-- PostgreSQL / Supabase Migration
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANIZATIONS (Multi-tenancy isolation)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corporate_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BRANCHES (Filiais e Pontos de Atendimento)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    is_headquarters BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, code)
);

-- 3. ROLES (Perfis de Acesso)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- 'admin_master', 'gerente', 'operador', 'financeiro', 'auditor'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL, -- 'customers.view', 'simulations.create', etc.
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 6. PROFILES (Usuários do sistema vinculados ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CUSTOMERS (CRM - Cadastro Unificado de Clientes)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    rg VARCHAR(20),
    rg_issuer VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(20),
    mother_name VARCHAR(255),
    marital_status VARCHAR(30),
    email VARCHAR(255),
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    whatsapp VARCHAR(20),
    
    -- Dados de Renda e Vínculo
    customer_type VARCHAR(50) NOT NULL, -- 'inss', 'servidor_publico', 'clt', 'autonomo'
    benefit_number VARCHAR(30),
    public_organ VARCHAR(100),
    matricula VARCHAR(50),
    employer_cnpj VARCHAR(18),
    gross_income NUMERIC(15, 2) DEFAULT 0.00,
    net_income NUMERIC(15, 2) DEFAULT 0.00,
    
    -- Endereço
    postal_code VARCHAR(10),
    street VARCHAR(255),
    number VARCHAR(30),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    
    -- Dados Bancários do Cliente (Conta para Recebimento de Crédito)
    bank_code VARCHAR(10),
    bank_name VARCHAR(100),
    bank_agency VARCHAR(20),
    bank_account VARCHAR(30),
    bank_account_type VARCHAR(20),
    
    status VARCHAR(30) DEFAULT 'ativo',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, cpf)
);

-- 8. CUSTOMER_CONSENTS (LGPD)
CREATE TABLE IF NOT EXISTS customer_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- 'dados_cadastrais', 'consulta_margem', 'contato_comercial', 'compartilhamento_bancario'
    granted BOOLEAN DEFAULT TRUE,
    legal_basis VARCHAR(100) NOT NULL, -- 'consentimento_titular', 'execucao_contrato', 'legitimo_interesse'
    ip_address VARCHAR(45),
    channel VARCHAR(50) DEFAULT 'atendimento_presencial', -- 'presencial', 'whatsapp', 'web'
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    notes TEXT
);

-- 9. LEADS
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    origin VARCHAR(100) NOT NULL, -- 'meta_ads', 'google_ads', 'indicacao', 'balcao', 'parceiro'
    desired_product VARCHAR(50), -- 'consignado_inss', 'fgts', etc.
    desired_amount NUMERIC(15, 2),
    status VARCHAR(50) DEFAULT 'lead_recebido',
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. LEAD_ASSIGNMENTS
CREATE TABLE IF NOT EXISTS lead_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'atribuido'
);

-- 11. INTERACTIONS (Histórico de Atendimento)
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    channel VARCHAR(50) NOT NULL, -- 'telefone', 'whatsapp', 'presencial', 'email'
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    result VARCHAR(100),
    interaction_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TASKS (Tarefas e Lembretes de Retorno)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'media', -- 'baixa', 'media', 'alta', 'urgente'
    due_date TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'concluida', 'cancelada'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. FINANCIAL_INSTITUTIONS (Bancos / Promotoras)
CREATE TABLE IF NOT EXISTS financial_institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL, -- '041' (Banrisul), '033' (Santander), '104' (Caixa), etc.
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. BANKING_PARTNERS (Convênios com a Organização)
CREATE TABLE IF NOT EXISTS banking_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    financial_institution_id UUID NOT NULL REFERENCES financial_institutions(id) ON DELETE RESTRICT,
    partner_type VARCHAR(50) NOT NULL, -- 'banco_direto', 'promotora'
    correspondent_code VARCHAR(100),
    contact_person VARCHAR(100),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, financial_institution_id)
);

-- 15. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'consignado_inss', 'consignado_siape', 'consignado_clt', 'saque_fgts', 'credito_pessoal', 'portabilidade', 'refinanciamento'
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    min_installments INT NOT NULL DEFAULT 1,
    max_installments INT NOT NULL DEFAULT 96,
    default_monthly_interest_rate NUMERIC(6, 4) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. PARTNER_PRODUCTS
CREATE TABLE IF NOT EXISTS partner_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    banking_partner_id UUID NOT NULL REFERENCES banking_partners(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    table_code VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    min_amount NUMERIC(15, 2) DEFAULT 100.00,
    max_amount NUMERIC(15, 2) DEFAULT 500000.00,
    min_term INT NOT NULL,
    max_term INT NOT NULL,
    monthly_interest_rate NUMERIC(6, 4) NOT NULL,
    cet_annual_rate NUMERIC(6, 4) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE NOT NULL,
    valid_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. INTEGRATION_CONFIGS (Conectores de APIs Oficiais)
CREATE TABLE IF NOT EXISTS integration_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    financial_institution_id UUID NOT NULL REFERENCES financial_institutions(id) ON DELETE RESTRICT,
    environment VARCHAR(20) DEFAULT 'homologacao', -- 'homologacao', 'producao'
    base_url VARCHAR(255) NOT NULL,
    auth_type VARCHAR(50) NOT NULL, -- 'oauth2_client_credentials', 'mtls_certificate', 'api_key'
    client_id VARCHAR(255),
    status VARCHAR(30) DEFAULT 'pendente_homologacao', -- 'ativo', 'pendente_homologacao', 'inativo', 'falha'
    last_sync_at TIMESTAMPTZ,
    last_error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. INTEGRATION_EVENTS (Webhooks e Notificações)
CREATE TABLE IF NOT EXISTS integration_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    financial_institution_id UUID NOT NULL REFERENCES financial_institutions(id) ON DELETE RESTRICT,
    event_type VARCHAR(100) NOT NULL,
    external_reference_id VARCHAR(100),
    payload JSONB NOT NULL,
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. SIMULATIONS
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    requested_amount NUMERIC(15, 2) NOT NULL,
    net_amount NUMERIC(15, 2) NOT NULL,
    installments_count INT NOT NULL,
    monthly_interest_rate NUMERIC(6, 4) NOT NULL,
    annual_interest_rate NUMERIC(6, 4) NOT NULL,
    installment_value NUMERIC(15, 2) NOT NULL,
    total_repayable NUMERIC(15, 2) NOT NULL,
    total_interest NUMERIC(15, 2) NOT NULL,
    iof_amount NUMERIC(15, 2) DEFAULT 0.00,
    cet_monthly NUMERIC(6, 4) NOT NULL,
    cet_annual NUMERIC(6, 4) NOT NULL,
    simulation_type VARCHAR(30) DEFAULT 'indicativa', -- 'indicativa', 'oficial_parceiro'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. SIMULATION_CONDITIONS
CREATE TABLE IF NOT EXISTS simulation_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    partner_product_id UUID REFERENCES partner_products(id) ON DELETE SET NULL,
    banking_partner_id UUID REFERENCES banking_partners(id) ON DELETE SET NULL,
    bank_name VARCHAR(100) NOT NULL,
    installment_value NUMERIC(15, 2) NOT NULL,
    monthly_rate NUMERIC(6, 4) NOT NULL,
    is_recommended BOOLEAN DEFAULT FALSE
);

-- 21. PROPOSALS (Pipeline Comercial em 17 Etapas)
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_number VARCHAR(50) UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    banking_partner_id UUID REFERENCES banking_partners(id) ON DELETE SET NULL,
    simulation_id UUID REFERENCES simulations(id) ON DELETE SET NULL,
    
    -- Valores da Proposta
    requested_amount NUMERIC(15, 2) NOT NULL,
    net_amount NUMERIC(15, 2) NOT NULL,
    installment_value NUMERIC(15, 2) NOT NULL,
    installments_count INT NOT NULL,
    monthly_interest_rate NUMERIC(6, 4) NOT NULL,
    cet_annual NUMERIC(6, 4) NOT NULL,
    
    -- Funil de 17 Etapas
    status VARCHAR(50) NOT NULL DEFAULT 'proposta_em_elaboracao',
    stage_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Protocolo Externo do Banco
    external_proposal_id VARCHAR(100),
    external_status VARCHAR(100),
    formalization_link TEXT,
    loss_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. PROPOSAL_STATUS_HISTORY (Auditoria de cada mudança de status no Funil)
CREATE TABLE IF NOT EXISTS proposal_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. PROPOSAL_DOCUMENTS (Checklist de Documentação e Formalização)
CREATE TABLE IF NOT EXISTS proposal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- 'rg_cnh', 'comprovante_residencia', 'extrato_inss', 'holerite', 'termo_adesao', 'selfie'
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    storage_path TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'pendente', -- 'pendente', 'em_analise', 'aprovado', 'rejeitado'
    rejection_reason TEXT,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. CONTRACTS (Contratos Efetivamente Formalizados)
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    banking_partner_id UUID NOT NULL REFERENCES banking_partners(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    
    financed_amount NUMERIC(15, 2) NOT NULL,
    net_released_amount NUMERIC(15, 2) NOT NULL,
    installment_value NUMERIC(15, 2) NOT NULL,
    installments_count INT NOT NULL,
    
    disbursement_date DATE,
    first_due_date DATE,
    last_due_date DATE,
    status VARCHAR(50) DEFAULT 'ativo', -- 'ativo', 'liquidado', 'cancelado', 'portado'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. CONTRACT_STATUS_HISTORY
CREATE TABLE IF NOT EXISTS contract_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    justification TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. COMMISSION_RULES (Tabela de Comissionamento)
CREATE TABLE IF NOT EXISTS commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    banking_partner_id UUID NOT NULL REFERENCES banking_partners(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    gross_percentage NUMERIC(6, 4) NOT NULL, -- Ex: 0.1250 (12.50%)
    operator_percentage NUMERIC(6, 4) NOT NULL, -- Ex: 0.0400 (4.00%)
    bonus_percentage NUMERIC(6, 4) DEFAULT 0.0000,
    valid_from DATE NOT NULL,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. COMMISSIONS (Controle de Produção e Comissões)
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE RESTRICT,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    banking_partner_id UUID NOT NULL REFERENCES banking_partners(id) ON DELETE RESTRICT,
    
    base_production_amount NUMERIC(15, 2) NOT NULL,
    gross_commission_expected NUMERIC(15, 2) NOT NULL,
    operator_commission_expected NUMERIC(15, 2) NOT NULL,
    
    gross_commission_received NUMERIC(15, 2) DEFAULT 0.00,
    operator_commission_paid NUMERIC(15, 2) DEFAULT 0.00,
    
    status VARCHAR(50) DEFAULT 'prevista', -- 'prevista', 'confirmada_parceiro', 'recebida', 'paga_operador', 'estornada'
    expected_payment_date DATE,
    received_at TIMESTAMPTZ,
    paid_to_operator_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 28. COMMISSION_ADJUSTMENTS (Ajustes e Estornos de Comissões)
CREATE TABLE IF NOT EXISTS commission_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(50) NOT NULL, -- 'estorno_cancelamento', 'bonus_meta', 'correcao_taxa'
    amount NUMERIC(15, 2) NOT NULL,
    reason TEXT NOT NULL,
    authorized_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 29. FINANCIAL_TRANSACTIONS
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    commission_id UUID REFERENCES commissions(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'receita_comissao', 'pagamento_operador', 'estorno'
    amount NUMERIC(15, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'ted_pix',
    reference_code VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 30. RECONCILIATIONS (Conciliação Bancária)
CREATE TABLE IF NOT EXISTS reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    banking_partner_id UUID NOT NULL REFERENCES banking_partners(id) ON DELETE RESTRICT,
    reconciliation_month INT NOT NULL,
    reconciliation_year INT NOT NULL,
    total_expected NUMERIC(15, 2) NOT NULL,
    total_received NUMERIC(15, 2) NOT NULL,
    difference NUMERIC(15, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'pendente', -- 'pendente', 'conciliado', 'divergencia'
    conciliated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    conciliated_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 31. COMMUNICATION_LOGS (WhatsApp e E-mails Auditados)
CREATE TABLE IF NOT EXISTS communication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    operator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    channel VARCHAR(50) NOT NULL, -- 'whatsapp_business', 'email', 'sms'
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    message_type VARCHAR(50) NOT NULL, -- 'texto', 'documento', 'modelo_aprovado'
    content TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'enviado',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 32. AUDIT_LOGS (Rastreabilidade e Segurança LGPD)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'customer.create', 'proposal.status_change', 'commission.conciliate'
    target_entity VARCHAR(100) NOT NULL,
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 33. NOTIFICATIONS (Alertas Internos de Propostas e Tarefas)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'sistema', -- 'proposta_parada', 'tarefa_vencendo', 'comissao'
    action_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 34. SYSTEM_SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, key)
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_org_cpf ON customers(organization_id, cpf);
CREATE INDEX IF NOT EXISTS idx_customers_operator ON customers(operator_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_customer ON proposals(customer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_operator ON proposals(operator_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(organization_id, action, created_at);
