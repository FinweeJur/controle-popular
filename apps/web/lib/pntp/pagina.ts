/**
 * @file apps/web/lib/pntp/pagina.ts
 * @description Regras puras da página `/cidades/transparencia` e do cartão de
 * PNTP no hub municipal: média só sobre entes avaliados, contagem por nível,
 * filtro, ordenação, CSV e o recorte que viaja para o navegador.
 *
 * ─── FONTE OFICIAL ───────────────────────────────────────────────────────────
 *
 * Atricon — PNTP, dados abertos em https://pntp.atricon.org.br/dados-abertos/.
 * O JSON versionado (`apps/web/data/pntp/avaliacoes-mg.json`, 5.286 entes de MG,
 * ciclos 2022–2025) é gerado por `scripts/coletar-pntp.py`; o agregado nacional
 * fica em `resumo-brasil.json`. Decisões e armadilhas em
 * `docs/06-fontes/PNTP-ATRICON.md`.
 *
 * ─── REGRAS QUE ESTE ARQUIVO NÃO DEIXA QUEBRAR ──────────────────────────────
 *
 * 1. `itp: null` = ente **Não Avaliado**. A fonte grava 0 na planilha, e o
 *    coletor converte para nulo. Aqui `null` nunca entra em média e nunca é
 *    formatado como "0" — sai "—". O CSV deixa a célula VAZIA pela mesma razão.
 * 2. **Média sempre com N.** `mediaAvaliados` devolve `{ media, n }` juntos:
 *    separar os dois é como a média de 14 entes vira "a média de MG em 2023".
 * 3. **Nível é selo, não cálculo.** Nenhuma função daqui deriva `nivel` do
 *    ITP: "Elevado" e "Prata" convivem na mesma faixa de índice.
 * 4. **Poder e esfera separados.** Câmara e prefeitura não se misturam numa
 *    média sem que o recorte diga que misturou — o leitor filtra, e os
 *    agregados por grupo são calculados à parte.
 *
 * ─── POR QUE A LÓGICA MORA AQUI ─────────────────────────────────────────────
 *
 * O painel de tabela é client component: ele recebe as linhas de 2025 já
 * compactadas pelo servidor e filtra na memória. Contagem, ordenação e CSV
 * precisam da MESMA função da tela e do teste — duas contas para o mesmo número
 * é como nasce divergência. Ver `pagina.test.ts`.
 */

import { semAcento } from "@/lib/busca/normalizar";

/** Uma linha publicada por ente público de MG em um ciclo do PNTP. */
export interface EntePntp {
  ano: number;
  orgao: string;
  poder: string;
  esfera: string;
  estado: string;
  municipio: string;
  itp: number | null;
  pctEssenciais: number | null;
  nivel: string;
  validada: boolean | null;
  certificavel: boolean | null;
  fonte: string;
  coletadoEm: string;
}

/** Estrutura dos dois arquivos versionados em `apps/web/data/pntp/`. */
export interface AcervoPntp {
  titulo: string;
  fonte: string;
  fonteUrl: string;
  licenca: string;
  escopo: string;
  coletadoEm: string;
  total: number;
  entes: EntePntp[];
}

/**
 * Linha compacta que o servidor entrega ao painel de cliente.
 *
 * É tupla, não objeto, porque o nome do campo se repetiria 8 vezes em cada uma
 * das 1.712 linhas de 2025 — medido: 572 KB o recorte com todos os campos,
 * 245 KB com objeto enxuto e 187 KB em tupla. A ordem é a do cabeçalho da
 * tabela e está fixada em `LinhaPntp`; o painel só lê por índice daqui.
 */
export type LinhaPntp = [
  orgao: string,
  poder: string,
  esfera: string,
  municipio: string,
  itp: number | null,
  pctEssenciais: number | null,
  nivel: string,
  validada: boolean | null,
];

export const INDICE = {
  orgao: 0,
  poder: 1,
  esfera: 2,
  municipio: 3,
  itp: 4,
  pctEssenciais: 5,
  nivel: 6,
  validada: 7,
} as const;

/** Rótulo de ausência. Nulo é "não avaliado", nunca zero. */
export const SEM_DADO = "—";

/** Um decimal com vírgula, sem depender de ICU do runtime. */
export function formatarDecimal(valor: number | null): string {
  return valor === null || Number.isNaN(valor) ? SEM_DADO : valor.toFixed(1).replace(".", ",");
}

/** ITP como texto de tela. Nulo vira "—": a fonte tem zero, o portal não tem. */
export function formatarItp(valor: number | null): string {
  return formatarDecimal(valor);
}

/** Percentual como texto de tela, com o sinal. */
export function formatarPct(valor: number | null): string {
  return valor === null || Number.isNaN(valor) ? SEM_DADO : `${valor.toFixed(1).replace(".", ",")}%`;
}

/** Marca de avaliação em palavra — `null` não é "Não", é ausência de marca. */
export function rotuloValidada(valor: boolean | null): string {
  if (valor === null) return SEM_DADO;
  return valor ? "Sim" : "Não";
}

export interface MediaComN {
  /** Média dos avaliados, ou `null` quando não há avaliado nenhum. */
  media: number | null;
  /** Quantos entes entraram na conta. Sempre exibido ao lado da média. */
  n: number;
}

/**
 * Média de ITP **só sobre avaliados**.
 *
 * `itp: null` é "Não Avaliado" e fica fora da conta; `Inexistente` tem índice
 * (pode ser 0) e fica dentro, que é a régua da própria fonte. A média é
 * arredondada a 1 decimal para bater com o número publicado pela Atricon.
 */
export function mediaAvaliados(valores: readonly (number | null)[]): MediaComN {
  const validos = valores.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (validos.length === 0) return { media: null, n: 0 };
  const soma = validos.reduce((total, v) => total + v, 0);
  return { media: Math.round((soma / validos.length) * 10) / 10, n: validos.length };
}

export interface SerieAno extends MediaComN {
  ano: number;
  entes: number;
}

/** Série anual de MG: total de entes, avaliados e média com N. */
export function seriePorAno(entes: readonly EntePntp[]): SerieAno[] {
  const anos = [...new Set(entes.map((e) => e.ano))].sort((a, b) => a - b);
  return anos.map((ano) => {
    const doAno = entes.filter((e) => e.ano === ano);
    const { media, n } = mediaAvaliados(doAno.map((e) => e.itp));
    return { ano, entes: doAno.length, ...{ media, n } };
  });
}

export interface ResumoAno extends MediaComN {
  ano: number;
  /** Entes no recorte (avaliados + não avaliados). */
  entes: number;
  naoAvaliados: number;
  /** Municípios distintos no recorte municipal do ciclo. */
  municipios: number;
  /** Municípios com pelo menos um ente municipal avaliado. */
  municipiosAvaliados: number;
  /** `municipiosAvaliados / municipios`, em %, 1 decimal. */
  pctMunicipiosAvaliados: number | null;
}

/**
 * Agregado de um ciclo, usado nos cartões de topo.
 *
 * O denominador de "municípios com avaliação" são os municípios que aparecem
 * no recorte municipal do ciclo — em MG são os 853 do estado, porque prefeitura
 * e câmara de cada um entram na planilha. Ente estadual fica fora dessa conta:
 * ele tem `municipio` "Belo Horizonte" na fonte, mas não é o município.
 */
export function resumoDoAno(entes: readonly EntePntp[], ano: number): ResumoAno {
  const doAno = entes.filter((e) => e.ano === ano);
  const municipais = doAno.filter((e) => e.esfera === "Municipal");
  const municipios = new Set(municipais.map((e) => e.municipio));
  const comAvaliacao = new Set(
    municipais.filter((e) => e.itp !== null).map((e) => e.municipio)
  );
  const { media, n } = mediaAvaliados(doAno.map((e) => e.itp));
  return {
    ano,
    entes: doAno.length,
    naoAvaliados: doAno.length - n,
    media,
    n,
    municipios: municipios.size,
    municipiosAvaliados: comAvaliacao.size,
    pctMunicipiosAvaliados:
      municipios.size === 0
        ? null
        : Math.round((comAvaliacao.size / municipios.size) * 1000) / 10,
  };
}

/** Uma contagem por rótulo, maior primeiro e desempate alfabético. */
export interface Contagem {
  rotulo: string;
  total: number;
}

function contarPor(entes: readonly EntePntp[], chave: (e: EntePntp) => string): Contagem[] {
  const mapa = new Map<string, number>();
  for (const ente of entes) {
    const valor = chave(ente);
    mapa.set(valor, (mapa.get(valor) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([rotulo, total]) => ({ rotulo, total }))
    .sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}

/** Contagem por nível (selo publicado pela fonte), sem recalcular nada. */
export function contagemPorNivel(entes: readonly EntePntp[]): Contagem[] {
  return contarPor(entes, (e) => e.nivel);
}

/** Contagem por poder no recorte. */
export function contagemPorPoder(entes: readonly EntePntp[]): Contagem[] {
  return contarPor(entes, (e) => e.poder);
}

/** Contagem por esfera no recorte. */
export function contagemPorEsfera(entes: readonly EntePntp[]): Contagem[] {
  return contarPor(entes, (e) => e.esfera);
}

/**
 * Recorte que viaja para o cliente: só o ciclo pedido, em tuplas.
 *
 * A página inteira tem 5.286 entes; o painel mostra um ciclo por vez. Filtrar
 * no servidor é o que impede o payload de carregar a série toda (regra 5.1:
 * coleção grande não vai como props de cliente).
 */
export function linhasDoAno(entes: readonly EntePntp[], ano: number): LinhaPntp[] {
  return entes
    .filter((e) => e.ano === ano)
    .map(
      (e): LinhaPntp => [
        e.orgao,
        e.poder,
        e.esfera,
        e.municipio,
        e.itp,
        e.pctEssenciais,
        e.nivel,
        e.validada,
      ]
    );
}

export interface FiltroLinhas {
  /** Poder exato; vazio/ausente = todos. */
  poder?: string;
  /** Esfera exata; vazio/ausente = todas. */
  esfera?: string;
  /** Nível (selo) exato; vazio/ausente = todos. */
  nivel?: string;
  /** Busca livre em órgão, município, poder e nível, sem acento. */
  busca?: string;
}

/** Filtro do painel. A busca é tolerante a acento; facetas são exatas. */
export function filtrarLinhas(
  linhas: readonly LinhaPntp[],
  filtro: FiltroLinhas = {}
): LinhaPntp[] {
  const alvo = semAcento((filtro.busca ?? "").trim());
  return linhas.filter((linha) => {
    if (filtro.poder && linha[INDICE.poder] !== filtro.poder) return false;
    if (filtro.esfera && linha[INDICE.esfera] !== filtro.esfera) return false;
    if (filtro.nivel && linha[INDICE.nivel] !== filtro.nivel) return false;
    if (!alvo) return true;
    return [
      linha[INDICE.orgao],
      linha[INDICE.municipio],
      linha[INDICE.poder],
      linha[INDICE.esfera],
      linha[INDICE.nivel],
    ].some((campo) => semAcento(campo).includes(alvo));
  });
}

export type DirecaoItp = "desc" | "asc" | "nenhuma";

/**
 * Ordena por ITP. **Nulo sempre no fim**, nas duas direções: ente não avaliado
 * não é o "pior" — ele não tem nota. Sem essa regra, crescente jogaria 131
 * "Não Avaliado" para o topo da lista, que é o oposto do que o dado diz.
 */
export function ordenarPorItp(linhas: readonly LinhaPntp[], direcao: DirecaoItp): LinhaPntp[] {
  if (direcao === "nenhuma") return [...linhas];
  const fator = direcao === "desc" ? -1 : 1;
  return [...linhas].sort((a, b) => {
    const itpA = a[INDICE.itp];
    const itpB = b[INDICE.itp];
    if (itpA === null && itpB === null) return a[INDICE.orgao].localeCompare(b[INDICE.orgao], "pt-BR");
    if (itpA === null) return 1;
    if (itpB === null) return -1;
    if (itpA !== itpB) return (itpA - itpB) * fator;
    return a[INDICE.orgao].localeCompare(b[INDICE.orgao], "pt-BR");
  });
}

/** Valores distintos de uma coluna, para os seletores de filtro. */
export function opcoesDe(linhas: readonly LinhaPntp[], coluna: 1 | 2 | 6): string[] {
  return [...new Set(linhas.map((linha) => linha[coluna]))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

/** CSVs do portal: BOM UTF-8 + ponto e vírgula, o que o Excel brasileiro lê. */
const BOM = "\uFEFF";
const SEPARADOR = ";";

/**
 * CSV das linhas filtradas na tela.
 *
 * Coluna de ITP e de essenciais sai **vazia** quando o ente não foi avaliado:
 * escrever 0 ali seria afirmar transparência zero de quem não entregou o
 * formulário — o mesmo erro que a tela evita com "—".
 */
export function linhasParaCsv(linhas: readonly LinhaPntp[], ano: number): string {
  const cabecalho = [
    "ano",
    "orgao",
    "poder",
    "esfera",
    "municipio",
    "itp",
    "pct_essenciais",
    "nivel",
    "validada",
  ];
  const corpo = linhas.map((linha) =>
    [
      String(ano),
      linha[INDICE.orgao],
      linha[INDICE.poder],
      linha[INDICE.esfera],
      linha[INDICE.municipio],
      linha[INDICE.itp] === null ? "" : formatarDecimal(linha[INDICE.itp]),
      linha[INDICE.pctEssenciais] === null ? "" : formatarDecimal(linha[INDICE.pctEssenciais]),
      linha[INDICE.nivel],
      rotuloValidada(linha[INDICE.validada]),
    ].map(campoCsv)
  );
  return [BOM + cabecalho.join(SEPARADOR), ...corpo.map((c) => c.join(SEPARADOR))].join("\n");
}

/**
 * Escapa um campo: aspas duplas, ponto e vírgula e quebra de linha obrigam
 * cerca. Sem isso, nome de órgão com ";" desloca a coluna e o CSV passa a
 * mentir.
 */
function campoCsv(valor: unknown): string {
  const texto = String(valor ?? "");
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// ─── Hub municipal ─────────────────────────────────────────────────────────

/** Nome de município comparável: sem acento, minúsculo, espaço simples. */
function chaveMunicipio(nome: string): string {
  return semAcento(nome).replace(/\s+/g, " ").trim();
}

/**
 * Entes **municipais** de uma cidade num ciclo, prefeitura antes de câmara.
 *
 * Filtra `esfera === "Municipal"` de propósito: a planilha da Atricon grava
 * "Belo Horizonte" também no campo `municipio` dos seis entes estaduais, e
 * casar só pelo nome poria o Tribunal de Justiça no cartão da prefeitura.
 * Devolve lista vazia quando a cidade não tem avaliação — o hub então não
 * renderiza o cartão, em vez de mostrar um bloco vazio.
 */
export function entesDaCidade(
  entes: readonly EntePntp[],
  municipio: string,
  ano: number
): EntePntp[] {
  const alvo = chaveMunicipio(municipio);
  const ordem: Record<string, number> = { Executivo: 0, Legislativo: 1 };
  return entes
    .filter(
      (e) =>
        e.ano === ano &&
        e.esfera === "Municipal" &&
        chaveMunicipio(e.municipio) === alvo
    )
    .sort((a, b) => (ordem[a.poder] ?? 9) - (ordem[b.poder] ?? 9) || a.orgao.localeCompare(b.orgao, "pt-BR"));
}
