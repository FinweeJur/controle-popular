/**
 * CFEM — Compensação Financeira pela Exploração Mineral, por ente e por ano.
 *
 * Fonte oficial: ANM (Agência Nacional de Mineração), dados abertos,
 * arquivo `CFEM_Distribuicao.csv` —
 * https://dadosabertos.anm.gov.br/CFEM/CFEM_Distribuicao.csv
 *
 * O JSON (`apps/web/data/anm-cfem.json`) é DADO DERIVADO: o CSV da ANM tem
 * uma linha por distribuição/mês (2.239.128 linhas na coleta de 18/11/2026) e
 * o agregador soma por ente e por ano. Não editar o JSON à mão — mudar o dado
 * é rodar o agregador de novo. `apps/web/data` está em `DIRETORIOS_DADO` do
 * `scripts/checar-dado-pessoal-em-dado.py`, então a varredura de CPF mod-11
 * cobre este arquivo no pre-push e na CI.
 *
 * ═══ O QUE ESTE NÚMERO É (E NÃO É) ═══
 *
 * 1. É REPASSE, não aplicação. Diz quanto o ente recebeu da CFEM — não como
 *    gastou. Esta tela nunca afirma destino do dinheiro.
 * 2. É NOMINAL. Não há correção monetária: somar 2007 com 2024 superestima o
 *    poder de compra do passado.
 * 3. NÃO É ARRECADAÇÃO. O rateio da Lei 13.540/2017 reparte o que a ANM
 *    arrecadou entre União, estado, município produtor e municípios afetados,
 *    com defasagem — são contas diferentes.
 * 4. O ANO CORRENTE É PARCIAL. 2026 vai até a data do arquivo na ANM.
 * 5. `total_brasil` inclui estados: a soma de `municipios` é MENOR, e por isso
 *    as duas colunas nunca são somadas como se fossem o mesmo universo.
 *
 * As duas conferências do arquivo (`conferencia`) fecham com 1 centavo de
 * diferença — arredondamento, medido em `cfem.test.ts`.
 */

import bruto from "../../data/anm-cfem.json";

export interface ResumoEnte {
  total: number;
  linhas: number;
}

export interface ResumoUf extends ResumoEnte {
  municipios: number;
}

export interface MunicipioCfem {
  /** Código IBGE de 7 dígitos, como a ANM publica. */
  codigo_ibge: string;
  /** Nome como a fonte grafa (caixa alta). */
  municipio: string;
  uf: string;
  total: number;
  por_ano: Record<string, number>;
}

interface ArquivoCfem {
  gerado_em: string;
  fonte: string;
  url_fonte: string;
  arquivo_fonte: { bytes: number; last_modified: string; cache: string };
  total_linhas_fonte: number;
  total_brasil: number;
  municipios_com_repasse: number;
  obs: string;
  ressalva_editorial: string;
  conferencia: {
    soma_resumo_por_uf: number;
    soma_resumo_por_ano: number;
    fecha_com_total: boolean;
    diferenca_arredondamento_centavos: number;
    linhas_sem_codigo_municipal: number;
  };
  resumo_por_ente: Record<string, ResumoEnte>;
  resumo_por_uf: Record<string, ResumoUf>;
  resumo_por_ano: Record<string, ResumoEnte>;
  municipios: MunicipioCfem[];
}

const ARQUIVO = bruto as unknown as ArquivoCfem;

const MUNICIPIOS = ARQUIVO.municipios;

/**
 * Repasse aos municípios — o total do resumo por ente, não a soma das 4.026
 * linhas. Os dois divergem em 9 centavos (arredondamento da própria fonte);
 * o resumo é o que fecha com `total_brasil`, e é o número que a página usa.
 */
const TOTAL_MUNICIPIOS = ARQUIVO.resumo_por_ente["Município"].total;

/** Anos cobertos, em ordem. O último é parcial. */
const ANOS = Object.keys(ARQUIVO.resumo_por_ano).sort();

/**
 * O ano do `Last-Modified` do CSV na ANM. Se for o último ano da série, ele
 * está incompleto — e a página diz isso pelo dado, não por uma frase digitada
 * que envelhece sozinha.
 */
const ANO_DO_ARQUIVO = new Date(ARQUIVO.arquivo_fonte.last_modified).getUTCFullYear();

export const CFEM = {
  totalBrasil: ARQUIVO.total_brasil,
  totalMunicipios: TOTAL_MUNICIPIOS,
  totalEstados: ARQUIVO.resumo_por_ente["UF"]?.total ?? 0,
  municipiosComRepasse: ARQUIVO.municipios_com_repasse,
  linhasFonte: ARQUIVO.total_linhas_fonte,
  linhasSemCodigoMunicipal: ARQUIVO.conferencia.linhas_sem_codigo_municipal,
  anos: ANOS,
  primeiroAno: ANOS[0],
  ultimoAno: ANOS[ANOS.length - 1],
  /** O último ano da série, quando ele ainda está em curso na fonte. */
  anoParcial:
    ANO_DO_ARQUIVO === Number(ANOS[ANOS.length - 1]) ? ANOS[ANOS.length - 1] : null,
  /** Data do agregado (carimbo escrito pelo agregador). */
  geradoEm: ARQUIVO.gerado_em,
  /** `Last-Modified` do CSV na ANM — a idade real do dado. */
  atualizadoNaFonte: ARQUIVO.arquivo_fonte.last_modified,
  bytesFonte: ARQUIVO.arquivo_fonte.bytes,
  urlFonte: ARQUIVO.url_fonte,
  fechaComTotal: ARQUIVO.conferencia.fecha_com_total,
  diferencaCentavos: ARQUIVO.conferencia.diferenca_arredondamento_centavos,
} as const;

/** Arredonda a 1 decimal — a casa que a tabela e o gráfico mostram. */
function umaCasa(n: number): number {
  return Math.round(n * 10) / 10;
}

export interface LinhaUf {
  uf: string;
  total: number;
  percentual: number;
  municipios: number;
  totalEstado: number;
}

/** Ranking de UF por repasse TOTAL (municípios do estado + ente estadual). */
export const RANKING_UF: LinhaUf[] = Object.entries(ARQUIVO.resumo_por_uf)
  .map(([uf, r]) => ({
    uf,
    total: r.total,
    percentual: umaCasa((r.total / ARQUIVO.total_brasil) * 100),
    municipios: r.municipios,
    // O que sobra para o estado é o total da UF menos o que foi aos municípios.
    totalEstado:
      r.total - MUNICIPIOS.filter((m) => m.uf === uf).reduce((s, m) => s + m.total, 0),
  }))
  .sort((a, b) => b.total - a.total);

/** Quantas UF somam os primeiros 80% do repasse nacional — calculado, não estimado. */
export const UFS_PARA_80: number = (() => {
  let acumulado = 0;
  for (let i = 0; i < RANKING_UF.length; i++) {
    acumulado += RANKING_UF[i].total;
    if (acumulado >= 0.8 * ARQUIVO.total_brasil) return i + 1;
  }
  return RANKING_UF.length;
})();

export interface LinhaAno {
  ano: string;
  total: number;
  linhas: number;
}

export const SERIE_ANUAL: LinhaAno[] = ANOS.map((ano) => ({
  ano,
  total: ARQUIVO.resumo_por_ano[ano].total,
  linhas: ARQUIVO.resumo_por_ano[ano].linhas,
}));

export interface LinhaMunicipio {
  codigoIbge: string;
  nome: string;
  uf: string;
  total: number;
  percentualBrasil: number;
  percentualMunicipios: number;
}

const MUNICIPIOS_ORDENADOS = [...MUNICIPIOS].sort((a, b) => b.total - a.total);

function linhaMunicipio(m: MunicipioCfem): LinhaMunicipio {
  return {
    codigoIbge: m.codigo_ibge,
    nome: m.municipio,
    uf: m.uf,
    total: m.total,
    percentualBrasil: umaCasa((m.total / ARQUIVO.total_brasil) * 100),
    percentualMunicipios: umaCasa((m.total / TOTAL_MUNICIPIOS) * 100),
  };
}

/** Os 20 municípios que mais receberam — a tabela da página. */
export const TOP_MUNICIPIOS: LinhaMunicipio[] = MUNICIPIOS_ORDENADOS.slice(0, 20).map(
  linhaMunicipio
);

/** Quantos municípios somam os primeiros 80% do repasse destinado a municípios. */
export const MUNICIPIOS_PARA_80: number = (() => {
  let acumulado = 0;
  for (let i = 0; i < MUNICIPIOS_ORDENADOS.length; i++) {
    acumulado += MUNICIPIOS_ORDENADOS[i].total;
    if (acumulado >= 0.8 * TOTAL_MUNICIPIOS) return i + 1;
  }
  return MUNICIPIOS_ORDENADOS.length;
})();

/** Quantos municípios somam os primeiros 50%. */
export const MUNICIPIOS_PARA_50: number = (() => {
  let acumulado = 0;
  for (let i = 0; i < MUNICIPIOS_ORDENADOS.length; i++) {
    acumulado += MUNICIPIOS_ORDENADOS[i].total;
    if (acumulado >= 0.5 * TOTAL_MUNICIPIOS) return i + 1;
  }
  return MUNICIPIOS_ORDENADOS.length;
})();

/** Ano de pico da série — usado no texto, sempre com o valor exato ao lado. */
export const ANO_DE_PICO = SERIE_ANUAL.reduce((a, b) => (b.total > a.total ? b : a));
