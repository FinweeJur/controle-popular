#!/usr/bin/env node
/**
 * scripts/fila-coleta-puller.mts
 *
 * Puller da fila de coleta — a ponta "digerir no PC" da Fase 1
 * ("coletar na nuvem, digerir no PC").
 *
 * ═══ O QUE FAZ ═══
 * 1. Lê os itens `pendente` de `fila_coleta` no Postgres do Guara Cloud,
 *    em lotes pequenos (mais antigos primeiro).
 * 2. Marca cada item `processando` e roda o Ollama LOCAL
 *    (http://127.0.0.1:11434) pedindo JSON estrito (`format:"json"`,
 *    `temperature:0`).
 * 3. VALIDA o que o modelo devolve antes de confiar; grava `resultado` e
 *    fecha o item como `concluido` — ou incrementa `tentativas` e volta
 *    para `pendente` até o teto, quando vira `erro`.
 *
 * ═══ CONEXÃO COM O BANCO ═══
 * Reusa a MESMA estratégia dos ETLs: carrega `apps/web/.env.local` (e
 * `etl/betim/.env` como reserva) sem imprimir segredo, e chama `getDb()`
 * de `apps/web/lib/db/client.ts`, que escolhe o driver pelo host
 * (neon.tech → HTTP; resto → `pg`/TCP com `ssl:false` em host interno).
 * Para o Guara localmente, suba o proxy antes:
 *   guara proxy cp-postgres-597bd0 15432
 *
 * ═══ PRIVACIDADE (AGENTS §5.8) ═══
 * NADA de segredo vai para o prompt. Antes de montar o texto, o payload
 * passa por `higienizar()`: campos com nome de segredo/token/senha/CPF são
 * removidos recursivamente. Dado pessoal bruto nunca chega ao modelo.
 *
 * ═══ USO ═══
 *   npx tsx scripts/fila-coleta-puller.mts
 *   npx tsx scripts/fila-coleta-puller.mts --lote 3 --modelo llama3.2:3b
 *   npx tsx scripts/fila-coleta-puller.mts --simular   # não grava no banco
 *
 * NÃO roda sozinho; é chamado à mão ou por rotina. Não faz deploy.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");

/**
 * Carrega pares `CHAVE=valor` de arquivos .env candidatos, SEM imprimir o
 * valor. Tolera BOM (\uFEFF) e CRLF — a armadilha de 01/10/2026 em que o
 * `$` de um regex não casava antes do `\r` e escondia a chave (AGENTS §6).
 */
function carregarEnv(): void {
  const candidatos = [
    path.join(RAIZ, "apps", "web", ".env.local"),
    path.join(RAIZ, "etl", "betim", ".env"),
  ];
  for (const arquivo of candidatos) {
    if (!fs.existsSync(arquivo)) continue;
    const texto = fs.readFileSync(arquivo, "utf8").replace(/^\uFEFF/, "");
    for (const linha of texto.split(/\r?\n/)) {
      if (!linha.trim() || linha.trim().startsWith("#")) continue;
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(linha);
      if (!m) continue;
      const valor = m[2].trim().replace(/^["'](.*)["']$/, "$1");
      if (!(m[1] in process.env)) process.env[m[1]] = valor;
    }
  }
}

interface Args {
  lote: number;
  modelo: string;
  ollama: string;
  simular: boolean;
}

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const ler = (nome: string, padrao: string): string => {
    const i = a.indexOf(nome);
    return i >= 0 && a[i + 1] ? a[i + 1] : padrao;
  };
  return {
    lote: Math.max(1, Math.min(20, Number(ler("--lote", process.env.FILA_LOTE ?? "5")) || 5)),
    modelo: ler("--modelo", process.env.OLLAMA_MODELO ?? "llama3.2:3b"),
    ollama: process.env.OLLAMA_URL ?? "http://127.0.0.1:11434",
    simular: a.includes("--simular"),
  };
}

/** Chaves cujo VALOR nunca pode entrar no prompt (AGENTS §5.8). */
const CHAVES_SENSIVEIS = /(segredo|secret|token|senha|password|passwd|api[_-]?key|authorization|bearer|cpf|cnpj|credencial|cookie)/i;

/**
 * Remove recursivamente do payload qualquer campo sensível. O modelo só
 * precisa do conteúdo público; segredo e CPF ficam no disco.
 */
function higienizar(valor: unknown, profundidade = 0): unknown {
  if (profundidade > 6) return "[cortado]";
  if (Array.isArray(valor)) return valor.map((v) => higienizar(v, profundidade + 1));
  if (typeof valor === "object" && valor !== null) {
    const saida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      if (CHAVES_SENSIVEIS.test(k)) continue;
      saida[k] = higienizar(v, profundidade + 1);
    }
    return saida;
  }
  return valor;
}

/** Resposta esperada do modelo — só estes campos são aceitos. */
interface RespostaModelo {
  resumo: string;
  classificacao?: string;
  confianca?: number;
}

/**
 * VALIDA o JSON do modelo. Modelo pequeno solta texto livre e inventa
 * (AGENTS §5.12); sem esta régua, um `{"foo":"bar"}` viraria "resultado".
 * Aceita só o formato combinado, com tipos conferidos.
 */
function validarResposta(bruto: unknown): RespostaModelo | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const obj = bruto as Record<string, unknown>;
  if (typeof obj.resumo !== "string" || obj.resumo.trim().length === 0) return null;
  const saida: RespostaModelo = { resumo: obj.resumo.trim() };
  if (typeof obj.classificacao === "string") saida.classificacao = obj.classificacao;
  if (typeof obj.confianca === "number" && obj.confianca >= 0 && obj.confianca <= 1) {
    saida.confianca = obj.confianca;
  }
  return saida;
}

/** Confirma que o servidor Ollama responde de verdade (lista não é prova). */
async function ollamaVivo(ollama: string): Promise<boolean> {
  try {
    const r = await fetch(`${ollama}/api/tags`, { signal: AbortSignal.timeout(5000) });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Chama `/api/chat` com JSON estrito e devolve o conteúdo já parseado.
 * `temperature:0` e `format:"json"` reduzem a criatividade do modelo.
 */
async function perguntarModelo(
  ollama: string,
  modelo: string,
  prompt: string
): Promise<unknown> {
  const r = await fetch(`${ollama}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelo,
      stream: false,
      format: "json",
      options: { temperature: 0 },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!r.ok) {
    throw new Error(`Ollama respondeu HTTP ${r.status} (modelo existe? baixe no Ollama).`);
  }
  const corpo = (await r.json()) as { message?: { content?: string } };
  const conteudo = corpo.message?.content;
  if (typeof conteudo !== "string") throw new Error("Resposta sem message.content.");
  return JSON.parse(conteudo);
}

/** Monta o prompt cívico. Sem segredo; payload já higienizado e cortado. */
function montarPrompt(tipo: string, alvo: string, payload: unknown): string {
  const pedido = JSON.stringify(payload).slice(0, 4000);
  return [
    'Você é "Seu Nonô", assistente cívico do portal Controle Popular.',
    "Analise o item da fila de coleta e responda SOMENTE um JSON válido.",
    "Formato exato:",
    '{"resumo": "texto curto em português", "classificacao": "tema", "confianca": 0.0}',
    "Regras: frases curtas (até 13 palavras); não invente número;",
    "se não souber, escreva isso no resumo. Confiança entre 0 e 1.",
    "",
    `Tipo da tarefa: ${tipo}`,
    `Alvo: ${alvo}`,
    `Payload (já higienizado): ${pedido}`,
  ].join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs();
  carregarEnv();

  // Import dinâmico DEPOIS de carregar o env: `getDb()` lê `DATABASE_URL`
  // no primeiro uso e memoiza a conexão.
  const { getDb } = await import("../apps/web/lib/db/client.js");
  const { fila_coleta } = await import("../apps/web/lib/db/schema.js");
  const { and, asc, eq } = await import("drizzle-orm");

  const db = getDb();
  if (!db) {
    console.error("⛔ DATABASE_URL ausente/inválida. Rode 'guara proxy cp-postgres-597bd0 15432' e confira o .env.local.");
    process.exit(1);
  }

  if (!(await ollamaVivo(args.ollama))) {
    console.error(`⛔ Ollama não responde em ${args.ollama}. Inicie: ollama serve`);
    process.exit(1);
  }
  console.log(`✅ Ollama vivo. Modelo: ${args.modelo}. Lote: ${args.lote}. Simular: ${args.simular}`);

  const MAX_TENTATIVAS = 3;

  const pendentes = await db
    .select()
    .from(fila_coleta)
    .where(eq(fila_coleta.status, "pendente"))
    .orderBy(asc(fila_coleta.criado_em))
    .limit(args.lote);

  if (pendentes.length === 0) {
    console.log("📭 Fila vazia (nenhum item pendente).");
    return;
  }
  console.log(`📥 ${pendentes.length} item(ns) pendente(s) para digerir.`);

  let concluidos = 0;
  let falhos = 0;

  for (const item of pendentes) {
    const agora = new Date().toISOString();
    console.log(`\n▶ ${item.tipo} — ${item.alvo} (tentativa ${item.tentativas + 1})`);

    if (!args.simular) {
      // Trava otimista: só assume se ainda estiver pendente. Evita dois
      // pullers processando o mesmo item (o segundo não afeta nenhuma linha).
      const assumido = await db
        .update(fila_coleta)
        .set({ status: "processando", atualizado_em: agora })
        .where(and(eq(fila_coleta.id, item.id), eq(fila_coleta.status, "pendente")))
        .returning({ id: fila_coleta.id });
      if (assumido.length === 0) {
        console.log("   ↷ outro processo assumiu; pulando.");
        continue;
      }
    }

    try {
      const prompt = montarPrompt(item.tipo, item.alvo, higienizar(item.payload));
      const cru = await perguntarModelo(args.ollama, args.modelo, prompt);
      const validado = validarResposta(cru);
      if (!validado) throw new Error("JSON fora do formato combinado.");

      if (!args.simular) {
        await db
          .update(fila_coleta)
          .set({
            status: "concluido",
            resultado: {
              ...validado,
              modelo: args.modelo,
              geradoEm: new Date().toISOString(),
              // Rotular como máquina é regra editorial (AGENTS §7): sugestão
              // não substitui o dado.
              origem: "ollama-local",
            },
            atualizado_em: new Date().toISOString(),
          })
          .where(eq(fila_coleta.id, item.id));
      }
      console.log(`   ✅ concluído: ${validado.resumo.slice(0, 80)}`);
      concluidos++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const tentativas = item.tentativas + 1;
      const novoStatus = tentativas >= MAX_TENTATIVAS ? "erro" : "pendente";

      if (!args.simular) {
        await db
          .update(fila_coleta)
          .set({
            status: novoStatus,
            tentativas,
            resultado: { erro: msg, modelo: args.modelo, geradoEm: new Date().toISOString() },
            atualizado_em: new Date().toISOString(),
          })
          .where(eq(fila_coleta.id, item.id));
      }
      console.error(`   ⚠️ falhou (${novoStatus}, tentativa ${tentativas}): ${msg}`);
      falhos++;
    }
  }

  console.log(`\n✅ Rodada concluída: ${concluidos} concluído(s), ${falhos} falha(s).`);
}

main().catch((e) => {
  console.error("⛔ Falha no puller:", e instanceof Error ? e.message : e);
  process.exit(1);
});
