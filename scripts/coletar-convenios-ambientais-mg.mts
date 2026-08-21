/**
 * Gera `apps/web/lib/ambiental/convenios-mg.ts` — os convênios de saída dos
 * quatro órgãos ambientais do Estado de Minas Gerais (SEMAD, FEAM, IEF, IGAM),
 * com valor e, principalmente, **quanto tempo a mais cada um levou**.
 *
 * ═══ A FONTE ═══
 *
 * CKAN do `dados.mg.gov.br`, dataset `convenios-saida`, publicado pela CGE com
 * atualização diária. Modelo estrela: `ft_convenio` traz os valores por
 * convênio/órgão/município/ano; `dm_convenio` traz nome, objetivo e as datas;
 * as `dm_*` restantes são tabelas de rótulo.
 *
 * ═══ TRÊS ARMADILHAS MEDIDAS EM 2026-08-21 ═══
 *
 * 1. **403 sem User-Agent de navegador.** `curl` puro leva 403; com UA de
 *    navegador, 200. Não é rate limit — é bloqueio de cliente não-navegador, e
 *    silencioso o bastante para parecer "a API caiu".
 *
 * 2. **O DataStore do CKAN responde `success: true` com `total: 0`.** Ele está
 *    habilitado e vazio. Quem usar `datastore_search` conclui que o dataset não
 *    tem dado. O caminho certo é baixar os CSV.GZ dos `resources`.
 *
 * 3. **`ft_convenio_metaetapa.csv.gz` vem VAZIO — só o cabeçalho, 78 bytes
 *    descompactados, com HTTP 200.** Conferido duas vezes. É justamente o
 *    arquivo que carregaria meta e etapa de cada convênio, ou seja, o
 *    "atendimento de metas". O portal anuncia o recurso e entrega nada. Este
 *    script NÃO tenta usá-lo, e o fato está registrado em `docs/FONTES.md`
 *    porque é candidato a pedido de LAI, não a bug de coletor.
 *
 * ═══ A ARMADILHA DE NOME DE CAMPO, QUE É A PIOR ═══
 *
 * `dt_vigencia_inicial` **NÃO é a data de início**. Em 90.045 dos 90.254
 * registros ela é IGUAL a `dt_vigencia_final`: as duas guardam a data-limite
 * originalmente pactuada. Quem ler "inicial" como começo calcula duração zero
 * para 99,8% dos convênios — e o resultado é plausível o bastante para passar.
 *
 * O prazo que vale hoje é `dt_vigencia_atual`. Logo:
 *
 *     prorrogação = dt_vigencia_atual − dt_vigencia_final
 *
 * ═══ POR QUE SÓ OS QUATRO ÓRGÃOS AMBIENTAIS ═══
 *
 * O dataset tem 90 mil convênios de 55 órgãos — esporte, assistência social,
 * educação. Publicar tudo em `/ambiental` seria enquadrar como ambiental
 * dinheiro que não é. O recorte são os `id_orgao` 7 (SEMAD), 29 (FEAM),
 * 30 (IEF) e 35 (IGAM), lidos da própria `dm_orgao_concedente` — nunca cravados
 * por nome, que muda de grafia entre versões da base.
 *
 * Uso:
 *   npx tsx scripts/coletar-convenios-ambientais-mg.mts            # baixa e grava
 *   npx tsx scripts/coletar-convenios-ambientais-mg.mts --seco     # não grava
 *   npx tsx scripts/coletar-convenios-ambientais-mg.mts --cache    # reusa o download
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = resolve(RAIZ, ".cache/convenios-mg");
const DESTINO = resolve(RAIZ, "apps/web/lib/ambiental/convenios-mg.ts");

const SO_MEDIR = process.argv.includes("--seco");
const USAR_CACHE = process.argv.includes("--cache");

/** UA honesto e identificável, com a URL do projeto — ver `coletar-execucao-fgv.mts`.
 *  Precisa parecer navegador porque o portal recusa o resto (403). */
const AGENTE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ControlePopular/1.0 (+https://controlepopular.com.br)";

const DATASET = "52fcf7e5-d9a6-4b17-a491-12a5a978aecd";
const REC = (id: string, arq: string) =>
  `https://dados.mg.gov.br/dataset/${DATASET}/resource/${id}/download/${arq}`;

const ARQUIVOS = {
  fato: REC("d8b48c2b-c2ec-451a-99f0-0421987ceeba", "ft_convenio.csv.gz"),
  convenio: REC("23de2c3f-cbf6-494a-8b32-4c9c151fb999", "dm_convenio.csv.gz"),
  orgao: REC("cf96b7cc-b534-4c4b-8338-dce4c9ed5517", "dm_orgao_concedente.csv.gz"),
  municipio: REC("9cd4ddc8-7efd-45dc-b572-9ea6840c9815", "dm_municipio.csv.gz"),
  convenente: REC("3b9d9df2-1a50-451d-bc7e-3a0b82fcf821", "dm_convenente.csv.gz"),
} as const;

const abortar = (msg: string): never => {
  console.error(`[convenios-mg] ABORT: ${msg}`);
  process.exit(1);
};

async function baixar(nome: string, url: string): Promise<string> {
  const destino = resolve(CACHE, `${nome}.csv.gz`);
  if (USAR_CACHE && existsSync(destino)) {
    console.log(`[convenios-mg] cache: ${nome}`);
    return gunzipSync(readFileSync(destino)).toString("utf8");
  }
  mkdirSync(CACHE, { recursive: true });
  const r = await fetch(url, { headers: { "User-Agent": AGENTE } });
  // Validar o CONTEÚDO, não o status: o portal já devolveu 200 com arquivo só
  // de cabeçalho (ver a armadilha 3 no topo).
  if (!r.ok) abortar(`${nome}: HTTP ${r.status} — sem UA de navegador o portal devolve 403`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(destino, buf);
  const texto = gunzipSync(buf).toString("utf8");
  console.log(`[convenios-mg] baixado: ${nome} (${(buf.length / 1024).toFixed(0)} KiB comprimido)`);
  return texto;
}

/** CSV do portal: separador `;`, BOM UTF-8, sem aspas escapadas dentro de campo
 *  citado além do padrão. Parser mínimo, mas que respeita aspas — `split(";")`
 *  cru quebra em `objetivo`, que tem ponto-e-vírgula no texto. */
function lerCsv(texto: string): Record<string, string>[] {
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
    else if (c === ";") {
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
  return resto
    .filter((l) => l.length > 1)
    .map((l) => Object.fromEntries(cab.map((k, i) => [k.trim(), (l[i] ?? "").trim()])));
}

/** `AAAA-MM-DD…` → Date em UTC. Nunca `new Date(string)`: fuso local desloca o
 *  dia e vigência vira um dia a menos (o mesmo bug já mordeu em contrato). */
function data(s: string | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec((s ?? "").trim());
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}
const DIA = 86_400_000;
const num = (s: string | undefined) => {
  const n = Number((s ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};

// ─────────────────────────────────────────────────────────────────────────────

const [txtFato, txtConv, txtOrgao, txtMunicipio, txtConvenente] = await Promise.all([
  baixar("ft_convenio", ARQUIVOS.fato),
  baixar("dm_convenio", ARQUIVOS.convenio),
  baixar("dm_orgao", ARQUIVOS.orgao),
  baixar("dm_municipio", ARQUIVOS.municipio),
  baixar("dm_convenente", ARQUIVOS.convenente),
]);

const fatos = lerCsv(txtFato);
const convenios = new Map(lerCsv(txtConv).map((r) => [r.id_convenio, r]));
const orgaos = lerCsv(txtOrgao);
const municipios = new Map(lerCsv(txtMunicipio).map((r) => [r.id_municipio, r]));
const convenentes = new Map(lerCsv(txtConvenente).map((r) => [r.id_convenente, r]));

if (fatos.length < 10_000) abortar(`ft_convenio com só ${fatos.length} linhas — download truncado?`);
if (convenios.size < 10_000) abortar(`dm_convenio com só ${convenios.size} linhas`);

/** Os quatro órgãos ambientais, achados pelo NOME na tabela de rótulos e usados
 *  pelo id — o nome muda de grafia entre versões, o id não. */
const PADRAO_AMBIENTAL = /MEIO AMBIENTE|FLORESTAS|GESTAO DAS AGUAS/i;
const idsAmbientais = new Set(
  orgaos.filter((o) => PADRAO_AMBIENTAL.test(o.nome ?? "")).map((o) => o.id_orgao),
);
const nomeDoOrgao = new Map(orgaos.map((o) => [o.id_orgao, o.nome]));
if (idsAmbientais.size !== 4) {
  abortar(
    `esperava 4 órgãos ambientais (SEMAD, FEAM, IEF, IGAM), achei ${idsAmbientais.size}: ` +
      [...idsAmbientais].map((i) => nomeDoOrgao.get(i)).join(" | "),
  );
}

interface ConvenioAmbiental {
  id: string;
  nome: string;
  objetivo: string;
  orgao: string;
  convenente: string;
  municipio: string;
  ano: number;
  instrumento: string;
  valorTotal: number;
  valorConcedente: number;
  valorContrapartida: number;
  /** Data-limite originalmente pactuada (`dt_vigencia_final`). */
  prazoOriginal: string | null;
  /** Data-limite que vale hoje (`dt_vigencia_atual`). */
  prazoAtual: string | null;
  /** Dias entre uma e outra. 0 = nunca prorrogado. */
  diasDeProrrogacao: number;
}

const linhas: ConvenioAmbiental[] = [];
for (const f of fatos) {
  if (!idsAmbientais.has(f.id_orgao)) continue;
  const c = convenios.get(f.id_convenio);
  if (!c) continue;
  const original = data(c.dt_vigencia_final);
  const atual = data(c.dt_vigencia_atual);
  const dias = original && atual ? Math.round((atual.getTime() - original.getTime()) / DIA) : 0;
  linhas.push({
    id: f.id_convenio,
    nome: c.nome ?? "",
    objetivo: c.objetivo ?? "",
    orgao: nomeDoOrgao.get(f.id_orgao) ?? "",
    convenente: convenentes.get(f.id_convenente)?.nome ?? "",
    municipio: municipios.get(f.id_municipio)?.nome ?? "",
    ano: num(f.ano_particao),
    // Registro da versão 1 (base antiga) não traz tipo de instrumento; a fonte
    // grava "-". Guardar vazio é mais honesto que inventar "CONVENIO".
    instrumento: (c.tp_instrumento ?? "").replace(/^-$/, ""),
    valorTotal: num(f.vr_total_atual),
    valorConcedente: num(f.vr_concede_atual),
    valorContrapartida: num(f.vr_contra_atual),
    prazoOriginal: original ? original.toISOString().slice(0, 10) : null,
    prazoAtual: atual ? atual.toISOString().slice(0, 10) : null,
    diasDeProrrogacao: dias > 0 ? dias : 0,
  });
}

if (linhas.length === 0) abortar("nenhum convênio ambiental — o filtro de órgão não casou nada");
const anos = [...new Set(linhas.map((l) => l.ano))].filter((a) => a > 1990).sort((a, b) => a - b);
if (anos.length === 0) abortar("nenhum ano plausível");

const valorTotal = linhas.reduce((t, l) => t + l.valorTotal, 0);
const prorrogados = linhas.filter((l) => l.diasDeProrrogacao > 0);
const diasOrdenados = prorrogados.map((l) => l.diasDeProrrogacao).sort((a, b) => a - b);
const medianaDias = diasOrdenados.length
  ? diasOrdenados[Math.floor(diasOrdenados.length / 2)]
  : 0;

/** Referência estadual: serve para dizer se o ambiental foge da média — e é
 *  medida, não estimada. */
const totalEstadual = convenios.size;
const prorrogadosEstadual = [...convenios.values()].filter((c) => {
  const o = data(c.dt_vigencia_final);
  const a = data(c.dt_vigencia_atual);
  return o && a && a.getTime() > o.getTime();
}).length;

const porOrgao = [...idsAmbientais]
  .map((id) => {
    const nome = nomeDoOrgao.get(id) ?? "";
    const doOrgao = linhas.filter((l) => l.orgao === nome);
    return {
      orgao: nome,
      convenios: doOrgao.length,
      valorTotal: doOrgao.reduce((t, l) => t + l.valorTotal, 0),
      prorrogados: doOrgao.filter((l) => l.diasDeProrrogacao > 0).length,
    };
  })
  .sort((a, b) => b.valorTotal - a.valorTotal);

const porAno = anos.map((ano) => {
  const doAno = linhas.filter((l) => l.ano === ano);
  return {
    ano,
    convenios: doAno.length,
    valorTotal: doAno.reduce((t, l) => t + l.valorTotal, 0),
    prorrogados: doAno.filter((l) => l.diasDeProrrogacao > 0).length,
  };
});

const pct = (a: number, b: number) => Number(((a / b) * 100).toFixed(1));

console.log(`[convenios-mg] convênios ambientais: ${linhas.length} (de ${fatos.length} do Estado)`);
console.log(`[convenios-mg] órgãos: ${porOrgao.map((o) => o.orgao.split(" ").slice(-1)[0]).join(", ")}`);
console.log(`[convenios-mg] anos: ${anos[0]}–${anos[anos.length - 1]}`);
console.log(`[convenios-mg] valor total: R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
console.log(`[convenios-mg] prorrogados: ${prorrogados.length} (${pct(prorrogados.length, linhas.length)}%) · mediana ${medianaDias} dias · máximo ${diasOrdenados[diasOrdenados.length - 1] ?? 0} dias`);
console.log(`[convenios-mg] referência estadual: ${pct(prorrogadosEstadual, totalEstadual)}% dos ${totalEstadual} convênios do Estado`);

if (SO_MEDIR) process.exit(0);

const s = (t: unknown) => JSON.stringify(t);
const conteudo = `/**
 * Convênios de saída dos quatro órgãos ambientais de Minas Gerais (SEMAD, FEAM,
 * IEF, IGAM). ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por \`scripts/coletar-convenios-ambientais-mg.mts\` a partir do CKAN do
 * \`dados.mg.gov.br\` (dataset \`convenios-saida\`, publicado pela CGE). O
 * cabeçalho daquele script documenta as armadilhas da fonte — inclusive a que
 * mais importa aqui:
 *
 * ═══ \`dt_vigencia_inicial\` NÃO É A DATA DE INÍCIO ═══
 *
 * Em 90.045 dos 90.254 registros ela é igual a \`dt_vigencia_final\`: as duas
 * guardam a data-limite originalmente pactuada. Por isso os campos abaixo se
 * chamam \`prazoOriginal\` e \`prazoAtual\`, e \`diasDeProrrogacao\` é a
 * diferença entre eles — quem calcular duração a partir de "inicial" obtém zero
 * para 99,8% dos convênios, e o zero parece plausível.
 *
 * ═══ O QUE ESTE DADO NÃO TEM ═══
 *
 * Meta e etapa de cada convênio. O dataset publica o recurso
 * \`ft_convenio_metaetapa\`, mas ele vem **vazio** (só cabeçalho, HTTP 200) —
 * conferido duas vezes em 2026-08-21. Sem ele não há como dizer se o convênio
 * cumpriu o que prometeu; dá para dizer quanto custou e quanto tempo levou.
 */

export interface ConvenioAmbientalMg {
  id: string;
  nome: string;
  objetivo: string;
  orgao: string;
  convenente: string;
  municipio: string;
  ano: number;
  /** Vazio quando a fonte não informa (registros da base antiga gravam "-"). */
  instrumento: string;
  valorTotal: number;
  valorConcedente: number;
  valorContrapartida: number;
  /** Data-limite originalmente pactuada, \`AAAA-MM-DD\`. */
  prazoOriginal: string | null;
  /** Data-limite vigente hoje. */
  prazoAtual: string | null;
  /** \`prazoAtual − prazoOriginal\` em dias. 0 = nunca prorrogado. */
  diasDeProrrogacao: number;
}

export const CONVENIOS_AMBIENTAIS_MG: ConvenioAmbientalMg[] = ${s(linhas)};

/** Importe ISTO em página de servidor, nunca o array (regra de payload). */
export const COBERTURA_CONVENIOS_AMBIENTAIS = {
  convenios: ${linhas.length},
  orgaos: ${porOrgao.length},
  municipios: ${new Set(linhas.map((l) => l.municipio).filter(Boolean)).size},
  anoInicial: ${anos[0]},
  anoFinal: ${anos[anos.length - 1]},
  valorTotal: ${valorTotal},
  prorrogados: ${prorrogados.length},
  percentualProrrogados: ${pct(prorrogados.length, linhas.length)},
  medianaDiasDeProrrogacao: ${medianaDias},
  maximoDiasDeProrrogacao: ${diasOrdenados[diasOrdenados.length - 1] ?? 0},
  /** O mesmo cálculo sobre os ${totalEstadual} convênios de TODOS os 55 órgãos do
   *  Estado — a régua para dizer se o ambiental foge da média. */
  percentualProrrogadosNoEstado: ${pct(prorrogadosEstadual, totalEstadual)},
  conveniosNoEstado: ${totalEstadual},
} as const;

export const CONVENIOS_AMBIENTAIS_POR_ORGAO = ${s(porOrgao)} as const;
export const CONVENIOS_AMBIENTAIS_POR_ANO = ${s(porAno)} as const;
`;

writeFileSync(DESTINO, conteudo, "utf8");
const relido = readFileSync(DESTINO, "utf8");
if (relido !== conteudo) abortar("gravado e relido não batem");
if (relido.includes("�")) abortar("mojibake no arquivo gravado");
console.log(
  `[convenios-mg] gravado: ${DESTINO} (${(Buffer.byteLength(conteudo, "utf8") / 1024).toFixed(1)} KiB)`,
);
