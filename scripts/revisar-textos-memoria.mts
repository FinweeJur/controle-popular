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
 *   npx tsx scripts/revisar-textos-memoria.mts            # todos os verbetes
 *
 * Como revisar os ~500 verbetes leva tempo, a revisão roda em LOTES
 * (`--inicio`/`--limite`) e os resultados MESCLAM no mesmo relatório, por
 * índice — pode fechar e voltar que nada se perde.
 *
 * Este script não lê segredos e não fala com a internet: só com o Ollama
 * local (AGENTS § 5.8).
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
const MODELO_PADRAO = "qwen2.5:3b-instruct";

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
  /** Título/resumo originais, para o relatório e o diff. */
  titulo: string;
  resumo: string;
}

/** Lê um argumento `--chave=valor`. */
function arg(chave: string): string | undefined {
  const prefixo = `--${chave}=`;
  return process.argv.find((a) => a.startsWith(prefixo))?.slice(prefixo.length);
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

/** Monta o prompt: os cinco critérios do dono + proibição de inventar. */
function promptSistema(): string {
  return [
    "Você é revisor editorial de um portal cívico brasileiro de transparência.",
    "Recebe UM verbete de memória (fato histórico de luta popular): título e",
    "resumo, com ano e lugar quando a fonte informa. Analise o CONJUNTO —",
    "título + resumo: se a informação já aparece no título, NÃO está faltando.",
    "",
    "Aponte se há frases soltas/desconexas — sem algum destes cinco elementos:",
    "  1. sujeito — quem é o personagem individual ou coletivo principal;",
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
    'Responda SOMENTE com JSON: {"solta":true|false,"faltando":[],"motivo":"curto","sugestao":"texto final, ou vazio"}',
  ].join("\n");
}

/** Pede a análise de um verbete ao Ollama; devolve null quando a resposta é ilegível. */
async function analisar(
  entrada: EntradaCalendario,
  indice: number,
  modelo: string,
): Promise<Analise | null> {
  const rotulo = `${entrada.diaMes}/${entrada.ano || "sem ano"} — ${entrada.titulo}`;
  const corpoVerbete = [
    `ANO: ${entrada.ano || "(a fonte não datou)"}`,
    `LUGAR: ${entrada.lugar || "(a fonte não diz)"}`,
    `TÍTULO: ${entrada.titulo}`,
    `RESUMO: ${entrada.resumo || "(sem resumo — o título é tudo)"}`,
  ].join("\n");

  const resposta = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(180_000),
    body: JSON.stringify({
      model: modelo,
      stream: false,
      // `format: "json"` obriga o modelo a devolver JSON puro (sem cercas).
      format: "json",
      options: { temperature: 0 },
      messages: [
        { role: "system", content: promptSistema() },
        { role: "user", content: corpoVerbete },
      ],
    }),
  });
  if (!resposta.ok) throw new Error(`Ollama HTTP ${resposta.status}`);
  const dados = (await resposta.json()) as { message?: { content?: string } };
  const texto = dados.message?.content ?? "";

  try {
    const bruto = JSON.parse(texto) as {
      solta?: unknown;
      faltando?: unknown;
      motivo?: unknown;
      sugestao?: unknown;
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
      titulo: entrada.titulo,
      resumo: entrada.resumo ?? "",
    };
  } catch {
    console.warn(`[revisar] resposta ilegível em #${indice} (${rotulo})`);
    return null;
  }
}

/** Escapa barras verticais para não quebrar a tabela Markdown. */
function md(texto: string): string {
  return texto.replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

async function main(): Promise<void> {
  const modelo = arg("modelo") ?? MODELO_PADRAO;
  const inicioArg = Number.parseInt(arg("inicio") ?? "", 10);
  const inicio = Number.isFinite(inicioArg) && inicioArg > 0 ? inicioArg : 0;
  const limiteArg = Number.parseInt(arg("limite") ?? "", 10);
  const limite = Number.isFinite(limiteArg) && limiteArg > 0 ? limiteArg : undefined;

  await verificarOllama(modelo);

  const todas = CALENDARIO_LUTAS;
  const fim = limite ? Math.min(inicio + limite, todas.length) : todas.length;
  const alvos = todas.slice(inicio, fim);

  console.log(`[revisar] modelo: ${modelo}`);
  console.log(`[revisar] verbetes: ${alvos.length} (índices ${inicio}..${fim - 1} de ${todas.length})`);
  console.log(`[revisar] o modelo apenas SUGERE — o dado não é alterado.\n`);

  const analises: Analise[] = [];
  let okSemProblema = 0;
  let ilegiveis = 0;

  for (let i = 0; i < alvos.length; i++) {
    const entrada = alvos[i];
    const indice = inicio + i;
    try {
      const a = await analisar(entrada, indice, modelo);
      if (!a) {
        ilegiveis++;
        continue;
      }
      analises.push(a);
      if (!a.solta) okSemProblema++;
      if (a.solta) {
        console.log(
          `[${i + 1}/${alvos.length}] SOLTA  ${a.rotulo}\n` +
            `             falta: ${a.faltando.join(", ") || "(não listado)"} — ${a.motivo}`,
        );
      }
    } catch (e) {
      ilegiveis++;
      console.warn(`[${i + 1}/${alvos.length}] erro: ${e instanceof Error ? e.message : e}`);
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
    "> Revisão assistida por Ollama local. O script **não** altera o dado — só lista",
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
  console.log(`Relatório ........ ${caminhoMd}`);
  console.log(`JSON ............. ${caminhoJson}`);
  console.log("");
  console.log("[revisar] Lembrete: nenhuma sugestão foi aplicada — revise o relatório.");
}

main().catch((e) => {
  console.error("[revisar] Erro fatal:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
