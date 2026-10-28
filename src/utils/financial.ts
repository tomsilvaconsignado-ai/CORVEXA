/**
 * CORBAN 360 — Financial Calculation & Verification Engine
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

export function calculateFinancialLoan(
  requestedAmount: number,
  installmentsCount: number,
  monthlyRate: number
) {
  const i = monthlyRate;
  const n = installmentsCount;
  
  // IOF rate: 0.38% flat + daily rate (~2.45% average for loan periods)
  const iofRate = 0.0245;
  const iofAmount = Math.round(requestedAmount * iofRate * 100) / 100;
  const totalFinanced = requestedAmount + iofAmount;

  // Price Amortization Formula: PMT = PV * (i * (1 + i)^n) / ((1 + i)^n - 1)
  const pow = Math.pow(1 + i, n);
  const installmentValue = Math.round((totalFinanced * (i * pow) / (pow - 1)) * 100) / 100;
  const totalRepayable = Math.round(installmentValue * n * 100) / 100;
  const totalInterest = Math.round((totalRepayable - requestedAmount) * 100) / 100;

  // Annualized Nominal Rate
  const annualInterestRate = Math.round((Math.pow(1 + i, 12) - 1) * 10000) / 10000;

  // CET (Custo Efetivo Total)
  const cetMonthly = Math.round((i + 0.0018) * 10000) / 10000;
  const cetAnnual = Math.round((Math.pow(1 + cetMonthly, 12) - 1) * 10000) / 10000;

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
