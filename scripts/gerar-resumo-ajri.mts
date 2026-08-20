/**
 * Gera `apps/web/lib/paraopeba/resumo-ajri.ts` a partir dos 337 resumos
 * auditados que vivem em `X:\DevCoder\_ajri\resumo\` — o entregável de dados
 * da fase de conteúdo da auditoria AECOM (ver `PROMPT-HANDOFF-INTEGRACAO.md`
 * naquela pasta). Primo de `scripts/extrair-auditoria-ajri.mts`: mesma
 * disciplina (medir antes de gravar, abortar em vez de escrever torto, reler
 * o arquivo do disco para conferir acentuação).
 *
 * ═══ POR QUE A FONTE FICA FORA DO REPO ═══
 *
 * A mesma decisão que o repo já tomou para `painel-paraopeba.html` e para o
 * catálogo raspado do portal: dados de trabalho de uso único não são
 * versionados ao lado do arquivo gerado, senão existem DUAS cópias do mesmo
 * acervo e alguém acaba editando a que não está publicada. O que é
 * versionado é só o `.ts` gerado + este script.
 *
 * ═══ O QUE ESTE SCRIPT CONFERE (E POR QUÊ) ═══
 *
 * Os 337 resumos passaram por 3 passadas de crítico automatizado + 1 rede de
 * segurança determinística na fase de conteúdo — a auditoria do CONTEÚDO não
 * se repete aqui. O que este script faz é impedir que a INTEGRAÇÃO
 * reescreva, corte ou misture nada:
 *
 * 1. **O schema do `validar.py` do acervo** (`scripts/validar.py` em
 *    `X:\DevCoder\_ajri\`): as 11 chaves presentes, `veredito` no enum,
 *    `citacao` obrigatória quando o veredito é afirmado, palavra severa na
 *    citação quando o veredito é `insatisfatorio`, blocos de `resumo` com
 *    título e texto. Quem não passa no `validar.py` não passa aqui.
 * 2. **Paridade com o catálogo**: todo `codigo` de resumo tem que existir em
 *    `auditoria-ajri.ts` (são 337 de 467 — o resto nunca foi baixado). Um
 *    resumo de documento que não está no catálogo publicaria uma ficha sem
 *    link; um resumo repetido seria um registro dobrado.
 * 3. **O nome do arquivo tem que ser o `codigo`**: é a identidade pública do
 *    documento, e é por ele que a ficha faz a busca (`RESUMO_AJRI[codigo]`).
 * 4. **Acentuação**: varredura de mojibake no dado lido E no arquivo gravado,
 *    relido do disco — erro de encoding nasce na escrita, não só na leitura.
 *
 * ═══ POR QUE O RESUMO É OBRA NOVA (E O ESPELHO DE PDF NÃO É) ═══
 *
 * Os Termos de Uso do portal-fonte proíbem modificar e usar comercialmente o
 * material da AECOM; por isso o espelho de PDF ficou de fora
 * (`docs/planos/PLANO-ESPELHO-PDF-AJRI.md`) e o catálogo é só metadado +
 * link. O resumo é paráfrase em linguagem comum escrita por este projeto a
 * partir do documento, com a `citacao` literal travada contra o texto-fonte
 * — é obra nova sobre obra alheia, não modificação. Essa leitura é a base
 * desta entrega, mas a decisão final de publicar é do dono (ver o cabeçalho
 * do arquivo gerado).
 *
 * Uso:
 *   npx tsx scripts/gerar-resumo-ajri.mts            # grava
 *   npx tsx scripts/gerar-resumo-ajri.mts --conferir # só mede, não grava
 *   npx tsx scripts/gerar-resumo-ajri.mts --fonte=CAMINHO/outra-pasta
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Fora do repo, de propósito — ver o cabeçalho. */
const FONTE_PADRAO = resolve("X:\\DevCoder\\_ajri\\resumo");
const DESTINO = resolve(RAIZ, "apps/web/lib/paraopeba/resumo-ajri.ts");
const CATALOGO = resolve(RAIZ, "apps/web/lib/paraopeba/auditoria-ajri.ts");

const SO_CONFERIR = process.argv.includes("--conferir");
const FONTE =
  process.argv.find((a) => a.startsWith("--fonte="))?.slice("--fonte=".length) ?? FONTE_PADRAO;

/** As 11 chaves que o `validar.py` do acervo exige. Campo novo também aborta. */
const CHAVES = [
  "codigo",
  "periodo",
  "objeto",
  "quem_participou",
  "reunioes",
  "veredito",
  "citacao",
  "constatacoes",
  "pendencias",
  "numeros",
  "resumo",
] as const;

const VEREDITOS = ["satisfatorio", "com-ressalvas", "insatisfatorio", "nao-declarado"] as const;

/**
 * Se o veredito é severo, a citação tem que carregar a palavra que o
 * justifica — idêntico ao `SEVERO` de `validar.py`, de propósito.
 */
const SEVERO = ["insatisfat", "inadequad", "não atende", "nao atende", "incompatív", "incompativ"];

/** Ver `extrair-auditoria-ajri.mts`, armadilha 6 — idêntica, de propósito. */
function acharMojibake(texto: string): string[] {
  const achados: string[] = [];
  for (const m of texto.matchAll(/.{0,20}(?:Ã(?![A-Z])|\uFFFD).{0,20}/g)) achados.push(m[0]);
  return achados;
}

function aspas(s: string): string {
  return JSON.stringify(s);
}

interface ResumoBruto {
  [chave: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Ler a fonte com encoding explícito
// ─────────────────────────────────────────────────────────────────────────
if (!existsSync(FONTE)) {
  console.error(`Resumos não encontrados em ${FONTE}`);
  console.error("Eles não são versionados (duas cópias do mesmo acervo divergem).");
  console.error("A pasta é o entregável de conteúdo: 337 arquivos .json, um por documento.");
  process.exit(1);
}

const arquivos = readdirSync(FONTE).filter((a) => a.endsWith(".json")).sort();
console.log(`fonte: ${FONTE} (${arquivos.length} resumos)`);

// ─────────────────────────────────────────────────────────────────────────
// 2. Conferir ANTES de gravar — cada falha aborta
// ─────────────────────────────────────────────────────────────────────────
const problemas: string[] = [];

/**
 * `null` ou `{de, ate}` — o mesmo porteiro de `validar.py` do acervo. A única
 * regra extra aqui é de forma, não de conteúdo: `de` é sempre ISO de 10
 * dígitos; `ate` é ISO de 10 ou `null` (nota técnica sem fim declarado na
 * capa — medido em 20/08/2026, só `ate` assume `null`, nunca `de`).
 */
function periodoOk(p: unknown): boolean {
  if (p === null) return true;
  if (typeof p !== "object") return false;
  const o = p as { de?: unknown; ate?: unknown };
  return (
    typeof o.de === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(o.de) &&
    (o.ate === null || (typeof o.ate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.ate)))
  );
}

for (const arquivo of arquivos) {
  const caminho = join(FONTE, arquivo);
  const bruto = readFileSync(caminho, "utf8");
  const mojibake = acharMojibake(bruto);
  if (mojibake.length) problemas.push(`${arquivo}: acentuação corrompida (${mojibake[0]})`);

  let d: ResumoBruto;
  try {
    d = JSON.parse(bruto) as ResumoBruto;
  } catch (e) {
    problemas.push(`${arquivo}: ilegível — ${(e as Error).message}`);
    continue;
  }

  const eco = basename(arquivo, ".json");
  if (d.codigo !== eco) problemas.push(`${arquivo}: codigo interno "${d.codigo}" ≠ nome do arquivo`);
  if (d.codigo !== undefined && !/^[A-Z0-9-]{10,}$/.test(String(d.codigo))) {
    problemas.push(`${arquivo}: codigo fora do formato — "${d.codigo}"`);
  }

  for (const chave of CHAVES) {
    if (!(chave in d)) problemas.push(`${arquivo}: falta a chave "${chave}"`);
  }
  if (!periodoOk(d.periodo)) problemas.push(`${arquivo}: periodo malformado`);
  if (!VEREDITOS.includes(d.veredito as (typeof VEREDITOS)[number])) {
    problemas.push(`${arquivo}: veredito inválido "${String(d.veredito)}"`);
  }
  if (d.veredito !== "nao-declarado" && !d.citacao) {
    problemas.push(`${arquivo}: veredito "${String(d.veredito)}" sem citacao`);
  }
  if (d.veredito === "insatisfatorio") {
    const c = String(d.citacao ?? "").toLowerCase();
    if (!SEVERO.some((s) => c.includes(s))) {
      problemas.push(`${arquivo}: veredito insatisfatorio mas a citacao não traz a palavra`);
    }
  }
  if (!Array.isArray(d.resumo) || d.resumo.length === 0) problemas.push(`${arquivo}: resumo vazio`);
  else {
    for (const b of d.resumo) {
      const bloco = b as { titulo?: unknown; texto?: unknown };
      if (!bloco.titulo || !bloco.texto) problemas.push(`${arquivo}: bloco de resumo sem titulo ou texto`);
    }
  }
  if (!Array.isArray(d.quem_participou)) problemas.push(`${arquivo}: quem_participou ausente`);
  else {
    for (const i of d.quem_participou) {
      const inst = i as { sigla?: unknown; nome?: unknown; pessoas?: unknown };
      if (typeof inst.sigla !== "string" || typeof inst.nome !== "string" || !Array.isArray(inst.pessoas)) {
        problemas.push(`${arquivo}: participante fora do schema (${String(inst.sigla)})`);
      } else {
        for (const p of inst.pessoas) {
          const pessoa = p as { nome?: unknown; cargo?: unknown };
          if (typeof pessoa.nome !== "string" || typeof pessoa.cargo !== "string") {
            problemas.push(`${arquivo}: pessoa fora do schema`);
          }
        }
      }
    }
  }
  if (!Array.isArray(d.reunioes)) problemas.push(`${arquivo}: reunioes ausente`);
  else {
    for (const e of d.reunioes) {
      const r = e as { data?: unknown; assunto?: unknown };
      // Só o mês quando o documento não dá o dia (ex.: "sessão técnica de agosto
      // de 2021" em 60622935-ACM-DM-ZZ-TN-PM-0004-2021) — nunca inventar dia.
      if (typeof r.assunto !== "string" || typeof r.data !== "string" || !/^(?:\d{4}-\d{2}-\d{2}|\d{4}-\d{2})$/.test(r.data)) {
        problemas.push(`${arquivo}: reuniao fora do schema ("${String(r.data)}")`);
      }
    }
  }
  if (!Array.isArray(d.constatacoes) || d.constatacoes.some((c) => typeof c !== "string")) {
    problemas.push(`${arquivo}: constatacoes fora do schema`);
  }
  if (!Array.isArray(d.pendencias) || d.pendencias.some((c) => typeof c !== "string")) {
    problemas.push(`${arquivo}: pendencias fora do schema`);
  }
  if (!Array.isArray(d.numeros)) problemas.push(`${arquivo}: numeros ausente`);
  else {
    for (const n of d.numeros) {
      const num = n as { o_que?: unknown; valor?: unknown };
      if (typeof num.o_que !== "string" || typeof num.valor !== "string") {
        problemas.push(`${arquivo}: numero fora do schema (o_que=${String(num.o_que)}, valor=${String(num.valor)})`);
      }
    }
  }
}

const codigos = arquivos.map((a) => basename(a, ".json"));
const unicos = new Set(codigos);
if (unicos.size !== codigos.length) problemas.push(`codigos repetidos: ${codigos.length - unicos.size}`);

// ── Paridade com o catálogo: todo resumo tem que ter ficha e link ──
if (!existsSync(CATALOGO)) {
  problemas.push(`catálogo não encontrado em ${CATALOGO} — rode extrair-auditoria-ajri.mts antes`);
} else {
  const catalogoBruto = readFileSync(CATALOGO, "utf8");
  const catalogo = new Set(
    [...catalogoBruto.matchAll(/codigo: "([^"]+)"/g)].map((m) => m[1])
  );
  if (catalogo.size === 0) problemas.push("catálogo sem códigos legíveis — arquivo corrompido?");
  for (const c of codigos) {
    if (!catalogo.has(c)) problemas.push(`resumo "${c}" não existe no catálogo de 467`);
  }
}

if (problemas.length) {
  console.error("\nABORTADO — a fonte não passou na conferência:");
  for (const p of problemas.slice(0, 20)) console.error(`  · ${p}`);
  if (problemas.length > 20) console.error(`  … e mais ${problemas.length - 20}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Medir (nunca estimar) o que o cabeçalho do arquivo vai afirmar
// ─────────────────────────────────────────────────────────────────────────
const resumos = codigos.map((c) => JSON.parse(readFileSync(join(FONTE, `${c}.json`), "utf8")));
const catalogoBruto = readFileSync(CATALOGO, "utf8");
const catalogoCount = new Set([...catalogoBruto.matchAll(/codigo: "([^"]+)"/g)].map((m) => m[1])).size;
const semResumo = catalogoCount - resumos.length;
const bytesFonte = resumos.reduce(
  (s, r) => s + Buffer.byteLength(JSON.stringify(r), "utf8"),
  0
);

const contar = <T extends string>(chave: (r: ResumoBruto) => T) => {
  const m = new Map<T, number>();
  for (const r of resumos) m.set(chave(r), (m.get(chave(r)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt"));
};
const porVeredito = contar((r) => r.veredito as string);
const semPeriodo = resumos.filter((r) => r.periodo === null).length;
const comCitacao = resumos.filter((r) => r.citacao).length;

console.log(`catálogo: ${catalogoCount} documentos · resumos: ${resumos.length} · sem resumo: ${semResumo}`);
console.log(`por veredito: ${JSON.stringify(Object.fromEntries(porVeredito))}`);
console.log(`sem periodo: ${semPeriodo} · com citacao: ${comCitacao}`);

if (SO_CONFERIR) {
  console.log("\n--conferir: nada gravado.");
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Gerar o TS — record chaveado por `codigo`, como o resto de lib/paraopeba
// ─────────────────────────────────────────────────────────────────────────
const listaDeStrings = (v: unknown[]) => `[${v.map((s) => aspas(String(s))).join(", ")}]`;

const participantes = (v: unknown) =>
  `[${(v as { sigla: string; nome: string; pessoas: { nome: string; cargo: string }[] }[])
    .map(
      (i) =>
        `{ sigla: ${aspas(i.sigla)}, nome: ${aspas(i.nome)}, pessoas: [${i.pessoas
          .map((p) => `{ nome: ${aspas(p.nome)}, cargo: ${aspas(p.cargo)} }`)
          .join(", ")}] }`
    )
    .join(", ")}]`;

const reunioes = (v: unknown) =>
  `[${(v as { data: string; assunto: string }[])
    .map((e) => `{ data: ${aspas(e.data)}, assunto: ${aspas(e.assunto)} }`)
    .join(", ")}]`;

const numeros = (v: unknown) =>
  `[${(v as { o_que: string; valor: string }[])
    .map((n) => `{ o_que: ${aspas(n.o_que)}, valor: ${aspas(n.valor)} }`)
    .join(", ")}]`;

const blocos = (v: unknown) =>
  `[${(v as { titulo: string; texto: string }[])
    .map((b) => `{ titulo: ${aspas(b.titulo)}, texto: ${aspas(b.texto)} }`)
    .join(", ")}]`;

const corpo = resumos
  .map(
    (r) => `  ${aspas(String(r.codigo))}: {
    codigo: ${aspas(String(r.codigo))},
    periodo: ${
      r.periodo === null
        ? "null"
        : `{ de: ${aspas((r.periodo as { de: string }).de)}, ate: ${
            (r.periodo as { ate: string | null }).ate === null
              ? "null"
              : aspas((r.periodo as { ate: string }).ate)
          } }`
    },
    objeto: ${aspas(String(r.objeto))},
    quem_participou: ${participantes(r.quem_participou)},
    reunioes: ${reunioes(r.reunioes)},
    veredito: ${aspas(String(r.veredito))},
    citacao: ${r.citacao === null ? "null" : aspas(String(r.citacao))},
    constatacoes: ${listaDeStrings(r.constatacoes as unknown[])},
    pendencias: ${listaDeStrings(r.pendencias as unknown[])},
    numeros: ${numeros(r.numeros)},
    resumo: ${blocos(r.resumo)},
  },`
  )
  .join("\n");

const vereditoUniao = VEREDITOS.map(aspas).join(" | ");

const saida = `// GERADO por \`scripts/gerar-resumo-ajri.mts\` a partir dos ${resumos.length} resumos
// auditados que vivem em \`X:\\DevCoder\\_ajri\\resumo\\\` (fora do repo, de propósito —
// dados de trabalho não são versionados ao lado do arquivo gerado). Não editar
// à mão: rode o script de novo quando a fase de conteúdo entregar resumo novo.
//
// ═══ O QUE É ESTE ARQUIVO ═══
//
// O resumo, em linguagem comum, de ${resumos.length} dos ${catalogoCount} documentos da auditoria
// socioambiental independente (AECOM) do Acordo Judicial de Reparação Integral
// de Brumadinho. Os ${semResumo} sem resumo nunca foram baixados na fase de conteúdo —
// a ficha deles segue como antes (catálogo + link).
//
// O resumo é OBRA NOVA deste projeto, não o texto da AECOM: paráfrase em
// linguagem comum, quebrada em blocos com título, com a \`citacao\` literal que
// sustenta cada veredito — e só veredito quando a AECOM escreve o veredito
// textualmente (${
      porVeredito
        .map(([v, n]) => `${n} ${v}`)
        .join(", ")
    }). As regras de conteúdo estão em \`X:\\DevCoder\\_ajri\\RUBRICA.md\` e foram
// verificadas contra o texto-fonte em 3 passadas de crítico + rede de
// segurança determinística na fase de conteúdo; este script revalida o schema
// (mesmo \`validar.py\`) e a paridade com o catálogo antes de gravar.
//
// ═══ OBRA NOVA × ESPELHO DE PDF — A DECISÃO QUE AINDA É DO DONO ═══
//
// Os Termos de Uso do portal-fonte proíbem modificar e usar comercialmente o
// material da AECOM — por isso o espelho de PDF ficou fora desta entrega
// (\`docs/planos/PLANO-ESPELHO-PDF-AJRI.md\`) e \`descricao\` continua transcrita
// sem edição. A leitura adotada aqui é que o resumo é obra nova (paráfrase
// com citação travada), não modificação — mas a decisão final de PUBLICAR
// este arquivo é do dono, registrada em pendência. Até lá, o dado pode
// existir no repositório; a tela é que decide quando mostrar.
//
// ═══ POR QUE ARQUIVO SEPARADO, E SÓ NO CLIENTE ═══
//
// Os ${resumos.length} resumos somam ${(bytesFonte / 1048576).toFixed(2)} MiB de JSON —
// colocar isso no array do catálogo (336 KiB) faria toda ficha do acervo
// carregar o peso dos 337, e o defeito que travou o deploy em 15/08/2026
// (\`docs/_historico/HANDOFF-PAYLOAD-LEGISLACAO.md\`: 4,7 MiB de texto viraram
// 35,5 MiB de payload, 7,5×) é exatamente esse. Vive aqui, em record chaveado
// por \`codigo\`, e é importado SÓ pelo componente de cliente
// (\`AuditoriaClient.tsx\`) — vira chunk de JS compartilhado, nunca prop de
// rota nem leitura de servidor. Se um dia virar rotina servidor, é este
// arquivo que precisa de fatia por-ficha antes.

/** O veredito que a AECOM escreveu — só existe quando ela escreve. */
export type VereditoAjri = ${vereditoUniao};

export const VEREDITO_AJRI_LABEL: Record<VereditoAjri, string> = {
  "satisfatorio": "Satisfatório",
  "com-ressalvas": "Com ressalvas",
  "insatisfatorio": "Insatisfatório",
  "nao-declarado": "Não declarado",
};

/** Uma pessoa nomeada no exercício de função pública ou de gestão do contrato. */
export interface PessoaAjri {
  nome: string;
  cargo: string;
}

/** Uma instituição que participou do ciclo, com quem o documento nomeia. */
export interface ParticipanteAjri {
  sigla: string;
  nome: string;
  pessoas: PessoaAjri[];
}

/** Encontro datado dentro do período examinado — ver RUBRICA.md.
 * \`data\` é "AAAA-MM-DD"; vira "AAAA-MM" (só mês) quando o documento não dá o
 * dia — renderizar como "agosto de 2021", nunca como dia 1. */
export interface ReuniaoAjri {
  data: string;
  assunto: string;
}

/** Só número que está escrito no documento — nenhum é calculado. */
export interface NumeroAjri {
  o_que: string;
  valor: string;
}

/** Bloco com título curto (2–5 palavras) e parágrafo de 2–4 frases. */
export interface BlocoResumoAjri {
  titulo: string;
  texto: string;
}

/** O resumo em linguagem comum de um documento — obra nova, ver o cabeçalho. */
export interface ResumoAjri {
  codigo: string;
  /**
   * O período que o documento examinou; \`null\` quando a capa não declara.
   * \`ate\` pode ser \`null\` sozinho: nota técnica sem fim declarado.
   */
  periodo: { de: string; ate: string | null } | null;
  objeto: string;
  quem_participou: ParticipanteAjri[];
  reunioes: ReuniaoAjri[];
  veredito: VereditoAjri;
  /** O trecho literal que sustenta o veredito; \`null\` no não-declarado. */
  citacao: string | null;
  constatacoes: string[];
  pendencias: string[];
  numeros: NumeroAjri[];
  resumo: BlocoResumoAjri[];
}

/**
 * Cobertura literal, para páginas SERVIDOR mostrarem número sem importar o
 * record inteiro — mesma doutrina de \`COBERTURA_AUDITORIA_AJRI\`. A paridade
 * com o record é travada em \`dados.test.ts\`.
 */
export const COBERTURA_RESUMO_AJRI = {
  total: ${resumos.length},
  semResumo: ${semResumo},
} as const;

/** Chaveado por \`codigo\` — a ficha busca \`RESUMO_AJRI[doc.codigo]\`. */
export const RESUMO_AJRI: Record<string, ResumoAjri> = {
${corpo}
};
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
console.log(`\ngravado: ${DESTINO} (${kib} KiB bruto)`);
console.log(`referência de payload: ${(bytesFonte / 1048576).toFixed(2)} MiB de JSON-fonte em ${(Buffer.byteLength(gravado) / 1048576).toFixed(2)} MiB de TS`);

// O gzip é a régua que o Cloudflare usa — medido na hora, não estimado.
import { gzipSync } from "node:zlib";
const gz = gzipSync(gravado);
console.log(`gzip: ${(gz.length / 1024).toFixed(1)} KiB — teto de asset 25 MiB, teto de Worker 3 MiB`);