/**
 * scripts/revisar-textos-memoria.mts
 *
 * O QUE É: revisor editorial assistido por Ollama dos verbetes da memória do
 * portal — as "Místicas do Dia" (home) e a "Linha do tempo" (`/memoria`).
 * Ambas bebem da MESMA base: `apps/web/lib/memoria/calendario.ts`
 * (`CALENDARIO_LUTAS`), com centenas de verbetes.
 *
 * POR QUE EXISTE (dono, 03/10/2026): há verbetes com frases soltas,
 * desconexas — sem sujeito claro (quem é o personagem individual ou
 * coletivo), sem o que aconteceu, sem quem foi vítima/alvo, sem onde, sem
 * período histórico. Como são centenas de textos, revisar à mão é inviável:
 * este script MANDA cada verbete ao Ollama local (sem custo e sem sair da
 * máquina) e grava o RESULTADO para revisão humana/do agente.
 *
 * REGRA DE OURO (AGENTS e cabeçalho do calendário): o resumo vem do
 * TEXTO-FONTE e NUNCA é reescrito por máquina às cegas. Por isso este script
 * NÃO altera o dado: ele só RELATA e SUGERE. A sugestão só pode reorganizar
 * o que já está no verbete — é proibido inventar fato, data, nome ou lugar.
 * Aplicar a sugestão é decisão humana, depois de ler o diff.
 *
 * ESTILO: a sugestão tem de preservar o tom dos documentos-base — narrativo e
 * inspirador (a linguagem do "Calendário Insurgente" e do "Calendário Histórico
 * dos Trabalhadores e Trabalhadoras"). Frase que perde esse tom não serve.
 *
 * SAÍDAS (em docs/relatorios-automacao/):
 *   - revisao-textos-memoria.json : resultado completo (para outra rodada);
 *   - revisao-textos-memoria.md   : só os verbetes sinalizados, em
 *     "ANTES → SUGESTÃO", para leitura do dono/do revisor.
 *
 * USO (Ollama precisa estar no ar em http://127.0.0.1:11434):
 *   npx tsx scripts/revisar-textos-memoria.mts --limite=20
 *   npx tsx scripts/revisar-textos-memoria.mts --inicio=80 --limite=80   # 2o lote
 *   npx tsx scripts/revisar-textos-memoria.mts --modelo=qwen2.5:3b-instruct
 *   npx tsx scripts/revisar-textos-memoria.mts --provedor=api --lote=40   # DeepSeek, 40 por chamada
 *   npx tsx scripts/revisar-textos-memoria.mts            # todos os verbetes
 *
 * Como revisar os ~500 verbetes leva tempo, a revisão roda em LOTES
 * (`--inicio`/`--limite`) e os resultados MESCLAM no mesmo relatório, por
 * índice — pode fechar e voltar que nada se perde.
 *
 * Este script não lê segredos e não fala com a internet: só com o Ollama
 * local (AGENTS § 5.8).
 *
 * PROVEDOR: por padrão fala só com o Ollama local (grátis, nada sai da
 * máquina). Com `--provedor=api` usa a API DeepSeek (`deepseek-flash`),
 * desligando o modo "pensante" (tarefa mecânica: o raciocínio só encarece).
 * Nesse modo a chave vem do ambiente (`DEEPSEEK_API_KEY` ou
 * `AI_API_KEY_DEEPSEEK`) e NUNCA é impressa. Preço e conta do custo em yuan:
 * `api-docs.deepseek.com/quick_start/pricing`.
 *
 * LOTE (`--lote=N`): manda N verbetes numa chamada só — a resposta é
 * `{"resultados":[...]}`, casada por índice. A rodada inteira cai de ~500
 * chamadas para poucas dezenas, aproveitando o contexto de 1M do modelo.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CALENDARIO_LUTAS } from "../apps/web/lib/memoria/calendario";
import type { EntradaCalendario } from "../apps/web/lib/memoria/tipos";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR_RELATORIOS = resolve(RAIZ, "docs", "relatorios-automacao");
const OLLAMA = "http://127.0.0.1:11434";
/**
 * Modelo padrão do Ollama local. O `qwen2.5:7b-instruct-q4_K_M` APARECE na
 * lista (`ollama list` e `/api/tags`) mas o servidor responde 404 "model not
 * found" na geração — medido 03/10/2026; por isso o padrão é o 3B, que gera de
 * verdade. Confira com uma geração real antes de trocar (AGENTS § 5.12).
 */
const MODELO_OLLAMA = "qwen2.5:3b-instruct";
/** Base e modelo da API DeepSeek (formato OpenAI). */
const API_PADRAO = "https://api.deepseek.com";
const MODELO_API = "deepseek-flash";
/**
 * Preço do `deepseek-flash` (DeepSeek-V4.1-Flash), em YUAN por 1M tokens,
 * lido da doc oficial em 03/10/2026 (`api-docs.deepseek.com/quick_start/pricing`).
 * Off-peak é metade do pico; pico = seg-sex 01-04h e 06-10h UTC (em Brasília:
 * 22-01h e 03-07h) — rodar de dia no Brasil sai mais barato.
 */
const PRECO_FLASH = {
  hitOff: 0.02,
  hitPico: 0.04,
  missOff: 1,
  missPico: 2,
  saidaOff: 4,
  saidaPico: 8,
} as const;

/** Um problema apontado pelo modelo, ancorado nos cinco critérios do dono. */
type Falta = "sujeito" | "acao" | "vitima" | "lugar" | "periodo";

/** Resultado da análise de um verbete. */
interface Analise {
  /** Índice estável dentro de CALENDARIO_LUTAS — a chave para revisar o diff. */
  indice: number;
  /** Identificação legível do verbete (dia, ano, título). */
  rotulo: string;
  /** O verbete está solto/desconexo? */
  solta: boolean;
  /** O que falta, segundo os cinco critérios. */
  faltando: Falta[];
  /** Justificativa curta do modelo. */
  motivo: string;
  /** Texto reescrito SÓ com o que já existe no verbete ("" quando não dá). */
  sugestao: string;
  /** Título curto proposto pelo modelo (até ~60 caracteres), no tom da fonte. */
  tituloCurto: string;
  /** Título/resumo originais, para o relatório e o diff. */
  titulo: string;
  resumo: string;
  /** Consumo medido (só no provedor API) — base do custo em yuan. */
  uso?: Uso;
}

/** Tokens consumidos por uma chamada, quando o provedor informa. */
interface Uso {
  /** Entrada que casou no cache de contexto (barata). */
  hit: number;
  /** Entrada fora do cache. */
  miss: number;
  /** Saída gerada. */
  saida: number;
}

/** Provedor de inferência: o Ollama local ou a API DeepSeek. */
type Provedor = "ollama" | "api";

/** Configuração resolvida da rodada. */
interface Config {
  provedor: Provedor;
  modelo: string;
  baseApi: string;
  apiKey?: string;
  /** Quantos verbetes por chamada ao provedor (1 = um a um). */
  lote: number;
}

/** Lê um argumento `--chave=valor`. */
function arg(chave: string): string | undefined {
  const prefixo = `--${chave}=`;
  return process.argv.find((a) => a.startsWith(prefixo))?.slice(prefixo.length);
}

/** Chave da DeepSeek vinda do ambiente; NUNCA é impressa (AGENTS § 5.8). */
function chaveDeepSeek(): string | undefined {
  return process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY_DEEPSEEK;
}

/** Pico de preço da DeepSeek: seg-sex 01-04h e 06-10h UTC (fora disso, off-peak). */
function ehPico(d: Date): boolean {
  const dia = d.getUTCDay(); // 0 = domingo, 6 = sábado
  if (dia === 0 || dia === 6) return false;
  const h = d.getUTCHours();
  return (h >= 1 && h < 4) || (h >= 6 && h < 10);
}

/** O Ollama está no ar e tem o modelo pedido? Falha cedo e com recado claro. */
async function verificarOllama(modelo: string): Promise<void> {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const dados = (await r.json()) as { models?: { name: string }[] };
    const nomes = (dados.models ?? []).map((m) => m.name);
    if (nomes.length && !nomes.includes(modelo)) {
      console.warn(
        `[revisar] aviso: o modelo "${modelo}" não está na lista do Ollama.\n` +
          `[revisar] instalados: ${nomes.join(", ")}\n` +
          `[revisar] o Ollama tenta baixar ao usar; se falhar, rode: ollama pull ${modelo}`,
      );
    }
  } catch (e) {
    console.error(`[revisar] Ollama não respondeu em ${OLLAMA}: ${e instanceof Error ? e.message : e}`);
    console.error("[revisar] inicie com: ollama serve");
    process.exit(2);
  }
}

/**
 * Critérios do dono + proibição de inventar — miolo comum aos dois prompts
 * (um verbete por chamada e lote). Fica num só lugar para não divergir.
 */
const CRITERIOS = [
  "Aponte se há frases soltas/desconexas — sem algum destes cinco elementos:",
  "  1. sujeito — quem é o personagem principal, individual OU coletivo",
  "     (movimento, categoria, povo, região/povo como 'Amazônia' ou 'os",
  "     seringueiros'). Sujeito COLETIVO conta: só marque falta de sujeito",
  "     quando não houver nem pessoa nem coletivo;",
  "  2. acao — o que aconteceu;",
  "  3. vitima — quem foi vítima ou alvo;",
  "  4. lugar — onde aconteceu;",
  "  5. periodo — em que período/século/ano se passa.",
  "",
  "COMO SUGERIR (importante): MANTENHA O TEXTO ORIGINAL sempre que possível —",
  "aproveite as palavras e frases do próprio verbete; prefira reordenar e",
  "encurtar a reescrever. Use FRASES CURTAS que resumam bem e mantenha o tom",
  "dos documentos-base: NARRATIVO e INSPIRADOR, como o 'Calendário Insurgente'",
  "(Aos que Virão) e o 'Calendário Histórico dos Trabalhadores e Trabalhadoras'",
  "(MST). Nunca um resumo seco, burocrático ou de manual.",
  "",
  "REGRA ABSOLUTA: não invente fato, data, nome ou lugar que NÃO esteja no",
  "verbete. Se faltar algo que não aparece, liste em \"faltando\" e deixe a",
  "sugestão VAZIA — nunca preencha com suposição.",
  "Marque solta=false quando título+resumo já deixam claro quem, o quê, quem foi",
  "o alvo, onde e quando.",
  "",
  "Além da revisão, proponha para CADA verbete um TÍTULO CURTO (até ~60",
  "caracteres) no estilo de NOME DE ACONTECIMENTO — como 'Revolta da Balaiada'",
  "ou 'Massacre do Carandiru': poucas palavras, o tipo de fato + o nome ou o",
  "lugar, sem repetir o ano e sem inventar nada; pode reorganizar o título atual.",
].join("\n");

/** Prompt para UMA chamada de um verbete. */
function promptSistema(): string {
  return [
    "Você é revisor editorial de um portal cívico brasileiro de transparência.",
    "Recebe UM verbete de memória (fato histórico de luta popular): título e",
    "resumo, com ano e lugar quando a fonte informa. Analise o CONJUNTO —",
    "título + resumo: se a informação já aparece no título, NÃO está faltando.",
    "",
    CRITERIOS,
    "",
    'Responda SOMENTE com JSON: {"solta":true|false,"faltando":[],"motivo":"curto","sugestao":"texto final, ou vazio","titulo_curto":"título curto"}',
  ].join("\n");
}

/**
 * Prompt para LOTE: vários verbetes numa chamada só, cada um marcado com
 * `indice=`. A resposta traz o array `resultados`, um item por índice — é
 * assim que a rodada cai de ~500 chamadas para poucas dezenas.
 */
function promptSistemaLote(): string {
  return [
    "Você é revisor editorial de um portal cívico brasileiro de transparência.",
    "Receberá VÁRIOS verbetes de memória (fatos históricos de luta popular), cada",
    "um marcado com `indice=`. Analise cada verbete pelo CONJUNTO (título +",
    "resumo): se a informação já aparece no título, NÃO está faltando.",
    "",
    CRITERIOS,
    "",
    "Responda SOMENTE com JSON, um item por verbete recebido, na MESMA ordem:",
    '{"resultados":[{"indice": <n>, "solta": true|false, "faltando": [], "motivo": "curto", "sugestao": "texto final ou vazio", "titulo_curto": "título curto"}]}',
    "Inclua TODOS os índices recebidos. Não escreva nada fora do JSON.",
  ].join("\n");
}

/** Extrai a análise do texto JSON devolvido pelo modelo; null se ilegível. */
function interpretar(
  texto: string,
  entrada: EntradaCalendario,
  indice: number,
  rotulo: string,
  uso?: Uso,
): Analise | null {
  try {
    const bruto = JSON.parse(texto) as {
      solta?: unknown;
      faltando?: unknown;
      motivo?: unknown;
      sugestao?: unknown;
      titulo_curto?: unknown;
    };
    const validos: Falta[] = ["sujeito", "acao", "vitima", "lugar", "periodo"];
    const faltando = Array.isArray(bruto.faltando)
      ? bruto.faltando.filter((f): f is Falta => validos.includes(f as Falta))
      : [];
    return {
      indice,
      rotulo,
      solta: bruto.solta === true,
      faltando,
      motivo: typeof bruto.motivo === "string" ? bruto.motivo : "",
      sugestao: typeof bruto.sugestao === "string" ? bruto.sugestao.trim() : "",
      tituloCurto: typeof bruto.titulo_curto === "string" ? bruto.titulo_curto.trim() : "",
      titulo: entrada.titulo,
      resumo: entrada.resumo ?? "",
      uso,
    };
  } catch {
    console.warn(`[revisar] resposta ilegível em #${indice} (${rotulo})`);
    return null;
  }
}

/** Bloco de um verbete como o modelo lê. */
function corpoVerbete(e: EntradaCalendario): string {
  return [
    `ANO: ${e.ano || "(a fonte não datou)"}`,
    `LUGAR: ${e.lugar || "(a fonte não diz)"}`,
    `TÍTULO: ${e.titulo}`,
    `RESUMO: ${e.resumo || "(sem resumo — o título é tudo)"}`,
  ].join("\n");
}

/** Rótulo legível do verbete (dia/ano + título). */
function rotuloDe(e: EntradaCalendario): string {
  return `${e.diaMes}/${e.ano || "sem ano"} — ${e.titulo}`;
}

/**
 * Faz UMA chamada ao provedor e devolve o texto bruto e o consumo.
 *
 * Ollama: `/api/chat` com `format: "json"`. DeepSeek: `/chat/completions`
 * (formato OpenAI) com `response_format: json_object` e
 * `thinking: {type: "disabled"}` — sem raciocínio, que só encareceria uma
 * tarefa mecânica. A resposta do provedor API traz `usage`, que vira `uso`.
 */
async function pedirProvedor(
  messages: { role: string; content: string }[],
  cfg: Config,
): Promise<{ texto: string; uso?: Uso }> {
  if (cfg.provedor === "ollama") {
    const resposta = await fetch(`${OLLAMA}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(300_000),
      body: JSON.stringify({
        model: cfg.modelo,
        stream: false,
        // `format: "json"` obriga o modelo a devolver JSON puro (sem cercas).
        format: "json",
        options: { temperature: 0 },
        messages,
      }),
    });
    if (!resposta.ok) throw new Error(`Ollama HTTP ${resposta.status}`);
    const dados = (await resposta.json()) as { message?: { content?: string } };
    return { texto: dados.message?.content ?? "" };
  }

  const resposta = await fetch(`${cfg.baseApi}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.apiKey}`,
    },
    signal: AbortSignal.timeout(300_000),
    body: JSON.stringify({
      model: cfg.modelo,
      temperature: 0,
      response_format: { type: "json_object" },
      thinking: { type: "disabled" },
      messages,
    }),
  });
  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    throw new Error(`API HTTP ${resposta.status}: ${detalhe.slice(0, 200)}`);
  }
  const dados = (await resposta.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      prompt_cache_hit_tokens?: number;
      prompt_cache_miss_tokens?: number;
    };
  };
  const u = dados.usage;
  let uso: Uso | undefined;
  if (u) {
    const hit = u.prompt_cache_hit_tokens ?? 0;
    const miss = u.prompt_cache_miss_tokens ?? Math.max(0, (u.prompt_tokens ?? 0) - hit);
    uso = { hit, miss, saida: u.completion_tokens ?? 0 };
  }
  return { texto: dados.choices?.[0]?.message?.content ?? "", uso };
}

/** Um alvo da rodada: o verbete e o índice estável dele. */
interface ItemAlvo {
  indice: number;
  entrada: EntradaCalendario;
}

/**
 * Analisa um conjunto de verbetes. Com 1 item, usa o prompt de um verbete;
 * com vários, faz UMA chamada em lote (prompt de lote) e casa cada resultado
 * pelo `indice`. Devolve as análises e o consumo da chamada.
 */
async function analisarEntradas(
  itens: ItemAlvo[],
  cfg: Config,
): Promise<{ analises: Analise[]; uso?: Uso }> {
  if (itens.length === 1) {
    const { indice, entrada } = itens[0];
    const { texto, uso } = await pedirProvedor(
      [
        { role: "system", content: promptSistema() },
        { role: "user", content: corpoVerbete(entrada) },
      ],
      cfg,
    );
    const a = interpretar(texto, entrada, indice, rotuloDe(entrada), uso);
    return { analises: a ? [a] : [], uso };
  }

  const blocos = itens
    .map((it) => `### VERBETE indice=${it.indice}\n${corpoVerbete(it.entrada)}`)
    .join("\n\n");
  const { texto, uso } = await pedirProvedor(
    [
      { role: "system", content: promptSistemaLote() },
      { role: "user", content: blocos },
    ],
    cfg,
  );

  // A resposta do lote é {"resultados":[{indice,...}, ...]}. Casa por índice;
  // o que faltar na resposta conta como não lido (o chamador soma).
  let lista: unknown;
  try {
    lista = (JSON.parse(texto) as { resultados?: unknown }).resultados;
  } catch {
    console.warn(`[revisar] resposta de lote ilegível (${itens.length} verbetes)`);
    return { analises: [], uso };
  }
  if (!Array.isArray(lista)) {
    console.warn(`[revisar] lote sem o campo "resultados" (${itens.length} verbetes)`);
    return { analises: [], uso };
  }

  const porIndice = new Map<number, Record<string, unknown>>();
  for (const item of lista) {
    if (item && typeof item === "object" && typeof (item as { indice?: unknown }).indice === "number") {
      porIndice.set((item as { indice: number }).indice, item as Record<string, unknown>);
    }
  }

  const analises: Analise[] = [];
  for (const it of itens) {
    const item = porIndice.get(it.indice);
    if (!item) {
      console.warn(`[revisar] lote não devolveu o índice #${it.indice}`);
      continue;
    }
    const a = interpretar(JSON.stringify(item), it.entrada, it.indice, rotuloDe(it.entrada));
    if (a) analises.push(a);
  }
  return { analises, uso };
}

/** Escapa barras verticais para não quebrar a tabela Markdown. */
function md(texto: string): string {
  return texto.replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

async function main(): Promise<void> {
  const provedor = (arg("provedor") ?? "ollama") as Provedor;
  const modelo = arg("modelo") ?? (provedor === "api" ? MODELO_API : MODELO_OLLAMA);
  const baseApi = (arg("base") ?? API_PADRAO).replace(/\/+$/, "");
  const loteArg = Number.parseInt(arg("lote") ?? "", 10);
  const lote = Number.isFinite(loteArg) && loteArg > 0 ? loteArg : 1;
  const inicioArg = Number.parseInt(arg("inicio") ?? "", 10);
  const inicio = Number.isFinite(inicioArg) && inicioArg > 0 ? inicioArg : 0;
  const limiteArg = Number.parseInt(arg("limite") ?? "", 10);
  const limite = Number.isFinite(limiteArg) && limiteArg > 0 ? limiteArg : undefined;

  let cfg: Config;
  if (provedor === "api") {
    const apiKey = chaveDeepSeek();
    if (!apiKey) {
      console.error(
        "[revisar] --provedor=api precisa de DEEPSEEK_API_KEY (ou AI_API_KEY_DEEPSEEK) no ambiente.\n" +
          "[revisar] a chave não é lida de arquivo nem impressa (AGENTS § 5.8).",
      );
      process.exit(2);
    }
    cfg = { provedor, modelo, baseApi, apiKey, lote };
    console.log(`[revisar] provedor: API ${baseApi} — modelo ${modelo} (chave do ambiente, não impressa)`);
  } else {
    await verificarOllama(modelo);
    cfg = { provedor, modelo, baseApi, lote };
  }

  const todas = CALENDARIO_LUTAS;
  const fim = limite ? Math.min(inicio + limite, todas.length) : todas.length;
  const alvos = todas.slice(inicio, fim);

  console.log(`[revisar] modelo: ${modelo}`);
  console.log(`[revisar] verbetes: ${alvos.length} (índices ${inicio}..${fim - 1} de ${todas.length})`);
  if (lote > 1) console.log(`[revisar] lote: ${lote} verbetes por chamada`);
  console.log(`[revisar] o modelo apenas SUGERE — o dado não é alterado.\n`);

  const analises: Analise[] = [];
  const usoTotal: Uso = { hit: 0, miss: 0, saida: 0 };
  let okSemProblema = 0;
  let ilegiveis = 0;

  for (let i = 0; i < alvos.length; i += lote) {
    const chunk: ItemAlvo[] = alvos
      .slice(i, i + lote)
      .map((entrada, j) => ({ indice: inicio + i + j, entrada }));
    const fimBloco = Math.min(i + lote, alvos.length);
    const etiqueta = `[${i + 1}-${fimBloco}/${alvos.length}]`;
    try {
      const { analises: lidas, uso } = await analisarEntradas(chunk, cfg);
      if (uso) {
        usoTotal.hit += uso.hit;
        usoTotal.miss += uso.miss;
        usoTotal.saida += uso.saida;
      }
      for (const a of lidas) {
        analises.push(a);
        if (!a.solta) okSemProblema++;
        else {
          console.log(
            `${etiqueta} SOLTA  ${a.rotulo}\n` +
              `             falta: ${a.faltando.join(", ") || "(não listado)"} — ${a.motivo}`,
          );
        }
      }
      const faltaram = chunk.length - lidas.length;
      if (faltaram > 0) {
        ilegiveis += faltaram;
        console.warn(`${etiqueta} ${faltaram} verbete(s) sem resposta no lote`);
      }
      if (lote > 1) console.log(`${etiqueta} lote ok: ${lidas.length}/${chunk.length}`);
    } catch (e) {
      ilegiveis += chunk.length;
      console.warn(`${etiqueta} erro: ${e instanceof Error ? e.message : e}`);
    }
  }

  mkdirSync(DIR_RELATORIOS, { recursive: true });
  const caminhoJson = resolve(DIR_RELATORIOS, "revisao-textos-memoria.json");

  // Mescla por índice com o que já existe: a revisão roda em LOTES
  // (`--inicio`/`--limite`) e o relatório é acumulativo — parar no meio do
  // caminho não perde lote nenhum.
  const porIndice = new Map<number, Analise>();
  if (existsSync(caminhoJson)) {
    try {
      const anterior = JSON.parse(readFileSync(caminhoJson, "utf8")) as { resultados?: Analise[] };
      for (const r of anterior.resultados ?? []) porIndice.set(r.indice, r);
    } catch {
      console.warn("[revisar] aviso: relatório anterior ilegível; começando do zero.");
    }
  }
  for (const a of analises) porIndice.set(a.indice, a);
  const acumulado = [...porIndice.values()].sort((x, y) => x.indice - y.indice);
  const soltas = acumulado.filter((a) => a.solta);

  writeFileSync(
    caminhoJson,
    JSON.stringify(
      {
        atualizadoEm: new Date().toISOString(),
        modelo,
        totalCalendario: CALENDARIO_LUTAS.length,
        analisados: acumulado.length,
        soltas: soltas.length,
        resultados: acumulado,
      },
      null,
      2,
    ),
    "utf8",
  );

  const linhas: string[] = [];
  linhas.push("# Revisão de textos da memória (Mística do Dia e Linha do tempo)");
  linhas.push("");
  linhas.push(
    `> Revisão assistida por ${provedor === "api" ? `API DeepSeek (\`${modelo}\`)` : "Ollama local"}. O script **não** altera o dado — só lista`,
  );
  linhas.push(
    "> os verbetes com frases soltas e propõe um texto usando APENAS o que já está no",
  );
  linhas.push("> verbete. Aplicar é decisão humana, depois de ler o diff. Ver `scripts/revisar-textos-memoria.mts`.");
  linhas.push("");
  linhas.push(`- Modelo: \`${modelo}\``);
  linhas.push(`- Verbetes analisados: ${acumulado.length} de ${CALENDARIO_LUTAS.length}`);
  linhas.push(`- Sinalizados como soltos: ${soltas.length}`);
  linhas.push(`- Sem problema: ${okSemProblema}`);
  if (ilegiveis) linhas.push(`- respostas ilegíveis: ${ilegiveis}`);
  linhas.push("");
  linhas.push("## Títulos curtos propostos (um por verbete)");
  linhas.push("");
  linhas.push("| # | dia/ano | título atual | título curto proposto |");
  linhas.push("|---|---|---|---|");
  for (const a of acumulado) {
    linhas.push(
      `| ${a.indice} | ${md(a.rotulo.split(" — ")[0])} | ${md(a.titulo)} | ${md(a.tituloCurto || "(vazio)")} |`,
    );
  }
  linhas.push("");
  linhas.push("## Frases soltas sinalizadas");
  linhas.push("");
  linhas.push("| # | dia/ano | falta | ANTES (título + resumo) | SUGESTÃO |");
  linhas.push("|---|---|---|---|---|");
  for (const a of soltas) {
    const antes = `${a.titulo} — ${a.resumo || "(sem resumo)"}`;
    linhas.push(
      `| ${a.indice} | ${md(a.rotulo.split(" — ")[0])} | ${md(a.faltando.join(", "))} | ${md(antes)} | ${md(a.sugestao || "(só relatar: não dá sem inventar)")} |`,
    );
  }
  linhas.push("");
  const caminhoMd = resolve(DIR_RELATORIOS, "revisao-textos-memoria.md");
  writeFileSync(caminhoMd, linhas.join("\n"), "utf8");

  console.log("");
  console.log("=== Resumo da revisão ===");
  console.log(`Analisados ....... ${analises.length}/${alvos.length}`);
  console.log(`Soltas ........... ${soltas.length}`);
  console.log(`Sem problema ..... ${okSemProblema}`);
  console.log(`Ilegíveis ........ ${ilegiveis}`);
  if (provedor === "api") {
    const pico = ehPico(new Date());
    const custo =
      (usoTotal.hit / 1e6) * (pico ? PRECO_FLASH.hitPico : PRECO_FLASH.hitOff) +
      (usoTotal.miss / 1e6) * (pico ? PRECO_FLASH.missPico : PRECO_FLASH.missOff) +
      (usoTotal.saida / 1e6) * (pico ? PRECO_FLASH.saidaPico : PRECO_FLASH.saidaOff);
    console.log(
      `Tokens ........... hit ${usoTotal.hit} / miss ${usoTotal.miss} / saída ${usoTotal.saida} (${pico ? "pico" : "off-peak"})`,
    );
    console.log(`Custo (yuan) ..... ¥${custo.toFixed(4)}  (deepseek-flash)`);
  }
  console.log(`Relatório ........ ${caminhoMd}`);
  console.log(`JSON ............. ${caminhoJson}`);
  console.log("");
  console.log("[revisar] Lembrete: nenhuma sugestão foi aplicada — revise o relatório.");
}

main().catch((e) => {
  console.error("[revisar] Erro fatal:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
