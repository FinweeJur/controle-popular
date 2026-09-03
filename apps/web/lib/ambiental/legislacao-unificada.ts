import type { FonteLegislacaoAmbiental, LegislacaoAmbientalRow } from "@/lib/db/queries/legislacao-ambiental";
import type {
  NaturezaDireitoCritico,
  NormaDireitoCriticoRow,
  PrecedenteDireitoCriticoRow,
} from "@/lib/db/queries/direito-critico";
import { normalizarTipo } from "@/lib/ambiental/urn-lexml";

/**
 * Lógica PURA (sem React, sem banco) da unificação de `/ambiental/legislacao`
 * com `/ambiental/direito-critico` num painel só — pedido do dono: "é melhor
 * unificar os painéis de legislação estadual / nacional / proteção em um
 * só, filtrável por temas". Decisão tomada, não reaberta aqui.
 *
 * Vive em `lib/` (não em `app/`) e sem `"use client"` de propósito: é o que
 * permite testar esfera/tema/filtro com `vitest` sem montar componente —
 * mesmo padrão de `lib/terras/alertas.ts`/`lib/betim/redeProtecao.ts`. O
 * componente cliente (`BuscaLegislacaoUnificada.tsx`) só chama estas
 * funções e desenha o resultado.
 *
 * ═══ ESFERA — CAMPO DE PRIMEIRA CLASSE (pedido explícito da tarefa) ═══
 *
 * Era IMPLÍCITA até 14/08/2026: as três fontes de `ambiental_legislacao`
 * (ALMG, Semad, Siam) eram todas estaduais, e `esferaEstadual()` devolvia
 * a constante `"estadual"` sem sequer olhar a linha. Isso parou de valer
 * quando a MESMA tabela recebeu legislação FEDERAL — MMA/Conama e CNDH,
 * migration `0073`: a função continuaria devolvendo "estadual" e a tela
 * mentiria o rótulo de quase 9 mil normas federais.
 *
 * A esfera agora é COLUNA do banco (`ambiental_legislacao.esfera`, com
 * `check`), lida direto da linha por `esferaDaLegislacao`. O `check` do
 * Postgres e o tipo `EsferaLegislacao` daqui usam o MESMO vocabulário de
 * quatro valores — `municipal` fica reservado para o dia em que
 * `atos_oficiais` entrar, `internacional` é o que `direito_critico_*` já
 * usava. Nenhuma tabela de tradução entre banco e tela.
 *
 * ═══ POR QUE UNIÃO DE VOCABULÁRIOS, NÃO UM NOVO INVENTADO AQUI ═══
 *
 * As 6.378 normas estaduais já tinham 9 temas próprios (8 do pedido
 * original + `serras`, ver `etl/temas_ambientais.py` — carimbo 2026-08-13)
 * e as 45 linhas de direito crítico já tinham 7 (`etl/temas_direito_critico.py`).
 * `TEMA_LABEL_UNIFICADO` é a UNIÃO dos dois — não um vocabulário novo — e o
 * único slug que aparece nos dois lados, `serras`, é de propósito o MESMO
 * slug nos dois módulos Python: é o que faz o chip somar as duas fontes sem
 * tabela de tradução. Os outros 14 continuam distintos mesmo quando
 * parecidos (`recursos_hidricos` vs. `rios`, `fauna_flora` vs. `especies`)
 * porque o MÉTODO por trás de cada um é diferente — um é regra de
 * palavra-chave sobre 6.378 ementas administrativas, o outro é leitura
 * assistida por IA de um material curado só sobre barragens — fundir os
 * slugs fingiria uma origem comum que não existe.
 */

export type EsferaLegislacao = "municipal" | "estadual" | "nacional" | "internacional";

export const ESFERA_LABEL: Record<EsferaLegislacao, string> = {
  municipal: "Municipal",
  estadual: "Estadual",
  nacional: "Nacional",
  internacional: "Internacional",
};

/** Esfera de uma linha de `ambiental_legislacao`: vem da COLUNA `esfera`
 *  (migration 0073), não de um `case` sobre a fonte. O `??` cobre um caso
 *  só — linha lida de um banco anterior à migration, onde a coluna não
 *  existe: aí "estadual" é o default correto, porque as únicas fontes que
 *  existiam antes dela eram as três de Minas. Um valor fora do
 *  vocabulário (impossível pelo `check` do banco, mas o tipo da query é
 *  `string`) também cai em "estadual" em vez de quebrar a tela. */
export function esferaDaLegislacao(esfera: string | null | undefined): EsferaLegislacao {
  return esfera === "municipal" || esfera === "nacional" || esfera === "internacional"
    ? esfera
    : "estadual";
}

/** `natureza` de `direito_critico_*` já É a esfera (nacional/internacional)
 *  — só troca o nome do campo pro vocabulário unificado. */
export function esferaDaNatureza(natureza: NaturezaDireitoCritico): "nacional" | "internacional" {
  return natureza;
}

// ─── HIERARQUIA DAS NORMAS (pedido do dono, 03/09/2026) ───
//
// A ordenação "Tipo/classe" era alfabética sobre o `tipo` cru e as 5.595
// portarias do acervo federal engoliam leis e decretos. Aqui a classe do
// tipo vira PESO: 1 = topo da pirâmide (Constituição), 7 = ato de operação.
// A chave é o `tipo` NORMALIZADO por `normalizarTipo` de `urn-lexml.ts`
// (maiúsculo, sem acento, espaço único — a MESMA receita do ETL, que de
// quebra resolve "DECRETO LEI" -> "DECRETO-LEI"), casado por PREFIXO, o
// mais longo primeiro: "LEI COMPLEMENTAR 140/2011" tem que cair na banda 2,
// não na 3 do prefixo "LEI".
//
// `EMC` fica na banda 4 por decisão EXPLÍCITA do dono — o peso segue o
// pedido à letra; o RÓTULO exibido na tela continua "Emenda constitucional".
export const PESO_HIERARQUIA: Record<string, number> = {
  // 1 — Constituição e emendas
  CONSTITUICAO: 1,
  "EMENDA CONSTITUCIONAL": 1,
  // 2 — lei complementar
  "LEI COMPLEMENTAR": 2,
  LCP: 2,
  // 3 — leis
  LEI: 3,
  "LEI ORDINARIA": 3,
  "LEI DELEGADA": 3,
  // 4 — decretos e atos com força normativa geral do Executivo
  DECRETO: 4,
  "DECRETO-LEI": 4,
  "DECRETO NUMERADO": 4,
  "MEDIDA PROVISORIA": 4,
  MPV: 4,
  EMC: 4,
  // 5 — resoluções (Conama/CNDH) e decretos não numerados
  RESOLUCAO: 5,
  "DECRETO NAO NUMERADO": 5,
  // 6 — atos administrativos de execução (Ibama/ICMBio/MMA/CNDH/Semad)
  PORTARIA: 6,
  "INSTRUCAO NORMATIVA": 6,
  IN: 6,
  // 7 — recomendações, notas técnicas e o que não casa com prefixo nenhum
  RECOMENDACAO: 7,
  "NOTA TECNICA": 7,
};

/** Rótulo de classe para a pílula da tela — MESMAS chaves de
 *  `PESO_HIERARQUIA` (adicionar prefixo novo = adicionar nos DOIS mapas).
 *  Por prefixo e não por peso: "MEDIDA PROVISORIA" e "EMC" vivem na banda 4
 *  ao lado de DECRETO, e chamá-los de "Decreto" na tela seria mentir. */
const ROTULO_HIERARQUIA: Record<string, string> = {
  CONSTITUICAO: "Constituição",
  "EMENDA CONSTITUCIONAL": "Emenda constitucional",
  "LEI COMPLEMENTAR": "Lei complementar",
  LCP: "Lei complementar",
  LEI: "Lei",
  "LEI ORDINARIA": "Lei",
  "LEI DELEGADA": "Lei delegada",
  DECRETO: "Decreto",
  "DECRETO-LEI": "Decreto-lei",
  "DECRETO NUMERADO": "Decreto",
  "MEDIDA PROVISORIA": "Medida provisória",
  MPV: "Medida provisória",
  EMC: "Emenda constitucional",
  RESOLUCAO: "Resolução",
  "DECRETO NAO NUMERADO": "Decreto",
  PORTARIA: "Portaria",
  "INSTRUCAO NORMATIVA": "Instrução normativa",
  IN: "Instrução normativa",
  RECOMENDACAO: "Recomendação",
  "NOTA TECNICA": "Nota técnica",
};

// Mais longo primeiro — é o que faz "LEI COMPLEMENTAR" vencer "LEI" no
// casamento por prefixo. Computado uma vez, na carga do módulo.
const CHAVES_HIERARQUIA = Object.keys(PESO_HIERARQUIA).sort((a, b) => b.length - a.length);

const PESO_SEM_TIPO = 7;

/** Banda hierárquica do tipo (1 = Constituição … 7 = outros atos). Tipo
 *  vazio ou sem prefixo conhecido cai na banda 7 — "outros" é banda
 *  legítima, não erro. */
export function pesoHierarquia(tipo: string): number {
  const t = normalizarTipo(tipo);
  if (!t) return PESO_SEM_TIPO;
  for (const k of CHAVES_HIERARQUIA) {
    if (t.startsWith(k)) return PESO_HIERARQUIA[k];
  }
  return PESO_SEM_TIPO;
}

/** Rótulo da classe hierárquica ("Portaria", "Lei", "Decreto"…) para a
 *  pílula da tela, ou `null` quando o tipo não casa com prefixo nenhum —
 *  `null` quer dizer "mostre o tipo cru", nunca invente classe. */
export function rotuloHierarquia(tipo: string): string | null {
  const t = normalizarTipo(tipo);
  if (!t) return null;
  for (const k of CHAVES_HIERARQUIA) {
    if (t.startsWith(k)) return ROTULO_HIERARQUIA[k];
  }
  return null;
}

/** Peso da ESFERA na ordenação hierárquica — valores do pedido à letra:
 *  internacional primeiro, depois nacional, estadual, municipal. */
export const PESO_ESFERA: Record<EsferaLegislacao, number> = {
  internacional: 1,
  nacional: 2,
  estadual: 3,
  municipal: 4,
};

// ─── OS 9 TEMAS DA LEGISLAÇÃO ESTADUAL — cópia TS de `TEMA_LABELS` em
// `etl/temas_ambientais.py` (o componente cliente não importa Python; ver
// nota em `BuscaLegislacaoAmbiental.tsx` original, mesma decisão aqui).
export const TEMA_LABEL_ESTADUAL: Record<string, string> = {
  mineracao: "Mineração",
  energia: "Energia",
  agropecuaria: "Agropecuária",
  barragens: "Barragens",
  recursos_hidricos: "Recursos Hídricos",
  residuos: "Resíduos",
  unidades_conservacao: "Unidades de Conservação",
  fauna_flora: "Fauna e Flora",
  serras: "Proteção de serras",
};

// ─── OS 7 TEMAS DE DIREITO PROTEGIDO — cópia TS de `TEMA_LABELS` em
// `etl/temas_direito_critico.py`.
export const TEMA_LABEL_CRITICO: Record<string, string> = {
  rios: "Rios e recursos hídricos",
  indigena: "Proteção indígena",
  quilombola: "Proteção quilombola",
  povos_tradicionais: "Povos e comunidades tradicionais",
  direitos_humanos: "Direitos humanos",
  serras: "Proteção de serras",
  especies: "Espécies (flora e fauna)",
};

/** União dos dois vocabulários — `serras` aparece uma vez só porque o
 *  slug é idêntico nos dois lados (de propósito, ver docstring). Ordem:
 *  primeiro os 9 estaduais (corpus maior), depois os 6 exclusivos do
 *  direito crítico que não repetem `serras`. */
export const TEMA_LABEL_UNIFICADO: Record<string, string> = {
  ...TEMA_LABEL_ESTADUAL,
  ...TEMA_LABEL_CRITICO,
};

export const TEMA_ORDEM_UNIFICADO = [
  ...Object.keys(TEMA_LABEL_ESTADUAL),
  ...Object.keys(TEMA_LABEL_CRITICO).filter((t) => !(t in TEMA_LABEL_ESTADUAL)),
];

export type ClasseItemLegislacao = "estadual" | "critica" | "precedente";

interface ItemBase {
  /** Chave estável de React/dedupe: `${classe}-${idFonte-ou-chaveDedup}`. */
  chave: string;
  esfera: EsferaLegislacao;
  /** Peso da esfera na ordenação hierárquica (`PESO_ESFERA`): 1 =
   *  internacional, 2 = nacional, 3 = estadual, 4 = municipal.
   *  Pré-calculado em `unificarItens` — o sort do default não recomputa. */
  esferaPeso: number;
  /** Banda hierárquica do TIPO da norma (`pesoHierarquia`): 1 =
   *  Constituição … 7 = recomendação/nota técnica/outros. Crítica e
   *  precedente não têm coluna `tipo` — ficam na banda "outros" da sua
   *  esfera e preservam a ordem curada da fonte (sort estável). */
  hierarquia: number;
}

/** O nome da CLASSE continua "estadual" por compatibilidade com o filtro
 *  já publicado, mas ela agora quer dizer "linha de `ambiental_legislacao`"
 *  — que pode ser estadual (ALMG/Semad/Siam) ou nacional (MMA/CNDH). Por
 *  isso `esfera` aqui é o tipo inteiro, não mais o literal `"estadual"`. */
export interface ItemEstadual extends ItemBase {
  classe: "estadual";
  row: LegislacaoAmbientalRow;
}

export interface ItemCritico extends ItemBase {
  classe: "critica";
  esfera: "nacional" | "internacional";
  row: NormaDireitoCriticoRow;
}

export interface ItemPrecedente extends ItemBase {
  classe: "precedente";
  esfera: "nacional" | "internacional";
  row: PrecedenteDireitoCriticoRow;
}

export type ItemLegislacaoUnificada = ItemEstadual | ItemCritico | ItemPrecedente;

/** Junta as três listas (já buscadas do banco, uma query por tabela — ver
 *  `page.tsx`) num array só, cada item com `esfera` resolvida, os pesos da
 *  ordenação hierárquica (`esferaPeso`/`hierarquia`, computados AQUI uma
 *  vez por item — ordenar 15 mil normas não pode recomputar nada) e uma
 *  chave estável. Não funde, não deduplica ENTRE classes — um item
 *  estadual e um item de direito crítico nunca são o "mesmo" registro; a
 *  deduplicação DENTRO da legislação estadual (mesma norma em ALMG+Semad+Siam)
 *  já é outra função (`chaveDedup`, ver `legislacao-ambiental.ts`) e continua
 *  intocada aqui. */
export function unificarItens(
  estaduais: LegislacaoAmbientalRow[],
  criticas: NormaDireitoCriticoRow[],
  precedentes: PrecedenteDireitoCriticoRow[]
): ItemLegislacaoUnificada[] {
  const itensEstaduais: ItemEstadual[] = estaduais.map((row, idx) => {
    const esfera = esferaDaLegislacao(row.esfera);
    return {
      classe: "estadual",
      esfera,
      esferaPeso: PESO_ESFERA[esfera],
      hierarquia: pesoHierarquia(row.tipo),
      // A chave é POSICIONAL (índice no array base, que nunca é reordenado —
      // filtrar só produz subconjunto). Já foi `chaveDedup`, e isso quebrou
      // com a chegada das fontes federais: `chave_dedup` NÃO é única por
      // construção — ela existe justamente para APONTAR repetição (a mesma
      // norma em duas fontes), e no MMA colide também dentro da própria
      // fonte (324 chaves cobrindo 772 registros, medido). React reclamava
      // de chave duplicada e podia omitir cards.
      chave: `estadual-${row.fonte}-${idx}`,
      row,
    };
  });
  const itensCriticos: ItemCritico[] = criticas.map((row) => ({
    classe: "critica",
    esfera: esferaDaNatureza(row.natureza),
    esferaPeso: PESO_ESFERA[esferaDaNatureza(row.natureza)],
    // `direito_critico_*` não tem coluna `tipo`: sem tipo declarado, a banda
    // é a dos "outros" (7). Dentro da esfera, o sort é estável e preserva a
    // ordem curada da fonte (Constituição primeiro) — precedente nenhum
    // desloca legislação.
    hierarquia: PESO_SEM_TIPO,
    chave: `critica-${row.idFonte}`,
    row,
  }));
  const itensPrecedentes: ItemPrecedente[] = precedentes.map((row) => ({
    classe: "precedente",
    esfera: esferaDaNatureza(row.natureza),
    esferaPeso: PESO_ESFERA[esferaDaNatureza(row.natureza)],
    hierarquia: PESO_SEM_TIPO,
    chave: `precedente-${row.idFonte}`,
    row,
  }));
  return [...itensEstaduais, ...itensCriticos, ...itensPrecedentes];
}

/** ═══ ORDENAÇÃO HIERÁRQUICA — o DEFAULT da busca unificada (pedido do
 *  dono, 03/09/2026: "primeiro Constituição, depois internacional, federal,
 *  estadual, local"; até hoje o default era a ordem da fonte e o sort
 *  "Tipo/classe" era alfabético, com 5.595 portarias engolindo a lista) ═══
 *
 *  Três chaves, nesta ordem:
 *  1. `esferaPeso` — internacional → nacional → estadual → municipal
 *     (`PESO_ESFERA`, valores do pedido à letra);
 *  2. `hierarquia` — banda do tipo: Constituição → lei complementar → lei →
 *     decreto/MP → resolução → portaria → outros (`pesoHierarquia`);
 *  3. data desc DENTRO da banda — a mais nova primeiro, como a fonte já
 *     ordenava. Sem data completa, o `ano` entra como fallback; sem nenhum
 *     dos dois, a norma vai pro FIM da banda (mesma regra de
 *     `lib/tabela/ordenar.ts`: dado ausente não sobe).
 *
 *  `Array.prototype.sort` do V8 é estável: crítica/precedente, que não têm
 *  `tipo` nem `data`, preservam a ordem curada dentro da própria esfera.
 *  Devolve lista NOVA (imutável), mesmo contrato de `ordenarPor`. */
export function ordenarPorHierarquia(
  itens: ItemLegislacaoUnificada[]
): ItemLegislacaoUnificada[] {
  const chaveData = (item: ItemLegislacaoUnificada): string => {
    if (item.classe !== "estadual") return "";
    return item.row.data ?? (item.row.ano ? String(item.row.ano) : "");
  };
  return [...itens].sort((a, b) => {
    if (a.esferaPeso !== b.esferaPeso) return a.esferaPeso - b.esferaPeso;
    if (a.hierarquia !== b.hierarquia) return a.hierarquia - b.hierarquia;
    const dataA = chaveData(a);
    const dataB = chaveData(b);
    if (dataA === dataB) return 0;
    if (!dataA) return 1;
    if (!dataB) return -1;
    return dataA > dataB ? -1 : 1;
  });
}

/** Texto de busca por palavra-chave — mesma lógica que cada Busca
 *  component antigo tinha, só que reunida num lugar testável. Chamador
 *  ainda aplica `semAcento()` (fica no componente, que já importa
 *  `lib/busca/normalizar`). */
export function textoBuscaDoItem(item: ItemLegislacaoUnificada): string {
  if (item.classe === "estadual") {
    const r = item.row;
    return [r.tipo, r.numero, r.ano, r.ementa, r.orgao].filter((v) => v !== null && v !== undefined).join(" ");
  }
  if (item.classe === "critica") {
    const r = item.row;
    return [r.numero, r.nomeCurto, r.nomeCompleto, r.artigos.map((a) => a.titulo).join(" ")]
      .filter(Boolean)
      .join(" ");
  }
  const r = item.row;
  return [r.tribunal, r.titulo, r.referencia, r.ementa, r.tags.join(" ")].filter(Boolean).join(" ");
}

export interface FiltroLegislacaoUnificada {
  /** Já normalizado (sem acento, minúsculo) — o componente faz a
   *  normalização antes de chamar, pra não duplicar `semAcento()` aqui. */
  termoNormalizado?: string;
  esfera?: EsferaLegislacao | "";
  tema?: string | "";
  classe?: ClasseItemLegislacao | "";
  fonte?: FonteLegislacaoAmbiental | "";
}

/** Filtro puro — recebe o texto de busca já normalizado por item (chamador
 *  decide como normalizar, ver `textoBuscaDoItem`) pra não acoplar este
 *  módulo a `semAcento`. */
export function filtrarItens(
  itens: ItemLegislacaoUnificada[],
  filtro: FiltroLegislacaoUnificada,
  normalizar: (s: string) => string
): ItemLegislacaoUnificada[] {
  const termo = filtro.termoNormalizado?.trim();
  return itens.filter((item) => {
    if (filtro.classe && item.classe !== filtro.classe) return false;
    if (filtro.esfera && item.esfera !== filtro.esfera) return false;
    if (filtro.tema && !item.row.temas.includes(filtro.tema)) return false;
    if (filtro.fonte && (item.classe !== "estadual" || item.row.fonte !== filtro.fonte)) return false;
    if (termo && !normalizar(textoBuscaDoItem(item)).includes(termo)) return false;
    return true;
  });
}

/** Contagem por tema sobre o corpus JÁ filtrado por tudo MENOS tema — é o
 *  que faz os chips mostrarem quantos itens cada tema teria dado o resto
 *  do filtro atual, mesmo padrão dos dois painéis originais. Temas sem
 *  nenhuma ocorrência aparecem com `0`, nunca somem do mapa — o pedido
 *  original do direito-crítico ("clicar mostra 'nenhum catalogado ainda',
 *  não some da lista") agora vale pros 15 temas, não só pros 7. */
export function contarPorTema(itens: ItemLegislacaoUnificada[]): Map<string, number> {
  const cont = new Map<string, number>();
  for (const t of TEMA_ORDEM_UNIFICADO) cont.set(t, 0);
  for (const item of itens) {
    for (const t of item.row.temas) cont.set(t, (cont.get(t) ?? 0) + 1);
  }
  return cont;
}

/** Contagem por esfera sobre o corpus (pro relato "X estaduais, Y
 *  nacionais, Z internacionais" no cabeçalho da página). */
export function contarPorEsfera(itens: ItemLegislacaoUnificada[]): Record<EsferaLegislacao, number> {
  const cont: Record<EsferaLegislacao, number> = { municipal: 0, estadual: 0, nacional: 0, internacional: 0 };
  for (const item of itens) cont[item.esfera] += 1;
  return cont;
}
