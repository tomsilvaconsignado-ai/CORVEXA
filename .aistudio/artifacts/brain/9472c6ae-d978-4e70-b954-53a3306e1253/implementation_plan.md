# CORBAN 360 — Sistema de Gestão para Correspondentes Bancários

Plataforma corporativa full-stack para correspondentes bancários próprios, centralizando clientes (CRM com validação de CPF e detecção de duplicidades), pipeline comercial em 17 etapas reais, motor de simulação para os 7 produtos de crédito, controle de acessos RBAC, esteira de formalização documental e conectores para instituições financeiras.

## Revisão do Usuário & Decisões Confirmadas

> [!IMPORTANT]
> As decisões operacionais e de persistência foram alinhadas diretamente na Fase 1:
> - **Persistência & Backend**: Servidor Full-stack Express com armazenamento estruturado e scripts de migração SQL DDL/RLS para exportação e sincronização com Supabase / PostgreSQL.
> - **Prioridade da Fase 1**: CRM com cadastro unificado de clientes, simulador financeiro para 7 produtos de crédito (Consignado INSS, Servidor Público, CLT, FGTS, Crédito Pessoal, Portabilidade e Refinanciamento) e funil de vendas em 17 etapas com histórico e auditoria.
> - **Identidade Visual**: Fintech corporativo em azul-marinho profundo (`#0B192C` / `#1E3E62`), verde esmeralda (`#059669`) e neutros equilibrados com alta densidade e tipografia com numerais tabulares.

---

## 1. Visão Geral & Conceito Central

O **CORBAN 360** foi concebido especificamente para as rotinas reguladas de correspondentes bancários no Brasil. Ele elimina a perda de leads, evita digitação duplicada e reduz retrabalho entre operadores e a esteira de formalização dos bancos parceiros (Banrisul, Dataprev, Caixa/FGTS, bancos privados e promotoras).

### Público-Alvo e Perfis de Acesso (RBAC)
1. **Administrador Master**: Visão irrestrita da organização, gestão de equipe, cadastro de parceiros bancários, regras de comissionamento e auditoria.
2. **Gerente Comercial**: Monitoramento de operadores, distribuição de leads na esteira, acompanhamento de metas e conversão do funil.
3. **Operador Comercial**: Atendimento direto, registro de clientes, elaboração de propostas, simulação e checklist documental.
4. **Financeiro**: Controle de conciliação de comissões (previstas vs confirmadas vs recebidas), estornos e relatórios analíticos.
5. **Auditor / Consulta**: Acesso estritamente somente-leitura com registros de auditoria em conformidade com a LGPD.

---

## 2. Experiência do Usuário & Design Visual

### Identidade Visual e Estética
- **Paleta de Cores Fintech**:
  - Fundo principal: Canvas neutro claro (`#F8FAFC` / `#FFFFFF`) e modo escuro corporativo (`#0B132B`).
  - Tons estruturais: Azul marinho profissional (`#0B192C`, `#1E3E62`) para navegação lateral e cabeçalhos operacionais.
  - Cor de Ação / Destaque: Verde esmeralda (`#059669` / `#10B981`) para aprovações, contratações e simulações vantajosas.
  - Alertas e Riscos: Âmbar (`#D97706`) para pendências documentais e Carmim (`#DC2626`) para reprovações e prazos estourados.
- **Tipografia e Disciplina Tabular**:
  - Títulos e interface: `Plus Jakarta Sans` para clareza e autoridade.
  - Valores monetários (R$), taxas (a.m. e a.a.), prazos e números de CPF: `JetBrains Mono` / `tabular-nums` rigorosos para alinhamento vertical e precisão.
- **Estrutura de Tela**:
  - Barra lateral fixa recolhível (260px) com menus organizados por módulos: Dashboard, CRM Clientes, Funil Comercial, Simulador Financeiro, Propostas & Contratos, Documentos & Formalização, Comissões & Financeiro, Conectores Bancários e Auditoria/Configurações.
  - Barra superior de contexto com identificação da filial ativa, seletor de perfil para simulação/troca segura de permissões e busca global por Nome/CPF.

### Fluxos Principais
1. **Cadastro e Qualificação do Cliente**: Busca preventiva por CPF -> formulário com validação de dígitos verificadores -> detecção de duplicidade -> enriquecimento com dados de benefício/matrícula/convênio -> consentimento LGPD registrado.
2. **Simulação Financeira Multi-Produto**: Escolha do produto (ex: Consignado INSS, Portabilidade ou FGTS) -> inserção de valores, prazo e taxa -> cálculo exato de parcelas, juros, amortização e CET -> geração de comparativo de bancos.
3. **Funil Comercial (17 Etapas)**: Visualização em Kanban de alta densidade e visão em lista tabular com filtros rápidos por operador, banco e data de parada.
4. **Formalização & Documentos**: Checklist documental parametrizado por produto (RG/CNH, Comprovante de Residência, Extrato de Benefício / Holerite, Termo de Consentimento).

---

## 3. Decisões do Produto & Trade-offs

1. **Persistência Dual (Express Backend Local + Migração Supabase PostgreSQL)**
   - *Abordagem*: O backend Express rodará no ambiente da aplicação com banco de dados relacional persistente em disco (armazenamento JSON estruturado / SQLite transacional na pasta `/data`) com rotas de API REST `/api/*`. Concomitantemente, são gerados e mantidos scripts SQL completos (`migrations/001_corban_schema.sql` e `migrations/002_rls_policies.sql`) contendo as 34 entidades relacionais exigidas, tabelas, índices e políticas de Row Level Security (RLS) prontas para execução imediata em qualquer instância do Supabase ou PostgreSQL de produção.
   - *Por quê*: Garante 100% de funcionamento imediato no ambiente de execução do AI Studio sem exigir tokens externos obrigatórios no primeiro boot, permitindo ao mesmo tempo a migração direta para nuvem empresarial com zero retrabalho.

2. **Cálculo Financeiro Preciso (Motor Amortização Price/SAC e CET Real)**
   - *Abordagem*: Funções determinísticas em ponto fixo / inteiros de centavos para cálculo de juros compostos, parcelas e Custo Efetivo Total (CET), distinguindo explicitamente simulação indicativa local de propostas homologadas por APIs bancárias.
   - *Por quê*: Respeita a regra fundamental do CORBAN 360: nunca inventar aprovações bancárias ou dados fictícios como se fossem definitivos.

3. **Arquitetura de Conectores Bancários Desacoplados**
   - *Abordagem*: Módulo de integrações com catálogo padronizado para Banrisul BPI, Dataprev, Serpro e Open Finance, exibindo status real do conector (`Ativo`, `Pendente de Homologação`, `Em Manutenção`), com endpoints oficiais documentados e sem simular aprovações falsas.

---

## 4. Arquitetura Técnica & Estrutura de Dados

### Diagrama de Arquitetura

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CORBAN 360 FRONTEND                           │
│   (React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons)        │
├────────────────────────────────────────────────────────────────────────┤
│  TopBar & Breadcrumbs  │  Sidebar Navigation (Módulos & RBAC)         │
│  ──────────────────────────────────────────────────────────────────    │
│  [ Dashboard ]  [ CRM Clientes ]  [ Funil 17 Etapas ]  [ Simulador ]  │
│  [ Propostas ]  [ Documentos ]   [ Comissões ]        [ Conectores]   │
└───────────────────┬───────────────────────────────────┬────────────────┘
                    │ Chamadas REST (/api/*)            │
                    ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS BACKEND ENGINE                          │
│   (Node.js / Express Server - server.ts)                               │
├────────────────────────────────────────────────────────────────────────┤
│  • Auth & Session Handler (RBAC: Admin, Gerente, Operador, Financeiro)│
│  • CRM Controller (Clientes, Contatos, LGPD Consent, Duplicidades)    │
│  • Funnel Engine (17 Etapas, Regras de Transição, Auditoria de Status)│
│  • Financial Simulation Engine (Tabela Price, CET, IOF, 7 Produtos)   │
│  • Banking Integration Registry (Status de Homologação Banrisul, etc.)│
│  • Commission Engine (Previsão vs Confirmação vs Recebimento)          │
└───────────────────┬───────────────────────────────────┬────────────────┘
                    │                                   │
                    ▼                                   ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│     PERSISTÊNCIA LOCAL (API)         │  │   EXPORTAÇÃO SUPABASE SQL    │
│  Armazenamento estruturado e seguro  │  │  34 Tabelas DDL + RLS + Índices│
│  em /data/corban_store.json          │  │  em /supabase/migrations/     │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### Entidades do Banco de Dados Contempladas na Fase 1
- `organizations`, `branches`, `profiles`, `roles`, `permissions`, `role_permissions`
- `customers`, `customer_consents`, `leads`, `lead_assignments`, `interactions`, `tasks`
- `products`, `financial_institutions`, `banking_partners`, `partner_products`
- `proposals`, `proposal_status_history`, `proposal_documents`, `contracts`, `contract_status_history`
- `simulations`, `simulation_conditions`, `commission_rules`, `commissions`
- `communication_logs`, `audit_logs`, `notifications`, `system_settings`

---

## 5. Roteiro de Implementação da Fase 1

1. **Configuração & Backend**:
   - Criação da camada de persistência em `server/` e inicialização no `server.ts`.
   - Rotas de autenticação, perfis de usuário, clientes, simulações, funil comercial e comissões.
   - Script SQL completo compatível com Supabase e PostgreSQL.
2. **Módulo CRM & Clientes**:
   - Tabela e cards com filtros avançados, validação de CPF com algoritmo oficial e máscara.
   - Histórico de interações cronológico e formulário de consentimento LGPD.
3. **Motor de Simulação Financeira**:
   - Suporte completo aos 7 produtos de crédito: Consignado INSS, Servidores Públicos, CLT, FGTS, Crédito Pessoal, Portabilidade e Refinanciamento.
   - Detalhamento de parcelas, juros contratuais, IOF, CET e comparação entre bancos.
4. **Funil Comercial em 17 Etapas**:
   - Visualização Kanban e lista com drag/drop ou seleção rápida de transição.
   - Registro automático de histórico de status com operador e justificativa.
5. **Dashboard Analítico e Conectores**:
   - Indicadores de conversão, volume financeiro e comissões previstas vs realizadas.
   - Central de parceiros bancários com status real de credenciamento.
