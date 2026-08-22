/**
 * Reduz a coleta bruta do painel de fiscalização do Sisema ao que cabe — e ao
 * que a página realmente usa.
 *
 * ═══ POR QUE AGREGAR, E NÃO PUBLICAR A LINHA ═══
 *
 * A extração trouxe **723.261 linhas** em 5 entidades (582.210 autos de
 * infração, 102.369 denúncias, 38.445 fiscalizações, 224 barragens, 13 em
 * emergência). O JSON compacto deu **290 MB** — acima do limite de 100 MB do
 * GitHub, e três ordens de grandeza acima do teto que manda de verdade aqui:
 * **3 MiB gzip para a rota inteira do Worker**.
 *
 * Ou seja: a linha crua nunca foi publicável, nem por tamanho de repo nem por
 * tamanho de página. O que a tela usa é agregado — cartão, gráfico por ano,
 * ranking por município e por situação — e é isso que entra no repo.
 *
 * **O bruto não é descartado**: fica em `X:\DevCoder\_lote-ambiental\
 * sisema-bruto\`, fora do versionamento, e este script é o caminho
 * reproduzível de bruto → agregado. Quem precisar da linha vai na fonte com o
 * coletor (`etl/betim/etl/apis/sisema_fiscalizacao_barragens.py`).
 *
 * ═══ O QUE NÃO SE FAZ AQUI ═══
 *
 * ⚠️ **Não somar valor de auto de infração como se fosse arrecadação.** Auto
 * lavrado é multa APLICADA, não paga: há situação de auto (`Situação Auto`) e
 * data de envio para dívida ativa. Somar tudo e chamar de "arrecadado" é o
 * erro clássico. Os totais saem separados por situação, sempre.
 *
 * ⚠️ **2.106 autos ficam fora do gráfico por data implausível**, e por duas
 * causas diferentes, que o agregado separa: 2.058 em 1899-12-29/30/31 (a data
 * zero do Automation Date do OLE/Excel — campo nulo virando data na origem) e
 * **48 com ano futuro, até 2090** (erro de digitação). Nenhum é descartado:
 * contam em `semDataValida` e `dataFutura`. Deixá-los no eixo esticaria o
 * gráfico por 60 anos e faria seis décadas vazias parecerem período coberto.
 *
 * Uso: npx tsx scripts/agregar-sisema-fiscalizacao.mts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BRUTO = "X:/DevCoder/_lote-ambiental/sisema-bruto/sisema-fiscalizacao-barragens.json";
const DESTINO = resolve(RAIZ, "etl/betim/dados/sisema-fiscalizacao-agregado.json");

/** Antes deste ano, data é artefato de campo nulo, não fato. */
const ANO_MINIMO_PLAUSIVEL = 1990;
/** Depois deste, é erro de digitação na origem: medidos 11 autos entre 2027 e
 *  2090, um deles em 2090. São poucos, mas esticam o eixo do gráfico por 60
 *  anos e fazem seis décadas de nada parecerem período coberto. Vão para
 *  `dataFutura`, contados e declarados — nunca somados a um ano real. */
const ANO_MAXIMO_PLAUSIVEL = 2026;

function anoDe(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v);
  const m = /(\d{4})/.exec(s);
  if (!m) return null;
  const ano = Number(m[1]);
  return ano >= ANO_MINIMO_PLAUSIVEL && ano <= ANO_MAXIMO_PLAUSIVEL ? ano : null;
}

function numero(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function contar<T>(linhas: T[], chave: (l: T) => string | null) {
  const m = new Map<string, number>();
  for (const l of linhas) {
    const k = chave(l);
    if (k === null || k === "") continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"));
}

const bruto = JSON.parse(readFileSync(BRUTO, "utf8"));
const dados = bruto.dados ?? bruto;

type Linha = Record<string, unknown>;
const autos: Linha[] = dados.autos_infracao ?? [];
const denuncias: Linha[] = dados.denuncias ?? [];
const fiscalizacao: Linha[] = dados.fiscalizacao ?? [];
const barragens: Linha[] = dados.gestao_e_classificacao_barragens ?? [];
const emergencia: Linha[] = dados.barragens_emergencia ?? [];

if (autos.length < 100_000) {
  throw new Error(`só ${autos.length} autos — o bruto tinha 582.210. Abortando antes de gravar.`);
}

// ─── autos de infração ─────────────────────────────────────────────────────
const autosPorAno = new Map<number, { autos: number; valor: number }>();
let autosSemDataValida = 0;
let valorSemDataValida = 0;
let autosDataFutura = 0;
for (const a of autos) {
  const ano = anoDe(a["Data de Lavratura"]);
  const v = numero(a["Valor do Auto de Infração"]);
  if (ano === null) {
    // Distingue as duas causas: data-zero do OLE (campo nulo na origem) e
    // ano futuro (erro de digitação). Somá-las num balde só esconderia que
    // são problemas diferentes da fonte.
    const cru = /(\d{4})/.exec(String(a["Data de Lavratura"] ?? ""));
    if (cru && Number(cru[1]) > ANO_MAXIMO_PLAUSIVEL) autosDataFutura += 1;
    autosSemDataValida += 1;
    valorSemDataValida += v;
    continue;
  }
  const atual = autosPorAno.get(ano) ?? { autos: 0, valor: 0 };
  atual.autos += 1;
  atual.valor += v;
  autosPorAno.set(ano, atual);
}

const porSituacaoAuto = contar(autos, (a) => (a["Situação Auto"] as string) ?? null);
// Valor por situação: é o corte que impede ler multa aplicada como arrecadada.
const valorPorSituacao = new Map<string, number>();
for (const a of autos) {
  const s = (a["Situação Auto"] as string) ?? "(sem situação)";
  valorPorSituacao.set(s, (valorPorSituacao.get(s) ?? 0) + numero(a["Valor do Auto de Infração"]));
}

const agregado = {
  fonte: bruto.fonte ?? "sisema_painel_fiscalizacao",
  fonteNome: bruto.fonte_nome ?? "Painel Sisema — Outros Indicadores (Power BI público)",
  resourceKey: bruto.resource_key ?? null,
  modelId: bruto.model_id ?? null,
  dadoCongeladoEm: bruto.dado_congelado_em ?? null,
  ressalvaCongelamento: bruto.ressalva_congelamento ?? null,
  ressalvaWorkspace: bruto.ressalva_workspace ?? null,
  coletadoEm: bruto.coletado_em ?? null,
  agregadoEm: new Date().toISOString().slice(0, 10),
  observacao:
    "Agregado a partir de 723.261 linhas brutas (290 MB, fora do repo). A linha crua não é publicável: excede o limite do GitHub e o teto de 3 MiB gzip do Worker.",

  autosInfracao: {
    total: autos.length,
    valorTotalAplicado: [...valorPorSituacao.values()].reduce((t, v) => t + v, 0),
    avisoValor:
      "Valor de auto LAVRADO é multa aplicada, não arrecadada. Ver valorPorSituacao antes de citar qualquer total.",
    semDataValida: autosSemDataValida,
    dataFutura: autosDataFutura,
    valorSemDataValida,
    avisoData:
      "Fora de porAno por data implausível: 1899-12-29/30/31 é a data-zero do OLE (campo nulo na origem), e há autos datados até 2090 (erro de digitação). Contados aqui, nunca somados a um ano real.",
    porAno: [...autosPorAno.entries()]
      .map(([ano, v]) => ({ ano, ...v }))
      .sort((a, b) => a.ano - b.ano),
    porSituacao: porSituacaoAuto,
    valorPorSituacao: [...valorPorSituacao.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor),
  },

  denuncias: {
    total: denuncias.length,
    porMunicipio: contar(denuncias, (d) => (d["Município do Denunciado"] as string) ?? null).slice(0, 120),
    porSituacao: contar(denuncias, (d) => (d["SITUAÇÃO"] as string) ?? null),
    porAno: (() => {
      const m = new Map<number, number>();
      for (const d of denuncias) {
        const ano = anoDe(d["Data de cadastro"]);
        if (ano !== null) m.set(ano, (m.get(ano) ?? 0) + 1);
      }
      return [...m.entries()].map(([ano, total]) => ({ ano, total })).sort((a, b) => a.ano - b.ano);
    })(),
  },

  fiscalizacoes: {
    total: fiscalizacao.length,
    porRegional: contar(fiscalizacao, (f) => (f["Regional"] as string) ?? null),
    porTipologia: contar(fiscalizacao, (f) => (f["Tipologia"] as string) ?? null).slice(0, 60),
    porMunicipio: contar(fiscalizacao, (f) => (f["Municipio"] as string) ?? null).slice(0, 120),
    porAno: (() => {
      const m = new Map<number, number>();
      for (const f of fiscalizacao) {
        const ano = anoDe(f["DATA_FISCALIZACAO"]);
        if (ano !== null) m.set(ano, (m.get(ano) ?? 0) + 1);
      }
      return [...m.entries()].map(([ano, total]) => ({ ano, total })).sort((a, b) => a.ano - b.ano);
    })(),
  },

  // Barragens são poucas: cabem inteiras, e são o dado de maior interesse
  // público do painel.
  barragens: barragens as unknown[],
  barragensEmEmergencia: emergencia as unknown[],
};

writeFileSync(DESTINO, JSON.stringify(agregado, null, 1), "utf-8");

console.log(`autos:         ${agregado.autosInfracao.total.toLocaleString("pt-BR")}`);
console.log(`  sem data:    ${autosSemDataValida.toLocaleString("pt-BR")} (dos quais ${autosDataFutura} com ano futuro)`);
console.log(`  situações:   ${porSituacaoAuto.length}`);
console.log(`denúncias:     ${agregado.denuncias.total.toLocaleString("pt-BR")}`);
console.log(`fiscalizações: ${agregado.fiscalizacoes.total.toLocaleString("pt-BR")}`);
console.log(`barragens:     ${barragens.length} (+${emergencia.length} em emergência)`);
console.log(`gravado: ${DESTINO}`);
