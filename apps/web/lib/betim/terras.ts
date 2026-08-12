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
 *
 * ═══ O QUE MUDOU EM 2026-08-12 ═══
 *
 * A planilha do gate fechou: as 23 áreas que faltavam, do recorte DIRIGIDO
 * (compactas ≥ 100 ha), foram julgadas. Deram 6 falsos em 23 = 26,1%.
 *
 * ESSE 26,1% NÃO É A TAXA, e é por isso que ele mora num campo separado em vez
 * de ser somado aos 40. O recorte dirigido escolhe as áreas mais compactas de
 * propósito — justamente a forma que o erro (faixa de estrada) não tem. Ele
 * descreve o MELHOR CASO do método. Juntar os dois num "18 em 63 = 28,6%"
 * seria diluir a medida honesta com uma amostra escolhida a dedo. A taxa
 * publicada continua sendo, e só pode ser, a do recorte aleatório.
 *
 * O que os 23 acrescentam é força à causa: `faixa_de_via` responde por
 * **18 dos 18** falso-positivos dos dois recortes. Água, fresta de geometria e
 * mancha urbana não apareceram uma única vez em 63 julgamentos.
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
  causaDominante:
    "faixa de estrada entrando no polígono — 18 dos 18 falso-positivos, somando os dois recortes",
  /**
   * Recorte DIRIGIDO (compactas ≥ 100 ha), julgado em 2026-08-12.
   *
   * Campo separado e nunca somado ao de cima: descreve o melhor caso do
   * método, não a taxa. Ver o bloco de comentário acima.
   */
  dirigido: {
    falsoPositivos: 6,
    julgados: 23,
    /** 6/23 */
    taxaPct: 26.1,
    medidoEm: "2026-08-12",
  },
  /**
   * A correção da causa única JÁ EXISTE no pipeline — e ainda NÃO está no dado
   * que este portal publica.
   *
   * Em 2026-08-12 a faixa de via virou exclusão de produção no pipeline
   * (camadas de sistema viário do IDE-Sisema, largura vinda do dado). Medido
   * em Jaboticatubas: −6,8% de área e +105 polígonos, porque a estrada PARTE o
   * polígono em dois — a assinatura do erro parcial sendo desfeito.
   *
   * Mas aplicar isso à bacia inteira exige rebaixar o CAR dos 56 municípios,
   * que leva horas. Até essa rodada acontecer, as camadas publicadas aqui são
   * as de ANTES da correção, e ainda contêm os corredores de estrada que o
   * gate diagnosticou.
   *
   * Isto está escrito na tela, e não só aqui. Um portal que cobra procedência
   * dos outros não pode publicar um defeito que ele mesmo já diagnosticou,
   * mediu e sabe corrigir, sem dizer que ele está ali.
   */
  correcaoNoDadoPublicado: false,
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
