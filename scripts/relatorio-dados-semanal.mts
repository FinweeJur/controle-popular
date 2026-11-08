/**
 * scripts/relatorio-dados-semanal.mts - retrato semanal do frescor dos dados.
 *
 * Papel no portal: responder, com NUMEROS e sem modelo de IA, "quais dados
 * estao atualizados e quando foi a ultima coleta?" para TODOS os blocos do
 * portal - jurisprudencia, ambiental, transparencia, editais, concursos,
 * noticias e memoria. O `vigia-coletores.mts` cobre so as fontes de arquivo do
 * registry; este relatorio soma o banco Postgres e as categorias que o dono
 * pediu em 08/11/2026 (incluindo a pauta de licenciamento NAO DEFERIDO).
 *
 * Regua (mesma do plano DATA-DO-DADO): o carimbo do arquivo e a data da
 * COLETA bem-sucedida; o banco tem duas datas - `max(created_at)` e a ultima
 * data do dado na coluna propria. Lag = dias desde a coleta. Teto por
 * frequencia: diaria 3, semanal 10, mensal 40; estatica e editorial (isenta,
 * nao e coleta automatica).
 *
 * Honestidade: arquivo sem carimbo usa mtime e aparece como `sem-carimbo`,
 * nunca como verde. Arquivo/tabela ausente vira `ausente`, sem crash. Banco
 * fora do ar vira `sem-conexao`, sem crash.
 *
 * Uso:
 *   npx tsx scripts/relatorio-dados-semanal.mts [--json] [--sem-telegram] [--self-test]
 * Saida: tabela no console + markdown em
 * `docs/relatorios-automacao/dados-semanais-AAAA-MM-DD.md`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { dataDoAcervo } from "../apps/web/lib/fontes/dataDoArquivo.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AGORA = Date.now();
const HOJE = (() => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
})();

/** Teto de dias por frequencia; null = isenta de cobranca de frescor. */
const TETO_DIAS: Record<string, number | null> = {
  diaria: 3,
  semanal: 10,
  mensal: 40,
  estatica: null,
};

type Status = "ok" | "atrasado" | "sem-carimbo" | "sem-conexao" | "editorial" | "ausente";

interface Linha {
  id: string;
  categoria: string;
  nome: string;
  rota: string;
  frequencia: string;
  tipo: "arquivo" | "banco";
  /** Data da coleta (carimbo do arquivo ou max(created_at) no banco). */
  coletado: string | null;
  /** Data do dado em si (coluna propria no banco); null quando nao se aplica. */
  dataDado: string | null;
  volume: number | null;
  volumeDetalhe: string | null;
  lagDias: number | null;
  status: Status;
  motivo: string | null;
}

interface FonteArquivo {
  id: string;
  categoria: string;
  nome: string;
  rota: string;
  frequencia: keyof typeof TETO_DIAS;
  arquivo: string;
  /** Campo aninhado do carimbo, ex.: COBERTURA_TAC_GTAC.coletadoEm. */
  caminhoCarimbo?: string;
  /** Caminhos do volume, tentados em ordem; array na raiz = tamanho. */
  volumeCampos?: string[];
  /** Rotulo extra do volume, ex.: totalNegativas vira "(9.554 negativas)". */
  volumeExtra?: { campo: string; rotulo: string };
  /** Sem carimbo no JSON: usa mtime e rotula sem-carimbo. */
  usarMtime?: boolean;
}

interface FonteBanco {
  id: string;
  categoria: string;
  nome: string;
  rota: string;
  frequencia: keyof typeof TETO_DIAS;
  tabela: string;
  colunaData: string;
}

const FONTES_ARQUIVO: FonteArquivo[] = [
  {
    id: "jurisprudencia",
    categoria: "Judiciario",
    nome: "Jurisprudencia (acervo)",
    rota: "/jurisprudencia",
    frequencia: "semanal",
    arquivo: "apps/web/data/jurisprudencia-casos.json",
    volumeCampos: ["total"],
  },
  {
    id: "jurisprudencia-buscador",
    categoria: "Judiciario",
    nome: "Buscador de jurisprudencia",
    rota: "/jurisprudencia",
    frequencia: "semanal",
    arquivo: "apps/web/data/jurisprudencia-buscador-resumo.json",
    volumeCampos: ["total"],
  },
  {
    id: "multas-ibama",
    categoria: "Ambiental",
    nome: "Autos de infracao IBAMA",
    rota: "/ambiental/ibama",
    frequencia: "semanal",
    arquivo: "apps/web/data/ibama-autos-infracao.json",
    volumeCampos: ["total_linhas_fonte"],
  },
  {
    id: "multas-sisema",
    categoria: "Ambiental",
    nome: "Autos de infracao SISEMA",
    rota: "/ambiental/autuacoes",
    frequencia: "semanal",
    arquivo: "apps/web/data/sisema-autos-infracao.json",
    volumeCampos: ["total"],
  },
  {
    id: "licenciamento-nao-deferido",
    categoria: "Ambiental",
    nome: "Licenciamento nao deferido (MG)",
    rota: "/ambiental/decisoes",
    frequencia: "semanal",
    arquivo: "etl/betim/dados/decisoes-licenciamento-mg.json",
    volumeCampos: ["total"],
    volumeExtra: { campo: "totalNegativas", rotulo: "negativas" },
  },
  {
    id: "tacs-gtac",
    categoria: "Ambiental",
    nome: "TACs GTAC",
    rota: "/ambiental/tac",
    frequencia: "mensal",
    arquivo: "etl/betim/dados/tac-gtac-bundle.json",
    caminhoCarimbo: "COBERTURA_TAC_GTAC.coletadoEm",
    volumeCampos: ["COBERTURA_TAC_GTAC.tacs"],
  },
  {
    id: "tacs-projetos",
    categoria: "Ambiental",
    nome: "TACs por projeto",
    rota: "/ambiental/tac",
    frequencia: "mensal",
    arquivo: "etl/betim/dados/tac-projetos-bundle.json",
    volumeCampos: ["COBERTURA_TAC_PROJETOS.projetos"],
    usarMtime: true,
  },
  {
    id: "editais",
    categoria: "Editais e concursos",
    nome: "Editais",
    rota: "/editais",
    frequencia: "diaria",
    arquivo: "apps/web/data/editais-consolidado.json",
    volumeCampos: ["total"],
  },
  {
    id: "concursos",
    categoria: "Editais e concursos",
    nome: "Concursos publicos",
    rota: "/concursos",
    frequencia: "semanal",
    arquivo: "apps/web/data/concursos-publicos.json",
    volumeCampos: ["totalCertames"],
  },
  {
    id: "noticias-paraopeba",
    categoria: "Noticias",
    nome: "Noticias Paraopeba",
    rota: "/paraopeba/noticias",
    frequencia: "diaria",
    arquivo: "apps/web/data/noticias-paraopeba.json",
    volumeCampos: ["itens"],
  },
  {
    id: "noticias-desastres",
    categoria: "Noticias",
    nome: "Noticias de desastres",
    rota: "/ambiental/crimes-socioambientais",
    frequencia: "diaria",
    arquivo: "apps/web/data/noticias-desastres.json",
    volumeCampos: ["itens"],
  },
  {
    id: "noticias-portal",
    categoria: "Noticias",
    nome: "Noticias do portal",
    rota: "/noticias",
    frequencia: "diaria",
    arquivo: "apps/web/data/noticias-portal.json",
    usarMtime: true,
  },
  {
    id: "linha-do-tempo",
    categoria: "Memoria",
    nome: "Linha do tempo / Mistica",
    rota: "/memoria",
    frequencia: "estatica",
    arquivo: "apps/web/lib/memoria/mistica.ts",
  },
];

const FONTES_BANCO: FonteBanco[] = [
  {
    id: "leis",
    categoria: "Ambiental",
    nome: "Legislacao ambiental",
    rota: "/ambiental/legislacao",
    frequencia: "semanal",
    tabela: "ambiental_legislacao",
    colunaData: "data",
  },
  {
    id: "contratos",
    categoria: "Transparencia",
    nome: "Contratos municipais",
    rota: "/[municipio]/prefeitura/contratos",
    frequencia: "diaria",
    tabela: "contratos",
    colunaData: "data_assinatura",
  },
  {
    id: "licitacoes",
    categoria: "Transparencia",
    nome: "Licitacoes (PNCP)",
    rota: "/[municipio]/prefeitura/licitacoes",
    frequencia: "diaria",
    tabela: "licitacoes",
    colunaData: "data_publicacao_pncp",
  },
  {
    id: "convenios",
    categoria: "Transparencia",
    nome: "Convenios federais",
    rota: "/ambiental/convenios",
    frequencia: "semanal",
    tabela: "convenios_federais",
    colunaData: "data_publicacao",
  },
  {
    id: "multas-cap",
    categoria: "Ambiental",
    nome: "Autos de infracao CAP",
    rota: "/ambiental/autuacoes",
    frequencia: "semanal",
    tabela: "cap_autos_infracao",
    colunaData: "data_lavratura",
  },
  {
    id: "licenciamento",
    categoria: "Ambiental",
    nome: "Licenciamento ambiental",
    rota: "/ambiental/licenciamento",
    frequencia: "mensal",
    tabela: "ambiental_licenciamento",
    colunaData: "data_emissao",
  },
  {
    id: "copam-pauta",
    categoria: "Ambiental",
    nome: "Pauta COPAM",
    rota: "/ambiental/copam",
    frequencia: "semanal",
    tabela: "copam_reunioes",
    colunaData: "data",
  },
  {
    id: "portarias",
    categoria: "Transparencia",
    nome: "Portarias e atos oficiais",
    rota: "/[municipio]/prefeitura/diario",
    frequencia: "diaria",
    tabela: "atos_oficiais",
    colunaData: "data_publicacao",
  },
];

/** Le um campo por caminho com pontos; undefined quando o caminho quebra. */
function pegar(obj: unknown, caminho: string): unknown {
  let atual: unknown = obj;
  for (const parte of caminho.split(".")) {
    if (atual === null || typeof atual !== "object") return undefined;
    atual = (atual as Record<string, unknown>)[parte];
  }
  return atual;
}

function comoNumero(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
  return null;
}

function volumeDe(dados: unknown, fonte: FonteArquivo): number | null {
  for (const campo of fonte.volumeCampos ?? []) {
    const valor = pegar(dados, campo);
    const n = comoNumero(valor);
    if (n !== null) return n;
    // `itens` e lista: o volume e o tamanho dela, nao um numero no cabecalho.
    if (Array.isArray(valor)) return valor.length;
  }
  return Array.isArray(dados) ? dados.length : null;
}

function volumeExtraDe(dados: unknown, fonte: FonteArquivo): string | null {
  if (!fonte.volumeExtra) return null;
  const n = comoNumero(pegar(dados, fonte.volumeExtra.campo));
  return n === null ? null : `${n.toLocaleString("pt-BR")} ${fonte.volumeExtra.rotulo}`;
}

/**
 * NUCLEO PURO do julgamento: dado o carimbo, a frequencia e o agora, devolve
 * lag e status. Separado do disco e do banco para o autoteste exercitar a
 * mesma regra que roda de verdade.
 */
function avaliar(carimbo: string | null, frequencia: string, agoraMs: number): { lagDias: number | null; status: Status } {
  const teto = TETO_DIAS[frequencia] ?? null;
  if (frequencia === "estatica") return { lagDias: null, status: "editorial" };
  if (!carimbo) return { lagDias: null, status: "sem-carimbo" };
  const ms = Date.parse(carimbo);
  if (Number.isNaN(ms)) return { lagDias: null, status: "sem-carimbo" };
  const lagDias = Math.floor((agoraMs - ms) / 86_400_000);
  if (teto === null) return { lagDias, status: "ok" };
  return { lagDias, status: lagDias > teto ? "atrasado" : "ok" };
}

function avaliarArquivo(fonte: FonteArquivo): Linha {
  const base = {
    id: fonte.id,
    categoria: fonte.categoria,
    nome: fonte.nome,
    rota: fonte.rota,
    frequencia: fonte.frequencia,
    tipo: "arquivo" as const,
    volumeDetalhe: null,
  };
  const caminho = path.resolve(RAIZ, fonte.arquivo);
  if (!fs.existsSync(caminho)) {
    return {
      ...base,
      coletado: null,
      dataDado: null,
      volume: null,
      lagDias: null,
      status: "ausente",
      motivo: `arquivo ausente: ${fonte.arquivo}`,
    };
  }
  let dados: unknown = null;
  try {
    dados = JSON.parse(fs.readFileSync(caminho, "utf8"));
  } catch {
    // Fontes .ts (linha do tempo) nao sao JSON: nao e erro, e editorial.
    dados = null;
  }
  const carimboBruto = fonte.caminhoCarimbo ? pegar(dados, fonte.caminhoCarimbo) : null;
  const carimbo = fonte.caminhoCarimbo
    ? typeof carimboBruto === "string" && !Number.isNaN(Date.parse(carimboBruto))
      ? carimboBruto
      : null
    : dataDoAcervo(dados);
  const volume = volumeDe(dados, fonte);

  if (!carimbo && fonte.usarMtime) {
    const mtime = fs.statSync(caminho).mtime.toISOString();
    const { lagDias } = avaliar(mtime, fonte.frequencia, AGORA);
    return {
      ...base,
      coletado: mtime,
      dataDado: null,
      volume,
      volumeDetalhe: volumeExtraDe(dados, fonte),
      lagDias,
      status: "sem-carimbo",
      motivo: "sem carimbo no JSON; mtime usado como referencia",
    };
  }
  const { lagDias, status } = avaliar(carimbo, fonte.frequencia, AGORA);
  return {
    ...base,
    coletado: carimbo,
    dataDado: null,
    volume,
    volumeDetalhe: volumeExtraDe(dados, fonte),
    lagDias,
    status,
    motivo: status === "sem-carimbo" ? "JSON sem campo de data reconhecido" : null,
  };
}

function lerEnv(caminho: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(caminho)) return out;
  for (const linha of fs.readFileSync(caminho, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linha);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}

interface ResultadoBanco {
  linhas: Linha[];
  conectou: boolean;
  erro: string | null;
}

async function avaliarBanco(agoraMs: number): Promise<ResultadoBanco> {
  const env = lerEnv(path.resolve(RAIZ, "apps/web/.env.local"));
  const url = env["DATABASE_URL"];
  if (!url) {
    return {
      linhas: FONTES_BANCO.map((f) => vazioBanco(f, "sem-conexao", "DATABASE_URL ausente em apps/web/.env.local")),
      conectou: false,
      erro: "DATABASE_URL ausente",
    };
  }

  const require = createRequire(path.resolve(RAIZ, "package.json"));
  let Client: any;
  try {
    ({ Client } = require("pg"));
  } catch {
    return {
      linhas: FONTES_BANCO.map((f) => vazioBanco(f, "sem-conexao", "pacote pg indisponivel")),
      conectou: false,
      erro: "pg indisponivel",
    };
  }

  const cliente = new Client({ connectionString: url, ssl: false, connectionTimeoutMillis: 8000 });
  const linhas: Linha[] = [];
  try {
    await cliente.connect();
    await cliente.query("set statement_timeout = '20000'");
  } catch (e) {
    await cliente.end().catch(() => {});
    const msg = (e as Error).message;
    return {
      linhas: FONTES_BANCO.map((f) => vazioBanco(f, "sem-conexao", `banco fora do ar: ${msg}`)),
      conectou: false,
      erro: msg,
    };
  }

  for (const fonte of FONTES_BANCO) {
    const base = {
      id: fonte.id,
      categoria: fonte.categoria,
      nome: fonte.nome,
      rota: fonte.rota,
      frequencia: fonte.frequencia,
      tipo: "banco" as const,
      volumeDetalhe: null,
    };
    try {
      const r = await cliente.query(
        `select count(*)::int as n, max(created_at) as coletado, max(${fonte.colunaData}) as dado from public.${fonte.tabela}`,
      );
      const coletado = r.rows[0].coletado ? new Date(r.rows[0].coletado).toISOString() : null;
      const dataDado = r.rows[0].dado ? new Date(r.rows[0].dado).toISOString() : null;
      const { lagDias, status } = avaliar(coletado, fonte.frequencia, agoraMs);
      linhas.push({
        ...base,
        coletado,
        dataDado,
        volume: r.rows[0].n ?? null,
        lagDias,
        status,
        motivo: status === "sem-carimbo" ? "tabela sem created_at preenchido" : null,
      });
    } catch (e) {
      const msg = (e as Error).message;
      const ausente = /does not exist|42P01/i.test(msg);
      linhas.push(
        vazioBanco(fonte, ausente ? "ausente" : "sem-conexao", ausente ? `tabela ausente: ${fonte.tabela}` : msg),
      );
    }
  }
  await cliente.end().catch(() => {});
  return { linhas, conectou: true, erro: null };
}

function vazioBanco(fonte: FonteBanco, status: Status, motivo: string): Linha {
  return {
    id: fonte.id,
    categoria: fonte.categoria,
    nome: fonte.nome,
    rota: fonte.rota,
    frequencia: fonte.frequencia,
    tipo: "banco",
    coletado: null,
    dataDado: null,
    volume: null,
    volumeDetalhe: null,
    lagDias: null,
    status,
    motivo,
  };
}

function dataCurta(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "-";
}

function volumeTexto(l: Linha): string {
  const n = l.volume === null ? "-" : l.volume.toLocaleString("pt-BR");
  return l.volumeDetalhe ? `${n} (${l.volumeDetalhe})` : n;
}

function resumo(linhas: Linha[]) {
  const contar = (s: Status) => linhas.filter((l) => l.status === s).length;
  return {
    total: linhas.length,
    ok: contar("ok"),
    atrasados: contar("atrasado"),
    semCarimbo: contar("sem-carimbo"),
    semConexao: contar("sem-conexao"),
    ausentes: contar("ausente"),
    editoriais: contar("editorial"),
  };
}

const ORDEM_CATEGORIAS = ["Judiciario", "Ambiental", "Transparencia", "Editais e concursos", "Noticias", "Memoria"];

function gerarMarkdown(linhas: Linha[], r: ReturnType<typeof resumo>): string {
  const partes: string[] = [];
  partes.push(`# Dados do portal - semana de ${HOJE}`);
  partes.push("");
  partes.push(
    "Relatorio automatico de frescor (sem LLM), gerado por `scripts/relatorio-dados-semanal.mts`.",
  );
  partes.push("");
  partes.push("## Resumo");
  partes.push("");
  partes.push(
    `- ${r.total} fontes medidas: ${r.ok} ok, ${r.atrasados} atrasadas, ${r.semCarimbo} sem carimbo, ${r.ausentes} ausentes, ${r.semConexao} sem conexao, ${r.editoriais} editoriais.`,
  );
  const pior = linhas
    .filter((l) => l.lagDias !== null)
    .sort((a, b) => (b.lagDias ?? 0) - (a.lagDias ?? 0))[0];
  if (pior) partes.push(`- Maior atraso desde a coleta: **${pior.nome}** (${pior.lagDias} dias).`);
  partes.push("");

  for (const categoria of ORDEM_CATEGORIAS) {
    const doGrupo = linhas.filter((l) => l.categoria === categoria);
    if (doGrupo.length === 0) continue;
    partes.push(`## ${categoria}`);
    partes.push("");
    partes.push("| Dado | Ultima coleta | Data do dado | Volume | Status | Pagina |");
    partes.push("|---|---|---|---|---|---|");
    for (const l of doGrupo) {
      const coleta = l.coletado ? dataCurta(l.coletado) : "-";
      const rotuloColeta = l.status === "sem-carimbo" && l.coletado ? `${coleta} (mtime)` : coleta;
      partes.push(
        `| ${l.nome} | ${rotuloColeta} | ${dataCurta(l.dataDado)} | ${volumeTexto(l)} | ${l.status} | ${l.rota} |`,
      );
    }
    partes.push("");
  }

  const pendencias = linhas.filter((l) => l.status !== "ok" && l.status !== "editorial");
  partes.push("## Pendencias");
  partes.push("");
  if (pendencias.length === 0) {
    partes.push("Nenhuma: todas as fontes dentro do teto da propria frequencia.");
  } else {
    for (const l of pendencias) {
      const detalhe = l.motivo ? ` - ${l.motivo}` : "";
      partes.push(`- **${l.nome}** (${l.frequencia}, ${l.status}): ${l.rota}${detalhe}`);
    }
  }
  partes.push("");
  return partes.join("\n");
}

function resumoTgramHtml(linhas: Linha[], r: ReturnType<typeof resumo>): string {
  const pendencias = linhas
    .filter((l) => l.status !== "ok" && l.status !== "editorial")
    .slice(0, 8)
    .map((l) => {
      const quando = l.lagDias === null ? l.status : `${l.lagDias}d`;
      return ` - ${l.nome}: ${quando}`;
    });
  return [
    `<b>Dados do portal - ${HOJE}</b>`,
    `${r.total} fontes: ${r.ok} ok, ${r.atrasados} atrasadas, ${r.semCarimbo} sem carimbo, ${r.ausentes} ausentes, ${r.semConexao} sem conexao.`,
    pendencias.length ? `Pendencias:\n${pendencias.join("\n")}` : "Nenhuma pendencia.",
  ].join("\n");
}

async function enviarTelegram(linhas: Linha[], r: ReturnType<typeof resumo>): Promise<void> {
  const env = lerEnv(path.resolve(RAIZ, "scripts/.env"));
  const token = env["TELEGRAM_BOT_TOKEN"];
  const chat = env["TELEGRAM_CHAT_ID"];
  if (!token || !chat) {
    console.log("SEM_TELEGRAM");
    return;
  }
  try {
    const resposta = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: resumoTgramHtml(linhas, r),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const corpo = (await resposta.json().catch(() => ({}))) as { ok?: boolean };
    console.log(corpo.ok ? "TELEGRAM=ok" : `TELEGRAM=falhou status=${resposta.status}`);
  } catch (e) {
    console.log(`TELEGRAM=falhou ${(e as Error).message}`);
  }
}

function selfTest(): number {
  const casos: Array<{ nome: string; carimbo: string | null; frequencia: string; status: Status }> = [
    { nome: "recente-ok", carimbo: new Date(AGORA - 1 * 86_400_000).toISOString(), frequencia: "diaria", status: "ok" },
    { nome: "velho-atrasado", carimbo: new Date(AGORA - 20 * 86_400_000).toISOString(), frequencia: "semanal", status: "atrasado" },
    { nome: "sem-carimbo", carimbo: null, frequencia: "diaria", status: "sem-carimbo" },
    { nome: "estatico-editorial", carimbo: null, frequencia: "estatica", status: "editorial" },
  ];
  const falhas: string[] = [];
  for (const caso of casos) {
    const { status } = avaliar(caso.carimbo, caso.frequencia, AGORA);
    if (status !== caso.status) falhas.push(`${caso.nome}: esperado ${caso.status}, veio ${status}`);
  }
  if (falhas.length > 0) {
    console.log(`SELFTEST=falhou ${falhas.join(" | ")}`);
    return 1;
  }
  console.log("SELFTEST=ok CASOS=4");
  return 0;
}

async function principal(): Promise<number> {
  const args = new Set(process.argv.slice(2));
  if (args.has("--self-test")) return selfTest();

  const linhasArquivo = FONTES_ARQUIVO.map(avaliarArquivo);
  const banco = await avaliarBanco(AGORA);
  if (!banco.conectou) console.log(`AVISO banco: ${banco.erro}`);
  const linhas = [...linhasArquivo, ...banco.linhas];
  const r = resumo(linhas);

  const markdown = gerarMarkdown(linhas, r);
  const destino = path.resolve(RAIZ, "docs/relatorios-automacao", `dados-semanais-${HOJE}.md`);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, markdown, "utf8");

  if (args.has("--json")) {
    console.log(JSON.stringify({ geradoEm: new Date().toISOString(), resumo: r, linhas }, null, 2));
  } else {
    for (const l of linhas) {
      const carimbo = dataCurta(l.coletado).padEnd(10);
      const lag = l.lagDias === null ? "-" : `${l.lagDias}d`;
      console.log(
        `[${l.status}] ${l.categoria.padEnd(19)} ${l.nome.padEnd(32)} coleta ${carimbo} lag ${lag.padStart(4)} vol ${volumeTexto(l).padEnd(24)} ${l.rota}`,
      );
    }
    console.log(
      `resumo: ${r.ok} ok, ${r.atrasados} atrasados, ${r.semCarimbo} sem carimbo` +
        (r.ausentes ? `, ${r.ausentes} ausentes` : "") +
        (r.semConexao ? `, ${r.semConexao} sem conexao` : "") +
        (r.editoriais ? `, ${r.editoriais} editorial` : ""),
    );
    console.log(`markdown: ${destino}`);
  }

  if (args.has("--sem-telegram")) {
    console.log("SEM_TELEGRAM");
  } else {
    await enviarTelegram(linhas, r);
  }
  return 0;
}

process.exitCode = await principal();
