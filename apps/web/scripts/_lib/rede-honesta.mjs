/**
 * rede-honesta.mjs — utilitários de rede compartilhados pelos scripts de
 * auditoria (`auditoria-links-normas.mjs`) e arquivamento
 * (`arquivar-fontes.mjs`) de fontes do portal.
 *
 * "Honesta" no nome não é adjetivo à toa: as três regras que o plano
 * (`docs/PLANO-ARQUIVO-DE-FONTES.md`) não negocia vivem aqui — respeitar
 * `robots.txt`, User-Agent identificando o projeto, pausa entre
 * requisições ao mesmo host. Um script que importa daqui não pode
 * "esquecer" nenhuma das três.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const USER_AGENT =
  "ControlePopularBot/1.0 (+https://controlepopular.com.br; auditoria/arquivamento de fontes; contato via github.com/FinweeJur/controle-popular)";

// ---------------------------------------------------------------- robots.txt

const cacheRobots = new Map(); // host -> { disallow: string[] }

export async function robotsPermite(urlStr) {
  const u = new URL(urlStr);
  const host = u.host;
  if (!cacheRobots.has(host)) {
    try {
      const r = await fetch(`${u.protocol}//${host}/robots.txt`, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) {
        cacheRobots.set(host, { disallow: [] });
      } else {
        const texto = await r.text();
        const linhas = texto.split("\n").map((l) => l.trim());
        let aplicaGeral = false;
        const disallow = [];
        for (const linha of linhas) {
          const [chaveRaw, ...resto] = linha.split(":");
          if (!chaveRaw) continue;
          const chave = chaveRaw.trim().toLowerCase();
          const valor = resto.join(":").trim();
          if (chave === "user-agent") aplicaGeral = valor === "*";
          if (chave === "disallow" && aplicaGeral && valor) disallow.push(valor);
        }
        cacheRobots.set(host, { disallow });
      }
    } catch {
      cacheRobots.set(host, { disallow: [] });
    }
  }
  const regra = cacheRobots.get(host);
  return !regra.disallow.some((prefixo) => u.pathname.startsWith(prefixo));
}

// ---------------------------------------------------------- rate limit/host

const PAUSA_MIN_POR_HOST_MS = 1200;
const proximaLiberacaoPorHost = new Map();

/**
 * Reserva a vez ANTES de qualquer `await` (síncrono até o `set`), senão
 * chamadas concorrentes pro mesmo host leem o mesmo "última vez" e disparam
 * juntas mesmo assim — foi o que aconteceu com 5 URLs do planalto.gov.br
 * "ao mesmo tempo" e levou ECONNRESET por flood, não por bloqueio de UA
 * (medido em 2026-08-13/14).
 */
export async function respeitarPausa(host) {
  const agora = Date.now();
  const liberadoEm = proximaLiberacaoPorHost.get(host) ?? 0;
  const proxima = Math.max(agora, liberadoEm) + PAUSA_MIN_POR_HOST_MS;
  proximaLiberacaoPorHost.set(host, proxima);
  const espera = proxima - PAUSA_MIN_POR_HOST_MS - agora;
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
}

// ----------------------------------------------------------- curl fallback

/**
 * `fetch`/undici do Node às vezes reseta conexão com servidor .gov.br que
 * funciona normal no navegador (ou via curl) — medido nesta auditoria com
 * planalto.gov.br e outros dois domínios de MG. `checarViaCurl` é o
 * segundo motor TLS para confirmar antes de condenar um link.
 *
 * NOTA WINDOWS: o `curl` deste ambiente é o build nativo win32 (mingw)
 * chamado via `child_process` sem console anexado — escrever em
 * `/dev/null` (caminho POSIX) falha com "curl: (23) client returned ERROR
 * on write" mesmo com HTTP 200 recebido. O device nulo do Windows é `NUL`.
 */
export async function checarViaCurl(urlStr, userAgent = USER_AGENT) {
  try {
    const { stdout } = await execFileAsync(
      "curl",
      [
        "-s",
        "-o",
        "NUL",
        "-w",
        "%{http_code}",
        "-A",
        userAgent,
        "--max-time",
        "20",
        "-L",
        urlStr,
      ],
      { timeout: 25_000 }
    );
    const http = Number(stdout.trim());
    if (http >= 200 && http < 400) return { status: "ok", http };
    return { status: "quebrado", http };
  } catch (e) {
    return { status: "erro_rede", detalhe: String(e?.stderr ?? e?.message ?? e) };
  }
}

export function pareceHome(urlFinal, urlOriginal) {
  try {
    const f = new URL(urlFinal);
    const o = new URL(urlOriginal);
    if (f.host !== o.host) return false;
    const pathFinal = f.pathname.replace(/\/+$/, "");
    const pathOriginal = o.pathname.replace(/\/+$/, "");
    const eraEspecifico = pathOriginal.length > 1 && /[a-zA-Z0-9]/.test(pathOriginal.slice(1));
    const virouRaiz = pathFinal === "" || pathFinal === "/index" || pathFinal === "/home";
    return eraEspecifico && virouRaiz && pathFinal !== pathOriginal;
  } catch {
    return false;
  }
}
