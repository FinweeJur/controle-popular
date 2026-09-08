/**
 * apps/web/lib/cruzamentos/correlacionador.ts
 *
 * Motor analítico de cruzamento de dados públicos em linguagem leiga:
 * - Saúde (CNES / Leitos) × Segurança (SINESP VDE / Violência)
 * - Educação (IDEB / Censo Escolar) × Capacidade Socioeconômica
 * - Finanças (Repasses / Transferências) × Circulação Econômica
 *
 * Princípio editorial: linguagem acessível para o cidadão sem perder o rigor da fonte.
 */

import type { CruzamentoMunicipalItem } from '@/lib/eixos/types';

export interface DadosMunicipioCruzamento {
  codIbge7: string;
  nome: string;
  uf: string;
  populacao?: number;
  idebAnosIniciais?: number | null;
  idebMeta?: number | null;
  totalLeitosSus?: number | null;
  totalHomicidiosAno?: number | null;
  repassesFederaisAnual?: number | null; // em reais
  pibPerCapita?: number | null;
  escolasComInternetPct?: number | null;
}

export function calcularCruzamentosMunicipais(dados: DadosMunicipioCruzamento): CruzamentoMunicipalItem[] {
  const cruzamentos: CruzamentoMunicipalItem[] = [];
  const pop = dados.populacao ?? 50000;

  // 1. EDUCAÇÃO × CAPACIDADE SOCIOECONÔMICA (IDEB vs. Infraestrutura/Meta)
  if (dados.idebAnosIniciais != null) {
    const meta = dados.idebMeta ?? 5.5;
    const diferenca = dados.idebAnosIniciais - meta;
    const status = diferenca >= 0 ? 'positivo' : diferenca >= -0.5 ? 'neutro' : 'atencao';

    let explicacao = '';
    if (diferenca >= 0) {
      explicacao = `O município atingiu nota ${dados.idebAnosIniciais.toFixed(1)} no IDEB, superando a referência esperada de ${meta.toFixed(1)}. Isso demonstra bom rendimento escolar em relação à estrutura disponível.`;
    } else {
      explicacao = `O IDEB registrado é de ${dados.idebAnosIniciais.toFixed(1)}, abaixo da referência de ${meta.toFixed(1)} (diferença de ${Math.abs(diferenca).toFixed(1)} ponto). Indica necessidade de investimento prioritário na formação de professores e apoio pedagógico.`;
    }

    cruzamentos.push({
      titulo: 'Desempenho Escolar × Referência Educacional',
      formula: 'IDEB Real × Meta de Aprendizagem',
      explicacao,
      status,
      indicadoresEnvolvidos: ['IDEB Anos Iniciais', 'Censo Escolar (INEP)'],
    });
  } else {
    cruzamentos.push({
      titulo: 'Desempenho Escolar (IDEB)',
      formula: 'IDEB × Estrutura Escolar',
      explicacao: 'Dados do IDEB municipal ainda não consolidados ou em fase de apuração pelo INEP para este ciclo.',
      status: 'neutro',
      indicadoresEnvolvidos: ['INEP/MEC'],
    });
  }

  // 2. SAÚDE × SEGURANÇA (Pressão de Violência sobre Leitos Hospitalares)
  if (dados.totalLeitosSus != null && dados.totalHomicidiosAno != null) {
    const razaoLeitosPorHab = (dados.totalLeitosSus / pop) * 1000;
    const taxaHomicidios = (dados.totalHomicidiosAno / pop) * 100000;
    const status = taxaHomicidios > 25 && razaoLeitosPorHab < 1.5 ? 'atencao' : 'neutro';

    let explicacao = '';
    if (status === 'atencao') {
      explicacao = `Com taxa de ${taxaHomicidios.toFixed(1)} mortes violentas por 100 mil hab. e apenas ${razaoLeitosPorHab.toFixed(2)} leitos SUS por mil hab., o município enfrenta risco de sobrecarga da rede de urgência e emergência (duplo funil de vulnerabilidade).`;
    } else {
      explicacao = `A rede pública dispõe de ${razaoLeitosPorHab.toFixed(2)} leitos SUS por mil habitantes frente a uma taxa anual de ${taxaHomicidios.toFixed(1)} homicídios por 100 mil hab.`;
    }

    cruzamentos.push({
      titulo: 'Violência Urbana × Capacidade Hospitalar SUS',
      formula: 'Crimes Violentos (SINESP) × Leitos SUS (CNES)',
      explicacao,
      status,
      indicadoresEnvolvidos: ['CNES/DataSUS', 'SINESP VDE/MJSP'],
    });
  } else {
    // Estimativa com base no perfil padrão
    cruzamentos.push({
      titulo: 'Capacidade de Atendimento SUS',
      formula: 'Leitos Hospitalares × Demanda Populacional',
      explicacao: 'Acompanhamento contínuo da disponibilidade de leitos de internação e cobertura de atenção básica pelo Cadastro Nacional (CNES).',
      status: 'neutro',
      indicadoresEnvolvidos: ['CNES/DataSUS'],
    });
  }

  // 3. FINANÇAS PÚBLICAS × DINAMISMO LOCAL
  if (dados.repassesFederaisAnual != null) {
    const repassePerCapita = dados.repassesFederaisAnual / pop;
    const status = repassePerCapita > 1500 ? 'positivo' : 'neutro';

    cruzamentos.push({
      titulo: 'Repasses Públicos Per Capita × Financiamento Social',
      formula: 'Transferências da União ÷ População',
      explicacao: `O município recebe anualmente cerca de R$ ${Math.round(repassePerCapita).toLocaleString('pt-BR')} em transferências e programas federais por habitante, recursos vitais para sustentar serviços de saúde, educação e assistência social.`,
      status,
      indicadoresEnvolvidos: ['Transferegov', 'ComunicaBR / Presidência'],
    });
  } else {
    cruzamentos.push({
      titulo: 'Circulação Econômica e Orçamento',
      formula: 'Transferências Federais × Arrecadação Própria',
      explicacao: 'Análise da proporção entre recursos próprios arrecadados pelo município e transferências do Fundo de Participação dos Municípios (FPM).',
      status: 'neutro',
      indicadoresEnvolvidos: ['SICONFI/Tesouro Nacional', 'ComunicaBR'],
    });
  }

  return cruzamentos;
}
