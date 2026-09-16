/**
 * Queries para proposições da ALMG.
 *
 * Enquanto o banco Neon estiver fora, lê do JSON estático.
 * Quando voltar, migra para Drizzle (mesmo padrão do Congresso federal).
 */
import { readFile } from "fs/promises";
import { join } from "path";
import type { ProposicaoAlmg, FiltrosAlmg } from "@/lib/congresso/almg";

const JSON_PATH = join(process.cwd(), "apps", "web", "data", "almg-proposicoes.json");

let cache: ProposicaoAlmg[] | null = null;

async function carregar(): Promise<ProposicaoAlmg[]> {
  if (cache) return cache;
  try {
    const raw = await readFile(JSON_PATH, "utf-8");
    cache = JSON.parse(raw);
    return cache!;
  } catch {
    return [];
  }
}

export async function listerAlmgProposicoes(filtros: FiltrosAlmg = {}): Promise<ProposicaoAlmg[]> {
  const todos = await carregar();
  let resultado = todos;

  if (filtros.q) {
    const q = filtros.q.toLowerCase();
    resultado = resultado.filter((p) =>
      p.ementa?.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      p.resumo?.toLowerCase().includes(q)
    );
  }

  if (filtros.tipo) {
    resultado = resultado.filter((p) => p.sigla_tipo === filtros.tipo);
  }

  if (filtros.ano) {
    resultado = resultado.filter((p) => p.ano === filtros.ano);
  }

  if (filtros.situacao) {
    resultado = resultado.filter((p) => p.situacao === filtros.situacao);
  }

  if (filtros.autor) {
    const a = filtros.autor.toLowerCase();
    resultado = resultado.filter((p) =>
      p.autores?.some((au) => au.nome.toLowerCase().includes(a))
    );
  }

  if (filtros.tramitando !== undefined) {
    resultado = resultado.filter((p) => p.tramitando === filtros.tramitando);
  }

  const porPagina = filtros.porPagina ?? 50;
  const pagina = filtros.pagina ?? 1;
  const inicio = (pagina - 1) * porPagina;

  return resultado.slice(inicio, inicio + porPagina);
}

export async function obterAlmgProposicaoPorCodigo(
  codigo: string
): Promise<ProposicaoAlmg | null> {
  const todos = await carregar();
  return todos.find((p) => p.codigo === codigo) ?? null;
}

export async function estatisticasAlmg() {
  const todos = await carregar();
  const porTipo: Record<string, number> = {};
  const porSituacao: Record<string, number> = {};
  let tramitando = 0;

  for (const p of todos) {
    porTipo[p.sigla_tipo] = (porTipo[p.sigla_tipo] ?? 0) + 1;
    const sit = p.situacao_geral ?? "MOUTR";
    porSituacao[sit] = (porSituacao[sit] ?? 0) + 1;
    if (p.tramitando) tramitando++;
  }

  return {
    total: todos.length,
    tramitando,
    porTipo,
    porSituacao,
  };
}
