/**
 * apps/web/lib/ambiental/autos-recentes.ts
 *
 * Recorte 2024–2026 dos autos de infração do Sisema/SEMAD-MG — a fonte com
 * dado recente e valor do auto. Server-only: lê o JSON de `data/` com `fs`,
 * porque são 36 mil registros e o cliente recebe só a página pedida.
 *
 * ⚠️ POR QUE ESTE MÓDULO NÃO VAI PARA O CLIENTE
 * `recentes.json` tem 6,3 MB. Mandar isso como prop de componente estouraria
 * o teto de payload (AGENTS § 5.1) e travaria o celular. A rota
 * `/api/autos/recentes` filtra no servidor e devolve 20 linhas por vez.
 *
 * ⚠️ O QUE ESTE DADO É E NÃO É
 * - É o ato lavrado: número do auto, data, órgão, unidade, município, valor e
 *   situação do processo. A entidade `Autos_Infracao_Completa` NÃO traz nome,
 *   CPF/CNPJ nem RG (AGENTS § 5.2).
 * - Valor é multa LAVRADA, não paga. Cada cifra viaja com a situação.
 * - Empresa e medidas (embargo, reflorestamento, suspensão) NÃO existem nesta
 *   entidade; o recorte histórico do CAP é outro módulo e outro período.
 *
 * Fonte: Painel de Indicadores do Sisema (Power BI público), coletado por
 * `etl/betim/etl/apis/sisema_autos_infracao.py --bruto`.
 */

import bruto from "../../data/sisema-autos/recentes.json";

export interface AutoRecente {
  /** Número do auto de infração. */
  a: string;
  /** Data de lavratura (ISO, AAAA-MM-DD). */
  d: string;
  /** Órgão coordenador (SEMAD, IEF). */
  o: string;
  /** Valor do auto em reais (multa lavrada, não paga). */
  v: number;
  /** Situação do processo. */
  s: string;
  /** Município do autuado. */
  m: string;
  /** Unidade atual. */
  u: string;
  /** Data de encerramento/envio à dívida ativa. */
  e: string;
}

export interface ResumoRecentes {
  geradoEm: string;
  fonte: string;
  fonteUrl: string;
  ressalvaTitular: string;
  ressalvaValor: string;
  janela: string;
  totalAutos: number;
  valorTotal: number;
  porAno: Record<string, number>;
  porSituacao: Record<string, number>;
  porOrgao: Record<string, number>;
  porMunicipio: Array<{ municipio: string; autos: number }>;
}

export interface FiltroAutos {
  municipio?: string;
  ano?: string;
  situacao?: string;
  valorMin?: number;
  valorMax?: number;
  q?: string;
  pagina?: number;
  porPagina?: number;
}

export interface ResultadoBusca {
  total: number;
  valorTotal: number;
  pagina: number;
  paginas: number;
  porAno: Array<{ rotulo: string; valor: number }>;
  itens: AutoRecente[];
}

interface ArquivoRecentes {
  resumo: ResumoRecentes;
  autos: AutoRecente[];
}

let cache: ArquivoRecentes | null = null;

/** Sem acento e em caixa alta — o município da fonte vem em caixa alta. */
export function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

export function carregarArquivoRecentes(): ArquivoRecentes {
  if (!cache) cache = bruto as unknown as ArquivoRecentes;
  return cache;
}

export function resumoRecentes(): ResumoRecentes {
  return carregarArquivoRecentes().resumo;
}

/** Total da janela 2024–2026, sem montar a lista (usado no bloco da home). */
export const TOTAL_AUTOS_RECENTES = bruto.resumo.totalAutos;

/**
 * Filtro puro, testável sem `fs`. A ordem de saída é a do arquivo (data
 * decrescente). `q` casa com o número do auto; `municipio` aceita prefixo
 * sem acento.
 */
export function filtrarAutos(autos: AutoRecente[], filtro: FiltroAutos): AutoRecente[] {
  const municipio = normalizar(filtro.municipio ?? "");
  const q = (filtro.q ?? "").replace(/\s/g, "");
  const regras: Array<(auto: AutoRecente) => boolean> = [];

  if (municipio) regras.push((auto) => normalizar(auto.m).includes(municipio));
  if (filtro.ano) regras.push((auto) => auto.d.slice(0, 4) === filtro.ano);
  if (filtro.situacao) regras.push((auto) => auto.s === filtro.situacao);
  if (q) regras.push((auto) => auto.a.includes(q));
  if (filtro.valorMin !== undefined) regras.push((auto) => auto.v >= filtro.valorMin!);
  if (filtro.valorMax !== undefined) regras.push((auto) => auto.v <= filtro.valorMax!);

  return autos.filter((auto) => regras.every((regra) => regra(auto)));
}

export function agregarPorAno(autos: AutoRecente[]): Array<{ rotulo: string; valor: number }> {
  const mapa = new Map<string, number>();
  for (const auto of autos) {
    const ano = auto.d.slice(0, 4);
    if (!/^\d{4}$/.test(ano)) continue;
    mapa.set(ano, (mapa.get(ano) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ano, total]) => ({ rotulo: ano, valor: total }));
}

/** Aplica filtro + paginação e devolve o que a rota manda para a tela. */
export function buscar(autos: AutoRecente[], filtro: FiltroAutos): ResultadoBusca {
  const filtrados = filtrarAutos(autos, filtro);
  const porPagina = Math.min(Math.max(filtro.porPagina ?? 20, 1), 100);
  const paginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const pagina = Math.min(Math.max(filtro.pagina ?? 1, 1), paginas);
  const inicio = (pagina - 1) * porPagina;

  return {
    total: filtrados.length,
    valorTotal: Math.round(filtrados.reduce((soma, auto) => soma + auto.v, 0) * 100) / 100,
    pagina,
    paginas,
    porAno: agregarPorAno(filtrados),
    itens: filtrados.slice(inicio, inicio + porPagina),
  };
}
