-- ==============================================================================
-- CORVEXA — MIGRATION 002: ROW LEVEL SECURITY & INITIAL SEED
-- PostgreSQL / Supabase Migration
-- ==============================================================================

-- Enable Row Level Security (RLS) on key multi-tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: get the organization_id of the current authenticated user
CREATE OR REPLACE FUNCTION current_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: check if user is admin_master
CREATE OR REPLACE FUNCTION is_admin_master()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.id = auth.uid() AND r.name = 'admin_master'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Multi-tenant isolation policies
CREATE POLICY org_isolation_customers ON customers
    FOR ALL
    USING (organization_id = current_user_organization_id());

CREATE POLICY org_isolation_proposals ON proposals
    FOR ALL
    USING (organization_id = current_user_organization_id());

CREATE POLICY org_isolation_simulations ON simulations
    FOR ALL
    USING (organization_id = current_user_organization_id());

CREATE POLICY org_isolation_commissions ON commissions
    FOR ALL
    USING (organization_id = current_user_organization_id());

CREATE POLICY org_isolation_tasks ON tasks
    FOR ALL
    USING (organization_id = current_user_organization_id());

-- ==============================================================================
-- SEED DATA: ROLES & PERMISSIONS
-- ==============================================================================
INSERT INTO roles (id, name, display_name, description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin_master', 'Administrador Master', 'Acesso irrestrito a todos os módulos, configurações da organização e auditoria.'),
    ('00000000-0000-0000-0000-000000000002', 'gerente', 'Gerente Comercial', 'Acompanhamento da equipe, distribuição de leads e relatórios de produção.'),
    ('00000000-0000-0000-0000-000000000003', 'operador', 'Operador Comercial', 'Atendimento de clientes, simulações, digitação de propostas e checklist documental.'),
    ('00000000-0000-0000-0000-000000000004', 'financeiro', 'Financeiro & Comissões', 'Conciliação de comissões, controle de pagamentos e relatórios contábeis.'),
    ('00000000-0000-0000-0000-000000000005', 'auditor', 'Auditor & Compliance', 'Acesso para conferência e auditoria LGPD sem permissão de alteração.')
ON CONFLICT (id) DO NOTHING;

-- SEED DATA: 7 PRODUTOS DE CRÉDITO DO CORRESPONDENTE
INSERT INTO products (id, code, name, category, description, min_installments, max_installments, default_monthly_interest_rate) VALUES
    ('10000000-0000-0000-0000-000000000001', 'consignado_inss', 'Consignado INSS', 'consignado', 'Empréstimo consignado para aposentados e pensionistas do INSS com desconto em folha.', 12, 84, 0.0166),
    ('10000000-0000-0000-0000-000000000002', 'consignado_servidor', 'Servidor Público (SIAPE / Estados)', 'consignado', 'Crédito consignado para servidores federais, estaduais e municipais conveniados.', 12, 96, 0.0175),
    ('10000000-0000-0000-0000-000000000003', 'consignado_clt', 'Crédito do Trabalhador CLT', 'consignado', 'Linha de crédito com consignação para trabalhadores com carteira assinada.', 6, 48, 0.0210),
    ('10000000-0000-0000-0000-000000000004', 'saque_fgts', 'Antecipação Saque-Aniversário FGTS', 'fgts', 'Antecipação dos períodos anuais de saque do FGTS com garantia do saldo.', 1, 10, 0.0179),
    ('10000000-0000-0000-0000-000000000005', 'credito_pessoal', 'Crédito Pessoal', 'pessoal', 'Crédito com débito em conta corrente ou boleto para clientes em geral.', 6, 36, 0.0380),
    ('10000000-0000-0000-0000-000000000006', 'portabilidade', 'Portabilidade de Crédito', 'portabilidade', 'Transferência de operação de crédito de outro banco com redução de juros ou troco.', 24, 84, 0.0162),
    ('10000000-0000-0000-0000-000000000007', 'refinanciamento', 'Refinanciamento (Refin)', 'refinanciamento', 'Refinanciamento de contrato ativo com liberação de saldo líquido troco.', 12, 84, 0.0166)
ON CONFLICT (id) DO NOTHING;

-- SEED DATA: INSTITUIÇÕES FINANCEIRAS PARCEIRAS (REAIS)
INSERT INTO financial_institutions (id, code, name, trade_name, cnpj) VALUES
    ('20000000-0000-0000-0000-000000000001', '041', 'Banco do Estado do Rio Grande do Sul S.A.', 'Banrisul', '92.702.067/0001-96'),
    ('20000000-0000-0000-0000-000000000002', '104', 'Caixa Econômica Federal', 'Caixa', '00.360.305/0001-04'),
    ('20000000-0000-0000-0000-000000000003', '033', 'Banco Santander (Brasil) S.A.', 'Santander / Olé', '90.400.888/0001-42'),
    ('20000000-0000-0000-0000-000000000004', '623', 'Banco PAN S.A.', 'Banco PAN', '59.285.411/0001-13'),
    ('20000000-0000-0000-0000-000000000005', '029', 'Banco Itaú Consignado S.A.', 'Itaú Consignado', '33.885.724/0001-19'),
    ('20000000-0000-0000-0000-000000000006', '318', 'Banco BMG S.A.', 'Banco BMG', '17.184.037/0001-10'),
    ('20000000-0000-0000-0000-000000000007', '707', 'Banco Daycoval S.A.', 'Banco Daycoval', '62.232.889/0001-90')
ON CONFLICT (id) DO NOTHING;
