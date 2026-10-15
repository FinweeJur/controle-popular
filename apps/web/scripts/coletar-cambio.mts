/**
 * Coletor de câmbio do dia — Pilar 2b do
 * docs/planos/PLANO-CI-RAG-INGESTAO-UNIDADES.md (Fase 5).
 *
 * ═══ O QUE FAZ ═══
 *
 * Busca a cotação de venda do dólar (USD) e do euro (EUR) em reais e grava
 * `apps/web/data/cambio-dia.json`. Quem consome é a camada de unidades
 * (`lib/transformacao/unidades.ts`, Pilar 2), que ontem usava fator fixo de
 * referência (5,50 R$/US$) e passa a ler o JSON do dia; sem o arquivo, cai
 * no mesmo fator fixo como fallback.
 *
 * ═══ FONTES (oficiais primeiro) ═══
 *
 * 1. Banco Central do Brasil, API pública Olinda do PTAX — boletim diário
 *    oficial de câmbio do BC. Endpoints confirmados no $metadata público de
 *    https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata :
 *    - CotacaoDolarPeriodo(dataInicial, dataFinalCotacao)
 *    - CotacaoMoedaPeriodo(moeda='EUR', dataInicial, dataFinalCotacao)
 * 2. Fallback (só se o BC falhar por rede/timeout/status/corpo vazio):
 *    AwesomeAPI https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL
 *
 * ═══ DECISÕES ═══
 *
 * - JANELA DE 7 DIAS no BC (dataInicial = hoje-7): a PTAX não fecha cotação
 *   de manhã, de madrugada e no fim de semana. A janela devolve sempre o
 *   último dia útil; pegamos o registro de MAIOR dataHoraCotacao e usamos
 *   a data dele (a cotação é do dia do boletim, não de hoje à toa).
 * - `cotacaoVenda` = quantos reais custam para COMPRAR 1 (USD/EUR) — é o
 *   número que o cidadão vê no cartório. No fallback, o `ask` da AwesomeAPI
 *   tem o mesmo significado. `Number()` nos dois.
 * - Janela de datas em MM-DD-YYYY, formato do OData do BC (datas entre
 *   aspas simples: @dataInicial='10-08-2026').
 * - Fallback gracioso: sem cotação, imprime aviso em português e sai com
 *   exit 0 SEM gravar arquivo — o consumidor usa o fator fixo e a esteira
 *   nunca derruba por falta de câmbio (mesmo padrão do `continue-on-error`
 *   no passo da CI). Exit != 0 só para erro de programa: JSON malformado do
 *   arquivo já existente ao ler, ou falha de escrita (sem permissão).
 * - USD sem EUR: grava só o USD e avisa — melhor dado parcial que nada.
 * - Cotação já de hoje: regrava normalmente (mesma fonte pode ter
 *   atualizado o boletim), mas avisa que já estava atualizado.
 * - Sem dependência nova: `node:fs`, `node:path`, `node:url` e o `fetch`
 *   nativo do Node 22. UTF-8, sem segredo (API pública). Uma coleta a cada
 *   corrida, página < 1 KB.
 * - Cobertura de robôs: robots.txt do BC (www.bcb.gov.br) traz `Allow: /`
 *   para todos os agentes; o subdomínio Olinda não publica o arquivo — é
 *   API aberta de dados do próprio BC. Medido em 15/10/2026.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CAMINHO_SAIDA = path.resolve(AQUI, "../data/cambio-dia.json");

/** Nome da moeda na chave do JSON consumido por unidades.ts. */
type Moeda = "USD" | "EUR";

/** Estrutura EXATA do arquivo apps/web/data/cambio-dia.json (não mude). */
type CambioDoDia = {
  /** YYYY-MM-DD da cotação usada (pode ser o último dia útil anterior). */
  data: string;
  /** ISO 8601 UTC do momento desta coleta. */
  geradoEm: string;
  /** Origem legível da fonte dos dados. */
  origem: string;
  /** URL da fonte consultada. */
  fonte: string;
  /** Cotação de venda em reais por 1 unidade da moeda. */
  cotacoes: Partial<Record<Moeda, number>>;
};

const BASE_PTAX = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";
const ORIGEM_PTAX = "Banco Central do Brasil (PTAX)";
const URL_FALLBACK = "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL";
const ORIGEM_FALLBACK = "AwesomeAPI (economia.awesomeapi.com.br)";
/** Janela OData: dia de hoje menos N dias (formato MM-DD-YYYY do PTAX). */
const JANELA_DIAS = 7;
/** Tempo máximo de cada requisição HTTP, em ms. */
const TIMEOUT_MS = 10_000;

/** Hoje (UTC) no formato AAAA-MM-DD, data usada como fim da janela PTAX. */
function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Data no formato MM-DD-YYYY exigido pela PTAX (OData). */
function formatoPtax(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${mes}-${dia}-${ano}`;
}

/** Fetch JSON com timeout e aviso; devolve null se a rede/status falhou. */
async function buscarJson(url: string): Promise<unknown | null> {
  try {
    const resposta = await fetch(url, {
      headers: { "User-Agent": "ControlePopular/1.0 (portal civico controlepopular.com.br)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!resposta.ok) {
      console.error(
        `[coletar-cambio] aviso: resposta ${resposta.status} de ${url}; tentando outra fonte`
      );
      return null;
    }
    return JSON.parse(await resposta.text());
  } catch (e) {
    console.error(
      `[coletar-cambio] aviso: falha de rede ao consultar ${url} (${e instanceof Error ? e.message : e}); tentando outra fonte`
    );
    return null;
  }
}

/** Janela OData montada com as datas de hoje−7 até hoje. */
function janelaPtax(): string {
  const dia = new Date();
  dia.setUTCDate(dia.getUTCDate() - JANELA_DIAS);
  return `@dataInicial='${formatoPtax(dia.toISOString().slice(0, 10))}'&@dataFinalCotacao='${formatoPtax(hojeISO())}'`;
}

/** Cotação de venda do registro de maior dataHoraCotacao, com a data dele. */
function escolherMaisRecente(registros: unknown): { valor: number; data: string } | null {
  if (typeof registros !== "object" || registros === null) return null;
  let melhor: { valor: number; data: string } | null = null;
  // Compara a data/hora COMPLETA (não a data cortada): a API pode devolver
  // ascendente ou descendente, e guardar só AAAA-MM-DD faria qualquer linha
  // do mesmo dia vencer a anterior — aí o boletim escolhido seria o da
  // abertura, não o do fechamento.
  let melhorHora = "";
  for (const item of (registros as { value?: unknown[] }).value ?? []) {
    if (typeof item !== "object" || item === null) continue;
    const linha = item as { cotacaoVenda?: unknown; dataHoraCotacao?: unknown };
    const valor = Number(linha.cotacaoVenda);
    const hora = typeof linha.dataHoraCotacao === "string" ? linha.dataHoraCotacao : "";
    if (!Number.isFinite(valor) || valor <= 0 || !hora) continue;
    if (hora > melhorHora) {
      melhorHora = hora;
      melhor = { valor, data: hora.slice(0, 10) };
    }
  }
  return melhor;
}

/** USD+EUR do Banco Central (PTAX), cada um pelo seu endpoint. */
async function coletarPtax(): Promise<CambioDoDia | null> {
  const janela = janelaPtax();
  const urlDolar = `${BASE_PTAX}/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?${janela}&$format=json`;
  const urlEuro = `${BASE_PTAX}/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@moeda='EUR'&${janela}&$format=json`;

  const dolar = escolherMaisRecente(await buscarJson(urlDolar));
  const euro = escolherMaisRecente(await buscarJson(urlEuro));
  return cotacoesParaArquivo(dolar, euro, ORIGEM_PTAX, BASE_PTAX + "/");
}

/** USD+EUR da AwesomeAPI: `ask` = venda, data = create_date (YYYY-MM-DD). */
async function coletarAwesomeapi(): Promise<CambioDoDia | null> {
  const corpo = await buscarJson(URL_FALLBACK);
  if (typeof corpo !== "object" || corpo === null) return null;
  const le = (par: string): { valor: number; data: string } | null => {
    const reg = (corpo as Record<string, Record<string, unknown>>)[par];
    const valor = Number(reg?.ask);
    if (!Number.isFinite(valor) || valor <= 0) return null;
    return { valor, data: String(reg?.create_date ?? "").slice(0, 10) };
  };
  const dolar = le("USDBRL");
  const euro = le("EURBRL");
  return cotacoesParaArquivo(dolar, euro, ORIGEM_FALLBACK, URL_FALLBACK);
}

/**
 * Junta USD+EUR no formato final (ou devolve null se nenhum veio).
 * Caso USD sem EUR: grava só o USD — melhor dado parcial que nada —
 * e o consumidor cai no fator fixo só para o euro.
 */
function cotacoesParaArquivo(
  dolar: { valor: number; data: string } | null,
  euro: { valor: number; data: string } | null,
  origem: string,
  fonte: string
): CambioDoDia | null {
  if (dolar === null && euro === null) return null;
  if (dolar === null || euro === null) {
    const moedaFaltando = dolar === null ? "USD" : "EUR";
    console.error(
      `[coletar-cambio] aviso: ${moedaFaltando} não veio; o consumidor cai no fator fixo para ${moedaFaltando}`
    );
  }
  const cotacoes: Partial<Record<Moeda, number>> = {};
  if (dolar !== null) cotacoes.USD = dolar.valor;
  if (euro !== null) cotacoes.EUR = euro.valor;
  // Ao menos um veio (o if acima já devolve null quando os dois falham).
  const alguma = dolar ?? euro;
  if (alguma === null) return null;
  return {
    data: alguma.data,
    geradoEm: new Date().toISOString(),
    origem,
    fonte,
    cotacoes,
  };
}

/** Lê a data do arquivo anterior; JSON malformado é erro de PROGRAMA (exit 1). */
function lerDataAnterior(): string | null {
  if (!existsSync(CAMINHO_SAIDA)) return null;
  const bruto = JSON.parse(readFileSync(CAMINHO_SAIDA, "utf8")) as { data?: unknown };
  if (typeof bruto?.data !== "string") {
    throw new Error(
      `[coletar-cambio] erro de programa: ${CAMINHO_SAIDA} existente não traz "data" (string). Corrija o arquivo antes de rodar de novo.`
    );
  }
  return bruto.data;
}

async function main(): Promise<void> {
  const dataAnterior = lerDataAnterior();
  const arquivo = (await coletarPtax()) ?? (await coletarAwesomeapi());

  if (arquivo === null) {
    console.error(
      "[coletar-cambio] aviso: nenhuma fonte entregou cotação. Sem arquivo novo — quem consome usa o fator fixo da tabela de conversão (lib/transformacao/unidades.ts)."
    );
    return; // fallback gracioso: exit 0, sem gravar
  }
  gravar(arquivo);
  if (dataAnterior === arquivo.data) {
    console.log(
      `[coletar-cambio] a cotação de ${arquivo.data} já estava atualizada; regravando por garantia (o boletim pode ter sido revisado).`
    );
  }
}

/** Grava o JSON final (2 espaços + newline, diff legível). Erro de escrita sobe. */
function gravar(arquivo: CambioDoDia): void {
  writeFileSync(CAMINHO_SAIDA, `${JSON.stringify(arquivo, null, 2)}\n`, "utf8");
  console.log(
    `[coletar-cambio] cotação de ${arquivo.data} gravada em ${CAMINHO_SAIDA}\n` +
      `[coletar-cambio] USD: ${arquivo.cotacoes.USD ?? "(não veio)"} | EUR: ${arquivo.cotacoes.EUR ?? "(não veio)"}\n` +
      `[coletar-cambio] origem: ${arquivo.origem}`
  );
}

main().catch((e) => {
  console.error("[coletar-cambio] falhou:", e);
  process.exit(1);
});
