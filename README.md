# CORVEXA — Plataforma de Gestão para Correspondentes Bancários

> **"Conectando crédito, tecnologia e resultados."**

Plataforma inteligente de tecnologia e gestão corporativa para correspondentes bancários próprios (CORBAN) que operam com múltiplos bancos e promotoras de crédito autorizadas no Brasil.

---

## 1. Visão Geral dos Módulos

- **CRM e Cadastro Unificado de Clientes**: Validação oficial de CPF com algoritmo Módulo 11 da Receita Federal, detecção de cadastros duplicados, gestão de vínculos (INSS, Servidor Público, CLT, Autônomo), consentimentos LGPD e histórico cronológico de interações.
- **Motor de Simulação Financeira (7 Produtos de Crédito)**:
  1. Consignado INSS
  2. Consignado Servidores Públicos (SIAPE / Estados / Municípios)
  3. Crédito do Trabalhador CLT
  4. Antecipação do Saque-Aniversário FGTS
  5. Crédito Pessoal
  6. Portabilidade de Crédito
  7. Refinanciamento (Refin)
  - Cálculo exato pela Tabela Price, alíquotas de IOF, CET mensal e anual, e comparativo de bancos parceiros (Banrisul, Caixa, Santander, PAN, Itaú, BMG).
- **Funil Comercial em 17 Etapas**: Pipeline completo de vendas com visualização em lista detalhada e Kanban agrupado, transição auditada de fases com justificativa obrigatória e alertas de propostas estagnadas.
- **Esteira de Documentos & Formalização**: Checklist documental configurável por produto (RG/CNH, Comprovante de Residência, Extrato INSS / Holerite, CCB / Termo de Adesão e Selfie com Biometria) com aprovação e reprovação justificada.
- **Módulo Financeiro & Comissões**: Controle de comissões previstas, confirmadas pelo parceiro e recebidas em conta, repasse aos operadores e conciliação bancária por contrato.
- **Central de Integrações e APIs Bancárias**: Conectores documentados para Banrisul BPI, Dataprev, Serpro, Banco PAN e Open Finance, com controle explícito de status real (`Ativo`, `Pendente de Homologação`, `Em Manutenção`).
- **Controle de Acesso RBAC**: Perfis de Administrador Master, Gerente Comercial, Operador, Financeiro e Auditor / Compliance com alternador de sessão integrado para testes de permissão.
- **Trilha de Auditoria & LGPD**: Registro imutável de todas as ações de usuários, alterações de status e acessos a dados sensíveis.

---

## 2. Pré-requisitos

- **Node.js**: Versão 20.x ou superior.
- **NPM**: Versão 10.x ou superior.
- **PostgreSQL / Supabase** (Opcional para persistência em nuvem; o sistema já inclui banco de dados transacional em disco).

---

## 3. Instalação e Execução Local

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Iniciar o ambiente de desenvolvimento full-stack (Express + Vite)
npm run dev
```

O servidor estará disponível em: `http://localhost:3000`.

---

## 4. Configuração das Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Parâmetros disponíveis:
- `PORT`: Porta de execução do servidor Express (padrão: `3000`).
- `NODE_ENV`: Ambiente (`development` ou `production`).
- `SUPABASE_URL`: URL da sua instância Supabase (ex: `https://xyzcompany.supabase.co`).
- `SUPABASE_ANON_KEY`: Chave anônima pública do Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Chave privada administrativa para backend.
- `BANRISUL_CLIENT_ID` e `BANRISUL_CLIENT_SECRET`: Credenciais para APIs BPI do Banrisul.
- `BANRISUL_CERT_PATH`: Caminho do certificado mTLS ICP-Brasil.
- `DATAPREV_CERT_PATH`: Certificado e-CNPJ para consultas reguladas da Dataprev.

---

## 5. Migrações e Banco de Dados Supabase (34 Entidades)

A plataforma **CORVEXA** fornece scripts SQL completos com 34 entidades relacionais normalizadas, chaves estrangeiras, índices e políticas de Row Level Security (RLS).

Arquivos de migração localizados em `/supabase/migrations/`:
1. `20261028_001_initial_schema.sql`: Definição de tabelas (`organizations`, `branches`, `profiles`, `customers`, `proposals`, `simulations`, `commissions`, etc.), constraints e índices.
2. `20261028_002_rls_and_seed.sql`: Ativação do RLS, políticas de isolamento multi-empresa e dados semente de perfis, produtos e bancos parceiros.

### Como aplicar no Supabase:
1. Acesse o **SQL Editor** no painel do Supabase.
2. Cole ou execute o arquivo `20261028_001_initial_schema.sql`.
3. Em seguida, execute `20261028_002_rls_and_seed.sql`.
4. Os scripts também podem ser baixados diretamente pela interface do sistema no menu **Esquema SQL Supabase**.

---

## 6. Testes Automatizados e Validação

O sistema possui testes unitários e de integração para validação de regras de negócio essenciais:
- Validação de CPF pelo algoritmo oficial Módulo 11.
- Cálculo de parcelas pela Tabela Price e Custo Efetivo Total (CET).
- Prevenção de duplicidade de clientes e integridade de propostas.

Para executar a verificação estática de tipos e integridade:
```bash
npm run lint
```

Para validar a compilação completa do build de produção:
```bash
npm run build
```

---

## 7. Build e Publicação em Produção

```bash
# 1. Gerar o build otimizado do frontend
npm run build

# 2. Iniciar o servidor em produção
npm run start
```

---

## 8. Integração Futura com Parceiros Bancários

1. **Banrisul BPI (Banrisul Partner Integration)**:
   - Consultar catálogo oficial: `https://developers.banrisul.com.br/bpi/link/catalogo-apis.html`
   - Obter credenciamento de correspondente junto ao Banrisul.
   - Instalar o certificado mTLS no servidor backend seguro.
2. **Dataprev**:
   - Requisição de canal oficial para consulta autorizada de margem consignável INSS.
3. **Serpro**:
   - Integração com a API de Consulta CPF e Validação Facial via `https://servicos.serpro.gov.br/api-serpro/`.
4. **Open Finance Brasil**:
   - Certificação de software e credenciamento no diretório central Open Finance.
