/**
 * coletar-salic-rouanet.mts — coleta a Lei Rouanet (API SALIC/MinC) por UF,
 * com retomada, e grava JSON em `apps/web/data/`.
 *
 *   npx tsx scripts/coletar-salic-rouanet.mts --sonda        # ~10 requisições, só mede e confere as armadilhas
 *   npx tsx scripts/coletar-salic-rouanet.mts                # coleta MG (retoma de onde parou)
 *   npx tsx scripts/coletar-salic-rouanet.mts --uf=SP        # outra UF
 *   npx tsx scripts/coletar-salic-rouanet.mts --recomecar    # descarta o checkpoint e começa do zero
 *   npx tsx scripts/coletar-salic-rouanet.mts --consolidar   # refaz os dois JSON de apps/web/data/ do NDJSON de rascunho, sem rede
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
  DOCUMENTO_REDIGIDO,
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
  redigirDocumentosSoltos,
  somar,
  topPorTotalDoado,
  type AgregadoIncentivador,
  type Incentivador,
  type ProjetoRouanet,
} from "../apps/web/lib/cultura/salic.ts";
import {
  compactar,
  expandir,
  serializarCompacto,
  type TabelaCompacta,
} from "../apps/web/lib/estatico/compactar.ts";

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
/** Refaz os dois JSON versionados a partir do NDJSON de rascunho, sem rede. */
const CONSOLIDAR = ARGS.includes("--consolidar");
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

  consolidar(cp);
}

/**
 * Consolida o NDJSON de rascunho nos dois arquivos versionados. **Sem rede.**
 *
 * Está separado de `coletar` porque a coleta de MG leva ~35 min e a
 * consolidação leva 2 s: quando muda a forma de gravar (a compactação, a
 * redação de documento solto), refazer 280 requisições contra um servidor
 * público de graça seria falta de educação, além de lento. `--consolidar`
 * chama só isto.
 */
function consolidar(cp: Checkpoint): void {
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

  // ── E o que `conferirSemCpf` NÃO pega ───────────────────────────────────
  //
  // `conferirSemCpf` olha UM campo (`cgccpf`). A coleta completa de MG mostrou
  // que o dado pessoal não estava (só) lá: **215 CPFs válidos por mod-11
  // dentro do campo de NOME** — 210 em `proponente` dos projetos e 5 em `nome`
  // dos incentivadores, no formato "<NOME COMPLETO> <11 dígitos>". A fonte
  // mascara `cgccpf` e não mascara o nome. Mais 5 incentivadores com `cgccpf`
  // de 11 dígitos sem máscara e com DV errado, que nenhum guarda de mod-11
  // pegaria. Ver `redigirDocumentosSoltos`, que varre TODO campo de texto.
  //
  // A contagem vai para o cabeçalho do arquivo: se ela crescer, a origem mudou.
  const proj = redigirDocumentosSoltos(
    [...porPronac.values()] as unknown as Array<Record<string, unknown>>
  );
  const inc = redigirDocumentosSoltos(
    // `_links` fora: o hash muda a cada consulta (armadilha 2), então gravá-lo
    // seria versionar ruído que muda sozinho em toda recoleta.
    incUnicos.map(({ _links, ...resto }) => {
      void _links;
      return resto;
    }) as unknown as Array<Record<string, unknown>>
  );
  if (proj.redigidos + inc.redigidos > 0) {
    console.log(
      `  ⚠ ${proj.redigidos} documentos de 11 dígitos nos projetos e ${inc.redigidos} nos ` +
        `incentivadores — redigidos antes de gravar (a maioria vem colada ao NOME).`
    );
  }

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

  // O filtro `UF` é honrado NO TOTAL (armadilha 5 confere isso) e ainda assim
  // devolve registro cujo campo `UF` não é o pedido: medido em MG, 29 dos
  // 7.206 projetos trazem RJ, SP, AL, BA ou PR. Não é filtro ignorado — é que
  // "projeto de MG" e "campo UF = MG" são coisas diferentes na base do MinC.
  // Contar aqui em vez de consertar: filtrar por conta própria descartaria 29
  // projetos que a fonte diz serem de MG.
  const foraDaUf = proj.itens.filter((p) => String(p.UF) !== UF).length;

  escreverJson(
    path.join(DADOS, `rouanet-${UF.toLowerCase()}-projetos.json`),
    {
      ...cabecalho,
      total_anunciado_pela_api: cp.total.projetos,
      documentos_redigidos_pelo_portal: proj.redigidos,
      registros_com_campo_uf_diferente_do_filtro: foraDaUf,
    },
    proj.itens
  );
  escreverJson(
    path.join(DADOS, `rouanet-${UF.toLowerCase()}-incentivadores.json`),
    {
      ...cabecalho,
      total_anunciado_pela_api: cp.total.incentivadores,
      documentos_redigidos_pelo_portal: inc.redigidos,
      observacao_total_doado:
        `\`total_doado\` é o total do incentivador no BRASIL inteiro, não em ${UF}. A API não ` +
        "publica recorte por UF do projeto financiado, e o link `_links.doacoes`, que traria a " +
        "trilha por projeto, devolveu HTTP 404 em todos os testes de 15/08/2026.",
    },
    inc.itens
  );

  console.log(
    `gravados ${proj.itens.length} projetos e ${inc.itens.length} incentivadores em apps/web/data/.`
  );
}

/**
 * Grava COMPACTADO, com o cabeçalho legível e **um registro por linha**.
 *
 * Duas decisões, e as duas foram medidas:
 *
 * 1. **Uma linha por registro.** `risco-climatico.json` é o vizinho e grava
 *    tudo numa linha só de 2,9 MB — qualquer correção de um município
 *    reescreve a linha inteira e o `git diff` fica ilegível. Indentar de
 *    verdade (`null, 2`) triplicaria o arquivo.
 * 2. **Esqueleto + rótulos internados** (`lib/estatico/compactar.ts`). Um
 *    objeto por linha somava 7.896.493 B nos dois arquivos — o maior dado do
 *    repositório. Compactado dá 2.441.531 B, 69,1% a menos, com os mesmos
 *    27.990 registros. Quem lê usa `expandir`; ninguém indexa `linhas` por
 *    posição na mão.
 */
function escreverJson(caminho: string, cabecalho: Record<string, unknown>, itens: unknown[]) {
  const texto = serializarCompacto(
    cabecalho,
    // `cgccpf` fora do dicionário de propósito: internar a chave de junção
    // produziria, no topo do arquivo, uma lista limpa de todos os CNPJ/CPF do
    // acervo em ordem de frequência. Ver `OpcoesCompactar.nuncaInternar`.
    compactar(itens as Array<Record<string, unknown>>, { nuncaInternar: ["cgccpf"] })
  );
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

function lerColetado<T extends Record<string, unknown>>(
  nome: string
): { meta: Record<string, unknown>; itens: T[] } {
  const p = path.join(DADOS, nome);
  if (!existsSync(p)) {
    throw new Error(`ABORTADO: ${nome} não existe. Rode a coleta antes do relatório.`);
  }
  const j = JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown> & TabelaCompacta;
  return { meta: j, itens: expandir<T>(j) };
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
  const proj = lerColetado<ProjetoRouanet>(`rouanet-${uf}-projetos.json`);
  const inc = lerColetado<Incentivador>(`rouanet-${uf}-incentivadores.json`);
  const projetos = proj.itens;
  const incentivadores = inc.itens;

  const comCaptacao = projetos.filter((p) => p.valor_captado > 0);
  const comAprovacao = projetos.filter((p) => p.valor_aprovado > 0);
  const top = topPorTotalDoado(incentivadores, 10);
  const semCnpj = incentivadores.filter((i) => !normalizarCgccpf(i.cgccpf)).length;
  const pj = incentivadores.filter((i) => i.tipo_pessoa === "juridica");
  const pf = incentivadores.filter((i) => i.tipo_pessoa === "fisica");
  const agregados = agregarPorCgccpf(incentivadores);
  // Máscara da FONTE: contada, não suposta. `includes("*")` e não regex de
  // formato — se o MinC mudar o desenho da máscara, isto continua contando.
  // `DOCUMENTO_REDIGIDO` também tem asterisco e fica DE FORA: somá-lo aqui
  // creditaria ao MinC uma máscara que o portal é que pôs — a confusão que a
  // marca distinta existe justamente para evitar.
  const mascaradoNaFonte = (v: unknown) =>
    String(v).includes("*") && String(v) !== DOCUMENTO_REDIGIDO;
  const maskProj = projetos.filter((p) => mascaradoNaFonte(p.cgccpf)).length;
  const maskInc = incentivadores.filter((i) => mascaradoNaFonte(i.cgccpf)).length;

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

E "projeto de ${UF}" também não é exatamente o que parece: **${Number(proj.meta.registros_com_campo_uf_diferente_do_filtro ?? 0)} dos
${projetos.length.toLocaleString("pt-BR")} projetos que a API devolveu para \`UF=${UF}\` trazem outro valor no
próprio campo \`UF\`** (RJ, SP, AL, BA, PR). O filtro não foi ignorado — a
armadilha 2 confere isso pelo total — mas "projeto de ${UF}" e "campo UF = ${UF}"
são coisas diferentes na base do MinC. O portal **conta** essa divergência no
cabeçalho do arquivo (\`registros_com_campo_uf_diferente_do_filtro\`) em vez de
filtrar de novo por conta própria: descartar seria jogar fora projeto que a
fonte afirma ser de ${UF}.

## Top 10 incentivadores domiciliados em ${UF}, por valor doado

Agregado por CNPJ/CPF e **ordenado aqui**, não pela API — \`sort\` é ignorado
pelo servidor (medido; ver as armadilhas). A coluna "registros somados" mostra
quantas grafias/filiais do mesmo documento foram unificadas.

${tabelaTop(top)}

## Top 10 municípios de ${UF} por valor captado

| # | Município | Projetos | Captado |
|---|---|---|---|
${topMunicipios.map(([m, a], i) => `| ${i + 1} | ${m} | ${a.n.toLocaleString("pt-BR")} | ${reais(a.captado)} |`).join("\n")}

## As armadilhas — leia antes de escrever qualquer frase com esta fonte

### 1. \`sort\` é ignorado em silêncio, e isso já produziu um número falso

Cinco variações (\`sort=total_doado\`, \`sort=-total_doado\`,
\`sort=total_doado&order=desc\`, \`sort=nome\` e sem \`sort\` nenhum) devolveram
**as mesmas cinco linhas, na mesma ordem**, com valores 648.387.436,40 /
15.000,00 / 350,00 / 9.252.331,33 / 500,00 — uma sequência que não está
ordenada por nada. HTTP 200 nas cinco.

> **NUNCA publique "o maior incentivador é o Banco do Brasil, com
> R$ 648.387.436,40".** Essa frase foi escrita assim uma vez, em
> \`docs/PLANO-2026-08-15.md\` §N2, e passada ao dono como fato. O valor está
> certo para aquele CNPJ; o que é falso é chamá-lo de máximo — **é a primeira
> linha da ordem natural da API**, não o topo de um ranking. Qualquer ranking
> desta fonte exige varrer a lista inteira e ordenar do nosso lado, que é o que
> \`ordenarPorTotalDoado\` e \`topPorTotalDoado\` fazem e o que a tabela acima usa.

### 2. Filtro inexistente devolve 200 com o catálogo inteiro

\`?parametro_inexistente_xyz=1&limit=1\` → total **113.548**, idêntico à consulta
sem filtro nenhum. A API ignora o que não conhece e responde 200.

**E o próprio portal do MinC cai nessa armadilha:** cada projeto publica
\`_links.incentivadores → incentivadores?incentivador_id=<PRONAC>\`, e
\`incentivador_id\` não é filtro reconhecido. Seguir o link publicado do projeto
PRONAC 266269 — um festival de Igarapé — devolve **os 113.548 incentivadores do
Brasil inteiro**, com cara de "os incentivadores deste projeto".
\`conferirFiltroHonrado\` transforma isso em abort: mede o total sem filtro na
mesma rodada e para se os dois baterem.

### 3. \`_links.doacoes\` responde 404 em 9 de 9 — a trilha não existe hoje

Testado no Banco do Brasil e nos 8 primeiros incentivadores de ${UF}, sempre
pelo link que a **própria API publica** (nunca montado à mão):
\`{"message":"No funding info was found with your criteria","message_code":11}\`.

Não é erro de montagem de URL, e derruba a razão original de a fonte ter
entrado no plano: **a trilha incentivador → doação → projeto não é percorrível
hoje**. O que sobra são dois catálogos confiáveis lado a lado, e a junção por
\`cgccpf\` com o fornecedor de contrato público — que não depende de
\`/doacoes\`.

### 4. \`total_doado\` é do incentivador no BRASIL, e não se recorta por UF

Não há parâmetro que peça "quanto este incentivador doou para projeto de ${UF}",
e sem \`/doacoes\` não há como derivar. Publicar o \`total_doado\` de um
incentivador domiciliado em BH como "dinheiro que entrou em ${UF}" **inventa um
número que parece certo** — o pior tipo de erro, porque nada na tela o
denunciaria. Onde este relatório mostra \`total_doado\`, a coluna diz "(Brasil)".

### 5. Barra final devolve 301 para HTML \`iso-8859-1\`, e o \`Location\` desce para http

\`/api/v1/projetos/?UF=${UF}\` redireciona para a versão sem barra. Quem segue o
redirect cego sai do TLS sem perceber e recebe HTML de Apache, que vira
\`JSON.parse\` explodindo longe da causa. \`montarUrl\` nunca põe barra final e o
coletor usa \`redirect: "manual"\`.

**O mojibake não nasce na rota JSON.** Medido: o corpo JSON é ASCII puro — o
servidor escapa "Brasília" com escape unicode, nenhum byte acima de 127. Ele
nasce em \`?format=csv\`, que devolve UTF-8 cru (lido como latin-1 vira
\`BrasÃ­lia\`), e no HTML do 301 acima, que se declara \`iso-8859-1\`. Por isso a
trava de U+FFFD fica em \`decodificarCorpo\`, e não no formato de saída.

### 6. Os hashes de \`_links\` não são identidade

O MESMO incentivador (BANCO DO BRASIL SA, \`00000000000191\`) veio com \`self\`
terminando em três hashes diferentes para \`?limit=1\`, \`?limit=2\` e
\`?limit=1&offset=0\`. O hash é função da CONSULTA, não do registro — guardá-lo
como id "funciona" na mesma sessão e apodrece na seguinte. Nenhum \`_links\` é
gravado nos arquivos; a chave estável é \`cgccpf\`.

## Dado pessoal: o que a fonte mascara, e o que ela deixou passar

**Este é o achado mais importante desta rodada, e ele quase passou.**

A fonte mascara CPF no campo de documento: pessoa física chega como
\`cgccpf: "***008317**"\`. Na coleta completa de ${UF}, **${maskProj.toLocaleString("pt-BR")} dos
${projetos.length.toLocaleString("pt-BR")} projetos** e **${maskInc.toLocaleString("pt-BR")} dos ${incentivadores.length.toLocaleString("pt-BR")} incentivadores** vieram
mascarados assim. Fácil concluir que a fonte protege o dado. **Ela não
protege.**

**A fonte não mascara o campo de NOME, e o CPF vai por extenso ali.** Medido
nos dois arquivos: **210 CPFs em \`proponente\` dos projetos e 5 em \`nome\` dos
incentivadores**, no formato \`"<NOME COMPLETO DA PESSOA> <11 dígitos>"\`, e
**todos os 215 são válidos por mod-11** — CPF de gente de verdade, colado ao
nome de quem ele identifica, prestes a entrar num repositório PÚBLICO.

Nenhuma proteção do portal olhava para lá: \`conferirSemCpf\` lê só \`cgccpf\`,
\`normalizarCgccpf\` também. Quem pegou foi \`scripts/checar-dado-pessoal.py\` —
o hook — depois de os arquivos já estarem escritos em disco. É a mesma classe
do vazamento de CPF dentro de ementa oficial que este repositório já teve: **o
dado pessoal não estava no campo de dado pessoal, estava no texto ao lado.**

Mais 5 incentivadores trouxeram \`cgccpf\` de 11 dígitos **sem máscara**, com DV
errado — nenhum guarda de mod-11 do repositório dispararia por eles. "Não passa
no dígito verificador" não é promessa de que o número não identifica ninguém:
pode ser CPF digitado errado no cadastro do MinC, que continua apontando para a
pessoa certa por aproximação.

**O que o portal faz.** \`redigirDocumentosSoltos\` varre **todo campo de texto
de todo registro** — e não uma lista de campos suspeitos, que estaria sempre um
campo atrasada — e troca toda sequência de exatamente 11 dígitos por
\`***REDIGIDO***\`. Nesta coleta: **${Number(proj.meta.documentos_redigidos_pelo_portal ?? 0)} nos projetos e ${Number(inc.meta.documentos_redigidos_pelo_portal ?? 0)} nos
incentivadores**. O nome da pessoa FICA — quem propôs projeto com imposto
renunciado é informação pública; o documento dela não é.

A marca diz **quem apagou**: imitar a máscara do MinC (\`***008317**\`) faria o
portal fingir que a origem fez o que ele mesmo fez. O número fica no cabeçalho
de cada arquivo (\`documentos_redigidos_pelo_portal\`) — se ele crescer, a origem
mudou. E se aparecer CPF válido no próprio \`cgccpf\`, \`conferirSemCpf\` aborta a
coleta e nada é gravado.

CNPJ de 14 dígitos e a máscara de 6 não são tocados: medido, as únicas
sequências de 11 dígitos fora de \`cgccpf\`/\`PRONAC\` nos dois arquivos são os
215 CPFs — os outros números longos do acervo têm 8 dígitos.

> **Se você for coletar outra UF, ou outra fonte do MinC, assuma que isto se
> repete.** Não confie na máscara do campo de documento como prova de que a
> fonte protege dado pessoal — confira o campo de nome.

Consequência prática para a junção: ela só existe para pessoa jurídica, que é
justamente o lado que interessa. Quem doou R$ 100 não é alvo de um portal de
controle de dinheiro público corporativo.

## Como os arquivos estão gravados

\`apps/web/data/rouanet-${uf}-projetos.json\` e
\`rouanet-${uf}-incentivadores.json\`, lidos no **build** (nada disto vai para o
bundle do cliente). Formato compactado por \`lib/estatico/compactar.ts\`:
\`esqueleto\` com os nomes de campo uma vez, \`dicionarios\` com os rótulos
repetidos, e \`linhas\` com um vetor por registro.

**Não indexe \`linhas\` por posição à mão — use \`expandir()\`.** A posição muda
quando uma coluna entra, e o erro seria silencioso.

Medido: 3.532.764 B + 4.363.729 B = **7.896.493 B** com um objeto por linha,
contra **2.441.531 B** compactado — 69,1% a menos, mesmos 27.990 registros.

## As medidas cruas da sonda${medidas ? "" : " (15/08/2026)"}

${
  medidas
    ? medidas.map((m) => `- **${m.o_que}** — ${m.resultado}`).join("\n")
    : `Rode \`npx tsx scripts/coletar-salic-rouanet.mts --sonda\` para remedir. O
catálogo completo, com os números de 15/08/2026, está no cabeçalho de
\`apps/web/lib/cultura/salic.ts\` e é coberto por
\`apps/web/lib/cultura/salic.test.ts\` com fixture gravada.`
}

## A tela: por que ela NÃO foi feita nesta rodada

Esta rodada entregou **o dado e este documento**, de propósito. A tela não
entrou, e o motivo não é falta de tempo:

1. **A trilha incentivador → projeto não existe pela API hoje** (armadilha 3).
   Sem ela, a tela mostraria dois catálogos lado a lado com cara de fluxo de
   dinheiro — e o leitor concluiria sozinho que o \`total_doado\` daquele
   incentivador foi para aqueles projetos. Seria a armadilha 4 servida em HTML.
   Próximo passo: LAI ao MinC perguntando se \`/doacoes\` foi desligado ou mudou
   de rota, e procurar o dump da Rouanet em \`dados.gov.br\`.
2. **A junção com o fornecedor de contrato público** — o motivo de a fonte
   estar aqui — ainda não foi feita: cruzar \`cgccpf\` dos incentivadores contra
   os CNPJ de fornecedor que o eixo Cidades já guarda. **Não depende do item 1**
   e é o que torna a página diferente de mais um catálogo. Esta é a próxima
   tarefa óbvia.

**Quando a tela for feita, o caminho já está decidido:** índice estático fatiado
(\`lib/estatico/fatiar.ts\`) + \`app/[municipio]/components/TabelaEstatica.tsx\`,
como as nove rotas que já usam esse par. **A coleção nunca vai como props de
componente de cliente** — foi assim que \`/ambiental/legislacao\` chegou a
35,5 MiB contra o teto de 25 MiB da Cloudflare, uma inflação de 7,5×. Os dois
arquivos são lidos no **build**, nunca em runtime, e nada deles entra no bundle
do cliente.
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
} else if (CONSOLIDAR) {
  // Sem rede: o checkpoint já traz os totais que a API anunciou, e o NDJSON
  // já está no disco. Serve para reprocessar quando muda a FORMA de gravar.
  consolidar(lerCheckpoint(UF));
} else {
  await coletar();
}
