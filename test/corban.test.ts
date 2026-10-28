/**
 * CORVEXA — Automated Unit & Integration Tests
 */

import { isValidCPF, calculateFinancialLoan, iofRateOnPrincipal } from '../src/utils/financial.ts';
import { simulateLoan } from '../src/utils/simulation.ts';
import { isValidCNPJ, formatCNPJ } from '../src/utils/cnpj.ts';
import { isValidCEP, formatCEP } from '../src/utils/cep.ts';

function runTests() {
  console.log('--- EXECUTANDO BATERIA DE TESTES DO CORVEXA (CEP, CPF, CNPJ & MOTOR FINANCEIRO) ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. TESTES DE VALIDAÇÃO OFICIAL DE CPF (MODULO 11)
  assert(isValidCPF('12345678909'), 'CPF válido (123.456.789-09) deve ser aceito');
  assert(isValidCPF('11144477735'), 'CPF válido (111.444.777-35) deve ser aceito');
  assert(!isValidCPF('11111111111'), 'CPF com dígitos repetidos (111.111.111-11) deve ser rejeitado');
  assert(!isValidCPF('00000000000'), 'CPF com dígitos zerados repetidos deve ser rejeitado');
  assert(!isValidCPF('12345678900'), 'CPF com dígito verificador incorreto deve ser rejeitado');
  assert(!isValidCPF('123'), 'CPF incompleto deve ser rejeitado');

  // 2. TESTES DE VALIDAÇÃO OFICIAL DE CNPJ (MODULO 11)
  assert(isValidCNPJ('00000000000191'), 'CNPJ válido Banco do Brasil (00.000.000/0001-91) deve ser aceito');
  assert(isValidCNPJ('33000167000101'), 'CNPJ válido Petrobras (33.000.167/0001-01) deve ser aceito');
  assert(isValidCNPJ('92702067000196'), 'CNPJ válido Banrisul (92.702.067/0001-96) deve ser aceito');
  assert(!isValidCNPJ('11111111111111'), 'CNPJ com dígitos repetidos (11.111.111/1111-11) deve ser rejeitado');
  assert(!isValidCNPJ('00000000000000'), 'CNPJ zerado deve ser rejeitado');
  assert(!isValidCNPJ('00000000000100'), 'CNPJ com dígito verificador incorreto deve ser rejeitado');
  assert(!isValidCNPJ('12345'), 'CNPJ com menos de 14 dígitos deve ser rejeitado');
  assert(formatCNPJ('00000000000191') === '00.000.000/0001-91', 'Máscara de CNPJ deve formatar corretamente');

  // 3. TESTES DE CEP (VIACEP INTEGRATION UTILS)
  assert(isValidCEP('90010000'), 'CEP válido de 8 dígitos numéricos deve ser aceito');
  assert(isValidCEP('90010-000'), 'CEP com traço formatado deve ser aceito');
  assert(!isValidCEP('90010'), 'CEP incompleto deve ser rejeitado');
  assert(formatCEP('90010000') === '90010-000', 'Máscara de CEP 00000-000 aplicada com sucesso');

  // 4. TESTES DO MOTOR DE CÁLCULO FINANCEIRO (TABELA PRICE, IOF & CET)
  const sim = calculateFinancialLoan(15000, 84, 0.0166);
  assert(sim.requestedAmount === 15000, 'Valor solicitado preservado');
  assert(sim.installmentsCount === 84, 'Prazo de 84 meses preservado');
  assert(sim.installmentValue > 300 && sim.installmentValue < 400, `Valor da parcela calculado na faixa esperada: R$ ${sim.installmentValue}`);
  assert(sim.totalRepayable > sim.requestedAmount, 'Total a pagar deve ser superior ao principal financiado');
  const iofPct = sim.iofAmount / sim.requestedAmount;
  assert(iofPct > 0.0038 && iofPct < 0.035, `IOF dentro do limite legal (0,38% + até 365 dias): ${(iofPct * 100).toFixed(2)}%`);
  assert(sim.cetAnnual > sim.annualInterestRate, 'CET anual deve ser superior à taxa nominal anual de juros');

  // Caso conferido à mão: 1 parcela, 30 dias, 2% a.m.
  // IOF% = 0,38% + 30 × 0,0082% = 0,626% → financiado = 1000 / (1 − 0,00626)
  const one = calculateFinancialLoan(1000, 1, 0.02);
  assert(one.iofAmount === 6.3, `IOF de 1 parcela em 30 dias = R$ 6,30 (obtido R$ ${one.iofAmount})`);
  assert(one.installmentValue === 1026.43, `Parcela única = R$ 1.026,43 (obtido R$ ${one.installmentValue})`);
  assert(Math.abs(one.cetMonthly - 0.0264) < 0.0001, `CET mensal pela TIR = 2,64% (obtido ${(one.cetMonthly * 100).toFixed(2)}%)`);

  // CET: o fluxo de parcelas descontado pelo CET deve igualar o valor liberado
  const pv = (sim.installmentValue * (1 - Math.pow(1 + sim.cetMonthly, -84))) / sim.cetMonthly;
  assert(Math.abs(pv - 15000) / 15000 < 0.005, `Valor presente das parcelas pelo CET ≈ valor liberado (R$ ${pv.toFixed(2)})`);

  // IOF diário limitado a 365 dias: prazos longos não ultrapassam ~3,38%
  assert(iofRateOnPrincipal(0.0166, 120) < 0.0038 + 0.000082 * 365 + 1e-9, 'IOF diário respeita o teto de 365 dias');

  // 5. TESTE DE ANTECIPAÇÃO FGTS
  const fgtsSim = calculateFinancialLoan(5000, 5, 0.0179);
  assert(fgtsSim.installmentsCount === 5, 'Prazo de 5 parcelas de FGTS aceito');
  assert(fgtsSim.installmentValue > 1000 && fgtsSim.installmentValue < 1500, 'Parcela de antecipação FGTS calculada');

  // 6. SIMULAÇÃO MULTI-BANCO
  const multi = simulateLoan('consignado_inss', 15000, 84);
  assert(multi.conditions.length === 6, 'Simulação compara 6 bancos parceiros');
  const recommended = multi.conditions.filter(c => c.isRecommended);
  const minInstallment = Math.min(...multi.conditions.map(c => c.installmentValue));
  assert(recommended.length === 1 && recommended[0].installmentValue === minInstallment, 'Banco recomendado é o de menor parcela');
  assert(multi.simulationType === 'indicativa', 'Simulação marcada como indicativa');

  console.log(`\nRESULTADO DOS TESTES: ${passed} passaram, ${failed} falharam.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
