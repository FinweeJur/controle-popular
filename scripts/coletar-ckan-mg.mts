/**
 * Coletor único e PARAMETRIZADO para os conjuntos do CKAN `dados.mg.gov.br`
 * aprovados pela sondagem de 21/08/2026 — fora dos quatro órgãos ambientais
 * (`coletar-convenios-ambientais-mg.mts`) e do GTAC (`coletar-tac-gtac-mg.mts`),
 * já cobertos por outros coletores.
 *
 * Seis conjuntos, um `async function coletarX()` cada, despachados por
 * `--conjunto=<nome>` (roda todos, em ordem, se a flag faltar):
 *
 *   mariana           Acordo Judicial de Reparação do Vale do Rio Doce (`portal_mariana`)
 *   sancionadas       Empresas Sancionadas pela Lei Anticorrupção (`empresas_sancionadas`)
 *   ipsemg            Contratos Vigentes do IPSEMG (`contratos_vigentes`)
 *   fiscais-contrato  Fiscais de Contratos do Estado, 2022–2026 (`fiscais_contrato`)
 *   obras             Obras Públicas do DER-MG (`portal_obras`)
 *   siafi             Execução orçamentária SIAFI 2026 (`dados-armazem-siafi-2026`)
 *
 * ═══ POR QUE UM SCRIPT SÓ, E NÃO SEIS ═══
 *
 * As armadilhas de transporte são as MESMAS nos seis (403 sem UA de navegador,
 * CKAN por `resource/<id>/download/<arquivo>`, checkpoint por `--cache`). O que
 * muda é só a forma de cada CSV — por isso as funções de transporte
 * (`baixar`, `lerCsv`) e de dado pessoal (`resolverDocumento*`) são
 * compartilhadas, e cada `coletarX` só faz o que é específico dela.
 *
 * ═══ TRÊS ARMADILHAS QUE ATRAVESSAM MAIS DE UM CONJUNTO (medidas em 21/08/2026) ═══
 *
 * 1. **CNPJ vira número na exportação, e a planilha derruba zero à esquerda.**
 *    Medido em `contratos_vigentes` (1.775 CNPJ com 11–14 dígitos em vez de 14)
 *    e `portal_obras.contratos` (78 com 13 dígitos, 23 com 12). `resolverDocumento`
 *    corrige com `padStart(14, "0")` e só aceita se o resultado passar no
 *    dígito verificador — nunca confia na contagem de dígitos sozinha.
 *
 * 2. **O mesmo campo mistura CNPJ com CPF de pessoa física — às vezes mais de
 *    um por linha, separados por vírgula.** `portal_mariana.empenho` (37 CPF
 *    reais em 532 linhas, alguns com barra em vez de traço:
 *    `000.000.000/00`, formato — nunca o valor real) e `fiscais_contrato` (662 CPF reais nos cinco anos,
 *    inclusive 2022–2025 — a sondagem só tinha amostrado 2026). Todo valor de
 *    11 dígitos que passa no mod-11 de CPF é redigido; nunca sai para o
 *    arquivo gerado. Achado que a sondagem NÃO tinha: o mesmo padrão aparece
 *    em `portal_obras.fiscais.conselho` — campo pensado para registro
 *    profissional (CREA), mas 37 das 5.336 linhas trazem CPF real de pessoa
 *    física ali dentro (algumas com o prefixo literal `CPF-`). Redigido do
 *    mesmo jeito.
 *
 * 3. **Números decimais não seguem um padrão fixo, nem dentro do mesmo
 *    arquivo.** `fiscais_contrato` 2022 grava `valor_inicial` com PONTO
 *    (`588852.66`) e `valor_atual` com VÍRGULA (`438441,7`) nas MESMAS linhas;
 *    2023–2026 usam vírgula nos dois. `numeroBr` decide pelo conteúdo (vírgula
 *    presente = decimal brasileiro, ponto é milhar) e funciona nos dois casos
 *    sem precisar saber o ano.
 *
 * Uso:
 *   npx tsx scripts/coletar-ckan-mg.mts                       # todos, baixa e grava
 *   npx tsx scripts/coletar-ckan-mg.mts --conjunto=mariana     # só um
 *   npx tsx scripts/coletar-ckan-mg.mts --seco                # mede, não grava
 *   npx tsx scripts/coletar-ckan-mg.mts --cache                # reusa o download
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIB = resolve(RAIZ, "apps/web/lib/ambiental");

const SO_MEDIR = process.argv.includes("--seco");
const USAR_CACHE = process.argv.includes("--cache");
const ARG_CONJUNTO = process.argv.find((a) => a.startsWith("--conjunto="));
const CONJUNTO_PEDIDO = ARG_CONJUNTO ? ARG_CONJUNTO.slice("--conjunto=".length) : null;

/** UA honesto e identificável — sem isto o portal devolve 403 (medido em
 *  21/08/2026, os seis conjuntos). Ver `coletar-convenios-ambientais-mg.mts`. */
const AGENTE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ControlePopular/1.0 (+https://controlepopular.com.br)";

const abortar = (msg: string): never => {
  console.error(`[ckan-mg] ABORT: ${msg}`);
  process.exit(1);
};

const pausa = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ─────────────────────────────────────────────────────────────────────────
// Transporte: baixar (com cache) + gravar (com conferência de relido)
// ─────────────────────────────────────────────────────────────────────────

/** Baixa um recurso do CKAN. `gzip: true` descompacta antes de devolver texto. */
async function baixar(
  nomeCache: string,
  url: string,
  cachePasta: string,
  gzip = false,
): Promise<string> {
  mkdirSync(cachePasta, { recursive: true });
  const destino = resolve(cachePasta, `${nomeCache}${gzip ? ".csv.gz" : ".csv"}`);
  if (USAR_CACHE && existsSync(destino)) {
    console.log(`[ckan-mg] cache: ${nomeCache}`);
    const buf = readFileSync(destino);
    return gzip ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
  }
  const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
  // Validar o CONTEÚDO, não o status: o portal já devolveu 200 com arquivo só
  // de cabeçalho noutro conjunto deste mesmo CKAN (ver convenios-mg).
  if (!r.ok) abortar(`${nomeCache}: HTTP ${r.status} — sem UA de navegador o portal devolve 403`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(destino, buf);
  console.log(`[ckan-mg] baixado: ${nomeCache} (${(buf.length / 1024).toFixed(0)} KiB)`);
  await pausa(1500);
  return gzip ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
}

/** Trava de dado pessoal, ANTES de qualquer gravação — mesmo espírito do
 *  \`checar-dado-pessoal-em-dado.py\` que roda no pre-push, mas aqui roda
 *  primeiro e barra o arquivo de nascer. Varre o texto INTEIRO (não só campos
 *  chamados "cpf" ou "documento"): o achado em \`contratos_vigentes.nome\`
 *  (ver \`redigirTextoLivre\`) prova que CPF pode estar em qualquer campo de
 *  texto livre, não só no campo com nome óbvio.
 *
 *  Só o formato PONTUADO (\`000.000.000-00\`) — não o de 11 dígitos corridos.
 *  Um total agregado grande (ex. \`vlrLiquidadoTotal\` do SIAFI) é um número de
 *  11+ dígitos sem aspas no JSON gerado, e bate por acaso no mod-11 de CPF de
 *  vez em quando (medido em 21/08/2026, gerando \`ckan-mg-siafi.ts\`) — falso
 *  positivo que travaria a gravação de um agregado sem NENHUM campo de texto
 *  livre. O formato pontuado nunca aparece em número serializado pelo
 *  \`JSON.stringify\` (que nunca agrupa dígitos por ponto), então continua
 *  seguro como rede de segurança para os conjuntos com texto livre. */
function conferirSemCpf(destino: string, conteudo: string) {
  for (const m of conteudo.matchAll(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g)) {
    if (cpfValido(m[0].replace(/\D/g, ""))) {
      abortar(
        `CPF real sobreviveu à redação em ${destino}: ${m[0].slice(0, 4)}… (mod-11 válido). ` +
          `Campo de texto livre carregando CPF que \`redigirTextoLivre\`/\`classificarDocumento\` não cobriram — corrigir a origem, nunca ignorar.`,
      );
    }
  }
}

function escrever(destino: string, conteudo: string) {
  conferirSemCpf(destino, conteudo);
  writeFileSync(destino, conteudo, "utf8");
  const relido = readFileSync(destino, "utf8");
  if (relido !== conteudo) abortar(`gravado e relido não batem: ${destino}`);
  if (relido.includes("�")) abortar(`mojibake no arquivo gravado: ${destino}`);
  console.log(
    `[ckan-mg] gravado: ${destino} (${(Buffer.byteLength(conteudo, "utf8") / 1024).toFixed(1)} KiB)`,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CSV: separador parametrizável (`;` nos conjuntos de negócio, `,` no SIAFI),
// respeita aspas — `objeto` e `conduta` têm o próprio separador dentro do
// texto, e um split ingênuo desalinha a linha inteira sem lançar erro.
// ─────────────────────────────────────────────────────────────────────────
function lerCsv(texto: string, separador = ";"): { cab: string[]; linhas: string[][] } {
  const limpo = texto.replace(/^﻿/, "");
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let dentroDeAspas = false;
  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i];
    if (dentroDeAspas) {
      if (c === '"') {
        if (limpo[i + 1] === '"') {
          campo += '"';
          i++;
        } else dentroDeAspas = false;
      } else campo += c;
      continue;
    }
    if (c === '"') dentroDeAspas = true;
    else if (c === separador) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n") {
      linha.push(campo.replace(/\r$/, ""));
      linhas.push(linha);
      linha = [];
      campo = "";
    } else campo += c;
  }
  if (campo || linha.length) {
    linha.push(campo.replace(/\r$/, ""));
    linhas.push(linha);
  }
  const [cab, ...resto] = linhas;
  if (!cab) abortar("CSV sem cabeçalho");
  return { cab, linhas: resto.filter((l) => l.length > 1) };
}

function indexar(cab: string[]) {
  return Object.fromEntries(cab.map((c, i) => [c, i])) as Record<string, number>;
}

/** `AAAA-MM-DD…` (com ou sem hora) → só a data, ou null. */
function dataIso(s: string | undefined): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec((s ?? "").trim());
  return m ? m[1] : null;
}

/** `588852.66` (ponto) e `438441,7` (vírgula) aparecem nas MESMAS linhas de
 *  `fiscais_contrato` 2022 — decide pelo conteúdo: vírgula presente = decimal
 *  brasileiro (ponto vira separador de milhar); sem vírgula = já é decimal de
 *  ponto. Funciona nos dois formatos sem precisar saber a origem. */
function numeroBr(s: string | undefined): number {
  const t = (s ?? "").trim();
  if (!t) return 0;
  const n = t.includes(",") ? Number(t.replace(/\./g, "").replace(",", ".")) : Number(t);
  return Number.isFinite(n) ? n : 0;
}

// ─────────────────────────────────────────────────────────────────────────
// Dado pessoal: CPF sai, CNPJ fica — validado por dígito verificador, nunca
// só pela contagem de dígitos. Ver as armadilhas 1 e 2 no topo do arquivo.
// ─────────────────────────────────────────────────────────────────────────

function cpfValido(d: string): boolean {
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

function cnpjValido(d: string): boolean {
  if (!/^\d{14}$/.test(d) || /^(\d)\1{13}$/.test(d)) return false;
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv = (base: string, pesos: number[]) => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += Number(base[i]) * pesos[i];
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const dv1 = dv(d.slice(0, 12), pesos1);
  const dv2 = dv(d.slice(0, 12) + dv1, pesos2);
  return Number(d[12]) === dv1 && Number(d[13]) === dv2;
}

type Documento =
  | { tipo: "cnpj"; valor: string }
  | { tipo: "cpf_redigido" }
  | { tipo: "invalido" }
  | { tipo: "vazio" };

function classificarDocumento(digitos: string): Documento {
  if (!digitos) return { tipo: "vazio" };
  if (digitos.length <= 14) {
    const cnpj = digitos.padStart(14, "0");
    if (cnpjValido(cnpj)) return { tipo: "cnpj", valor: cnpj };
  }
  if (digitos.length === 11 && cpfValido(digitos)) return { tipo: "cpf_redigido" };
  return { tipo: "invalido" };
}

/** Campo em que a fonte grava CNPJ como NÚMERO — a vírgula (quando aparece) é
 *  o artefato decimal da exportação (`…,0`), nunca lista. Ver `contratos_vigentes`
 *  e `portal_obras.contratos` no topo do arquivo (armadilha 1). */
function documentoNumerico(bruto: string | undefined): Documento {
  const digitos = (bruto ?? "").split(",")[0].replace(/\D/g, "");
  return classificarDocumento(digitos);
}

/** Campo em que a fonte pode gravar MAIS DE UM documento, já pontuado e
 *  separado por vírgula (formato medido: `000.000.000-00,000.000.000-00` —
 *  nunca os valores reais aqui). Ver
 *  `portal_mariana.empenho` e `fiscais_contrato.cnpj_cpf` (armadilha 2). */
function documentosEmLista(bruto: string | undefined): Documento[] {
  return (bruto ?? "")
    .split(",")
    .map((p) => p.replace(/\D/g, ""))
    .filter(Boolean)
    .map(classificarDocumento);
}

/** Redige CPF de pessoa física que apareça DENTRO de um campo de texto livre
 *  (nome, credor, empresa) — achado em 21/08/2026 no \`nome\` de
 *  \`contratos_vigentes\`: prestador pessoa física grava o próprio CPF colado
 *  ao nome (formato medido: \`"<NOME> - 000.000.000-00"\` e
 *  \`"<NOME> CPF-00000000000"\` — nunca o valor real aqui, ver a nota em
 *  \`sem-cpf-no-repo.test.ts\` sobre exemplo-que-vira-vazamento) mesmo tendo
 *  CNPJ próprio no campo certo. É o mesmo padrão que a auditoria de 12/08 achou em código-fonte
 *  (\`docs/FONTES.md\`: "CPF real já vazou em ementa oficial e em campo de
 *  nome") — aqui é dado, não código, mas o risco é igual: o campo de documento
 *  pode estar limpo e o CPF vazar mesmo assim por um campo de texto vizinho.
 *  Só troca o que passa no mod-11; não mexe em CNPJ nem em número comum. */
const RE_CPF_EM_TEXTO = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/g;
function redigirTextoLivre(texto: string): { texto: string; redigidos: number } {
  let redigidos = 0;
  const limpo = texto.replace(RE_CPF_EM_TEXTO, (m) => {
    if (cpfValido(m.replace(/\D/g, ""))) {
      redigidos++;
      return "[CPF removido]";
    }
    return m;
  });
  return { texto: limpo, redigidos };
}

/** Primeiro CNPJ válido de uma lista (o caso comum é 1 só) + contagem de CPF
 *  redigidos nela — usado quando o produto final só precisa de "quem é o
 *  fornecedor principal", não da lista inteira. */
function primeiroDocumento(docs: Documento[]): { cnpj: string | null; cpfRedigidos: number } {
  const cnpj = docs.find((d): d is { tipo: "cnpj"; valor: string } => d.tipo === "cnpj");
  return { cnpj: cnpj?.valor ?? null, cpfRedigidos: docs.filter((d) => d.tipo === "cpf_redigido").length };
}

const pct = (a: number, b: number) => (b > 0 ? Number(((a / b) * 100).toFixed(1)) : 0);
const s = (t: unknown) => JSON.stringify(t);

// ─────────────────────────────────────────────────────────────────────────
// Dispatch
// ─────────────────────────────────────────────────────────────────────────

const CONJUNTOS: Record<string, () => Promise<void>> = {};

async function main() {
  const alvo = CONJUNTO_PEDIDO ? [CONJUNTO_PEDIDO] : Object.keys(CONJUNTOS);
  for (const nome of alvo) {
    const fn = CONJUNTOS[nome];
    if (!fn) abortar(`conjunto desconhecido: "${nome}". Válidos: ${Object.keys(CONJUNTOS).join(", ")}`);
    console.log(`\n[ckan-mg] ═══ ${nome} ═══`);
    await fn();
  }
}

// As seis funções coletarX() e o registro em CONJUNTOS ficam ABAIXO — cada
// `// ═══ CONJUNTO: <nome> ═══` marca uma seção independente. `main()` só
// referencia CONJUNTOS depois de todas as seções rodarem (module top-level
// await), então a ordem de declaração não importa para o dispatch.

// ═══ CONJUNTO: mariana — Acordo Judicial de Reparação do Vale do Rio Doce ═══
//
// `portal_mariana` no CKAN (o nome do dataset é herdado do rompimento da
// barragem de Fundão em Mariana — o dinheiro é estadual, mas a origem é o
// desastre da Samarco/Vale, não o de Brumadinho). Publica os empenhos pagos
// com os recursos do Acordo de Repactuação do Rio Doce, por iniciativa (as
// cláusulas "Anexo I…X" do acordo) e por órgão executor.
async function coletarMariana() {
  const cache = resolve(RAIZ, ".cache/ckan-mg/mariana");
  const DATASET = "577f2dcc-76ca-4dae-9a6f-f018888ba862";
  const REC = (id: string, arq: string) =>
    `https://dados.mg.gov.br/dataset/${DATASET}/resource/${id}/download/${arq}`;

  const txtEmpenho = await baixar("empenho", REC("fdc7d94a-8e95-4518-b877-3ce276ac27a3", "empenho.csv"), cache);
  const txtIniciativa = await baixar(
    "iniciativa",
    REC("3975133d-d1f4-4241-b343-b57628f72068", "iniciativa.csv"),
    cache,
  );
  const txtOrgao = await baixar("orgao", REC("56bacf40-a3d4-4090-bc8c-f60f7a9b68ad", "orgao.csv"), cache);
  const txtReceita = await baixar("receita", REC("32cf8f1b-6701-411f-b6fb-84faa1d33c4d", "receita.csv"), cache);
  const txtConta = await baixar(
    "contabancaria",
    REC("1c6ae887-2839-4568-a1e7-c240b7ddd09e", "contabancaria.csv"),
    cache,
  );

  const empenhoCsv = lerCsv(txtEmpenho);
  const iniciativaCsv = lerCsv(txtIniciativa);
  const orgaoCsv = lerCsv(txtOrgao);
  const receitaCsv = lerCsv(txtReceita);
  const contaCsv = lerCsv(txtConta);
  const ie = indexar(empenhoCsv.cab);
  const ii = indexar(iniciativaCsv.cab);
  const io = indexar(orgaoCsv.cab);
  const ir = indexar(receitaCsv.cab);
  const ic = indexar(contaCsv.cab);

  if (empenhoCsv.linhas.length < 500)
    abortar(`empenho.csv com só ${empenhoCsv.linhas.length} linhas — download truncado?`);
  if (iniciativaCsv.linhas.length < 25)
    abortar(`iniciativa.csv com só ${iniciativaCsv.linhas.length} linhas`);

  const infoIniciativa = new Map(
    iniciativaCsv.linhas.map((l) => [
      l[ii.codigo_iniciativa],
      { nome: l[ii.iniciativa] ?? "", anexo: l[ii.anexo] ?? "", valorPrometido: numeroBr(l[ii.valor_da_iniciativa]) },
    ]),
  );

  interface EmpenhoAcordoRioDoce {
    ano: number;
    codigoIniciativa: string;
    iniciativa: string;
    anexo: string;
    orgao: string;
    numEmpenho: string;
    dataEmpenho: string | null;
    elementoDespesa: string;
    fonteRecurso: string;
    credor: string;
    /** CNPJ do credor. `null` quando a fonte trazia CPF de pessoa física (redigido) ou o campo era inválido/vazio. */
    documento: string | null;
    valorEmpenhado: number;
    valorLiquidado: number;
    valorPagoFinanceiro: number;
  }

  let cpfRedigidos = 0;
  let documentosInvalidos = 0;
  const empenhos: EmpenhoAcordoRioDoce[] = [];
  for (const l of empenhoCsv.linhas) {
    const docs = documentosEmLista(l[ie.cnpj_cpf_credor]);
    const { cnpj, cpfRedigidos: n } = primeiroDocumento(docs);
    cpfRedigidos += n;
    if (docs.some((d) => d.tipo === "invalido")) documentosInvalidos++;
    const codigoIniciativa = l[ie.codigo_iniciativa] ?? "";
    const info = infoIniciativa.get(codigoIniciativa);
    empenhos.push({
      ano: Math.round(numeroBr(l[ie.ano])),
      codigoIniciativa,
      iniciativa: info?.nome ?? "",
      anexo: info?.anexo ?? "",
      orgao: l[ie.nome_orgao] ?? "",
      numEmpenho: l[ie.no_empenho] ?? "",
      dataEmpenho: dataIso(l[ie.data_empenho]),
      elementoDespesa: l[ie.nome_elemento_despesa] ?? "",
      fonteRecurso: l[ie.nome_fonte_recurso] ?? "",
      credor: l[ie.credor] ?? "",
      documento: cnpj,
      valorEmpenhado: numeroBr(l[ie.valor_empenhado]),
      valorLiquidado: numeroBr(l[ie.valor_liquidado]),
      valorPagoFinanceiro: numeroBr(l[ie.valor_pago_financeiro]),
    });
  }
  if (empenhos.length === 0) abortar("nenhum empenho processado");

  const valorEmpenhadoTotal = empenhos.reduce((t, e) => t + e.valorEmpenhado, 0);
  const valorLiquidadoTotal = empenhos.reduce((t, e) => t + e.valorLiquidado, 0);
  const valorPagoTotal = empenhos.reduce((t, e) => t + e.valorPagoFinanceiro, 0);
  const anos = [...new Set(empenhos.map((e) => e.ano))].filter((a) => a > 1990).sort((a, b) => a - b);

  // Prometido (Anexo do acordo, em iniciativa.csv) × empenhado (execução real,
  // somada por nós de empenho.csv) — mesma lógica de "declarado pela fonte ao
  // lado da nossa soma" de `lib/paraopeba/execucao-fgv.ts`.
  const porIniciativa = [...infoIniciativa.entries()]
    .map(([codigo, info]) => {
      const doGrupo = empenhos.filter((e) => e.codigoIniciativa === codigo);
      return {
        codigo,
        iniciativa: info.nome,
        anexo: info.anexo,
        valorPrometido: info.valorPrometido,
        valorEmpenhado: doGrupo.reduce((t, e) => t + e.valorEmpenhado, 0),
        valorPagoFinanceiro: doGrupo.reduce((t, e) => t + e.valorPagoFinanceiro, 0),
        empenhos: doGrupo.length,
      };
    })
    .sort((a, b) => b.valorPrometido - a.valorPrometido);

  // Por órgão: a fonte já publica este agregado em orgao.csv (uma linha por
  // iniciativa × órgão) — somamos por órgão para poder comparar com a nossa
  // própria soma de empenho.csv no teste, em vez de recalcular do zero.
  const porOrgaoMap = new Map<string, { valorEmpenhado: number; valorPagoFinanceiro: number }>();
  for (const l of orgaoCsv.linhas) {
    const orgao = l[io.nome_orgao] ?? "";
    const atual = porOrgaoMap.get(orgao) ?? { valorEmpenhado: 0, valorPagoFinanceiro: 0 };
    porOrgaoMap.set(orgao, {
      valorEmpenhado: atual.valorEmpenhado + numeroBr(l[io.valor_empenhado]),
      valorPagoFinanceiro: atual.valorPagoFinanceiro + numeroBr(l[io.valor_pago_financeiro]),
    });
  }
  const porOrgao = [...porOrgaoMap.entries()]
    .map(([orgao, v]) => ({ orgao, ...v }))
    .sort((a, b) => b.valorEmpenhado - a.valorEmpenhado);
  const valorEmpenhadoDeclaradoPelaFonte = [...porOrgaoMap.values()].reduce((t, v) => t + v.valorEmpenhado, 0);

  const porAno = anos.map((ano) => {
    const doAno = empenhos.filter((e) => e.ano === ano);
    return {
      ano,
      empenhos: doAno.length,
      valorEmpenhado: doAno.reduce((t, e) => t + e.valorEmpenhado, 0),
      valorPagoFinanceiro: doAno.reduce((t, e) => t + e.valorPagoFinanceiro, 0),
    };
  });

  const receita = receitaCsv.linhas.map((l) => ({
    ano: Math.round(numeroBr(l[ir.ano_de_exercicio])),
    mes: l[ir.mes_descritivo] ?? "",
    classificacao: l[ir.classificacao_receita_descricao] ?? "",
    fonteRecurso: l[ir.fonte_recurso_descricao] ?? "",
    valorPrevistoAtualizado: numeroBr(l[ir.valor_previsto_atualizado]),
    valorEfetivado: numeroBr(l[ir.valor_efetivado_ajustado]),
  }));
  const rendimentos = contaCsv.linhas.map((l) => ({
    ano: Math.round(numeroBr(l[ic.ano_de_exercicio])),
    mes: l[ic.mes_descritivo] ?? "",
    classificacao: l[ic.classificacao_receita_descricao] ?? "",
    fonteRecurso: l[ic.fonte_recurso_descricao] ?? "",
    valorArrecadadoLiquido: numeroBr(l[ic.valor_arrecadado_liquido]),
  }));

  console.log(
    `[mariana] empenhos: ${empenhos.length} · iniciativas: ${infoIniciativa.size} · anos: ${anos[0]}–${anos[anos.length - 1]}`,
  );
  console.log(
    `[mariana] empenhado: R$ ${valorEmpenhadoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · pago: R$ ${valorPagoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
  );
  console.log(`[mariana] CPF redigidos: ${cpfRedigidos} · documentos inválidos (não-CNPJ, não-CPF): ${documentosInvalidos}`);
  console.log(`[mariana] empenhado declarado pela fonte (orgao.csv): R$ ${valorEmpenhadoDeclaradoPelaFonte.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);

  if (SO_MEDIR) return;

  const conteudo = `/**
 * Empenhos do Acordo Judicial de Reparação do Vale do Rio Doce (rompimento da
 * barragem de Fundão, Samarco/Vale, em Mariana — 2015), na parte executada
 * pelo Governo de Minas Gerais. ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por \`scripts/coletar-ckan-mg.mts --conjunto=mariana\` a partir do CKAN
 * do \`dados.mg.gov.br\`, dataset \`portal_mariana\` (nome herdado da cidade de
 * origem do desastre, não de Minas Gerais). O cabeçalho daquele script
 * documenta as três armadilhas que atravessam mais de um conjunto CKAN.
 *
 * ═══ POR QUE HÁ DOCUMENTOS REDIGIDOS ═══
 *
 * O campo \`cnpj_cpf_credor\` mistura CNPJ de empresa com CPF de pessoa física
 * — ${cpfRedigidos} valores válidos por mod-11 de CPF em ${empenhos.length} empenhos
 * (medido em 21/08/2026), alguns gravados com barra em vez de traço
 * (formato \`000.000.000/00\`, nunca o valor real). Todo CPF confirmado é redigido: o campo \`documento\` vem
 * \`null\`, mas \`credor\` (o nome) permanece — é a mesma régua usada em
 * \`convenios-mg.ts\` e \`tac-gtac.ts\` para dado de acordo público.
 *
 * ═══ POR QUE HÁ PROMETIDO AO LADO DE EMPENHADO ═══
 *
 * \`iniciativa.csv\` publica o valor de cada cláusula do acordo (coluna
 * \`valor_da_iniciativa\`) — o que foi PACTUADO. \`RIO_DOCE_POR_INICIATIVA\` cruza
 * isso com a soma dos empenhos de cada iniciativa — o que foi EXECUTADO. A
 * mesma lógica de \`lib/paraopeba/execucao-fgv.ts\`: total declarado pela fonte
 * ao lado da nossa soma, nunca só a nossa soma sozinha.
 */

export interface EmpenhoAcordoRioDoce {
  ano: number;
  codigoIniciativa: string;
  iniciativa: string;
  anexo: string;
  orgao: string;
  numEmpenho: string;
  dataEmpenho: string | null;
  elementoDespesa: string;
  fonteRecurso: string;
  credor: string;
  /** CNPJ do credor. \`null\` quando a fonte trazia CPF de pessoa física (redigido) ou o campo era inválido/vazio. */
  documento: string | null;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPagoFinanceiro: number;
}

export const EMPENHOS_ACORDO_RIO_DOCE: EmpenhoAcordoRioDoce[] = ${s(empenhos)};

/** Importe ISTO em página de servidor, nunca o array (regra de payload). */
export const COBERTURA_ACORDO_RIO_DOCE = {
  empenhos: ${empenhos.length},
  iniciativas: ${infoIniciativa.size},
  orgaos: ${porOrgao.length},
  anoInicial: ${anos[0]},
  anoFinal: ${anos[anos.length - 1]},
  valorEmpenhadoTotal: ${valorEmpenhadoTotal},
  valorLiquidadoTotal: ${valorLiquidadoTotal},
  valorPagoTotal: ${valorPagoTotal},
  /** CPF de pessoa física confirmado por mod-11 e redigido antes de gravar. */
  cpfRedigidos: ${cpfRedigidos},
  /** Nem CNPJ válido nem CPF válido — típico de fornecedor estrangeiro com um
   *  número no formato de CNPJ que nunca foi emitido pela Receita Federal. */
  documentosInvalidos: ${documentosInvalidos},
  /** Somado a partir de orgao.csv, que a própria fonte já publica agregado —
   *  referência cruzada com valorEmpenhadoTotal, não a mesma conta duas vezes. */
  valorEmpenhadoDeclaradoPelaFonte: ${valorEmpenhadoDeclaradoPelaFonte},
} as const;

export const RIO_DOCE_POR_INICIATIVA = ${s(porIniciativa)} as const;
export const RIO_DOCE_POR_ORGAO = ${s(porOrgao)} as const;
export const RIO_DOCE_POR_ANO = ${s(porAno)} as const;

/** \`receita.csv\` — previsão e efetivação da receita do acordo (lado da
 *  arrecadação, não do gasto). ${receita.length} linhas, praticamente estático. */
export const RIO_DOCE_RECEITA = ${s(receita)} as const;

/** \`contabancaria.csv\` — rendimento financeiro dos depósitos do acordo.
 *  ${rendimentos.length} linhas. */
export const RIO_DOCE_RENDIMENTOS = ${s(rendimentos)} as const;
`;
  escrever(resolve(LIB, "ckan-mg-mariana.ts"), conteudo);
}
CONJUNTOS.mariana = coletarMariana;

// ═══ CONJUNTO: sancionadas — Empresas Sancionadas pela Lei Anticorrupção ═══
//
// Publicado pela Controladoria-Geral do Estado (CGE), com base na Lei
// 12.846/2013. Um processo (SEI) pode ter várias empresas processadas em
// linhas separadas — o valor da multa só existe quando a decisão condena.
async function coletarSancionadas() {
  const cache = resolve(RAIZ, ".cache/ckan-mg/sancionadas");
  const url =
    "https://dados.mg.gov.br/dataset/ee4722fd-d58c-4c31-a065-1ed2490ee015/resource/f65853bb-4298-4456-a388-736fa9ff5d62/download/empresas_sancionadas.csv";
  const txt = await baixar("empresas_sancionadas", url, cache);
  const { cab, linhas } = lerCsv(txt);
  const idx = indexar(cab);
  if (linhas.length < 30) abortar(`empresas_sancionadas.csv com só ${linhas.length} linhas — download truncado?`);

  interface EmpresaSancionadaMg {
    sei: string;
    numero: string;
    ano: number;
    numeroPortaria: string;
    dataPublicacaoPortaria: string | null;
    orgaoInstaurador: string;
    orgaoLesado: string;
    empresa: string;
    tipoSocietario: string;
    /** \`null\` quando o CNPJ não passa no dígito verificador (medido: 1 caso,
     *  fornecedor nacional com número mal digitado na fonte — não é CPF). */
    cnpj: string | null;
    conduta: string;
    dataPublicacaoDecisao: string | null;
    decisao: string;
    fase: string;
    /** \`null\` quando a fonte não traz valor — típico de arquivamento, onde não há multa. */
    valorMultaAplicada: number | null;
  }

  let cnpjInvalidos = 0;
  const empresas: EmpresaSancionadaMg[] = linhas.map((l) => {
    const doc = documentoNumerico(l[idx.cnpj]);
    if (doc.tipo === "invalido") cnpjInvalidos++;
    const bruto = (l[idx.valor_multa_aplicada] ?? "").trim();
    return {
      sei: l[idx.sei] ?? "",
      numero: l[idx.numero] ?? "",
      ano: Math.round(numeroBr(l[idx.ano])),
      numeroPortaria: l[idx.portaria] ?? "",
      dataPublicacaoPortaria: dataIso(l[idx.data_publicacao_portaria]),
      orgaoInstaurador: l[idx.orgao_instaurador] ?? "",
      orgaoLesado: (l[idx.orgao_lesado] ?? "").trim(),
      empresa: l[idx.empresas_processadas] ?? "",
      tipoSocietario: l[idx.tipo_societario] ?? "",
      cnpj: doc.tipo === "cnpj" ? doc.valor : null,
      conduta: l[idx.conduta] ?? "",
      dataPublicacaoDecisao: dataIso(l[idx.data_publicacao_decisao]),
      decisao: l[idx.decisao] ?? "",
      fase: l[idx.fase] ?? "",
      valorMultaAplicada: bruto ? numeroBr(bruto) : null,
    };
  });
  if (empresas.length === 0) abortar("nenhuma empresa processada");

  const comMulta = empresas.filter((e) => e.valorMultaAplicada !== null);
  const valorMultaTotal = comMulta.reduce((t, e) => t + (e.valorMultaAplicada ?? 0), 0);
  const anos = [...new Set(empresas.map((e) => e.ano))].filter((a) => a > 1990).sort((a, b) => a - b);

  const contar = (f: (e: EmpresaSancionadaMg) => string) => {
    const m = new Map<string, number>();
    for (const e of empresas) {
      const k = f(e);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].map(([chave, empresas]) => ({ chave, empresas })).sort((a, b) => b.empresas - a.empresas);
  };
  const porDecisao = contar((e) => e.decisao);
  const porOrgaoLesado = contar((e) => e.orgaoLesado);

  console.log(`[sancionadas] empresas: ${empresas.length} · com multa: ${comMulta.length} · anos: ${anos[0]}–${anos[anos.length - 1]}`);
  console.log(`[sancionadas] multa total: R$ ${valorMultaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · cnpjInvalidos: ${cnpjInvalidos}`);

  if (SO_MEDIR) return;

  const conteudo = `/**
 * Empresas sancionadas pela Lei Anticorrupção (Lei Federal 12.846/2013) no
 * âmbito do Estado de Minas Gerais. ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por \`scripts/coletar-ckan-mg.mts --conjunto=sancionadas\` a partir do
 * CKAN do \`dados.mg.gov.br\`, dataset \`empresas_sancionadas\`, publicado pela
 * Controladoria-Geral do Estado (CGE). Um processo (SEI) pode listar mais de
 * uma empresa em linhas separadas — mesmo SEI, mesma portaria, empresas
 * diferentes.
 *
 * \`valorMultaAplicada\` vem \`null\` quando a fonte não traz valor — típico de
 * arquivamento (a acusação não resultou em multa), nunca tratar como zero.
 *
 * ${cnpjInvalidos} CNPJ não passou no dígito verificador — fornecedor nacional
 * com número mal digitado na fonte (confirmado: não é formato de CPF, é CNPJ
 * de 14 dígitos com checksum errado). Fica \`null\`, sem inventar um valor.
 */

export interface EmpresaSancionadaMg {
  sei: string;
  numero: string;
  ano: number;
  numeroPortaria: string;
  dataPublicacaoPortaria: string | null;
  orgaoInstaurador: string;
  orgaoLesado: string;
  empresa: string;
  tipoSocietario: string;
  /** \`null\` quando o CNPJ não passa no dígito verificador. */
  cnpj: string | null;
  conduta: string;
  dataPublicacaoDecisao: string | null;
  decisao: string;
  fase: string;
  /** \`null\` quando a fonte não traz valor (típico de arquivamento). */
  valorMultaAplicada: number | null;
}

export const EMPRESAS_SANCIONADAS_MG: EmpresaSancionadaMg[] = ${s(empresas)};

export const COBERTURA_EMPRESAS_SANCIONADAS = {
  empresas: ${empresas.length},
  comMulta: ${comMulta.length},
  valorMultaTotal: ${valorMultaTotal},
  anoInicial: ${anos[0]},
  anoFinal: ${anos[anos.length - 1]},
  cnpjInvalidos: ${cnpjInvalidos},
} as const;

export const SANCIONADAS_POR_DECISAO = ${s(porDecisao)} as const;
export const SANCIONADAS_POR_ORGAO_LESADO = ${s(porOrgaoLesado)} as const;
`;
  escrever(resolve(LIB, "ckan-mg-sancionadas.ts"), conteudo);
}
CONJUNTOS.sancionadas = coletarSancionadas;

// ═══ CONJUNTO: ipsemg — Contratos Vigentes do IPSEMG ═══
//
// Prestadores de saúde (laboratórios, clínicas, hospitais) credenciados ao
// Instituto de Previdência dos Servidores do Estado (assistência à saúde dos
// servidores mineiros, não é o SUS). Uma fotografia — `periodo_referencia` é
// a mesma data em toda a base, não uma coluna de série temporal.
async function coletarIpsemg() {
  const cache = resolve(RAIZ, ".cache/ckan-mg/ipsemg");
  const url =
    "https://dados.mg.gov.br/dataset/8d0f57e1-eeba-49d9-903e-37716a5dcdda/resource/e4a2b432-10b0-4b53-bb19-9de56c5f8215/download/contratos_vigentes.csv";
  const txt = await baixar("contratos_vigentes", url, cache);
  const { cab, linhas } = lerCsv(txt);
  const idx = indexar(cab);
  if (linhas.length < 5000) abortar(`contratos_vigentes.csv com só ${linhas.length} linhas — download truncado?`);

  interface ContratoIpsemgMg {
    regiaoAssistencial: string;
    microrregiao: string;
    municipio: string;
    ramoAtividade: string;
    numContrato: string;
    /** \`null\` quando a fonte não informa CNPJ do prestador (a maioria — 4.924 de 6.699 linhas). */
    cnpj: string | null;
    nome: string;
    inicioVigencia: string | null;
    fimVigencia: string | null;
  }

  let cnpjInvalidos = 0;
  let cnpjVazios = 0;
  let nomesComCpfRedigido = 0;
  const contratos: ContratoIpsemgMg[] = linhas.map((l) => {
    const doc = documentoNumerico(l[idx.cpf_cnpj]);
    if (doc.tipo === "invalido") cnpjInvalidos++;
    if (doc.tipo === "vazio") cnpjVazios++;
    const nomeRedigido = redigirTextoLivre(l[idx.nome] ?? "");
    if (nomeRedigido.redigidos > 0) nomesComCpfRedigido++;
    return {
      regiaoAssistencial: l[idx.regiao_assistencial] ?? "",
      microrregiao: l[idx.microrregiao] ?? "",
      municipio: l[idx.municipio] ?? "",
      ramoAtividade: l[idx.ramo_atividade] ?? "",
      numContrato: (l[idx.num_contrato] ?? "").split(",")[0],
      cnpj: doc.tipo === "cnpj" ? doc.valor : null,
      nome: nomeRedigido.texto,
      inicioVigencia: dataIso(l[idx.inicio_vigencia]),
      fimVigencia: dataIso(l[idx.fim_vigencia]),
    };
  });
  if (contratos.length === 0) abortar("nenhum contrato processado");

  // `periodo_referencia` NÃO é preenchido em toda linha (medido em 21/08/2026:
  // 1.774 de 6.699 trazem data, as outras vêm vazias — não é uma fotografia
  // datada por completo, e a primeira versão deste coletor assumiu que era,
  // até a trava abaixo pegar). Onde existe, é sempre o MESMO valor — isso sim
  // é verificado; onde falta, fica \`null\`.
  const datasReferencia = new Set(
    linhas.map((l) => dataIso(l[idx.periodo_referencia])).filter((d): d is string => d !== null),
  );
  if (datasReferencia.size === 0) abortar("nenhuma linha traz periodo_referencia — a fonte mudou de formato");
  if (datasReferencia.size > 1) {
    abortar(`periodo_referencia tem ${datasReferencia.size} valores distintos quando preenchido — deixou de ser uma fotografia única, tratar como série: ${[...datasReferencia].join(", ")}`);
  }
  const referencia = [...datasReferencia][0]!;
  const semReferencia = linhas.filter((l) => dataIso(l[idx.periodo_referencia]) === null).length;

  const contar = (f: (c: ContratoIpsemgMg) => string) => {
    const m = new Map<string, number>();
    for (const c of contratos) {
      const k = f(c);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].map(([chave, contratos]) => ({ chave, contratos })).sort((a, b) => b.contratos - a.contratos);
  };
  const porRamoAtividade = contar((c) => c.ramoAtividade);
  const porRegiaoAssistencial = contar((c) => c.regiaoAssistencial);

  console.log(`[ipsemg] contratos: ${contratos.length} · com CNPJ: ${contratos.length - cnpjVazios - cnpjInvalidos} · vazios: ${cnpjVazios} · inválidos: ${cnpjInvalidos}`);
  console.log(`[ipsemg] referência (quando preenchida): ${referencia} · sem referência: ${semReferencia} · ramos: ${porRamoAtividade.length} · regiões: ${porRegiaoAssistencial.length}`);
  console.log(`[ipsemg] CPF redigido de dentro do campo "nome" (não do campo de documento): ${nomesComCpfRedigido} linhas`);

  if (SO_MEDIR) return;

  const conteudo = `/**
 * Contratos vigentes de prestadores de saúde credenciados ao IPSEMG (Instituto
 * de Previdência dos Servidores do Estado de Minas Gerais — assistência à
 * saúde dos servidores mineiros, não é o SUS). ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por \`scripts/coletar-ckan-mg.mts --conjunto=ipsemg\` a partir do CKAN
 * do \`dados.mg.gov.br\`, dataset \`contratos_vigentes\`.
 *
 * ═══ \`periodo_referencia\` NÃO ESTÁ EM TODA LINHA ═══
 *
 * A primeira leitura deste campo (amostragem com split ingênuo por \`;\`, que
 * desalinha em linhas com \`nome\` contendo o separador) sugeria uma fotografia
 * datada por completo. Medido de novo em 21/08/2026 com parser que respeita
 * aspas: só ${contratos.length - semReferencia} de ${contratos.length} linhas trazem \`periodo_referencia\`
 * (sempre o mesmo valor, ${s(referencia)}, quando presente); as outras ${semReferencia}
 * vêm vazias. \`COBERTURA_CONTRATOS_VIGENTES_IPSEMG.referenciaEm\` é esse valor
 * único — não confunda com "data de toda a base".
 *
 * ═══ CPF DENTRO DO CAMPO \`nome\`, NÃO SÓ NO CAMPO DE DOCUMENTO ═══
 *
 * ${nomesComCpfRedigido} prestadores pessoa física colam o próprio CPF no NOME
 * (formato medido: \`"<NOME> - 000.000.000-00"\` e \`"<NOME> CPF-00000000000"\`)
 * mesmo tendo CNPJ próprio no campo certo — CADA UM redigido por
 * \`redigirTextoLivre\` antes de gravar (o valor real nunca aparece aqui nem em
 * nenhum outro comentário deste arquivo: escrever o CPF encontrado, mesmo
 * como exemplo, é o mesmo erro que \`sem-cpf-no-repo.test.ts\` documenta ter
 * acontecido em 12/08/2026 — o exemplo virou o vazamento). É por isso que
 * \`coletar-ckan-mg.mts\` varre o arquivo INTEIRO por CPF válido antes de
 * escrever (\`conferirSemCpf\`), não só os campos chamados "cpf" ou "cnpj".
 *
 * ═══ POR QUE ${cnpjVazios.toLocaleString("pt-BR")} DE ${contratos.length.toLocaleString("pt-BR")} NÃO TÊM CNPJ ═══
 *
 * A fonte simplesmente não preenche o campo \`cpf_cnpj\` na maioria das linhas
 * (medido em 21/08/2026: ${cnpjVazios} vazias). Dos ${contratos.length - cnpjVazios} que trazem
 * valor, TODOS são CNPJ (nenhum CPF de pessoa física) — mas a fonte grava o
 * número como um FLOAT, e a exportação derruba o zero à esquerda: valores com
 * 11 a 13 dígitos onde deveria haver 14. O coletor corrige com
 * \`padStart(14, "0")\` e só aceita se o resultado passar no dígito
 * verificador do CNPJ — nunca confia na contagem de dígitos sozinha (ver
 * armadilha 1 no topo de \`coletar-ckan-mg.mts\`).
 */

export interface ContratoIpsemgMg {
  regiaoAssistencial: string;
  microrregiao: string;
  municipio: string;
  ramoAtividade: string;
  numContrato: string;
  /** \`null\` quando a fonte não informa CNPJ do prestador. */
  cnpj: string | null;
  nome: string;
  inicioVigencia: string | null;
  fimVigencia: string | null;
}

export const CONTRATOS_VIGENTES_IPSEMG: ContratoIpsemgMg[] = ${s(contratos)};

export const COBERTURA_CONTRATOS_VIGENTES_IPSEMG = {
  contratos: ${contratos.length},
  comCnpj: ${contratos.length - cnpjVazios - cnpjInvalidos},
  cnpjVazios: ${cnpjVazios},
  cnpjInvalidos: ${cnpjInvalidos},
  /** \`AAAA-MM-DD\` — único valor não-vazio de \`periodo_referencia\`; ${semReferencia}
   *  das ${contratos.length} linhas não trazem essa data (campo vazio na fonte). */
  referenciaEm: ${s(referencia)},
  semReferencia: ${semReferencia},
  /** CPF de pessoa física achado DENTRO do campo \`nome\` (não do campo de
   *  documento) e redigido antes de gravar. */
  nomesComCpfRedigido: ${nomesComCpfRedigido},
  ramosDeAtividade: ${porRamoAtividade.length},
  regioesAssistenciais: ${porRegiaoAssistencial.length},
} as const;

export const IPSEMG_POR_RAMO_ATIVIDADE = ${s(porRamoAtividade)} as const;
export const IPSEMG_POR_REGIAO_ASSISTENCIAL = ${s(porRegiaoAssistencial)} as const;
`;
  escrever(resolve(LIB, "ckan-mg-ipsemg.ts"), conteudo);
}
CONJUNTOS.ipsemg = coletarIpsemg;

// ═══ CONJUNTO: fiscais-contrato — Fiscais de Contratos do Estado, 2022–2026 ═══
//
// Um CSV por ano (2022 a 2026), mesmo layout. Cada linha é um contrato
// administrativo do Executivo estadual, com o(s) fiscal(is) e gestor(es)
// nomeados — dado de ofício público, não redigido (é o próprio papel deles no
// contrato). O que É redigido é o \`cnpj_cpf\` do FORNECEDOR, quando é CPF.
async function coletarFiscaisContrato() {
  const DATASET = "2aea2a11-0448-4b31-872b-0c4b7e4aab72";
  const REC = (id: string, arq: string) =>
    `https://dados.mg.gov.br/dataset/${DATASET}/resource/${id}/download/${arq}`;
  const ANOS: Record<number, string> = {
    2022: "bafda7c1-c5e4-4c01-814c-47952753ef2e",
    2023: "85e76608-104b-448d-8977-90a446e99abc",
    2024: "219a25f5-5057-4b78-a293-ae8e3f75903f",
    2025: "ae133036-31d8-4fe3-b498-0409735c8f1f",
    2026: "b0bdc528-39ec-4087-ba63-004259b86fcb",
  };
  const cache = resolve(RAIZ, ".cache/ckan-mg/fiscais-contrato");

  interface FiscalContratoMg {
    ano: number;
    numeroProcesso: string;
    numeroContrato: string;
    situacao: string;
    tipo: string;
    dataPublicacao: string | null;
    inicioVigencia: string | null;
    fimVigencia: string | null;
    orgaoParticipante: string;
    /** \`null\` quando a fonte não traz nenhum CNPJ válido para este contrato
     *  (campo vazio, ou só CPF — redigido). Quando há mais de um documento na
     *  mesma linha (medido: 14 casos em 5 anos), guarda só o primeiro CNPJ. */
    cnpj: string | null;
    fornecedor: string;
    unidadeGestora: string;
    gestores: string;
    fiscais: string;
    objeto: string;
    valorInicial: number;
    valorAtual: number;
  }

  let cpfRedigidos = 0;
  let documentosInvalidos = 0;
  let camposDeTextoComCpf = 0;
  const fiscaisContrato: FiscalContratoMg[] = [];

  for (const [anoStr, resourceId] of Object.entries(ANOS)) {
    const ano = Number(anoStr);
    const txt = await baixar(`fiscais_${ano}`, REC(resourceId, `fiscais_contratos_${ano}.csv`), cache);
    const { cab, linhas } = lerCsv(txt);
    const idx = indexar(cab);
    if (linhas.length < 1000) abortar(`fiscais_contratos_${ano}.csv com só ${linhas.length} linhas — download truncado?`);

    for (const l of linhas) {
      const docs = documentosEmLista(l[idx.cnpj_cpf]);
      const { cnpj, cpfRedigidos: n } = primeiroDocumento(docs);
      cpfRedigidos += n;
      if (docs.some((d) => d.tipo === "invalido")) documentosInvalidos++;
      // CPF pode estar em QUALQUER campo de texto livre, não só em
      // nome_fornecedor: medido em 21/08/2026 dentro de `objeto`, no corpo de
      // um ato administrativo que cita o CPF do servidor designado fiscal
      // ("Fica designado... CPF 000.000.000-00 para acompanhar..."). Por isso
      // todo campo de texto passa por `redigirTextoLivre`, não só o nome do
      // fornecedor.
      const fornecedor = redigirTextoLivre(l[idx.nome_fornecedor] ?? "");
      const objeto = redigirTextoLivre(l[idx.objeto] ?? "");
      const fiscais = redigirTextoLivre(l[idx.fiscais_do_contrato] ?? "");
      const gestores = redigirTextoLivre(l[idx.gestores_do_contrato_portal_de_compras] ?? "");
      if (fornecedor.redigidos + objeto.redigidos + fiscais.redigidos + gestores.redigidos > 0) camposDeTextoComCpf++;
      fiscaisContrato.push({
        ano,
        numeroProcesso: l[idx.numero_do_processo_formatado] ?? "",
        numeroContrato: l[idx.numero_do_contrato] ?? "",
        situacao: l[idx.situacao_do_contrato] ?? "",
        tipo: l[idx.tipo_do_contrato] ?? "",
        dataPublicacao: dataIso(l[idx.data_de_publicacao]),
        inicioVigencia: dataIso(l[idx.data_inicio_de_vigencia]),
        fimVigencia: dataIso(l[idx.data_fim_de_vigencia]),
        orgaoParticipante: l[idx.orgaos_participantes] ?? "",
        cnpj,
        fornecedor: fornecedor.texto,
        unidadeGestora: l[idx.unidade_gestora_do_contrato] ?? "",
        gestores: gestores.texto,
        fiscais: fiscais.texto,
        objeto: objeto.texto,
        valorInicial: numeroBr(l[idx.valor_inicial]),
        valorAtual: numeroBr(l[idx.valor_atual]),
      });
    }
  }
  if (fiscaisContrato.length === 0) abortar("nenhum contrato processado");

  const anos = [...new Set(fiscaisContrato.map((f) => f.ano))].sort((a, b) => a - b);
  const valorAtualTotal = fiscaisContrato.reduce((t, f) => t + f.valorAtual, 0);

  const contar = (f: (c: FiscalContratoMg) => string) => {
    const m = new Map<string, number>();
    for (const c of fiscaisContrato) {
      const k = f(c);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].map(([chave, contratos]) => ({ chave, contratos })).sort((a, b) => b.contratos - a.contratos);
  };
  const porSituacao = contar((c) => c.situacao);
  const porAno = anos.map((ano) => {
    const doAno = fiscaisContrato.filter((c) => c.ano === ano);
    return { ano, contratos: doAno.length, valorAtualTotal: doAno.reduce((t, c) => t + c.valorAtual, 0) };
  });

  console.log(`[fiscais-contrato] contratos: ${fiscaisContrato.length} · anos: ${anos.join(", ")}`);
  console.log(`[fiscais-contrato] CPF redigidos (campo cnpj_cpf): ${cpfRedigidos} · documentos inválidos: ${documentosInvalidos} · linhas com CPF dentro de campo de texto livre: ${camposDeTextoComCpf}`);
  console.log(`[fiscais-contrato] valor atual total: R$ ${valorAtualTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);

  if (SO_MEDIR) return;

  const conteudo = `/**
 * Fiscais e gestores de contratos administrativos do Poder Executivo de Minas
 * Gerais, 2022–2026. ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por \`scripts/coletar-ckan-mg.mts --conjunto=fiscais-contrato\` a partir
 * do CKAN do \`dados.mg.gov.br\`, dataset \`fiscais_contrato\` — um CSV por ano,
 * mesmo layout. \`fiscais\` e \`gestores\` guardam nome de servidor público no
 * PAPEL OFICIAL de fiscalizar/gerir aquele contrato — não é redigido, é
 * exatamente o dado que a Lei de Acesso à Informação pede para existir.
 *
 * ═══ O QUE É REDIGIDO: CPF DO FORNECEDOR ═══
 *
 * \`cnpj_cpf\` mistura CNPJ de empresa com CPF de fornecedor pessoa física —
 * ${cpfRedigidos} valores válidos por mod-11 de CPF em ${fiscaisContrato.length} contratos dos
 * cinco anos (medido em 21/08/2026; a sondagem original só tinha amostrado
 * 2026, que sozinho já tem 205 — os quatro anos anteriores também têm, de 38 a
 * 200 por ano). Redigido: o campo \`cnpj\` vem \`null\`. Achado à parte, mais
 * grave: ${camposDeTextoComCpf} linhas têm CPF real dentro de um campo de TEXTO
 * LIVRE — não só \`nome_fornecedor\` (mesmo padrão de \`contratos_vigentes.nome\`),
 * mas também dentro de \`objeto\`, no corpo de um ato administrativo que cita o
 * CPF do servidor designado fiscal ("Fica designado o servidor... CPF
 * 000.000.000-00 para acompanhar..."). É a mesma classe de vazamento que
 * \`docs/FONTES.md\` registra para o Rouanet/SALIC ("CPF real já vazou em
 * ementa oficial") — aqui é ato administrativo, lá era ementa, o padrão é
 * igual. \`fornecedor\`, \`objeto\`, \`fiscais\` e \`gestores\` passam TODOS por
 * \`redigirTextoLivre\` antes de gravar, não só o campo com nome óbvio.
 *
 * ═══ ARMADILHAS DA FONTE (medidas em 21/08/2026, cobrem os cinco anos) ═══
 *
 * 1. **Mesmo campo, mais de um documento.** 14 contratos (dos ~21 mil) trazem
 *    \`cnpj_cpf\` com dois valores separados por vírgula, um por fornecedor —
 *    o coletor guarda só o primeiro CNPJ válido; nenhum CPF de nenhuma posição
 *    sobrevive.
 * 2. **Decimal sem padrão fixo, nem dentro do mesmo arquivo.** 2022 grava
 *    \`valor_inicial\` com PONTO e \`valor_atual\` com VÍRGULA nas MESMAS linhas;
 *    2023–2026 usam vírgula nos dois. \`numeroBr\` decide pelo conteúdo, não
 *    pelo ano.
 * 3. **\`objeto\` e outros campos de texto têm o SEPARADOR do CSV dentro do
 *    texto** — um split ingênuo por \`;\` desalinha a linha inteira sem lançar
 *    erro (é a mesma classe de armadilha que \`dt_vigencia_inicial\` mentindo em
 *    \`convenios-mg.ts\`: silenciosa, plausível, e só aparece com parser que
 *    respeita aspas).
 */

export interface FiscalContratoMg {
  ano: number;
  numeroProcesso: string;
  numeroContrato: string;
  situacao: string;
  tipo: string;
  dataPublicacao: string | null;
  inicioVigencia: string | null;
  fimVigencia: string | null;
  orgaoParticipante: string;
  /** \`null\` quando não há CNPJ válido (vazio, só CPF redigido, ou inválido). */
  cnpj: string | null;
  fornecedor: string;
  unidadeGestora: string;
  gestores: string;
  fiscais: string;
  objeto: string;
  valorInicial: number;
  valorAtual: number;
}

export const FISCAIS_CONTRATO_MG: FiscalContratoMg[] = ${s(fiscaisContrato)};

/** Importe ISTO em página de servidor, nunca o array (regra de payload). */
export const COBERTURA_FISCAIS_CONTRATO = {
  contratos: ${fiscaisContrato.length},
  anoInicial: ${anos[0]},
  anoFinal: ${anos[anos.length - 1]},
  valorAtualTotal: ${valorAtualTotal},
  /** CPF de pessoa física no campo \`cnpj_cpf\` do fornecedor, confirmado por mod-11 e redigido. */
  cpfRedigidos: ${cpfRedigidos},
  /** Linhas com CPF achado DENTRO de campo de texto livre (fornecedor, objeto,
   *  fiscais ou gestores) — não do campo de documento. Redigido. */
  linhasComCpfEmTextoLivre: ${camposDeTextoComCpf},
  /** Nem CNPJ válido nem CPF válido — inclui fornecedor estrangeiro sem CNPJ real. */
  documentosInvalidos: ${documentosInvalidos},
} as const;

export const FISCAIS_CONTRATO_POR_SITUACAO = ${s(porSituacao)} as const;
export const FISCAIS_CONTRATO_POR_ANO = ${s(porAno)} as const;
`;
  escrever(resolve(LIB, "ckan-mg-fiscais-contrato.ts"), conteudo);
}
CONJUNTOS["fiscais-contrato"] = coletarFiscaisContrato;

// ═══ CONJUNTO: obras — Obras Públicas do DER-MG ═══
//
// `portal_obras` no CKAN: contratos de obra rodoviária do Departamento de
// Estradas de Rodagem de MG. O dataset publica 8 tabelas satélite
// (município, fiscal, trecho, coordenada, histórico de situação) além de
// `contratos.csv` — este coletor usa só `contratos.csv` (a tabela principal
// já carrega objeto, valor, prazo, situação atual e a lista de municípios em
// texto) e faz um cálculo agregado sobre `fiscais.csv` para registrar um
// achado de dado pessoal sem publicar 5.336 linhas de nome por pessoa. As
// outras cinco tabelas (situação histórica, trechos, coordenadas) ficam
// declaradas como não ingeridas nesta rodada — não é lacuna escondida.
async function coletarObras() {
  const DATASET = "78b78e97-f94c-421e-9d2e-71b16533857d";
  const REC = (id: string, arq: string) =>
    `https://dados.mg.gov.br/dataset/${DATASET}/resource/${id}/download/${arq}`;
  const cache = resolve(RAIZ, ".cache/ckan-mg/obras");

  const txtContratos = await baixar(
    "contratos",
    REC("0aea8831-9c53-463c-a2d3-0c6ccf87ad95", "contratos.csv"),
    cache,
  );
  const txtFiscais = await baixar("fiscais", REC("f1977208-c0f0-464a-b0ff-7f93d09c0335", "fiscais.csv"), cache);

  const { cab, linhas } = lerCsv(txtContratos);
  const idx = indexar(cab);
  if (linhas.length < 500) abortar(`contratos.csv (portal_obras) com só ${linhas.length} linhas — download truncado?`);

  interface ContratoObraMg {
    contrato: string;
    contratoSiad: string;
    objeto: string;
    dataAssinatura: string | null;
    inicioExecucao: string | null;
    terminoExecucao: string | null;
    situacao: string;
    empresa: string;
    /** \`null\` quando o CNPJ não passa no dígito verificador. Nunca CPF: são todos fornecedores empresa neste conjunto. */
    cnpj: string | null;
    orgaoContratante: string;
    setor: string;
    modalidadeLicitacao: string;
    regimeExecucao: string;
    classificacao: string;
    naturezaContrato: string;
    /** Texto da fonte, já no formato "Obra N - descrição"; pode listar mais de uma obra por contrato. */
    obrasDoContrato: string;
    /** Texto da fonte, formato "Obra N - Município1, Município2, …". */
    municipios: string;
    diasOriginais: number;
    diasAditados: number;
    diasParalisados: number;
    diasAtuais: number;
    valorInicial: number;
    valorAditivos: number;
    valorTotal: number;
    totalMedido: number;
    saldoContratual: number;
    /** Já vem calculado pela fonte, 0–1 (não %). */
    percentualExecucao: number;
  }

  let cnpjInvalidos = 0;
  let camposDeTextoComCpf = 0;
  const contratos: ContratoObraMg[] = linhas.map((l) => {
    const doc = documentoNumerico(l[idx.cnpj]);
    if (doc.tipo === "invalido") cnpjInvalidos++;
    const empresa = redigirTextoLivre(l[idx.empresa] ?? "");
    const objeto = redigirTextoLivre(l[idx.objeto] ?? "");
    if (empresa.redigidos + objeto.redigidos > 0) camposDeTextoComCpf++;
    return {
      contrato: (l[idx.contrato] ?? "").trim(),
      contratoSiad: l[idx.contrato_siad] ?? "",
      objeto: objeto.texto,
      dataAssinatura: dataIso(l[idx.data_assinatura]),
      inicioExecucao: dataIso(l[idx.inicio_execucao]),
      terminoExecucao: dataIso(l[idx.termino_execucao]),
      situacao: l[idx.situacao] ?? "",
      empresa: empresa.texto,
      cnpj: doc.tipo === "cnpj" ? doc.valor : null,
      orgaoContratante: (l[idx.orgao_entidade_contratante] ?? "").replace(/^\*/, "").trim(),
      setor: (l[idx.setor] ?? "").replace(/^\*/, "").trim(),
      modalidadeLicitacao: l[idx.modalidade_de_licitacao] ?? "",
      regimeExecucao: l[idx.regime_de_execucao] ?? "",
      classificacao: l[idx.classificacao] ?? "",
      naturezaContrato: l[idx.natureza_do_contrato] ?? "",
      obrasDoContrato: (l[idx.obras_do_contrato] ?? "").trim(),
      municipios: (l[idx.municipios] ?? "").trim(),
      diasOriginais: Math.round(numeroBr(l[idx.dias_originais])),
      diasAditados: Math.round(numeroBr(l[idx.dias_aditados])),
      diasParalisados: Math.round(numeroBr(l[idx.dias_paralisados])),
      diasAtuais: Math.round(numeroBr(l[idx.dias_atuais])),
      valorInicial: numeroBr(l[idx.valor_inicial_do_contrato]),
      valorAditivos: numeroBr(l[idx.valor_em_aditivos]),
      valorTotal: numeroBr(l[idx.valor_total_do_contrato]),
      totalMedido: numeroBr(l[idx.total_medido]),
      saldoContratual: numeroBr(l[idx.saldo_contratual]),
      percentualExecucao: numeroBr(l[idx.percentual_execucao_contrato]),
    };
  });
  if (contratos.length === 0) abortar("nenhum contrato processado");

  const valorTotalSoma = contratos.reduce((t, c) => t + c.valorTotal, 0);
  const aditados = contratos.filter((c) => c.diasAditados > 0);

  const contar = (f: (c: ContratoObraMg) => string) => {
    const m = new Map<string, number>();
    for (const c of contratos) {
      const k = f(c);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].map(([chave, contratos]) => ({ chave, contratos })).sort((a, b) => b.contratos - a.contratos);
  };
  const porSituacao = contar((c) => c.situacao);
  const porModalidade = contar((c) => c.modalidadeLicitacao);

  // fiscais.csv: só para o achado de dado pessoal — não publica nome por
  // pessoa (5.336 linhas, fora do escopo desta rodada). O campo `conselho`
  // deveria guardar registro profissional (CREA), mas mistura CPF de pessoa
  // física — medido em 21/08/2026, incluindo linhas com o prefixo literal
  // "CPF-" em vez de um número de conselho.
  const fiscaisCsv = lerCsv(txtFiscais);
  const idxF = indexar(fiscaisCsv.cab);
  let fiscaisComCpfNoConselho = 0;
  for (const l of fiscaisCsv.linhas) {
    for (const campo of ["conselho", "cargo"] as const) {
      const v = l[idxF[campo]] ?? "";
      for (const m of v.matchAll(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g)) {
        if (cpfValido(m[0].replace(/\D/g, ""))) {
          fiscaisComCpfNoConselho++;
          break;
        }
      }
    }
  }

  console.log(`[obras] contratos: ${contratos.length} · valor total: R$ ${valorTotalSoma.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  console.log(`[obras] aditados (diasAditados>0): ${aditados.length} (${pct(aditados.length, contratos.length)}%) · cnpjInvalidos: ${cnpjInvalidos} · CPF em texto livre: ${camposDeTextoComCpf}`);
  console.log(`[obras] fiscais.csv (${fiscaisCsv.linhas.length} linhas): campo "conselho"/"cargo" com CPF real de pessoa física: ${fiscaisComCpfNoConselho}`);

  if (SO_MEDIR) return;

  const conteudo = `/**
 * Contratos de obra rodoviária do DER-MG (Departamento de Estradas de
 * Rodagem do Estado de Minas Gerais). ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por \`scripts/coletar-ckan-mg.mts --conjunto=obras\` a partir do CKAN
 * do \`dados.mg.gov.br\`, dataset \`portal_obras\`, tabela \`contratos.csv\` —
 * já carrega objeto, valor, prazo (\`diasOriginais\`/\`diasAditados\`, o mesmo
 * conceito de "prorrogação" de \`convenios-mg.ts\`), situação atual e a lista
 * de municípios afetados como texto. \`percentualExecucao\` vem pronto da
 * fonte, entre 0 e 1 — não é \`%\`, não multiplicar por 100 de novo.
 *
 * ═══ TABELAS SATÉLITE NÃO INGERIDAS NESTA RODADA (declarado, não escondido) ═══
 *
 * \`portal_obras\` publica mais seis tabelas — \`municipios.csv\` (8.258 linhas),
 * \`obra.csv\` (740, valor por sub-obra dentro do contrato), \`situacao.csv\`
 * (2.102, histórico de status), \`trechos.csv\` (612 KB) e \`coordenadas.csv\`
 * (a maioria vazia na amostra). \`contratos.csv\` já cobre o essencial
 * (situação ATUAL, município como texto); as demais ficam para quando o
 * produto pedir histórico de status ou geometria de trecho.
 *
 * ═══ ACHADO DE DADO PESSOAL EM \`fiscais.csv\` (NÃO nesta tabela) ═══
 *
 * \`fiscais.csv\` (5.336 linhas, uma por fiscal/gestor/representante nomeado
 * por contrato) tem um campo \`conselho\` pensado para registro profissional
 * (CREA) — mas ${fiscaisComCpfNoConselho} linhas trazem CPF real de pessoa física ali
 * dentro (algumas com o prefixo literal "CPF-"), confirmado por mod-11.
 * Decisão desta rodada: não publicar \`fiscais.csv\` linha a linha (nome +
 * papel + esse campo contaminado, sem necessidade clara de produto ainda) —
 * só o achado fica registrado aqui, como número medido, para quem for
 * ingerir essa tabela depois não repetir a descoberta do zero.
 *
 * ═══ CPF DENTRO DE \`empresa\`/\`objeto\` (campo de texto livre, não o \`cnpj\`) ═══
 *
 * ${camposDeTextoComCpf} contratos têm CPF real dentro de um campo de texto —
 * mesmo padrão de \`contratos_vigentes.nome\` e \`fiscais_contrato.objeto\`.
 * \`empresa\` e \`objeto\` passam por \`redigirTextoLivre\` antes de gravar.
 */

export interface ContratoObraMg {
  contrato: string;
  contratoSiad: string;
  objeto: string;
  dataAssinatura: string | null;
  inicioExecucao: string | null;
  terminoExecucao: string | null;
  situacao: string;
  empresa: string;
  /** \`null\` quando o CNPJ não passa no dígito verificador. */
  cnpj: string | null;
  orgaoContratante: string;
  setor: string;
  modalidadeLicitacao: string;
  regimeExecucao: string;
  classificacao: string;
  naturezaContrato: string;
  obrasDoContrato: string;
  municipios: string;
  diasOriginais: number;
  diasAditados: number;
  diasParalisados: number;
  diasAtuais: number;
  valorInicial: number;
  valorAditivos: number;
  valorTotal: number;
  totalMedido: number;
  saldoContratual: number;
  /** 0–1, já calculado pela fonte. */
  percentualExecucao: number;
}

export const CONTRATOS_OBRAS_MG: ContratoObraMg[] = ${s(contratos)};

/** Importe ISTO em página de servidor, nunca o array (regra de payload). */
export const COBERTURA_CONTRATOS_OBRAS = {
  contratos: ${contratos.length},
  valorTotal: ${valorTotalSoma},
  aditados: ${aditados.length},
  percentualAditados: ${pct(aditados.length, contratos.length)},
  cnpjInvalidos: ${cnpjInvalidos},
  linhasComCpfEmTextoLivre: ${camposDeTextoComCpf},
  /** \`fiscais.csv\` NÃO é publicado linha a linha nesta rodada (ver docstring);
   *  este número é o único vestígio do achado de dado pessoal ali. */
  fiscaisCsvLinhas: ${fiscaisCsv.linhas.length},
  fiscaisCsvComCpfNoConselho: ${fiscaisComCpfNoConselho},
} as const;

export const OBRAS_POR_SITUACAO = ${s(porSituacao)} as const;
export const OBRAS_POR_MODALIDADE = ${s(porModalidade)} as const;
`;
  escrever(resolve(LIB, "ckan-mg-obras.ts"), conteudo);
}
CONJUNTOS.obras = coletarObras;

// ═══ CONJUNTO: siafi — Execução orçamentária SIAFI 2026 ═══
//
// `dados-armazem-siafi-2026`: a execução financeira do Estado inteiro,
// 718.481 linhas × 29 colunas, um lançamento por linha (empenho, elemento de
// despesa, órgão — tudo por CÓDIGO, sem nome). Grande demais para publicar
// linha a linha (regra do repo: nunca carregar o corpus inteiro — aqui nem
// cabe no teto de payload do Worker). Agregado por FUNÇÃO DE GOVERNO e GRUPO
// DE DESPESA — as duas classificações são tabelas NACIONAIS fixas (Portaria
// MOG 42/1999 para função; Lei 4.320/1964 + Portaria STN/SOF 163/2001 para
// grupo), não um dicionário específico de MG que precisaria buscar em outro
// lugar. Confirmadas em 21/08/2026 contra a listagem pública do Portal da
// Transparência federal (`portaldatransparencia.gov.br/funcoes`) — os 28
// slugs batem exatamente com a tabela usada aqui.
async function coletarSiafi() {
  const url =
    "https://dados.mg.gov.br/dataset/3ac62062-6b32-4623-9298-9bf949a68d04/resource/a6ebbe98-59b6-498f-9e27-106b88995dcf/download/execucao.csv.gz";
  const cache = resolve(RAIZ, ".cache/ckan-mg/siafi");
  const txt = await baixar("execucao", url, cache, true);

  // Parser rápido, NÃO o lerCsv genérico: execucao.csv não tem nenhuma aspa
  // (conferido em 21/08/2026 — `grep -c '"'` devolve 0 nas 718.481 linhas) e
  // split por vírgula em 718 mil linhas com o parser caractere-a-caractere
  // fica sensivelmente mais lento sem necessidade. Se a fonte um dia passar a
  // citar (aspas), a validação de contagem de colunas abaixo aborta.
  const linhasBrutas = txt.split("\n");
  const cabecalho = (linhasBrutas[0] ?? "").replace(/^﻿/, "").split(",");
  const idx = indexar(cabecalho);
  const NUM_COLUNAS = cabecalho.length;
  if (NUM_COLUNAS !== 29) abortar(`execucao.csv com ${NUM_COLUNAS} colunas, esperava 29 — layout mudou`);

  // ─── Tabelas nacionais fixas (não vêm no CSV; ver nota acima) ───
  const FUNCAO: Record<string, string> = {
    "1": "Legislativa", "2": "Judiciária", "3": "Essencial à Justiça", "4": "Administração",
    "5": "Defesa Nacional", "6": "Segurança Pública", "7": "Relações Exteriores", "8": "Assistência Social",
    "9": "Previdência Social", "10": "Saúde", "11": "Trabalho", "12": "Educação", "13": "Cultura",
    "14": "Direitos da Cidadania", "15": "Urbanismo", "16": "Habitação", "17": "Saneamento",
    "18": "Gestão Ambiental", "19": "Ciência e Tecnologia", "20": "Agricultura", "21": "Organização Agrária",
    "22": "Indústria", "23": "Comércio e Serviços", "24": "Comunicações", "25": "Energia",
    "26": "Transporte", "27": "Desporto e Lazer", "28": "Encargos Especiais",
  };
  const GRUPO: Record<string, string> = {
    "1": "Pessoal e Encargos Sociais", "2": "Juros e Encargos da Dívida", "3": "Outras Despesas Correntes",
    "4": "Investimentos", "5": "Inversões Financeiras", "6": "Amortização da Dívida",
    "9": "Reserva de Contingência",
  };

  interface Acumulador {
    lancamentos: number;
    vlrEmpenhado: number;
    vlrLiquidado: number;
    vlrPagoFinanceiro: number;
  }
  const novoAcumulador = (): Acumulador => ({ lancamentos: 0, vlrEmpenhado: 0, vlrLiquidado: 0, vlrPagoFinanceiro: 0 });
  const somar = (a: Acumulador, empenhado: number, liquidado: number, pago: number) => {
    a.lancamentos++;
    a.vlrEmpenhado += empenhado;
    a.vlrLiquidado += liquidado;
    a.vlrPagoFinanceiro += pago;
  };

  const porFuncao = new Map<string, Acumulador>();
  const porGrupo = new Map<string, Acumulador>();
  const porMes = new Map<number, Acumulador>();
  let total = novoAcumulador();
  let funcoesForaDaTabela = new Set<string>();
  let gruposForaDaTabela = new Set<string>();
  let anosVistos = new Set<string>();
  let linhasProcessadas = 0;

  for (let i = 1; i < linhasBrutas.length; i++) {
    const linha = linhasBrutas[i];
    if (!linha) continue;
    const c = linha.split(",");
    if (c.length !== NUM_COLUNAS) {
      abortar(`execucao.csv linha ${i + 1} com ${c.length} campos, esperava ${NUM_COLUNAS} — provavelmente um campo com vírgula/aspa que o parser rápido não trata`);
    }
    const funcaoCod = c[idx.funcao_cod] ?? "";
    const grupoCod = c[idx.grupo_cod] ?? "";
    const mes = Number(c[idx.mes_cod]);
    const empenhado = numeroBr(c[idx.vlr_empenhado]);
    const liquidado = numeroBr(c[idx.vlr_liquidado]);
    const pago = numeroBr(c[idx.vlr_pago_financeiro]);

    anosVistos.add(c[idx.ano] ?? "");
    if (!FUNCAO[funcaoCod]) funcoesForaDaTabela.add(funcaoCod);
    if (!GRUPO[grupoCod]) gruposForaDaTabela.add(grupoCod);

    somar(total, empenhado, liquidado, pago);
    somar(porFuncao.get(funcaoCod) ?? porFuncao.set(funcaoCod, novoAcumulador()).get(funcaoCod)!, empenhado, liquidado, pago);
    somar(porGrupo.get(grupoCod) ?? porGrupo.set(grupoCod, novoAcumulador()).get(grupoCod)!, empenhado, liquidado, pago);
    somar(porMes.get(mes) ?? porMes.set(mes, novoAcumulador()).get(mes)!, empenhado, liquidado, pago);
    linhasProcessadas++;
  }
  if (linhasProcessadas < 500_000) abortar(`só ${linhasProcessadas} linhas processadas de execucao.csv — download truncado?`);
  if (funcoesForaDaTabela.size > 0) {
    abortar(`funcao_cod fora da tabela nacional (Portaria MOG 42/1999): ${[...funcoesForaDaTabela].join(", ")} — conferir se é código novo ou erro no parser`);
  }
  if (gruposForaDaTabela.size > 0) {
    abortar(`grupo_cod fora da tabela nacional (Lei 4.320/1964): ${[...gruposForaDaTabela].join(", ")} — conferir se é código novo ou erro no parser`);
  }
  if (anosVistos.size !== 1) abortar(`execucao.csv com mais de um ano (${[...anosVistos].join(", ")}) — o dataset é anual, o nome do recurso mudou de sentido`);
  const ano = Number([...anosVistos][0]);

  const siafiPorFuncao = [...porFuncao.entries()]
    .map(([codigo, a]) => ({ codigo: Number(codigo), funcao: FUNCAO[codigo]!, ...a }))
    .sort((a, b) => b.vlrEmpenhado - a.vlrEmpenhado);
  const siafiPorGrupo = [...porGrupo.entries()]
    .map(([codigo, a]) => ({ codigo: Number(codigo), grupo: GRUPO[codigo]!, ...a }))
    .sort((a, b) => b.vlrEmpenhado - a.vlrEmpenhado);
  const siafiPorMes = [...porMes.entries()]
    .map(([mes, a]) => ({ mes, ...a }))
    .sort((a, b) => a.mes - b.mes);

  console.log(`[siafi] linhas processadas: ${linhasProcessadas.toLocaleString("pt-BR")} · ano: ${ano}`);
  console.log(`[siafi] empenhado total: R$ ${total.vlrEmpenhado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · pago: R$ ${total.vlrPagoFinanceiro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  console.log(`[siafi] funções: ${siafiPorFuncao.length} · grupos: ${siafiPorGrupo.length} · meses: ${siafiPorMes.map((m) => m.mes).join(",")}`);

  if (SO_MEDIR) return;

  const conteudo = `/**
 * Execução orçamentária do Estado de Minas Gerais em ${ano} (SIAFI-MG), agregada
 * por FUNÇÃO DE GOVERNO e GRUPO DE NATUREZA DE DESPESA. ARQUIVO GERADO — não
 * editar à mão.
 *
 * Gerado por \`scripts/coletar-ckan-mg.mts --conjunto=siafi\` a partir do CKAN
 * do \`dados.mg.gov.br\`, dataset \`dados-armazem-siafi-2026\`, resource
 * \`execucao.csv.gz\` — ${linhasProcessadas.toLocaleString("pt-BR")} linhas, um lançamento por
 * linha, 29 colunas, TODAS por código (\`uo_cod\`, \`funcao_cod\`, \`grupo_cod\`…),
 * nenhuma com nome.
 *
 * ═══ POR QUE É AGREGADO, NÃO LINHA A LINHA ═══
 *
 * ${linhasProcessadas.toLocaleString("pt-BR")} lançamentos não cabem no teto de payload do Worker
 * (3 MiB gzip) nem fazem sentido carregados inteiros em contexto de agente —
 * a mesma regra que rege \`COBERTURA_*\` em todo o resto do repo. Agregado por
 * função e por grupo de despesa, que juntas cabem em algumas dezenas de
 * linhas e já respondem "quanto o Estado gastou em Saúde vs. Educação vs.
 * Segurança" e "quanto foi para folha (Pessoal) vs. obra (Investimentos)".
 *
 * ═══ POR QUE FUNÇÃO E GRUPO, E NÃO ÓRGÃO (\`uo_cod\`) ═══
 *
 * \`uo_cod\` (unidade orçamentária) é um código ESPECÍFICO de MG — publicá-lo
 * como "órgão 1221 gastou X" sem dicionário de tradução seria pior que não
 * publicar. \`funcao_cod\` (28 valores) e \`grupo_cod\` (6 valores, aqui) são
 * classificações NACIONAIS fixas, iguais em qualquer ente da federação —
 * Portaria MOG 42/1999 (função) e Lei 4.320/1964 + Portaria STN/SOF 163/2001
 * (grupo). Conferidas em 21/08/2026 contra a listagem pública do Portal da
 * Transparência federal (\`portaldatransparencia.gov.br/funcoes\`) — os 28
 * slugs batem exatamente com a tabela hardcoded no coletor. O coletor ABORTA
 * se a fonte trouxer um código fora dessas duas tabelas, em vez de publicar
 * um rótulo inventado.
 *
 * ═══ O QUE FICA DE FORA (declarado, não escondido) ═══
 *
 * As outras seis tabelas do dataset (\`credito\`, \`cota\`, \`receita\`,
 * \`alteracoes_orcamentarias\`, \`restos_pagar\`, \`restos_pagar_folha\`) foram
 * inspecionadas na sondagem mas não têm coletor nesta rodada — todas
 * compartilham a mesma limitação (dimensões por código de MG, sem nome) e a
 * mesma decisão adiada de dicionário. \`execucao.csv\` é a maior e a que mais
 * importa (a execução em si), por isso veio primeiro.
 */

interface AgregadoSiafi {
  lancamentos: number;
  vlrEmpenhado: number;
  vlrLiquidado: number;
  vlrPagoFinanceiro: number;
}

export interface SiafiPorFuncao extends AgregadoSiafi {
  /** Código nacional da função de governo (Portaria MOG 42/1999), 1–28. */
  codigo: number;
  funcao: string;
}
export interface SiafiPorGrupo extends AgregadoSiafi {
  /** Código nacional do grupo de natureza de despesa (Lei 4.320/1964). */
  codigo: number;
  grupo: string;
}
export interface SiafiPorMes extends AgregadoSiafi {
  mes: number;
}

/** Importe ISTO em página de servidor — já é o agregado, não o corpus. */
export const COBERTURA_SIAFI_EXECUCAO = {
  ano: ${ano},
  lancamentos: ${linhasProcessadas},
  vlrEmpenhadoTotal: ${total.vlrEmpenhado},
  vlrLiquidadoTotal: ${total.vlrLiquidado},
  vlrPagoFinanceiroTotal: ${total.vlrPagoFinanceiro},
  funcoes: ${siafiPorFuncao.length},
  grupos: ${siafiPorGrupo.length},
} as const;

export const SIAFI_POR_FUNCAO: SiafiPorFuncao[] = ${s(siafiPorFuncao)};
export const SIAFI_POR_GRUPO: SiafiPorGrupo[] = ${s(siafiPorGrupo)};
export const SIAFI_POR_MES: SiafiPorMes[] = ${s(siafiPorMes)};
`;
  escrever(resolve(LIB, "ckan-mg-siafi.ts"), conteudo);
}
CONJUNTOS.siafi = coletarSiafi;

await main();
