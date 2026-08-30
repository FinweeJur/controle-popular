/**
 * coletar-vale3-cotacoes.mts — timeline do preço das ações da Vale (VALE3) na
 * B3, de 2015 até o ano corrente.
 *
 *   npx tsx --env-file=.env.local scripts/coletar-vale3-cotacoes.mts
 *   npx tsx --env-file=.env.local scripts/coletar-vale3-cotacoes.mts --de 2023 --ate 2026
 *
 * `--de`/`--ate` limitam os anos coletados e RETOMAM do JSON existente (os
 * anos fora da faixa ficam como estão) — retomada por checkpoint, como os
 * demais coletores deste repositório.
 *
 * Grava:
 *   - apps/web/data/vale3-cotacoes.json        (lido no build pela rota /paraopeba/vale)
 *   - apps/web/public/data/vale3-cotacoes.csv  (download em planilha, BOM + ";")
 *
 * ═══ FONTE ═══
 *
 * B3 — Séries Históricas (COTAHIST): arquivo anual em ZIP contendo um TXT de
 * largura fixa (não CSV). URL por ano:
 *
 *   https://bvmf.bmfbovespa.com.br/InstDados/SerHist/COTAHIST_A{ano}.ZIP
 *
 * Linhas que começam com "01" são registros de papel/dia. A linha "00" é
 * cabeçalho e é ignorada. Posições (1-based), CONFERIDAS contra o arquivo
 * real e contra o fechamento público de datas-chave:
 *
 *   DATA       3-10    AAAAMMDD
 *   CODNEG     13-24   (filtrar trim === "VALE3"; existe VALE3F no arquivo)
 *   PREABE     57-69   abertura, 11 dígitos + 2 decimais implícitos (/100)
 *   PREMAX     70-82   máxima
 *   PREMIN     83-95   mínima
 *   PREULT     96-108  preço do ÚLTIMO NEGÓCIO — não é o fechamento
 *   FECHAMENTO 109-121 preço de fechamento (última oferta do pregão)
 *   TOTNEG     147-152 nº de negócios (não é usado na saída; confere o parse)
 *   VOLTOT     170-188 volume em R$ × 100 (/100)
 *
 * ═══ POR QUE O FECHAMENTO É 109-121 E NÃO 96-108 (verificado em campo) ═══
 *
 * A primeira leitura usou 96-108 (PREULT, "último negócio") e parecia
 * certa — até cruzar com o fechamento público: em 28/01/2019, o primeiro
 * pregão após o rompimento de Brumadinho, o PREULT diz 44,39 e a imprensa
 * e a B3 registraram fechamento de 42,38 (queda de 24,5%). O campo 109-121
 * (última oferta do pregão) é o que os provedores de cotações usam como
 * fechamento. Conferências que bateram exatas: 02/01/2015 → 21,28;
 * 24/01/2019 → 56,15; 28/01/2019 → 42,38; 29/01/2019 → 42,74;
 * 04/02/2021 (Acordo) → 90,4x. O PREULT (96-108) fica uns centavos longe
 * do fechamento em dias normais e erra feio em dias de pânico.
 *
 * ═══ UMA LACUNA DA FONTE QUE A PÁGINA PRECISA DIZER ═══
 *
 * 25/01/2019 (sexta, dia do rompimento de Brumadinho, às 12h28) NÃO tem
 * pregão no arquivo: foi feriado municipal na B3 (aniversário de São
 * Paulo). A queda de 24,5% aparece no primeiro pregão seguinte, 28/01.
 *
 * ═══ O QUE ESTE DADO NÃO É ═══
 *
 * São preços BRUTOS de pregão, sem ajuste por proventos (dividendos, JCP).
 * VALE3 não teve desdobramento/grupamento no período, então a série é
 * contínua — mas "preço bruto" continua sendo o rótulo correto, e a página
 * que consome este arquivo diz isso colado ao gráfico (regra editorial do
 * portal: o número vem do dado, a ressalva viaja com ele).
 *
 * ═══ REDE HONESTA ═══
 *
 * User-Agent identifica o projeto. Sem browser falso. Até 3 tentativas por
 * ano (a inicial + 2 retries com backoff). Não roda na CI — é coleta manual,
 * como os demais coletores de fonte pública deste repositório.
 *
 * ═══ DESEMPENHO (medido ao escrever) ═══
 *
 * Os arquivos de 2023 e 2026 têm TXT de ~550-650 MB (método 8 = deflate). O
 * script NÃO converte o TXT em string (estouraria o limite do V8): itera o
 * Buffer linha a linha com indexOf("\n") e só converte as linhas VALE3. O ZIP
 * é lido pela central directory — o ZIP de 2026 usa data descriptors (o
 * header local reporta tamanho 0) e a leitura por headers locais falharia.
 */
import { mkdirSync } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DESTINO_JSON = path.join(AQUI, "..", "data", "vale3-cotacoes.json");
const DESTINO_CSV = path.join(AQUI, "..", "public", "data", "vale3-cotacoes.csv");
const USER_AGENT = "ControlePopular/1.0 (+https://controlepopular.com.br)";
const LOG = "[vale3]";

/** Anos completos + o corrente (2026). */
const ANOS = Array.from({ length: 2026 - 2015 + 1 }, (_, i) => 2015 + i);

/**
 * `--de ANO` / `--ate ANO` limitam a faixa coletada. Sem flags, coleta todos
 * os anos do zero (e sobrescreve os pregões com a coleta nova).
 */
function faixaDaLinhaDeComando(): { de: number; ate: number } {
  const args = process.argv.slice(2);
  const pega = (flag: string): number | null => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : null;
  };
  const de = pega("--de") ?? ANOS[0];
  const ate = pega("--ate") ?? ANOS[ANOS.length - 1];
  if (
    !Number.isInteger(de) ||
    !Number.isInteger(ate) ||
    de < ANOS[0] ||
    ate > ANOS[ANOS.length - 1] ||
    de > ate
  ) {
    console.error(
      `${LOG} uso: tsx scripts/coletar-vale3-cotacoes.mts [--de ANO] [--ate ANO] ` +
        `(anos de ${ANOS[0]} a ${ANOS[ANOS.length - 1]})`
    );
    process.exit(1);
  }
  return { de, ate };
}

interface Cotacao {
  data: string; // YYYY-MM-DD
  abertura: number;
  maxima: number;
  minima: number;
  fechamento: number;
  volume: number; // R$ (inteiro; VOLTOT/100)
}

/** Formato do JSON gravado (e lido na retomada por checkpoint). */
interface AcervoVale {
  fonte: string;
  ultima_atualizacao: string;
  cotacoes: Cotacao[];
}

/** Número de 11 dígitos + 2 decimais em campo de 13 chars → /100. */
function precoDe(buffer: Buffer, inicio: number, fim: number): number {
  const inteiro = Number(buffer.subarray(inicio, fim).toString("latin1").trim());
  return Math.round(inteiro) / 100;
}

function dataIsoDe(buffer: Buffer): string | null {
  const bruto = buffer.subarray(2, 10).toString("latin1");
  if (!/^\d{8}$/.test(bruto)) return null;
  return `${bruto.slice(0, 4)}-${bruto.slice(4, 6)}-${bruto.slice(6, 8)}`;
}

/**
 * Lê as entradas de um ZIP pela central directory. Funciona também com ZIPs
 * gravados em modo streaming (data descriptors), onde o header local reporta
 * tamanho 0 — é o caso do COTAHIST_A2026.ZIP.
 */
function lerZip(buffer: Buffer): { nome: string; dados: Buffer }[] {
  let eocd = -1;
  const fim = buffer.length;
  for (let i = fim - 22; i >= Math.max(0, fim - 22 - 65536); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error("ZIP sem EOCD (arquivo truncado?)");
  const total = buffer.readUInt16LE(eocd + 10);
  const cdOffset = buffer.readUInt32LE(eocd + 16);
  const saida: { nome: string; dados: Buffer }[] = [];
  let off = cdOffset;
  for (let i = 0; i < total; i++) {
    if (buffer.readUInt32LE(off) !== 0x02014b50) {
      throw new Error(`entrada ${i} do ZIP com header inválido`);
    }
    const metodo = buffer.readUInt16LE(off + 10);
    const tamanhoComp = buffer.readUInt32LE(off + 20);
    const nomeLen = buffer.readUInt16LE(off + 28);
    const extraLen = buffer.readUInt16LE(off + 30);
    const comentarioLen = buffer.readUInt16LE(off + 32);
    const lho = buffer.readUInt32LE(off + 42);
    const nome = buffer.subarray(off + 46, off + 46 + nomeLen).toString("latin1");
    const lhoNomeLen = buffer.readUInt16LE(lho + 26);
    const lhoExtraLen = buffer.readUInt16LE(lho + 28);
    const inicioDados = lho + 30 + lhoNomeLen + lhoExtraLen;
    const dados = buffer.subarray(inicioDados, inicioDados + tamanhoComp);
    if (metodo === 0) {
      saida.push({ nome, dados });
    } else if (metodo === 8) {
      saida.push({ nome, dados: inflateRawSync(dados) });
    } else {
      throw new Error(`método de compressão ${metodo} não suportado em ${nome}`);
    }
    off += 46 + nomeLen + extraLen + comentarioLen;
  }
  return saida;
}

/** Itera as linhas de um Buffer sem criar string gigante (2023/2026: ~600 MB). */
function* linhasDe(buffer: Buffer): Generator<Buffer> {
  let inicio = 0;
  while (inicio < buffer.length) {
    const nl = buffer.indexOf(10, inicio);
    if (nl === -1) {
      if (inicio < buffer.length) yield buffer.subarray(inicio);
      break;
    }
    yield buffer.subarray(inicio, nl);
    inicio = nl + 1;
  }
}

async function baixarAno(ano: number): Promise<Buffer> {
  const url = `https://bvmf.bmfbovespa.com.br/InstDados/SerHist/COTAHIST_A${ano}.ZIP`;
  let ultimoErro = "";
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const resposta = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(180_000),
      });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const buf = Buffer.from(await resposta.arrayBuffer());
      // Um ZIP de um ano inteiro de negociação não pode ser minúsculo. Este
      // guarda separa "download ok de página de erro" de "download ok".
      if (buf.length < 100_000) throw new Error(`ZIP com ${buf.length} bytes (impossível p/ um ano)`);
      return buf;
    } catch (e) {
      ultimoErro = (e as Error).message;
      console.warn(`${LOG} ${ano}: tentativa ${tentativa}/3 falhou — ${ultimoErro}`);
      if (tentativa < 3) await new Promise((r) => setTimeout(r, 2000 * tentativa));
    }
  }
  throw new Error(`ano ${ano} falhou nas 3 tentativas: ${ultimoErro}`);
}

/** Baixa, descompacta e guarda os pregões de VALE3 de um ano. */
async function coletarAno(ano: number, cotacoes: Map<string, Cotacao>): Promise<void> {
  try {
    const zip = await baixarAno(ano);
    let n = 0;
    let ignoradas = 0;
    for (const entrada of lerZip(zip)) {
      if (!entrada.nome.toUpperCase().endsWith(".TXT")) continue;
      for (const linha of linhasDe(entrada.dados)) {
        if (linha.length < 188) continue;
        // "01" = registro de papel/dia; a linha "00" (cabeçalho) cai aqui.
        if (linha[0] !== 48 || linha[1] !== 49) continue;
        if (linha.subarray(12, 24).toString("latin1").trim() !== "VALE3") continue;
        const data = dataIsoDe(linha);
        if (!data) continue;
        const abertura = precoDe(linha, 56, 69);
        const maxima = precoDe(linha, 69, 82);
        const minima = precoDe(linha, 82, 95);
        const fechamento = precoDe(linha, 108, 121);
        const volume = Math.round(Number(linha.subarray(169, 188).toString("latin1").trim()) / 100);
        if (!Number.isFinite(abertura) || !Number.isFinite(fechamento) || fechamento <= 0) {
          ignoradas++;
          continue;
        }
        cotacoes.set(data, { data, abertura, maxima, minima, fechamento, volume });
        n++;
      }
    }
    console.log(
      `${LOG} ${ano}: ${n} pregões de VALE3 (${ignoradas} linha(s) ignoradas), ` +
        `ZIP ${zip.length.toLocaleString("pt-BR")} bytes`
    );
  } catch (e) {
    // Não derruba a coleta inteira por causa de um ano — mas o aviso é
    // inconfundível, porque um ano faltando muda a leitura da série.
    console.error(`${LOG} ${ano}: ERRO — ${(e as Error).message}`);
  }
}

/** Decimais com vírgula, sem separador de milhar — como o Excel pt-BR lê CSV com ";". */
function numeroCsv(v: number): string {
  return v.toFixed(2).replace(".", ",");
}

function gerarCsv(cotacoes: Cotacao[]): string {
  const BOM = "\ufeff";
  const cabecalho = "data;abertura;maxima;minima;fechamento;volume";
  const corpo = cotacoes.map((c) =>
    [
      c.data,
      numeroCsv(c.abertura),
      numeroCsv(c.maxima),
      numeroCsv(c.minima),
      numeroCsv(c.fechamento),
      numeroCsv(c.volume),
    ].join(";"),
  );
  return BOM + [cabecalho, ...corpo].join("\r\n") + "\r\n";
}

async function main(): Promise<void> {
  const inicio = Date.now();
  const { de, ate } = faixaDaLinhaDeComando();
  const cotacoes = new Map<string, Cotacao>();

  // Retomada por checkpoint: o JSON existente vira o ponto de partida, e os
  // anos da faixa escolhida são recolhidos por cima (mesma semântica dos
  // coletores deste repo — um arquivo incompleto nunca zera o que já existe).
  try {
    const existente = JSON.parse(await readFile(DESTINO_JSON, "utf8")) as AcervoVale;
    for (const c of existente.cotacoes ?? []) cotacoes.set(c.data, c);
    console.log(`${LOG} retomando: ${cotacoes.size} pregões já no arquivo; coletando ${de}..${ate}`);
  } catch {
    console.log(`${LOG} coleta nova: ${de}..${ate} — ${USER_AGENT}`);
  }

  for (const ano of ANOS) {
    if (ano < de || ano > ate) continue;
    await coletarAno(ano, cotacoes);
  }

  const lista = [...cotacoes.values()].sort((a, b) => (a.data < b.data ? -1 : 1));
  if (lista.length === 0) {
    console.error(`${LOG} ERRO: nenhuma cotação coletada. Nada foi gravado.`);
    process.exit(1);
  }

  // ── Verificações de sanidade contra valores públicos conhecidos ──
  const porData = (d: string) => lista.find((c) => c.data === d);
  const conferencias: [string, string][] = [
    ["2015-01-02", "primeiro pregão da série (ab 21,70 / máx 21,95 / mín 21,06 / fech 21,28)"],
    ["2019-01-24", "véspera do rompimento de Brumadinho (25/01 foi feriado na B3)"],
    ["2019-01-28", "1º pregão após Brumadinho — queda de ~24,5% no fechamento"],
    ["2021-02-04", "assinatura do Acordo de reparação (fechamento ~R$ 90,4)"],
    ["2021-05-11", "pico da série (fechamento 118,72)"],
    ["2016-02-02", "mínima da série (fechamento 8,60)"],
  ];
  for (const [d, desc] of conferencias) {
    const c = porData(d);
    if (c) {
      console.log(
        `${LOG} conferência ${d} (${desc}): aber ${c.abertura} máx ${c.maxima} mín ${c.minima} fech ${c.fechamento} vol R$ ${c.volume}`
      );
    } else {
      console.warn(`${LOG} conferência ${d} não encontrada (${desc})`);
    }
  }

  const fechamentos = lista.map((c) => c.fechamento);
  const maior = Math.max(...fechamentos);
  const menor = Math.min(...fechamentos);
  const diaMaior = lista.find((c) => c.fechamento === maior)!;
  const diaMenor = lista.find((c) => c.fechamento === menor)!;
  console.log(
    `${LOG} série: ${lista.length} pregões, ${lista[0].data} a ${lista[lista.length - 1].data}; ` +
      `maior fechamento ${maior} em ${diaMaior.data}; menor fechamento ${menor} em ${diaMenor.data}`
  );

  const agora = new Date();
  const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
  const json = {
    fonte: "B3 — Séries Históricas (COTAHIST)",
    ultima_atualizacao: hoje,
    cotacoes: lista,
  };

  mkdirSync(path.dirname(DESTINO_JSON), { recursive: true });
  mkdirSync(path.dirname(DESTINO_CSV), { recursive: true });
  // Indent de 1 espaço + CRLF, mesmo formato dos outros JSON de dados do repo.
  const textoJson = JSON.stringify(json, null, 1).replace(/\n/g, "\r\n") + "\r\n";
  await writeFile(DESTINO_JSON, textoJson, "utf8");
  await writeFile(DESTINO_CSV, gerarCsv(lista), "utf8");
  const tamCsv = (await stat(DESTINO_CSV)).size;

  console.log(`${LOG} ✓ ${path.relative(process.cwd(), DESTINO_JSON)} — ${textoJson.length.toLocaleString("pt-BR")} bytes`);
  console.log(`${LOG} ✓ ${path.relative(process.cwd(), DESTINO_CSV)} — ${tamCsv.toLocaleString("pt-BR")} bytes, BOM + ";"`);
  console.log(`${LOG} fim em ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error(`${LOG} ERRO fatal:`, e);
  process.exit(1);
});
