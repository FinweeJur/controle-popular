/**
 * Gera o índice estático de `/busca` a partir do Postgres local e grava os
 * três grupos fatiados em `public/busca-indice/**` (ver `lib/busca/indice.ts`
 * para o formato de `IndiceBusca`, e `lib/estatico/emitir.ts` para o formato
 * de arquivo).
 *
 * ═══ COMO RODAR ═══
 *
 *     cd apps/web
 *     npx tsx --env-file=.env.local scripts/gerar-indice-busca.mts
 *
 * `--env-file` é necessário: ao contrário do Next (que lê `.env.local`
 * sozinho), `tsx` cru não carrega nada — sem a flag, `getDb()` devolve
 * `null` silenciosamente e o script grava um índice vazio, sem erro. O
 * banco é SEMPRE o Postgres local (`127.0.0.1`), nunca a Neon — mesma regra
 * de `docs/worktrees.md`.
 *
 * ═══ POR QUE ISTO RODA MANUAL, E NÃO NO `prebuild` ═══
 *
 * `package.json` está fora do território desta frente (`docs/worktrees.md`)
 * — não dá para acrescentar um passo ao `prebuild`. Quem publica o site
 * precisa rodar este script ANTES de `next build`/`next export`. O diretório
 * gerado (`public/busca-indice/**`) fica de fora do git (é artefato de
 * build, mesma categoria de `.next/`/`out/`) — regenerar é rodar de novo.
 *
 * ═══ O QUE ENTRA NO ÍNDICE ═══
 *
 * O corpus-base é `atos_oficiais.ementa`, `proposicoes.ementa` (municipal),
 * `congresso.proposicoes.ementa` (+ `keywords`), mais `judiciario.tribunais`
 * (sigla+nome) e `judiciario.magistrados` (nome). NÃO indexamos ementa
 * inteira de norma nenhuma a mais que isso — ementa livre continua vindo só
 * do `to_tsvector` do Postgres, sem gambiarra em JS.
 *
 * O que ENTRA A MAIS, e por que não é a mesma coisa que "indexar título":
 * cada documento ganha até dois lexemas PRÓPRIOS — o número da própria
 * proposição/ato (`"4793"`) e, quando existe abreviação de tipo conhecida
 * (`"pl"`, `"pdl"`...), essa sigla — ver `ABREV_TIPO_PROPOSICAO_MUNICIPAL`/
 * `abreviacoesCongresso` em `lib/busca/gerador.ts`. Isto NÃO é o que a versão
 * antiga descartava: aquilo era "buscar número solto acha qualquer norma que
 * cita esse número em qualquer lugar" (bloat real — cada `numero`/`ano` de
 * TODO o acervo vira lexema, a maioria sem ninguém nunca buscar). Isto é
 * "cada documento sabe dizer o PRÓPRIO número" — custo de UM token a mais
 * por documento (~29 mil documentos, não milhares de números soltos de
 * ementa), e é exatamente o padrão que a pessoa digita de verdade
 * ("PL 4793", "Lei 1234") — placeholder de `BuscaClient.tsx` já promete
 * "PL 3611" como exemplo. Medido sem este token: a ementa da PL 4793/2026
 * de verdade (base local, 2026-08-11) NUNCA menciona "4793" — nenhum ajuste
 * em `candidatos()` acharia essa proposição buscando pelo próprio número
 * sem essa entrada dedicada.
 *
 * ═══ RADICAL VEM DO POSTGRES, NÃO DE RADICALIZADOR EM JS ═══
 *
 * Duas etapas, cada uma no banco:
 *
 * 1. OCORRÊNCIAS: para cada documento,
 *    `to_tsvector('portuguese', unaccent_immutable(texto))::text` — a MESMA
 *    expressão que os índices GIN de produção usam (migration 0046). O
 *    resultado (`'radical1':1 'radical2':3 ...`) é parseado em
 *    `lib/busca/gerador.ts:parseTsvectorLexemas` para extrair os radicais
 *    do documento — já radicalizados, já filtrados de stopword pelo próprio
 *    Postgres.
 * 2. FORMAS: o vocabulário de superfície (palavra como o navegador vai
 *    tokenizar o que a pessoa digitar — `separarPalavras()`, a MESMA função
 *    que roda no cliente) é coletado de todas as ementas, e resolvido em
 *    UMA ÚNICA consulta em lote:
 *    `select f, (ts_lexize('portuguese_stem', f))[1] from unnest($1::text[])
 *    as f` — sem essa etapa, "iluminação" (digitado) nunca acharia
 *    "iluminaca" (radical no acervo), porque `ts_lexize` sobre texto AINDA
 *    acentuado dá um radical DIFERENTE (medido: `ilumin`, não `iluminaca`)
 *    — daí a ordem "unaccent primeiro" valer nos dois lados.
 */

import { readFileSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { getDb } from "../lib/db/client.js";
import { listarCidades } from "../lib/db/queries/municipios.js";
import { separarPalavras } from "../lib/busca/normalizar.js";
import type { DocumentoIndexado } from "../lib/busca/indice.js";
import {
  parseTsvectorLexemas,
  truncarEmenta,
  montarTituloMunicipal,
  construirVocabulario,
  construirFormas,
  ABREV_TIPO_PROPOSICAO_MUNICIPAL,
  abreviacoesCongresso,
  numeroCongresso,
} from "../lib/busca/gerador.js";
import { TIPO_PROPOSICAO_LABELS } from "../lib/betim/vereadores.js";
import { arquivosDoIndice, arquivosDeIndiceVazio, type ArquivoIndice } from "../lib/estatico/emitir.js";
import type { ManifestoFatias } from "../lib/estatico/fatiar.js";
import { expandirArquivo, type ArquivoComunicaBR } from "../lib/comunicabr/arquivo.js";
import type { ItemComunicaBR } from "../lib/comunicabr/indicadores.js";

/** Ementa exibida/conferida por frase — texto INDEXADO (tsvector/formas) usa
 *  sempre a versão INTEIRA, não a truncada (ver `registrar` abaixo). */
const LIMITE_EMENTA = 480;

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DIR_SAIDA = path.resolve(AQUI, "../public/busca-indice");

async function gravarGrupo(nomeGrupo: string, arquivos: ArquivoIndice[]): Promise<void> {
  const dir = path.join(DIR_SAIDA, nomeGrupo);
  await mkdir(dir, { recursive: true });
  await Promise.all(arquivos.map((a) => writeFile(path.join(dir, a.nome), a.conteudo, "utf8")));
}

function resumoDoGrupo(arquivos: ArquivoIndice[]): { fatias: number; bytes: number; linhas: number } {
  const manifesto = JSON.parse(arquivos[0].conteudo) as ManifestoFatias;
  return {
    fatias: manifesto.fatias,
    bytes: manifesto.bytesPorFatia.reduce((a, b) => a + b, 0),
    linhas: manifesto.total,
  };
}

async function main() {
  await rm(DIR_SAIDA, { recursive: true, force: true });
  const db = getDb();

  if (!db) {
    console.warn(
      "[gerar-indice-busca] DATABASE_URL ausente ou banco inalcancavel — gravando indice vazio. " +
        "Rode com `npx tsx --env-file=.env.local scripts/gerar-indice-busca.mts`."
    );
    for (const grupo of ["docs", "vocabulario", "formas"]) {
      await gravarGrupo(grupo, arquivosDeIndiceVazio());
    }
    return;
  }

  const cidades = await listarCidades();
  const slugPorMunicipio = new Map(cidades.map((c) => [c.id_municipio as string, c.slug]));
  const slugPorCodigoComunica = new Map(cidades.map((c) => [c.id_municipio.slice(0, 6), c.slug]));

  const docs: Omit<DocumentoIndexado, "i">[] = [];
  const vocabEntradas: { docId: number; lexemas: string[] }[] = [];
  const superficies = new Set<string>();
  let municipiosSemSlug = 0;

  /** Registra um documento: aloca `i`, extrai radicais do `tsv` já
   *  calculado pelo Postgres, e coleta as formas de superfície do MESMO
   *  texto que gerou o `tsv` (garante que `formas`/`ocorrencias` descrevem
   *  exatamente o mesmo corpo).
   *
   *  `extras`: lexemas PRÓPRIOS do documento que não vêm da ementa — número
   *  da proposição/ato, abreviação de tipo (`abreviacoesCongresso`,
   *  `ABREV_TIPO_PROPOSICAO_MUNICIPAL`). Passam direto, sem stemming: já são
   *  a forma final (número não tem radical, sigla é sigla), e o lote de
   *  `ts_lexize` mais abaixo confirma isso pra cada uma (ver cabeçalho do
   *  arquivo). `new Set` deduplica o caso raro de a ementa já conter o
   *  mesmo número/sigla — sem isso o documento apareceria duas vezes em
   *  `ocorrencias` para o mesmo lexema. */
  function registrar(
    doc: Omit<DocumentoIndexado, "i">,
    textoIndexavel: string,
    tsv: string,
    extras: string[] = []
  ): void {
    const i = docs.length;
    docs.push(doc);
    vocabEntradas.push({ docId: i, lexemas: [...new Set([...parseTsvectorLexemas(tsv), ...extras])] });
    for (const palavra of separarPalavras(textoIndexavel)) superficies.add(palavra);
    for (const extra of extras) superficies.add(extra);
  }

  // ─────────────────────────── atos_oficiais ───────────────────────────
  type LinhaAto = {
    id_municipio: string;
    tipo: string | null;
    numero: string | null;
    ano: number | null;
    ementa: string | null;
    data: string | null;
    temas: string[] | null;
    link_fonte: string | null;
    tsv: string;
  };
  const atos =
    (
      await db.execute<LinhaAto>(sql`
        select a.id_municipio as id_municipio, a.tipo as tipo, a.numero as numero,
               a.ano as ano, a.ementa as ementa, a.data_publicacao::text as data,
               a.temas as temas, a.link_fonte as link_fonte,
               to_tsvector('portuguese', public.unaccent_immutable(coalesce(a.ementa, '')))::text as tsv
          from atos_oficiais a
      `)
    ).rows ?? [];
  for (const r of atos) {
    const slug = slugPorMunicipio.get(r.id_municipio);
    if (!slug) {
      municipiosSemSlug++;
      continue;
    }
    const tema = r.temas?.[0];
    const href = tema
      ? `/${slug}/prefeitura/legislacao?tema=${encodeURIComponent(tema)}`
      : `/${slug}/prefeitura/legislacao`;
    registrar(
      {
        t: montarTituloMunicipal(r.tipo, r.numero, r.ano, "ato"),
        e: truncarEmenta(r.ementa, LIMITE_EMENTA),
        h: href,
        f: "cidades",
        m: slug,
        d: r.data ?? undefined,
        a: r.temas?.length ? r.temas : undefined,
        u: r.link_fonte ?? undefined,
      },
      r.ementa ?? "",
      r.tsv,
      r.numero?.trim() ? [r.numero.trim()] : []
    );
  }

  // ─────────────────────────── proposicoes (municipal) ───────────────────────────
  type LinhaProposicaoMunicipal = {
    id_municipio: string;
    tipo: string | null;
    numero: number | null;
    ano: number | null;
    ementa: string | null;
    data: string | null;
    temas: string[] | null;
    link_fonte: string | null;
    tsv: string;
  };
  const proposicoesMunicipais =
    (
      await db.execute<LinhaProposicaoMunicipal>(sql`
        select p.id_municipio as id_municipio, p.tipo as tipo, p.numero as numero,
               p.ano as ano, p.ementa as ementa, p.data_apresentacao::text as data,
               p.temas as temas, p.link_fonte as link_fonte,
               to_tsvector('portuguese', public.unaccent_immutable(coalesce(p.ementa, '')))::text as tsv
          from proposicoes p
      `)
    ).rows ?? [];
  for (const r of proposicoesMunicipais) {
    const slug = slugPorMunicipio.get(r.id_municipio);
    if (!slug) {
      municipiosSemSlug++;
      continue;
    }
    const tema = r.temas?.[0];
    const href = tema
      ? `/${slug}/camara/proposicoes?tema=${encodeURIComponent(tema)}`
      : `/${slug}/camara/proposicoes`;
    // `TIPO_PROPOSICAO_LABELS` traduz o slug cru do banco ("projeto_lei")
    // pro rótulo que o resto do site já usa ("Projeto de Lei") — mesmo mapa
    // de `ListaProposicoes.tsx`, não um novo. Sem isto, o card de `/busca`
    // mostrava o enum cru ("projeto_lei nº 568/2026").
    const rotulo = (r.tipo && TIPO_PROPOSICAO_LABELS[r.tipo]) || r.tipo;
    const extras = [
      r.numero !== null && r.numero !== undefined ? String(r.numero) : undefined,
      r.tipo ? ABREV_TIPO_PROPOSICAO_MUNICIPAL[r.tipo] : undefined,
    ].filter((x): x is string => Boolean(x));
    registrar(
      {
        t: montarTituloMunicipal(rotulo, r.numero, r.ano, "proposicao"),
        e: truncarEmenta(r.ementa, LIMITE_EMENTA),
        h: href,
        f: "cidades",
        m: slug,
        d: r.data ?? undefined,
        a: r.temas?.length ? r.temas : undefined,
        u: r.link_fonte ?? undefined,
      },
      r.ementa ?? "",
      r.tsv,
      extras
    );
  }

  // ─────────────────────────── congresso.proposicoes ───────────────────────────
  type LinhaCongresso = {
    id: string;
    identificacao: string | null;
    ementa: string | null;
    keywords: string | null;
    data: string | null;
    url: string | null;
    tsv: string;
  };
  const proposicoesCongresso =
    (
      await db.execute<LinhaCongresso>(sql`
        select p.id::text as id, p.identificacao as identificacao, p.ementa as ementa,
               p.keywords as keywords, p.data_apresentacao::date::text as data,
               coalesce(p.url_inteiro_teor, p.url_fonte) as url,
               to_tsvector(
                 'portuguese',
                 public.unaccent_immutable(coalesce(p.ementa, '') || ' ' || coalesce(p.keywords, ''))
               )::text as tsv
          from congresso.proposicoes p
      `)
    ).rows ?? [];
  for (const r of proposicoesCongresso) {
    const extras = [...abreviacoesCongresso(r.identificacao), numeroCongresso(r.identificacao)].filter(
      (x): x is string => Boolean(x)
    );
    registrar(
      {
        t: r.identificacao ?? "Proposição",
        e: truncarEmenta(r.ementa, LIMITE_EMENTA),
        h: `/congresso/proposicoes/${r.id}`,
        f: "congresso",
        d: r.data ?? undefined,
        u: r.url ?? undefined,
      },
      `${r.ementa ?? ""} ${r.keywords ?? ""}`,
      r.tsv,
      extras
    );
  }

  // ─────────────────────────── judiciario.tribunais ───────────────────────────
  type LinhaTribunal = {
    id: string;
    sigla: string | null;
    nome: string | null;
    url: string | null;
    tsv: string;
  };
  const tribunais =
    (
      await db.execute<LinhaTribunal>(sql`
        select t.id as id, t.sigla as sigla, t.nome as nome, t.url_composicao as url,
               to_tsvector(
                 'portuguese',
                 public.unaccent_immutable(coalesce(t.sigla, '') || ' ' || coalesce(t.nome, ''))
               )::text as tsv
          from judiciario.tribunais t
      `)
    ).rows ?? [];
  for (const r of tribunais) {
    registrar(
      {
        t: r.sigla ?? r.nome ?? "Tribunal",
        e: truncarEmenta(r.nome, LIMITE_EMENTA),
        h: `/judiciario/tribunais/${r.id.toLowerCase()}`,
        f: "judiciario",
        u: r.url ?? undefined,
      },
      `${r.sigla ?? ""} ${r.nome ?? ""}`,
      r.tsv
    );
  }

  // ─────────────────────────── judiciario.magistrados ───────────────────────────
  type LinhaMagistrado = {
    nome: string;
    url: string | null;
    subtitulo: string | null;
    tribunal_slug: string;
    tsv: string;
  };
  const magistrados =
    (
      await db.execute<LinhaMagistrado>(sql`
        select m.nome as nome, m.url_curriculo as url,
               coalesce(upper(c.tribunal_id) || ' · cadeira ' || c.numero::text, m.origem_carreira) as subtitulo,
               lower(coalesce(c.tribunal_id, 'stf')) as tribunal_slug,
               to_tsvector('portuguese', public.unaccent_immutable(coalesce(m.nome, '')))::text as tsv
          from judiciario.magistrados m
          left join judiciario.ocupacoes o on o.magistrado_id = m.id and o.atual
          left join judiciario.cadeiras c on c.id = o.cadeira_id
      `)
    ).rows ?? [];
  for (const r of magistrados) {
    registrar(
      {
        t: r.nome,
        e: truncarEmenta(r.subtitulo, LIMITE_EMENTA),
        h: `/judiciario/tribunais/${r.tribunal_slug}`,
        f: "judiciario",
        u: r.url ?? undefined,
      },
      r.nome,
      r.tsv
    );
  }

  // ─────────────────────────── comunicabr ───────────────────────────
  const comunicaBrPath = path.resolve(AQUI, "../public/data/comunicabr-31.json");
  let comunicaDocs = 0;
  try {
    const arquivoComunica = JSON.parse(readFileSync(comunicaBrPath, "utf8")) as ArquivoComunicaBR;
    const municipiosComunica = expandirArquivo(arquivoComunica);
    for (const m of municipiosComunica) {
      const cod6 = String(m.codigoIbge).padStart(6, "0");
      const slug = slugPorCodigoComunica.get(cod6);
      if (!slug) {
        municipiosSemSlug++;
        continue;
      }
      const itensComValor: ItemComunicaBR[] = [];
      for (const c of m.categorias) {
        for (const i of c.itens) {
          if (i.valor !== null) itensComValor.push(i);
        }
      }
      if (itensComValor.length === 0) continue;
      const texto = itensComValor
        .map((i) => `${i.categoria} ${i.subindicador} ${i.titulo} ${i.fonte ?? ""}`)
        .join(" ");
      const nomeExibido = m.nomeIbge.replace(/\/[A-Z]{2}$/, "");
      const fontes = [...new Set(itensComValor.map((i) => i.fonte).filter((f): f is string => Boolean(f)))].slice(0, 5);
      const ementa = `${nomeExibido}: ${itensComValor.length} indicador(es) do governo federal publicado(s) — ${fontes.join(", ")}`;
      const { rows } = await db.execute<{ tsv: string }>(sql`
        select to_tsvector('portuguese', public.unaccent_immutable(${texto}))::text as tsv
      `);
      registrar(
        {
          t: `${nomeExibido} no ComunicaBR`,
          e: truncarEmenta(ementa, LIMITE_EMENTA),
          h: `/dados/comunicabr/${cod6}`,
          f: "cidades",
          m: slug,
        },
        texto,
        rows[0]?.tsv ?? ""
      );
      comunicaDocs++;
    }
  } catch (e) {
    console.warn("[gerar-indice-busca] ComunicaBR nao indexado:", (e as Error).message);
  }

  // ─────────────────────────── formas (lote único) ───────────────────────────
  const listaSuperficies = [...superficies];
  type ParFormaRadical = { forma: string; radical: string | null };
  // `sql\`${array}\`` do drizzle interpola um array como LISTA entre
  // parênteses (pensado para `IN (...)`), não como array do Postgres —
  // `unnest(($1,$2,...)::text[])` é erro de sintaxe. `separarPalavras()`
  // só produz `[a-z0-9]+` (todo o resto já virou espaço), então montar o
  // literal `ARRAY[...]` à mão com `sql.raw` é seguro sem escapar nada além
  // da aspa simples (defensivo, não deveria nunca ocorrer nesse alfabeto).
  const literalSuperficies = `ARRAY[${listaSuperficies
    .map((s) => `'${s.replace(/'/g, "''")}'`)
    .join(",")}]::text[]`;
  const paresFormaRadical: ParFormaRadical[] = listaSuperficies.length
    ? ((
        await db.execute<ParFormaRadical>(sql`
          select f as forma, (ts_lexize('portuguese_stem', f))[1] as radical
            from unnest(${sql.raw(literalSuperficies)}) as f
        `)
      ).rows ?? [])
    : [];

  // ─────────────────────────── montagem final ───────────────────────────
  const { lexemas, ocorrencias } = construirVocabulario(vocabEntradas);
  const idDoLexema = new Map(lexemas.map((l, id) => [l, id]));
  const formas = construirFormas(paresFormaRadical, idDoLexema);

  const docsComId: DocumentoIndexado[] = docs.map((d, i) => ({ ...d, i }));
  const entradasVocabulario: [string, number[]][] = lexemas.map((l, id) => [l, ocorrencias[id]]);
  const entradasFormas: [string, number][] = Object.entries(formas);

  const arquivosDocs = arquivosDoIndice(docsComId);
  const arquivosVocab = arquivosDoIndice(entradasVocabulario);
  const arquivosFormas = arquivosDoIndice(entradasFormas);

  await gravarGrupo("docs", arquivosDocs);
  await gravarGrupo("vocabulario", arquivosVocab);
  await gravarGrupo("formas", arquivosFormas);

  const rDocs = resumoDoGrupo(arquivosDocs);
  const rVocab = resumoDoGrupo(arquivosVocab);
  const rFormas = resumoDoGrupo(arquivosFormas);
  const porZona = { cidades: 0, congresso: 0, judiciario: 0 };
  for (const d of docsComId) porZona[d.f]++;

  console.log("[gerar-indice-busca] indice gravado em", DIR_SAIDA);
  console.log(
    `  docs: ${rDocs.linhas} (cidades ${porZona.cidades}${comunicaDocs ? ` incl. ${comunicaDocs} ComunicaBR` : ""}, congresso ${porZona.congresso}, judiciario ${porZona.judiciario}) — ` +
      `${rDocs.fatias} fatia(s), ${(rDocs.bytes / 1024).toFixed(0)} KB`
  );
  console.log(
    `  vocabulario: ${rVocab.linhas} lexemas distintos — ${rVocab.fatias} fatia(s), ${(rVocab.bytes / 1024).toFixed(0)} KB`
  );
  console.log(
    `  formas: ${rFormas.linhas} formas de superficie — ${rFormas.fatias} fatia(s), ${(rFormas.bytes / 1024).toFixed(0)} KB`
  );
  if (municipiosSemSlug > 0) {
    console.warn(
      `  aviso: ${municipiosSemSlug} linha(s) de atos/proposicoes com id_municipio fora de listarCidades() (cidade inativa?) — excluidas do indice.`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[gerar-indice-busca] falhou:", e);
    process.exit(1);
  });
