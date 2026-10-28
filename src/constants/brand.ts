/**
 * CORVEXA — Configurações Globais de Marca e Identidade Visual Oficial
 * Centraliza nome, slogans, cores e referências da logomarca oficial.
 */

export const BRAND_CONFIG = {
  name: 'CORVEXA',
  shortName: 'CORVEXA',
  legalName: 'CORVEXA Soluções em Tecnologia & Correspondente Bancário Ltda.',
  category: 'Plataforma Inteligente de Gestão para Correspondentes Bancários (CORBAN)',
  slogan: 'Conectando crédito, tecnologia e resultados.',
  tagline: 'Inteligência e Produtividade em Crédito',
  version: '2.0.0',
  supportEmail: 'suporte@corvexa.com.br',
  defaultBranch: 'Matriz Porto Alegre',
  domain: 'corvexa.com.br',
  
  // Paleta oficial CORVEXA extraída da logomarca
  colors: {
    primaryNavy: '#051026',    // Azul-marinho profundo da marca
    vibrantBlue: '#0260E8',    // Azul elétrico do 'V'
    brightCyan: '#00A3FF',     // Ciano e ápice do 'A'
    accent: '#059669',         // Verde para aprovações/sucesso
    background: '#F8FAFC',     // Fundo claro das áreas de trabalho
    surface: '#FFFFFF',
  },

  // Logomarca oficial
  logo: {
    alt: 'CORVEXA — Plataforma de Correspondente Bancário',
    url: '/assets/corvexa-logo.png',
    originalAssetUrl: '/assets/aistudio/Logotipo_tecnol_gico_CORVEXA_em_azul_41d47268.png',
    markText: 'CV',
    hasCustomImage: true,
  }
};
