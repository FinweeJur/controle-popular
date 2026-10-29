/**
 * Lógica pura da página `/jurisprudencia` (filtro, ordenação e paginação).
 *
 * Por que em `lib/`: o vitest do portal só roda `.test.ts` de `lib/`, e a
 * tabela precisa de regra testável — filtro combinado, ordenação estável e
 * paginação com total de páginas. O componente fica só com o desenho.
 *
 * Regra de qualidade: a lista é paginada no SERVIDOR (20 por página); nunca
 * mandamos 2.970 casos como props de cliente (AGENTS §5.1).
 */

export interface CasoJurisprudencia {
  id: string;
  processo: string;
  tribunal: string;
  tipo: string;
  frente: string;
  estado: string;
  classe: string;
  comarca: string;
  ano: string;
  orgao: string;
  magistrado: string;
  assunto: string;
  polo: string;
  resultado: string;
  recorrente: string;
  temas: string[];
  danos_pnab: string[];
  valor: number | null;
  link: string;
  status: string;
}

export interface Filtros {
  frente?: string;
  tipo?: string;
  tribunal?: string;
  estado?: string;
  polo?: string;
  tema?: string;
  comarca?: string;
  ano?: string;
  q?: string;
  ordem?: string;
}

export interface Pagina<T> {
  itens: T[];
  pagina: number;
  totalPaginas: number;
  total: number;
}

export const POR_PAGINA = 20;

export const ROTULOS: Record<string, string> = {
  empresa: "Empresa",
  atingido: "Atingido",
  parcial: "Parcial",
  indeterminado: "Indeterminado",
  negado: "Negado",
  provido: "Provido",
  ambos: "Ambos",
};

const ORDENS: Record<string, (a: CasoJurisprudencia, b: CasoJurisprudencia) => number> = {
  ano_desc: (a, b) => b.ano.localeCompare(a.ano) || a.processo.localeCompare(b.processo),
  ano_asc: (a, b) => a.ano.localeCompare(b.ano) || a.processo.localeCompare(b.processo),
  comarca: (a, b) => a.comarca.localeCompare(b.comarca) || a.processo.localeCompare(b.processo),
  polo: (a, b) => a.polo.localeCompare(b.polo) || a.processo.localeCompare(b.processo),
};

const PREDICADOS: Record<string, (caso: CasoJurisprudencia, valor: string) => boolean> = {
  frente: (caso, valor) => caso.frente === valor,
  tipo: (caso, valor) => caso.tipo === valor,
  tribunal: (caso, valor) => caso.tribunal === valor,
  estado: (caso, valor) => caso.estado === valor,
  polo: (caso, valor) => caso.polo === valor,
  comarca: (caso, valor) => caso.comarca === valor,
  ano: (caso, valor) => caso.ano === valor,
  tema: (caso, valor) => caso.temas.includes(valor),
};

export function filtrar(casos: CasoJurisprudencia[], filtros: Filtros): CasoJurisprudencia[] {
  const q = (filtros.q ?? "").trim().toLowerCase();
  return casos.filter((caso) => {
    for (const [campo, predicado] of Object.entries(PREDICADOS)) {
      const valor = filtros[campo as keyof Filtros];
      if (valor && !predicado(caso, valor)) return false;
    }
    return !q || caso.processo.toLowerCase().includes(q);
  });
}

export function ordenar(casos: CasoJurisprudencia[], ordem?: string): CasoJurisprudencia[] {
  const comparador = ORDENS[ordem ?? "ano_desc"] ?? ORDENS.ano_desc;
  return [...casos].sort(comparador);
}

export function paginar<T>(itens: T[], pagina: number, porPagina = POR_PAGINA): Pagina<T> {
  const total = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const atual = Math.min(Math.max(1, Math.floor(pagina) || 1), totalPaginas);
  const inicio = (atual - 1) * porPagina;
  return { itens: itens.slice(inicio, inicio + porPagina), pagina: atual, totalPaginas, total };
}

export function contagemPor(
  casos: CasoJurisprudencia[],
  campo: "polo" | "ano" | "comarca" | "tribunal" | "estado" | "frente" | "tipo",
): [string, number][] {
  const contagem = new Map<string, number>();
  for (const caso of casos) {
    const chave = caso[campo] || "—";
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function valoresUnicos(
  casos: CasoJurisprudencia[],
  campo: "comarca" | "ano" | "tribunal" | "estado" | "frente" | "tipo",
): string[] {
  return [...new Set(casos.map((caso) => caso[campo]).filter(Boolean))].sort();
}

export function temasUnicos(casos: CasoJurisprudencia[]): string[] {
  return [...new Set(casos.flatMap((caso) => caso.temas))].sort();
}

export function poloPorAno(casos: CasoJurisprudencia[]): { ano: string; total: number; partes: [string, number][] }[] {
  const porAno = new Map<string, Map<string, number>>();
  for (const caso of casos) {
    const ano = caso.ano || "—";
    const mapa = porAno.get(ano) ?? new Map<string, number>();
    mapa.set(caso.polo || "—", (mapa.get(caso.polo || "—") ?? 0) + 1);
    porAno.set(ano, mapa);
  }
  return [...porAno.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ano, mapa]) => ({
      ano,
      total: [...mapa.values()].reduce((soma, n) => soma + n, 0),
      partes: [...mapa.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    }));
}
