/**
 * Avalia o RAG documental contra o gabarito de 30 perguntas.
 *
 * Mede o que o guia de RAG manda medir e hoje não medíamos: **recall@3** e
 * **latência**. Não chama modelo nenhum — só a recuperação. Assim o número
 * mede o índice, não o gerador.
 *
 * Uso: npx tsx scripts/avaliar-rag.mts
 * Saída: data/avaliacao-rag-resultado.json
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buscarDocumentos } from "../lib/assistente/documentos-rag/carregar";

interface Item {
  id: number;
  tema: string;
  pergunta: string;
  esperados: string[];
  lacuna?: boolean;
}

interface Linha {
  id: number;
  tema: string;
  pergunta: string;
  acertou: boolean;
  lacuna: boolean;
  ms: number;
  recuperados: string[];
}

function percentil(valores: number[], p: number): number {
  const v = [...valores].sort((a, b) => a - b);
  return v[Math.min(v.length - 1, Math.floor((p / 100) * v.length))] ?? 0;
}

async function main(): Promise<void> {
  const raiz = process.cwd();
  const gabarito = JSON.parse(
    await readFile(path.join(raiz, "data", "avaliacao-rag-gabarito.json"), "utf8"),
  ) as { itens: Item[] };

  const linhas: Linha[] = [];
  for (const item of gabarito.itens) {
    const inicio = performance.now();
    const resultados = await buscarDocumentos(item.pergunta, { limite: 3 }).catch(() => []);
    const ms = performance.now() - inicio;
    const recuperados = resultados.map((r) => r.trecho.docId);
    linhas.push({
      id: item.id,
      tema: item.tema,
      pergunta: item.pergunta,
      lacuna: Boolean(item.lacuna),
      acertou: item.esperados.some((e) => recuperados.includes(e)),
      ms,
      recuperados,
    });
  }

  const avaliáveis = linhas.filter((l) => !l.lacuna);
  const acertos = avaliáveis.filter((l) => l.acertou).length;
  const ms = avaliáveis.map((l) => l.ms);
  const resultado = {
    gerado_em: new Date().toISOString(),
    total: linhas.length,
    avaliaveis: avaliáveis.length,
    recall_at_3: acertos / avaliáveis.length,
    latencia_ms: { p50: percentil(ms, 50), p95: percentil(ms, 95), max: Math.max(...ms) },
    por_tema: Object.fromEntries(
      [...new Set(avaliáveis.map((l) => l.tema))].map((tema) => {
        const grupo = avaliáveis.filter((l) => l.tema === tema);
        return [tema, { n: grupo.length, acertos: grupo.filter((l) => l.acertou).length }];
      }),
    ),
    erros: linhas.filter((l) => !l.lacuna && !l.acertou),
    linhas,
  };

  await writeFile(
    path.join(raiz, "data", "avaliacao-rag-resultado.json"),
    JSON.stringify(resultado, null, 1),
    "utf8",
  );

  console.log(`recall@3: ${(resultado.recall_at_3 * 100).toFixed(1)}% (${acertos}/${avaliáveis.length})`);
  console.log(`latência: p50 ${resultado.latencia_ms.p50.toFixed(0)} ms | p95 ${resultado.latencia_ms.p95.toFixed(0)} ms`);
  for (const [tema, v] of Object.entries(resultado.por_tema)) {
    console.log(`  ${tema.padEnd(16)} ${v.acertos}/${v.n}`);
  }
  for (const erro of resultado.erros) {
    console.log(`  ERRO ${erro.id}: ${erro.pergunta.slice(0, 70)} → ${erro.recuperados.join(", ")}`);
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
