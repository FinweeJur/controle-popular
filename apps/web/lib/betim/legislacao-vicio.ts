import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import { labelDaCategoria, type Categoria, type NivelGravidade } from "@/lib/congresso/rubrica_vicio";

/**
 * Vício legislativo / indício de inconstitucionalidade — eixo Cidades, lado
 * de apresentação. Espelha `lib/betim/legislacao-garantista.ts`
 * (`analisesDeAtos`), mesma tabela de origem estrutural (`ato`/`proposicao`),
 * régua diferente.
 *
 * DIFERENÇA DELIBERADA: `analisesDeAtos` inclui toda análise `status='ok'`,
 * mesmo rótulo "neutro" — a rubrica garantista já mostra um selo cinza
 * discreto pra "neutro". Aqui NÃO: `sem_indicio` fica de fora do mapa de
 * propósito, porque o produto quer SILÊNCIO total nesse caso (regra do
 * handoff — "nada de mostrar 'sem indício' com destaque"). Objeto ausente
 * do mapa é objeto sem vício relevante OU sem análise — as duas coisas
 * significam "não mostrar nada", e é exatamente essa a leitura que se quer.
 */

export interface VicioAtoItem {
  categoria: Categoria;
  categoriaLabel: string;
  dispositivo: string;
  justificativa: string | null;
  trecho: string | null;
  confianca: number | null;
}

export interface VicioAto {
  nivelGravidade: NivelGravidade;
  resumo: string | null;
  status: "ok" | "requer_revisao" | "falhou" | null;
  modelo: string | null;
  versaoRubrica: string | null;
  itens: VicioAtoItem[];
}

/**
 * Vício (quando existe indício) de um conjunto de atos, indexado por `ato_id`.
 * Mesmo uso de `analisesDeAtos`: casar cada linha de `/camara/legislacao`
 * com seu indício, sem escrever "sem indício" em nenhuma.
 */
export async function viciosDeAtos(
  idMunicipio: IdMunicipio,
  atoIds: string[]
): Promise<Map<string, VicioAto>> {
  const mapa = new Map<string, VicioAto>();
  if (atoIds.length === 0) return mapa;
  try {
    const resultado = await q.viciosDeObjetos(idMunicipio, { atos: atoIds });
    if (!resultado) return mapa;
    const { linhas, itens } = resultado;

    const itensPorVicio = new Map<string, typeof itens>();
    for (const i of itens) {
      const lista = itensPorVicio.get(i.vicio_id) ?? [];
      lista.push(i);
      itensPorVicio.set(i.vicio_id, lista);
    }

    for (const l of linhas) {
      if (l.status !== "ok" && l.status !== "requer_revisao") continue;
      if (!l.ato_id) continue;
      if (!l.nivel_gravidade || l.nivel_gravidade === "sem_indicio") continue;

      const meus = itensPorVicio.get(l.id) ?? [];
      if (meus.length === 0) continue;

      mapa.set(l.ato_id, {
        nivelGravidade: l.nivel_gravidade as NivelGravidade,
        resumo: l.resumo,
        status: l.status as "ok" | "requer_revisao" | "falhou" | null,
        modelo: l.modelo,
        versaoRubrica: l.versao_rubrica,
        itens: meus.map((i) => ({
          categoria: i.categoria as Categoria,
          categoriaLabel: labelDaCategoria(i.categoria),
          dispositivo: i.dispositivo,
          justificativa: i.justificativa,
          trecho: i.trecho,
          confianca: i.confianca,
        })),
      });
    }
  } catch (e) {
    // Migration não rodada / tabela ausente: estado vazio, não erro — mesma
    // convenção de `analisesDeAtos`.
    if ((e as { code?: string }).code !== "42P01") throw e;
  }
  return mapa;
}

/** Mesmo mecanismo de `viciosDeAtos`, para proposições em tramitação. */
export async function viciosDeProposicoes(
  idMunicipio: IdMunicipio,
  proposicaoIds: string[]
): Promise<Map<string, VicioAto>> {
  const mapa = new Map<string, VicioAto>();
  if (proposicaoIds.length === 0) return mapa;
  try {
    const resultado = await q.viciosDeObjetos(idMunicipio, { proposicoes: proposicaoIds });
    if (!resultado) return mapa;
    const { linhas, itens } = resultado;

    const itensPorVicio = new Map<string, typeof itens>();
    for (const i of itens) {
      const lista = itensPorVicio.get(i.vicio_id) ?? [];
      lista.push(i);
      itensPorVicio.set(i.vicio_id, lista);
    }

    for (const l of linhas) {
      if (l.status !== "ok" && l.status !== "requer_revisao") continue;
      if (!l.proposicao_id) continue;
      if (!l.nivel_gravidade || l.nivel_gravidade === "sem_indicio") continue;

      const meus = itensPorVicio.get(l.id) ?? [];
      if (meus.length === 0) continue;

      mapa.set(l.proposicao_id, {
        nivelGravidade: l.nivel_gravidade as NivelGravidade,
        resumo: l.resumo,
        status: l.status as "ok" | "requer_revisao" | "falhou" | null,
        modelo: l.modelo,
        versaoRubrica: l.versao_rubrica,
        itens: meus.map((i) => ({
          categoria: i.categoria as Categoria,
          categoriaLabel: labelDaCategoria(i.categoria),
          dispositivo: i.dispositivo,
          justificativa: i.justificativa,
          trecho: i.trecho,
          confianca: i.confianca,
        })),
      });
    }
  } catch (e) {
    if ((e as { code?: string }).code !== "42P01") throw e;
  }
  return mapa;
}
