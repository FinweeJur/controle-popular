/**
 * scripts/aquecer-pos-deploy.mts
 *
 * O QUE É: aquecedor pós-deploy do portal em produção. Ele aciona, uma de
 * cada vez, as rotas canônicas do site para o servidor "esquentar" depois do
 * deploy — o build continua leve e é depois que a máquina aquece e passa a
 * servir rápido. Também faz o papel de smoke pós-deploy: qualquer página que
 * não responda 200 derruba o exit code para 1, então dá para encadear num
 * pipeline e só declarar sucesso com o site inteiro no ar.
 *
 * POR QUE EXISTE: o dono pediu (03/10/2026) aquecer depois do deploy em vez
 * de carregar o build. E há um número atrás da pausa: medido em 03/10/2026,
 * uma varredura CONTÍNUA das páginas reiniciou o container 3× (OOM/restart
 * sob carga). Aquecer é para o servidor trabalhar, não para derrubá-lo — por
 * isso as requisições saem em sequência, com PAUSA de ~1,3 s entre elas.
 *
 * DE ONDE VÊM OS ALVOS (lista versionada, nunca digitada à mão — AGENTS § 8):
 *   1. a home, sempre;
 *   2. `apps/web/data/top-100-paginas.json` — campo `href` (100 itens);
 *   3. `rotaLegada` das subfrentes de `apps/web/lib/eixos/catalogo.ts` —
 *      24 rotas únicas, os 4 eixos. Importado direto: o catálogo é dado puro
 *      (só importa tipo de `./types`), então o `tsx` carrega sem build.
 * As três listas são deduplicadas preservando a ordem — muita rota aparece
 * tanto no top-100 quanto como rota legada de eixo.
 *
 * ADAPTAÇÃO: nasce de `scripts/warmup-dev.mts`, que aquece o `next dev` local
 * em concorrência de 5 e sem pausa. Aqui o alvo é produção, então o ritmo é
 * sequencial e espaçado — mesma razão do incêndio medido acima.
 *
 * Uso:
 *   npx tsx scripts/aquecer-pos-deploy.mts                  # produção, 15 primeiras (padrão Starter)
 *   npx tsx scripts/aquecer-pos-deploy.mts --tudo           # lista inteira (plano com folga)
 *   npx tsx scripts/aquecer-pos-deploy.mts --limite=5       # só as 5 primeiras
 *   npx tsx scripts/aquecer-pos-deploy.mts --base=http://localhost:3000
 *
 * Este script NÃO lê variáveis de ambiente nem segredos: só faz HTTP público
 * contra o site. Nada aqui pode vazar credencial (AGENTS § 5.8).
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CATALOGO_EIXOS } from "../apps/web/lib/eixos/catalogo";

/** Raiz do monorepo — o script mora em `scripts/`, um nível abaixo dela. */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** O site em produção: é o deploy que este script esquenta. */
const BASE_PADRAO = "https://www.controlepopular.com.br";

/**
 * User-Agent honesto (regra do AGENTS § 11): identifica o projeto pelo nome e
 * diz para que serve o pedido. Nunca UA de navegador falso — o servidor tem
 * o direito de saber quem bateu à porta, e com um nome claro nós somos
 * identificados em vez de bloqueados.
 */
const USER_AGENT =
  "ControlePopular/1.0 (aquecimento pos-deploy; https://www.controlepopular.com.br)";

/**
 * Quantas páginas aquecer POR PADRÃO (quando não vem `--limite`).
 *
 * PORQUÊ (medido 03/10/2026): o plano Starter dá ~256 MiB por container e o
 * app já vive colado no teto (~245 MiB em repouso). A lista completa (~124
 * rotas) é uma rajada: a memória subiu a ~673 MB e o pod REINICIOU. Então o
 * padrão aquece só as primeiras 15 rotas (home + topo da lista); a lista
 * inteira só com `--tudo`, em plano com folga (Pro, 512 MiB).
 */
const LIMITE_PADRAO = 15;

/**
 * Pausa entre uma requisição e a próxima, em ms.
 *
 * PORQUÊ (medido em 03/10/2026): varredura contínua das páginas reiniciou o
 * container 3× — OOM/restart sob carga. O aquecimento tem que esquentar sem
 * derrubar, então o ritmo é humano: 1,3 s, dentro da janela de 1,2–1,5 s.
 * Não deixe isto virar 0: é a única coisa entre o deploy e um restart.
 */
const PAUSA_MS = 1300;

/** Teto por página, em ms. Página travada não pode prender a fila inteira. */
const TIMEOUT_MS = 45_000;

/**
 * Espera antes de repetir uma página que respondeu 5xx, em ms. Uma tentativa
 * só: a ideia do retry é pegar o caminhão de gás subindo a rampa depois do
 * deploy, não esconder um site fora do ar — se a segunda falhar, é falha.
 */
const ESPERA_RETRY_MS = 12_000;

/**
 * Cortacircuito: quantas páginas seguidas precisam falhar de um jeito que
 * denuncia servidor morto (timeout de rede, 5xx depois do retry) para o
 * script desistir em vez de bater na porta de uma casa apagada.
 *
 * PORQUÊ (medido em 03/10/2026, nesta mesma execução de produção): o site
 * parou de responder no meio da rodada e o script, sem este corte, levaria
 * ~75 min para chegar ao fim — 100 alvos × 45 s de timeout. Cinco falhas
 * duras seguidas bastam para provar que não é página errada, é o servidor.
 * 404 não conta: página que não existe responde rápido e não é sinal de morte.
 */
const FALHAS_DURAS_SEGUIDAS = 5;

/**
 * Silêncio total antes de tentar de novo depois de uma sequência de falhas
 * duras, em ms.
 *
 * PORQUÊ (medido em 03/10/2026, em produção): quando o container estoura de
 * memória e reinicia, ele NÃO volta enquanto chega requisição — as sondas
 * continuaram falhando por 7 minutos seguidos, e o site voltou sozinho cerca
 * de 2 minutos depois que a gente parou de bater. Então a reação certa não é
 * nem insistir nem desistir: calar a boca, esperar o reinício terminar e
 * voltar para as mesmas páginas que falharam.
 */
const COOLDOWN_MS = 120_000;

/**
 * Quantas vezes o script aceita calar a boca. Cada silêncio custa 2 minutos;
 * passou disso, é sinal de que não é reinício de container e sim um site
 * fora do ar — aí sim se desiste e o exit code 1 faz o papel de smoke.
 */
const MAX_COOLDOWNS = 2;

/** Um alvo de aquecimento: a rota e de qual lista ela veio (para o relatório). */
interface Alvo {
  /** Caminho a partir da raiz, sempre começando com `/`. */
  rota: string;
  /** Origem da lista: `home`, `top-100` ou `eixo:<id>`. */
  origem: string;
}

/** Resultado de uma página: o que o relatório por página imprime. */
interface Resultado {
  alvo: Alvo;
  /** Status HTTP final (já seguindo redirect). `0` quando a rede falhou. */
  status: number;
  /** Tamanho do corpo em bytes — medido de verdade, não do cabeçalho. */
  bytes: number;
  /** Duração da tentativa, em ms. */
  ms: number;
  /** Mensagem de erro de rede/timeout, quando houve. */
  erro?: string;
  /** `true` se a página precisou da segunda tentativa (5xx). */
  repetiu: boolean;
}

/** Lê um argumento `--chave=valor` da linha de comando. `undefined` se faltar. */
function arg(chave: string): string | undefined {
  const prefixo = `--${chave}=`;
  const achou = process.argv.find((a) => a.startsWith(prefixo));
  return achou?.slice(prefixo.length);
}

/** Dorme `ms` milissegundos — é aqui que mora a pausa anti-OOM. */
function dormir(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Monta a lista de alvos a partir das fontes versionadas.
 *
 * Ordem: home → top-100 → rotas legadas dos eixos, deduplicando por rota e
 * mantendo a primeira origem — assim o relatório diz de onde veio cada uma.
 */
function carregarAlvos(): Alvo[] {
  const alvos: Alvo[] = [];
  const jaIncluido = new Set<string>();

  const acrescentar = (rota: string | undefined, origem: string): void => {
    if (!rota || !rota.startsWith("/") || jaIncluido.has(rota)) return;
    jaIncluido.add(rota);
    alvos.push({ rota, origem });
  };

  // 1. Home — é a página que todo leitor cai primeiro depois do deploy.
  acrescentar("/", "home");

  // 2. Top 100 — as páginas canônicas do portal, geradas em JSON versionado.
  //    O `\uFEFF` é removido por causa da armadilha do AGENTS § 6: um BOM na
  //    frente do JSON faz o JSON.parse recusar o arquivo inteiro.
  const caminhoTop100 = resolve(RAIZ, "apps/web/data/top-100-paginas.json");
  const cru = readFileSync(caminhoTop100, "utf8").replace(/^\uFEFF/, "");
  const top100 = JSON.parse(cru) as Array<{ href?: string }>;
  for (const pagina of top100) {
    acrescentar(pagina.href, "top-100");
  }

  // 3. Rotas legadas dos eixos — a camada guarda-chuva de cada subfrente.
  for (const eixo of Object.values(CATALOGO_EIXOS)) {
    for (const subfrente of eixo.subfrentes) {
      acrescentar(subfrente.rotaLegada, `eixo:${eixo.id}`);
    }
  }

  return alvos;
}

/**
 * Faz UMA requisição e devolve status e bytes do corpo.
 *
 * O corpo é lido inteiro de propósito: `fetch` resolve quando chegam os
 * cabeçalhos, e é o download completo que faz o servidor trabalhar o roteiro,
 * o banco e o cache — aquecer só o cabeçalho esquentaria pouco. `redirect:
 * "follow"` é o `-L` do curl: segue 301/302 até a página de verdade.
 */
async function requisitar(url: string): Promise<{ status: number; bytes: number }> {
  const resposta = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "accept-language": "pt-BR,pt;q=0.9",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const corpo = await resposta.arrayBuffer();
  return { status: resposta.status, bytes: corpo.byteLength };
}

/**
 * Aquece um alvo, com o retry único de 5xx.
 *
 * Devolve o resultado completo; nunca lança — erro de rede vira `status: 0`
 * com a mensagem, para que uma página fora do ar não interrompa a varredura
 * das demais (o resumo final é quem decide o exit code).
 */
async function aquecer(alvo: Alvo, url: string): Promise<Resultado> {
  const inicio = Date.now();
  let repetiu = false;

  try {
    let primeiro = await requisitar(url);

    // 5xx = o servidor subiu e ainda não está de pé (ou caiu de novo).
    // Uma única repetição depois de ~12 s: costuma ser o deploy ainda
    // trocando de processo, não um site quebrado.
    if (primeiro.status >= 500) {
      repetiu = true;
      await dormir(ESPERA_RETRY_MS);
      primeiro = await requisitar(url);
    }

    return {
      alvo,
      status: primeiro.status,
      bytes: primeiro.bytes,
      ms: Date.now() - inicio,
      repetiu,
    };
  } catch (e) {
    return {
      alvo,
      status: 0,
      bytes: 0,
      ms: Date.now() - inicio,
      erro: e instanceof Error ? e.message : String(e),
      repetiu,
    };
  }
}

/** Converte bytes em algo legível sem depender de biblioteca externa. */
function formatarBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${bytes} B`;
}

async function main(): Promise<void> {
  const base = (arg("base") ?? BASE_PADRAO).replace(/\/+$/, "");
  const tudo = process.argv.includes("--tudo");
  const limiteArg = Number.parseInt(arg("limite") ?? "", 10);
  // Padrão conservador (Starter): LIMITE_PADRAO rotas. `--tudo` libera a lista.
  const limite = tudo
    ? undefined
    : Number.isFinite(limiteArg) && limiteArg > 0
      ? limiteArg
      : LIMITE_PADRAO;

  const alvosCompletos = carregarAlvos();
  const alvos = limite ? alvosCompletos.slice(0, limite) : alvosCompletos;

  const porOrigem = new Map<string, number>();
  for (const a of alvosCompletos) {
    porOrigem.set(a.origem, (porOrigem.get(a.origem) ?? 0) + 1);
  }

  console.log("[aquecer] Aquecimento pos-deploy");
  console.log(`[aquecer] Base: ${base}`);
  console.log(
    `[aquecer] Alvos: ${alvos.length}` +
      (limite ? ` de ${alvosCompletos.length} (--limite=${limite})` : "") +
      ` — ${[...porOrigem].map(([o, n]) => `${o} ${n}`).join(", ")}`,
  );
  console.log(
    `[aquecer] Pausa de ${PAUSA_MS} ms entre as páginas (medido 03/10/2026: ` +
      `varredura contínua reiniciou o container 3×)`,
  );
  console.log("");

  const inicioTotal = Date.now();
  const resultados: Resultado[] = [];
  let durasSeguidas = 0;
  let cooldownsUsados = 0;
  let cortou = false;

  for (let i = 0; i < alvos.length; i++) {
    const alvo = alvos[i];
    const url = `${base}${alvo.rota}`;
    const r = await aquecer(alvo, url);
    resultados.push(r);

    const numero = String(i + 1).padStart(String(alvos.length).length, " ");
    const marca = r.status === 200 ? "200" : `!! ${r.status || "ERR"}`;
    const detalhe = r.erro ? `  ${r.erro}` : `  ${formatarBytes(r.bytes)}`;
    const repete = r.repetiu ? "  (repetiu apos 5xx)" : "";

    console.log(
      `[${numero}/${alvos.length}] ${marca} ${String(r.ms).padStart(6)} ms` +
        `${detalhe}  ${alvo.rota}  [${alvo.origem}]${repete}`,
    );

    // Cortacircuito (ver FALHAS_DURAS_SEGUIDAS): falha "dura" é rede morta ou
    // 5xx que sobreviveu ao retry — as duas dizem que o SERVIDOR não vai bem.
    // 404 não é dura: página inexistente responde na hora e não zera a contagem.
    const dura = r.status === 0 || r.status >= 500;
    durasSeguidas = dura ? durasSeguidas + 1 : 0;

    if (durasSeguidas >= FALHAS_DURAS_SEGUIDAS) {
      // Cooldown documentado no topo do arquivo: quando o container reinicia
      // por OOM ele NÃO volta enquanto chega requisição. Calar a boca por 2
      // min e retomar as mesmas páginas é o que a medição de 03/10/2026 pediu.
      if (cooldownsUsados < MAX_COOLDOWNS) {
        cooldownsUsados++;
        const primeiraQuebrada = i - durasSeguidas + 1;
        console.log("");
        console.log(
          `[aquecer] CORTACIRCUITO após ${durasSeguidas} falhas duras seguidas ` +
            `(cooldown ${cooldownsUsados}/${MAX_COOLDOWNS}): o servidor não responde.`,
        );
        console.log(
          `[aquecer] Silêncio de ${COOLDOWN_MS / 1000} s e retomo pelas mesmas ` +
            `${durasSeguidas} página(s), a partir de ${alvos[primeiraQuebrada].rota}.`,
        );
        await dormir(COOLDOWN_MS);

        // Os resultados duros que vão ser refeitos saem da conta agora — senão
        // a mesma página apareceria como falha e como sucesso no resumo.
        resultados.splice(resultados.length - durasSeguidas, durasSeguidas);
        durasSeguidas = 0;
        i = primeiraQuebrada - 1; // o i++ do laço devolve a primeira quebrada
        continue;
      }

      const naoTestadas = alvos.length - (i + 1);
      console.log("");
      console.log(
        `[aquecer] CORTACIRCUITO DEFINITIVO após ${cooldownsUsados} cooldown(s) ` +
          `sem recuperação: o servidor não voltou. Parando em vez de martelar.`,
      );
      console.log(`[aquecer] ${naoTestadas} rota(s) restantes não foram testadas.`);
      cortou = true;
      break;
    }

    // A pausa é sempre a última coisa do ciclo — inclusive depois do retry,
    // porque os 12 s do 5xx vêm em cima da pausa, nunca no lugar dela.
    if (i < alvos.length - 1) await dormir(PAUSA_MS);
  }

  // ── Resumo ──────────────────────────────────────────────────────────────
  const duracaoS = (Date.now() - inicioTotal) / 1000;
  const falhas = resultados.filter((r) => r.status !== 200);
  const ok = resultados.length - falhas.length;
  const bytesTotal = resultados.reduce((s, r) => s + r.bytes, 0);
  const repetidos = resultados.filter((r) => r.repetiu).length;

  console.log("");
  console.log("=== Resumo do aquecimento pos-deploy ===");
  console.log(`Base .......... ${base}`);
  console.log(`Páginas ....... ${resultados.length} de ${alvos.length}`);
  console.log(`HTTP 200 ...... ${ok}`);
  console.log(`Falhas ........ ${falhas.length}`);
  console.log(`Repetições .... ${repetidos} (5xx)`);
  console.log(`Bytes ......... ${formatarBytes(bytesTotal)}`);
  console.log(`Duração ....... ${duracaoS.toFixed(1)} s`);
  if (cortou) console.log(`Cortacircuito  sim — ${alvos.length - resultados.length} rota(s) não testadas`);

  if (falhas.length > 0) {
    console.log("");
    console.log("Falhas (cada uma é uma página que NÃO respondeu 200):");
    for (const f of falhas) {
      const motivo = f.erro ?? `HTTP ${f.status}`;
      console.log(`  ${f.alvo.rota}  [${f.alvo.origem}]  ${motivo}`);
    }
    console.log("");
    console.log(
      cortou
        ? "[aquecer] SAIU COM ERRO: o servidor não respondeu — veja o cortacircuito acima."
        : "[aquecer] SAIU COM ERRO: o deploy não está inteiro no ar.",
    );
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("[aquecer] OK: todas as páginas responderam 200.");
}

main().catch((e) => {
  console.error("[aquecer] Erro fatal:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
