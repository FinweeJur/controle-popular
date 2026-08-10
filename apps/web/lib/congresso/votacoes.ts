import * as q from "@/lib/db/queries/congresso";
import { normalizarRotulo } from "@/lib/presenca/vocabulario";

export const POR_PAGINA_PADRAO = 25;

export type LadoVoto = "sim" | "nao" | "abstencao" | "outro";

/** Classificação de apresentação (cor do rótulo), não de medida — nada aqui
 *  alimenta pontuação ou coerência. */
function ladoDoVoto(voto: string | null): LadoVoto {
  const v = normalizarRotulo(voto);
  if (v.startsWith("sim")) return "sim";
  if (v.startsWith("nao")) return "nao";
  if (v.startsWith("abst") || v.startsWith("obstru")) return "abstencao";
  return "outro";
}

export interface VotoIndividual {
  parlamentarId: string;
  nome: string;
  partido: string | null;
  uf: string | null;
  voto: string;
  lado: LadoVoto;
}

export interface Votacao {
  id: string;
  casaId: string;
  data: string | null;
  siglaOrgao: string | null;
  descricao: string | null;
  aprovacao: boolean | null;
  votos: VotoIndividual[];
}

export interface Filtros {
  ano?: number;
  q?: string;
  pagina?: number;
  /** Default `POR_PAGINA_PADRAO`. `/congresso/votacoes` pede um valor bem
   *  maior pra buscar o conjunto inteiro de uma vez — ver
   *  `app/congresso/votacoes/dados/[arquivo]/route.ts`. */
  porPagina?: number;
}

/**
 * Votações do Congresso — lista paginada, com o voto de CADA parlamentar já
 * anexado a cada votação.
 *
 * `congresso.votacoes`/`congresso.votos` alimentam `votosPorRotuloDoParlamentar`
 * (coerência do ranking) desde sempre, mas nenhuma tela mostra a votação
 * individual — mesmo buraco do eixo Cidades (`lib/betim/votacoesCamara.ts`),
 * replicado aqui porque o schema e o problema são os mesmos: 2.754 votações,
 * ~513 parlamentares, "quem votou o quê" ausente de toda tela.
 *
 * DUAS consultas, nunca um join direto — mesmo motivo documentado em
 * `queries/congresso.ts`: um join multiplicaria cada votação em até ~513
 * linhas e quebraria o `count(*) over ()` do total.
 */
export async function listarVotacoes(
  filtros: Filtros = {}
): Promise<{ itens: Votacao[]; total: number } | null> {
  const linhas = await q.votacoesPaginadas({
    ano: filtros.ano,
    q: filtros.q,
    pagina: filtros.pagina,
    porPagina: filtros.porPagina ?? POR_PAGINA_PADRAO,
  });
  if (!linhas) return null;
  if (linhas.length === 0) {
    const agregado = await q.totaisDeVotacoes({ ano: filtros.ano, q: filtros.q });
    return { itens: [], total: agregado?.total ?? 0 };
  }

  const votosBrutos = await q.votosDeVotacoes(linhas.map((l) => l.id));
  const votosPorVotacao = new Map<string, VotoIndividual[]>();
  for (const v of votosBrutos ?? []) {
    const lista = votosPorVotacao.get(v.votacao_id) ?? [];
    lista.push({
      parlamentarId: v.parlamentar_id,
      nome: v.nome_eleitoral ?? v.nome,
      partido: v.partido,
      uf: v.uf,
      voto: v.voto ?? "—",
      lado: ladoDoVoto(v.voto),
    });
    votosPorVotacao.set(v.votacao_id, lista);
  }
  // Nomes com acento exigem localeCompare — não é o mesmo que a collation
  // do banco (mesmo cuidado documentado no topo de `queries/congresso.ts`).
  for (const lista of votosPorVotacao.values()) {
    lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  const itens: Votacao[] = linhas.map((l) => ({
    id: l.id,
    casaId: l.casa_id,
    data: l.data,
    siglaOrgao: l.sigla_orgao,
    descricao: l.descricao,
    aprovacao: l.aprovacao,
    votos: votosPorVotacao.get(l.id) ?? [],
  }));

  return { itens, total: linhas[0]?.total ?? 0 };
}
