/**
 * CORVEXA — Automated Unit & Integration Tests
 */

import { isValidCPF, calculateFinancialLoan } from '../src/utils/financial.ts';
import { isValidCNPJ, formatCNPJ } from '../src/utils/cnpj.ts';
import { isValidCEP, formatCEP } from '../src/utils/cep.ts';
import crypto from 'crypto';

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

  // 4. TESTES DO MOTOR DE CÁLCULO FINANCEIRO (TABELA PRICE & CET)
  const sim = calculateFinancialLoan(15000, 84, 0.0166);
  assert(sim.requestedAmount === 15000, 'Valor solicitado preservado');
  assert(sim.installmentsCount === 84, 'Prazo de 84 meses preservado');
  assert(sim.installmentValue > 300 && sim.installmentValue < 400, `Valor da parcela calculado na faixa esperada: R$ ${sim.installmentValue}`);
  assert(sim.totalRepayable > sim.requestedAmount, 'Total a pagar deve ser superior ao principal financiado');
  assert(sim.iofAmount > 0, `IOF calculado corretamente: R$ ${sim.iofAmount}`);
  assert(sim.cetAnnual > sim.annualInterestRate, 'CET anual deve ser superior à taxa nominal anual de juros');

  // 5. TESTE DE ANTECIPAÇÃO FGTS
  const fgtsSim = calculateFinancialLoan(5000, 5, 0.0179);
  assert(fgtsSim.installmentsCount === 5, 'Prazo de 5 parcelas de FGTS aceito');
  assert(fgtsSim.installmentValue > 1000 && fgtsSim.installmentValue < 1500, 'Parcela de antecipação FGTS calculada');

  // 6. TESTES DE SEGURANÇA E AUTENTICAÇÃO (HASH PBKDF2 & POLÍTICA DE SENHA)
  const salt = crypto.randomBytes(16).toString('hex');
  const hash1 = crypto.pbkdf2Sync('Corvexa@2026', salt, 10000, 64, 'sha512').toString('hex');
  const hash2 = crypto.pbkdf2Sync('Corvexa@2026', salt, 10000, 64, 'sha512').toString('hex');
  const wrongHash = crypto.pbkdf2Sync('WrongPassword', salt, 10000, 64, 'sha512').toString('hex');

  assert(hash1 === hash2, 'Hash criptográfico PBKDF2 determinístico com mesmo salt');
  assert(hash1 !== wrongHash, 'Senha incorreta produz hash divergente');
  assert(hash1.length === 128, 'Hash SHA-512 de 64 bytes formatado em hex possui 128 caracteres');

  // Verificação de força de senha
  function isStrongPassword(pwd: string): boolean {
    return pwd.length >= 6;
  }
  assert(isStrongPassword('Corvexa@2026'), 'Senha padrão Corvexa atende à política mínima');
  assert(!isStrongPassword('123'), 'Senha curta abaixo de 6 caracteres rejeitada');

  console.log(`\nRESULTADO DOS TESTES: ${passed} passaram, ${failed} falharam.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
