import * as q from "@/lib/db/queries/terras";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

/**
 * Composição do rollup de Terras para a zona Cidades — Terras é SEÇÃO de
 * `app/[municipio]/terras`, não zona própria (decisão de 2026-08-08: ver
 * `Controle Popular — Plano 2026-08 (Executar).md` no vault).
 *
 * `RESUMO_METODO` é cópia editorial fixa da regra de cada método — a
 * mesma disciplina de `congresso/rubrica.ts`: o leitor não deve inferir o
 * que "vazio_cadastral" significa a partir do nome da coluna.
 */
export const RESUMO_METODO: Record<string, string> = {
  vazio_cadastral:
    "Área do município que nenhum imóvel rural declarou no Cadastro Ambiental Rural (CAR), depois de removidas as classes de uso que não admitem destinação fundiária. Denominador: área municipal total.",
  candidatos_bacia:
    "Área certificada como pública (INCRA/SIGEF/SNCI) que é pastagem persistente — mesma classe do MapBiomas em todos os anos de 2020 a 2024. Denominador: só a área pública certificada, não o município inteiro.",
};

/**
 * A taxa de erro do método, medida a olho humano — e o critério contra o qual
 * ela é comparada.
 *
 * ═══ POR QUE ISTO É CONSTANTE DE CÓDIGO, E NÃO TEXTO SOLTO NUMA PÁGINA ═══
 *
 * A regra do projeto para publicar o Terras é que **a taxa de erro apareça na
 * mesma tela que o número**. Publicar "16.957 ha de vazio cadastral" sem
 * dizer que 30% da amostra checada era falso-positivo seria o oposto do que o
 * portal defende. Sendo constante única, a tela por cidade e o hub da zona
 * não podem divergir.
 *
 * ═══ DE ONDE VEM CADA NÚMERO ═══
 *
 * 40 polígonos sorteados ao acaso da bacia (semente fixa) e julgados um a um
 * por olho humano, sobre imagem de satélite, em 2026-08-09. Doze foram
 * considerados falso-positivo — todos do mesmo tipo, faixa de estrada
 * entrando no vazio. O intervalo é Wilson 95%.
 *
 * O TETO DE 33% É DECISÃO, NÃO MEDIÇÃO. Era 25%, teto herdado do
 * PLANO-MESTRE, e passou a 33% por decisão do usuário em 2026-08-10 — a taxa
 * medida não mudou junto. Está separado aqui porque a tela precisa dizer as
 * duas coisas sem confundi-las.
 */
export const TAXA_ERRO_G0 = {
  falsoPositivos: 12,
  julgados: 40,
  /** 12/40 */
  taxaPct: 30.0,
  ic95: [18.1, 45.4] as const,
  criterioPct: 33,
  medidoEm: "2026-08-09",
  /** O erro tem causa única, e isso é informação útil para quem lê. */
  causaDominante: "faixa de estrada entrando no polígono — 12 dos 12 casos",
};

export interface VazioMunicipioResumo {
  metodo: string;
  resumoMetodo: string;
  recorte: string;
  areaUniversoHa: number;
  areaCandidataHa: number;
  percentual: number;
  qtdPoligonos: number;
  proveniencia: string;
  metodoVersaoData: string;
}

/**
 * `null` = banco não configurado (mesmo sinal de sempre). Array vazio =
 * banco respondeu e este município não tem linha nenhuma ainda — a
 * página distingue os dois, nunca funde "sem dado" com "não sei".
 */
export async function vazioResumoPorMunicipio(
  idMunicipio: IdMunicipio
): Promise<VazioMunicipioResumo[] | null> {
  const linhas = await q.vazioPorMunicipio(idMunicipio);
  if (linhas === null) return null;
  return linhas.map((l) => ({
    metodo: l.metodo,
    resumoMetodo: RESUMO_METODO[l.metodo] ?? l.metodo,
    recorte: l.recorte,
    areaUniversoHa: Number(l.area_universo_ha),
    areaCandidataHa: Number(l.area_candidata_ha),
    percentual: Number(l.area_universo_ha) > 0
      ? (Number(l.area_candidata_ha) / Number(l.area_universo_ha)) * 100
      : 0,
    qtdPoligonos: l.qtd_poligonos,
    proveniencia: l.proveniencia,
    metodoVersaoData: l.metodo_versao_data,
  }));
}
