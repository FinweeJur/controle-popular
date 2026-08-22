/**
 * Gera `apps/web/lib/ambiental/decisoes-cge.ts` — o catálogo das decisões de
 * recurso de LAI da CGE-MG (`acessoainformacao.mg.gov.br/sistema/site/busca_decisao.aspx`),
 * o único corpus de LAI estadual pesquisável (ver `docs/FONTES.md`, seção
 * "Decisões de recurso de LAI da CGE-MG"). MG não publica pedido nem resposta
 * de LAI — só este índice de decisões de segunda instância.
 *
 * ═══ O PROTOCOLO (ASP.NET WebForms) ═══
 *
 * `POST` na mesma URL do `GET`, carregando de volta `__VIEWSTATE` e
 * `__EVENTVALIDATION` do HTML anterior — sem eles o servidor rejeita.
 * Confirmado ao vivo em 2026-08-21: **um único fio de viewstate atravessa o
 * ano inteiro e o ano SEGUINTE sem precisar de novo GET** — só é preciso um
 * GET no começo da execução, nunca um por ano. A paginação usa
 * `__doPostBack('...$rptPaginas$ctlNN$lnkPagina','')`, então cada página
 * também precisa do viewstate da página anterior — encadeado aqui do início
 * ao fim da coleta.
 *
 * ═══ A ARMADILHA DO "ZERO", JÁ DOCUMENTADA EM `docs/FONTES.md` ═══
 *
 * Zero resultado **não** devolve `lblTotal` nenhum — a página troca todo o
 * bloco de resultado pela mensagem `"Nenhum resultado encontrado para a
 * pesquisa."` (`#lblMensagem`). Reconfirmado ao vivo (ano 2020, tipo
 * Provimento): sem `lblTotal`, sem `lblPagina`, zero `<div class="resultado">`.
 * `extraiTotal()` trata isso como **0 legítimo**, não como falha de parsing —
 * é informação (não há Provimento em 2020 e 2022), não é `null`/ausência.
 *
 * ═══ A PAGINAÇÃO, QUE `docs/FONTES.md` MARCAVA COMO "NÃO INVESTIGADO" ═══
 *
 * **`lblPagina` ("Página 1 de N") é um bug do site: N é o TOTAL DE REGISTROS,
 * não o total de páginas.** Confirmado comparando anos diferentes: 2020 tem
 * "Página 1 de 51" E `lblTotal` = 51; a paginação REAL usa 20 itens por
 * página (confirmado contando `<div class="resultado">` por página e batendo
 * a soma com `lblTotal` em 7/7 anos) — 51 registros são 3 páginas reais, não
 * 51. Os links `rptPaginas$ctlNN$lnkPagina` são renderizados um por página
 * real (testado até 11 páginas, o máximo do corpus — 2023 com 204
 * registros); nunca vimos truncamento com reticência, mas o coletor aborta
 * se precisar de mais páginas do que `Math.ceil(total / 20)` prevê, em vez
 * de arriscar um laço sem fim.
 *
 * ═══ DUAS ESTRUTURAS DE PASTA NO LINK DO PDF — E A QUE QUEBRA ═══
 *
 * O link de cada decisão tem uma de duas formas (medido em TODOS os 7 anos):
 *
 *   antiga:  /Downloads\<ANO>\<ORGAO>\<TIPO>\<arquivo>.pdf   (2020, 2021, 2026: 100% dos registros)
 *   nova:    /Downloads\App_Data\Pdfs\<ANO>\<arquivo>.pdf     (2022–2025: parte dos registros)
 *
 * A estrutura ANTIGA embute órgão e tipo de decisão no próprio caminho — dado
 * que este coletor aproveita (`orgaoSigla`, `tipoPasta`) sem precisar de
 * requisição extra. A estrutura NOVA não tem essa informação, e **o link
 * também não funciona**: `App_Data` é pasta reservada do ASP.NET (nunca
 * servida por IIS a cliente nenhum) e todo link com esse segmento devolveu
 * **HTTP 404 em 11/11 amostras testadas** (5 anos, 2022–2025), contra
 * **HTTP 200 em 6/6 amostras** da estrutura antiga (2020, 2021, 2022, 2026) —
 * a última também confere que a mesma migração de fonte que apagou o tipo da
 * pasta às vezes aparece MISTURADA num único ano (2022–2025 têm as duas
 * estruturas convivendo). `linkProvavelmenteQuebrado` marca isso por
 * PADRÃO da URL (não por HEAD request em cada um dos ~750 links, que
 * dobraria o custo da coleta) — é inferência, não prova por registro, e está
 * declarado como tal aqui.
 *
 * ═══ A DIVERGÊNCIA DA SOMA POR TIPO — NÃO RESOLVIDA, E NÃO SE ENGANE COM O ACHADO ACIMA ═══
 *
 * `docs/FONTES.md` já registrava: em 2022–2025 a soma dos 6 tipos filtrados
 * (`ddlTipoDecisao`) fica em ~50% do total do ano; em 2020, 2021 e 2026 fecha
 * exatamente. Este coletor **não resolve isso** — e a pasta acima, apesar de
 * parecer a explicação óbvia, **não é**: comparado ao vivo em 2023, a pasta
 * classifica 4 arquivos como "Perda de objeto parcial" enquanto o filtro
 * `ddlTipoDecisao` (o campo "oficial", usado na tabela de `docs/FONTES.md`)
 * dá **0** para "Perda parcial de objeto" no mesmo ano — os dois sinais
 * discordam entre si, não só do total. A pasta é evidência de que a
 * classificação por tipo mudou de regime por volta de 2022 (arquivamento
 * manual por pasta → SEI, sem due reclassificação), mas não é o campo que o
 * dropdown filtra, e não fecha a conta sozinha.
 *
 * **Por isso `porTipo` aqui vem SEMPRE do filtro `ddlTipoDecisao` (o mesmo
 * método de `docs/FONTES.md`), nunca da pasta** — e `tipoPasta` por registro
 * fica como campo separado, cru, não normalizado aos 6 rótulos do dropdown.
 * `COBERTURA_DECISOES_CGE.anosComLacuna` continua vazando ~metade dos
 * registros de 2022–2025 sem tipo oficial atribuído. **Ninguém deve publicar
 * "total de decisões por tipo" para esses quatro anos sem resolver esta
 * lacuna antes** — o que ela é (campo não preenchido? tipo fora do dropdown?
 * os dois?) segue **não investigado** depois desta coleta.
 *
 * ═══ USO ═══
 *
 *   npx tsx scripts/coletar-decisoes-cge-mg.mts            # baixa (ou usa cache por ano) e grava
 *   npx tsx scripts/coletar-decisoes-cge-mg.mts --seco     # mede, não grava o TS final
 *   npx tsx scripts/coletar-decisoes-cge-mg.mts --forcar   # ignora o cache por ano e refaz tudo
 *
 * Idempotente: cada ano vira um arquivo em `.cache/decisoes-cge-mg/<ano>.json`
 * assim que termina; reexecutar pula ano já coletado (retomável — uma queda
 * no meio do ano 5 não perde os 4 anteriores).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = resolve(RAIZ, ".cache/decisoes-cge-mg");
const DESTINO = resolve(RAIZ, "apps/web/lib/ambiental/decisoes-cge.ts");

const SO_MEDIR = process.argv.includes("--seco");
const FORCAR = process.argv.includes("--forcar");

const HOJE = new Date().toISOString().slice(0, 10);

const BASE = "https://www.acessoainformacao.mg.gov.br/sistema/site/busca_decisao.aspx";
/** Raiz para montar o link do PDF: o `href` da fonte é relativo à RAIZ DO SITE
 *  IIS (`/Downloads\...`), não à raiz da aplicação — sem `/sistema` o link
 *  cai num 404 direto mesmo para a estrutura "antiga" que funciona (medido). */
const ORIGEM_PDF = "https://www.acessoainformacao.mg.gov.br/sistema";
const PREFIXO = "ctl00$ctl00$ConteudoGeral$ConteudoPrincipalSemAjax$";

/** UA honesto e identificável — mesma convenção de `coletar-convenios-ambientais-mg.mts`. */
const AGENTE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ControlePopular/1.0 (+https://controlepopular.com.br)";

const ANOS = [2020, 2021, 2022, 2023, 2024, 2025, 2026] as const;

/** Os 6 tipos do dropdown `ddlTipoDecisao`, na ordem e com o rótulo exatos
 *  extraídos ao vivo do HTML em 2026-08-21 — nunca digitados à mão. */
const TIPOS = [
  { id: "1", chave: "desprovimento", rotulo: "Desprovimento" },
  { id: "2", chave: "naoConhecimento", rotulo: "Não conhecimento" },
  { id: "3", chave: "perdaDeObjeto", rotulo: "Perda de objeto" },
  { id: "4", chave: "perdaParcialDeObjeto", rotulo: "Perda parcial de objeto" },
  { id: "5", chave: "provimento", rotulo: "Provimento" },
  { id: "6", chave: "provimentoParcial", rotulo: "Provimento parcial" },
] as const;

const abortar = (msg: string): never => {
  console.error(`[decisoes-cge] ABORT: ${msg}`);
  process.exit(1);
};

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Sessão HTTP com cookie manual (fetch nativo do Node não tem cookie jar).

let cookie = "";

async function requisitar(body?: string): Promise<string> {
  const r = await fetch(BASE, {
    method: body ? "POST" : "GET",
    headers: {
      "User-Agent": AGENTE,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      Referer: BASE,
    },
    body,
  });
  if (!r.ok) abortar(`HTTP ${r.status} em ${body ? "POST" : "GET"} — a fonte pode ter mudado`);
  const setCookie = r.headers.get("set-cookie");
  if (setCookie && !cookie) {
    cookie = setCookie
      .split(/,(?=[^;]+?=)/)
      .map((c) => c.split(";")[0])
      .join("; ");
  }
  await pausa(1200); // 1–2s por host, regra geral de `docs/FONTES.md`
  return r.text();
}

function campo(html: string, id: string): string {
  const re = new RegExp(`${id}" id="${id}" value="([^"]*)"`);
  return html.match(re)?.[1] ?? "";
}

interface Sessao {
  vs: string;
  vg: string;
  ev: string;
}

function montaBody(s: Sessao, ano: number, tipo: string, eventTarget: string): string {
  const p = new URLSearchParams();
  p.set("__EVENTTARGET", eventTarget);
  p.set("__EVENTARGUMENT", "");
  p.set("__VIEWSTATE", s.vs);
  p.set("__VIEWSTATEGENERATOR", s.vg);
  p.set("__EVENTVALIDATION", s.ev);
  p.set(`${PREFIXO}txtQuery`, "");
  p.set(`${PREFIXO}txtQuery2`, "");
  p.set(`${PREFIXO}txtQuery3`, "");
  p.set(`${PREFIXO}ddlYear`, String(ano));
  p.set(`${PREFIXO}ddlOrgao`, "");
  p.set(`${PREFIXO}ddlTipoDecisao`, tipo);
  if (!eventTarget) p.set(`${PREFIXO}btnSearch`, "Pesquisar");
  return p.toString();
}

function extraiSessao(html: string): Sessao {
  return {
    vs: campo(html, "__VIEWSTATE"),
    vg: campo(html, "__VIEWSTATEGENERATOR"),
    ev: campo(html, "__EVENTVALIDATION"),
  };
}

/** Zero é resultado LEGÍTIMO aqui — ver a armadilha do topo. Só lança quando
 *  a resposta não bate com NENHUM dos dois formatos conhecidos, o que
 *  significa que a fonte mudou de formato e precisa de olho humano. */
function extraiTotal(html: string): number {
  const m = /Total de resultados:\s*(\d+)/.exec(html);
  if (m) return Number(m[1]);
  if (/Nenhum resultado encontrado/i.test(html)) return 0;
  throw new Error("nem lblTotal nem a mensagem de zero resultados — formato da página mudou?");
}

function extraiItensBrutos(html: string): { arquivo: string; href: string }[] {
  const re = /<div class="resultado">([\s\S]*?)<\/div>/g;
  const saida: { arquivo: string; href: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const bloco = m[1];
    const arquivo = /<strong>([^<]*)<\/strong>/.exec(bloco)?.[1]?.trim() ?? "";
    const href = /href="([^"]*)"/.exec(bloco)?.[1] ?? "";
    if (arquivo && href) saida.push({ arquivo, href });
  }
  return saida;
}

interface DecisaoRecursoCgeMg {
  ano: number;
  arquivo: string;
  url: string;
  /** Inferido do padrão da URL (segmento `App_Data`), não verificado por
   *  requisição HTTP em cada registro — ver a armadilha no topo do arquivo. */
  linkProvavelmenteQuebrado: boolean;
  /** Só preenchido na estrutura de pasta "antiga" (2020, 2021, 2026 e parte
   *  de 2022–2025). `null` não significa "sem órgão" — significa "a fonte
   *  não guardou essa informação no link para este registro". */
  orgaoSigla: string | null;
  /** Rótulo CRU da pasta, como a fonte escreveu — não normalizado aos 6
   *  rótulos do dropdown `ddlTipoDecisao` (ver a divergência documentada
   *  no topo: os dois vocabulários não batem 1:1). */
  tipoPasta: string | null;
  /** Número do processo SEI, extraído do nome do arquivo quando ele começa
   *  com `SEI_<numero>_` (padrão da estrutura de pasta "nova"). */
  seiId: string | null;
}

function processaItem(bruto: { arquivo: string; href: string }, ano: number): DecisaoRecursoCgeMg {
  const partes = bruto.href.split(String.fromCharCode(92)); // separador é `\`, não `/`
  const estruturaAntiga = partes.length === 5 && partes[1] !== "App_Data";
  const seiMatch = /^SEI_(\d+)_/.exec(bruto.arquivo);
  return {
    ano,
    arquivo: bruto.arquivo,
    url: `${ORIGEM_PDF}${encodeURI(bruto.href.replace(/\\/g, "/"))}`,
    linkProvavelmenteQuebrado: bruto.href.includes("App_Data"),
    orgaoSigla: estruturaAntiga ? partes[2] : null,
    tipoPasta: estruturaAntiga ? partes[3] : null,
    seiId: seiMatch ? seiMatch[1] : null,
  };
}

interface AnoColetado {
  ano: number;
  total: number;
  itens: DecisaoRecursoCgeMg[];
  porTipo: Record<(typeof TIPOS)[number]["chave"], number>;
}

async function coletarAno(ano: number, sessaoInicial: Sessao): Promise<{ dados: AnoColetado; sessao: Sessao }> {
  let sessao = sessaoInicial;

  // 1) Busca sem filtro de tipo, paginando até acabar.
  let html = await requisitar(montaBody(sessao, ano, "", ""));
  const total = extraiTotal(html);
  if (total === 0) abortar(`ano ${ano} sem filtro voltou 0 — não deveria (o corpus tem ${ano} conhecido > 0)`);

  const totalPaginas = Math.max(1, Math.ceil(total / 20));
  const itens: DecisaoRecursoCgeMg[] = [];
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    itens.push(...extraiItensBrutos(html).map((b) => processaItem(b, ano)));
    if (pagina === totalPaginas) break;
    sessao = extraiSessao(html);
    // `pagina` é a página atual (1-based) que acabamos de processar; o link
    // da PRÓXIMA página é `rptPaginas$ctlNN` com NN = índice 0-based dela,
    // que é numericamente igual a `pagina` (página 1 → ctl01 = índice da
    // página 2). Testado ao vivo: `pagina - 1` aqui apontava para a MESMA
    // página (ctl00 = página 1 de novo), duplicando itens em vez de avançar.
    const ctl = `ctl${String(pagina).padStart(2, "0")}`;
    const alvo = `${PREFIXO}rptPaginas$${ctl}$lnkPagina`;
    html = await requisitar(montaBody(sessao, ano, "", alvo));
  }
  if (itens.length !== total) {
    abortar(
      `ano ${ano}: paginação coletou ${itens.length} itens, lblTotal dizia ${total} — página perdida ou duplicada`,
    );
  }
  sessao = extraiSessao(html);

  // 2) Total por tipo (filtro ddlTipoDecisao), encadeando a mesma sessão.
  const porTipo: Partial<Record<(typeof TIPOS)[number]["chave"], number>> = {};
  for (const t of TIPOS) {
    const r = await requisitar(montaBody(sessao, ano, t.id, ""));
    porTipo[t.chave] = extraiTotal(r); // 0 é resposta válida — ver armadilha do topo
    sessao = extraiSessao(r);
  }
  const somaTipos = Object.values(porTipo).reduce((a, b) => a + (b ?? 0), 0);
  if (somaTipos > total) {
    abortar(`ano ${ano}: soma por tipo (${somaTipos}) maior que o total (${total}) — impossível, aborta`);
  }

  return {
    dados: { ano, total, itens, porTipo: porTipo as AnoColetado["porTipo"] },
    sessao,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

mkdirSync(CACHE, { recursive: true });

function caminhoCache(ano: number): string {
  return resolve(CACHE, `${ano}.json`);
}

async function main() {
  const resultados: AnoColetado[] = [];
  let sessao: Sessao | null = null;

  for (const ano of ANOS) {
    const cachePath = caminhoCache(ano);
    if (!FORCAR && existsSync(cachePath)) {
      console.log(`[decisoes-cge] cache: ${ano}`);
      resultados.push(JSON.parse(readFileSync(cachePath, "utf8")));
      continue;
    }
    if (!sessao) {
      const html = await requisitar(); // GET inicial — só uma vez por execução
      sessao = extraiSessao(html);
    }
    console.log(`[decisoes-cge] coletando ${ano}...`);
    const { dados, sessao: novaSessao } = await coletarAno(ano, sessao);
    sessao = novaSessao;
    writeFileSync(cachePath, JSON.stringify(dados), "utf8");
    const semTipo = dados.total - Object.values(dados.porTipo).reduce((a, b) => a + b, 0);
    console.log(
      `[decisoes-cge] ${ano}: total=${dados.total} coletados=${dados.itens.length} ` +
        `semTipoOficial=${semTipo} (${((semTipo / dados.total) * 100).toFixed(1)}%)`,
    );
    resultados.push(dados);
  }

  const totalGeral = resultados.reduce((t, r) => t + r.total, 0);
  // Sanidade: em 2026-08-21 o corpus media 753. O site é vivo (cresce), então
  // só aborta se ficar MUITO abaixo do medido — encolher é sinal de coleta
  // quebrada, crescer é o normal (mais decisões publicadas desde então).
  if (totalGeral < 700) {
    abortar(`total geral ${totalGeral} muito abaixo do esperado (~753 em 2026-08-21) — coleta quebrada?`);
  }
  const todosOsItens = resultados.flatMap((r) => r.itens);
  if (todosOsItens.length !== totalGeral) {
    abortar(`total geral ${totalGeral} != soma dos itens coletados ${todosOsItens.length}`);
  }

  console.log(`[decisoes-cge] total geral: ${totalGeral} decisões, ${ANOS.length} anos`);

  if (SO_MEDIR) {
    console.log("[decisoes-cge] --seco: medição concluída, nada gravado");
    return;
  }

  const anosQueFecham: number[] = [];
  const anosComLacuna: number[] = [];
  for (const r of resultados) {
    const soma = Object.values(r.porTipo).reduce((a, b) => a + b, 0);
    (soma === r.total ? anosQueFecham : anosComLacuna).push(r.ano);
  }

  const registrosComOrgaoETipo = todosOsItens.filter((i) => i.orgaoSigla !== null).length;
  const registrosComLinkQuebrado = todosOsItens.filter((i) => i.linkProvavelmenteQuebrado).length;
  const totalComTipoOficial = resultados.reduce(
    (t, r) => t + Object.values(r.porTipo).reduce((a, b) => a + b, 0),
    0,
  );
  const totalSemTipoOficial = totalGeral - totalComTipoOficial;
  const pct = (a: number, b: number) => Number(((a / b) * 100).toFixed(1));

  const s = (v: unknown) => JSON.stringify(v, null, 2);

  const porTipoAnoTs = resultados
    .map((r) => {
      const somaTipos = Object.values(r.porTipo).reduce((a, b) => a + b, 0);
      return `  {
    ano: ${r.ano},
    total: ${r.total},
    porTipo: ${s(r.porTipo)},
    somaTipos: ${somaTipos},
    semTipo: ${r.total - somaTipos},
    percentualSemTipo: ${pct(r.total - somaTipos, r.total)},
  }`;
    })
    .join(",\n");

  const conteudo = `/**
 * Decisões de recurso de LAI da CGE-MG. ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por \`scripts/coletar-decisoes-cge-mg.mts\` a partir de
 * \`acessoainformacao.mg.gov.br/sistema/site/busca_decisao.aspx\`. O cabeçalho
 * daquele script documenta o protocolo ASP.NET WebForms e as armadilhas
 * medidas — inclusive a que mais importa aqui:
 *
 * ═══ A SOMA POR TIPO NÃO FECHA EM 2022–2025, E ISTO NÃO FOI RESOLVIDO ═══
 *
 * \`porTipo\` de cada ano vem do filtro oficial \`ddlTipoDecisao\` (mesmo campo
 * que \`docs/FONTES.md\` já documentava). Em ${anosQueFecham.join(", ")} a soma
 * dos 6 tipos bate com o total do ano; em ${anosComLacuna.join(", ")} não bate —
 * até ~50% dos registros não têm tipo atribuído nesse filtro. O coletor
 * investigou uma hipótese nova (a pasta do link do PDF, que em parte dos
 * registros de 2022–2025 ainda guarda um rótulo de tipo) e a hipótese **não
 * fechou a conta**: o rótulo da pasta e o total do \`ddlTipoDecisao\` discordam
 * entre si no mesmo ano (medido em 2023: pasta encontra 4 arquivos "Perda de
 * objeto parcial", o filtro oficial dá 0 para "Perda parcial de objeto").
 * **Não publique "total de decisões por tipo" para ${anosComLacuna.join(", ")}
 * sem resolver esta lacuna antes.** O que ela é — campo não preenchido no
 * sistema de origem, tipo fora do dropdown, os dois — segue não investigado.
 */

export interface DecisaoRecursoCgeMg {
  ano: number;
  arquivo: string;
  url: string;
  /** Inferido do padrão da URL (\`App_Data\`, pasta reservada do ASP.NET que
   *  nunca é servida) — medido 404 em 11/11 amostras, 200 em 6/6 do outro
   *  padrão, não verificado registro a registro. */
  linkProvavelmenteQuebrado: boolean;
  /** Só quando a fonte guardou o órgão no caminho do PDF (estrutura antiga). */
  orgaoSigla: string | null;
  /** Rótulo CRU da pasta — não normalizado aos 6 rótulos do dropdown oficial. */
  tipoPasta: string | null;
  /** Número do processo SEI, quando o nome do arquivo o carrega. */
  seiId: string | null;
}

export const DECISOES_CGE_MG: DecisaoRecursoCgeMg[] = ${s(todosOsItens)};

export interface DecisoesPorTipoAno {
  ano: number;
  /** \`Total de resultados\` do ano, sem filtro de tipo. */
  total: number;
  /** Contagem por tipo, do filtro oficial \`ddlTipoDecisao\` — não da pasta. */
  porTipo: Record<
    "desprovimento" | "naoConhecimento" | "perdaDeObjeto" | "perdaParcialDeObjeto" | "provimento" | "provimentoParcial",
    number
  >;
  somaTipos: number;
  /** \`total - somaTipos\`. Ver a lacuna documentada no topo do arquivo. */
  semTipo: number;
  percentualSemTipo: number;
}

export const DECISOES_CGE_POR_TIPO_ANO: DecisoesPorTipoAno[] = [
${porTipoAnoTs}
];

/** Importe ISTO em página de servidor, nunca o array inteiro (regra de payload). */
export const COBERTURA_DECISOES_CGE = {
  medidoEm: "${HOJE}",
  totalGeral: ${totalGeral},
  anoInicial: ${ANOS[0]},
  anoFinal: ${ANOS[ANOS.length - 1]},
  /** Soma de \`porTipo\` pelo filtro oficial, nos 7 anos — sempre menor que
   *  \`totalGeral\` por causa da lacuna de 2022–2025 (ver docstring acima). */
  totalComTipoOficial: ${totalComTipoOficial},
  totalSemTipoOficial: ${totalSemTipoOficial},
  percentualSemTipoOficial: ${pct(totalSemTipoOficial, totalGeral)},
  /** Anos em que \`porTipo\` soma exatamente o total do ano. */
  anosQueFecham: ${s(anosQueFecham)} as const,
  /** Anos em que soma menos que o total — a lacuna NÃO resolvida. */
  anosComLacuna: ${s(anosComLacuna)} as const,
  /** Registros cujo link do PDF ainda guarda órgão+tipo na própria pasta
   *  (estrutura "antiga" — ver docstring do coletor). */
  registrosComOrgaoETipoNaPasta: ${registrosComOrgaoETipo},
  /** Registros cujo link provavelmente devolve 404 (padrão \`App_Data\`). */
  registrosComLinkProvavelmenteQuebrado: ${registrosComLinkQuebrado},
} as const;
`;

  writeFileSync(DESTINO, conteudo, "utf8");
  const relido = readFileSync(DESTINO, "utf8");
  if (relido !== conteudo) abortar("gravado e relido não batem");
  if (relido.includes("�")) abortar("mojibake no arquivo gravado");
  console.log(
    `[decisoes-cge] gravado: ${DESTINO} (${(Buffer.byteLength(conteudo, "utf8") / 1024).toFixed(1)} KiB)`,
  );
}

await main();
