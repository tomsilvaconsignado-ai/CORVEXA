/**
 * CORVEXA — Brazilian Postal Code (CEP) Utility & ViaCEP Integration
 */

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

export function formatCEP(cep: string | undefined | null): string {
  if (!cep) return '';
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cep;
}

export function isValidCEP(cep: string): boolean {
  const clean = cep.replace(/\D/g, '');
  return clean.length === 8;
}

export async function fetchAddressByCep(cep: string): Promise<{
  success: boolean;
  data?: ViaCepResponse;
  message?: string;
}> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    return { success: false, message: 'O CEP deve conter exatamente 8 dígitos numéricos.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, message: `Erro no servidor de CEP (Código ${response.status}). Preencha manualmente.` };
    }

    const data: ViaCepResponse = await response.json();
    if (data.erro) {
      return { success: false, message: 'CEP não encontrado na base de dados dos Correios.' };
    }

    return { success: true, data };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: false, message: 'Tempo limite esgotado ao consultar o CEP. Preencha os campos manualmente.' };
    }
    return { success: false, message: 'Não foi possível conectar ao serviço ViaCEP. Preencha manualmente.' };
  }
}
