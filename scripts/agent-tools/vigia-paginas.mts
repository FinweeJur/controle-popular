/**
 * @file scripts/agent-tools/vigia-paginas.mts
 * @description Checador de saúde das páginas do portal — os olhos do vigia do servidor.
 *
 * POR QUE ESTE ARQUIVO EXISTE (medido em 03/10/2026): o site respondeu 404 em
 * tudo por cerca de 5 horas e ninguém percebeu; o dono só descobriu abrindo
 * /memoria. O `vigia-servidor.mts` antigo só batia na home — e uma queda de
 * roteador "sem aplicação" (toda rota devolvendo 404) passava batido ou nem
 * era observado porque a task agendada do vigia não estava registrada (medido
 * em 03/10/2026 nesta máquina: o último `vigia-servidor-status.json` parou em
 * 01/10). Este módulo varre as páginas nobres do portal e manda um aviso curto
 * no Telegram quando alguma quebra — é a rede que faltava.
 *
 * FONTES DOS ALVOS (fonte canônica: página nova entra sozinha na varredura):
 * 1. `apps/web/data/top-100-paginas.json` — as 100 páginas nobres (campo `href`);
 * 2. `apps/web/lib/eixos/catalogo.ts` — as rotas legadas das subfrentes dos
 *    4 eixos (importadas direto do catálogo, não por regex: o arquivo é a
 *    fonte canônica e qualquer rota nova nasce coberta);
 * 3. as 4 páginas-hub de eixo e a home.
 *
 * CRITÉRIO: 200 depois de seguir redirect = ok; 4xx/5xx/sem resposta = quebrada.
 * O apex `controlepopular.com.br` devolve 301 para o `www` (o Guara só aceita
 * `www`), por isso seguimos redirect até o fim e só a resposta final vale.
 *
 * DECISÕES NÃO TRIVIAIS:
 * - Pausa de 1,2 s entre páginas: medido em 03/10/2026, uma varredura contínua
 *   reiniciou o container 3× — o vigia existe para monitorar, não para derrubar.
 * - Varredura a cada 15 min (o vigia roda a cada 5 min): ~100 requisições por
 *   ciclo completo seria carga contínua no mesmo container.
 * - Um aviso agrupado por ciclo: 100 linhas de alerta não ajudam ninguém.
 * - Mais de 50% dos alvos fora = "site inteiro fora": um aviso agregado vale
 *   mais que 100 linhas iguais (caso real de 03/10/2026).
 * - Anti-spam: aviso novo quando o conjunto de falhas muda; o mesmo aviso só
 *   se repete 1 hora depois, se a falha persistir; restauração avisa uma vez.
 * - Estado em `scripts/.heartbeat-vigia-paginas.json` (família `.heartbeat-*`
 *   já coberta pelo .gitignore — estado de runtime, sem tocar no .gitignore).
 *
 * O ENVIO REAL no Telegram acontece só pelo `vigia-servidor.mts` (usa o mesmo
 * `notifyTelegram` e o mesmo `scripts/.env`, sem nunca imprimir o segredo).
 * Rodar este arquivo direto mostra o aviso que SERIA enviado.
 */
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CATALOGO_EIXOS } from "../../apps/web/lib/eixos/catalogo";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ARQUIVO_TOP100 = path.join(RAIZ, "apps", "web", "data", "top-100-paginas.json");
const ESTADO_ARQUIVO = path.join(RAIZ, "scripts", ".heartbeat-vigia-paginas.json");

/** Site canônico: o Guara só hospeda `www`; a raiz depende de redirect no Cloudflare. */
const BASE_PADRAO = "https://www.controlepopular.com.br";

/**
 * Pausa entre páginas. Medido em 03/10/2026: varredura contínua reiniciou o
 * container 3× — monitorar sem derrubar é a regra, a velocidade é o luxo.
 */
const PAUSA_MS = 1200;

/**
 * Teto de espera por página. Medido em 03/10/2026: a origem pendurada não
 * responde nada, então o pior caso de uma varredura inteira é 100 × (6 s + 1,2 s)
 * ≈ 12 min — abaixo do intervalo de 15 min, para nunca varrer junto de si mesma.
 * Com 8 s esse pior caso passaria de 15 min e duas varreduras se sobrepuseriam.
 */
const TIMEOUT_MS = 6000;

/** Redirects seguidos antes de considerar a rota quebrada (apex → www é 1). */
const MAX_REDIRECTS = 5;

/** O vigia roda a cada 5 min; a varredura completa só a cada 15 min. */
const INTERVALO_VARREDURA_MS = 15 * 60 * 1000;

/** O mesmo aviso só se repete depois de 1 hora, e só se a falha persistir. */
const REPETIR_ALERTA_MS = 60 * 60 * 1000;

/** Acima disso não listamos página por página: é o site inteiro que saiu. */
const LIMIAR_SITE_INTEIRO = 0.5;

/** Usuário-agente honesto (AGENTS.md §11): o projeto se apresenta como ele é. */
const USER_AGENT =
  "ControlePopular-Vigia/1.0 (+https://www.controlepopular.com.br; vigilancia de paginas publicas)";

/**
 * Páginas-hub dos 4 eixos. O catálogo (`lib/eixos/catalogo.ts`) guarda a rota
 * legada das SUBFRENTES, não a do eixo inteiro — por isso as 4 rotas-hub
 * ficam declaradas aqui, com o par eixo → hub escrito por extenso.
 */
const ROTAS_HUB_EIXO = [
  "/terra-e-territorios",
  "/direitos-em-movimento",
  "/estado-e-economia",
  "/central",
];

export type OrigemAlvo = "home" | "eixo" | "catalogo" | "top-100";

export interface Alvo {
  /** Rota normalizada, com barra inicial e sem barra no fim ("/" é a home). */
  rota: string;
  origem: OrigemAlvo;
  /** URL absoluta já montada a partir da base. */
  url: string;
}

export interface ResultadoAlvo {
  rota: string;
  url: string;
  /** 0 = sem resposta (erro de rede ou timeout). */
  status: number;
  ok: boolean;
  ms: number;
  erro?: string;
}

export interface ResumoVarredura {
  base: string;
  total: number;
  ok: number;
  falhas: { rota: string; status: number }[];
  /** Mais da metade dos alvos fora: o site inteiro, não uma página. */
  siteInteiroFora: boolean;
  inicioEm: string;
  terminoEm: string;
  duracaoMs: number;
}

export interface EstadoPaginas {
  versao: 1;
  /** Marcado ANTES da varredura: duas execuções simultâneas não varrem junto. */
  ultimaVarreduraEm: string | null;
  /** Resumo da última varredura de verdade (a telemetria carrega ele entre ciclos pulados). */
  ultimaVarredura: ResumoVarredura | null;
  /** Rotas quebradas ordenadas, ";" como separador — a impressão digital do incidente. */
  assinatura: string;
  falhas: { rota: string; status: number }[];
  avisoEnviadoEm: string | null;
  /** Já avisamos alguma vez? Sem isso a restauração avisaria um incidente nunca anunciado. */
  avisado: boolean;
}

const ESTADO_PADRAO: EstadoPaginas = {
  versao: 1,
  ultimaVarreduraEm: null,
  ultimaVarredura: null,
  assinatura: "",
  falhas: [],
  avisoEnviadoEm: null,
  avisado: false,
};

/** Dorme `ms` milissegundos — a pausa que protege o container de uma varredura contínua. */
function dormir(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Escapa o básico antes de entrar num aviso com parse_mode=HTML. */
function escaparHtml(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Normaliza uma rota vinda do catálogo ou do top-100: barra inicial, sem barra
 * no fim ("/" fica como está). Devolve null para hrefs que não são caminho
 * interno (âncora, javascript:, vazio).
 */
function normalizarRota(href: string): string | null {
  const bruto = href.trim();
  if (!bruto || bruto.startsWith("#") || bruto.toLowerCase().startsWith("javascript:")) return null;
  if (/^https?:\/\//i.test(bruto)) {
    try {
      const u = new URL(bruto);
      return normalizarRota(u.pathname + u.search);
    } catch {
      return null;
    }
  }
  if (!bruto.startsWith("/")) return null;
  const semBarraFinal = bruto.length > 1 && bruto.endsWith("/") ? bruto.slice(0, -1) : bruto;
  return semBarraFinal;
}

/**
 * Monta a lista de alvos a partir das três fontes canônicas, sem duplicata.
 *
 * Ordem: home → hubs de eixo → rotas legadas do catálogo → top-100. Quem entra
 * depois só completa: página nova no `top-100-paginas.json` ou `rotaLegada`
 * novo no catálogo aparece na próxima varredura sem tocar em código daqui.
 *
 * @param base URL base do site (sem barra no fim).
 */
export function montarAlvos(base: string): Alvo[] {
  const normalizada = base.replace(/\/+$/, "");
  const vistos = new Map<string, Alvo>();

  const add = (href: string, origem: OrigemAlvo): void => {
    const rota = normalizarRota(href);
    if (!rota || vistos.has(rota)) return;
    const url = rota === "/" ? `${normalizada}/` : `${normalizada}${rota}`;
    vistos.set(rota, { rota, origem, url });
  };

  add("/", "home");
  for (const hub of ROTAS_HUB_EIXO) add(hub, "eixo");

  // Catálogo canônico dos eixos: 24 rotas legadas únicas nas 4 subfrentes-eixo.
  for (const eixo of Object.values(CATALOGO_EIXOS)) {
    for (const subfrente of eixo.subfrentes) {
      if (subfrente.rotaLegada) add(subfrente.rotaLegada, "catalogo");
    }
  }

  try {
    // O `\uFEFF` (BOM) é removido por causa da armadilha do AGENTS § 6: um
    // editor do Windows que salve o JSON com BOM faz o `JSON.parse` recusar o
    // arquivo inteiro. Sem esta limpeza o catch abaixo engoliria o top-100 em
    // silêncio e o vigia perderia 72 alvos sem avisar que perdeu.
    const cru = fs.readFileSync(ARQUIVO_TOP100, "utf-8").replace(/^\uFEFF/, "");
    const bruto: unknown = JSON.parse(cru);
    if (Array.isArray(bruto)) {
      for (const item of bruto) {
        const href = (item as { href?: unknown })?.href;
        if (typeof href === "string") add(href, "top-100");
      }
    }
  } catch (err) {
    console.error(`[vigia-paginas] Não li o top-100 (${path.relative(RAIZ, ARQUIVO_TOP100)}):`, err);
  }

  return Array.from(vistos.values());
}

/**
 * Faz UMA requisição seguindo redirect, com timeout e usuário-agente honesto.
 * status 0 significa "sem resposta" (erro de rede ou timeout) — quebrada também.
 */
function requisitar(url: string, restantes = MAX_REDIRECTS): Promise<{ status: number; urlFinal: string; erro?: string }> {
  return new Promise((resolve) => {
    const opcoes = {
      timeout: TIMEOUT_MS,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    };
    const aoResponder = (res: http.IncomingMessage): void => {
      const status = res.statusCode ?? 0;
      const destino = res.headers.location;
      res.resume(); // consome e solta a conexão: resposta largada segura socket
      const ehRedirect = status >= 300 && status < 400;
      if (ehRedirect && destino && restantes > 0) {
        let proxima: string;
        try {
          proxima = new URL(destino, url).toString();
        } catch {
          resolve({ status, urlFinal: url });
          return;
        }
        requisitar(proxima, restantes - 1).then(resolve);
        return;
      }
      resolve({ status, urlFinal: url });
    };

    const abrir: typeof https.get = url.startsWith("http://")
      ? (http.get as unknown as typeof https.get)
      : https.get;
    const req = abrir(url, opcoes, aoResponder);
    req.on("error", (err: Error) => resolve({ status: 0, urlFinal: url, erro: err.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 0, urlFinal: url, erro: "timeout" });
    });
  });
}

/**
 * Varre todos os alvos com pausa entre um e outro.
 *
 * @param alvos lista montada por {@link montarAlvos}
 * @param aoCada callback opcional chamado a cada página testada (progresso/log)
 */
export async function varrerPaginas(
  alvos: Alvo[],
  aoCada?: (r: ResultadoAlvo, i: number, total: number) => void,
): Promise<ResultadoAlvo[]> {
  const resultados: ResultadoAlvo[] = [];
  for (let i = 0; i < alvos.length; i++) {
    if (i > 0) await dormir(PAUSA_MS);
    const alvo = alvos[i];
    const inicio = Date.now();
    const r = await requisitar(alvo.url);
    const resultado: ResultadoAlvo = {
      rota: alvo.rota,
      url: alvo.url,
      status: r.status,
      ok: r.status >= 200 && r.status < 300,
      ms: Date.now() - inicio,
      erro: r.erro,
    };
    resultados.push(resultado);
    aoCada?.(resultado, i + 1, alvos.length);
  }
  return resultados;
}

/** Reduz a varredura a uma linha de telemetria e de estado. */
export function resumirVarredura(base: string, resultados: ResultadoAlvo[], inicio: number): ResumoVarredura {
  const falhas = resultados
    .filter((r) => !r.ok)
    .map((r) => ({ rota: r.rota, status: r.status }));
  const total = resultados.length;
  return {
    base,
    total,
    ok: total - falhas.length,
    falhas,
    siteInteiroFora: total > 0 && falhas.length / total > LIMIAR_SITE_INTEIRO,
    inicioEm: new Date(inicio).toISOString(),
    terminoEm: new Date().toISOString(),
    duracaoMs: Date.now() - inicio,
  };
}

function descreverFalha(falha: { rota: string; status: number }): string {
  const rota = escaparHtml(falha.rota);
  return falha.status === 0 ? `• ${rota} → sem resposta` : `• ${rota} → HTTP ${falha.status}`;
}

function horaLocal(agora: number): string {
  return new Date(agora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Decide se este ciclo manda aviso e em qual estado deixamos a próxima rodada.
 *
 * Regra de silêncio (anti-spam):
 * - conjunto de falhas mudou → aviso agora (é coisa nova);
 * - conjunto igual e falha persistindo → repete no máximo 1 hora depois;
 * - tudo voltou ao normal → UMA mensagem de restauração, só se já avisamos.
 *
 * Mais de metade dos alvos fora vira um aviso único "site inteiro fora":
 * o caso real de 03/10/2026 (roteador sem aplicação) geraria 100 linhas iguais.
 */
export function decidirAviso(
  resumo: ResumoVarredura,
  estado: EstadoPaginas,
  agora: number = Date.now(),
): { mensagem: string | null; estado: EstadoPaginas } {
  const assinatura = resumo.falhas
    .map((f) => f.rota)
    .sort()
    .join(";");
  const agoraIso = new Date(agora).toISOString();
  const hora = horaLocal(agora);
  const novo: EstadoPaginas = {
    ...estado,
    assinatura,
    falhas: resumo.falhas,
    ultimaVarredura: resumo,
  };

  // Tudo de pé.
  if (assinatura === "") {
    if (estado.avisado && estado.assinatura !== "") {
      novo.avisado = false;
      novo.avisoEnviadoEm = null;
      return {
        mensagem:
          `✅ <b>Páginas restauradas</b>\n` +
          `As páginas quebradas voltaram ao ar.\n` +
          `As ${resumo.total} páginas monitoradas responderam.\n` +
          `⏰ ${hora}`,
        estado: novo,
      };
    }
    novo.assinatura = "";
    novo.falhas = [];
    return { mensagem: null, estado: novo };
  }

  const mudou = assinatura !== estado.assinatura;
  const ultimaVez = estado.avisoEnviadoEm ? Date.parse(estado.avisoEnviadoEm) : 0;
  const horaDeRepetir = agora - ultimaVez >= REPETIR_ALERTA_MS;
  if (!mudou && !horaDeRepetir) return { mensagem: null, estado: novo };

  novo.avisado = true;
  novo.avisoEnviadoEm = agoraIso;

  if (resumo.siteInteiroFora) {
    return {
      mensagem:
        `🚨 <b>Site inteiro fora</b>\n` +
        `${resumo.falhas.length} de ${resumo.total} páginas falharam.\n` +
        `Provável causa: roteador sem aplicação.\n` +
        `✅ Sigo vigiando e aviso a volta.\n` +
        `⏰ ${hora}`,
      estado: novo,
    };
  }

  const MAXIMO_LINHAS = 5;
  const listadas = resumo.falhas.slice(0, MAXIMO_LINHAS).map(descreverFalha);
  const sobrando = resumo.falhas.length - listadas.length;
  if (sobrando > 0) listadas.push(`• +${sobrando} outras rotas quebradas`);
  const linhas = listadas.map((l) => `${l}`).join("\n");

  return {
    mensagem:
      `🚨 <b>Páginas quebradas: ${resumo.falhas.length} de ${resumo.total}</b>\n` +
      `${linhas}\n` +
      `✅ As outras ${resumo.ok} responderam bem.\n` +
      `⏰ ${hora}`,
    estado: novo,
  };
}

/** Lê o estado da última rodada (ou o estado vazio, na primeira vez). */
export function carregarEstado(): EstadoPaginas {
  try {
    if (!fs.existsSync(ESTADO_ARQUIVO)) return { ...ESTADO_PADRAO };
    const lido = JSON.parse(fs.readFileSync(ESTADO_ARQUIVO, "utf-8")) as Partial<EstadoPaginas>;
    return { ...ESTADO_PADRAO, ...lido, falhas: Array.isArray(lido.falhas) ? lido.falhas : [] };
  } catch (err) {
    console.error("[vigia-paginas] Estado ilegível, recomeço do zero:", err);
    return { ...ESTADO_PADRAO };
  }
}

/** Grava o estado. Nunca lança: telemetria quebrada não pode derrubar o vigia. */
export function salvarEstado(estado: EstadoPaginas): void {
  try {
    fs.writeFileSync(ESTADO_ARQUIVO, JSON.stringify(estado, null, 2), "utf-8");
  } catch (err) {
    console.error("[vigia-paginas] Não gravei o estado:", err);
  }
}

export interface OpcoesChecagem {
  /** Base do site; default `VIGIA_BASE_URL` do ambiente ou o `www` canônico. */
  base?: string;
  /** Ignora o intervalo de 15 min (uso manual/teste). */
  forcar?: boolean;
  /** Intervalo entre varreduras completas em ms; default 15 min. */
  intervaloMs?: number;
  /** Só as N primeiras rotas — para teste curto, nunca em produção. */
  limite?: number;
  /** `false` em modo dry-run: não toca no arquivo de estado. */
  escreverEstado?: boolean;
  /** Progresso/falhas para o console de quem chamou. */
  log?: (linha: string) => void;
}

export interface RetornoChecagem {
  /** Pulou por causa do intervalo de 15 min (não houve varredura nova). */
  pulado: boolean;
  motivoPulo: string | null;
  /** O aviso a enviar no Telegram, já agrupado e sem spam — ou null. */
  aviso: string | null;
  /** Resumo desta varredura, ou o da última quando pulou (telemetria continua). */
  resumo: ResumoVarredura | null;
  alvos: number;
}

/**
 * Uma volta completa do checador: lê estado, respeita o intervalo, varre,
 * decide o aviso e grava o estado novo.
 *
 * Chamado pelo `vigia-servidor.mts` a cada 5 min — mas a varredura de verdade
 * só acontece a cada 15 min, para a vigilância não virar carga contínua.
 */
export async function executarChecagemPaginas(opcoes: OpcoesChecagem = {}): Promise<RetornoChecagem> {
  const base = (opcoes.base || process.env.VIGIA_BASE_URL || BASE_PADRAO).replace(/\/+$/, "");
  const intervaloMs = opcoes.intervaloMs ?? INTERVALO_VARREDURA_MS;
  const escreverEstado = opcoes.escreverEstado !== false;
  const log = opcoes.log ?? (() => {});
  const agora = Date.now();

  let alvos = montarAlvos(base);
  if (opcoes.limite && opcoes.limite > 0) alvos = alvos.slice(0, opcoes.limite);

  const estado = carregarEstado();

  if (!opcoes.forcar && estado.ultimaVarreduraEm) {
    const decorrido = agora - Date.parse(estado.ultimaVarreduraEm);
    if (Number.isFinite(decorrido) && decorrido < intervaloMs) {
      const faltam = Math.ceil((intervaloMs - decorrido) / 60000);
      return {
        pulado: true,
        motivoPulo: `varredura de páginas adiada: faltam ~${faltam} min (intervalo de ${Math.round(intervaloMs / 60000)} min)`,
        aviso: null,
        resumo: estado.ultimaVarredura,
        alvos: alvos.length,
      };
    }
  }

  // Marca o início ANTES de varrer: duas execuções simultâneas não varrem junto.
  if (escreverEstado) {
    salvarEstado({ ...estado, ultimaVarreduraEm: new Date(agora).toISOString() });
  }

  log(`varrendo ${alvos.length} páginas em ${base} (pausa de ${PAUSA_MS / 1000} s entre elas)`);
  const inicio = Date.now();
  const resultados = await varrerPaginas(alvos, (r, i, total) => {
    if (!r.ok) log(`falhou ${i}/${total} ${r.rota} → ${r.status === 0 ? (r.erro ?? "sem resposta") : `HTTP ${r.status}`}`);
  });
  const resumo = resumirVarredura(base, resultados, inicio);
  const { mensagem, estado: estadoNovo } = decidirAviso(resumo, estado, Date.now());

  if (escreverEstado) salvarEstado({ ...estadoNovo, ultimaVarreduraEm: new Date(inicio).toISOString() });

  log(
    `fim: ${resumo.ok}/${resumo.total} ok em ${Math.round(resumo.duracaoMs / 1000)} s` +
      (resumo.falhas.length ? ` — ${resumo.falhas.length} quebrada(s)` : ""),
  );

  return { pulado: false, motivoPulo: null, aviso: mensagem, resumo, alvos: alvos.length };
}

/** Ajuda de linha de comando — português direto, sem jargão. */
const AJUDA = `
Vigia de páginas do Controle Popular

  npx tsx scripts/agent-tools/vigia-paginas.mts [opções]

  --listar      Só mostra as rotas que seriam testadas (sem internet)
  --dry-run     Varre de verdade e mostra o aviso, sem gravar estado
  --forcar      Ignora o intervalo de 15 min entre varreduras
  --limite N    Só as N primeiras rotas (teste curto)
  --base URL    Outra base, ex.: http://127.0.0.1:3000
  --ajuda       Este texto

O envio real no Telegram só acontece pelo scripts/vigia-servidor.mts;
aqui o aviso é impresso, nunca disparado.
`.trim();

async function mainCli(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--ajuda") || args.includes("--help")) {
    console.log(AJUDA);
    return;
  }

  const valorDe = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const base = (valorDe("--base") || process.env.VIGIA_BASE_URL || BASE_PADRAO).replace(/\/+$/, "");
  const limiteRaw = valorDe("--limite");
  const limite = limiteRaw ? Number.parseInt(limiteRaw, 10) : undefined;
  const dryRun = args.includes("--dry-run");
  const listar = args.includes("--listar");

  if (listar) {
    const alvos = montarAlvos(base);
    const porOrigem: Record<string, number> = {};
    for (const a of alvos) porOrigem[a.origem] = (porOrigem[a.origem] ?? 0) + 1;
    console.log(`Alvos: ${alvos.length} rotas únicas em ${base}`);
    console.log(`Origens: ${Object.entries(porOrigem).map(([k, v]) => `${k}=${v}`).join(", ")}`);
    for (const a of alvos) console.log(`  ${a.rota.padEnd(46)} ${a.origem}`);
    return;
  }

  const ret = await executarChecagemPaginas({
    base,
    forcar: args.includes("--forcar") || dryRun,
    limite,
    escreverEstado: !dryRun,
    log: (linha) => console.log(`[vigia-paginas] ${linha}`),
  });

  if (ret.pulado) {
    console.log(`[vigia-paginas] ${ret.motivoPulo}`);
    return;
  }

  const resumo = ret.resumo;
  if (resumo) {
    console.log(`\nResumo: ${resumo.ok}/${resumo.total} páginas ok em ${Math.round(resumo.duracaoMs / 1000)} s`);
    for (const f of resumo.falhas) console.log(`  quebrada: ${f.rota} → ${f.status === 0 ? "sem resposta" : `HTTP ${f.status}`}`);
    if (resumo.siteInteiroFora) console.log("  ⚠ mais de 50% fora: aviso agregado de site inteiro");
  }

  if (ret.aviso) {
    console.log(`\nAviso que seria enviado no Telegram:\n${ret.aviso}\n`);
  } else {
    console.log("\nNenhum aviso neste ciclo (tudo de pé, ou repetição ainda dentro de 1 h).");
  }
  if (dryRun) console.log("(dry-run: estado não foi gravado e nada foi enviado)");
}

// Guarda de execução direta: importado pelo vigia-servidor não dispara a CLI.
if (process.argv[1] && process.argv[1].endsWith("vigia-paginas.mts")) {
  mainCli().catch((err) => {
    console.error("Erro no vigia-paginas:", err);
    process.exit(1);
  });
}
