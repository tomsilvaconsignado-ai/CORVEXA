-- ==============================================================================
-- CORVEXA — MIGRATION 001: Esquema operacional usado pelo app (Supabase)
-- ------------------------------------------------------------------------------
-- Modelo híbrido: colunas para o que é usado em filtros, chaves e permissões
-- (organização, operador, CPF, status) e uma coluna `data jsonb` com o restante
-- do registro, espelhando os tipos de src/types/corban.ts.
--
-- Segurança:
--   * Row Level Security em todas as tabelas, isolando por organização.
--   * Permissões por perfil (admin_master, gerente, operador, financeiro, auditor)
--     aplicadas no banco, não só no menu.
--   * organization_id, operator_id e números de proposta são definidos por
--     triggers no servidor — o navegador não consegue forjá-los.
--   * Trilha de auditoria gravada por triggers; ninguém altera ou apaga logs.
--   * Novos usuários entram INATIVOS e sem acesso até um admin ativá-los.
--
-- O modelo conceitual completo de 34 entidades está em supabase/reference/.
-- ==============================================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. Tabelas
-- ------------------------------------------------------------------------------

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  cnpj        text,
  branch_name text,
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id),
  role            text not null default 'operador'
                  check (role in ('admin_master','gerente','operador','financeiro','auditor')),
  active          boolean not null default false,
  full_name       text not null default '',
  email           text not null default '',
  cpf             text,
  phone           text,
  created_at      timestamptz not null default now()
);

create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  operator_id     uuid references public.profiles(id),
  full_name       text not null,
  cpf_digits      text not null check (cpf_digits ~ '^[0-9]{11}$'),
  status          text not null default 'ativo' check (status in ('ativo','inativo','em_analise')),
  data            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, cpf_digits)
);

create table if not exists public.customer_consents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  consent_type    text not null,
  granted         boolean not null default true,
  legal_basis     text not null,
  granted_at      timestamptz not null default now()
);

create table if not exists public.interactions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  operator_id     uuid references public.profiles(id),
  operator_name   text not null default '',
  channel         text not null default 'whatsapp' check (channel in ('whatsapp','telefone','presencial','email')),
  subject         text not null,
  description     text not null,
  result          text,
  created_at      timestamptz not null default now()
);

create sequence if not exists public.proposal_number_seq;

create table if not exists public.proposals (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  customer_id     uuid not null references public.customers(id),
  operator_id     uuid references public.profiles(id),
  proposal_number text not null unique,
  status          text not null default 'proposta_em_elaboracao',
  data            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.commissions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  proposal_id     uuid not null references public.proposals(id) on delete cascade,
  operator_id     uuid references public.profiles(id),
  status          text not null default 'prevista'
                  check (status in ('prevista','confirmada_parceiro','recebida','paga_operador','estornada')),
  data            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.connectors (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  status          text not null default 'pendente_homologacao'
                  check (status in ('ativo','pendente_homologacao','em_manutencao')),
  environment     text not null default 'homologacao' check (environment in ('homologacao','producao')),
  data            jsonb not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id              bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id),
  actor_id        uuid,
  operator_name   text not null default 'Sistema',
  action          text not null,
  target_entity   text not null,
  target_id       text,
  details         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists customers_org_idx    on public.customers (organization_id);
create index if not exists proposals_org_idx    on public.proposals (organization_id, status);
create index if not exists commissions_org_idx  on public.commissions (organization_id, status);
create index if not exists interactions_cust_idx on public.interactions (customer_id, created_at desc);
create index if not exists audit_org_idx        on public.audit_logs (organization_id, created_at desc);

-- ------------------------------------------------------------------------------
-- 2. Funções auxiliares de autorização
-- ------------------------------------------------------------------------------

create or replace function public.auth_org() returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid() and active;
$$;

create or replace function public.auth_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active;
$$;

create or replace function public.has_role(variadic roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() = any(roles), false);
$$;

create or replace function public.auth_name() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(full_name, ''), email, 'Usuário') from public.profiles where id = auth.uid();
$$;

create or replace function public.write_audit(
  p_action text, p_entity text, p_target text, p_details text
) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_logs (organization_id, actor_id, operator_name, action, target_entity, target_id, details)
  values (public.auth_org(), auth.uid(), coalesce(public.auth_name(), 'Sistema'), p_action, p_entity, p_target, p_details);
$$;
revoke all on function public.write_audit(text, text, text, text) from public, anon, authenticated;

-- Eventos de sessão registrados pelo app (somente ações conhecidas)
create or replace function public.log_auth_event(p_action text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_action not in ('auth.login_success', 'auth.logout', 'auth.password_reset_completed') then
    raise exception 'Evento de auditoria não permitido';
  end if;
  perform public.write_audit(p_action, 'auth', auth.uid()::text,
    case p_action
      when 'auth.login_success' then 'Login realizado por ' || public.auth_name() || '.'
      when 'auth.logout' then 'Sessão encerrada por ' || public.auth_name() || '.'
      else 'Senha redefinida por ' || public.auth_name() || '.'
    end);
end;
$$;
grant execute on function public.log_auth_event(text) to authenticated;

-- ------------------------------------------------------------------------------
-- 3. Novos usuários: perfil criado inativo, sempre como operador
-- ------------------------------------------------------------------------------

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Metadados enviados pelo cliente NÃO definem perfil nem organização.
  insert into public.profiles (id, email, full_name, role, active)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''), 'operador', false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. Triggers de integridade e regras de negócio
-- ------------------------------------------------------------------------------

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Clientes
create or replace function public.customers_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.organization_id := public.auth_org();
    new.operator_id := auth.uid();
    new.created_at := now();
  else
    new.organization_id := old.organization_id;
    new.cpf_digits := old.cpf_digits;           -- CPF não pode ser alterado
    new.operator_id := old.operator_id;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.customers_after_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.customer_consents (organization_id, customer_id, consent_type, granted, legal_basis)
    values (new.organization_id, new.id, 'dados_cadastrais', true, 'consentimento_titular');
    perform public.write_audit('customer.create', 'customers', new.id::text,
      format('Cliente %s (CPF %s) cadastrado.', new.full_name, new.data->>'cpf'));
  else
    perform public.write_audit('customer.update', 'customers', new.id::text,
      format('Dados do cliente %s atualizados.', new.full_name));
  end if;
  return new;
end;
$$;

drop trigger if exists customers_bw on public.customers;
create trigger customers_bw before insert or update on public.customers
  for each row execute function public.customers_before_write();
drop trigger if exists customers_aw on public.customers;
create trigger customers_aw after insert or update on public.customers
  for each row execute function public.customers_after_write();

-- Atendimentos
create or replace function public.interactions_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.organization_id := public.auth_org();
  new.operator_id := auth.uid();
  new.operator_name := public.auth_name();
  new.created_at := now();
  perform public.write_audit('customer.interaction', 'interactions', new.customer_id::text,
    format('Atendimento registrado: "%s".', new.subject));
  return new;
end;
$$;

drop trigger if exists interactions_bi on public.interactions;
create trigger interactions_bi before insert on public.interactions
  for each row execute function public.interactions_before_insert();

-- Propostas
create or replace function public.proposals_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c record;
begin
  if tg_op = 'INSERT' then
    select full_name, data->>'cpf' as cpf into c
      from public.customers where id = new.customer_id and organization_id = public.auth_org();
    if not found then
      raise exception 'Cliente não encontrado nesta organização';
    end if;
    new.organization_id := public.auth_org();
    new.operator_id := auth.uid();
    new.proposal_number := 'PR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.proposal_number_seq')::text, 5, '0');
    new.created_at := now();
    new.data := new.data || jsonb_build_object(
      'customerName', c.full_name,
      'customerCpf', c.cpf,
      'operatorName', public.auth_name(),
      'stageUpdatedAt', now()
    );
  else
    new.organization_id := old.organization_id;
    new.customer_id := old.customer_id;
    new.operator_id := old.operator_id;
    new.proposal_number := old.proposal_number;
    new.created_at := old.created_at;
    if new.status is distinct from old.status then
      new.data := new.data || jsonb_build_object('stageUpdatedAt', now());
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.proposals_after_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  amount numeric := coalesce((new.data->>'requestedAmount')::numeric, 0);
begin
  if tg_op = 'INSERT' then
    -- Comissão prevista (12% bruto / 4% operador — ajuste conforme regras do parceiro)
    insert into public.commissions (organization_id, proposal_id, operator_id, status, data)
    values (new.organization_id, new.id, new.operator_id, 'prevista', jsonb_build_object(
      'proposalNumber', new.proposal_number,
      'customerName', new.data->>'customerName',
      'operatorName', new.data->>'operatorName',
      'bankName', new.data->>'bankName',
      'productName', new.data->>'productName',
      'baseProductionAmount', amount,
      'grossCommissionExpected', round(amount * 0.12, 2),
      'operatorCommissionExpected', round(amount * 0.04, 2),
      'grossCommissionReceived', 0,
      'operatorCommissionPaid', 0,
      'expectedPaymentDate', to_char(now() + interval '15 days', 'YYYY-MM-DD')
    ));
    perform public.write_audit('proposal.create', 'proposals', new.id::text,
      format('Proposta %s gerada para %s no valor de R$ %s (%s).',
        new.proposal_number, new.data->>'customerName',
        translate(to_char(amount, 'FM999,999,990.00'), ',.', '.,'), new.data->>'bankName'));
  else
    if new.status is distinct from old.status then
      if new.status = 'contratada' then
        update public.commissions set status = 'confirmada_parceiro'
          where proposal_id = new.id and status = 'prevista';
      end if;
      perform public.write_audit('proposal.stage_update', 'proposals', new.id::text,
        format('Proposta %s alterada de [%s] para [%s]. Justificativa: %s',
          new.proposal_number, old.status, new.status, coalesce(nullif(new.data->>'lastJustification', ''), 'Fluxo operacional normal')));
    end if;
    if new.data->'documents' is distinct from old.data->'documents' then
      perform public.write_audit('proposal.document_status', 'proposals', new.id::text,
        format('Documentação da proposta %s atualizada.', new.proposal_number));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists proposals_bw on public.proposals;
create trigger proposals_bw before insert or update on public.proposals
  for each row execute function public.proposals_before_write();
drop trigger if exists proposals_aw on public.proposals;
create trigger proposals_aw after insert or update on public.proposals
  for each row execute function public.proposals_after_write();

-- Comissões
create or replace function public.commissions_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.organization_id := old.organization_id;
  new.proposal_id := old.proposal_id;
  new.operator_id := old.operator_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  if new.status is distinct from old.status then
    perform public.write_audit('commission.status_update', 'commissions', new.id::text,
      format('Comissão da proposta %s alterada para [%s]. Valor recebido: R$ %s',
        new.data->>'proposalNumber', new.status, coalesce(new.data->>'grossCommissionReceived', '0')));
  end if;
  return new;
end;
$$;

drop trigger if exists commissions_bu on public.commissions;
create trigger commissions_bu before update on public.commissions
  for each row execute function public.commissions_before_update();

-- Conectores
create or replace function public.connectors_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.organization_id := old.organization_id;
  new.updated_at := now();
  perform public.write_audit('connector.update', 'connectors', new.id::text,
    format('Conector %s atualizado: ambiente [%s], status [%s].', new.data->>'bankName', new.environment, new.status));
  return new;
end;
$$;

drop trigger if exists connectors_bu on public.connectors;
create trigger connectors_bu before update on public.connectors
  for each row execute function public.connectors_before_update();

-- ------------------------------------------------------------------------------
-- 5. Row Level Security
-- ------------------------------------------------------------------------------

alter table public.organizations     enable row level security;
alter table public.profiles          enable row level security;
alter table public.customers         enable row level security;
alter table public.customer_consents enable row level security;
alter table public.interactions      enable row level security;
alter table public.proposals         enable row level security;
alter table public.commissions       enable row level security;
alter table public.connectors        enable row level security;
alter table public.audit_logs        enable row level security;

-- Organizações e perfis
create policy org_select on public.organizations for select to authenticated
  using (id = public.auth_org());

create policy profiles_select_self on public.profiles for select to authenticated
  using (id = auth.uid() or organization_id = public.auth_org());
-- Nenhuma policy de update/insert/delete em profiles: perfil e ativação são
-- geridos pelo admin no SQL Editor/Dashboard (ver README).

-- Clientes
create policy customers_select on public.customers for select to authenticated
  using (organization_id = public.auth_org());
create policy customers_insert on public.customers for insert to authenticated
  with check (public.has_role('admin_master','gerente','operador'));
create policy customers_update on public.customers for update to authenticated
  using (organization_id = public.auth_org() and public.has_role('admin_master','gerente','operador'))
  with check (organization_id = public.auth_org());
create policy customers_delete on public.customers for delete to authenticated
  using (organization_id = public.auth_org() and public.has_role('admin_master'));

create policy consents_select on public.customer_consents for select to authenticated
  using (organization_id = public.auth_org());

-- Atendimentos
create policy interactions_select on public.interactions for select to authenticated
  using (organization_id = public.auth_org());
create policy interactions_insert on public.interactions for insert to authenticated
  with check (public.has_role('admin_master','gerente','operador')
    and exists (select 1 from public.customers c where c.id = customer_id and c.organization_id = public.auth_org()));

-- Propostas
create policy proposals_select on public.proposals for select to authenticated
  using (organization_id = public.auth_org());
create policy proposals_insert on public.proposals for insert to authenticated
  with check (public.has_role('admin_master','gerente','operador'));
create policy proposals_update on public.proposals for update to authenticated
  using (organization_id = public.auth_org()
    and (public.has_role('admin_master','gerente') or (public.has_role('operador') and operator_id = auth.uid())))
  with check (organization_id = public.auth_org());

-- Comissões: financeiro/gestão veem tudo; operador vê só as próprias
create policy commissions_select on public.commissions for select to authenticated
  using (organization_id = public.auth_org()
    and (public.has_role('admin_master','gerente','financeiro','auditor') or operator_id = auth.uid()));
create policy commissions_update on public.commissions for update to authenticated
  using (organization_id = public.auth_org() and public.has_role('admin_master','financeiro'))
  with check (organization_id = public.auth_org());

-- Conectores
create policy connectors_select on public.connectors for select to authenticated
  using (organization_id = public.auth_org());
create policy connectors_update on public.connectors for update to authenticated
  using (organization_id = public.auth_org() and public.has_role('admin_master','gerente'))
  with check (organization_id = public.auth_org());

-- Auditoria: somente leitura para admin e compliance; ninguém escreve direto
create policy audit_select on public.audit_logs for select to authenticated
  using (organization_id = public.auth_org() and public.has_role('admin_master','auditor'));

-- ------------------------------------------------------------------------------
-- 6. Dados iniciais: organização e conectores (todos pendentes de homologação)
-- ------------------------------------------------------------------------------

insert into public.organizations (id, name, cnpj, branch_name)
values ('00000000-0000-0000-0000-000000000001', 'CORVEXA Soluções em Tecnologia & Crédito', null, 'Matriz')
on conflict (id) do nothing;

insert into public.connectors (organization_id, status, environment, data)
select '00000000-0000-0000-0000-000000000001', 'pendente_homologacao', 'homologacao', d
from jsonb_array_elements('[
  {"bankCode":"041","bankName":"Banrisul (BPI - Banrisul Partner Integration)","partnerType":"banco_direto","baseUrl":"https://developers.banrisul.com.br/bpi/v2","authType":"OAuth 2.0 (mTLS + Client Credentials)","supportedOperations":["Simulação","Envio de Proposta","Consulta de Status","Consulta de Margem"],"docUrl":"https://developers.banrisul.com.br/bpi/link/catalogo-apis.html","notes":"Canal BPI Banrisul para Consignado Estadual RS, INSS e Servidor Municipal."},
  {"bankCode":"DATAPREV","bankName":"Dataprev — Canal Instituições Habilitadas","partnerType":"orgao_oficial","baseUrl":"https://api.dataprev.gov.br/consignado/v1","authType":"Certificado Digital ICP-Brasil (e-CNPJ)","supportedOperations":["Consulta Autorizada de Margem","Reserva de Margem","Averbação"],"docUrl":"https://dataprev.gov.br/","notes":"Acesso regulado para consulta de elegibilidade INSS mediante autorização prévia do titular."},
  {"bankCode":"SERPRO","bankName":"Serpro — Validação Cadastral & Biometria","partnerType":"orgao_oficial","baseUrl":"https://gateway.apiserpro.serpro.gov.br/consulta-cpf/v1","authType":"Bearer Token (API Serpro)","supportedOperations":["Validação Cadastral CPF","Status na Receita Federal","Prevenção à Fraude"],"docUrl":"https://servicos.serpro.gov.br/api-serpro/","notes":"Validação oficial de regularidade de CPF para mitigação de fraudes."},
  {"bankCode":"623","bankName":"Banco PAN — Consignado & FGTS","partnerType":"banco_direto","baseUrl":"https://api-parceiros.bancopan.com.br/v1","authType":"API Key + HMAC SHA-256","supportedOperations":["Simulação FGTS","Contratação Digital","Webhooks de Averbação"],"docUrl":"https://bancopan.com.br/parceiros","notes":"Esteira automatizada com resposta de proposta em tempo real."},
  {"bankCode":"OPENFINANCE","bankName":"Open Finance Brasil (Iniciador e Compartilhamento)","partnerType":"orgao_oficial","baseUrl":"https://api.openfinancebrasil.org.br/v2","authType":"FAPI 1.0 Advanced / mTLS","supportedOperations":["Compartilhamento de Dados Financeiros","Histórico de Crédito"],"docUrl":"https://openfinancebrasil.org.br/","notes":"Em fase de certificação no diretório Open Finance Brasil."}
]'::jsonb) as d
where not exists (select 1 from public.connectors where organization_id = '00000000-0000-0000-0000-000000000001');
