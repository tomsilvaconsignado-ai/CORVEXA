/**
 * CORVEXA — Motor de cálculo financeiro (Tabela Price, IOF e CET)
 *
 * Os valores são INDICATIVOS. A proposta oficial (CCB) sempre segue o cálculo
 * do banco parceiro, que pode considerar datas reais de liberação e vencimento,
 * tarifas e seguros.
 */

export function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false; // Sequence rejection (11111111111, etc.)

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/** IOF pessoa física (Decreto 6.306/2007): alíquota adicional fixa + alíquota diária limitada a 365 dias. */
export const IOF_ADDITIONAL_RATE = 0.0038;
export const IOF_DAILY_RATE = 0.000082;
export const IOF_MAX_DAYS = 365;
const DAYS_PER_INSTALLMENT = 30;

const round2 = (v: number) => Math.round(v * 100) / 100;
const round4 = (v: number) => Math.round(v * 10000) / 10000;

/** Parcela pela Tabela Price. */
export function pricePayment(principal: number, monthlyRate: number, n: number): number {
  if (n <= 0) return 0;
  if (monthlyRate === 0) return principal / n;
  const pow = Math.pow(1 + monthlyRate, n);
  return (principal * monthlyRate * pow) / (pow - 1);
}

/**
 * Percentual de IOF sobre o principal financiado: alíquota fixa + diária sobre a
 * amortização de cada parcela, contando os dias até o vencimento (máx. 365).
 */
export function iofRateOnPrincipal(monthlyRate: number, n: number): number {
  const pmt = pricePayment(1, monthlyRate, n);
  let balance = 1;
  let daily = 0;
  for (let k = 1; k <= n; k++) {
    const interest = balance * monthlyRate;
    const amortization = pmt - interest;
    balance -= amortization;
    daily += amortization * IOF_DAILY_RATE * Math.min(k * DAYS_PER_INSTALLMENT, IOF_MAX_DAYS);
  }
  return IOF_ADDITIONAL_RATE + daily;
}

/** Taxa interna de retorno mensal: valor liberado = Σ parcela / (1 + i)^k. */
export function monthlyIrr(netReleased: number, installment: number, n: number): number {
  let lo = 0;
  let hi = 1;
  for (let iter = 0; iter < 200; iter++) {
    const mid = (lo + hi) / 2;
    const pv = mid === 0 ? installment * n : (installment * (1 - Math.pow(1 + mid, -n))) / mid;
    if (pv > netReleased) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function calculateFinancialLoan(
  requestedAmount: number,
  installmentsCount: number,
  monthlyRate: number
) {
  const n = installmentsCount;

  // O cliente recebe o valor solicitado; o IOF é financiado junto (F = valor / (1 - %IOF)).
  const iofPct = iofRateOnPrincipal(monthlyRate, n);
  const totalFinanced = requestedAmount / (1 - iofPct);
  const iofAmount = round2(totalFinanced - requestedAmount);

  const installmentValue = round2(pricePayment(totalFinanced, monthlyRate, n));
  const totalRepayable = round2(installmentValue * n);
  const totalInterest = round2(totalRepayable - totalFinanced);

  const annualInterestRate = round4(Math.pow(1 + monthlyRate, 12) - 1);

  // CET: taxa que iguala o valor efetivamente liberado ao fluxo de parcelas.
  const cetMonthly = round4(monthlyIrr(requestedAmount, installmentValue, n));
  const cetAnnual = round4(Math.pow(1 + cetMonthly, 12) - 1);

  return {
    requestedAmount,
    netAmount: requestedAmount,
    installmentsCount,
    monthlyInterestRate: monthlyRate,
    annualInterestRate,
    installmentValue,
    totalRepayable,
    totalInterest,
    iofAmount,
    cetMonthly,
    cetAnnual
  };
}
