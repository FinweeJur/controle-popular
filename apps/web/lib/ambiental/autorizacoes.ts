/**
 * Destinações de Imóveis da União em Minas Gerais (Plano 3 — Autorizações Territoriais).
 *
 * Papel no portal: publicar o cadastro público dos imóveis da União em MG, com a
 * destinação e o regime de cada um. A rota continua sendo `/ambiental/autorizacoes`
 * por compatibilidade; o conteúdo mudou de "autorizações fabricadas" para o dado real.
 *
 * Fonte oficial:
 * - SPU — Secretaria do Patrimônio da União (Ministério da Gestão e Inovação),
 *   Painel de Transparência Ativa, aba "Imóveis da União", filtro UF=MG.
 *   `fonteUrl`: https://qlik-publico.paineis.gov.br/extensions/transparencia-ativa/transparencia-ativa.html
 *   Arquivo versionado: `apps/web/data/destinacoes-uniao-mg.json` (553 imóveis, 27 municípios).
 *
 * ═══ O QUE ESTE DADO É, E O QUE ELE NÃO É ═══
 *
 * É o cadastro de imóveis da União com o regime/destinação de cada um. NÃO é a
 * relação nominal de TAUS/CDRU: o termo individual de autorização não é publicado
 * neste cadastro. A `ressalva` dos metadados diz isso e precisa ficar visível na
 * tela — dois dados verdadeiros lado a lado não podem sugerir uma conclusão falsa.
 *
 * ═══ DECISÕES TÉCNICAS ═══
 *
 * - Este módulo é isomórfico de propósito: NÃO importa `node:fs`. O carregamento
 *   do arquivo vive em `destinacoes-uniao-dados.ts` (server-only), porque o
 *   componente de cliente importa daqui e o `node:fs` quebraria o build do
 *   webpack (medido em 29/09/2026: UnhandledSchemeError em `node:path`).
 * - As funções puras (filtro, métricas, CSV, microresumo) são as que o cliente
 *   usa.
 * - Busca tolerante a acento e maiúscula via `semAcento` (mesma normalização da
 *   busca global do portal, `lib/busca/normalizar.ts`).
 * - Política Zero CPF: o cadastro do SPU não traz CPF; o teste cobre a regex.
 */

import { semAcento } from "@/lib/busca/normalizar";

/** Um imóvel da União em MG, como consta no cadastro do SPU. */
export interface ImovelUniao {
  /** Identificador estável montado como `uniao-mg-<rip>`. */
  id: string;
  /** RIP — Registro Imobiliário Patrimonial, a chave do imóvel na SPU. */
  rip: string;
  municipio: string;
  /** Área em hectares. Pode ser pequena (terreno urbano) ou grande (gleba). */
  areaHa: number;
  /** Destinação resumida (faceta principal da lista). */
  destinacao: string;
  /** Regime de destinação completo, como a fonte publica (pode combinar vários). */
  regimeCompleto: string;
  classe: string;
  tipo: string;
  proprietario: string;
  latitude: number;
  longitude: number;
  fonte: string;
  fonteUrl: string;
}

/** Metadados do acervo, gerados na coleta. Números vêm do dado, não digitados. */
export interface MetadadosDestinacoesUniao {
  titulo: string;
  fonte: string;
  fonteUrl: string;
  dataAcessoFonte: string;
  geradoEm: string;
  dataReferencia: string;
  total: number;
  totalMunicipios: number;
  porDestinacao: Record<string, number>;
  /** Aviso editorial obrigatório: cadastro de imóveis ≠ relação de TAUS/CDRU. */
  ressalva: string;
}

/** Acervo completo: metadados mais a lista de imóveis. */
export interface AcervoDestinacoesUniao {
  metadados: MetadadosDestinacoesUniao;
  imoveis: ImovelUniao[];
}

/** Agregados para os cartões de topo e o microresumo cívico. */
export interface MetricasDestinacoes {
  total: number;
  areaTotalHa: number;
  municipiosAtendidos: number;
  distribuicaoPorDestinacao: Record<string, number>;
  distribuicaoPorClasse: Record<string, number>;
}

/**
 * Filtra imóveis por busca textual e facetas.
 *
 * A busca casa município, tipo, classe e proprietário, ignorando acento e caixa.
 * As facetas são comparação exata; valor vazio, "todas" ou "todos" desliga o filtro.
 */
export function filtrarDestinacoes(
  imoveis: ImovelUniao[],
  filtros: {
    busca?: string;
    destinacao?: string;
    classe?: string;
    proprietario?: string;
  },
): ImovelUniao[] {
  const termo = filtros.busca ? semAcento(filtros.busca.trim()) : "";

  return imoveis.filter((item) => {
    if (termo) {
      const campos = [item.municipio, item.tipo, item.classe, item.proprietario];
      const bate = campos.some((campo) => semAcento(campo).includes(termo));
      if (!bate) return false;
    }

    if (
      filtros.destinacao &&
      filtros.destinacao !== "todas" &&
      filtros.destinacao !== "todos" &&
      item.destinacao !== filtros.destinacao
    ) {
      return false;
    }

    if (
      filtros.classe &&
      filtros.classe !== "todas" &&
      filtros.classe !== "todos" &&
      item.classe !== filtros.classe
    ) {
      return false;
    }

    if (
      filtros.proprietario &&
      filtros.proprietario !== "todos" &&
      filtros.proprietario !== "todas" &&
      item.proprietario !== filtros.proprietario
    ) {
      return false;
    }

    return true;
  });
}

/** Conta ocorrências por chave textual, sem dependência externa. */
function contarPor<T>(itens: T[], chave: keyof T): Record<string, number> {
  const mapa: Record<string, number> = {};
  for (const item of itens) {
    const valor = String(item[chave] ?? "Não informado");
    mapa[valor] = (mapa[valor] ?? 0) + 1;
  }
  return mapa;
}

/**
 * Calcula total, área somada, municípios atendidos e distribuições.
 *
 * A área total vem da soma dos hectares do dado — nunca digitada à mão.
 */
export function calcularMetricasDestinacoes(
  imoveis: ImovelUniao[],
): MetricasDestinacoes {
  const municipios = new Set<string>();
  let areaTotalHa = 0;

  for (const item of imoveis) {
    areaTotalHa += item.areaHa;
    municipios.add(item.municipio);
  }

  return {
    total: imoveis.length,
    areaTotalHa,
    municipiosAtendidos: municipios.size,
    distribuicaoPorDestinacao: contarPor(imoveis, "destinacao"),
    distribuicaoPorClasse: contarPor(imoveis, "classe"),
  };
}

/** Escapa célula de CSV: aspas duplicadas e delimitador entre aspas. */
function escaparCsv(valor: string | number): string {
  const s = String(valor);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Vírgula decimal, sem separador de milhar — como o Excel pt-BR lê CSV com `;`. */
function numeroCsv(valor: number): string {
  return valor.toFixed(4).replace(".", ",");
}

const CABECALHO_CSV = [
  "RIP",
  "Município",
  "Destinação",
  "Regime completo",
  "Classe",
  "Tipo",
  "Proprietário",
  "Área (ha)",
  "Latitude",
  "Longitude",
  "Fonte",
  "Fonte URL",
];

/**
 * Gera CSV do que foi filtrado na tela: separador `;` e BOM UTF-8 (`\uFEFF`),
 * para o Excel brasileiro abrir com acento correto e colunas separadas.
 */
export function gerarCsvDestinacoes(imoveis: ImovelUniao[]): string {
  const linhas = imoveis.map((item) =>
    [
      item.rip,
      item.municipio,
      item.destinacao,
      item.regimeCompleto,
      item.classe,
      item.tipo,
      item.proprietario,
      numeroCsv(item.areaHa),
      numeroCsv(item.latitude),
      numeroCsv(item.longitude),
      item.fonte,
      item.fonteUrl,
    ]
      .map(escaparCsv)
      .join(";"),
  );

  return "\uFEFF" + [CABECALHO_CSV.join(";"), ...linhas].join("\r\n");
}

/** Formata número grande em pt-BR (sem casas decimais na área). */
function numeroBR(valor: number): string {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

/**
 * Microresumo cívico no padrão "Seu Nonô": frases diretas de até 13 palavras.
 *
 * Cada frase carrega um número medido; a última repete a ressalva editorial.
 */
export function gerarMicroresumoDestinacoes(
  metricas: MetricasDestinacoes,
): string[] {
  return [
    `Cadastro do SPU lista ${numeroBR(metricas.total)} imóveis da União em Minas.`,
    `Somam ${numeroBR(metricas.areaTotalHa)} hectares em ${numeroBR(metricas.municipiosAtendidos)} municípios mineiros.`,
    `A destinação mais comum reúne ${numeroBR(maiorValor(metricas.distribuicaoPorDestinacao))} imóveis do total.`,
    `Isto é cadastro de imóveis, não lista de TAUS ou CDRU.`,
  ];
}

/** Maior contagem de um mapa de distribuição; 0 quando vazio. */
function maiorValor(mapa: Record<string, number>): number {
  let maior = 0;
  for (const valor of Object.values(mapa)) {
    if (valor > maior) maior = valor;
  }
  return maior;
}
