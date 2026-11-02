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
  ementa: string;
  resumo: string;
  danos_pnab: string[];
  valor: number | null;
  link: string;
  status: string;
  explicacao: string;
  exemplo: string;
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
  /** Recorte de indenização (auxílio emergencial, PTR…), vindo da faixa de botões. */
  recorte?: string;
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
  const base = casos.filter((caso) => {
    for (const [campo, predicado] of Object.entries(PREDICADOS)) {
      const valor = filtros[campo as keyof Filtros];
      if (valor && !predicado(caso, valor)) return false;
    }
    return !q || caso.processo.toLowerCase().includes(q);
  });
  // O recorte de indenização não é campo do acervo: casa por texto. Fica fora
  // do mapa de predicados de propósito, para não virar mais uma chave que
  // alguém liga por engano a um campo inexistente.
  return filtros.recorte ? filtrarTema(base, filtros.recorte) : base;
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
  campo:
    | "polo"
    | "ano"
    | "comarca"
    | "tribunal"
    | "estado"
    | "frente"
    | "tipo"
    | "resultado"
    | "recorrente"
    | "classe",
): [string, number][] {
  const contagem = new Map<string, number>();
  for (const caso of casos) {
    const chave = caso[campo] || "—";
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/**
 * Conta itens de lista (temas, danos PNAB): um caso pode entrar em vários.
 *
 * Por isso o total aqui NÃO é o número de casos — quem exibe precisa mostrar o
 * denominador certo (nº de casos que têm a lista preenchida), senão o
 * percentual mente (AGENTS: todo número com N).
 */
export function contarLista(
  casos: CasoJurisprudencia[],
  campo: "temas" | "danos_pnab",
): [string, number][] {
  const contagem = new Map<string, number>();
  for (const caso of casos) {
    for (const item of caso[campo] ?? []) {
      const chave = item.trim();
      if (chave) contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }
  }
  return [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export const FAIXAS_VALOR: { rotulo: string; ate: number }[] = [
  { rotulo: "até R$ 10 mil", ate: 10_000 },
  { rotulo: "R$ 10 mil a 50 mil", ate: 50_000 },
  { rotulo: "R$ 50 mil a 100 mil", ate: 100_000 },
  { rotulo: "R$ 100 mil a 500 mil", ate: 500_000 },
  { rotulo: "R$ 500 mil a 1 mi", ate: 1_000_000 },
  { rotulo: "R$ 1 mi a 5 mi", ate: 5_000_000 },
  { rotulo: "acima de R$ 5 mi", ate: Number.POSITIVE_INFINITY },
];

/**
 * Histograma dos valores mencionados nas decisões.
 *
 * O campo `valor` é o maior R$ do texto e pode ser pedido, condenação ou valor
 * de ação coletiva — por isso faixa, nunca média. Devolve também quantos casos
 * entram na conta, que é o denominador honesto do gráfico.
 */
export function faixasDeValor(casos: CasoJurisprudencia[]): { dados: [string, number][]; n: number } {
  const dados: [string, number][] = FAIXAS_VALOR.map((faixa) => [faixa.rotulo, 0]);
  let n = 0;
  for (const caso of casos) {
    const valor = caso.valor;
    if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) continue;
    n += 1;
    const indice = FAIXAS_VALOR.findIndex((faixa) => valor <= faixa.ate);
    const alvo = indice === -1 ? FAIXAS_VALOR.length - 1 : indice;
    dados[alvo][1] += 1;
  }
  return { dados, n };
}

export interface EstatisticaValor {
  n: number;
  mediana: number;
  q1: number;
  q3: number;
}

/**
 * Mediana e quartis dos valores do recorte atual.
 *
 * Nunca média: o acervo tem ação coletiva de R$ 200 bi e um único outlier
 * arrasta a média para fora de qualquer leitura útil. A mediana descreve o
 * caso típico; Q1 e Q3 dizem o quanto a distribuição abre.
 */
export function estatisticasDeValor(casos: CasoJurisprudencia[]): EstatisticaValor {
  const valores = casos
    .map((caso) => caso.valor)
    .filter((valor): valor is number => typeof valor === "number" && Number.isFinite(valor) && valor > 0)
    .sort((a, b) => a - b);
  if (valores.length === 0) return { n: 0, mediana: 0, q1: 0, q3: 0 };
  const emPosicao = (fracao: number) => {
    const indice = Math.min(valores.length - 1, Math.max(0, Math.round(fracao * (valores.length - 1))));
    return valores[indice];
  };
  return { n: valores.length, mediana: emPosicao(0.5), q1: emPosicao(0.25), q3: emPosicao(0.75) };
}

export interface TemaIndenizacao {
  slug: string;
  rotulo: string;
  /** Sem acento e minúsculo — o texto do caso é normalizado antes do teste. */
  termos: RegExp;
  nota: string;
}

/**
 * Recortes de indenização e programas.
 *
 * O acervo não tem campo para isto: o dado está na ementa e no resumo. Os
 * termos foram medidos em 02/11/2026 sobre 16.834 itens (o N de cada um está
 * no comentário) e usam fronteira de palavra onde a sigla colide com palavra
 * comum — `afe` dentro de "afetado" seria falso positivo.
 */
export const TEMAS_INDENIZACAO: TemaIndenizacao[] = [
  {
    slug: "dano-moral",
    rotulo: "Dano moral",
    termos: /\bdano moral\b|\bdanos morais\b/,
    nota: "Pedido ou reconhecimento de dano moral individual.",
  },
  {
    slug: "perda-renda",
    rotulo: "Perda de renda",
    termos: /\bperda (da )?renda\b|\brenda\b/,
    nota: "Discussão sobre renda interrompida: pesca, lavoura, trabalho e comércio.",
  },
  {
    slug: "indenizacao-individual",
    rotulo: "Indenização individual e liquidação",
    termos: /\bindeniza(c|ç)[aã]o individual\b|\bliquida(c|ç)[aã]o( de senten(c|ç)a)?\b/,
    nota: "Execução ou liquidação do valor devido a cada atingido.",
  },
  {
    slug: "dano-material",
    rotulo: "Dano material",
    termos: /\bdano material\b|\bdanos materiais\b/,
    nota: "Prejuízo patrimonial: imóvel, produção, equipamento.",
  },
  {
    slug: "auxilio-emergencial",
    rotulo: "Auxílio emergencial / AFE",
    termos: /\bauxilio emergencial\b|\bauxilio financeiro emergencial\b|\bafe\b/,
    nota: "Pagamento emergencial mensal do acordo e sua cobrança judicial.",
  },
  {
    slug: "lucros-cessantes",
    rotulo: "Lucros cessantes",
    termos: /\blucros? cessantes?\b/,
    nota: "O que a pessoa deixou de ganhar no período de paralisação.",
  },
  {
    slug: "acordo-reparacao",
    rotulo: "Acordo de reparação / TTAC",
    termos: /\bacordo de reparac|\bttac\b|\btermo de transa(c|ç)/,
    nota: "Decisões que interpretam o acordo e o Termo de Transação.",
  },
  {
    slug: "reassentamento",
    rotulo: "Reassentamento",
    termos: /\breassentamento\b|\brealoca(c|ç)[aã]o\b/,
    nota: "Realocação de famílias e comunidades.",
  },
  {
    slug: "pensao-mensal",
    rotulo: "Pensão mensal",
    termos: /\bpens[aã]o mensal\b|\bpens[aã]o vitalicia\b/,
    nota: "Pensão por morte ou invalidez fixada em decisão.",
  },
  {
    slug: "pagamento-emergencial",
    rotulo: "Pagamento emergencial",
    termos: /\bpagamento emergencial\b/,
    nota: "Cobrança do pagamento emergencial em espécie.",
  },
  {
    slug: "ptr",
    rotulo: "PTR — transferência de renda",
    termos: /\bptr\b|\bprograma de transferencia de renda\b/,
    nota: "Programa de transferência de renda previsto no acordo.",
  },
  {
    slug: "nae",
    rotulo: "NAE",
    termos: /\bnae\b|\bnova assistencia emergencial\b/,
    nota: "Novo auxílio emergencial. Zero no acervo até 02/11/2026 — pode ser ausência de decisão publicada, não inexistência do programa.",
  },
];

/** Texto do caso sem acento e em minúsculas, para o casamento de termos. */
export function textoBuscavel(caso: CasoJurisprudencia): string {
  return `${caso.ementa ?? ""} ${caso.resumo ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function filtrarTema(casos: CasoJurisprudencia[], slug: string): CasoJurisprudencia[] {
  const tema = TEMAS_INDENIZACAO.find((item) => item.slug === slug);
  if (!tema) return [];
  return casos.filter((caso) => tema.termos.test(textoBuscavel(caso)));
}

/**
 * N de cada recorte em uma passada só.
 *
 * Normalizar 16.834 ementas uma vez por recorte seriam 200 mil normalizações
 * por clique. Aqui o texto é normalizado uma vez por caso e testado contra
 * todos os recortes.
 */
export function contagemTemasIndenizacao(
  casos: CasoJurisprudencia[],
): { slug: string; rotulo: string; n: number }[] {
  const contagem = new Map<string, number>(TEMAS_INDENIZACAO.map((tema) => [tema.slug, 0]));
  for (const caso of casos) {
    const texto = textoBuscavel(caso);
    for (const tema of TEMAS_INDENIZACAO) {
      if (tema.termos.test(texto)) contagem.set(tema.slug, (contagem.get(tema.slug) ?? 0) + 1);
    }
  }
  return TEMAS_INDENIZACAO.map((tema) => ({
    slug: tema.slug,
    rotulo: tema.rotulo,
    n: contagem.get(tema.slug) ?? 0,
  }));
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
