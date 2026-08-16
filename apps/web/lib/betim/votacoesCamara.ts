import { totaisDeVotacoes, votacoesPaginadas, votosDeVotacoes } from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import { classificarVoto, normalizarRotulo } from "@/lib/presenca/vocabulario";

export const VOTACOES_PAGE_SIZE = 25;

export type LadoVoto = "sim" | "nao" | "abstencao" | "ausente" | "presidencia" | "outro";

/**
 * Classifica o TEXTO do voto num dos lados que a tela colore.
 *
 * Reaproveita `classificarVoto` (mesma fonte que `calcularPresenca` usa,
 * `lib/presenca/vocabulario.ts`) para separar ausência e presidência do
 * resto — duplicar essa lista aqui arriscaria a mesma deriva que o
 * comentário daquele módulo alerta: um rótulo novo da fonte cairia num
 * balde diferente em cada lugar do site sem erro nenhum.
 *
 * `sim`/`não`/`abstenção` são um recorte de apresentação, não de medida: não
 * precisam da mesma disciplina de normalização entre ETL e site que
 * `calcularPresenca` exige, porque nada aqui alimenta pontuação — só a cor
 * do rótulo na tela.
 */
function ladoDoVoto(voto: string | null): LadoVoto {
  const situacao = classificarVoto(voto);
  if (situacao === "ausente") return "ausente";
  if (situacao === "nao_e_voto") return "presidencia";
  const v = normalizarRotulo(voto);
  if (v.startsWith("sim")) return "sim";
  if (v.startsWith("abst")) return "abstencao";
  // "não votou" é presença sem registrar posição — não é voto "não".
  if (v.startsWith("nao") && !v.startsWith("nao votou")) return "nao";
  return "outro";
}

export interface VotoIndividual {
  vereadorId: string | null;
  slug: string | null;
  nome: string;
  partido: string | null;
  voto: string;
  origem: string;
  lado: LadoVoto;
}

export interface VotacaoRow {
  id: string;
  data: string | null;
  sessao: string | null;
  tipoVotacao: string | null;
  materia: string | null;
  ementa: string | null;
  resultado: string | null;
  presentes: number | null;
  placarSim: number | null;
  placarNao: number | null;
  placarAbstencao: number | null;
  placarBranco: number | null;
  linkFonte: string | null;
  votos: VotoIndividual[];
}

export interface VotacoesFilters {
  ano?: string;
  q?: string;
  page?: number;
  /** Default `VOTACOES_PAGE_SIZE`. `camara/votacoes` pede um valor bem
   *  maior pra buscar a cidade inteira de uma vez — ver
   *  `app/[municipio]/camara/votacoes/dados/[arquivo]/route.ts`. */
  porPagina?: number;
}

export interface VotacoesResult {
  rows: VotacaoRow[];
  total: number;
  /** false when DATABASE_URL is missing — data source not configured. */
  configured: boolean;
  /** false when configured but the query itself failed (e.g. table missing). */
  ok: boolean;
}

const VAZIO: VotacoesResult = { rows: [], total: 0, configured: false, ok: false };

/** Mesmo motivo de `sanitizeSearchTerm` em `lib/betim/contratos.ts`. */
function sanitizeSearchTerm(termo: string | undefined): string | undefined {
  const trimmed = termo?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/%/g, "");
}

/**
 * Votações nominais da Câmara — lista paginada, com o voto de CADA vereador
 * já anexado a cada votação.
 *
 * `votacoes_camara`/`votos_camara` existem desde a migration 0041 e
 * alimentam `contagemDeVotosPorVereador`/`votosPorRotuloDeDireito`
 * (presença e coerência do ranking), mas nenhuma tela mostra a votação
 * INDIVIDUAL — "fulano votou Sim 412 vezes" existia; "como cada um votou
 * NESTA votação" não. É essa segunda pergunta que esta função responde.
 *
 * DUAS consultas, nunca um join direto: `votacoesPaginadas` traz a página
 * (com `count(*) over ()` para o total) e `votosDeVotacoes` traz os votos
 * das votações DESTA página só. Um join multiplicaria cada votação em até
 * ~55 linhas (uma por vereador) e o `count(*) over ()` do total sairia
 * errado — mesmo motivo de `anexarSancoesCeis` em `lib/betim/contratos.ts`.
 *
 * Câmara que não publica voto individual (Belo Horizonte, ver a migration
 * 0041: "o voto individual NÃO EXISTE em fonte nenhuma") simplesmente não
 * tem linha em `votacoes_camara` — a página degrada para o estado vazio
 * comum, sem afirmar nada sobre o motivo (evita cravar um fato por cidade
 * no código, que é o erro que `fonteDaCamara()` já corrigiu uma vez).
 */
export async function fetchVotacoes(
  idMunicipio: IdMunicipio,
  filters: VotacoesFilters = {}
): Promise<VotacoesResult> {
  try {
    const filtros = {
      ano: filters.ano ? Number(filters.ano) : undefined,
      q: sanitizeSearchTerm(filters.q),
    };
    const rows = await votacoesPaginadas(idMunicipio, {
      ...filtros,
      pagina: filters.page,
      porPagina: filters.porPagina ?? VOTACOES_PAGE_SIZE,
    });
    if (!rows) return VAZIO;
    if (rows.length === 0) {
      // Mesmo cuidado de `fetchContratos`: sem linha na página, o total real
      // pode não ser zero (filtro que não casa nada É zero; página além da
      // última não é).
      const agregados = await totaisDeVotacoes(idMunicipio, filtros);
      return { rows: [], total: agregados?.total ?? 0, configured: true, ok: true };
    }

    const votosBrutos = await votosDeVotacoes(
      idMunicipio,
      rows.map((r) => r.id)
    );
    const votosPorVotacao = new Map<string, VotoIndividual[]>();
    for (const v of votosBrutos ?? []) {
      const nome = v.nome_urna ?? v.nome_fonte ?? "—";
      const lista = votosPorVotacao.get(v.votacao_id) ?? [];
      lista.push({
        vereadorId: v.vereador_id,
        slug: v.slug,
        nome,
        partido: v.partido_fonte,
        voto: v.voto,
        origem: v.origem,
        lado: ladoDoVoto(v.voto),
      });
      votosPorVotacao.set(v.votacao_id, lista);
    }
    // Nomes com acento exigem localeCompare — não é o mesmo que a collation
    // do banco. Ver o mesmo cuidado em `queries/congresso.ts`.
    for (const lista of votosPorVotacao.values()) {
      lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    }

    const votacoesRows: VotacaoRow[] = rows.map((r) => ({
      id: r.id,
      data: r.data,
      sessao: r.sessao,
      tipoVotacao: r.tipo_votacao,
      materia: r.materia,
      ementa: r.ementa,
      resultado: r.resultado,
      presentes: r.presentes,
      placarSim: r.placar_sim,
      placarNao: r.placar_nao,
      placarAbstencao: r.placar_abstencao,
      placarBranco: r.placar_branco,
      linkFonte: r.link_fonte,
      votos: votosPorVotacao.get(r.id) ?? [],
    }));

    return { rows: votacoesRows, total: rows[0]?.total ?? 0, configured: true, ok: true };
  } catch {
    return { ...VAZIO, configured: true };
  }
}
