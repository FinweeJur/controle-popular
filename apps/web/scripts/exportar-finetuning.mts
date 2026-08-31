/**
 * Exporta o dataset de finetuning (formato Alpaca) a partir do acervo do
 * chatbot — o degrau L4 do PLANO-SEU-NONO-NOTEBOOKLM.md.
 *
 * ═══ O QUE ISTO GERA ═══
 *
 * 1. `etl/finetuning/dados-seu-nono.jsonl` — uma linha JSON por par
 *    pergunta → resposta, com a FONTE colada ao final da resposta
 *    ("\nFonte: <url>"). É o formato que o treino (QLoRA via unsloth/peft)
 *    consome; a cola da fonte no final é o que ensina o modelo a citar.
 * 2. `apps/web/data/assistente-acervo.json` — o MESMO acervo em JSON plano,
 *    artefato derivado para carga pgvector (Fase 5) e auditoria. Regenerar
 *    com este script; nunca editar à mão (a fonte da verdade é
 *    `lib/assistente/acervo.ts`).
 *
 * ═══ POR QUE RODA SEM BANCO E SEM REDE ═══
 *
 * O acervo é montado em código (`montarAcervoDetalhado()`), das respostas
 * pré-curadas do Seu Nonô, das sugestões contextuais e dos resumos de
 * página — nada de Postgres, nada de Ollama. Qualquer máquina com o repo
 * consegue regenerar o dataset.
 *
 * ═══ O PORTÃO (NÃO NEGOCIÁVEL, F4-modelos.md) ═══
 *
 * Dataset pronto não é modelo aprovado. Um finetune só entra como fallback
 * local (L4) se passar:
 *   - `python -m etl.benchmark` com recall de reducionista ≥ 80%,
 *     técnico ≥ 90% e zero citação inventada;
 *   - golden set de 20 perguntas do portal com URLs esperadas (a resposta
 *     precisa citar o link certo e não trazer número fora do trecho).
 * O 8B local já foi REPROVADO para produção em 22/08 — o finetune existe
 * para tentar passar, não para contornar o portão.
 *
 * Uso:
 *   cd apps/web
 *   npx tsx scripts/exportar-finetuning.mts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { montarAcervoDetalhado } from "../lib/assistente/acervo";

// `apps/web` → `apps` → raiz do repo (o `etl/` fica na raiz, não em `apps/`).
const SAIDA_JSONL = path.resolve(process.cwd(), "..", "..", "etl", "finetuning", "dados-seu-nono.jsonl");
const SAIDA_MANIFESTO = path.resolve(process.cwd(), "data", "assistente-acervo.json");

interface ExemploAlpaca {
  instrucao: string;
  frente: string;
  saida: string;
}

function montarExemplos(): ExemploAlpaca[] {
  const { fontes } = montarAcervoDetalhado();
  return fontes.map((f) => ({
    instrucao: f.titulo,
    frente: f.frente,
    // A fonte vai COLADA na resposta de treino: é o comportamento que o
    // modelo precisa reproduzir em produção (citação obrigatória).
    saida: `${f.texto}\nFonte: ${f.fonteUrl}`,
  }));
}

function main(): number {
  const { cobertura } = montarAcervoDetalhado();
  const exemplos = montarExemplos();

  mkdirSync(path.dirname(SAIDA_JSONL), { recursive: true });
  const linhas = exemplos.map((e) => JSON.stringify(e)).join("\n") + "\n";
  writeFileSync(SAIDA_JSONL, linhas, "utf-8");

  mkdirSync(path.dirname(SAIDA_MANIFESTO), { recursive: true });
  const { fontes } = montarAcervoDetalhado();
  writeFileSync(
    SAIDA_MANIFESTO,
    JSON.stringify({ geradoEm: new Date().toISOString().slice(0, 10), fontes }, null, 2) + "\n",
    "utf-8"
  );

  console.log(`[exportar-finetuning] ${cobertura.total} exemplos → ${SAIDA_JSONL}`);
  console.log(`[exportar-finetuning] ${fontes.length} pedaços → ${SAIDA_MANIFESTO}`);
  console.log(`[exportar-finetuning] cobertura por frente:`);
  for (const [frente, n] of Object.entries(cobertura.porFrente).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${frente}: ${n}`);
  }
  console.log(
    `[exportar-finetuning] puladas sem rota: ${cobertura.puladasSemRota} (fora do acervo por regra)`
  );
  return 0;
}

process.exit(main());
