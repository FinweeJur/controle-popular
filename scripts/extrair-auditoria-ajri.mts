/**
 * Extrai o catálogo da **auditoria socioambiental independente (AECOM)** do
 * Acordo Judicial de Reparação Integral de Brumadinho para
 * `apps/web/lib/paraopeba/auditoria-ajri.ts`.
 *
 * Primo de `scripts/extrair-clipping-ij.mts`: mesma disciplina (medir antes de
 * gravar, abortar em vez de escrever torto, reler o arquivo do disco para
 * conferir acentuação). O que muda é a fonte — lá era literal JS dentro de um
 * HTML entregue à mão, aqui é o JSON que `scripts/coletor_auditoria.py`
 * produz raspando `portal.auditoriasocioambiental.com.br/documents`.
 *
 * ═══ POR QUE O JSON NÃO É VERSIONADO ═══
 *
 * O acervo versionado é o `.ts` gerado. Guardar o JSON ao lado dele criaria
 * DUAS cópias do mesmo acervo no repositório — e a lição de `docs/HANDOFF-
 * PAINEL-PARAOPEBA-PAGINAS-PERDIDAS.md` (§0) é exatamente essa: quando existem
 * duas cópias, alguém acaba editando a que não está publicada. A proveniência
 * fica garantida pelo par que ESTÁ versionado: `scripts/coletor_auditoria.py`
 * (regenera o JSON, exige cookie de sessão) e `docs/FONTES-AUDITORIA-AJRI.md`
 * (o mapa de rotas e facetas do portal).
 *
 * ═══ AS SEIS ARMADILHAS DESTA FONTE ═══
 *
 * 1. **O rótulo do tema vem com a contagem colada.** O portal renderiza a
 *    faceta como `Qualidade da Água 229` — nome + número de documentos. Gravar
 *    isso como tema criaria 27 temas cujo nome muda sozinho na próxima coleta.
 *    O número é separado do nome — e vira TRAVA: o script confere que os 229
 *    documentos com aquele rótulo realmente existem no arquivo. Se a coleta
 *    tivesse parado numa página, a faceta diria 229 e o catálogo teria menos.
 *    Medido em 15/08/2026: 27 de 27 rótulos batem.
 *
 * 2. **Há temas duplicados com grafias diferentes.** `Risco Saúde Pública` e
 *    `Risco Saúde Publica` (sem acento) são a MESMA faceta partida em duas no
 *    cadastro do portal, e `Segurança do Alimento` aparece duas vezes com o
 *    mesmo nome e ids diferentes. Normalizar por slug sem acento funde as
 *    duas; o rótulo exibido é a grafia MAIS FREQUENTE, não a primeira que
 *    aparece — senão 3 documentos decidiriam o nome que 79 usam.
 *
 * 3. **Autor, `url_pagina` e `url_download` são constantes ou derivados.** Os
 *    467 documentos têm autor `AECOM`, apontam para a MESMA `url_pagina` (o
 *    repositório) e a `url_download` é sempre `/documents/{id}/download_cover`.
 *    Gravar as três colunas repetiria ~45 KB de texto idêntico no payload da
 *    rota — que é o defeito que travou o deploy em 15/08 (`docs/HANDOFF-
 *    PAYLOAD-LEGISLACAO.md`). Viram constante e função, e o script ABORTA se
 *    um único registro fugir do padrão. Nada é assumido: é conferido.
 *
 * 4. **`codigo` contém `projeto`, `originador`, `disciplina`, `seq` e `ano`.**
 *    O script confere que as oito partes do código reconstroem os campos
 *    soltos — se divergirem, o coletor mudou e a gravação para. Só `projeto`,
 *    `disciplina` e `ano` atravessam como campo próprio (são os recortes que a
 *    tela usa); `originador` e `seq` continuam legíveis dentro de `codigo`.
 *
 * 5. **`ano` nem sempre é um número, e nem sempre é o ano da data.** Um
 *    documento traz `2024_R01` (revisão 01 de um relatório de 2024) e três têm
 *    ano de código diferente do ano da data de publicação. `ano` é o ano de
 *    REFERÊNCIA do documento, não a data — por isso é `string`, e por isso o
 *    filtro de período da tela usa `data`, nunca `ano`.
 *
 * 6. **Acentuação.** O JSON é UTF-8; a leitura é explícita e há varredura de
 *    mojibake (`Ã` sem maiúscula depois, U+FFFD) no dado lido E no arquivo já
 *    gravado, lido de novo do disco — erro de encoding nasce na escrita, não
 *    só na leitura.
 *
 * ═══ O QUE ESTE SCRIPT NÃO FAZ ═══
 *
 * Não baixa PDF. O `download_cover` é gerado sob demanda pelo portal, exige
 * sessão autenticada e sai com marca d'água — ver `docs/PLANO-ESPELHO-PDF-
 * AJRI.md`, que é a fase 2. Esta entrega é catálogo + link, que é o que os
 * Termos de Uso do portal permitem sem ressalva.
 *
 * Uso:
 *   npx tsx scripts/extrair-auditoria-ajri.mts            # grava
 *   npx tsx scripts/extrair-auditoria-ajri.mts --conferir # só mede, não grava
 *   npx tsx scripts/extrair-auditoria-ajri.mts --fonte=CAMINHO/catalogo.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Saída de `scripts/coletor_auditoria.py`. Fora do git — ver cabeçalho. */
const FONTE_PADRAO = resolve(RAIZ, ".tmp-fontes/catalogo_auditoria_socioambiental.json");
const DESTINO = resolve(RAIZ, "apps/web/lib/paraopeba/auditoria-ajri.ts");

const SO_CONFERIR = process.argv.includes("--conferir");
const FONTE =
  process.argv.find((a) => a.startsWith("--fonte="))?.slice("--fonte=".length) ?? FONTE_PADRAO;

/** Só para a prosa do cabeçalho ficar em português de gente: "391 Relatórios". */
const PLURAL: Record<string, string> = { Relatório: "Relatórios", "Nota Técnica": "Notas Técnicas" };

const PORTAL = "https://portal.auditoriasocioambiental.com.br";
const REPOSITORIO = `${PORTAL}/documents`;
const AUTOR = "AECOM";

/** Campos que o coletor entrega hoje. Campo novo aborta — ver armadilha 4. */
const CAMPOS = [
  "id",
  "codigo",
  "descricao",
  "instrumento_juridico",
  "temas",
  "tipo",
  "autor",
  "data",
  "data_br",
  "projeto",
  "originador",
  "disciplina",
  "seq",
  "ano",
  "url_pagina",
  "url_download",
] as const;

interface DocBruto {
  id: number;
  codigo: string;
  descricao: string;
  instrumento_juridico: string;
  temas: string[];
  tipo: string;
  autor: string;
  data: string;
  data_br: string;
  projeto: string;
  originador: string;
  disciplina: string;
  seq: string;
  ano: string;
  url_pagina: string;
  url_download: string;
}

/** `Relatório` → `relatorio`. O slug é a chave; o rótulo continua acentuado. */
function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Ver armadilha 6 — idêntica à de `extrair-clipping-ij.mts`, de propósito. */
function acharMojibake(texto: string): string[] {
  const achados: string[] = [];
  for (const m of texto.matchAll(/.{0,20}(?:Ã(?![A-Z])|\uFFFD).{0,20}/g)) achados.push(m[0]);
  return achados;
}

function aspas(s: string): string {
  return JSON.stringify(s);
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Ler a fonte com encoding explícito
// ─────────────────────────────────────────────────────────────────────────
if (!existsSync(FONTE)) {
  console.error(`Catálogo não encontrado em ${FONTE}`);
  console.error("Ele não é versionado (duas cópias do mesmo acervo divergem).");
  console.error("Regere com `python scripts/coletor_auditoria.py` — exige cookie de sessão.");
  process.exit(1);
}
const bruto = readFileSync(FONTE, "utf8");
const docs = JSON.parse(bruto) as DocBruto[];
console.log(`fonte: ${FONTE} (${docs.length.toLocaleString("pt-BR")} documentos)`);

// ─────────────────────────────────────────────────────────────────────────
// 2. Conferir ANTES de gravar — cada falha aborta
// ─────────────────────────────────────────────────────────────────────────
const problemas: string[] = [];

const conhecidos = CAMPOS as readonly string[];
for (const c of new Set(docs.flatMap((d) => Object.keys(d)))) {
  if (!conhecidos.includes(c)) problemas.push(`campo novo na fonte: "${c}"`);
}

/** `2026-07-31` → `31/07/2026`, para conferir o `data_br` que a fonte manda. */
const paraBr = (iso: string) => iso.split("-").reverse().join("/");

for (const d of docs) {
  const eco = `documento ${d.id ?? "?"}`;
  for (const campo of CAMPOS) {
    const v = d[campo];
    const vazio = v === undefined || v === null || (typeof v === "string" && !v.trim());
    if (vazio) problemas.push(`${eco}: campo "${campo}" vazio`);
  }
  if (!Array.isArray(d.temas) || d.temas.length === 0) problemas.push(`${eco}: sem tema`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.data)) problemas.push(`${eco}: data "${d.data}"`);
  if (d.data_br !== paraBr(d.data)) problemas.push(`${eco}: data_br "${d.data_br}" ≠ ${d.data}`);
  // Armadilha 3 — o que vira constante/função tem que ser constante de verdade.
  if (d.autor !== AUTOR) problemas.push(`${eco}: autor "${d.autor}" (esperado ${AUTOR})`);
  if (d.url_pagina !== REPOSITORIO) problemas.push(`${eco}: url_pagina "${d.url_pagina}"`);
  if (d.url_download !== `${REPOSITORIO}/${d.id}/download_cover`) {
    problemas.push(`${eco}: url_download fora do padrão — "${d.url_download}"`);
  }
  // Armadilha 4 — as oito partes do código têm que reconstruir os campos.
  const p = d.codigo.split("-");
  if (p.length !== 8) problemas.push(`${eco}: código com ${p.length} partes — "${d.codigo}"`);
  else if (
    p[0] !== d.projeto ||
    p[1] !== d.originador ||
    p[3] !== d.disciplina ||
    p[6] !== d.seq ||
    p[7] !== d.ano
  ) {
    problemas.push(`${eco}: código "${d.codigo}" não bate com os campos soltos`);
  }
}

const ids = new Set(docs.map((d) => d.id));
if (ids.size !== docs.length) problemas.push(`ids repetidos: ${docs.length - ids.size}`);
const codigos = new Set(docs.map((d) => d.codigo));
if (codigos.size !== docs.length) problemas.push(`códigos repetidos: ${docs.length - codigos.size}`);

const mojibake = acharMojibake(bruto);
if (mojibake.length) {
  problemas.push(`acentuação corrompida em ${mojibake.length} trecho(s): ${mojibake[0]}`);
}

// ── Tipos: o código carrega `RP`/`TN`, que tem que concordar com `tipo` ──
const SIGLA_DO_TIPO: Record<string, string> = { Relatório: "RP", "Nota Técnica": "TN" };
for (const d of docs) {
  const esperada = SIGLA_DO_TIPO[d.tipo];
  if (!esperada) problemas.push(`documento ${d.id}: tipo desconhecido "${d.tipo}"`);
  else if (d.codigo.split("-")[4] !== esperada) {
    problemas.push(`documento ${d.id}: tipo "${d.tipo}" mas código diz "${d.codigo.split("-")[4]}"`);
  }
}

// ── Temas: separar o nome da contagem e conferir a contagem (armadilha 1) ──
interface RotuloBruto {
  nome: string;
  facetaDoPortal: number;
  medido: number;
}
const brutosPorRotulo = new Map<string, RotuloBruto>();
for (const d of docs) {
  for (const t of d.temas) {
    const m = t.match(/^(.+?) (\d+)$/);
    if (!m) {
      problemas.push(`tema sem a contagem do portal colada: "${t}"`);
      continue;
    }
    const atual = brutosPorRotulo.get(t) ?? {
      nome: m[1].trim(),
      facetaDoPortal: Number(m[2]),
      medido: 0,
    };
    atual.medido += 1;
    brutosPorRotulo.set(t, atual);
  }
}
for (const [rotulo, r] of brutosPorRotulo) {
  if (r.facetaDoPortal !== r.medido) {
    // Coleta parcial: a faceta promete N, o arquivo entrega outro número.
    problemas.push(`tema "${rotulo}": portal diz ${r.facetaDoPortal}, arquivo tem ${r.medido}`);
  }
}

/** slug → grafias que caíram nele, com quantos documentos cada uma tem. */
const grafiasPorSlug = new Map<string, Map<string, number>>();
for (const r of brutosPorRotulo.values()) {
  const s = slug(r.nome);
  const g = grafiasPorSlug.get(s) ?? new Map<string, number>();
  g.set(r.nome, (g.get(r.nome) ?? 0) + r.medido);
  grafiasPorSlug.set(s, g);
}

/** Rótulo exibido = grafia mais frequente; desempate alfabético (armadilha 2). */
const rotuloDoSlug = new Map<string, string>();
for (const [s, g] of grafiasPorSlug) {
  const [vencedora] = [...g.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt"));
  rotuloDoSlug.set(s, vencedora[0]);
}

/**
 * Quantas facetas do portal viraram um slug só. `facetas` pode ser maior que
 * `grafias`: `Segurança do Alimento` está cadastrado DUAS vezes com o MESMO
 * nome e ids diferentes — nome igual, faceta diferente.
 */
const fusoes = [...grafiasPorSlug.entries()]
  .map(([s, g]) => {
    const brutos = [...brutosPorRotulo.keys()].filter(
      (rotulo) => slug(brutosPorRotulo.get(rotulo)!.nome) === s
    );
    return { slug: s, grafias: [...g.keys()], rotulosBrutos: brutos, facetas: brutos.length };
  })
  .filter((f) => f.facetas > 1);

/**
 * A disputa de grafia mais desigual, para o cabeçalho poder dizer com número
 * por que vence a grafia mais frequente e não a primeira que aparece.
 */
const disputaDeGrafia = fusoes
  .map((f) => [...grafiasPorSlug.get(f.slug)!.values()].sort((a, b) => b - a))
  .filter((v) => v.length > 1)
  .sort((a, b) => b[0] - a[0])[0];

const temasDoDoc = (d: DocBruto) => {
  const vistos: string[] = [];
  for (const t of d.temas) {
    const s = slug(t.replace(/ \d+$/, ""));
    if (!vistos.includes(s)) vistos.push(s);
  }
  return vistos;
};
// Documento que carregava as DUAS grafias da mesma faceta viraria tema
// repetido na ficha. Medido em 15/08/2026: nenhum. Se aparecer, é aviso.
const comTemaRepetido = docs.filter((d) => temasDoDoc(d).length !== d.temas.length);

if (problemas.length) {
  console.error("\nABORTADO — a fonte não passou na conferência:");
  for (const p of problemas.slice(0, 20)) console.error(`  · ${p}`);
  if (problemas.length > 20) console.error(`  … e mais ${problemas.length - 20}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Medir (nunca estimar) o que o cabeçalho do arquivo vai afirmar
// ─────────────────────────────────────────────────────────────────────────
const datas = docs.map((d) => d.data).sort();
const periodo = { de: datas[0], ate: datas[datas.length - 1] };

const contar = <T extends string>(chave: (d: DocBruto) => T) => {
  const m = new Map<T, number>();
  for (const d of docs) m.set(chave(d), (m.get(chave(d)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt"));
};

const porInstrumento = contar((d) => d.instrumento_juridico);
const porTipo = contar((d) => d.tipo);
const porProjeto = contar((d) => d.projeto);
const porTema = [...grafiasPorSlug.keys()]
  .map((s) => ({ slug: s, n: docs.filter((d) => temasDoDoc(d).includes(s)).length }))
  .sort((a, b) => b.n - a.n || rotuloDoSlug.get(a.slug)!.localeCompare(rotuloDoSlug.get(b.slug)!, "pt"));

const anoDivergente = docs.filter((d) => d.ano.slice(0, 4) !== d.data.slice(0, 4)).length;
const anoNaoNumerico = docs.filter((d) => !/^\d{4}$/.test(d.ano)).map((d) => d.ano);
const totalDeTemas = docs.reduce((s, d) => s + temasDoDoc(d).length, 0);

console.log(`período: ${periodo.de} → ${periodo.ate}`);
console.log(`por tipo: ${JSON.stringify(Object.fromEntries(porTipo))}`);
console.log(`por instrumento: ${JSON.stringify(Object.fromEntries(porInstrumento))}`);
console.log(`temas: ${brutosPorRotulo.size} facetas do portal → ${grafiasPorSlug.size} slugs`);
for (const f of fusoes) {
  console.log(`  fundido em "${f.slug}": ${f.facetas} facetas (${f.grafias.join(" / ")})`);
}
console.log(`documentos com tema repetido após normalizar: ${comTemaRepetido.length}`);
console.log(`ano do código ≠ ano da data: ${anoDivergente}; ano não numérico: ${anoNaoNumerico}`);

if (SO_CONFERIR) {
  console.log("\n--conferir: nada gravado.");
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Gerar o TS — nomes de campo em português, como o resto de lib/paraopeba
// ─────────────────────────────────────────────────────────────────────────
const slugInstrumento = new Map(porInstrumento.map(([rotulo]) => [rotulo, slug(rotulo)]));
const slugTipo = new Map(porTipo.map(([rotulo]) => [rotulo, slug(rotulo)]));

const uniao = (valores: string[]) => valores.map(aspas).join(" | ");
const listaDeTemas = (d: DocBruto) => `[${temasDoDoc(d).map(aspas).join(", ")}]`;

const corpo = docs
  .map(
    (d) => `  {
    id: ${d.id},
    codigo: ${aspas(d.codigo)},
    descricao: ${aspas(d.descricao)},
    instrumento: ${aspas(slugInstrumento.get(d.instrumento_juridico)!)},
    tipo: ${aspas(slugTipo.get(d.tipo)!)},
    temas: ${listaDeTemas(d)},
    data: ${aspas(d.data)},
    projeto: ${aspas(d.projeto)},
    disciplina: ${aspas(d.disciplina)},
    ano: ${aspas(d.ano)},
  },`
  )
  .join("\n");

const saida = `// GERADO por \`scripts/extrair-auditoria-ajri.mts\` a partir do catálogo que
// \`scripts/coletor_auditoria.py\` raspa de
// \`${REPOSITORIO}\`. Não editar à mão:
// rode o script de novo quando o portal publicar documento novo.
//
// ═══ O QUE É ESTE ACERVO ═══
//
// A auditoria socioambiental INDEPENDENTE prevista no Acordo Judicial de
// Reparação Integral de R$ 37,6 bilhões (04/02/2021), sobre o rompimento das
// barragens B-I, B-IV e B-IV_A da mina Córrego do Feijão, em Brumadinho. Quem
// audita é a ${AUTOR}, contratada para fiscalizar a execução do Acordo — não é
// documento da Vale nem das instituições de justiça, é o parecer de quem
// verifica os dois.
//
// São ${docs.length} documentos, de ${periodo.de} a ${periodo.ate}:
// ${porTipo.map(([rotulo, n]) => `${n} ${PLURAL[rotulo] ?? rotulo}`).join(" e ")}, todos de autoria da ${AUTOR}.
//
// ═══ CATÁLOGO E LINK, NUNCA O ARQUIVO ═══
//
// Nenhum PDF é baixado, copiado ou reservido — o mesmo veredito que
// \`biblioteca.ts\` já aplica ao acervo das ATIs, e aqui ele é ainda mais
// direto: os Termos de Uso do portal dizem textualmente que o material é
// propriedade da auditora e que não é permitido modificar nem usar
// comercialmente. Catálogo + link para a fonte oficial é integralmente
// compatível com esses termos; espelho de PDF não é, e por isso está fora
// desta entrega (ver \`docs/PLANO-ESPELHO-PDF-AJRI.md\`).
//
// A \`descricao\` de cada ficha é o texto que a ${AUTOR} escreveu, transcrito
// sem uma vírgula de edição — mesmo tratamento que \`clipping-ij.ts\` dá aos
// resumos do painel-fonte. O portal não resume, não reclassifica e não
// recalcula nada daqui.
//
// ═══ O QUE O PORTAL NÃO FAZ ═══
//
// NÃO consulta o portal da auditoria em tempo real, NÃO atualiza sozinho e NÃO
// recalcula contagem nenhuma. É um retrato datado, e \`PERIODO_AUDITORIA_AJRI\`
// existe para toda tela rotular o acervo pelo período que ele realmente cobre.
// O portal-fonte publica ~1×/mês; quando publicar, é o script que roda.
//
// ═══ TRÊS COISAS QUE NÃO ESTÃO AQUI, E POR QUÊ ═══
//
// \`autor\` (constante ${AUTOR}), a página do repositório e a URL de download
// não são colunas: os ${docs.length} registros carregariam juntos ${Math.round(
      docs.reduce((s, d) => s + d.autor.length + d.url_pagina.length + d.url_download.length, 0) /
        1024
    )} KB de
// texto repetido ou derivável do \`id\` no payload da rota — que é o defeito que travou o
// deploy em 15/08/2026 (\`docs/HANDOFF-PAYLOAD-LEGISLACAO.md\`: 4,7 MiB de texto
// viraram 35,5 MiB de payload, 7,5×). Viraram \`AUTOR_AUDITORIA_AJRI\`,
// \`FONTE_AUDITORIA_AJRI\` e \`urlDocumentoAjri()\` — e o script ABORTA se algum
// registro fugir do padrão, então a economia nunca vira suposição.
//
// ═══ OS TEMAS FORAM NORMALIZADOS POR SLUG SEM ACENTO ═══
//
// O portal expõe ${brutosPorRotulo.size} facetas de tema, e ${fusoes.length} delas são a mesma coisa cadastrada
// mais de uma vez. Normalizadas por slug sem acento, viram ${grafiasPorSlug.size} temas:
${fusoes
  .map((f) => `//   · ${f.rotulosBrutos.map((r) => `"${r}"`).join(" + ")} → \`${f.slug}\``)
  .join("\n")}
//
// (o número colado em cada rótulo é a contagem da faceta no portal, não parte
// do nome — ver a seção seguinte.)
//
// O rótulo exibido é a grafia MAIS FREQUENTE de cada slug${
      disputaDeGrafia
        ? `: se valesse a primeira
// que aparece, ${disputaDeGrafia[1]} documentos poderiam batizar o tema que ${disputaDeGrafia[0]} usam`
        : ""
    }.
//
// Nenhum documento carregava duas grafias da mesma faceta ao mesmo tempo
// (medido: ${comTemaRepetido.length}), então a fusão não mudou a contagem de ficha nenhuma.
//
// ═══ O NÚMERO COLADO NO RÓTULO VIROU PROVA DE COMPLETUDE ═══
//
// O portal renderiza a faceta como \`Qualidade da Água 229\` — o nome do tema
// mais o número de documentos que ele tem. O script separa os dois e CONFERE:
// as ${brutosPorRotulo.size} facetas somam ${totalDeTemas.toLocaleString("pt-BR")} atribuições sobre os ${grafiasPorSlug.size} temas, e cada
// faceta tem no arquivo exatamente o número que o portal anuncia. Se a coleta
// tivesse parado numa página, a conta não fecharia e a gravação teria abortado.

/** Instrumento jurídico do Acordo sob o qual a auditoria produziu o documento. */
export type InstrumentoAjri = ${uniao(porInstrumento.map(([r]) => slugInstrumento.get(r)!))};

export const INSTRUMENTO_AJRI_LABEL: Record<InstrumentoAjri, string> = {
${porInstrumento.map(([r]) => `  ${aspas(slugInstrumento.get(r)!)}: ${aspas(r)},`).join("\n")}
};

/** Ordem de exibição — por volume medido, do maior acervo para o menor. */
export const INSTRUMENTO_AJRI_ORDEM: InstrumentoAjri[] = [
${porInstrumento.map(([r]) => `  ${aspas(slugInstrumento.get(r)!)},`).join("\n")}
];

/** \`RP\` e \`TN\` no código do documento, respectivamente. */
export type TipoDocumentoAjri = ${uniao(porTipo.map(([r]) => slugTipo.get(r)!))};

export const TIPO_DOCUMENTO_AJRI_LABEL: Record<TipoDocumentoAjri, string> = {
${porTipo.map(([r]) => `  ${aspas(slugTipo.get(r)!)}: ${aspas(r)},`).join("\n")}
};

export const TIPO_DOCUMENTO_AJRI_ORDEM: TipoDocumentoAjri[] = [${porTipo
  .map(([r]) => aspas(slugTipo.get(r)!))
  .join(", ")}];

/** Tema da auditoria, já normalizado por slug sem acento — ver o cabeçalho. */
export type TemaAjri = ${uniao(porTema.map((t) => t.slug))};

export const TEMA_AJRI_LABEL: Record<TemaAjri, string> = {
${porTema.map((t) => `  ${aspas(t.slug)}: ${aspas(rotuloDoSlug.get(t.slug)!)},`).join("\n")}
};

/** Ordem de exibição — por volume medido, como os instrumentos. */
export const TEMA_AJRI_ORDEM: TemaAjri[] = [
${porTema.map((t) => `  ${aspas(t.slug)},`).join("\n")}
];

/**
 * As facetas do portal que a normalização fundiu. Fica no dado, e não só no
 * comentário, porque é o único lugar onde se vê que o cadastro da fonte tem
 * duplicata — e porque \`dados.test.ts\` trava isso.
 *
 * \`facetas\` guarda o rótulo cru do portal, com a contagem colada que ele
 * imprime junto ao nome; \`grafias\` guarda só os nomes distintos. Os dois
 * números diferem em \`seguranca-do-alimento\`: lá são duas facetas com o MESMO
 * nome, cadastradas em duplicidade — não é erro de acento, é registro dobrado.
 */
export const TEMAS_AJRI_FUNDIDOS: { slug: TemaAjri; facetas: string[]; grafias: string[] }[] = [
${fusoes
  .map(
    (f) =>
      `  {
    slug: ${aspas(f.slug)},
    facetas: [${f.rotulosBrutos.map(aspas).join(", ")}],
    grafias: [${f.grafias.map(aspas).join(", ")}],
  },`
  )
  .join("\n")}
];

export interface DocumentoAuditoriaAjri {
  /** Id nativo do portal — é ele que monta a URL de download. */
  id: number;
  /** \`60612553-ACM-DM-CO-RP-PM-0084-2026\` — projeto, originador, disciplina, tipo, sequencial, ano. */
  codigo: string;
  /** Texto da própria ${AUTOR}, transcrito sem edição. */
  descricao: string;
  instrumento: InstrumentoAjri;
  tipo: TipoDocumentoAjri;
  /** Um ou mais temas, já normalizados. Nenhum documento vem sem tema. */
  temas: TemaAjri[];
  /** ISO \`yyyy-mm-dd\`. É a data de publicação — use esta para filtrar período. */
  data: string;
  /** Fase contratual da auditoria (${porProjeto.length} projetos no acervo). */
  projeto: string;
  /** Disciplina técnica do código: \`CO\`, \`ZZ\`, \`SH\`, \`FS\`, \`A2\`… */
  disciplina: string;
  /**
   * Ano de REFERÊNCIA do documento, do código — não é o ano de \`data\`:
   * ${anoDivergente} documentos divergem, e um traz ${aspas(anoNaoNumerico[0] ?? "")} (revisão). Por isso é string.
   */
  ano: string;
}

/** Autoria de TODO o acervo, conferida registro a registro na geração. */
export const AUTOR_AUDITORIA_AJRI = ${aspas(AUTOR)};

/** Fonte oficial — citar sempre que exibir, em toda ficha. */
export const FONTE_AUDITORIA_AJRI = {
  nome: "Portal da Auditoria Socioambiental do Acordo Judicial de Reparação Integral",
  autor: ${aspas(AUTOR)},
  /** Repositório de busca do portal. Exige cadastro para abrir o documento. */
  repositorio: ${aspas(REPOSITORIO)},
  termos: ${aspas(`${PORTAL}/termos-de-uso`)},
  acordo: ${aspas(`${PORTAL}/acordos`)},
} as const;

/**
 * Link canônico do documento na fonte oficial. É o \`download_cover\` do
 * portal: ele gera o PDF sob demanda e pede sessão — a página avisa disso, em
 * vez de prometer um arquivo que abriria direto.
 */
export function urlDocumentoAjri(id: number): string {
  return \`\${FONTE_AUDITORIA_AJRI.repositorio}/\${id}/download_cover\`;
}

/** Cobertura real do acervo — usar para rotular a tela, nunca "atualizado hoje". */
export const PERIODO_AUDITORIA_AJRI = {
  de: ${aspas(periodo.de)},
  ate: ${aspas(periodo.ate)},
} as const;

export const AUDITORIA_AJRI: DocumentoAuditoriaAjri[] = [
${corpo}
];
`;

writeFileSync(DESTINO, saida, "utf8");

// Reler o que foi gravado e conferir a acentuação no disco, não na memória.
const gravado = readFileSync(DESTINO, "utf8");
const sujeira = acharMojibake(gravado);
if (sujeira.length) {
  console.error(`\nARQUIVO GRAVADO COM ACENTO CORROMPIDO: ${sujeira[0]}`);
  process.exit(1);
}
const kib = (Buffer.byteLength(gravado) / 1024).toFixed(1);
console.log(`\ngravado: ${DESTINO} (${kib} KiB)`);
