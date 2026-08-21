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
 *    `015.033.486/95`) e `fiscais_contrato` (662 CPF reais nos cinco anos,
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

function escrever(destino: string, conteudo: string) {
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
 *  separado por vírgula (`941.306.556-04,040.440.756-03`). Ver
 *  `portal_mariana.empenho` e `fiscais_contrato.cnpj_cpf` (armadilha 2). */
function documentosEmLista(bruto: string | undefined): Documento[] {
  return (bruto ?? "")
    .split(",")
    .map((p) => p.replace(/\D/g, ""))
    .filter(Boolean)
    .map(classificarDocumento);
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
 * (\`015.033.486/95\`). Todo CPF confirmado é redigido: o campo \`documento\` vem
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

await main();
