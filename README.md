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
  - Simulação indicativa pela Tabela Price, IOF pessoa física (0,38% + 0,0082% ao dia, até 365 dias), CET mensal e anual pela taxa interna de retorno e comparativo de bancos parceiros (Banrisul, Caixa, Santander, PAN, Itaú, BMG).
- **Funil Comercial em 17 Etapas**: Pipeline completo de vendas com visualização em lista detalhada e Kanban agrupado, transição auditada de fases com justificativa obrigatória e alertas de propostas estagnadas.
- **Esteira de Documentos & Formalização**: Checklist documental configurável por produto (RG/CNH, Comprovante de Residência, Extrato INSS / Holerite, CCB / Termo de Adesão e Selfie com Biometria) com aprovação e reprovação justificada.
- **Módulo Financeiro & Comissões**: Controle de comissões previstas, confirmadas pelo parceiro e recebidas em conta, repasse aos operadores e conciliação bancária por contrato.
- **Central de Integrações e APIs Bancárias**: Conectores documentados para Banrisul BPI, Dataprev, Serpro, Banco PAN e Open Finance. Todos começam como `Pendente de Homologação` até existir integração real.
- **Controle de Acesso RBAC**: Perfis de Administrador Master, Gerente Comercial, Operador, Financeiro e Auditor / Compliance, com permissões aplicadas no banco (Row Level Security), não apenas no menu.
- **Trilha de Auditoria & LGPD**: Registros gravados pelo próprio b## 2. Arquitetura

```
Navegador (React + Vite, hospedado na Vercel)
   │  supabase-js com a chave pública "anon"
   ▼
Supabase
   ├─ Auth ............ login, sessão, recuperação de senha
   ├─ Postgres + RLS .. isolamento por organização e permissões por perfil
   └─ Triggers ........ nº da proposta, comissão prevista, auditoria
```

Não há servidor Node próprio. Regras sensíveis ficam no banco
(`supabase/migrations/`), então não podem ser burladas pelo navegador.
O modelo conceitual completo de 34 entidades continua em `supabase/reference/`.

| Perfil | Clientes | Propostas | Comissões | Conectores | Auditoria |
|---|---|---|---|---|---|
| admin_master | ver / criar / editar / excluir | ver / editar todas | ver / editar | ver / editar | ver |
| gerente | ver / criar / editar | ver / editar todas | ver | ver / editar | — |
| operador | ver / criar / editar | ver todas, editar as suas | só as suas | ver | — |
| financeiro | ver | ver | ver / editar | ver | — |
| auditor | ver | ver | ver | ver | ver |

---

## 3. Configurar o Supabase (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. **SQL Editor** → cole e execute `supabase/migrations/20261028120000_corvexa_app.sql`.
3. **Authentication → Sign In / Providers → Email**: desative **"Allow new users to sign up"**
   (os usuários são criados pelo admin). Mesmo que fique ativo, contas novas entram
   **inativas** e sem acesso a dados.
4. **Authentication → URL Configuration**: em *Site URL* coloque o endereço do site na Vercel
   (e `http://localhost:5173` para desenvolvimento em *Redirect URLs*).
5. (Opcional) **Authentication → Email Templates → Reset Password**: inclua `{{ .Token }}`
   no texto para o usuário poder digitar o código na tela, além do link.
6. Crie o primeiro usuário em **Authentication → Users → Add user** e ative-o como admin
   no SQL Editor:

```sql
update public.profiles
set organization_id = '00000000-0000-0000-0000-000000000001',
    role = 'admin_master',
    active = true,
    full_name = 'Seu Nome'
where email = 'seu.email@empresa.com.br';
```

Para cada novo colaborador: crie o usuário no painel e rode o mesmo `update` com o
perfil adequado (`gerente`, `operador`, `financeiro` ou `auditor`). Para bloquear alguém,
`update public.profiles set active = false where email = '...';`.

---

## 4. Rodar localmente

Requisitos: Node.js 20+.

```bash
npm install
cp .env.example .env.local   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:5173
```

Outros comandos:

```bash
npm test        # testes de CPF, CNPJ, CEP, Tabela Price, IOF, CET e simulação
npm run lint    # checagem de tipos (tsc)
npm run build   # build de produção em dist/
```

> Nunca coloque a `service_role` key em variáveis `VITE_*`: elas vão para o JavaScript público.

---

## 5. Publicar na Vercel

1. Na Vercel: **Add New → Project** → importe o repositório `CORVEXA`.
2. Framework: **Vite** (já definido no `vercel.json`).
3. **Environment Variables**: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Cada pull request ganha um link de preview automático.
5. Volte ao Supabase e coloque a URL da Vercel em *Site URL* (passo 3.4).

O GitHub Pages deixa de ser usado; pode ser desativado em *Settings → Pages*.

---

## 6. Integrações futuras com parceiros

Consultas que exigem credencial (SERPRO, Dataprev, Banrisul BPI, Open Finance) **não podem**
rodar no navegador. O caminho é uma **Supabase Edge Function** guardando o segredo
(`supabase secrets set ...`) e chamada pelo app autenticado.

1. **Banrisul BPI**: catálogo em `https://developers.banrisul.com.br/bpi/link/catalogo-apis.html`; requer credenciamento de correspondente e certificado mTLS.
2. **Dataprev**: canal oficial para consulta autorizada de margem consignável INSS.
3. **Serpro**: API de Consulta CPF via `https://servicos.serpro.gov.br/api-serpro/`.
4. **Open Finance Brasil**: certificação e registro no diretório central.

As taxas do simulador são referências internas: confirme as tabelas vigentes de cada
parceiro e os tetos legais (ex.: teto do consignado INSS definido pelo CNPS).
