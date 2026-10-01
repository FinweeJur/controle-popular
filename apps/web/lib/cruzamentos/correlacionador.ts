/**
 * apps/web/lib/cruzamentos/correlacionador.ts
 *
 * Motor analítico de cruzamento de dados públicos em linguagem leiga:
 * - Educação (IDEB) × referência do ciclo
 * - Saúde (CNES/Leitos) × Segurança (SINESP/homicídios)
 * - Finanças (repasses federais) × população
 *
 * ═══ AS TRÊS REGRAS QUE GOVERNAM ESTE ARQUIVO ═══
 *
 * 1. **Nada é calculado sobre dado inventado.** População e meta de IDEB
 *    vêm da fonte; se não vêm, o card volta `sem-dado`. Antes havia
 *    `?? 50000` e `?? 5.5` — números digitados à mão produzindo taxa de
 *    homicídios por 100 mil hab. e comparação com uma referência que
 *    ninguém mediu (AGENTS.md §8: número na tela vem de constante medida
 *    com data).
 * 2. **Lacuna tem selo próprio.** `sem-dado` ≠ `neutro`: o leitor sob
 *    estresse não pode confundir "o portal não tem esse dado" com "está
 *    tudo bem" (AGENTS.md §7).
 * 3. **Limiar é critério editorial e se declara.** Os números de corte
 *    abaixo não vêm de DataSUS, INEP, SINESP nem Tesouro — são decisão
 *    deste portal, datada, e por isso a constante leva nome e o card
 *    exibe o critério. A fonte oficial entra em `indicadoresEnvolvidos`
 *    como origem do DADO, nunca do corte.
 *
 * Fontes dos dados: INEP (IDEB), DATASUS/CNES (leitos), SINESP/MJSP
 * (homicídios), Transferegov/SICONFI (transferências).
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

/* ═══ Critérios editoriais (decisão do portal, não fonte oficial) ═══
 * Datados em 01/10/2026. Mudou o valor, muda a data e a nota de revisão. */

/** Homicídios por 100 mil hab. a partir do qual a rede é considerada sob pressão. */
const LIMIAR_HOMICIDIOS_100MIL = 25;
/** Leitos SUS por mil hab. abaixo do qual a cobertura é considerada baixa. */
const LIMIAR_LEITOS_MIL = 1.5;
/** Diferença de IDEB (pontos) abaixo da meta que dispara atenção. */
const LIMIAR_DIF_IDEB_ATENCAO = -0.5;
/** Repasse federal per capita anual — informativo, sem juízo de valor. */
const LIMIAR_REPASSE_PER_CAPITA = 1500;

const CRITERIO_HOMICIDIOS_LEITOS = `critério do portal: taxa > ${LIMIAR_HOMICIDIOS_100MIL} por 100 mil e < ${LIMIAR_LEITOS_MIL} leitos/mil (medido em 01/10/2026)`;
const CRITERIO_IDEB = `critério do portal: diferença < ${Math.abs(LIMIAR_DIF_IDEB_ATENCAO).toFixed(1)} ponto da meta (medido em 01/10/2026)`;
const CRITERIO_REPASSE = `informativo: critério de faixa do portal ${LIMIAR_REPASSE_PER_CAPITA} per capita (01/10/2026), sem juízo de valor`;

/** Número em português do Brasil — o leitor do portal lê vírgula, não ponto. */
function br(valor: number, casas = 0): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/**
 * Card de lacuna. A explicação diz o que faltou — lacuna declarada é
 * informação (AGENTS.md §7), não texto preenchido com prosa neutra.
 */
function semDado(
  titulo: string,
  formula: string,
  indicadores: string[],
  faltou: string
): CruzamentoMunicipalItem {
  return {
    titulo,
    formula,
    status: 'sem-dado',
    indicadoresEnvolvidos: indicadores,
    explicacao: `${faltou} O portal não estima: lacuna declarada no lugar de número tirado.`,
  };
}

/**
 * Cruza os dados disponíveis de um município em três cartões.
 *
 * Só calcula o que tem insumo completo; o que falta vira `sem-dado`.
 * @param dados valores já coletados — nenhum é preenchido aqui dentro.
 * @returns três `CruzamentoMunicipalItem`, sempre na mesma ordem.
 */
export function calcularCruzamentosMunicipais(
  dados: DadosMunicipioCruzamento
): CruzamentoMunicipalItem[] {
  const cruzamentos: CruzamentoMunicipalItem[] = [];

  // População medida: só ela serve de denominador. `?? 50000` fabricava a
  // taxa de homicídios e a de leitos de qualquer município sem censo.
  const pop = dados.populacao != null && dados.populacao > 0 ? dados.populacao : undefined;

  /* ── 1. EDUCAÇÃO × REFERÊNCIA DO CICLO ── */
  if (dados.idebAnosIniciais == null) {
    cruzamentos.push(
      semDado(
        'Desempenho Escolar (IDEB)',
        'IDEB × Referência do ciclo',
        ['INEP/MEC'],
        'O IDEB deste município ainda não foi consolidado pelo INEP para este ciclo.'
      )
    );
  } else if (dados.idebMeta == null) {
    cruzamentos.push(
      semDado(
        'Desempenho Escolar (IDEB)',
        'IDEB × Referência do ciclo',
        ['INEP/MEC'],
        'O valor do IDEB existe, mas a meta oficial do ciclo não: sem ela não há comparação legítima.'
      )
    );
  } else {
    const diferenca = dados.idebAnosIniciais - dados.idebMeta;
    const status = diferenca >= 0 ? 'positivo' : diferenca >= LIMIAR_DIF_IDEB_ATENCAO ? 'neutro' : 'atencao';

    // Só o fato medido. A versão anterior dizia "demonstra bom rendimento
    // escolar em relação à estrutura disponível" — a estrutura nunca foi
    // medida, e concluir a partir de dois números é o que a regra
    // editorial proíbe.
    const explicacao =
      diferenca >= 0
        ? `IDEB de ${br(dados.idebAnosIniciais, 1)}, ${br(diferenca, 1)} ponto acima da meta oficial de ${br(dados.idebMeta, 1)}.`
        : `IDEB de ${br(dados.idebAnosIniciais, 1)}, ${br(Math.abs(diferenca), 1)} ponto abaixo da meta oficial de ${br(dados.idebMeta, 1)}.`;

    cruzamentos.push({
      titulo: 'Desempenho Escolar × Referência Educacional',
      formula: 'IDEB real × Meta oficial do ciclo',
      explicacao,
      status,
      indicadoresEnvolvidos: ['IDEB Anos Iniciais', 'Censo Escolar (INEP)'],
      criterio: CRITERIO_IDEB,
    });
  }

  /* ── 2. SAÚDE × SEGURANÇA ── */
  if (pop == null) {
    cruzamentos.push(
      semDado(
        'Violência Urbana × Capacidade Hospitalar SUS',
        'Taxa de homicídios × Leitos SUS',
        ['CNES/DataSUS', 'SINESP VDE/MJSP'],
        'Sem população medida, não há como calcular taxa por habitante.'
      )
    );
  } else if (dados.totalLeitosSus == null || dados.totalHomicidiosAno == null) {
    cruzamentos.push(
      semDado(
        'Violência Urbana × Capacidade Hospitalar SUS',
        'Taxa de homicídios × Leitos SUS',
        ['CNES/DataSUS', 'SINESP VDE/MJSP'],
        'Faltou o total de leitos SUS ou o total de homicídios do ano.'
      )
    );
  } else {
    const razaoLeitosPorHab = (dados.totalLeitosSus / pop) * 1000;
    const taxaHomicidios = (dados.totalHomicidiosAno / pop) * 100000;
    const status =
      taxaHomicidios > LIMIAR_HOMICIDIOS_100MIL && razaoLeitosPorHab < LIMIAR_LEITOS_MIL
        ? 'atencao'
        : 'neutro';

    const explicacao =
      status === 'atencao'
        ? `Taxa de ${br(taxaHomicidios, 1)} mortes violentas por 100 mil hab. e ${br(razaoLeitosPorHab, 2)} leitos SUS por mil hab. — acima e abaixo, respectivamente, dos limites do critério ao lado.`
        : `Taxa de ${br(taxaHomicidios, 1)} mortes violentas por 100 mil hab. e ${br(razaoLeitosPorHab, 2)} leitos SUS por mil habitantes.`;

    cruzamentos.push({
      titulo: 'Violência Urbana × Capacidade Hospitalar SUS',
      formula: 'Homicídios ÷ população × Leitos SUS ÷ população',
      explicacao,
      status,
      indicadoresEnvolvidos: ['CNES/DataSUS', 'SINESP VDE/MJSP'],
      criterio: CRITERIO_HOMICIDIOS_LEITOS,
    });
  }

  /* ── 3. FINANÇAS × POPULAÇÃO ──
   * Receber transferência não é resultado bom nem ruim: é fato fiscal.
   * O status aqui é sempre informativo — o portal já caiu nessa armadilha
   * no "Repasse do Acordo", onde 827 das 853 cidades não têm relação com a
   * bacia e receber não significa ter sido atingida (AGENTS.md §7). */
  if (pop == null) {
    cruzamentos.push(
      semDado(
        'Repasses Públicos Per Capita',
        'Transferências da União ÷ População',
        ['Transferegov', 'SICONFI/Tesouro Nacional'],
        'Sem população medida, não há como repartir o repasse por habitante.'
      )
    );
  } else if (dados.repassesFederaisAnual == null) {
    cruzamentos.push(
      semDado(
        'Repasses Públicos Per Capita',
        'Transferências da União ÷ População',
        ['Transferegov', 'SICONFI/Tesouro Nacional'],
        'O total de transferências federais do ano não foi coletado para este município.'
      )
    );
  } else {
    const repassePerCapita = dados.repassesFederaisAnual / pop;

    cruzamentos.push({
      titulo: 'Repasses Públicos Per Capita × Financiamento Social',
      formula: 'Transferências da União ÷ População',
      explicacao: `Cerca de R$ ${br(repassePerCapita, 2)} por habitante por ano em transferências e programas federais. Faixa de referência do portal: ${br(LIMIAR_REPASSE_PER_CAPITA)} per capita.`,
      // Neutro por decisão: acima de 1500 não vira "Positivo".
      status: 'neutro',
      indicadoresEnvolvidos: ['Transferegov', 'SICONFI/Tesouro Nacional'],
      criterio: CRITERIO_REPASSE,
    });
  }

  return cruzamentos;
}
