/**
 * CORVEXA — Simulação indicativa multi-banco (roda no navegador).
 *
 * As taxas abaixo são REFERÊNCIAS internas para simulação. Antes de apresentar
 * ao cliente, confirme as tabelas vigentes de cada parceiro e os tetos legais
 * (ex.: teto do consignado INSS definido pelo CNPS).
 */
import { PartnerCondition, ProductCode, SimulationResult } from '../types/corban';
import { calculateFinancialLoan } from './financial';

export const PRODUCT_RATES: Record<ProductCode, { defaultRate: number; name: string }> = {
  consignado_inss: { defaultRate: 0.0166, name: 'Consignado INSS' },
  consignado_servidor: { defaultRate: 0.0175, name: 'Servidor Público' },
  consignado_clt: { defaultRate: 0.021, name: 'Crédito Trabalhador CLT' },
  saque_fgts: { defaultRate: 0.0179, name: 'Antecipação FGTS' },
  credito_pessoal: { defaultRate: 0.038, name: 'Crédito Pessoal' },
  portabilidade: { defaultRate: 0.0162, name: 'Portabilidade' },
  refinanciamento: { defaultRate: 0.0166, name: 'Refinanciamento' }
};

const PARTNER_BANKS: { code: string; name: string; rateDelta: number }[] = [
  { code: '041', name: 'Banrisul', rateDelta: -0.0004 },
  { code: '104', name: 'Caixa Econômica', rateDelta: -0.0002 },
  { code: '033', name: 'Santander / Olé', rateDelta: 0 },
  { code: '623', name: 'Banco PAN', rateDelta: 0.0003 },
  { code: '029', name: 'Itaú Consignado', rateDelta: 0.0001 },
  { code: '318', name: 'Banco BMG', rateDelta: 0.0002 }
];

const MIN_RATE = 0.0145;

export function simulateLoan(productCode: ProductCode, requestedAmount: number, installmentsCount: number): SimulationResult {
  const amount = Number(requestedAmount) || 10000;
  const term = Math.max(1, Math.round(Number(installmentsCount) || 84));
  const config = PRODUCT_RATES[productCode] || PRODUCT_RATES.consignado_inss;
  const base = calculateFinancialLoan(amount, term, config.defaultRate);

  const conditions: PartnerCondition[] = PARTNER_BANKS.map((bank) => {
    const rate = Math.max(MIN_RATE, config.defaultRate + bank.rateDelta);
    const calc = calculateFinancialLoan(amount, term, rate);
    return {
      bankCode: bank.code,
      bankName: bank.name,
      installmentValue: calc.installmentValue,
      monthlyRate: rate,
      totalAmount: calc.totalRepayable
    };
  });

  // Recomenda a menor parcela (critério objetivo, sem favorecer banco fixo)
  const best = conditions.reduce((a, b) => (b.installmentValue < a.installmentValue ? b : a));
  best.isRecommended = true;

  return {
    id: `sim-${Date.now()}`,
    productCode,
    productName: config.name,
    ...base,
    conditions,
    simulationType: 'indicativa',
    createdAt: new Date().toISOString()
  };
}
