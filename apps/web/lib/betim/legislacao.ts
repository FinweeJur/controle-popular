import { atosOficiais } from "@/lib/db/queries/betim";
import { TEMA_LABELS, type ContagemTema } from "@/lib/betim/temas";
import {
  analisesDeAtos,
  direitosDeAtos,
  type AnaliseAto,
  type DireitoContagem,
} from "@/lib/betim/legislacao-garantista";
import { viciosDeAtos, type VicioAto } from "@/lib/betim/legislacao-vicio";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface AtoRow {
  id: string;
  tipo: string | null;
  numero: string | null;
  ano: number | null;
  ementa: string | null;
  dataPublicacao: string | null;
  temas: string[] | null;
  /** Ausente = ato sem análise garantista — NÃO é o mesmo que rótulo "neutro". */
  analise?: AnaliseAto;
  /** Ausente = sem indício de vício legislativo (ou não analisado) — silêncio é o padrão. */
  vicio?: VicioAto;
  /**
   * Posição desta norma no GeoJSON da camada `normas-geolocalizadas`
   * (migration 0057) — `null` para a maioria (a ementa não citava lugar
   * reconhecível, ou a geocodificação não achou). Só quando presente a
   * lista mostra "Ver no mapa".
   */
  mapaIdx: number | null;
}

/**
 * O que a PÁGINA recebe: os quatro conjuntos de opção de filtro, o ranking de
 * áreas e os contadores. **Nenhuma norma.**
 *
 * ═══ POR QUE `atos` SAIU DAQUI ═══
 *
 * `page.tsx` entregava a coleção inteira como prop de `ListaLegislacao`, que é
 * componente de cliente. Num alvo estático isso não é "dado que a página usa":
 * é arquivo. O corpus vai serializado no HTML (markup renderizado + o flight
 * inline de `self.__next_f`), de novo no `.rsc` e uma terceira vez em
 * `segmentData["/_full"]` — as três cópias foram conferidas em `.cache` de
 * build real no commit `7544574`, que fez esta mesma migração em
 * `[municipio]/educacao`.
 *
 * O preço estava medido no build de 15/08/2026 (ver o cabeçalho de
 * `lib/deploy/tamanho-assets.ts`):
 *
 *     11 MiB   bh/camara/legislacao.cache
 *     9,5 MiB  diamantina/camara/legislacao.cache
 *     25 MiB   teto da Cloudflare Workers por asset (a trava do projeto avisa em 20)
 *
 * É UMA rota dinâmica só servindo todas as cidades, então nenhuma delas estava
 * a salvo: a que estourasse primeiro derrubaria o deploy de todas. E o corpus
 * de normas é o que mais cresce — `/ambiental/legislacao` foi de 6.378 para
 * 15.318 normas numa ingestão só, e o `.cache` foi a 35,5 MiB
 * (`docs/HANDOFF-PAYLOAD-LEGISLACAO.md`).
 *
 * O que ficou aqui é O(distintos), não O(acervo): categorias e anos são
 * dezenas, o ranking de áreas tem 27 temas no máximo, e `direitosDisponiveis`
 * é a rubrica. O custo da página parou de crescer com o número de normas.
 */
export interface LegislacaoResumo {
  categoriasDisponiveis: string[];
  anosDisponiveis: number[];
  /** Ranking de áreas (só dos atos que pegaram tema) — pro gráfico. */
  temas: ContagemTema[];
  /** Direitos da rubrica tocados por algum ato analisado — popula o filtro. */
  direitosDisponiveis: DireitoContagem[];
  /** Quantos atos desta cidade têm análise concluída — o denominador do filtro por direito. */
  atosAnalisados: number;
  /**
   * `false` quando a camada de análise não respondeu.
   *
   * Existe para separar dois estados que dão a MESMA lista vazia e
   * significam coisas opostas: "nenhum ato analisado toca este direito" e
   * "não deu para saber". Sem isso, `?direito=saude` com o banco fora do ar
   * imprimiria "nenhuma norma para esse filtro", que é afirmação falsa.
   */
  analiseOk: boolean;
  total: number;
  configured: boolean;
  ok: boolean;
}

/** As três facetas que se calculam varrendo os atos uma vez. */
export interface FacetasLegislacao {
  categoriasDisponiveis: string[];
  anosDisponiveis: number[];
  temas: ContagemTema[];
}

const FACETAS_VAZIAS: FacetasLegislacao = {
  categoriasDisponiveis: [],
  anosDisponiveis: [],
  temas: [],
};

const RESUMO_VAZIO: LegislacaoResumo = {
  ...FACETAS_VAZIAS,
  direitosDisponiveis: [],
  atosAnalisados: 0,
  analiseOk: false,
  total: 0,
  configured: false,
  ok: false,
};

interface RawRow {
  id: string;
  tipo: string | null;
  numero: string | null;
  ano: number | null;
  ementa: string | null;
  data_publicacao: string | null;
  temas: string[] | null;
  mapaIdx: number | null;
}

/**
 * As opções de filtro e o ranking de áreas, derivados dos atos numa varredura.
 *
 * Separado da consulta para poder ser testado — o projeto não usa mock de
 * banco (`vitest.config.ts` só coleta `lib/**`, e nenhum teste desta árvore
 * chama `vi.mock`). É a parte que a página continua mostrando depois de a
 * coleção sair do payload, então divergir aqui é oferecer no `<select>` um ano
 * que a lista não tem — ou esconder um que ela tem.
 *
 * O ranking por área e o filtro `?tema=` estiveram MORTOS desde que foram
 * escritos: a migration 0025, que cria `atos_oficiais.temas`, nunca tinha
 * rodado, e o `comColunaOpcional()` que protegia o select degradava em
 * silêncio para o ramo sem a coluna. A 0025 foi aplicada nos dois bancos e
 * as ementas classificadas com o classificador real do ETL
 * (`etl/temas.py`) — a mesma regra por palavra-chave das proposições e dos
 * contratos.
 *
 * 76 dos 660 atos de Betim pegam tema. Os outros são decretos de crédito
 * orçamentário, sem assunto identificável; a docstring do ETL registra
 * isso como esperado, não como falha do classificador.
 */
export function facetasDosAtos(atos: AtoRow[]): FacetasLegislacao {
  const categoriasDisponiveis = [
    ...new Set(atos.map((a) => a.tipo).filter((t): t is string => Boolean(t))),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const anosDisponiveis = [
    ...new Set(atos.map((a) => a.ano).filter((a): a is number => a != null)),
  ].sort((a, b) => b - a);

  // Ranking de áreas sobre TODOS os atos, não sobre o filtro: a leitura
  // é "sobre o que a Prefeitura legisla no geral", e mudaria de sentido
  // se acompanhasse a categoria selecionada na tabela abaixo.
  const contagem = new Map<string, number>();
  for (const a of atos) {
    for (const t of a.temas ?? []) contagem.set(t, (contagem.get(t) ?? 0) + 1);
  }
  const temas: ContagemTema[] = [...contagem.entries()]
    .map(([tema, qtd]) => ({ tema, label: TEMA_LABELS[tema] ?? tema, qtd }))
    // Desempate por nome: sem ele, áreas com a mesma contagem saem na
    // ordem de aparição das linhas, e com SSG o gráfico muda a cada build.
    .sort((a, b) => b.qtd - a.qtd || a.tema.localeCompare(b.tema));

  return { categoriasDisponiveis, anosDisponiveis, temas };
}

/**
 * Tudo que sai do banco para esta rota, numa leitura só.
 *
 * `atos` NÃO vai para nenhuma página: quem o consome é
 * `app/[municipio]/camara/legislacao/dados/[arquivo]/route.ts`, que o grava
 * como índice fatiado. Ver o porquê em `LegislacaoResumo`.
 */
interface CargaLegislacao {
  atos: AtoRow[];
  direitosDisponiveis: DireitoContagem[];
  atosAnalisados: number;
  analiseOk: boolean;
  configured: boolean;
  ok: boolean;
}

const CARGA_VAZIA: CargaLegislacao = {
  atos: [],
  direitosDisponiveis: [],
  atosAnalisados: 0,
  analiseOk: false,
  configured: false,
  ok: false,
};

/**
 * Memoização por município, dentro do processo.
 *
 * ═══ POR QUE ELA MORA AQUI, E NÃO NO ROUTE HANDLER ═══
 *
 * Nas migrações anteriores o cache ficou no próprio `dados/[arquivo]/route.ts`
 * (`educacao`, `camara/proposicoes`), porque lá a página não precisava das
 * linhas: o resumo dela vinha de um `group by` barato. Aqui não dá para fazer
 * isso sem trocar a semântica de dois números — `categoriasDisponiveis`,
 * `anosDisponiveis` e o ranking de áreas saem da varredura dos atos, e
 * `atosAnalisados` é o tamanho do mapa de análises DESTES atos. Página e rota
 * de dados leem a mesma coisa.
 *
 * Com o cache no route handler, cada cidade pagaria a consulta duas vezes por
 * build (uma para a página, outra para as fatias) — e são três consultas
 * pesadas: `atosOficiais`, `analisesDeObjetos` e `viciosDeAtos`. Egress do Neon
 * é o teto declarado deste projeto; duplicá-lo para economizar um `Map` seria
 * pagar no recurso mais escasso.
 *
 * O que o cache custa: um processo longo (dev server) não vê ingestão nova sem
 * reiniciar. É a mesma troca já aceita nas quatro rotas de índice fatiado
 * anteriores, e no build — que é onde isto roda de verdade — o processo dura
 * minutos.
 */
const carga = new Map<string, Promise<CargaLegislacao>>();

async function carregar(idMunicipio: IdMunicipio): Promise<CargaLegislacao> {
  let pendente = carga.get(idMunicipio);
  if (!pendente) {
    pendente = carregarDoBanco(idMunicipio);
    carga.set(idMunicipio, pendente);
  }
  return pendente;
}

async function carregarDoBanco(idMunicipio: IdMunicipio): Promise<CargaLegislacao> {
  try {
    const data = await atosOficiais(idMunicipio);
    if (!data) return CARGA_VAZIA;

    const base = ((data ?? []) as RawRow[]).map((r) => ({
      id: r.id,
      tipo: r.tipo,
      numero: r.numero,
      ano: r.ano,
      ementa: r.ementa,
      dataPublicacao: r.data_publicacao,
      temas: r.temas,
      mapaIdx: r.mapaIdx,
    }));
    if (base.length === 0) return { ...CARGA_VAZIA, configured: true };

    // Análise garantista dos atos e o filtro por direito são isolados num
    // try/catch PRÓPRIO: se falharem, a lista de atos (que já funciona sem
    // isto) continua de pé, só sem badge de rótulo e sem filtro por
    // direito — degradação parcial em vez de derrubar a página inteira.
    let direitosDisponiveis: DireitoContagem[] = [];
    let analisePorAto = new Map<string, AnaliseAto>();
    let analiseOk = false;
    try {
      const [porAto, direitos] = await Promise.all([
        analisesDeAtos(idMunicipio, base.map((a) => a.id)),
        direitosDeAtos(idMunicipio),
      ]);
      analisePorAto = porAto;
      direitosDisponiveis = direitos;
      analiseOk = true;
    } catch {
      // segue com os mapas vazios e `analiseOk` falso — a página precisa
      // saber a diferença entre "não achou" e "não deu para procurar".
    }

    // Isolado do bloco acima: vício legislativo é análise INDEPENDENTE da
    // garantista (tabela própria), uma falhar não deve derrubar a outra.
    let vicioPorAto = new Map<string, VicioAto>();
    try {
      vicioPorAto = await viciosDeAtos(idMunicipio, base.map((a) => a.id));
    } catch {
      // segue com o mapa vazio — nenhum badge de vício aparece, o resto da
      // página continua de pé.
    }

    return {
      atos: base.map((a) => ({
        ...a,
        analise: analisePorAto.get(a.id),
        vicio: vicioPorAto.get(a.id),
      })),
      direitosDisponiveis,
      atosAnalisados: analisePorAto.size,
      analiseOk,
      configured: true,
      ok: true,
    };
  } catch {
    return { ...CARGA_VAZIA, configured: true };
  }
}

/** O que a página monta: filtros, ranking e contadores. Sem uma norma sequer. */
export async function getLegislacaoResumo(idMunicipio: IdMunicipio): Promise<LegislacaoResumo> {
  const c = await carregar(idMunicipio);
  if (!c.ok) return { ...RESUMO_VAZIO, configured: c.configured };
  return {
    ...facetasDosAtos(c.atos),
    direitosDisponiveis: c.direitosDisponiveis,
    atosAnalisados: c.atosAnalisados,
    analiseOk: c.analiseOk,
    total: c.atos.length,
    configured: true,
    ok: true,
  };
}

/**
 * As normas em si — hoje só para o índice fatiado
 * (`app/[municipio]/camara/legislacao/dados/[arquivo]/route.ts`) e para o
 * verificador de paridade. **Nenhuma página deve voltar a chamar isto**: é
 * exatamente o caminho que punha 11 MiB de normas no `.cache` de Belo
 * Horizonte, contra um teto de 25 MiB.
 */
export async function listarAtosDoMunicipio(idMunicipio: IdMunicipio): Promise<AtoRow[]> {
  return (await carregar(idMunicipio)).atos;
}
