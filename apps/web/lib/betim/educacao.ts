import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export const REDE_LABELS: Record<string, string> = {
  "1": "Federal",
  "2": "Estadual",
  "3": "Municipal",
  "4": "Privada",
};

/**
 * `id_inep` e `nome` são anuláveis porque a tabela `escolas` os declara assim
 * (migration original: só `id` e `id_municipio` são `not null`). A versão
 * anterior deste arquivo escondia isso com um `as EscolaRow[]` — o cast passava
 * no compilador e não mudava o dado, então uma escola sem nome chegava à tela
 * como um item de lista vazio. Agora o tipo diz a verdade e quem exibe decide o
 * que mostrar no lugar.
 */
export interface EscolaRow {
  id_inep: string | null;
  nome: string | null;
  rede: string | null;
  matriculas: number | null;
}

/**
 * O que a PÁGINA recebe: quatro números e a quebra por rede. Nenhuma escola.
 *
 * ═══ POR QUE `escolas` SAIU DAQUI — COM O NÚMERO MEDIDO ═══
 *
 * `page.tsx` renderizava `data.escolas.map()` inline, no Server Component. Num
 * alvo estático não existe "renderizar depois": a lista inteira vira arquivo,
 * e vira TRÊS vezes — medido no `.cache` real de um build desta árvore, o
 * conteúdo aparece como HTML, como payload RSC (`rsc`) e de novo como
 * `segmentData["/_full"]`, que é byte a byte igual ao `rsc`. Não são duas
 * cópias como se supunha: são três.
 *
 * Medido com build real (6 cidades, 0 a 16.000 escolas sintéticas de 45
 * caracteres, regressão linear sobre os `.cache` montados como o
 * `@opennextjs/aws` monta):
 *
 *     custo fixo da rota ......... 190,3 KiB
 *     custo por escola ........... 2.200,6 bytes
 *     teto de 25 MiB do Workers .. 11.824 escolas
 *
 * São Paulo publicava 21 MiB em 15/08/2026 (`docs/HANDOFF-PAYLOAD-LEGISLACAO.md`),
 * o que põe a cidade a ~1.900 escolas do teto — 19% de crescimento do acervo
 * derruba o deploy, sem ninguém ter tocado nesta página. É o caso do §19: a
 * página precisa do índice fatiado ANTES de a ingestão seguinte chegar.
 *
 * Os agregados continuam vindo do servidor porque são O(1) — quatro números
 * não pesam, e mantê-los no HTML preserva o que a tela mostra sem JavaScript.
 */
export interface EducacaoResumo {
  configured: boolean;
  totalEscolas: number;
  totalMatriculas: number;
  porRede: { rede: string; qtd: number }[];
}

const VAZIO: EducacaoResumo = {
  configured: false,
  totalEscolas: 0,
  totalMatriculas: 0,
  porRede: [],
};

/** Uma linha de `resumoEscolas` — `group by rede`, no máximo cinco delas. */
export interface GrupoRede {
  rede: string | null;
  qtd: number;
  matriculas: number;
}

/**
 * A aritmética do resumo, separada da consulta para poder ser testada — o
 * projeto não usa mock de banco (`vitest.config.ts` só coleta `lib/**`, e
 * nenhum teste desta árvore chama `vi.mock`).
 *
 * `rede` nula vira `"?"`, a mesma chave que a versão anterior usava, e que
 * `REDE_LABELS` resolve como "Outra" na tela.
 */
export function resumirGrupos(grupos: GrupoRede[]): Omit<EducacaoResumo, "configured"> {
  let totalEscolas = 0;
  let totalMatriculas = 0;
  const porRede: { rede: string; qtd: number }[] = [];
  for (const g of grupos) {
    totalEscolas += g.qtd;
    totalMatriculas += g.matriculas;
    porRede.push({ rede: g.rede ?? "?", qtd: g.qtd });
  }
  return { totalEscolas, totalMatriculas, porRede };
}

export async function getEducacaoResumo(idMunicipio: IdMunicipio): Promise<EducacaoResumo> {
  try {
    const grupos = await q.resumoEscolas(idMunicipio);
    if (!grupos) return VAZIO;
    // `grupos` tem no máximo cinco linhas (quatro redes do INEP + `null`), então
    // somar em JS aqui não é o mesmo que somar as ~10 mil escolas de antes.
    return { configured: true, ...resumirGrupos(grupos) };
  } catch {
    // `configured: true` com zero linha distingue "banco respondeu e a cidade
    // não tem escola" de "não consegui perguntar" — mesma regra de
    // `arquivosDeIndiceVazio`.
    return { ...VAZIO, configured: true };
  }
}

/**
 * As linhas em si — hoje só para o índice fatiado
 * (`app/[municipio]/educacao/dados/[arquivo]/route.ts`). Nenhuma página deve
 * voltar a chamar isto: é exatamente o caminho que custava 2,2 KiB de `.cache`
 * por escola.
 */
export async function listarEscolasDoMunicipio(idMunicipio: IdMunicipio): Promise<EscolaRow[]> {
  try {
    const linhas = await q.listarEscolas(idMunicipio);
    return linhas ?? [];
  } catch {
    return [];
  }
}
