/**
 * @file regerar-curadas.mts
 * @description Regera as respostas prefixadas do Seu Nono a partir do RAG atual.
 *
 * PAPEL NO PROJETO
 * ----------------
 * As respostas prefixadas de 4 eixos/subfrentes ficam em
 * `app/components/SeuNonoData.ts` (FRENTES). Elas foram escritas a mao e
 * ficaram defasadas conforme as bases cresceram. Este script passa cada
 * pergunta pelo RAG do portal e grava um DOC DE REVISAO: pergunta, resposta
 * atual, resposta nova (com marcadores [n]) e as fontes.
 *
 * REGRA EDITORIAL (nada entra no site sem revisao)
 * ------------------------------------------------
 * O dono revisa o doc antes. A resposta nova vem do acervo, com citacao — o
 * modelo so embrulha. Numero errado e dano. Nada aqui e aplicado no codigo.
 *
 * FONTE DOS DADOS
 * ---------------
 * O acervo e montado em codigo (`montarAcervoDetalhado`), das respostas
 * curadas, das paginas de dados, do blog e das bases medidas. A geracao usa o
 * provedor remoto se `AI_API_KEY_*` existir, senao o Ollama local.
 *
 * DECISAO TECNICA
 * ---------------
 * Roda local por padrao (Ollama + nomic-embed-text), sem custo e sem chave.
 * Aponte o Ollama com OLLAMA_BASE_URL; escolha o modelo de chat com
 * OLLAMA_CHAT_MODEL. Use `--limite N` para uma amostra antes da rodada cheia.
 *
 * USO
 * ---
 *   OLLAMA_BASE_URL=http://localhost:11434 OLLAMA_CHAT_MODEL=qwen2.5:7b-instruct-q4_K_M \
 *     npx tsx scripts/regerar-curadas.mts
 *   npx tsx scripts/regerar-curadas.mts --limite 3
 */

import fs from "node:fs";
import path from "node:path";

import { FRENTES } from "../app/components/SeuNonoData";
import { responderComRag } from "../lib/assistente/embeddings/rag";

const AQUI = path.resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const RAIZ_REPO = path.resolve(AQUI, "..", "..", "..");
const DATA = new Date().toISOString().slice(0, 10);
const SAIDA = path.resolve(RAIZ_REPO, "docs", "planos", `REVISAO-CURADAS-${DATA}.md`);

interface Linha {
  eixo: string;
  subfrente: string;
  id: string;
  pergunta: string;
  respostaAtual: string;
  respostaNova: string;
  fontes: { titulo: string; rota?: string }[];
  modelo: string;
  erro?: string;
}

function rotaDaPergunta(link?: { href: string }): string | undefined {
  return link?.href;
}

/**
 * Limpa a saida do modelo antes de ir para o doc.
 *
 * O modelo as vezes devolve link markdown e a propria lista "Fontes usadas".
 * Aqui o doc e de conferencia, nao de navegacao: link vira texto e a lista
 * redundante sai (as fontes reais sao as que o RAG devolveu).
 */
function limparSaida(texto: string): string {
  return texto
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^\s*Fontes usadas:.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main(): Promise<void> {
  const idx = process.argv.indexOf("--limite");
  const limite = idx >= 0 ? Number(process.argv[idx + 1]) : Infinity;

  const linhas: Linha[] = [];
  let contador = 0;

  for (const frente of FRENTES) {
    for (const categoria of frente.categorias) {
      for (const q of categoria.perguntas) {
        if (contador >= limite) break;
        contador += 1;
        process.stdout.write(`[${contador}] ${frente.id}/${categoria.id}: ${q.pergunta.slice(0, 48)}... `);
        try {
          const r = await responderComRag(q.pergunta, {
            pathname: rotaDaPergunta(q.link),
            timeoutMs: 180_000,
          });
          linhas.push({
            eixo: frente.titulo,
            subfrente: categoria.titulo,
            id: q.id,
            pergunta: q.pergunta,
            respostaAtual: q.resposta,
            respostaNova: limparSaida(r.resposta),
            fontes: r.fontes.map((f) => ({ titulo: f.titulo ?? "(sem titulo)", rota: f.rota })),
            modelo: r.modelo,
          });
          process.stdout.write(`${r.fontes.length} fonte(s)\n`);
        } catch (e) {
          const erro = e instanceof Error ? e.message : String(e);
          linhas.push({
            eixo: frente.titulo,
            subfrente: categoria.titulo,
            id: q.id,
            pergunta: q.pergunta,
            respostaAtual: q.resposta,
            respostaNova: "",
            fontes: [],
            modelo: "-",
            erro,
          });
          process.stdout.write(`ERRO: ${erro}\n`);
        }
      }
      if (contador >= limite) break;
    }
    if (contador >= limite) break;
  }

  const partes: string[] = [
    `# Revisao das respostas prefixadas do Seu Nono (${DATA})`,
    "",
    "> **Tipo:** PLANO",
    "> **Domínio:** global",
    "> **Última medição:** " + DATA,
    "> **Leitura estimada:** longa (> 15 min)",
    "> **Relacionados:** [PLANO-RAG-COMPLETO.md](PLANO-RAG-COMPLETO.md), [PLANO-COMPANHEIRO-SEU-NONO.md](PLANO-COMPANHEIRO-SEU-NONO.md), [AGENTS.md](/AGENTS.md)",
    "> **Palavras-chave:** seu nono, curadas, respostas prefixadas, rag, revisao, eixos, subfrentes",
    "",
    "## Sumário",
    "",
    "- [Propósito](#propósito)",
    "- [Como foi gerado](#como-foi-gerado)",
    "- [Entradas](#entradas)",
    "",
    "## Propósito",
    "",
    "As respostas prefixadas dos 4 eixos ficaram defasadas em relacao ao acervo",
    "atual. Este doc traz, por pergunta, a resposta ATUAL (prefixada) e a resposta",
    "NOVA, gerada pelo RAG sobre o acervo de hoje, com as fontes. Nada e aplicado",
    "no codigo sem revisao do dono — numero errado e dano.",
    "",
    "## Como foi gerado",
    "",
    "Script `apps/web/scripts/regerar-curadas.mts`, rodando o RAG local",
    "(Ollama + nomic-embed-text) sobre o acervo montado em codigo. Cada resposta",
    "nova cita `[n]`, e as fontes sao listadas por entrada.",
    "",
    "## Entradas",
    "",
  ];

  for (const l of linhas) {
    partes.push(`### ${l.eixo} — ${l.subfrente}`);
    partes.push("");
    partes.push(`**Pergunta:** ${l.pergunta}  \`(${l.id})\``);
    partes.push("");
    partes.push(`**Resposta atual:** ${l.respostaAtual}`);
    partes.push("");
    if (l.erro) {
      partes.push(`**Resposta nova:** ⚠️ falhou — ${l.erro}`);
    } else {
      partes.push(`**Resposta nova (${l.modelo}):** ${l.respostaNova}`);
      partes.push("");
      partes.push(
        l.fontes.length
          ? `**Fontes:** ${l.fontes.map((f) => `${f.titulo} (${f.rota ?? "sem rota"})`).join(" · ")}`
          : "**Fontes:** nenhuma — o RAG abstem nesta pergunta (lacuna a informar).",
      );
    }
    partes.push("");
  }

  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  fs.writeFileSync(SAIDA, partes.join("\n"), "utf-8");
  console.log(`\n[regerar-curadas] ${linhas.length} entradas → ${SAIDA}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
