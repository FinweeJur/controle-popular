/**
 * coletar-salic-rouanet.mts — coleta a Lei Rouanet (API SALIC/MinC) por UF,
 * com retomada, e grava JSON em `apps/web/data/`.
 *
 *   npx tsx scripts/coletar-salic-rouanet.mts --sonda        # ~10 requisições, só mede e confere as armadilhas
 *   npx tsx scripts/coletar-salic-rouanet.mts                # coleta MG (retoma de onde parou)
 *   npx tsx scripts/coletar-salic-rouanet.mts --uf=SP        # outra UF
 *   npx tsx scripts/coletar-salic-rouanet.mts --recomecar    # descarta o checkpoint e começa do zero
 *   npx tsx scripts/coletar-salic-rouanet.mts --relatorio    # escreve docs/FONTES-ROUANET-SALIC.md do JSON já coletado, sem rede
 *
 * ═══ POR QUE ESTA FONTE, E NÃO MAIS UM CATÁLOGO ═══
 *
 * O eixo Cidades já responde "quem ganhou contrato desta prefeitura". O SALIC
 * publica `cgccpf` em cada incentivador — **é a mesma empresa, no outro
 * papel**: quem vende para o município e quem abate imposto para financiar
 * cultura no município. Essa junção por CNPJ é o produto; o catálogo de
 * projetos é só o caminho até ela. Um coletor que trouxesse os projetos e
 * jogasse o `cgccpf` fora teria feito o trabalho todo e perdido a razão dele.
 *
 * ═══ POR QUE ARQUIVO, E NÃO BANCO ═══
 *
 * Não há Postgres nesta máquina e a Neon está em HTTP 402 até 01/09/2026. O
 * mesmo caminho que o risco climático já usa (`apps/web/data/*.json`, lido no
 * BUILD por `process.cwd()/data`) serve aqui: dado sem junção pesada,
 * versionado, com diff legível. Nada disto entra no bundle do cliente — o
 * teto do Worker (3 MiB gzip) é lido no build, não em runtime.
 *
 * ═══ RESPEITO AO SERVIDOR ═══
 *
 * API pública de governo, sem chave e sem quota anunciada. Uma requisição por
 * vez, `PAUSA_MS` entre elas, User-Agent que diz quem somos e onde reclamar,
 * recuo exponencial em 429/5xx. Não paralelizar: 200 requisições educadas em
 * série custam três minutos e não derrubam nada.
 *
 * ═══ AS SEIS ARMADILHAS ═══
 *
 * As quatro do plano (`docs/PLANO-2026-08-15.md` §N2) e mais duas medidas em
 * 15/08/2026 ao escrever este script — as duas novas são piores, porque
 * devolvem HTTP 200. Cada uma está anotada no ponto do código que a trata; o
 * catálogo completo, com os números, está no cabeçalho de
 * `apps/web/lib/cultura/salic.ts`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BASE_SALIC,
  LIMITE_MAXIMO,
  agregarPorCgccpf,
  anoDeQuatroDigitos,
  conferirFiltroHonrado,
  conferirSemCpf,
  decodificarCorpo,
  enxugarProjeto,
  lerEnvelope,
  linkPublicado,
  montarUrl,
  normalizarCgccpf,
  reais,
  somar,
  topPorTotalDoado,
  type AgregadoIncentivador,
  type Incentivador,
  type ProjetoRouanet,
} from "../apps/web/lib/cultura/salic.ts";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DADOS = path.join(RAIZ, "apps", "web", "data");
/** Rascunho da coleta: NDJSON por página + checkpoint. Ignorado pelo git. */
const TRABALHO = path.join(RAIZ, "apps", "web", ".tmp-salic");
const DOCS = path.join(RAIZ, "docs");

/**
 * Identificação obrigatória. Sem isso, o servidor vê 200 requisições
 * anônimas em série e não tem a quem escrever se algo incomodar.
 */
const AGENTE =
  "controle-popular/1.0 (coletor Rouanet; https://github.com/FinweeJur/controle-popular)";

/**
 * Pausa entre requisições. 700 ms dá ~1,4 req/s: 73 páginas de projetos de MG
 * em 51 s, 208 páginas de incentivadores em 2 min 26 s. Baixar isso economiza
 * um minuto e arrisca a fonte inteira — não vale.
 */
const PAUSA_MS = 700;
const TENTATIVAS = 4;

const ARGS = process.argv.slice(2);
const SONDA = ARGS.includes("--sonda");
const RELATORIO = ARGS.includes("--relatorio");
const RECOMECAR = ARGS.includes("--recomecar");
const UF = (ARGS.find((a) => a.startsWith("--uf="))?.slice(5) ?? "MG").toUpperCase();

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Resposta {
  status: number;
  texto: string;
  contentType: string;
}

/**
 * Uma requisição, com as armadilhas 1 e 3 tratadas na porta de entrada.
 *
 * `redirect: "manual"` **de propósito**, e não `"follow"`: o 301 da barra
 * final aponta para `http://api.salic...` (medido — o `Location` desce de
 * https para http). Seguir cego sairia do TLS sem avisar, e o corpo do 301 é
 * HTML de Apache em iso-8859-1, que vira `JSON.parse` explodindo num lugar
 * que não tem nada a ver com a causa. Como `montarUrl` nunca põe barra final,
 * um 3xx aqui significa que a API mudou de rota — e isso é para PARAR, não
 * para seguir.
 *
 * A leitura é por bytes + `decodificarCorpo` (armadilha 3): `res.text()`
 * decidiria a codificação pelo header, e o header do 301 diz iso-8859-1.
 */
async function pedir(url: string): Promise<Resposta> {
  let ultimoErro = "";
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": AGENTE, Accept: "application/json" },
        redirect: "manual",
      });
      if (res.status >= 300 && res.status < 400) {
        throw new Error(
          `ABORTADO: ${url} devolveu ${res.status} para ${res.headers.get("location")}. ` +
            `A URL foi montada sem barra final, então isto é rota nova — confira antes de seguir ` +
            `(o Location do SALIC desce para http:// e o corpo é HTML de Apache).`
        );
      }
      const bytes = new Uint8Array(await res.arrayBuffer());
      // 429/5xx: recuo exponencial. 404 NÃO é retentado — no SALIC ele é
      // resposta de negócio ("No funding info was found"), não falha.
      if (res.status === 429 || res.status >= 500) {
        ultimoErro = `HTTP ${res.status}`;
        const espera = PAUSA_MS * 2 ** tentativa;
        console.warn(`  ${ultimoErro} em ${url} — nova tentativa em ${espera} ms`);
        await dormir(espera);
        continue;
      }
      return {
        status: res.status,
        texto: decodificarCorpo(bytes, url),
        contentType: res.headers.get("content-type") ?? "",
      };
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("ABORTADO")) throw e;
      ultimoErro = e instanceof Error ? e.message : String(e);
      const espera = PAUSA_MS * 2 ** tentativa;
      console.warn(`  rede falhou (${ultimoErro}) — nova tentativa em ${espera} ms`);
      await dormir(espera);
    }
  }
  throw new Error(`ABORTADO: ${url} falhou ${TENTATIVAS} vezes (${ultimoErro}).`);
}

/** Total de um recurso sob um filtro, com uma requisição de `limit=1`. */
async function totalDe(recurso: string, chave: string, filtro: Record<string, string | number>) {
  const r = await pedir(montarUrl(recurso, { ...filtro, limit: 1 }));
  await dormir(PAUSA_MS);
  return lerEnvelope(r.texto, chave).total;
}

// ════════════════════════════════════════════════════════════════════════
// SONDA — dez requisições que provam (ou desmentem) cada armadilha
// ════════════════════════════════════════════════════════════════════════

interface Medida {
  o_que: string;
  resultado: string;
}

async function sondar(): Promise<Medida[]> {
  const m: Medida[] = [];
  const anota = (o_que: string, resultado: string) => {
    console.log(`  ${o_que}: ${resultado}`);
    m.push({ o_que, resultado });
  };

  const totalProjetosUF = await totalDe("projetos", "projetos", { UF });
  anota(`projetos com UF=${UF}`, String(totalProjetosUF));

  const totalIncBrasil = await totalDe("incentivadores", "incentivadores", {});
  anota("incentivadores no Brasil", String(totalIncBrasil));

  const totalIncUF = await totalDe("incentivadores", "incentivadores", { UF });
  anota(`incentivadores domiciliados em ${UF}`, String(totalIncUF));

  // ── Armadilha 5: filtro inexistente devolve o catálogo inteiro ──────────
  const totalBobo = await totalDe("incentivadores", "incentivadores", {
    parametro_inexistente_xyz: 1,
  });
  anota(
    "filtro inexistente (parametro_inexistente_xyz=1)",
    totalBobo === totalIncBrasil
      ? `${totalBobo} — IGUAL ao total sem filtro: a API ignora o que não conhece e devolve tudo com HTTP 200`
      : `${totalBobo} — o filtro foi honrado (comportamento mudou desde 15/08/2026)`
  );

  // ── Armadilha 1: barra final ────────────────────────────────────────────
  const comBarra = await fetch(`${BASE_SALIC}/projetos/?UF=${UF}&limit=1`, {
    headers: { "User-Agent": AGENTE },
    redirect: "manual",
  });
  anota(
    "barra final em /projetos/",
    `HTTP ${comBarra.status} -> ${comBarra.headers.get("location")} (content-type ${comBarra.headers.get("content-type")})`
  );
  await dormir(PAUSA_MS);

  // ── Armadilha 2: o hash de `_links` é função da CONSULTA ────────────────
  const q1 = await pedir(montarUrl("incentivadores", { limit: 1 }));
  await dormir(PAUSA_MS);
  const q2 = await pedir(montarUrl("incentivadores", { limit: 2 }));
  await dormir(PAUSA_MS);
  const i1 = lerEnvelope<Incentivador>(q1.texto, "incentivadores").itens[0];
  const i2 = lerEnvelope<Incentivador>(q2.texto, "incentivadores").itens[0];
  const h1 = linkPublicado(i1, "self").split("/").pop()!;
  const h2 = linkPublicado(i2, "self").split("/").pop()!;
  anota(
    `hash do "self" do mesmo incentivador (cgccpf ${i1.cgccpf}) em duas consultas`,
    h1 === h2
      ? `IGUAL (${h1.slice(0, 12)}…) — o hash virou identidade estável`
      : `DIFERENTE (${h1.slice(0, 12)}… vs ${h2.slice(0, 12)}…) — o hash é da consulta, não do registro`
  );
  anota(
    "hash de `self` vs `doacoes` no mesmo item",
    linkPublicado(i1, "self").split("/").pop() === linkPublicado(i1, "doacoes").split("/").slice(-2)[0]
      ? "IGUAL"
      : "DIFERENTE — concatenar o id do self para montar /doacoes dá 404"
  );

  // ── O link publicado de doações funciona? ───────────────────────────────
  const doa = await pedir(linkPublicado(i1, "doacoes"));
  anota(
    "GET no link `_links.doacoes` publicado",
    `HTTP ${doa.status} — ${doa.texto.slice(0, 90)}`
  );
  await dormir(PAUSA_MS);

  // ── Armadilha 6: `sort` é ignorado ──────────────────────────────────────
  const semSort = await pedir(montarUrl("incentivadores", { limit: 5 }));
  await dormir(PAUSA_MS);
  const comSort = await pedir(montarUrl("incentivadores", { limit: 5, sort: "total_doado" }));
  await dormir(PAUSA_MS);
  const va = lerEnvelope<Incentivador>(semSort.texto, "incentivadores").itens.map((x) => x.total_doado);
  const vb = lerEnvelope<Incentivador>(comSort.texto, "incentivadores").itens.map((x) => x.total_doado);
  anota(
    "sort=total_doado muda a ordem?",
    JSON.stringify(va) === JSON.stringify(vb)
      ? `NÃO — as mesmas 5 linhas na mesma ordem (${va.join(", ")}); o ranking tem de ser feito aqui`
      : `sim (${vb.join(", ")})`
  );

  // ── Armadilha 3: onde o mojibake realmente mora ─────────────────────────
  const cru = await fetch(montarUrl("incentivadores", { limit: 1 }), {
    headers: { "User-Agent": AGENTE },
  });
  const bytesJson = new Uint8Array(await cru.arrayBuffer());
  anota(
    "corpo JSON tem byte acima de 127?",
    bytesJson.some((b) => b > 127)
      ? "SIM — precisa forçar UTF-8"
      : `NÃO — o servidor escapa acento (\\u00ed); o mojibake não nasce na rota JSON`
  );
  await dormir(PAUSA_MS);
  const csv = await fetch(`${montarUrl("incentivadores", { limit: 1 })}&format=csv`, {
    headers: { "User-Agent": AGENTE },
  });
  const bytesCsv = Buffer.from(await csv.arrayBuffer());
  anota(
    "corpo CSV (?format=csv) tem byte acima de 127?",
    bytesCsv.some((b) => b > 127)
      ? `SIM — UTF-8 cru; lido como latin-1 vira ${JSON.stringify(
          bytesCsv.toString("latin1").match(/Bras\S+/)?.[0] ?? "mojibake"
        )}`
      : "não"
  );

  // ── O link de incentivadores que o PROJETO publica ──────────────────────
  const pag = await pedir(montarUrl("projetos", { UF, limit: 1 }));
  await dormir(PAUSA_MS);
  const projeto = lerEnvelope<Record<string, unknown>>(pag.texto, "projetos").itens[0] as {
    PRONAC: string;
    _links?: Record<string, string>;
  };
  const linkInc = linkPublicado(projeto, "incentivadores");
  const rInc = await pedir(linkInc);
  const totalDoLink = lerEnvelope(rInc.texto, "incentivadores").total;
  anota(
    `_links.incentivadores do projeto PRONAC ${projeto.PRONAC}`,
    totalDoLink === totalIncBrasil
      ? `${totalDoLink} — o CATÁLOGO INTEIRO. O link publicado usa "incentivador_id=<PRONAC>", que não é filtro reconhecido`
      : `${totalDoLink} — o link filtrou de verdade`
  );

  return m;
}

// ════════════════════════════════════════════════════════════════════════
// COLETA COM RETOMADA
// ════════════════════════════════════════════════════════════════════════

interface Checkpoint {
  uf: string;
  /** Próximo offset a pedir, por recurso. */
  offset: Record<string, number>;
  /** Total anunciado pela API na primeira página, por recurso. */
  total: Record<string, number>;
  atualizado_em: string;
}

function caminhoCheckpoint(uf: string) {
  return path.join(TRABALHO, `checkpoint-${uf}.json`);
}
function caminhoNdjson(uf: string, recurso: string) {
  return path.join(TRABALHO, `${recurso}-${uf}.ndjson`);
}

function lerCheckpoint(uf: string): Checkpoint {
  const p = caminhoCheckpoint(uf);
  if (existsSync(p)) return JSON.parse(readFileSync(p, "utf-8")) as Checkpoint;
  return { uf, offset: {}, total: {}, atualizado_em: new Date().toISOString() };
}

function gravarCheckpoint(cp: Checkpoint) {
  cp.atualizado_em = new Date().toISOString();
  writeFileSync(caminhoCheckpoint(cp.uf), JSON.stringify(cp, null, 2), "utf-8");
}

/**
 * Pagina um recurso inteiro, gravando cada página em NDJSON antes de avançar
 * o checkpoint.
 *
 * A ordem importa: **grava a página, depois move o offset**. Se cair no meio,
 * a pior consequência é reprocessar uma página (que a deduplicação por chave
 * resolve), nunca pular uma — 1.136 requisições para o Brasil inteiro
 * (armadilha 4) garantem que "cair no meio" vai acontecer.
 */
async function paginar<T>(
  recurso: string,
  chave: string,
  filtro: Record<string, string | number>,
  cp: Checkpoint
): Promise<void> {
  const arquivo = caminhoNdjson(cp.uf, recurso);
  let offset = cp.offset[recurso] ?? 0;
  if (offset === 0 && existsSync(arquivo)) rmSync(arquivo);

  while (true) {
    const url = montarUrl(recurso, { ...filtro, limit: LIMITE_MAXIMO, offset });
    const r = await pedir(url);
    if (r.status === 404) {
      // No SALIC, 404 em listagem é "acabou o filtro", não erro de rota.
      console.log(`  ${recurso}: 404 em offset ${offset} — fim da lista`);
      break;
    }
    const pagina = lerEnvelope<T>(r.texto, chave);
    if (cp.total[recurso] === undefined) cp.total[recurso] = pagina.total;

    for (const item of pagina.itens) appendFileSync(arquivo, JSON.stringify(item) + "\n", "utf-8");
    offset += pagina.count;
    cp.offset[recurso] = offset;
    gravarCheckpoint(cp);

    const pct = ((offset / pagina.total) * 100).toFixed(1);
    process.stdout.write(`\r  ${recurso}: ${offset}/${pagina.total} (${pct}%)   `);
    if (offset >= pagina.total || pagina.count === 0) break;
    await dormir(PAUSA_MS);
  }
  process.stdout.write("\n");
}

function lerNdjson<T>(uf: string, recurso: string): T[] {
  const p = caminhoNdjson(uf, recurso);
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf-8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as T);
}

async function coletar(): Promise<void> {
  mkdirSync(TRABALHO, { recursive: true });
  mkdirSync(DADOS, { recursive: true });
  if (RECOMECAR) {
    rmSync(TRABALHO, { recursive: true, force: true });
    mkdirSync(TRABALHO, { recursive: true });
    console.log("checkpoint descartado (--recomecar).");
  }
  const cp = lerCheckpoint(UF);

  // ── Armadilha 5, antes de gastar 280 requisições ────────────────────────
  //
  // Medir o total SEM filtro e comparar com o total COM filtro. Se forem
  // iguais, o `UF` foi ignorado e o que viria a seguir seria o Brasil inteiro
  // etiquetado como MG — o pior resultado possível, porque parece certo.
  console.log(`conferindo se o filtro UF=${UF} é honrado…`);
  const totalIncBrasil = await totalDe("incentivadores", "incentivadores", {});
  const totalIncUF = await totalDe("incentivadores", "incentivadores", { UF });
  conferirFiltroHonrado(`incentivadores?UF=${UF}`, totalIncUF, totalIncBrasil);
  const totalProjBrasil = await totalDe("projetos", "projetos", {});
  const totalProjUF = await totalDe("projetos", "projetos", { UF });
  conferirFiltroHonrado(`projetos?UF=${UF}`, totalProjUF, totalProjBrasil);
  console.log(
    `  projetos: ${totalProjUF} em ${UF} de ${totalProjBrasil} no Brasil; ` +
      `incentivadores: ${totalIncUF} de ${totalIncBrasil}`
  );

  console.log(`coletando projetos de ${UF}…`);
  await paginar<Record<string, unknown>>("projetos", "projetos", { UF }, cp);
  console.log(`coletando incentivadores domiciliados em ${UF}…`);
  await paginar<Incentivador>("incentivadores", "incentivadores", { UF }, cp);

  const projetos = lerNdjson<Record<string, unknown>>(UF, "projetos").map(enxugarProjeto);
  const incentivadores = lerNdjson<Incentivador>(UF, "incentivadores");

  // Deduplicação: retomada pode reprocessar a última página gravada.
  const porPronac = new Map(projetos.map((p) => [p.PRONAC, p]));
  const vistos = new Set<string>();
  const incUnicos = incentivadores.filter((i) => {
    // Sem `_links` na chave: o hash muda a cada consulta (armadilha 2) e
    // duplicaria todo registro que caísse em duas páginas.
    const k = `${normalizarCgccpf(i.cgccpf) ?? i.nome}|${i.nome}|${i.municipio}|${i.total_doado}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });

  // Última porta antes de escrever em arquivo VERSIONADO, num repositório
  // público. A fonte mascara CPF hoje; se parar, a coleta morre aqui em vez de
  // virar commit. Ver `conferirSemCpf`.
  conferirSemCpf([...porPronac.values()] as unknown as Array<Record<string, unknown>>);
  conferirSemCpf(incUnicos as unknown as Array<Record<string, unknown>>);

  const agora = new Date().toISOString().slice(0, 10);
  const cabecalho = {
    fonte: "API SALIC — Ministério da Cultura (Lei 8.313/1991, Lei Rouanet)",
    base: BASE_SALIC,
    uf: UF,
    coletado_em: agora,
    aviso:
      "Dado público, sem chave. Os hashes de `_links` NÃO são identidade (mudam por consulta) " +
      "e por isso não são gravados. A chave estável é `cgccpf` — a mesma que liga o incentivador " +
      "cultural ao fornecedor de contrato público do eixo Cidades.",
  };

  escreverJson(
    path.join(DADOS, `rouanet-${UF.toLowerCase()}-projetos.json`),
    { ...cabecalho, total_anunciado_pela_api: cp.total.projetos },
    "projetos",
    [...porPronac.values()]
  );
  escreverJson(
    path.join(DADOS, `rouanet-${UF.toLowerCase()}-incentivadores.json`),
    {
      ...cabecalho,
      total_anunciado_pela_api: cp.total.incentivadores,
      observacao_total_doado:
        `\`total_doado\` é o total do incentivador no BRASIL inteiro, não em ${UF}. A API não ` +
        "publica recorte por UF do projeto financiado, e o link `_links.doacoes`, que traria a " +
        "trilha por projeto, devolveu HTTP 404 em todos os testes de 15/08/2026.",
    },
    "incentivadores",
    // `_links` fora: o hash muda a cada consulta (armadilha 2), então gravá-lo
    // seria versionar ruído que muda sozinho em toda recoleta.
    incUnicos.map(({ _links, ...resto }) => {
      void _links;
      return resto;
    })
  );

  console.log(
    `gravados ${porPronac.size} projetos e ${incUnicos.length} incentivadores em apps/web/data/.`
  );
}

/**
 * Grava com o cabeçalho legível e **um registro por linha**.
 *
 * Não é capricho: `risco-climatico.json` é o vizinho e ele grava tudo numa
 * linha só de 2,9 MB — qualquer correção de um município reescreve a linha
 * inteira, e o `git diff` fica ilegível. Indentar de verdade (`null, 2`)
 * triplicaria o arquivo. Um registro por linha custa ~2% de tamanho e faz o
 * diff mostrar exatamente os projetos que mudaram entre duas coletas, que é o
 * que interessa numa fonte que vai ser recoletada.
 */
function escreverJson(
  caminho: string,
  cabecalho: Record<string, unknown>,
  chave: string,
  itens: unknown[]
) {
  const meta = JSON.stringify(cabecalho, null, 1).replace(/\n?}$/, "");
  const linhas = itens.map((i) => " " + JSON.stringify(i));
  const texto = `${meta},\n "${chave}": [\n${linhas.join(",\n")}\n ]\n}\n`;
  // Conferir que o resultado é JSON de verdade ANTES de gravar: montar texto à
  // mão é rápido e é exatamente o tipo de coisa que grava um arquivo quebrado.
  JSON.parse(texto);
  writeFileSync(caminho, texto, "utf-8");
  // Reconferir lendo do disco: gravar e acreditar é como o mojibake passa.
  // É a disciplina de `extrair-educacao-paraopeba.mts`, e aqui vale dobrado
  // porque o volume esconde uma linha suja no meio de vinte mil.
  const relido = readFileSync(caminho, "utf-8");
  if (/\uFFFD/.test(relido)) {
    throw new Error(`ABORTADO: ${path.basename(caminho)} gravado com caractere de substituição.`);
  }
  const kb = (Buffer.byteLength(texto, "utf-8") / 1024).toFixed(0);
  console.log(`  ${path.relative(RAIZ, caminho)} — ${kb} KB`);
}

// ════════════════════════════════════════════════════════════════════════
// RELATÓRIO — do JSON coletado, sem rede
// ════════════════════════════════════════════════════════════════════════

function lerColetado<T>(nome: string, chave: string): { meta: Record<string, unknown>; itens: T[] } {
  const p = path.join(DADOS, nome);
  if (!existsSync(p)) {
    throw new Error(`ABORTADO: ${nome} não existe. Rode a coleta antes do relatório.`);
  }
  const j = JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
  return { meta: j, itens: (j[chave] ?? []) as T[] };
}

function tabelaTop(top: AgregadoIncentivador[]): string {
  const linhas = top.map(
    (t, i) =>
      `| ${i + 1} | ${t.nome} | \`${t.cgccpf}\` | ${reais(t.total_doado)} | ${t.registros} | ${t.ufs.join(", ")} |`
  );
  return [
    "| # | Incentivador | CNPJ/CPF | Total doado (Brasil) | Registros somados | UF do registro |",
    "|---|---|---|---|---|---|",
    ...linhas,
  ].join("\n");
}

function escreverRelatorio(medidas: Medida[] | null) {
  const uf = UF.toLowerCase();
  const proj = lerColetado<ProjetoRouanet>(`rouanet-${uf}-projetos.json`, "projetos");
  const inc = lerColetado<Incentivador>(`rouanet-${uf}-incentivadores.json`, "incentivadores");
  const projetos = proj.itens;
  const incentivadores = inc.itens;

  const comCaptacao = projetos.filter((p) => p.valor_captado > 0);
  const comAprovacao = projetos.filter((p) => p.valor_aprovado > 0);
  const top = topPorTotalDoado(incentivadores, 10);
  const semCnpj = incentivadores.filter((i) => !normalizarCgccpf(i.cgccpf)).length;
  const pj = incentivadores.filter((i) => i.tipo_pessoa === "juridica");
  const pf = incentivadores.filter((i) => i.tipo_pessoa === "fisica");
  const agregados = agregarPorCgccpf(incentivadores);

  const porMunicipio = new Map<string, { n: number; captado: number }>();
  for (const p of projetos) {
    const m = p.municipio || "(sem município)";
    const a = porMunicipio.get(m) ?? { n: 0, captado: 0 };
    a.n += 1;
    a.captado += p.valor_captado;
    porMunicipio.set(m, a);
  }
  const topMunicipios = [...porMunicipio.entries()]
    .sort((a, b) => b[1].captado - a[1].captado)
    .slice(0, 10);

  const anos = projetos
    .map((p) => anoDeQuatroDigitos(p.ano_projeto))
    .filter((a): a is number => a !== null);
  // `Math.min()` de lista vazia é Infinity, e "Infinity–-Infinity" no relatório
  // pareceria um intervalo de verdade. Sem ano medido, o relatório diz isso.
  const faixaAnos = anos.length ? `${Math.min(...anos)}–${Math.max(...anos)}` : "nenhum ano legível";

  const texto = `# Lei Rouanet (SALIC) em ${UF} — o que foi medido

> Fonte: API SALIC do Ministério da Cultura, \`${BASE_SALIC}\`, pública e sem
> chave. Coleta de **${proj.meta.coletado_em}** por
> \`scripts/coletar-salic-rouanet.mts\`. Todo número desta página saiu dessa
> coleta; nenhum foi estimado.

## Por que esta fonte entrou no portal

O eixo Cidades já responde "quem ganhou contrato desta prefeitura". O SALIC
publica \`cgccpf\` em cada incentivador — **é a mesma empresa, no outro papel**:
quem vende para o município e quem abate imposto para financiar cultura nele.
A junção por CNPJ é o produto desta fonte; o catálogo de projetos é o caminho
até ela.

## Os números de ${UF}

| Medida | Valor |
|---|---|
| Projetos com UF=${UF} (total anunciado pela API) | **${Number(proj.meta.total_anunciado_pela_api).toLocaleString("pt-BR")}** |
| Projetos efetivamente coletados | ${projetos.length.toLocaleString("pt-BR")} |
| Projetos com \`valor_aprovado\` > 0 | ${comAprovacao.length.toLocaleString("pt-BR")} |
| Projetos com \`valor_captado\` > 0 | ${comCaptacao.length.toLocaleString("pt-BR")} |
| Soma de \`valor_aprovado\` | ${reais(somar(projetos, "valor_aprovado"))} |
| Soma de \`valor_captado\` | ${reais(somar(projetos, "valor_captado"))} |
| Anos de projeto presentes | ${faixaAnos} |
| Municípios distintos | ${porMunicipio.size.toLocaleString("pt-BR")} |
| Incentivadores domiciliados em ${UF} (anunciado) | **${Number(inc.meta.total_anunciado_pela_api).toLocaleString("pt-BR")}** |
| Incentivadores coletados (após deduplicar) | ${incentivadores.length.toLocaleString("pt-BR")} |
| — pessoa jurídica / pessoa física | ${pj.length.toLocaleString("pt-BR")} / ${pf.length.toLocaleString("pt-BR")} |
| CNPJ/CPF distintos (chave da junção) | ${agregados.length.toLocaleString("pt-BR")} |
| Registros sem CNPJ/CPF válido (ficam fora da junção) | ${semCnpj.toLocaleString("pt-BR")} |

### ⚠️ O que estes números NÃO dizem

"Incentivadores de ${UF}" aqui significa **domiciliados em ${UF}**, não
"que doaram para projeto de ${UF}". A pergunta certa — *quantos incentivadores
financiaram projeto mineiro, e com quanto* — **não é respondível hoje**, e a
razão está medida abaixo: o único endpoint que ligaria incentivador a projeto
(\`_links.doacoes\`) devolveu HTTP 404 em todos os testes. Publicar
\`total_doado\` de um incentivador de BH como se fosse dinheiro que entrou em
${UF} seria inventar um número — e ele pareceria certo.

Pela mesma razão, \`total_doado\` na tabela abaixo é o total **no Brasil**.

## Top 10 incentivadores domiciliados em ${UF}, por valor doado

Agregado por CNPJ/CPF e **ordenado aqui**, não pela API — \`sort\` é ignorado
pelo servidor (medido; ver as armadilhas). A coluna "registros somados" mostra
quantas grafias/filiais do mesmo documento foram unificadas.

${tabelaTop(top)}

## Top 10 municípios de ${UF} por valor captado

| # | Município | Projetos | Captado |
|---|---|---|---|
${topMunicipios.map(([m, a], i) => `| ${i + 1} | ${m} | ${a.n.toLocaleString("pt-BR")} | ${reais(a.captado)} |`).join("\n")}

## As armadilhas, medidas${medidas ? "" : " em 15/08/2026"}

${
  medidas
    ? medidas.map((m) => `- **${m.o_que}** — ${m.resultado}`).join("\n")
    : `Rode \`npx tsx scripts/coletar-salic-rouanet.mts --sonda\` para remedir. O
catálogo completo, com os números de 15/08/2026, está no cabeçalho de
\`apps/web/lib/cultura/salic.ts\` e é coberto por
\`apps/web/lib/cultura/salic.test.ts\` com fixture gravada.`
}

## O que falta para a tela existir

1. **A trilha incentivador → projeto não existe pela API hoje.** Sem ela, a
   tela mostra dois catálogos lado a lado, não um fluxo de dinheiro. Próximo
   passo é perguntar ao MinC (LAI) se \`/doacoes\` foi desligado ou mudou de
   rota, e checar o dump da Rouanet em \`dados.gov.br\`.
2. **A junção com o fornecedor de contrato público**, que é o motivo de a
   fonte estar aqui: cruzar \`cgccpf\` dos incentivadores contra os CNPJs de
   fornecedor que o eixo Cidades já guarda. Não depende do item 1 e é o que
   torna a página diferente de um catálogo.
3. **Rota e layout.** Nada disto depende de banco: os dois JSON já estão em
   \`apps/web/data/\` e são lidos no build, como o risco climático.
`;

  const destino = path.join(DOCS, `FONTES-ROUANET-SALIC.md`);
  writeFileSync(destino, texto, "utf-8");
  if (/\uFFFD/.test(readFileSync(destino, "utf-8"))) {
    throw new Error("ABORTADO: relatório gravado com caractere de substituição.");
  }
  console.log(`relatório em ${path.relative(RAIZ, destino)}`);
}

// ════════════════════════════════════════════════════════════════════════

if (SONDA) {
  console.log(`sonda SALIC — ${new Date().toISOString().slice(0, 10)}, UF=${UF}`);
  const medidas = await sondar();
  mkdirSync(TRABALHO, { recursive: true });
  writeFileSync(path.join(TRABALHO, "sonda.json"), JSON.stringify(medidas, null, 2), "utf-8");
  console.log(`\n${medidas.length} medidas. Guardadas em apps/web/.tmp-salic/sonda.json.`);
} else if (RELATORIO) {
  const p = path.join(TRABALHO, "sonda.json");
  escreverRelatorio(existsSync(p) ? (JSON.parse(readFileSync(p, "utf-8")) as Medida[]) : null);
} else {
  await coletar();
}
