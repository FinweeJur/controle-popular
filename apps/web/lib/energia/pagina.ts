/**
 * apps/web/lib/energia/pagina.ts
 *
 * Funções puras da página `/energia` — carga, geração por fonte, energia
 * armazenada (EAR) e a tabela das usinas de MG.
 *
 * O que é: formatação em pt-BR, leitura de mês, agregação das séries do ONS,
 * filtro/ordenação/CSV da tabela do SIGA. Nada aqui importa JSON: quem lê os
 * arquivos é o Server Component (`app/energia/page.tsx`) e o recorte pronto
 * desce para o componente de cliente. Assim o bundle do navegador não carrega
 * `energia-carga.json` (301 KB), `energia-balanco.json` (775 KB) nem
 * `energia-ear.json` (418 KB) — regra dura 5.1.
 *
 * Fonte oficial:
 * - ONS — dados abertos (CC-BY): https://dados.ons.org.br/
 *   carga: https://dados.ons.org.br/dataset/carga-energia
 *   balanço: https://dados.ons.org.br/dataset/balanco-energia-subsistema
 *   EAR: https://dados.ons.org.br/dataset/ear-diario-por-subsistema
 * - ANEEL — SIGA (ODbL 1.0):
 *   https://dadosabertos.aneel.gov.br/dataset/siga-sistema-de-informacoes-de-geracao-da-aneel
 *
 * Decisões técnicas não triviais:
 * - O balanço traz uma linha agregada `SIN` além dos quatro subsistemas.
 *   Somar `SIN` com eles duplicaria a geração do país inteiro. Por isso a
 *   agregação por fonte recebe o subsistema desejado e o padrão é `SIN`.
 * - A participação por fonte é média PONDERADA pelas horas de cada mês
 *   (`MWmed × horas = MWh`). Média simples de percentuais mentiria nos meses
 *   de horário de verão e nos meses parciais.
 * - `potenciaKw` do SIGA é potência OUTORGADA, não medida em operação. A
 *   tabela e o cartão dizem isso; o recorte é de 300 usinas, não o estado.
 * - CSV segue o padrão do portal: BOM UTF-8 (`\uFEFF`), separador `;`, CRLF e
 *   decimal com vírgula — abre limpo no Excel brasileiro.
 */

import type { TipoGeracao } from "./energia";

/** Ordem de exibição dos subsistemas do ONS (a mesma do operador). */
export const SUBSISTEMAS = [
  { codigo: "SE", rotulo: "Sudeste/Centro-Oeste", curto: "SE/CO" },
  { codigo: "S", rotulo: "Sul", curto: "Sul" },
  { codigo: "NE", rotulo: "Nordeste", curto: "Nordeste" },
  { codigo: "N", rotulo: "Norte", curto: "Norte" },
] as const;

export type CodigoSubsistema = (typeof SUBSISTEMAS)[number]["codigo"];

/** Fontes que o balanço do ONS separa. */
export const FONTES_GERACAO = ["hidraulica", "termica", "eolica", "solar"] as const;

export type FonteGeracao = (typeof FONTES_GERACAO)[number];

/** Rótulo humano de cada fonte — o slug técnico nunca aparece na tela. */
export const ROTULO_FONTE: Record<FonteGeracao, string> = {
  hidraulica: "Hidráulica",
  termica: "Térmica",
  eolica: "Eólica",
  solar: "Solar",
};

/** Nome legível dos tipos de geração do SIGA/ANEEL. */
export const ROTULO_TIPO: Record<TipoGeracao, string> = {
  UHE: "UHE · Hidrelétrica",
  PCH: "PCH · Pequena central hidrelétrica",
  CGH: "CGH · Central geradora hidrelétrica",
  UFV: "UFV · Solar fotovoltaica",
  UTE: "UTE · Termelétrica",
  EOL: "EOL · Eólica",
};

/** Uma linha mensal de carga (MWmed) por subsistema. */
export interface RegistroCarga {
  subsistema: string;
  nome: string;
  mes: string;
  cargaMediaMWmed: number;
  dias: number;
  fonte: string;
  coletadoEm: string;
}

/** Uma linha mensal do balanço de geração por subsistema (inclui `SIN`). */
export interface RegistroBalanco {
  subsistema: string;
  nome: string;
  mes: string;
  horas: number;
  geracaoMediaMW: Record<FonteGeracao, number> & { total: number };
  participacaoPercentual: Record<FonteGeracao, number>;
  cargaMediaMW: number;
  intercambioMedioMW: number;
  fonte: string;
  coletadoEm: string;
}

/** Uma linha mensal de energia armazenada (EAR) por subsistema. */
export interface RegistroEar {
  subsistema: string;
  nome: string;
  mes: string;
  earPercentualMedio: number;
  earPercentualMinimo: number;
  earPercentualMaximo: number;
  earMWmesMedio: number;
  dias: number;
  fonte: string;
  coletadoEm: string;
}

/** O recorte de usina que a ilha de cliente recebe — nada além do necessário. */
export interface UsinaLinha {
  posicao: number;
  ceg: string;
  nome: string;
  tipo: string;
  fase: string;
  potenciaKw: number;
  municipios: string[];
  outorga: string | null;
  entradaOperacao: string | null;
  fimVigencia: string | null;
  fonte: string;
}

/** Filtros da tabela de usinas. `busca` cobre nome, CEG e municípios. */
export interface FiltroUsinas {
  busca?: string;
  tipo?: string;
  fase?: string;
}

const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const;

const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
] as const;

/** Formata número em pt-BR com o número de casas pedido (padrão: inteiro). */
export function formatarNumero(valor: number, casas = 0): string {
  if (!Number.isFinite(valor)) return "—";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Arredonda sem o ruído de ponto flutuante (58,26999 → 58,3). */
export function arredondar(valor: number, casas = 1): number {
  if (!Number.isFinite(valor)) return 0;
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

/** `2026-11` → `nov/2026`. String fora do padrão volta como veio. */
export function formatarMes(mes: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!m) return mes;
  const indice = Number(m[2]) - 1;
  if (indice < 0 || indice > 11) return mes;
  return `${MESES_CURTOS[indice]}/${m[1]}`;
}

/** `2024-01` → `jan/24` — rótulo de eixo sem gastar largura com o século. */
export function formatarMesCurto(mes: string): string {
  const completo = formatarMes(mes);
  return /^[a-z]{3}\/\d{4}$/.test(completo) ? `${completo.slice(0, 3)}/${completo.slice(-2)}` : completo;
}

/** `2026-11` → `novembro de 2026`. String fora do padrão volta como veio. */
export function formatarMesLongo(mes: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!m) return mes;
  const indice = Number(m[2]) - 1;
  if (indice < 0 || indice > 11) return mes;
  return `${MESES_LONGOS[indice]} de ${m[1]}`;
}

/** `2026-11` → `11/2026` — rótulo curto de eixo. */
export function mesCurtoNumerico(mes: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!m) return mes;
  return `${m[2]}/${m[1]}`;
}

/** `1980-04-24` → `24/04/1980`. Vazio/nulo vira `—`. */
export function formatarDataIso(data: string | null | undefined): string {
  if (!data) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  if (!m) return data;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** `2026-11-18` → `18 nov. 2026` — data de acesso no padrão ABNT. */
export function formatarDataAbnt(data: string | null | undefined): string {
  if (!data) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  if (!m) return data;
  const indice = Number(m[2]) - 1;
  if (indice < 0 || indice > 11) return data;
  return `${Number(m[3])} ${MESES_CURTOS[indice]}. ${m[1]}`;
}

/** Quantidade de dias do mês `AAAA-MM` (fevereiro bissexto incluso). */export function diasNoMes(mes: string): number {
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!m) return 0;
  const ano = Number(m[1]);
  const numeroMes = Number(m[2]);
  if (numeroMes < 1 || numeroMes > 12) return 0;
  return new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate();
}

/**
 * O mês está incompleto? O ONS publica a média dos dias já apurados no mês
 * corrente; comparar `dias` com o calendário revela o mês em curso sem
 * precisar de relógio — o dado carrega a própria data de corte.
 */
export function mesParcial(registro: { mes: string; dias: number }): boolean {
  const total = diasNoMes(registro.mes);
  return total > 0 && registro.dias < total;
}

/**
 * O mesmo teste para o balanço, que não publica `dias`: as horas medidas do
 * mês contra as horas do calendário. Mês completo tem 24 h por dia.
 */
export function mesParcialPorHoras(registro: { mes: string; horas: number }): boolean {
  const total = diasNoMes(registro.mes) * 24;
  return total > 0 && registro.horas < total;
}

/** Percentual com uma casa e vírgula: `87,39` → `87,4%`. */
export function formatarPercentual(valor: number, casas = 1): string {
  if (!Number.isFinite(valor)) return "—";
  return `${formatarNumero(arredondar(valor, casas), casas)}%`;
}

/** Converte potência em kW para GW com uma casa: `27686905,9` → `27,7 GW`. */
export function formatarPotenciaGw(kw: number): string {
  return `${formatarNumero(arredondar(kw / 1_000_000, 1), 1)} GW`;
}

/** Converte carga em MWmed para GWmed com uma casa (`46.506` → `46,5`). */
export function formatarGeracaoGw(mw: number): string {
  return formatarNumero(arredondar(mw / 1000, 1), 1);
}

/** Chave de busca: minúscula, sem acento, espaço colapsado. */
export function normalizarBusca(texto: string): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Meses únicos de uma série, do mais antigo ao mais novo. */
export function mesesDaSerie(registros: Array<{ mes: string }>): string[] {
  return [...new Set(registros.map((r) => r.mes))].sort();
}

/** Último mês publicado na série (comparação lexical basta em `AAAA-MM`). */
export function ultimoMes(registros: Array<{ mes: string }>): string | null {
  let ultimo: string | null = null;
  for (const r of registros) if (!ultimo || r.mes > ultimo) ultimo = r.mes;
  return ultimo;
}

/** Registro de carga de um subsistema num mês. */
export function cargaDoMes(
  registros: RegistroCarga[],
  mes: string,
  subsistema: string,
): RegistroCarga | null {
  return registros.find((r) => r.mes === mes && r.subsistema === subsistema) ?? null;
}

/**
 * Participação renovável (hidráulica + eólica + solar) em % da geração.
 *
 * Renovável aqui é o que o ONS mede como fonte: a térmica fica fora, mesmo
 * quando é biomassa. A página diz o que está somando para o leitor não ler
 * "renovável" como "sem impacto".
 */
export function participacaoRenovavel(registro: RegistroBalanco): number {
  const p = registro.participacaoPercentual;
  if (
    p &&
    Number.isFinite(p.hidraulica) &&
    Number.isFinite(p.eolica) &&
    Number.isFinite(p.solar)
  ) {
    return arredondar(p.hidraulica + p.eolica + p.solar, 1);
  }
  const g = registro.geracaoMediaMW;
  const total = g?.total ?? 0;
  if (!total) return 0;
  return arredondar(((g.hidraulica + g.eolica + g.solar) / total) * 100, 1);
}

/** Uma fatia da participação por fonte, já formatada para o gráfico. */
export interface ParticipacaoFonte {
  fonte: FonteGeracao;
  rotulo: string;
  percentual: number;
  geracaoMediaMw: number;
}

/**
 * Participação por fonte entre dois meses, ponderada pelas horas.
 *
 * ⚠️ Nunca some as linhas dos quatro subsistemas com a linha `SIN`: as duas
 * visões cobrem o mesmo país. O padrão `SIN` é o agregado oficial.
 */
export function agregarGeracaoPorFonte(
  registros: RegistroBalanco[],
  mesInicial: string,
  mesFinal: string,
  subsistema = "SIN",
): ParticipacaoFonte[] {
  const mwh: Record<FonteGeracao, number> = {
    hidraulica: 0,
    termica: 0,
    eolica: 0,
    solar: 0,
  };
  let horas = 0;

  for (const r of registros) {
    if (r.subsistema !== subsistema) continue;
    if (r.mes < mesInicial || r.mes > mesFinal) continue;
    horas += r.horas;
    for (const fonte of FONTES_GERACAO) mwh[fonte] += r.geracaoMediaMW[fonte] * r.horas;
  }

  const total = FONTES_GERACAO.reduce((soma, f) => soma + mwh[f], 0);
  if (!total || !horas) return [];

  return FONTES_GERACAO.map((fonte) => ({
    fonte,
    rotulo: ROTULO_FONTE[fonte],
    percentual: arredondar((mwh[fonte] / total) * 100, 1),
    geracaoMediaMw: Math.round(mwh[fonte] / horas),
  })).sort((a, b) => b.percentual - a.percentual);
}

/** Uma linha do gráfico de carga: subsistema + pontos (null = mês sem dado). */
export interface SerieCarga {
  codigo: CodigoSubsistema;
  rotulo: string;
  curto: string;
  pontos: Array<number | null>;
}

/** Série mensal de carga dos últimos `quantidade` meses, por subsistema. */
export function serieCargaMensal(
  registros: RegistroCarga[],
  quantidade: number,
): { meses: string[]; series: SerieCarga[] } {
  const meses = mesesDaSerie(registros).slice(-Math.max(1, quantidade));
  const mapa = new Map(registros.map((r) => [`${r.subsistema}|${r.mes}`, r.cargaMediaMWmed]));
  const series = SUBSISTEMAS.map((s) => ({
    codigo: s.codigo,
    rotulo: s.rotulo,
    curto: s.curto,
    pontos: meses.map((mes) => mapa.get(`${s.codigo}|${mes}`) ?? null),
  }));
  return { meses, series };
}

/** Soma da potência outorgada do recorte, em kW. */
export function somarPotenciaKw(usinas: UsinaLinha[]): number {
  return usinas.reduce((soma, u) => soma + u.potenciaKw, 0);
}

/**
 * Filtra o recorte de usinas: tipo, fase e busca textual sem acento.
 *
 * A busca cobre nome, código CEG e municípios. Várias palavras funcionam
 * como E (todas precisam aparecer), que é o que o leitor espera de
 * "itumbiara UHE".
 */
export function filtrarUsinas(usinas: UsinaLinha[], filtro: FiltroUsinas = {}): UsinaLinha[] {
  const alvo = normalizarBusca(filtro.busca ?? "");
  const termos = alvo ? alvo.split(" ") : [];

  return usinas.filter((u) => {
    if (filtro.tipo && u.tipo !== filtro.tipo) return false;
    if (filtro.fase && u.fase !== filtro.fase) return false;
    if (termos.length === 0) return true;
    const palheiro = normalizarBusca([u.nome, u.ceg, ...u.municipios].join(" "));
    return termos.every((termo) => palheiro.includes(termo));
  });
}

/** Ordena por potência outorgada; empate sai por nome (sempre crescente). */
export function ordenarUsinasPorPotencia(
  usinas: UsinaLinha[],
  direcao: "asc" | "desc",
): UsinaLinha[] {
  const fator = direcao === "asc" ? 1 : -1;
  return [...usinas].sort(
    (a, b) => fator * (a.potenciaKw - b.potenciaKw) || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/** Rótulo humano do tipo de geração. */
export function rotuloTipo(tipo: string): string {
  return ROTULO_TIPO[tipo as TipoGeracao] ?? tipo;
}

/** Nome do arquivo CSV conforme o filtro ativo. */
export function nomeArquivoUsinas(filtro: FiltroUsinas = {}): string {
  const partes = ["usinas-mg"];
  if (filtro.tipo) partes.push(filtro.tipo.toLowerCase());
  if (filtro.fase) {
    const fase = normalizarBusca(filtro.fase).replace(/\s+/g, "-");
    if (fase) partes.push(fase);
  }
  return `${partes.join("-")}.csv`;
}

/** Um campo CSV: aspas só quando há `;`, aspas ou quebra de linha. */
function campoCsv(valor: string): string {
  if (/[;"\r\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

/** Número com vírgula decimal — o Excel brasileiro lê assim. */
function numeroCsv(valor: number, casas = 0): string {
  return valor.toFixed(casas).replace(".", ",");
}

const CABECALHO_CSV = [
  "Posição",
  "Usina",
  "CEG",
  "Tipo",
  "Fase",
  "Potência outorgada (kW)",
  "Potência outorgada (MW)",
  "Municípios",
  "Outorga",
  "Entrada em operação",
  "Fim da outorga",
  "Fonte",
];

/**
 * CSV das usinas JÁ filtradas na tela — BOM UTF-8 e separador `;`.
 * Cabeçalho de 12 colunas, uma linha por usina, CRLF no fim.
 */
export function csvDeUsinas(usinas: UsinaLinha[]): string {
  const linhas = usinas.map((u) =>
    [
      String(u.posicao),
      campoCsv(u.nome),
      campoCsv(u.ceg),
      u.tipo,
      campoCsv(u.fase),
      numeroCsv(u.potenciaKw),
      numeroCsv(u.potenciaKw / 1000, 1),
      campoCsv(u.municipios.join(", ")),
      campoCsv(u.outorga ?? ""),
      formatarDataIso(u.entradaOperacao),
      formatarDataIso(u.fimVigencia),
      campoCsv(u.fonte),
    ].join(";"),
  );

  return `\uFEFF${[CABECALHO_CSV.join(";"), ...linhas].join("\r\n")}\r\n`;
}
