/**
 * CORVEXA — Brazilian National Registry of Legal Entities (CNPJ) Utility & BrasilAPI Integration
 */

export interface BrasilApiCnpjResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_situacao_cadastral?: string;
  data_inicio_atividade?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  natureza_juridica?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  email?: string;
  porte?: string;
  capital_social?: number;
  qsa?: Array<{
    nome_socio: string;
    qualificacao_socio: string;
  }>;
}

/**
 * Validates Brazilian CNPJ format and check digits (Modulo 11)
 */
export function isValidCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false; // Rejeita sequências repetidas (11111111111111, etc.)

  // Primeiro dígito verificador
  let tamanho = 12;
  let numeros = clean.substring(0, tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(clean.charAt(12), 10)) return false;

  // Segundo dígito verificador
  tamanho = 13;
  numeros = clean.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(clean.charAt(13), 10)) return false;

  return true;
}

/**
 * Formats clean digits to CNPJ mask: 00.000.000/0001-00
 */
export function formatCNPJ(cnpj: string | undefined | null): string {
  if (!cnpj) return '';
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return cnpj;
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Queries BrasilAPI official endpoint with timeout and fallback
 */
export async function fetchCompanyByCnpj(cnpj: string): Promise<{
  success: boolean;
  data?: BrasilApiCnpjResponse;
  message?: string;
}> {
  const clean = cnpj.replace(/\D/g, '');
  if (!isValidCNPJ(clean)) {
    return { success: false, message: 'CNPJ inválido de acordo com o cálculo oficial da Receita Federal.' };
  }

  try {
    // Consulta direta à BrasilAPI pública (suporta CORS)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.status === 404) {
      return { success: false, message: 'CNPJ não encontrado na base pública da Receita Federal.' };
    }

    if (response.status === 429) {
      return { success: false, message: 'Limite de requisições excedido. Tente novamente em alguns segundos.' };
    }

    if (!response.ok) {
      return { success: false, message: `Erro ao consultar base pública (Status ${response.status}).` };
    }

    const data: BrasilApiCnpjResponse = await response.json();
    return { success: true, data };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: false, message: 'Tempo limite esgotado ao consultar a base de CNPJ. Verifique sua conexão.' };
    }
    return { success: false, message: 'Serviço de consulta de CNPJ temporariamente indisponível. Preencha manualmente.' };
  }
}
